import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed

class ServerManagement(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="cleanup", description="Cleans up the bot's own messages in the channel")
    @app_commands.default_permissions(manage_messages=True)
    async def cleanup(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100] = 50):
        await interaction.response.defer(ephemeral=True)
        
        def is_bot(m):
            return m.author == self.bot.user
            
        deleted = await interaction.channel.purge(limit=amount, check=is_bot)
        await interaction.followup.send(embed=SuccessEmbed(f"Cleaned up {len(deleted)} bot messages."))

async def setup(bot: commands.Bot):
    await bot.add_cog(ServerManagement(bot))
