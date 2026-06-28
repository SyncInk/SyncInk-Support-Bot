import discord
from discord.ext import commands
from services.settings_service import SettingsService
from utils.ui import SuccessEmbed, ErrorEmbed
from utils.permissions import has_permission

class Setup(commands.Cog):
    """Administrator configuration commands (hidden from slash menu)."""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def cog_check(self, ctx: commands.Context) -> bool:
        """Globally require administrator permissions for all commands in this cog."""
        if not ctx.author.guild_permissions.administrator:
            raise commands.MissingPermissions(["administrator"])
        return True
        
    async def _update_log_channel(self, ctx: commands.Context, key: str, channel: discord.TextChannel, name: str):
        try:
            await SettingsService.update_setting(ctx.guild.id, key, channel.id)
            await ctx.send(embed=SuccessEmbed(f"**{name}** have been successfully bound to {channel.mention}."))
        except Exception as e:
            await ctx.send(embed=ErrorEmbed(f"Failed to configure {name}: {e}"))

    @commands.command(name="set_message_logs", hidden=True)
    async def set_message_logs(self, ctx: commands.Context, channel: discord.TextChannel):
        """Configure the message log channel (Deletes, Edits, Bulk Delete)."""
        await self._update_log_channel(ctx, "log_channel_message", channel, "Message Logs")

    @commands.command(name="set_member_logs", hidden=True)
    async def set_member_logs(self, ctx: commands.Context, channel: discord.TextChannel):
        """Configure the member log channel (Join, Leave, Nickname)."""
        await self._update_log_channel(ctx, "log_channel_member", channel, "Member Logs")

    @commands.command(name="set_moderation_logs", hidden=True)
    async def set_moderation_logs(self, ctx: commands.Context, channel: discord.TextChannel):
        """Configure the moderation log channel (Warn, Kick, Ban)."""
        await self._update_log_channel(ctx, "log_channel_moderation", channel, "Moderation Logs")

    @commands.command(name="set_server_logs", hidden=True)
    async def set_server_logs(self, ctx: commands.Context, channel: discord.TextChannel):
        """Configure the server log channel (Roles, Channels)."""
        await self._update_log_channel(ctx, "log_channel_server", channel, "Server Logs")

    @commands.command(name="set_voice_logs", hidden=True)
    async def set_voice_logs(self, ctx: commands.Context, channel: discord.TextChannel):
        """Configure the voice log channel (Join, Leave, Move)."""
        await self._update_log_channel(ctx, "log_channel_voice", channel, "Voice Logs")

    @commands.command(name="set_verification_logs", hidden=True)
    async def set_verification_logs(self, ctx: commands.Context, channel: discord.TextChannel):
        """Configure the verification log channel (Started, Completed, Failed)."""
        await self._update_log_channel(ctx, "log_channel_verification", channel, "Verification Logs")

    @commands.Cog.listener()
    async def on_command_error(self, ctx: commands.Context, error: commands.CommandError):
        """Handle errors specific to setup commands."""
        if hasattr(ctx.command, 'cog_name') and ctx.command.cog_name == 'Setup':
            if isinstance(error, commands.MissingRequiredArgument):
                await ctx.send(embed=ErrorEmbed(f"Missing required argument: `{error.param.name}`. Please mention a valid channel."))
            elif isinstance(error, commands.ChannelNotFound):
                await ctx.send(embed=ErrorEmbed("I could not find that channel. Make sure you `#mention` it correctly."))

async def setup(bot: commands.Bot):
    await bot.add_cog(Setup(bot))
