import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed

class Stats(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="botstats", description="View public bot performance and ping statistics.")
    @app_commands.default_permissions(manage_messages=True)
    async def botstats(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="📊 Bot Statistics")
        embed.add_field(name="Ping", value=f"{round(self.bot.latency * 1000)}ms", inline=True)
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
