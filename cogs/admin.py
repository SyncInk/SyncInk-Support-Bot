import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed
from utils.permissions import has_permission

class Admin(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="create_button_role", description="Generate a persistent role-toggle button.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def create_button_role(self, interaction: discord.Interaction, role: discord.Role, message: str):
        embed = SyncInkEmbed(title="🎭 Role Selection", description=message)
        await interaction.channel.send(embed=embed)
        await interaction.response.send_message("Role button created successfully.", ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Admin(bot))
