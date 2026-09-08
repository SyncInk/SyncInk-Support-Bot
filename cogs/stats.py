import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed

class Stats(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="botstats", aliases=["ping", "stats"], description="View public bot performance and ping statistics.")
    async def botstats(self, ctx: commands.Context):
        embed = SyncInkEmbed(title="Bot Statistics")
        embed.set_author(name="Network Health", icon_url="https://syncink.xyz/assets/logo.png")
        embed.add_field(name="Latency (Ping)", value=f"{round(self.bot.latency * 1000)}ms", inline=True)
        embed.add_field(name="Servers", value=f"{len(self.bot.guilds)}", inline=True)
        await ctx.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
