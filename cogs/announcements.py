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

import typing

class Announcements(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="announce", description="Broadcast a professional Markdown announcement to a channel.")
    @commands.has_permissions(administrator=True)
    async def announce(self, ctx: commands.Context, channel: typing.Optional[discord.TextChannel] = None, *, message: str = None):
        target_channel = channel or ctx.channel
        if not message:
            await ctx.send(embed=ErrorEmbed(
                description="Please provide the announcement message content.",
                resolution="Usage: `?announce [#channel] <announcement message>`"
            ))
            return

        try:
            if len(message) <= 2000:
                await target_channel.send(content=message)
            else:
                chunks = []
                current_chunk = ""
                for line in message.split('\n'):
                    if len(current_chunk) + len(line) + 1 > 2000:
                        if not current_chunk.strip():
                            current_chunk = line[:1990]
                            line = line[1990:]
                        chunks.append(current_chunk)
                        current_chunk = line + "\n"
                    else:
                        current_chunk += line + "\n"
                if current_chunk.strip():
                    chunks.append(current_chunk)
                    
                for chunk in chunks:
                    await target_channel.send(content=chunk)

            await ctx.send(embed=SuccessEmbed(f"Announcement successfully broadcasted to {target_channel.mention}."))
        except discord.Forbidden:
            await ctx.send(embed=ErrorEmbed("I do not have permission to send messages in that channel."))
        except Exception as e:
            await ctx.send(embed=ErrorEmbed(f"Failed to send announcement: {e}"))

async def setup(bot: commands.Bot):
    await bot.add_cog(Announcements(bot))
