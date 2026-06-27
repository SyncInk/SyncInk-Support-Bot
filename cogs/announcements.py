import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed

class AnnouncementModal(discord.ui.Modal, title="Create Announcement"):
    announcement_title = discord.ui.TextInput(
        label="Title",
        placeholder="e.g. SyncInk Main Bot v2.0 Release",
        max_length=100
    )
    
    content = discord.ui.TextInput(
        label="Content",
        style=discord.TextStyle.paragraph,
        placeholder="What's new?",
        max_length=2000
    )

    async def on_submit(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title=f"📢 {self.announcement_title.value}")
        embed.description = self.content.value
        embed.set_author(name=interaction.user.display_name, icon_url=interaction.user.display_avatar.url)
        
        await interaction.channel.send(embed=embed)
        await interaction.response.send_message(embed=SuccessEmbed("Announcement sent!"), ephemeral=True)

class Announcements(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="announce", description="Create a professionally formatted announcement")
    @app_commands.default_permissions(administrator=True)
    async def announce(self, interaction: discord.Interaction):
        await interaction.response.send_modal(AnnouncementModal())

async def setup(bot: commands.Bot):
    await bot.add_cog(Announcements(bot))
