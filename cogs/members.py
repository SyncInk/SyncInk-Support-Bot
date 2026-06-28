import discord
from discord.ext import commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed
from utils.logger import log
from utils.i18n import i18n

class Members(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # The welcome flow is now handled directly by the security module upon successful verification.

async def setup(bot: commands.Bot):
    await bot.add_cog(Members(bot))
