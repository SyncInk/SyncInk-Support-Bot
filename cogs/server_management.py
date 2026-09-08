import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed, ErrorEmbed
from utils.permissions import has_permission

class ServerManagement(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="cleanup", description="Remove the bot's recent messages from this channel.")
    @commands.has_permissions(manage_messages=True)
    async def cleanup(self, ctx: commands.Context, amount: int = 10):
        if amount < 1 or amount > 100:
            await ctx.send(embed=ErrorEmbed("Please specify an amount between 1 and 100."))
            return
        try:
            def is_me(m):
                return m.author == self.bot.user
            
            deleted = await ctx.channel.purge(limit=amount + 1, check=is_me)
            msg = await ctx.send(embed=SuccessEmbed(f"Successfully cleaned up {len(deleted)} bot messages from this channel."))
            await msg.delete(delay=5)
        except discord.Forbidden:
            embed = ErrorEmbed(
                description="The bot lacks permissions to delete messages in this channel.",
                resolution="Ensure the bot has the 'Manage Messages' permission enabled."
            )
            await ctx.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(ServerManagement(bot))
