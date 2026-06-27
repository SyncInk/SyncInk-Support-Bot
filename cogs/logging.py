import discord
from discord.ext import commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed
from utils.logger import log

class Logging(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def send_log(self, guild_id: int, embed: discord.Embed):
        settings = await SettingsService.get_guild_settings(guild_id)
        if settings.get('log_channel_id'):
            guild = self.bot.get_guild(guild_id)
            if guild:
                channel = guild.get_channel(settings['log_channel_id'])
                if channel:
                    try:
                        await channel.send(embed=embed)
                    except discord.Forbidden:
                        log.warning(f"Could not send log to {channel.name}: Missing Permissions")

    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        embed = SyncInkEmbed(title="🗑️ Message Deleted", color=0xED4245)
        embed.set_author(name=f"{message.author}", icon_url=message.author.display_avatar.url)
        embed.add_field(name="Channel", value=message.channel.mention, inline=False)
        embed.add_field(name="Content", value=message.content or "No text content", inline=False)
        await self.send_log(message.guild.id, embed)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or not before.guild or before.content == after.content:
            return

        embed = SyncInkEmbed(title="✏️ Message Edited", color=0xFEE75C)
        embed.set_author(name=f"{before.author}", icon_url=before.author.display_avatar.url)
        embed.add_field(name="Channel", value=before.channel.mention, inline=False)
        embed.add_field(name="Before", value=before.content[:1024] or "None", inline=False)
        embed.add_field(name="After", value=after.content[:1024] or "None", inline=False)
        await self.send_log(before.guild.id, embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        embed = SyncInkEmbed(title="👋 Member Left", color=0xED4245)
        embed.set_author(name=f"{member}", icon_url=member.display_avatar.url)
        await self.send_log(member.guild.id, embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Logging(bot))
