import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed
from utils.permissions import has_permission

class Announcements(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="announce", description="Broadcast a formatted announcement to the channel.")
    @app_commands.default_permissions(manage_messages=True)
    @has_permission(manage_messages=True)
    async def announce(self, interaction: discord.Interaction, title: str, message: str):
        embed = SyncInkEmbed(title=title)
        embed.set_author(name="Server Announcement", icon_url="https://cdn.discordapp.com/emojis/1045237731211755561.webp") # Broadcast icon
        embed.description = message
        
        await interaction.channel.send(embed=embed)
        await interaction.response.send_message(embed=SuccessEmbed("Announcement successfully broadcasted to the channel."), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Announcements(bot))
