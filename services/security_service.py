import discord
import re
import unicodedata
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict, Set, Any
from collections import defaultdict, deque
import urllib.parse

from database import db
from services.settings_service import SettingsService
from services.cache_service import CacheService
from utils.logger import log
from utils.ui import SyncInkEmbed, WARNING_COLOR, ERROR_COLOR, SUCCESS_COLOR

# Global Known Phishing Keywords & Patterns
PHISHING_PATTERNS = [
    r"discord[-_.]?gift",
    r"dlscord",
    r"discorcl",
    r"d1scord",
    r"disc0rd",
    r"nitro[-_.]?free",
    r"free[-_.]?nitro",
    r"steamcommunity[-_.]?trade",
    r"steamcommunity[-_.]?login",
    r"steamcommunity[-_.]?gift",
    r"steampowered[-_.]?gift",
    r"airdrop[-_.]?crypto",
    r"gift[-_.]?nitro",
    r"boost[-_.]?nitro",
    r"discord[-_.]?nitro",
    r"discordapp[-_.]?gift",
    r"discord[-_.]?airdrop",
    r"roblox[-_.]?robux[-_.]?free",
]

# Global Trusted Domains that are always allowed
GLOBAL_TRUSTED_DOMAINS = {
    "discord.com",
    "discord.gg",
    "discordapp.com",
    "discord.media",
    "discord.gift",       # Official gift link, handled carefully
    "syncink.com",
    "github.com",
    "google.com",
    "youtube.com",
    "youtu.be",
    "tenor.com",
    "giphy.com",
    "twitter.com",
    "x.com",
    "reddit.com",
    "twitch.tv",
    "spotify.com",
    "apple.com",
    "steamcommunity.com",
    "steampowered.com",
}

class SecurityService:
    """
    Central security coordinator inspired by Wick:
    - Anti-Raid tracking & progressive states (NORMAL, WATCH, ALERT, LOCKDOWN)
    - Anti-Nuke audit log activity tracking & rogue admin containment
    - Phishing & lookalike domain detection with homoglyph normalization
    - Discord invite analyzer (internal vs external)
    - Whitelist management with caching
    - Incident forensic logging
    """

    # In-memory sliding windows:
    # {guild_id: deque([(timestamp, user_id), ...])}
    _recent_joins: Dict[int, deque] = defaultdict(lambda: deque(maxlen=100))
    _last_raid_state_change: Dict[int, float] = {}

    # Anti-Nuke tracking: {guild_id: {user_id: deque([timestamp, ...])}}
    _nuke_tracker: Dict[int, Dict[int, deque]] = defaultdict(lambda: defaultdict(lambda: deque(maxlen=20)))

    # Guild Invites Cache: {guild_id: set(invite_codes)}
    _guild_invites_cache: Dict[int, Set[str]] = {}
    _invites_cache_expiry: Dict[int, float] = {}

    # Whitelist Cache: {guild_id: {entity_type: set(values)}}
    _whitelist_cache: Dict[int, Dict[str, Set[str]]] = {}

    # -------------------------------------------------------------
    # 1. ANTI-RAID & PROGRESSIVE STATE ENGINE
    # -------------------------------------------------------------

    @classmethod
    async def get_raid_state(cls, guild_id: int) -> str:
        """Fetches the current raid state, applying auto-recovery decay if idle."""
        settings = await SettingsService.get_guild_settings(guild_id)
        current_state = settings.get("anti_raid_state", "NORMAL")

        # Auto-recovery: If in ALERT or WATCH and no join bursts for 5 mins, decay to NORMAL
        last_change = cls._last_raid_state_change.get(guild_id, 0)
        now = datetime.utcnow().timestamp()

        if current_state in ("WATCH", "ALERT") and (now - last_change > 300):
            # Check recent joins in last 60s
            recent = cls._recent_joins[guild_id]
            recent_in_60s = [j for j in recent if now - j[0] < 60]
            if len(recent_in_60s) < 3:
                await cls.set_raid_state(guild_id, "NORMAL")
                return "NORMAL"

        return current_state

    @classmethod
    async def set_raid_state(cls, guild_id: int, new_state: str) -> None:
        """Updates the raid state in DB and marks timestamp."""
        await SettingsService.update_setting(guild_id, "anti_raid_state", new_state)
        cls._last_raid_state_change[guild_id] = datetime.utcnow().timestamp()
        log.info(f"[Anti-Raid] Guild {guild_id} raid state changed to: {new_state}")

    @classmethod
    async def record_member_join(cls, guild: discord.Guild, member: discord.Member) -> Tuple[bool, str, Optional[str]]:
        """
        Records a member join, evaluates join velocity and risk.
        Returns: (is_burst: bool, current_state: str, action_taken: Optional[str])
        """
        now = datetime.utcnow().timestamp()
        window = cls._recent_joins[guild.id]
        window.append((now, member.id))

        settings = await SettingsService.get_guild_settings(guild.id)
        if not settings.get("anti_raid_enabled", True):
            return False, "NORMAL", None

        threshold = settings.get("anti_raid_threshold", 5)
        window_secs = settings.get("anti_raid_window_seconds", 10)

        # Count joins in the window
        recent_joins = [j for j in window if now - j[0] <= window_secs]
        join_count = len(recent_joins)

        current_state = await cls.get_raid_state(guild.id)
        action_taken = None
        is_burst = False

        # State transitions
        if join_count >= threshold * 2 or current_state == "LOCKDOWN":
            new_state = "LOCKDOWN" if current_state == "LOCKDOWN" else "ALERT"
            if current_state != new_state:
                await cls.set_raid_state(guild.id, new_state)
                current_state = new_state
            is_burst = True
        elif join_count >= threshold:
            if current_state == "NORMAL":
                await cls.set_raid_state(guild.id, "WATCH")
                current_state = "WATCH"
            is_burst = True

        # Mitigations based on state
        from services.risk_service import RiskEngine
        score, tier, factors = await RiskEngine.compute_risk(member, burst_spike=is_burst)

        if current_state in ("ALERT", "LOCKDOWN"):
            # During ALERT/LOCKDOWN: High/Critical risk accounts are auto-quarantined or kicked
            if tier in ("HIGH", "CRITICAL"):
                from services.automod_service import AutomodService
                try:
                    await AutomodService.jail_user(
                        guild, member, guild.me, 
                        f"Anti-Raid Shield: Auto-Quarantined during {current_state} (Risk: {score}/100 - {tier})"
                    )
                    action_taken = f"Auto-Quarantined ({current_state})"
                except Exception as e:
                    log.error(f"Anti-Raid failed to quarantine {member.id}: {e}")
                    action_taken = f"Quarantine Failed ({e})"

                # Log incident
                await cls.log_incident(
                    guild.id, member.id, "ANTI_RAID", action_taken, "HIGH", score,
                    f"Raid state: {current_state}. Rapid joins ({join_count}/{window_secs}s). Risk factors: {', '.join(factors)}"
                )

        return is_burst, current_state, action_taken

    # -------------------------------------------------------------
    # 2. ANTI-NUKE AUDIT LOG MONITORING
    # -------------------------------------------------------------

    @classmethod
    async def record_audit_action(
        cls, guild: discord.Guild, user: discord.User, action_type: str, details: str = ""
    ) -> Tuple[bool, Optional[str]]:
        """
        Monitors destructive actions performed by staff/bots in audit logs.
        Returns (is_nuke_attempt: bool, action_taken: Optional[str])
        """
        if user.id == guild.owner_id or user.id == guild.me.id:
            return False, None # Owner and bot are immune

        # Whitelist check
        if await cls.is_whitelisted(guild.id, "user", str(user.id)):
            return False, None

        settings = await SettingsService.get_guild_settings(guild.id)
        if not settings.get("anti_nuke_enabled", True):
            return False, None

        threshold = settings.get("anti_nuke_threshold", 3)
        window_secs = settings.get("anti_nuke_window_seconds", 10)

        now = datetime.utcnow().timestamp()
        user_window = cls._nuke_tracker[guild.id][user.id]
        user_window.append(now)

        # Count actions in window
        recent_actions = [ts for ts in user_window if now - ts <= window_secs]
        action_count = len(recent_actions)

        if action_count >= threshold:
            # TRIGGER ANTI-NUKE ROGUE CONTAINMENT
            cls._nuke_tracker[guild.id][user.id].clear() # Reset
            action_taken = await cls._contain_rogue_user(guild, user, action_type, action_count, details)
            return True, action_taken

        return False, None

    @classmethod
    async def _contain_rogue_user(
        cls, guild: discord.Guild, user: discord.User, action_type: str, count: int, details: str
    ) -> str:
        """Immediately strips dangerous/admin roles and quarantines the rogue actor."""
        member = guild.get_member(user.id)
        actions_done = []

        if member:
            # 1. Strip all roles with administrative / destructive permissions
            dangerous_perms = [
                "administrator", "manage_guild", "manage_roles", "manage_channels",
                "kick_members", "ban_members", "manage_webhooks"
            ]
            roles_to_remove = []
            for role in member.roles:
                if role.id == guild.default_role.id or role >= guild.me.top_role:
                    continue
                perms = role.permissions
                if any(getattr(perms, p, False) for p in dangerous_perms):
                    roles_to_remove.append(role)

            if roles_to_remove:
                try:
                    await member.remove_roles(*roles_to_remove, reason="Anti-Nuke Shield: Stripped administrative permissions.")
                    actions_done.append("Stripped Admin Roles")
                except discord.Forbidden:
                    actions_done.append("Failed to Strip Roles (Hierarchy)")

            # 2. Place in Quarantine / Jail
            try:
                from services.automod_service import AutomodService
                await AutomodService.jail_user(
                    guild, member, guild.me, 
                    f"Anti-Nuke Shield: Triggered rogue destructive action rate limit ({count} actions in window: {action_type})"
                )
                actions_done.append("Quarantined")
            except Exception as e:
                actions_done.append(f"Quarantine error ({e})")

        action_summary = " + ".join(actions_done) or "Containment Attempted"

        # 3. Log to DB and send high-priority alert
        await cls.log_incident(
            guild.id, user.id, "ANTI_NUKE", action_summary, "CRITICAL", 100,
            f"Rogue threshold exceeded: {count} actions ({action_type}). Details: {details}"
        )

        # 4. Dispatch Emergency Alert to Server Owner
        try:
            owner = guild.owner
            if owner:
                emergency_embed = SyncInkEmbed(
                    title="<a:syncalert:1520914681231839313> EMERGENCY: Anti-Nuke Shield Triggered!",
                    color=ERROR_COLOR
                )
                emergency_embed.description = (
                    f"**Rogue staff action detected in {guild.name}!**\n\n"
                    f"**Offender:** {user.mention} (`{user.name}` - ID: `{user.id}`)\n"
                    f"**Destructive Action:** `{action_type}` ({count} actions in window)\n"
                    f"**Action Taken:** **{action_summary}**\n"
                    f"**Details:** {details}\n\n"
                    f"⚠️ *Please review server audit logs and role permissions immediately.*"
                )
                await owner.send(embed=emergency_embed)
        except Exception as e:
            log.warning(f"Could not DM server owner about anti-nuke incident: {e}")

        return action_summary

    # -------------------------------------------------------------
    # 3. PHISHING & MALICIOUS LINK DETECTION
    # -------------------------------------------------------------

    @classmethod
    def extract_urls(cls, text: str) -> List[str]:
        """Extracts URLs and domain-like patterns from text."""
        # Matches http(s) URLs as well as bare domains like example.com/test
        url_regex = r'(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?'
        return re.findall(url_regex, text)

    @classmethod
    def normalize_domain(cls, domain: str) -> str:
        """De-obfuscates domain using NFKD unicode decomposition and homoglyph mapping."""
        d = domain.lower().strip()
        # Remove zero-width characters
        for zw in ['\u200b', '\u200c', '\u200d', '\ufeff']:
            d = d.replace(zw, '')

        # Unicode decomposition
        d = unicodedata.normalize('NFKD', d)
        
        # Homoglyphs: Cyrillic/Greek lookalikes to Latin
        homoglyphs = {
            'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
            'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w',
            '1': 'l', '0': 'o', '@': 'a', '3': 'e'
        }
        for k, v in homoglyphs.items():
            d = d.replace(k, v)
        return d

    @classmethod
    async def get_guild_invites(cls, guild: discord.Guild) -> Set[str]:
        """Retrieves and caches internal guild invite codes."""
        now = datetime.utcnow().timestamp()
        if guild.id in cls._guild_invites_cache and (now - cls._invites_cache_expiry.get(guild.id, 0) < 300):
            return cls._guild_invites_cache[guild.id]

        invite_codes = set()
        if guild.vanity_url_code:
            invite_codes.add(guild.vanity_url_code.lower())

        try:
            invites = await guild.invites()
            for inv in invites:
                invite_codes.add(inv.code.lower())
        except discord.Forbidden:
            pass
        except Exception:
            pass

        cls._guild_invites_cache[guild.id] = invite_codes
        cls._invites_cache_expiry[guild.id] = now
        return invite_codes

    @classmethod
    async def analyze_message_links(
        cls, guild: discord.Guild, author: discord.Member, content: str
    ) -> Tuple[bool, Optional[str], Optional[str], str]:
        """
        Analyzes message content for phishing links, unauthorized invites, and homoglyphs.
        Returns: (is_threat: bool, threat_type: Optional[str], details: Optional[str], severity: str)
        """
        # Exemption for Server Owner
        if author.id == guild.owner_id:
            return False, None, None, "LOW"

        # Whitelist checks for user / roles
        if await cls.is_whitelisted(guild.id, "user", str(author.id)):
            return False, None, None, "LOW"
        for r in author.roles:
            if await cls.is_whitelisted(guild.id, "role", str(r.id)):
                return False, None, None, "LOW"

        urls = cls.extract_urls(content)
        if not urls:
            return False, None, None, "LOW"

        internal_invites = await cls.get_guild_invites(guild)

        for raw_url in urls:
            # Parse domain
            parsed = urllib.parse.urlparse(raw_url if "://" in raw_url else f"http://{raw_url}")
            domain = parsed.netloc or parsed.path.split('/')[0]
            domain = domain.split(':')[0].lower() # strip port

            # Check domain whitelist
            if domain in GLOBAL_TRUSTED_DOMAINS or await cls.is_whitelisted(guild.id, "domain", domain):
                # If it's discord.gg or discord.com/invite, check invite validity
                if domain in ("discord.gg", "discord.com", "discordapp.com"):
                    match = re.search(r'(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)', raw_url)
                    if match:
                        code = match.group(1).lower()
                        if code not in internal_invites:
                            # External invite
                            if not await cls.is_whitelisted(guild.id, "domain", f"invite:{code}"):
                                return True, "UNAUTHORIZED_INVITE", f"External Discord invite: `{code}`", "MEDIUM"
                continue

            normalized_domain = cls.normalize_domain(domain)

            # Check for known phishing patterns / typo-squatted lookalikes
            for pattern in PHISHING_PATTERNS:
                if re.search(pattern, normalized_domain) or re.search(pattern, domain):
                    return True, "PHISHING", f"Phishing / Scam domain detected: `{domain}`", "CRITICAL"

            # Check for generic lookalike homoglyphs imitating discord or steam
            if ("discord" in normalized_domain and domain not in ("discord.com", "discord.gg", "discordapp.com", "discord.gift")) or \
               ("steamcommunity" in normalized_domain and domain != "steamcommunity.com"):
                return True, "MALICIOUS_HOMOGLYPH", f"Lookalike / Impersonation domain: `{domain}`", "CRITICAL"

        return False, None, None, "LOW"

    # -------------------------------------------------------------
    # 4. WHITELIST MANAGEMENT
    # -------------------------------------------------------------

    @classmethod
    async def is_whitelisted(cls, guild_id: int, entity_type: str, entity_val: str) -> bool:
        """Checks if a user, role, channel, or domain is whitelisted."""
        cache = cls._whitelist_cache.get(guild_id)
        if cache is None:
            await cls._load_guild_whitelist(guild_id)
            cache = cls._whitelist_cache.get(guild_id, {})

        type_set = cache.get(entity_type, set())
        return entity_val.lower() in type_set

    @classmethod
    async def _load_guild_whitelist(cls, guild_id: int) -> None:
        """Loads whitelist from DB into cache."""
        records = await db.fetch("SELECT entity_type, entity_id_or_val FROM security_whitelist WHERE guild_id = $1", guild_id)
        cache: Dict[str, Set[str]] = defaultdict(set)
        for r in records:
            cache[r['entity_type']].add(str(r['entity_id_or_val']).lower())
        cls._whitelist_cache[guild_id] = cache

    @classmethod
    async def add_whitelist(cls, guild_id: int, entity_type: str, entity_val: str, added_by: int) -> bool:
        """Adds an entity to the whitelist."""
        try:
            await db.execute("""
                INSERT INTO security_whitelist (guild_id, entity_type, entity_id_or_val, added_by, created_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (guild_id, entity_type, entity_id_or_val) DO NOTHING
            """, guild_id, entity_type, entity_val.lower(), added_by)
            await cls._load_guild_whitelist(guild_id)
            return True
        except Exception as e:
            log.error(f"Failed to add whitelist {guild_id}/{entity_type}/{entity_val}: {e}")
            return False

    @classmethod
    async def remove_whitelist(cls, guild_id: int, entity_type: str, entity_val: str) -> bool:
        """Removes an entity from the whitelist."""
        try:
            await db.execute("""
                DELETE FROM security_whitelist 
                WHERE guild_id = $1 AND entity_type = $2 AND entity_id_or_val = $3
            """, guild_id, entity_type, entity_val.lower())
            await cls._load_guild_whitelist(guild_id)
            return True
        except Exception as e:
            log.error(f"Failed to remove whitelist {guild_id}/{entity_type}/{entity_val}: {e}")
            return False

    @classmethod
    async def get_whitelist_entries(cls, guild_id: int, entity_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches all whitelist entries for a guild."""
        if entity_type:
            records = await db.fetch(
                "SELECT * FROM security_whitelist WHERE guild_id = $1 AND entity_type = $2 ORDER BY created_at DESC", 
                guild_id, entity_type
            )
        else:
            records = await db.fetch(
                "SELECT * FROM security_whitelist WHERE guild_id = $1 ORDER BY entity_type, created_at DESC", 
                guild_id
            )
        return [dict(r) for r in records]

    # -------------------------------------------------------------
    # 5. SECURITY FORENSIC LOGGING & INCIDENTS
    # -------------------------------------------------------------

    @classmethod
    async def log_incident(
        cls, guild_id: int, user_id: int, module: str, action_taken: str, 
        severity: str, risk_score: int, details: str
    ) -> None:
        """Persists security incident in database and dispatches alert to moderation log channel."""
        try:
            await db.execute("""
                INSERT INTO security_incidents (guild_id, user_id, module, action_taken, severity, risk_score, details, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            """, guild_id, user_id, module, action_taken, severity, risk_score, details)
        except Exception as e:
            log.error(f"Failed to record security incident to DB: {e}")

        # Dispatch log embed to configured log channel
        settings = await SettingsService.get_guild_settings(guild_id)
        log_chan_id = settings.get("automod_log_channel_id") or settings.get("log_channel_moderation")
        if not log_chan_id:
            return

        from utils.logger import log
        try:
            from database import db
            # Dispatch embed through Discord bot
            from main import SyncInkBot
            # We will handle bot channel send via event callers where bot client is accessible
        except Exception:
            pass
