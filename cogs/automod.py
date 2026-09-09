import discord
from discord.ext import commands, tasks
from discord import app_commands
from services.automod_service import AutomodService
from services.settings_service import SettingsService
from services.security_service import SecurityService
from services.risk_service import RiskEngine
from utils.ui import SyncInkEmbed, WARNING_COLOR, ERROR_COLOR
from utils.emojis import Emojis
from utils.permissions import has_permission
from utils.logger import log
import re
import collections
import io
import asyncio
import unicodedata
import difflib
from datetime import datetime, timedelta

def normalize_content(text: str) -> str:
    """
    De-obfuscates text to defeat bypasses:
    - Zero-width & invisible characters
    - Combining diacritical marks (zalgo)
    - Unicode homoglyphs (Cyrillic/Greek lookalikes to Latin)
    - Leetspeak translation
    - Spacing tricks (e.g. "f u c k")
    - Punctuation / symbol splitting (e.g. "f.u.c.k", "f/u/c/k", "f-u-c-k")
    - Repeated character collapsing (e.g. "fuuuuck" -> "fuck")
    """
    t = text.lower()

    # 1. Remove zero-width characters
    for zw in ['\u200b', '\u200c', '\u200d', '\ufeff', '\u200e', '\u200f']:
        t = t.replace(zw, '')

    # 2. Strip combining diacritical marks (zalgo)
    t = re.sub(r'[\u0300-\u036f]', '', unicodedata.normalize('NFD', t))

    # 3. Normalize NFKD
    t = unicodedata.normalize('NFKD', t)

    # 4. Homoglyphs: map Cyrillic & Greek lookalikes to Latin
    homoglyphs = {
        'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
        'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w', 'һ': 'h',
        'ν': 'v', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x'
    }
    for k, v in homoglyphs.items():
        t = t.replace(k, v)

    # 5. Leetspeak mapping
    leetspeak = {
        '@': 'a', '4': 'a',
        '$': 's', '5': 's',
        '0': 'o',
        '1': 'i', '!': 'i', '|': 'i',
        '3': 'e',
        '7': 't', '+': 't',
        '8': 'b',
        'v': 'u',
    }
    for char, rep in leetspeak.items():
        t = t.replace(char, rep)

    # 6. Collapse single-letter spaced tokens (e.g. "f u c k" -> "fuck")
    t = re.sub(r'(?<=\b[a-z0-9])\s+(?=[a-z0-9]\b)', '', t)

    # 7. Collapse separators/punctuation between alphanumeric characters (e.g. "f/u/c/k" -> "fuck")
    t = re.sub(r'([a-z0-9])[\s/\\._\-*~`!@#$%^&=+]+(?=[a-z0-9])', r'\1', t)

    # 8. Collapse 3+ repeating characters (e.g. "fuuuuck" -> "fuck")
    t = re.sub(r'(.)\1{2,}', r'\1', t)

    return t

def is_ticket_channel(channel) -> bool:
    """Checks if a channel or thread is an appeal or ticket channel."""
    name = getattr(channel, 'name', '').lower()
    if any(k in name for k in ['ticket', 'appeal', 'unjail']):
        return True

    if isinstance(channel, discord.Thread):
        parent = channel.parent
        if parent:
            p_name = parent.name.lower()
            if any(k in p_name for k in ['ticket', 'appeal', 'unjail']):
                return True
            p_cat = getattr(parent, 'category', None)
            if p_cat and any(k in p_cat.name.lower() for k in ['ticket', 'appeal', 'unjail', 'jail']):
                return True

    category = getattr(channel, 'category', None)
    if category and any(k in category.name.lower() for k in ['ticket', 'appeal', 'unjail', 'jail']):
        return True

    return False

def count_emojis(text: str) -> int:
    """Counts custom and unicode emojis in text."""
    custom_emojis = len(re.findall(r'<a?:[a-zA-Z0-9_]+:[0-9]+>', text))
    # Unicode emoji patterns (surrogates & symbols)
    unicode_emojis = len(re.findall(r'[\U00010000-\U0010ffff]', text))
    return custom_emojis + unicode_emojis

class Automod(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        # {user_id: deque([(content, timestamp, channel_id), ...])}
        self.message_cache = collections.defaultdict(lambda: collections.deque(maxlen=25))
        # {user_id: [(target_id, timestamp), ...]}
        self.mention_history = collections.defaultdict(list)
        # {user_id: deque([log_str, ...], maxlen=30)}
        self.user_history = collections.defaultdict(lambda: collections.deque(maxlen=30))
        # Ghost ping cache: {message_id: (author, channel, [mentions], created_at, content)}
        self.recent_mentions = {}

        # Start background tasks
        self.timed_jail_loop.start()
        self.cache_prune_loop.start()

    def cog_unload(self):
        self.timed_jail_loop.cancel()
        self.cache_prune_loop.cancel()

    @tasks.loop(minutes=1)
    async def timed_jail_loop(self):
        try:
            await AutomodService.check_timed_jails(self.bot)
        except Exception as e:
            log.error(f"Timed jail loop failed: {e}")

    @timed_jail_loop.before_loop
    async def before_timed_jail(self):
        await self.bot.wait_until_ready()

    @tasks.loop(minutes=2)
    async def cache_prune_loop(self):
        """Prunes stale message and ghost-ping caches."""
        now = datetime.utcnow()
        # Prune ghost-ping cache older than 45 seconds
        stale_msg_ids = [
            mid for mid, data in self.recent_mentions.items() 
            if (now - data['created_at']).total_seconds() > 45
        ]
        for mid in stale_msg_ids:
            self.recent_mentions.pop(mid, None)

    async def check_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        self.user_history[message.author.id].append(
            f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] #{message.channel.name}: {message.content}"
        )

        settings = await SettingsService.get_guild_settings(message.guild.id)
        if not settings.get('automod_enabled'):
            return

        # -------------------------------------------------------------
        # Server Owner and Administrators: Strictly exempt from automod deletion
        # -------------------------------------------------------------
        if message.author.id == message.guild.owner_id or getattr(message.author.guild_permissions, 'administrator', False):
            return

        # -------------------------------------------------------------
        # Whitelist exemptions for User, Channel, or Roles
        # -------------------------------------------------------------
        if await SecurityService.is_whitelisted(message.guild.id, "channel", str(message.channel.id)):
            return
        if await SecurityService.is_whitelisted(message.guild.id, "user", str(message.author.id)):
            return
        for r in message.author.roles:
            if await SecurityService.is_whitelisted(message.guild.id, "role", str(r.id)):
                return

        content = message.content
        content_lower = content.lower()
        content_norm = normalize_content(content)

        # -------------------------------------------------------------
        # 1. UNIVERSAL FILTER: Bad Words & DB Blacklist
        # Runs for EVERYONE (including server owner and staff).
        # Server owner is exempt from disciplinary actions, but message is deleted.
        # -------------------------------------------------------------
        if settings.get('content_filter_enabled', True):
            from utils.bad_words import BAD_WORDS
            bad_word_hit = None
            for bad_word in BAD_WORDS:
                pattern = r'\b' + re.escape(bad_word) + r'\b'
                if re.search(pattern, content_lower) or re.search(pattern, content_norm):
                    bad_word_hit = bad_word
                    break

            if bad_word_hit:
                try:
                    await message.delete()
                except (discord.NotFound, discord.Forbidden):
                    pass

                # Server Owner exemption: delete message without warning/timeout/jail
                if message.author.id == message.guild.owner_id:
                    return

                await AutomodService.add_violation(
                    self.bot, message.guild, message.author, 
                    f"Inappropriate language / Bad words: {bad_word_hit}", 
                    "Content Filter", 
                    message=message,
                    severity="MEDIUM"
                )
                return

            from database import db
            blacklisted = await db.fetch("SELECT pattern, match_type, severity FROM automod_blacklist WHERE guild_id = $1", message.guild.id)
            for row in blacklisted:
                pattern = row['pattern']
                match_type = row['match_type']
                severity = row.get('severity') or "MEDIUM"
                
                matched = False
                p_lower = pattern.lower()
                p_norm = normalize_content(pattern)

                if match_type == 'exact' and (p_lower == content_lower or p_norm == content_norm):
                    matched = True
                elif match_type == 'contains' and (p_lower in content_lower or p_norm in content_norm):
                    matched = True
                elif match_type == 'regex':
                    try:
                        if re.search(pattern, content, re.IGNORECASE) or re.search(pattern, content_norm, re.IGNORECASE):
                            matched = True
                    except:
                        pass
                
                if matched:
                    try:
                        await message.delete()
                    except (discord.NotFound, discord.Forbidden):
                        pass

                    if message.author.id == message.guild.owner_id:
                        return

                    await AutomodService.add_violation(
                        self.bot, message.guild, message.author, 
                        f"Triggered blacklist filter: {pattern}", 
                        "Content Filter", 
                        message=message,
                        severity=severity
                    )
                    return

        # -------------------------------------------------------------
        # 2. PHISHING & SUSPICIOUS LINK DETECTION
        # -------------------------------------------------------------
        if settings.get('anti_phishing_enabled', True):
            is_threat, threat_type, details, link_sev = await SecurityService.analyze_message_links(
                message.guild, message.author, content
            )
            if is_threat:
                try:
                    await message.delete()
                except (discord.NotFound, discord.Forbidden):
                    pass

                if message.author.id == message.guild.owner_id:
                    return

                await AutomodService.add_violation(
                    self.bot, message.guild, message.author,
                    details, threat_type, message=message, severity=link_sev
                )
                return

        # -------------------------------------------------------------
        # 3. STAFF BYPASS: For general spam, mentions, and caps
        # -------------------------------------------------------------
        if message.author.guild_permissions.manage_messages:
            return

        now = datetime.utcnow()

        # -------------------------------------------------------------
        # 4. MENTION HARASSMENT & GHOST-PING CACHE
        # -------------------------------------------------------------
        if settings.get('mention_guard_enabled', True):
            if message.mentions or message.mention_everyone:
                # Record in ghost-ping tracker
                self.recent_mentions[message.id] = {
                    'author': message.author,
                    'channel': message.channel,
                    'mentions': [m.id for m in message.mentions],
                    'has_everyone': message.mention_everyone,
                    'created_at': now,
                    'content': content
                }

                mention_records = self.mention_history[message.author.id]
                # Prune records older than 20 seconds
                self.mention_history[message.author.id] = [
                    m for m in mention_records if now - m[1] < timedelta(seconds=20)
                ]
                
                for m in message.mentions:
                    self.mention_history[message.author.id].append((m.id, now))
                    
                recent_mentions = self.mention_history[message.author.id]
                
                # Check A: Repeatedly mentioning the SAME member across messages
                target_counts = collections.Counter(t_id for t_id, _ in recent_mentions)
                is_continuous_mention = any(count >= 3 for count in target_counts.values())

                # Check B: Mass mentions in single message or burst across 20s
                mention_threshold = settings.get('mention_threshold', 5)
                is_mass_mention = len(recent_mentions) >= mention_threshold or message.mention_everyone or len(message.mentions) >= mention_threshold

                if is_continuous_mention or is_mass_mention:
                    self.mention_history[message.author.id] = [] # Reset
                    try:
                        await message.delete()
                    except (discord.NotFound, discord.Forbidden):
                        pass

                    warn_embed = SyncInkEmbed(
                        description=f"{Emojis.WARNING} **{message.author.mention}, please do not continuously mention other members to avoid disturbing them.**",
                        color=WARNING_COLOR
                    )
                    try:
                        await message.channel.send(content=message.author.mention, embed=warn_embed, delete_after=15)
                    except discord.Forbidden:
                        pass

                    reason = "Continuously mentioning other members" if is_continuous_mention else "Continuous mass mentions"
                    await AutomodService.add_violation(
                        self.bot, message.guild, message.author, 
                        reason, "Mention Harassment", message=None, severity="MEDIUM"
                    )
                    return

        # -------------------------------------------------------------
        # 5. ADVANCED SPAM DETECTION (Burst, Duplicates, Cross-Channel, Emojis)
        # -------------------------------------------------------------
        user_cache = self.message_cache[message.author.id]
        user_cache.append((content, now, message.channel.id))
        
        # Prune cache > 10 seconds old
        valid_msgs = [m for m in user_cache if now - m[1] < timedelta(seconds=10)]
        self.message_cache[message.author.id] = collections.deque(valid_msgs, maxlen=25)
        recent_msgs = list(self.message_cache[message.author.id])

        spam_threshold = settings.get('spam_threshold', 5)
        
        # A. Fast burst spam (> spam_threshold messages in 10s or 4 messages in 3s)
        fast_burst = len([m for m in recent_msgs if now - m[1] < timedelta(seconds=3)]) >= 4
        is_spam = len(recent_msgs) >= spam_threshold or fast_burst

        # B. Identical duplicate spam (3+ identical messages in 10s)
        duplicates = [m for m in recent_msgs if m[0] == content]
        is_duplicate = len(duplicates) >= 3

        # C. Near-identical text spam (similarity ratio >= 82%)
        is_near_duplicate = False
        if len(recent_msgs) >= 3 and len(content) > 10:
            similar_count = 0
            for prev_content, _, _ in recent_msgs[-4:-1]:
                sim = difflib.SequenceMatcher(None, content_norm, normalize_content(prev_content)).ratio()
                if sim >= 0.82:
                    similar_count += 1
            if similar_count >= 2:
                is_near_duplicate = True

        # D. Cross-channel flood (messaging in 3+ distinct channels within 5s)
        recent_5s = [m for m in recent_msgs if now - m[1] < timedelta(seconds=5)]
        distinct_channels = len(set(m[2] for m in recent_5s))
        is_cross_channel = distinct_channels >= 3

        if is_spam or is_duplicate or is_near_duplicate or is_cross_channel:
            self.message_cache[message.author.id].clear() # Reset cache
            RiskEngine.record_burst(message.author.id)
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass

            # STRICT TICKET ABUSE CHECK: ONLY if user is currently jailed AND channel is an appeal/ticket channel/thread
            if is_ticket_channel(message.channel) and await AutomodService.is_user_jailed(message.guild, message.author):
                try:
                    await message.author.timeout(
                        timedelta(hours=2), 
                        reason="Non-stop spamming while jailed / Ticket appeal abuse"
                    )
                    from utils.ui import send_mute_dm
                    await send_mute_dm(message.author, "Continuous spamming in ticket", message.guild.name)
                except discord.Forbidden:
                    pass

                abuse_embed = SyncInkEmbed(
                    description=f"{Emojis.ALERT} {message.author.mention} **Timed out for 2 hours for continuous spamming.**",
                    color=ERROR_COLOR
                )
                try:
                    await message.channel.send(content=message.author.mention, embed=abuse_embed, delete_after=12)
                except discord.Forbidden:
                    pass

                await AutomodService._dispatch_log(
                    self.bot, message.guild, message.author, 
                    "Timed Out 2h (Jailed Ticket Spam)", 
                    "Spam Abuse Filter", 
                    "Non-stop spamming in ticket while jailed", 
                    strike_count=6, 
                    case_id=None, 
                    message_content=message.content, 
                    jump_url=message.jump_url,
                    severity="HIGH"
                )
                return

            if is_cross_channel:
                spam_reason = "Cross-channel message flooding"
            elif is_duplicate or is_near_duplicate:
                spam_reason = "Duplicate / Repeated message spam"
            else:
                spam_reason = "Message spam (Rapid messaging)"

            await AutomodService.add_violation(
                self.bot, message.guild, message.author, 
                spam_reason, "Spam Filter", message=message, severity="MEDIUM"
            )
            return

        # -------------------------------------------------------------
        # 6. EMOJI SPAM DETECTION
        # -------------------------------------------------------------
        if count_emojis(content) >= 8:
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass
            await AutomodService.add_violation(
                self.bot, message.guild, message.author,
                "Excessive emoji spam (> 7 emojis)", "Emoji Spam Filter", message=message, severity="LOW"
            )
            return

        # -------------------------------------------------------------
        # 7. CHARACTER SPAM / REPETITION
        # -------------------------------------------------------------
        if re.search(r'(.)\1{12,}', content):
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass
            await AutomodService.add_violation(
                self.bot, message.guild, message.author,
                "Excessive character repetition", "Character Spam Filter", message=message, severity="LOW"
            )
            return

        # -------------------------------------------------------------
        # 8. CAPS SPAM
        # -------------------------------------------------------------
        if len(content) > 15:
            upper_count = sum(1 for c in content if c.isupper())
            if upper_count / len(content) > 0.75:
                try:
                    await message.delete()
                except (discord.NotFound, discord.Forbidden):
                    pass
                return

        # -------------------------------------------------------------
        # 9. EXCESSIVE NEWLINES / ONE-CHAR SPAM
        # -------------------------------------------------------------
        if content.count('\n') >= 7:
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass
            return

        if len(content.strip()) == 1:
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass
            return

    # -------------------------------------------------------------
    # EVENT LISTENERS
    # -------------------------------------------------------------

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        await self.check_message(message)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.content != after.content:
            await self.check_message(after)

            # Ghost-Ping Edit Detection
            if before.guild and not before.author.bot:
                settings = await SettingsService.get_guild_settings(before.guild.id)
                if settings.get('ghost_ping_detection_enabled', True):
                    before_mentions = set(m.id for m in before.mentions)
                    after_mentions = set(m.id for m in after.mentions)
                    removed_mentions = before_mentions - after_mentions
                    if removed_mentions:
                        # Mention was removed in edit
                        log_chan_id = settings.get("log_channel_moderation") or settings.get("automod_log_channel_id")
                        if log_chan_id:
                            ch = before.guild.get_channel(log_chan_id)
                            if ch:
                                embed = SyncInkEmbed(
                                    title=f"{Emojis.ALERT} Ghost-Ping Edit Detected",
                                    color=WARNING_COLOR
                                )
                                embed.set_author(name=f"{before.author} ({before.author.id})", icon_url=before.author.display_avatar.url)
                                embed.add_field(name="Channel", value=before.channel.mention, inline=True)
                                embed.add_field(name="Removed Mentions", value=", ".join(f"<@{uid}>" for uid in removed_mentions), inline=True)
                                embed.add_field(name="Original Content", value=f"```\n{before.content[:500]}\n```", inline=False)
                                embed.add_field(name="Edited Content", value=f"```\n{after.content[:500]}\n```", inline=False)
                                try:
                                    await ch.send(embed=embed)
                                except Exception:
                                    pass

    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        """Detects ghost-pings where a message with mentions is rapidly deleted."""
        if not message.guild or message.author.bot:
            return

        entry = self.recent_mentions.pop(message.id, None)
        if not entry:
            return

        settings = await SettingsService.get_guild_settings(message.guild.id)
        if not settings.get('ghost_ping_detection_enabled', True):
            return

        # Check if deleted within 30 seconds
        if (datetime.utcnow() - entry['created_at']).total_seconds() <= 30 and (entry['mentions'] or entry['has_everyone']):
            log_chan_id = settings.get("log_channel_moderation") or settings.get("automod_log_channel_id")
            if log_chan_id:
                ch = message.guild.get_channel(log_chan_id)
                if ch:
                    embed = SyncInkEmbed(
                        title=f"{Emojis.ALERT} Ghost-Ping Deletion Detected",
                        color=WARNING_COLOR
                    )
                    embed.set_author(name=f"{message.author} ({message.author.id})", icon_url=message.author.display_avatar.url)
                    embed.add_field(name="Channel", value=message.channel.mention, inline=True)
                    if entry['has_everyone']:
                        embed.add_field(name="Target", value="`@everyone` / `@here`", inline=True)
                    else:
                        embed.add_field(name="Mentioned Users", value=", ".join(f"<@{uid}>" for uid in entry['mentions']), inline=True)
                    embed.add_field(name="Deleted Content", value=f"```\n{entry['content'][:800]}\n```", inline=False)
                    try:
                        await ch.send(embed=embed)
                    except Exception:
                        pass

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        settings = await SettingsService.get_guild_settings(member.guild.id)
        if not settings.get('automod_enabled'):
            return

        # Jail / Quarantine Evasion Protection
        from database import db
        active_jail = await db.fetchrow(
            "SELECT id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)", 
            member.guild.id, member.id
        )
        if active_jail:
            jail_role_id = settings.get('quarantine_role_id') or settings.get('jail_role_id')
            if jail_role_id:
                jail_role = member.guild.get_role(int(jail_role_id))
                if jail_role:
                    try:
                        await member.add_roles(jail_role, reason="Jail Evasion Protection: Re-applied quarantine/jail role on join.")
                    except discord.Forbidden:
                        pass
            return

    # -------------------------------------------------------------
    # COMMANDS
    # -------------------------------------------------------------

    @commands.command(name="jail", description="Manually jail/quarantine a user, restricting their server access.")
    @commands.has_permissions(moderate_members=True)
    async def jail(self, ctx: commands.Context, member: discord.Member, *args):
        from utils.permissions import require_staff_channel
        if not await require_staff_channel(ctx):
            return

        # Role hierarchy check
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            from utils.ui import ErrorEmbed
            await ctx.send(embed=ErrorEmbed("Cannot moderate a member with equal or higher role hierarchy."))
            return

        duration_mins = None
        reason = "No reason provided"
        if args:
            if args[0].isdigit():
                duration_mins = int(args[0])
                if len(args) > 1:
                    reason = " ".join(args[1:])
            else:
                reason = " ".join(args)

        try:
            await AutomodService.jail_user(ctx.guild, member, ctx.author, reason, duration_mins)
            from utils.ui import SuccessEmbed
            await ctx.send(embed=SuccessEmbed(f"Successfully quarantined {member.mention}."))
        except Exception as e:
            from utils.ui import ErrorEmbed
            await ctx.send(embed=ErrorEmbed(description="Failed to quarantine member.", resolution=str(e)))

    @commands.command(name="unjail", description="Release a user from quarantine/jail and restore their roles.")
    @commands.has_permissions(moderate_members=True)
    async def unjail(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        from utils.permissions import require_staff_channel
        if not await require_staff_channel(ctx):
            return

        try:
            await AutomodService.unjail_user(ctx.guild, member, ctx.author, reason)
            from utils.ui import SuccessEmbed
            await ctx.send(embed=SuccessEmbed(f"Successfully released {member.mention} from quarantine."))
        except Exception as e:
            from utils.ui import ErrorEmbed
            await ctx.send(embed=ErrorEmbed(description="Failed to release member.", resolution=str(e)))

    @commands.command(name="history", description="Get a text file of a user's last 30 messages.")
    @commands.has_permissions(moderate_members=True)
    async def history(self, ctx: commands.Context, member: discord.Member):
        msgs = self.user_history.get(member.id, [])
        if not msgs:
            await ctx.send("No recent messages found for this user in memory.")
            return
            
        content = "\n".join(msgs)
        file = discord.File(io.BytesIO(content.encode('utf-8')), filename=f"{member.name}_history.txt")
        await ctx.send(f"Recent message history for {member.mention}:", file=file)

async def setup(bot: commands.Bot):
    await bot.add_cog(Automod(bot))
