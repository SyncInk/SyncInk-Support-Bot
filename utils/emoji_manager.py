import os
import discord
from typing import Optional, List, Dict
from utils.logger import log
from utils.emojis import Emojis

class EmojiManager:
    """
    Manages custom emojis for SyncInk Support Bot.
    Ensures that role emojis are accessible either via Application Emojis,
    Guild Emojis, or elegant Unicode fallbacks (never broken :name: text).
    """

    ROLE_SPECS = [
        {
            "key": "owner",
            "names": ["sync_owner", "owner"],
            "file": "sync_owner.png",
            "fallback": "👑"
        },
        {
            "key": "manager",
            "names": ["sync_admin", "admin", "manager"],
            "file": "sync_admin.png",
            "fallback": "💼"
        },
        {
            "key": "developer",
            "names": ["VerifiedBotDeveloper", "developer", "dev", "sync_developer"],
            "file": "VerifiedBotDeveloper.png",
            "fallback": "💻"
        },
        {
            "key": "staff",
            "names": ["sync_moderator", "moderator", "staff"],
            "file": "sync_moderator.png",
            "fallback": "🛡️"
        },
        {
            "key": "partner",
            "names": ["partnered", "partner"],
            "file": "partnered.png",
            "fallback": "<:partnered:1551337413660381255>"
        },
        {
            "key": "verified",
            "names": ["verified", "verify"],
            "file": "verified.png",
            "fallback": "<:verified:1551336293017845822>"
        },
    ]

    _synced_emojis: Dict[str, str] = {
        "owner": "👑",
        "manager": "💼",
        "developer": "💻",
        "staff": "🛡️",
        "partner": "<:partnered:1551337413660381255>",
        "verified": "<:verified:1551336293017845822>"
    }

    @classmethod
    def get_role_emoji(cls, guild: Optional[discord.Guild], role_key: str) -> str:
        """
        Returns the best rendering emoji for a role.
        1. Checks current guild emojis by name (case-insensitive)
        2. Checks bot application / synced custom emojis
        3. Falls back to clean Unicode emoji (never raw :name: text)
        """
        # 1. Search current guild cache first
        if guild and hasattr(guild, "emojis"):
            for spec in cls.ROLE_SPECS:
                if spec["key"] == role_key:
                    found = discord.utils.find(
                        lambda e: e.name.lower() in [n.lower() for n in spec["names"]], 
                        guild.emojis
                    )
                    if found:
                        return str(found)

        # 2. Check cached synced emojis (from application or startup sync)
        if role_key in cls._synced_emojis:
            val = cls._synced_emojis[role_key]
            if val and not (val.startswith(":") and val.endswith(":") and not val.startswith("<:")):
                return val

        # 3. Fallback to spec default
        for spec in cls.ROLE_SPECS:
            if spec["key"] == role_key:
                return spec["fallback"]

        return "•"

    @classmethod
    async def sync_role_emojis(cls, bot: discord.Client):
        """
        Runs on startup to ensure all role emojis exist as Application Emojis or Guild Emojis.
        If missing, uploads them from local assets/emojis/ and updates active emoji tags.
        """
        log.info("[EmojiManager] Synchronizing server role emojis...")

        # Ensure application_id is populated if possible
        try:
            if hasattr(bot, "application_id") and bot.application_id is None:
                if hasattr(bot, "application_info"):
                    app_info = await bot.application_info()
                    if hasattr(bot, "_connection") and hasattr(bot._connection, "application_id"):
                        bot._connection.application_id = app_info.id
        except Exception as e:
            log.warning(f"[EmojiManager] Could not populate application_id: {e}")

        # 1. Check existing Application Emojis
        app_emojis = []
        try:
            if hasattr(bot, "fetch_application_emojis"):
                app_emojis = await bot.fetch_application_emojis()
                log.info(f"[EmojiManager] Found {len(app_emojis)} existing application emojis.")
        except Exception as e:
            log.warning(f"[EmojiManager] Could not fetch application emojis: {e}")

        assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "emojis")

        for spec in cls.ROLE_SPECS:
            key = spec["key"]
            names = spec["names"]
            target_name = names[0]
            file_name = spec["file"]

            # Check in application emojis
            found_app = discord.utils.find(lambda e: e.name.lower() in [n.lower() for n in names], app_emojis)
            if found_app:
                cls._synced_emojis[key] = str(found_app)
                log.info(f"[EmojiManager] Matched application emoji for {key}: {found_app}")
                continue

            # Check in bot's guilds
            found_guild = None
            if hasattr(bot, "guilds"):
                for g in bot.guilds:
                    found_guild = discord.utils.find(lambda e: e.name.lower() in [n.lower() for n in names], g.emojis)
                    if found_guild:
                        break

            if found_guild:
                cls._synced_emojis[key] = str(found_guild)
                log.info(f"[EmojiManager] Matched guild emoji for {key}: {found_guild}")
                continue

            # If not found anywhere, attempt to upload from local assets
            file_path = os.path.join(assets_dir, file_name)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "rb") as f:
                        img_bytes = f.read()

                    # Try creating application emoji first
                    if hasattr(bot, "create_application_emoji"):
                        try:
                            new_app_emoji = await bot.create_application_emoji(name=target_name, image=img_bytes)
                            cls._synced_emojis[key] = str(new_app_emoji)
                            log.info(f"[EmojiManager] Created application emoji {target_name}: {new_app_emoji}")
                            continue
                        except Exception as ae:
                            log.warning(f"[EmojiManager] Application emoji creation failed for {target_name}: {ae}")

                    # Fallback: try creating in main guild if bot has permissions
                    for guild in getattr(bot, "guilds", []):
                        me = guild.me or guild.get_member(bot.user.id)
                        can_manage = False
                        if me:
                            perms = me.guild_permissions
                            can_manage = (
                                getattr(perms, "manage_emojis_and_stickers", False) or 
                                getattr(perms, "manage_guild_expressions", False) or 
                                perms.administrator
                            )
                        if can_manage:
                            try:
                                new_guild_emoji = await guild.create_custom_emoji(name=target_name, image=img_bytes)
                                cls._synced_emojis[key] = str(new_guild_emoji)
                                log.info(f"[EmojiManager] Created guild emoji {target_name} in {guild.name}: {new_guild_emoji}")
                                break
                            except Exception as ge:
                                log.warning(f"[EmojiManager] Guild emoji creation failed in {guild.name}: {ge}")

                except Exception as ex:
                    log.error(f"[EmojiManager] Failed to read/upload emoji for {key}: {ex}")

            # If still not found, keep graceful fallback
            if key not in cls._synced_emojis or not cls._synced_emojis[key]:
                cls._synced_emojis[key] = spec["fallback"]

        # Apply synced emojis to Emojis class attributes
        Emojis.ROLE_OWNER = cls._synced_emojis.get("owner", "👑")
        Emojis.ROLE_MANAGER = cls._synced_emojis.get("manager", "💼")
        Emojis.ROLE_DEVELOPER = cls._synced_emojis.get("developer", "💻")
        Emojis.ROLE_STAFF = cls._synced_emojis.get("staff", "🛡️")
        Emojis.ROLE_PARTNER = cls._synced_emojis.get("partner", "<:partnered:1551337413660381255>")
        Emojis.ROLE_VERIFIED = cls._synced_emojis.get("verified", "<:verified:1551336293017845822>")

        log.info("[EmojiManager] Role emoji synchronization complete.")
