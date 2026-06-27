import discord
from discord.ext import commands
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
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.guilds = True
        
        super().__init__(
            command_prefix=commands.when_mentioned_or("s!"),
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
        from cogs.settings import SettingsView
        from cogs.security import VerificationView
        self.add_view(SettingsView())
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
                    
        # Sync slash commands
        log.info("Syncing application commands...")
        await self.tree.sync()
        log.info("Application commands synced.")

    async def on_ready(self):
        log.info(f"Logged in as {self.user} (ID: {self.user.id})")
        log.info("SyncInk Support Platform is online.")
        
    async def close(self):
        """Graceful shutdown for Railway."""
        log.info("Shutting down bot gracefully...")
        task_manager.cancel_all()
        await db.close()
        await super().close()

    async def on_command_error(self, ctx: commands.Context, error: commands.CommandError):
        """Global error handler for prefix commands."""
        if isinstance(error, commands.CommandNotFound):
            return
            
        if isinstance(error, commands.MissingPermissions):
            await ctx.send(embed=ErrorEmbed(i18n.get("error_no_permission")), ephemeral=True)
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
    bot = SyncInkBot()
    
    # Global error handler for app commands (slash commands)
    @bot.tree.error
    async def on_app_command_error(interaction: discord.Interaction, error: discord.app_commands.AppCommandError):
        if hasattr(error, 'original') and isinstance(error.original, UserFacingError):
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=ErrorEmbed(error.original.message), ephemeral=True)
            return
            
        log.error(f"Ignoring exception in app command {interaction.command}: {error}")
        traceback.print_exception(type(error), error, error.__traceback__)
        
        try:
            if interaction.response.is_done():
                await interaction.followup.send(embed=ErrorEmbed(i18n.get("error_generic")), ephemeral=True)
            else:
                await interaction.response.send_message(embed=ErrorEmbed(i18n.get("error_generic")), ephemeral=True)
        except discord.HTTPException:
            pass

    bot.run(token, log_handler=None)

if __name__ == "__main__":
    main()
