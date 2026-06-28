import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed, ErrorEmbed
from utils.permissions import has_permission

class ServerManagement(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="cleanup", description="Remove the bot's recent messages from this channel.")
    @app_commands.default_permissions(manage_messages=True)
    @has_permission(manage_messages=True)
    async def cleanup(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100] = 10):
        await interaction.response.defer(ephemeral=True)
        try:
            def is_me(m):
                return m.author == self.bot.user
            
            deleted = await interaction.channel.purge(limit=amount, check=is_me)
            await interaction.followup.send(embed=SuccessEmbed(f"Successfully cleaned up {len(deleted)} bot messages from this channel."))
        except discord.Forbidden:
            embed = ErrorEmbed(
                description="The bot lacks permissions to delete messages in this channel.",
                resolution="Ensure the bot has the 'Manage Messages' permission enabled."
            )
            await interaction.followup.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(ServerManagement(bot))
