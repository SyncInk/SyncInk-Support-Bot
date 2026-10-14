import discord
from discord.ext import commands
import asyncio
import os
import sys
import traceback
from dotenv import load_dotenv

from utils.logger import log
from utils.exceptions import ConfigurationError, UserFacingError
from utils.ui import ErrorEmbed
from utils.validator import validate_environment
from utils.i18n import i18n
from utils.tasks import task_manager
from database import db

# Load environment variables
load_dotenv()

class SyncInkBot(commands.Bot):
    def __init__(self, enable_presences: bool = True):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.guilds = True
        if enable_presences:
            intents.presences = True
        
        super().__init__(
            command_prefix="?",
            intents=intents,
            help_command=None,
            case_insensitive=True
        )
        
    async def setup_hook(self):
        """Initializes dependencies, DB, tasks, and loads extensions."""
        log.info("Setting up SyncInk Bot (Platform Edition)...")
        
        # Load Localizations
        i18n.load_locales()
        
        # Connect to Database and run migrations
        try:
            await db.connect()
        except Exception as e:
            log.critical(f"Failed to connect to DB during startup: {e}")
            sys.exit(1)
            
        # Re-register persistent views
        from cogs.security import VerificationView
        self.add_view(VerificationView())
        log.info("Persistent views registered.")

        # Load Cogs dynamically
        cogs_dir = os.path.join(os.path.dirname(__file__), "cogs")
        for filename in os.listdir(cogs_dir):
            if filename.endswith(".py") and not filename.startswith("__"):
                cog_name = f"cogs.{filename[:-3]}"
                try:
                    await self.load_extension(cog_name)
                    log.info(f"Loaded extension: {cog_name}")
                except Exception as e:
                    log.error(f"Failed to load extension {cog_name}: {e}")
                    traceback.print_exc()
                    
        # Sync application slash commands with Discord (Instant Guild Sync + Global)
        try:
            log.info("Syncing application slash commands with Discord...")
            target_guild_id = int(os.getenv("TARGET_GUILD_ID", "1520457643842342912"))
            target_guild = discord.Object(id=target_guild_id)
            self.tree.copy_global_to(guild=target_guild)
            synced_guild = await self.tree.sync(guild=target_guild)
            log.info(f"Instantly synced {len(synced_guild)} slash commands to target guild ({target_guild_id}).")
            synced_global = await self.tree.sync()
            log.info(f"Globally synced {len(synced_global)} slash commands.")
        except Exception as e:
            log.warning(f"Failed to sync application slash commands: {e}")

        # Restrict application slash commands and component interactions strictly to target support guild
        @self.tree.interaction_check
        async def global_interaction_check(interaction: discord.Interaction) -> bool:
            primary_id = int(os.getenv("TARGET_GUILD_ID", os.getenv("SUPPORT_GUILD_ID", "1520457643842342912")))
            if interaction.guild_id and interaction.guild_id != primary_id:
                return False
            return True

        # Register global command rate limiter & flood check
        @self.check
        async def global_command_rate_limit_check(ctx: commands.Context) -> bool:
            try:
                from services.automod_service import AutomodService
                return await AutomodService.check_command_rate_limit(ctx)
            except Exception as e:
                log.error(f"Error in global_command_rate_limit_check: {e}")
                return True

    async def on_message(self, message: discord.Message):
        """Global message processor; strictly ignores DMs and secondary emoji servers."""
        if message.guild is None or message.author.bot:
            return

        primary_id = int(os.getenv("TARGET_GUILD_ID", os.getenv("SUPPORT_GUILD_ID", "1520457643842342912")))
        if message.guild.id != primary_id:
            return

        # 1. Run AutoMod inspection first to protect against spam, profanity, and malicious content
        automod_cog = self.get_cog("Automod")
        if automod_cog:
            try:
                allowed = await automod_cog.check_message(message)
                if allowed is False:
                    return
            except Exception as e:
                log.error(f"Error in AutoMod check_message: {e}")

        # 2. Process prefix commands if message passed AutoMod cleanly
        await self.process_commands(message)

    async def on_ready(self):
        log.info(f"Logged in as {self.user} (ID: {self.user.id})")
        log.info("SyncInk Support Platform is online.")
        try:
            from utils.emoji_manager import EmojiManager
            asyncio.create_task(EmojiManager.sync_role_emojis(self))
        except Exception as e:
            log.warning(f"Could not initialize EmojiManager: {e}")
        
    async def close(self):
        """Graceful shutdown for Railway."""
        log.info("Shutting down bot gracefully...")
        task_manager.cancel_all()
        await db.close()
        await super().close()

    async def on_command_error(self, ctx: commands.Context, error: commands.CommandError):
        """Global error handler for prefix commands."""
        if ctx.guild is None:
            return

        if isinstance(error, commands.CommandNotFound):
            return

        if isinstance(error, (commands.MissingPermissions, commands.NotOwner)):
            try:
                from services.automod_service import AutomodService
                cmd_name = ctx.command.name if ctx.command else "admin_command"
                await AutomodService.handle_unauthorized_command(ctx, cmd_name)
            except Exception as e:
                log.error(f"Error handling unauthorized command in on_command_error: {e}")
            return

        if isinstance(error, commands.CheckFailure):
            # Check failures are handled directly within custom predicates
            return
            
        if hasattr(error, 'original') and isinstance(error.original, UserFacingError):
            await ctx.send(embed=ErrorEmbed(error.original.message))
            return

        log.error(f"Ignoring exception in command {ctx.command}: {error}")
        traceback.print_exception(type(error), error, error.__traceback__)
        try:
            await ctx.send(embed=ErrorEmbed(i18n.get("error_generic")))
        except discord.HTTPException:
            pass

def main():
    # Validate environment before doing anything
    validate_environment()
    
    token = os.getenv("DISCORD_TOKEN")
    
    def run_bot(enable_presences: bool):
        bot = SyncInkBot(enable_presences=enable_presences)
        
        # Global error handler for app commands (slash commands)
        @bot.tree.error
        async def on_app_command_error(interaction: discord.Interaction, error: discord.app_commands.AppCommandError):
            if hasattr(error, 'original') and isinstance(error.original, UserFacingError):
                if not interaction.response.is_done():
                    await interaction.response.send_message(embed=ErrorEmbed(error.original.message), ephemeral=True)
                return
                
            log.error(f"Ignoring exception in app command {interaction.command}: {error}")
            traceback.print_exception(type(error), error, error.__traceback__)
            
            # If the command's Cog defines its own cog_app_command_error, don't double-send
            cog = interaction.command.binding if interaction.command else None
            if cog and hasattr(cog, "cog_app_command_error"):
                return

            # Avoid responding if the interaction was already finished or timed out
            orig = getattr(error, 'original', error)
            if isinstance(orig, discord.errors.NotFound) and orig.code == 10062:
                return

            try:
                if interaction.response.is_done():
                    await interaction.followup.send(embed=ErrorEmbed(i18n.get("error_generic")), ephemeral=True)
                else:
                    await interaction.response.send_message(embed=ErrorEmbed(i18n.get("error_generic")), ephemeral=True)
            except discord.HTTPException:
                pass

        bot.run(token, log_handler=None)

    try:
        run_bot(enable_presences=True)
    except discord.errors.PrivilegedIntentsRequired:
        log.warning("Privileged Presence Intent is not enabled in Discord Developer Portal. Running with standard intents...")
        run_bot(enable_presences=False)

if __name__ == "__main__":
    main()
