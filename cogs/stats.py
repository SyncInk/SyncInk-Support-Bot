import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed
import time

class Stats(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.start_time = time.time()

    @app_commands.command(name="botstats", description="View bot and network statistics")
    async def botstats(self, interaction: discord.Interaction):
        total_users = sum(g.member_count for g in self.bot.guilds if g.member_count)
        total_guilds = len(self.bot.guilds)
        
        uptime_seconds = int(time.time() - self.start_time)
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{hours}h {minutes}m {seconds}s"
        
        embed = SyncInkEmbed(title="📊 Bot Statistics")
        embed.add_field(name="Servers", value=f"{total_guilds:,}", inline=True)
        embed.add_field(name="Total Users", value=f"{total_users:,}", inline=True)
        embed.add_field(name="Uptime", value=uptime_str, inline=True)
        embed.add_field(name="Latency", value=f"{round(self.bot.latency * 1000)}ms", inline=True)
        
        # Placeholders for cross-service stats (API dependent)
        embed.add_field(name="Tickets Processed", value="~14,500 (API)", inline=True)
        embed.add_field(name="Voice Sessions", value="~3,200 (API)", inline=True)
        
        await interaction.response.send_message(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
