import discord
from discord.ext import commands
from discord import app_commands
from services.mod_service import ModService
from services.settings_service import SettingsService
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed, WARNING_COLOR, ERROR_COLOR
from utils.emojis import Emojis
from utils.permissions import has_permission
from datetime import timedelta
from utils.logger import log

class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def cog_check(self, ctx: commands.Context) -> bool:
        from utils.permissions import require_staff_channel
        return await require_staff_channel(ctx)

    async def _dispatch_mod_log(self, guild: discord.Guild, embed: discord.Embed):
        settings = await SettingsService.get_guild_settings(guild.id)
        channel_id = settings.get("log_channel_moderation")
        if not channel_id:
            return
        channel = guild.get_channel(channel_id)
        if channel:
            try:
                await channel.send(embed=embed)
            except discord.Forbidden:
                pass

    @commands.command(name="warn", description="Issue a formal warning to a server member.")
    @commands.has_permissions(moderate_members=True)
    async def warn(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "WARN", reason)
        await ctx.send(embed=SuccessEmbed(f"Warning issued to {member.mention} for: `{reason}`"))
        
        # Dispatch log
        log_embed = SyncInkEmbed(title=f"{Emojis.WARNING} Member Warned", color=WARNING_COLOR)
        log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
        log_embed.add_field(name="Reason", value=reason, inline=False)
        log_embed.set_footer(text=f"Case ID: {case_id}")
        await self._dispatch_mod_log(ctx.guild, log_embed)

    @commands.command(name="timeout", aliases=["mute"], description="Temporarily restrict a member's chat access.")
    @commands.has_permissions(moderate_members=True)
    async def timeout(self, ctx: commands.Context, member: discord.Member, duration_minutes: int, *, reason: str = "No reason provided"):
        try:
            duration = timedelta(minutes=duration_minutes)
            await member.timeout(duration, reason=reason)
            from utils.ui import send_mute_dm
            await send_mute_dm(member, reason, ctx.guild.name)
            case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "TIMEOUT", reason)
            
            embed = SuccessEmbed(f"{member.mention} has been timed out for {duration_minutes} minutes.")
            embed.add_field(name="Reason", value=reason, inline=False)
            await ctx.send(embed=embed)
            
            # Dispatch log
            log_embed = SyncInkEmbed(title=f"{Emojis.WARNING} Member Timed Out", color=WARNING_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Duration", value=f"{duration_minutes} minutes", inline=True)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id}")
            await self._dispatch_mod_log(ctx.guild, log_embed)

        except discord.Forbidden:
            embed = ErrorEmbed(
                description="Failed to timeout member due to role hierarchy constraints.",
                resolution="Ensure the bot's role is positioned higher than the target member's top role."
            )
            await ctx.send(embed=embed)

    @commands.command(name="kick", description="Kick a member from the server.")
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        try:
            await member.kick(reason=reason)
            case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "KICK", reason)
            
            await ctx.send(embed=SuccessEmbed(f"{member.mention} has been kicked."))
            
            log_embed = SyncInkEmbed(title=f"{Emojis.ALERT} Member Kicked", color=ERROR_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id}")
            await self._dispatch_mod_log(ctx.guild, log_embed)
        except discord.Forbidden:
            await ctx.send(embed=ErrorEmbed("Cannot kick this member due to role hierarchy."))

    @commands.command(name="ban", description="Ban a member from the server.")
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        try:
            await member.ban(reason=reason)
            case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "BAN", reason)
            
            await ctx.send(embed=SuccessEmbed(f"{member.mention} has been banned."))
            
            log_embed = SyncInkEmbed(title=f"{Emojis.REFUSED} Member Banned", color=ERROR_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id}")
            await self._dispatch_mod_log(ctx.guild, log_embed)
        except discord.Forbidden:
            await ctx.send(embed=ErrorEmbed("Cannot ban this member due to role hierarchy."))

    @commands.command(name="unban", description="Unban a user from the server.")
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx: commands.Context, user_id: int, *, reason: str = "No reason provided"):
        try:
            user = await self.bot.fetch_user(user_id)
            await ctx.guild.unban(user, reason=reason)
            case_id = await ModService.log_case(ctx.guild.id, user.id, ctx.author.id, "UNBAN", reason)
            
            await ctx.send(embed=SuccessEmbed(f"{user.mention} has been unbanned."))
            
            from utils.ui import SUCCESS_COLOR
            log_embed = SyncInkEmbed(title=f"{Emojis.APPROVED} Member Unbanned", color=SUCCESS_COLOR)
            log_embed.set_author(name=f"{user} ({user.id})", icon_url=user.display_avatar.url)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id}")
            await self._dispatch_mod_log(ctx.guild, log_embed)
        except discord.NotFound:
            await ctx.send(embed=ErrorEmbed("User not found or not banned."))
        except Exception as e:
            await ctx.send(embed=ErrorEmbed(f"Failed to unban: {e}"))

    @commands.command(name="purge", aliases=["clear"], description="Bulk delete recent messages in the current channel.")
    @commands.has_permissions(manage_messages=True)
    async def purge(self, ctx: commands.Context, amount: int = 10):
        if amount < 1 or amount > 100:
            await ctx.send(embed=ErrorEmbed("Please specify an amount between 1 and 100."))
            return
        try:
            deleted = await ctx.channel.purge(limit=amount + 1)
            msg = await ctx.send(embed=SuccessEmbed(f"Successfully deleted {len(deleted) - 1} messages."))
            await msg.delete(delay=5)
        except Exception as e:
            await ctx.send(embed=ErrorEmbed(description="An error occurred while purging messages.", resolution=f"Details: `{e}`"))

async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
