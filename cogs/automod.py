import discord
from discord.ext import commands, tasks
from discord import app_commands
from services.automod_service import AutomodService
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed, WARNING_COLOR, ERROR_COLOR
from utils.permissions import has_permission
from utils.logger import log
import re
import collections
import io
import asyncio
from datetime import datetime, timedelta

def normalize_content(text: str) -> str:
    """De-obfuscates text to defeat bypasses like f/u/c/k, f.u.c.k, f-u-c-k, f u c k, and leetspeak."""
    t = text.lower()
    leetspeak = {
        '@': 'a', '4': 'a',
        '$': 's', '5': 's',
        '0': 'o',
        '1': 'i', '!': 'i', '|': 'i',
        '3': 'e',
        '7': 't', '+': 't',
        '8': 'b',
    }
    for char, rep in leetspeak.items():
        t = t.replace(char, rep)
    # Collapse single-letter spaced tokens (e.g. "f u c k" -> "fuck")
    t = re.sub(r'(?<=\b[a-z0-9])\s+(?=[a-z0-9]\b)', '', t)
    # Collapse separators/punctuation between alphanumeric characters (e.g. "f/u/c/k" -> "fuck")
    t = re.sub(r'([a-z0-9])[\s/\\._\-*~`!@#$%^&=+]+(?=[a-z0-9])', r'\1', t)
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

class Automod(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.message_cache = {} # {user_id: [ (msg_content, timestamp), ... ]}
        self.mention_history = {} # {user_id: [ (target_id, timestamp), ... ]}
        self.user_history = collections.defaultdict(lambda: collections.deque(maxlen=30))
        
        # Start background tasks
        self.timed_jail_loop.start()

    def cog_unload(self):
        self.timed_jail_loop.cancel()

    @tasks.loop(minutes=1)
    async def timed_jail_loop(self):
        try:
            await AutomodService.check_timed_jails(self.bot)
        except Exception as e:
            log.error(f"Timed jail loop failed: {e}")

    @timed_jail_loop.before_loop
    async def before_timed_jail(self):
        await self.bot.wait_until_ready()

    async def check_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        
        self.user_history[message.author.id].append(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] #{message.channel.name}: {message.content}")

        settings = await SettingsService.get_guild_settings(message.guild.id)
        if not settings.get('automod_enabled'):
            return

        content = message.content
        content_lower = content.lower()
        content_norm = normalize_content(content)

        # -------------------------------------------------------------
        # 1. UNIVERSAL FILTER: Bad Words & DB Blacklist
        # Runs for EVERYONE (including server owner and staff)
        # -------------------------------------------------------------
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

            # Server Owner exemption: strictly delete the message without any warnings, strikes, timeouts, or jail
            if message.author.id == message.guild.owner_id:
                return

            await AutomodService.add_violation(
                self.bot, message.guild, message.author, 
                f"Inappropriate language / Bad words: {bad_word_hit}", 
                "Content Filter", 
                message=message
            )
            return

        from database import db
        blacklisted = await db.fetch("SELECT pattern, match_type FROM automod_blacklist WHERE guild_id = $1", message.guild.id)
        for row in blacklisted:
            pattern = row['pattern']
            match_type = row['match_type']
            
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

                # Server Owner exemption: strictly delete the message without any warnings, strikes, timeouts, or jail
                if message.author.id == message.guild.owner_id:
                    return

                await AutomodService.add_violation(
                    self.bot, message.guild, message.author, 
                    f"Triggered blacklist filter: {pattern}", 
                    "Content Filter", 
                    message=message
                )
                return

        # -------------------------------------------------------------
        # 2. STAFF BYPASS: For general spam, invites, caps
        # (Bad words and blacklist are already enforced above)
        # -------------------------------------------------------------
        if message.author.guild_permissions.manage_messages:
            return

        now = datetime.utcnow()

        # -------------------------------------------------------------
        # 3. MENTION HARASSMENT & CONTINUOUS MENTIONS
        # Checked BEFORE general spam/duplicate detection so repeated pings
        # receive the single-sentence warning embed instead of duplicate spam
        # -------------------------------------------------------------
        if message.mentions or message.mention_everyone:
            mention_records = self.mention_history.setdefault(message.author.id, [])
            
            # Prune records older than 20 seconds
            self.mention_history[message.author.id] = [
                m for m in mention_records if now - m[1] < timedelta(seconds=20)
            ]
            
            # Add current mentions to history
            for m in message.mentions:
                self.mention_history[message.author.id].append((m.id, now))
                
            recent_mentions = self.mention_history[message.author.id]
            
            # Check A: Repeatedly mentioning the SAME member across messages (Harassment/Ghost-ping)
            target_counts = collections.Counter(t_id for t_id, _ in recent_mentions)
            is_continuous_mention = any(count >= 3 for count in target_counts.values())

            # Check B: Continuous mass mentions across messages within 20s or single mass mention
            mention_threshold = settings.get('mention_threshold', 5)
            is_mass_mention = len(recent_mentions) >= mention_threshold or message.mention_everyone or len(message.mentions) >= mention_threshold

            if is_continuous_mention or is_mass_mention:
                self.mention_history[message.author.id] = [] # Reset
                try:
                    await message.delete()
                except (discord.NotFound, discord.Forbidden):
                    pass

                warn_embed = SyncInkEmbed(
                    description=f"<a:syncwarning:1520914584012328961> **{message.author.mention}, please do not continuously mention other members to avoid disturbing them.**",
                    color=WARNING_COLOR
                )
                try:
                    await message.channel.send(content=message.author.mention, embed=warn_embed, delete_after=15)
                except discord.Forbidden:
                    pass

                reason = "Continuously mentioning other members" if is_continuous_mention else "Continuous mass mentions"
                await AutomodService.add_violation(
                    self.bot, message.guild, message.author, 
                    reason, 
                    "Mention Harassment", 
                    message=None
                )
                return

        # -------------------------------------------------------------
        # 4. SPAM DETECTION (Rapid messaging & Duplicates)
        # -------------------------------------------------------------
        user_cache = self.message_cache.setdefault(message.author.id, [])
        user_cache.append((content, now))
        
        # Prune cache > 10 seconds old
        self.message_cache[message.author.id] = [m for m in user_cache if now - m[1] < timedelta(seconds=10)]
        recent_msgs = self.message_cache[message.author.id]
        
        spam_threshold = settings.get('spam_threshold', 5)
        is_spam = len(recent_msgs) >= spam_threshold
        duplicates = [m for m in recent_msgs if m[0] == content]
        is_duplicate = len(duplicates) >= 3

        if is_spam or is_duplicate:
            self.message_cache[message.author.id] = [] # Reset cache
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
                    description=f"<a:syncalert:1520914681231839313> {message.author.mention} **Timed out for 2 hours for continuous spamming.**",
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
                    jump_url=message.jump_url
                )
                return

            # Standard channels (e.g. #general): Progressive 24h strike escalation (warn, 2m, 10m, 30m, 90m, jail)
            spam_reason = "Duplicate message spam" if is_duplicate else "Message spam (Rapid messaging)"
            await AutomodService.add_violation(self.bot, message.guild, message.author, spam_reason, "Spam Filter", message=message)
            return

        # -------------------------------------------------------------
        # 5. DISCORD INVITES
        # -------------------------------------------------------------
        if re.search(r'(discord\.gg/|discordapp\.com/invite/)', content, re.IGNORECASE):
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass
            await AutomodService.add_violation(self.bot, message.guild, message.author, "Posted unauthorized Discord invite", "Link Filter", message=message)
            return

        # -------------------------------------------------------------
        # 6. CAPS SPAM
        # -------------------------------------------------------------
        if len(content) > 15:
            upper_count = sum(1 for c in content if c.isupper())
            if upper_count / len(content) > 0.7:
                try:
                    await message.delete()
                except (discord.NotFound, discord.Forbidden):
                    pass

        # -------------------------------------------------------------
        # 7. ONE-CHARACTER MESSAGE BLOCK
        # -------------------------------------------------------------
        if len(content.strip()) == 1:
            try:
                await message.delete()
            except (discord.NotFound, discord.Forbidden):
                pass
            return


    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        await self.check_message(message)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.content != after.content:
            await self.check_message(after)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        settings = await SettingsService.get_guild_settings(member.guild.id)
        if not settings.get('automod_enabled'):
            return

        # Jail Evasion Protection
        from database import db
        active_jail = await db.fetchrow("SELECT id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)", member.guild.id, member.id)
        if active_jail:
            jail_role_id = settings.get('jail_role_id')
            if jail_role_id:
                jail_role = member.guild.get_role(jail_role_id)
                if jail_role:
                    try:
                        await member.add_roles(jail_role, reason="Jail Evasion Protection: Re-applied jail role on join.")
                    except discord.Forbidden:
                        pass
            return # Skip further join logic

        if not settings.get('emergency_mode'):
            return

        # Anti-Raid Emergency Mode Action
        age_days = (datetime.utcnow() - member.created_at.replace(tzinfo=None)).days
        if age_days < 7:
            await member.kick(reason="Anti-Raid Emergency Mode: Account too new.")
            log.warning(f"Kicked {member.id} via Anti-Raid Mode.")

    @commands.command(name="jail", description="Manually jail a user, restricting their server access.")
    @commands.has_permissions(moderate_members=True)
    async def jail(self, ctx: commands.Context, member: discord.Member, *args):
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
            await ctx.send(embed=SuccessEmbed(f"Successfully jailed {member.mention}."))
        except Exception as e:
            from utils.ui import ErrorEmbed
            await ctx.send(embed=ErrorEmbed(description="Failed to jail member.", resolution=str(e)))

    @commands.command(name="unjail", description="Release a user from jail and restore their roles.")
    @commands.has_permissions(moderate_members=True)
    async def unjail(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        try:
            await AutomodService.unjail_user(ctx.guild, member, ctx.author, reason)
            from utils.ui import SuccessEmbed
            await ctx.send(embed=SuccessEmbed(f"Successfully unjailed {member.mention}."))
        except Exception as e:
            from utils.ui import ErrorEmbed
            await ctx.send(embed=ErrorEmbed(description="Failed to unjail member.", resolution=str(e)))

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
