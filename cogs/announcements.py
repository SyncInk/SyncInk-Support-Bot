import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed
from utils.permissions import has_permission

class AnnouncementModal(discord.ui.Modal, title="Broadcast Announcement"):
    content = discord.ui.TextInput(
        label="Announcement Content (Markdown Supported)",
        style=discord.TextStyle.paragraph,
        placeholder="# 🚀 SyncInk Update\n\n## ✨ What's New\n- Feature 1",
        required=True,
        max_length=4000
    )
    
    def __init__(self, target_channel: discord.TextChannel):
        super().__init__()
        self.target_channel = target_channel

    async def on_submit(self, interaction: discord.Interaction):
        try:
            content = self.content.value
            if len(content) <= 2000:
                await self.target_channel.send(content=content)
            else:
                chunks = []
                current_chunk = ""
                for line in content.split('\n'):
                    if len(current_chunk) + len(line) + 1 > 2000:
                        if not current_chunk.strip():
                            # If a single line is over 2000 chars, force split it
                            current_chunk = line[:1990]
                            line = line[1990:]
                        chunks.append(current_chunk)
                        current_chunk = line + "\n"
                    else:
                        current_chunk += line + "\n"
                if current_chunk.strip():
                    chunks.append(current_chunk)
                    
                for chunk in chunks:
                    await self.target_channel.send(content=chunk)

            await interaction.response.send_message(embed=SuccessEmbed(f"Announcement successfully broadcasted to {self.target_channel.mention}."), ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(embed=ErrorEmbed("I do not have permission to send messages in that channel."), ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(f"Failed to send announcement: {e}"), ephemeral=True)

class Announcements(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="announce", description="Broadcast a professional Markdown announcement to a channel.")
    @app_commands.describe(channel="The channel to send the announcement to.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def announce(self, interaction: discord.Interaction, channel: discord.TextChannel = None):
        target_channel = channel or interaction.channel
        await interaction.response.send_modal(AnnouncementModal(target_channel))

async def setup(bot: commands.Bot):
    await bot.add_cog(Announcements(bot))
