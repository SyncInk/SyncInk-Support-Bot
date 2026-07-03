import discord
from discord.ext import commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed, BRAND_ACCENT, SUCCESS_COLOR, ERROR_COLOR, WARNING_COLOR
from utils.logger import log

class AdvancedLogging(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _send_log(self, guild_id: int, key: str, embed: discord.Embed):
        settings = await SettingsService.get_guild_settings(guild_id)
        channel_id = settings.get(key)
        if not channel_id:
            return
            
        guild = self.bot.get_guild(guild_id)
        if not guild:
            return
            
        channel = guild.get_channel(channel_id)
        if channel:
            try:
                await channel.send(embed=embed)
            except discord.Forbidden:
                log.warning(f"Missing permissions to send logs in {channel.name} ({key})")

    # ==========================
    # MESSAGE LOGS
    # ==========================
    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
            
        deleter = None
        # Check audit logs to see if a moderator deleted the message
        try:
            async for entry in message.guild.audit_logs(limit=5, action=discord.AuditLogAction.message_delete):
                if entry.target.id == message.author.id and entry.extra.channel.id == message.channel.id:
                    # We assume this entry corresponds to our deleted message
                    # A small race condition exists here but this is the standard discord.py approach
                    deleter = entry.user
                    break
        except discord.Forbidden:
            pass

        embed = SyncInkEmbed(title="Message Deleted", color=ERROR_COLOR)
        
        if deleter:
            embed.set_author(name=f"Deleted by {deleter} ({deleter.id})", icon_url=deleter.display_avatar.url)
            embed.add_field(name="Author", value=f"{message.author.mention}", inline=True)
        else:
            embed.set_author(name=f"{message.author} ({message.author.id})", icon_url=message.author.display_avatar.url)
            
        embed.add_field(name="Channel", value=message.channel.mention, inline=True)
        if message.content:
            embed.add_field(name="Content", value=f"```\n{message.content[:1000]}\n```", inline=False)
            
        await self._send_log(message.guild.id, "log_channel_message", embed)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or not before.guild or before.content == after.content:
            return
            
        embed = SyncInkEmbed(title="Message Edited", color=WARNING_COLOR)
        embed.set_author(name=f"{before.author} ({before.author.id})", icon_url=before.author.display_avatar.url)
        embed.add_field(name="Channel", value=f"{before.channel.mention} [Jump to Message]({after.jump_url})", inline=False)
        if before.content:
            embed.add_field(name="Before", value=f"```\n{before.content[:1000]}\n```", inline=False)
        if after.content:
            embed.add_field(name="After", value=f"```\n{after.content[:1000]}\n```", inline=False)
            
        await self._send_log(before.guild.id, "log_channel_message", embed)

    @commands.Cog.listener()
    async def on_bulk_message_delete(self, messages: list[discord.Message]):
        if not messages:
            return
        guild = messages[0].guild
        channel = messages[0].channel
        
        embed = SyncInkEmbed(title="Bulk Message Delete", color=ERROR_COLOR)
        embed.add_field(name="Channel", value=channel.mention, inline=True)
        embed.add_field(name="Messages Deleted", value=str(len(messages)), inline=True)
        await self._send_log(guild.id, "log_channel_message", embed)

    # ==========================
    # MEMBER LOGS
    # ==========================
    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        embed = SyncInkEmbed(title="Member Joined", color=SUCCESS_COLOR)
        embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        embed.add_field(name="Account Created", value=f"<t:{int(member.created_at.timestamp())}:R>", inline=False)
        await self._send_log(member.guild.id, "log_channel_member", embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        embed = SyncInkEmbed(title="Member Left", color=ERROR_COLOR)
        embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        
        roles = [r.mention for r in member.roles if r.name != "@everyone"]
        if roles:
            embed.add_field(name="Roles Held", value=" ".join(roles[:10]), inline=False)
            
        await self._send_log(member.guild.id, "log_channel_member", embed)

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        if before.nick != after.nick:
            embed = SyncInkEmbed(title="Nickname Changed", color=BRAND_ACCENT)
            embed.set_author(name=f"{after} ({after.id})", icon_url=after.display_avatar.url)
            embed.add_field(name="Before", value=before.nick or before.name, inline=True)
            embed.add_field(name="After", value=after.nick or after.name, inline=True)
            await self._send_log(after.guild.id, "log_channel_member", embed)
            
        # Role Logs
        if set(before.roles) != set(after.roles):
            added_roles = [r for r in after.roles if r not in before.roles]
            removed_roles = [r for r in before.roles if r not in after.roles]
            
            embed = SyncInkEmbed(title="Member Roles Updated", color=BRAND_ACCENT)
            embed.set_author(name=f"{after} ({after.id})", icon_url=after.display_avatar.url)
            
            if added_roles:
                embed.add_field(name="Roles Added", value=" ".join([r.mention for r in added_roles]), inline=False)
            if removed_roles:
                embed.add_field(name="Roles Removed", value=" ".join([r.mention for r in removed_roles]), inline=False)
                
            await self._send_log(after.guild.id, "log_channel_server", embed)

    # ==========================
    # VOICE LOGS
    # ==========================
    @commands.Cog.listener()
    async def on_voice_state_update(self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState):
        if before.channel == after.channel:
            return
            
        embed = SyncInkEmbed(color=BRAND_ACCENT)
        embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        
        if before.channel is None and after.channel is not None:
            embed.title = "Joined Voice Channel"
            embed.color = SUCCESS_COLOR
            embed.add_field(name="Channel", value=after.channel.mention, inline=False)
        elif before.channel is not None and after.channel is None:
            embed.title = "Left Voice Channel"
            embed.color = ERROR_COLOR
            embed.add_field(name="Channel", value=before.channel.mention, inline=False)
        else:
            embed.title = "Moved Voice Channel"
            embed.color = WARNING_COLOR
            embed.add_field(name="Before", value=before.channel.mention, inline=True)
            embed.add_field(name="After", value=after.channel.mention, inline=True)
            
        await self._send_log(member.guild.id, "log_channel_voice", embed)

    # ==========================
    # SERVER LOGS (Roles & Channels)
    # ==========================
    @commands.Cog.listener()
    async def on_guild_role_create(self, role: discord.Role):
        embed = SyncInkEmbed(title="Role Created", color=SUCCESS_COLOR)
        embed.add_field(name="Role", value=role.mention, inline=True)
        embed.add_field(name="ID", value=str(role.id), inline=True)
        await self._send_log(role.guild.id, "log_channel_server", embed)

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        embed = SyncInkEmbed(title="Role Deleted", color=ERROR_COLOR)
        embed.add_field(name="Role Name", value=role.name, inline=True)
        embed.add_field(name="ID", value=str(role.id), inline=True)
        await self._send_log(role.guild.id, "log_channel_server", embed)

    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel: discord.abc.GuildChannel):
        embed = SyncInkEmbed(title="Channel Created", color=SUCCESS_COLOR)
        embed.add_field(name="Channel", value=channel.mention, inline=True)
        embed.add_field(name="Category", value=channel.category.name if channel.category else "None", inline=True)
        await self._send_log(channel.guild.id, "log_channel_server", embed)

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        embed = SyncInkEmbed(title="Channel Deleted", color=ERROR_COLOR)
        embed.add_field(name="Channel Name", value=channel.name, inline=True)
        embed.add_field(name="Category", value=channel.category.name if channel.category else "None", inline=True)
        await self._send_log(channel.guild.id, "log_channel_server", embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(AdvancedLogging(bot))
