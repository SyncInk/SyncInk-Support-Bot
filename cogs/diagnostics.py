import discord
from discord.ext import commands
from discord import app_commands
import time
from utils.ui import SyncInkEmbed
from utils.metrics import metrics
from utils.version import PLATFORM_NAME, VERSION, BUILD_NUMBER, GIT_COMMIT, STARTUP_TIME
from utils.permissions import has_permission

class Diagnostics(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="platform_metrics", description="View internal analytics and platform health.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def platform_metrics(self, interaction: discord.Interaction):
        total_users = sum(g.member_count for g in self.bot.guilds if g.member_count)
        total_guilds = len(self.bot.guilds)
        
        uptime_seconds = int(time.time() - STARTUP_TIME) if STARTUP_TIME else 0
        hours, remainder = divmod(uptime_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{hours}h {minutes}m {seconds}s"
        
        embed = SyncInkEmbed(title="Platform Metrics")
        embed.set_author(name="System Diagnostics", icon_url="https://syncink.xyz/assets/logo.png")
        
        embed.add_field(name="Infrastructure", value=f"**Uptime:** {uptime_str}\n**Servers:** {total_guilds:,}\n**Users:** {total_users:,}", inline=True)
        embed.add_field(name="Performance", value=f"**Commands:** {metrics.commands_executed:,}\n**Latency:** {metrics.avg_command_time:.2f}ms\n**Errors:** {metrics.errors_raised:,}", inline=True)
        embed.add_field(name="Ecosystem", value=f"**Mod Actions:** {metrics.moderation_actions:,}\n**Suggestions:** {metrics.suggestions_submitted:,}\n**Status:** 🟢 Healthy", inline=False)
        
        embed.set_footer(text=f"{PLATFORM_NAME} v{VERSION} | Build {BUILD_NUMBER} | Commit: {GIT_COMMIT}")
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Diagnostics(bot))
