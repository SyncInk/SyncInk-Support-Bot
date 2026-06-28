import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed, SyncInkEmbed
from utils.metrics import metrics

class Feedback(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="suggest", description="Submit a feature request or bug report to the team.")
    async def suggest(self, interaction: discord.Interaction, suggestion: str):
        metrics.record_suggestion()
        
        embed = SyncInkEmbed(title="Suggestion Recorded")
        embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.display_avatar.url)
        embed.description = suggestion
        
        await interaction.response.send_message(embed=SuccessEmbed("Your suggestion has been securely transmitted to the development team. Thank you for helping improve SyncInk!"), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Feedback(bot))
