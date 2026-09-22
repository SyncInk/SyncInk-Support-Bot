import discord
from discord.ext import commands
from discord import app_commands
from typing import Optional
from datetime import timedelta
from services.mod_service import ModService
from services.settings_service import SettingsService
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed, WARNING_COLOR, ERROR_COLOR, SUCCESS_COLOR, BRAND_ACCENT
from utils.emojis import Emojis
from utils.logger import log

# Authorized channels where moderation history and case records are strictly allowed
STAFF_RECORD_CHANNELS = {1520879581400141856, 1520462320235577454}

class Moderation(commands.Cog):
    """Staff moderation actions (warn, timeout, kick, ban) and channel-restricted case history."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def cog_check(self, ctx: commands.Context) -> bool:
        """Global permission check for the moderation cog: Caller must have staff moderation permissions."""
        if not ctx.guild:
            return False
        is_staff = (
            ctx.author.id == ctx.guild.owner_id or
            await self.bot.is_owner(ctx.author) or
            ctx.author.guild_permissions.moderate_members or
            ctx.author.guild_permissions.kick_members or
            ctx.author.guild_permissions.ban_members or
            ctx.author.guild_permissions.manage_messages or
            ctx.author.guild_permissions.manage_guild or
            ctx.author.guild_permissions.administrator
        )
        if not is_staff:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Access Denied**",
                description="You do not have permission to execute moderation commands.",
                color=ERROR_COLOR
            )
            try:
                await ctx.send(embed=embed, delete_after=5)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return False
        return True

    async def _dispatch_mod_log(self, guild: discord.Guild, embed: discord.Embed):
        """Dispatches an audit log embed to the server's configured moderation log channel."""
        settings = await SettingsService.get_guild_settings(guild.id)
        channel_id = (
            settings.get("log_channel_moderation") or 
            settings.get("automod_log_channel_id") or 
            settings.get("log_channel_id")
        )
        if not channel_id:
            return
        channel = guild.get_channel(int(channel_id))
        if not channel:
            try:
                channel = await guild.fetch_channel(int(channel_id))
            except Exception:
                channel = None
        if channel:
            try:
                await channel.send(embed=embed)
            except discord.Forbidden:
                pass

    @commands.command(name="warn", description="Issue an official warning to a member, DM them, and log the case.")
    @commands.has_permissions(moderate_members=True)
    async def warn(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        # 1. Delete the moderator's command message
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass

        # 2. Hierarchy and safety checks
        if member.id == ctx.guild.owner_id or await self.bot.is_owner(member):
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against the Server Owner."))
            await err.delete(delay=5)
            return
        if member.id == self.bot.user.id or member.id == ctx.author.id:
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against this member."))
            await err.delete(delay=5)
            return
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            err = await ctx.send(embed=ErrorEmbed("You cannot moderate a member with equal or higher role hierarchy."))
            await err.delete(delay=5)
            return

        # 3. Log case to database
        case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "WARN", reason)

        # 4. DM the member with warning message & moderator stated reason
        from utils.ui import send_warn_dm
        dm_delivered = await send_warn_dm(member, reason=reason, server_name=ctx.guild.name, moderator=ctx.author.name)

        # 5. In-channel warning notification pinging the warned member
        warn_embed = SyncInkEmbed(
            title=f"{Emojis.WARNING} **Official Warning Issued**",
            color=WARNING_COLOR
        )
        warn_embed.description = (
            f"{member.mention}, you have received an official warning from the moderation team.\n\n"
            f"**Reason:** {reason}\n\n"
            f"Please adhere to the server rules in <#1520460587522330634> to avoid further actions."
        )
        footer_text = f"Case ID: {case_id}"
        if not dm_delivered:
            footer_text += " • ⚠️ Notice could not be delivered via DM (DMs disabled)"
        warn_embed.set_footer(text=footer_text)

        await ctx.send(content=member.mention, embed=warn_embed)
        
        # 6. Dispatch log embed to moderation log channel (matching exact user screenshot format)
        log_embed = SyncInkEmbed(title=f"❗ Member Warned", color=WARNING_COLOR)
        log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
        log_embed.add_field(name="Reason", value=reason, inline=False)
        log_embed.set_footer(text=f"Case ID: {case_id} • Today at {discord.utils.utcnow().strftime('%H:%M')}")
        log_embed.timestamp = discord.utils.utcnow()
        await self._dispatch_mod_log(ctx.guild, log_embed)

    @commands.command(name="timeout", aliases=["mute"], description="Temporarily restrict a member's chat access.")
    @commands.has_permissions(moderate_members=True)
    async def timeout(self, ctx: commands.Context, member: discord.Member, duration_minutes: int, *, reason: str = "No reason provided"):
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass

        if member.id == ctx.guild.owner_id or await self.bot.is_owner(member):
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against the Server Owner."))
            await err.delete(delay=5)
            return
        if member.id == self.bot.user.id or member.id == ctx.author.id:
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against this member."))
            await err.delete(delay=5)
            return
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            err = await ctx.send(embed=ErrorEmbed("You cannot moderate a member with equal or higher role hierarchy."))
            await err.delete(delay=5)
            return

        try:
            duration = timedelta(minutes=duration_minutes)
            await member.timeout(duration, reason=reason)
            from utils.ui import send_mute_dm
            await send_mute_dm(member, reason, ctx.guild.name)
            case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "TIMEOUT", reason)
            
            # In-channel timeout notice pinging member
            timeout_embed = SyncInkEmbed(
                title=f"{Emojis.WARNING} **Member Timed Out**",
                color=WARNING_COLOR
            )
            timeout_embed.description = (
                f"{member.mention} has been placed on timeout for **{duration_minutes} minutes**.\n\n"
                f"**Reason:** {reason}"
            )
            timeout_embed.set_footer(text=f"Case ID: {case_id}")
            await ctx.send(content=member.mention, embed=timeout_embed)
            
            # Dispatch log
            log_embed = SyncInkEmbed(title=f"⏱️ Member Timed Out", color=WARNING_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Duration", value=f"{duration_minutes} minutes", inline=True)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id} • Today at {discord.utils.utcnow().strftime('%H:%M')}")
            log_embed.timestamp = discord.utils.utcnow()
            await self._dispatch_mod_log(ctx.guild, log_embed)

        except discord.Forbidden:
            embed = ErrorEmbed(
                description="Failed to timeout member due to role hierarchy constraints.",
                resolution="Ensure the bot's role is positioned higher than the target member's top role."
            )
            err = await ctx.send(embed=embed)
            await err.delete(delay=6)

    @commands.command(name="kick", description="Kick a member from the server.")
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass

        if member.id == ctx.guild.owner_id or await self.bot.is_owner(member):
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against the Server Owner."))
            await err.delete(delay=5)
            return
        if member.id == self.bot.user.id or member.id == ctx.author.id:
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against this member."))
            await err.delete(delay=5)
            return
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            err = await ctx.send(embed=ErrorEmbed("You cannot moderate a member with equal or higher role hierarchy."))
            await err.delete(delay=5)
            return

        try:
            await member.kick(reason=reason)
            case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "KICK", reason)
            
            kick_embed = SyncInkEmbed(
                title=f"{Emojis.ALERT} **Member Kicked**",
                color=ERROR_COLOR
            )
            kick_embed.description = f"{member.mention} has been kicked from the server.\n\n**Reason:** {reason}"
            kick_embed.set_footer(text=f"Case ID: {case_id}")
            await ctx.send(embed=kick_embed)
            
            log_embed = SyncInkEmbed(title=f"{Emojis.ALERT} Member Kicked", color=ERROR_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id} • Today at {discord.utils.utcnow().strftime('%H:%M')}")
            log_embed.timestamp = discord.utils.utcnow()
            await self._dispatch_mod_log(ctx.guild, log_embed)
        except discord.Forbidden:
            err = await ctx.send(embed=ErrorEmbed("Cannot kick this member due to role hierarchy."))
            await err.delete(delay=6)

    @commands.command(name="ban", description="Ban a member from the server.")
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass

        if member.id == ctx.guild.owner_id or await self.bot.is_owner(member):
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against the Server Owner."))
            await err.delete(delay=5)
            return
        if member.id == self.bot.user.id or member.id == ctx.author.id:
            err = await ctx.send(embed=ErrorEmbed("You cannot perform moderation actions against this member."))
            await err.delete(delay=5)
            return
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            err = await ctx.send(embed=ErrorEmbed("You cannot moderate a member with equal or higher role hierarchy."))
            await err.delete(delay=5)
            return

        try:
            await member.ban(reason=reason)
            case_id = await ModService.log_case(ctx.guild.id, member.id, ctx.author.id, "BAN", reason)
            
            ban_embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Member Banned**",
                color=ERROR_COLOR
            )
            ban_embed.description = f"{member.mention} has been permanently banned from the server.\n\n**Reason:** {reason}"
            ban_embed.set_footer(text=f"Case ID: {case_id}")
            await ctx.send(embed=ban_embed)
            
            log_embed = SyncInkEmbed(title=f"{Emojis.REFUSED} Member Banned", color=ERROR_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id} • Today at {discord.utils.utcnow().strftime('%H:%M')}")
            log_embed.timestamp = discord.utils.utcnow()
            await self._dispatch_mod_log(ctx.guild, log_embed)
        except discord.Forbidden:
            err = await ctx.send(embed=ErrorEmbed("Cannot ban this member due to role hierarchy."))
            await err.delete(delay=6)

    @commands.command(name="unban", description="Unban a user from the server.")
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx: commands.Context, user_id: int, *, reason: str = "No reason provided"):
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass

        try:
            user = await self.bot.fetch_user(user_id)
            await ctx.guild.unban(user, reason=reason)
            case_id = await ModService.log_case(ctx.guild.id, user.id, ctx.author.id, "UNBAN", reason)
            
            await ctx.send(embed=SuccessEmbed(f"{user.mention} has been unbanned."))
            
            log_embed = SyncInkEmbed(title=f"{Emojis.APPROVED} Member Unbanned", color=SUCCESS_COLOR)
            log_embed.set_author(name=f"{user} ({user.id})", icon_url=user.display_avatar.url)
            log_embed.add_field(name="Moderator", value=ctx.author.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            log_embed.set_footer(text=f"Case ID: {case_id} • Today at {discord.utils.utcnow().strftime('%H:%M')}")
            log_embed.timestamp = discord.utils.utcnow()
            await self._dispatch_mod_log(ctx.guild, log_embed)
        except discord.NotFound:
            err = await ctx.send(embed=ErrorEmbed("User not found or not banned."))
            await err.delete(delay=5)
        except Exception as e:
            err = await ctx.send(embed=ErrorEmbed(f"Failed to unban: {e}"))
            await err.delete(delay=5)

    @commands.command(name="purge", aliases=["clear"], description="Bulk delete recent messages in the current channel.")
    @commands.has_permissions(manage_messages=True)
    async def purge(self, ctx: commands.Context, amount: int = 10):
        if amount < 1 or amount > 100:
            err = await ctx.send(embed=ErrorEmbed("Please specify an amount between 1 and 100."))
            await err.delete(delay=5)
            return
        try:
            deleted = await ctx.channel.purge(limit=amount + 1)
            msg = await ctx.send(embed=SuccessEmbed(f"Successfully deleted {len(deleted) - 1} messages."))
            await msg.delete(delay=5)
        except Exception as e:
            err = await ctx.send(embed=ErrorEmbed(description="An error occurred while purging messages.", resolution=f"Details: `{e}`"))
            await err.delete(delay=5)

    # -------------------------------------------------------------
    # MODERATION HISTORY & CASE REGISTRY (STRICTLY CHANNEL RESTRICTED)
    # -------------------------------------------------------------

    @commands.command(
        name="modlogs", 
        aliases=["modhistory", "history", "cases", "warnings", "infractions"],
        description="View moderation records for a member or recent server cases (Staff channel only)."
    )
    async def modlogs(self, ctx: commands.Context, target: Optional[discord.Member] = None):
        # 1. Strictly enforce authorized staff channels
        if ctx.channel.id not in STAFF_RECORD_CHANNELS:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            restricted_embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Channel Restriction**",
                description="Moderation records & history can only be viewed in authorized staff channels (<#1520879581400141856>, <#1520462320235577454>).",
                color=ERROR_COLOR
            )
            try:
                await ctx.send(embed=restricted_embed, delete_after=5)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        action_icons = {
            "WARN": "⚠️",
            "TIMEOUT": "⏱️",
            "JAIL": "🔒",
            "KICK": "🚪",
            "BAN": "🔨",
            "UNBAN": "🔓",
            "UNJAIL": "🔓"
        }

        # 2. Case A: Target member specified -> Show member's full infraction history
        if target:
            cases = await ModService.get_user_cases(ctx.guild.id, target.id)
            counts = await ModService.count_user_cases(ctx.guild.id, target.id)
            
            embed = SyncInkEmbed(
                title=f"{Emojis.MODERATION} Moderation History: {target.display_name}",
                color=WARNING_COLOR if cases else SUCCESS_COLOR
            )
            embed.set_author(name=f"{target} ({target.id})", icon_url=target.display_avatar.url)
            
            summary = (
                f"**Total Infractions:** `{len(cases)}`\n"
                f"⚠️ **Warns:** `{counts.get('WARN', 0)}` | "
                f"⏱️ **Timeouts:** `{counts.get('TIMEOUT', 0)}` | "
                f"🔒 **Jails:** `{counts.get('JAIL', 0)}`\n"
                f"🚪 **Kicks:** `{counts.get('KICK', 0)}` | "
                f"🔨 **Bans:** `{counts.get('BAN', 0)}`"
            )
            embed.add_field(name="Infraction Summary", value=summary, inline=False)
            
            if not cases:
                embed.description = f"{Emojis.CHECK_YES} **Clean Record**: No recorded moderation infractions."
            else:
                lines = []
                for c in cases[:10]:
                    icon = action_icons.get(c['action'], "•")
                    ts = int(c['created_at'].timestamp()) if hasattr(c['created_at'], 'timestamp') else 0
                    ts_str = f"<t:{ts}:R>" if ts else ""
                    reason_clean = (c.get('reason') or 'No reason provided')[:80]
                    lines.append(
                        f"{icon} **Case #{c['case_id']}** • `{c['action']}` • {ts_str}\n"
                        f"╰ **Mod:** <@{c['mod_id']}> | **Reason:** {reason_clean}"
                    )
                
                embed.add_field(
                    name=f"Infraction Records ({min(len(cases), 10)} of {len(cases)})",
                    value="\n".join(lines),
                    inline=False
                )
                if len(cases) > 10:
                    embed.set_footer(text=f"Showing 10 of {len(cases)} cases • Use ?case <id> to view specific case details")
                else:
                    embed.set_footer(text=f"SyncInk Moderation Records • Requested by {ctx.author}")

            await ctx.send(embed=embed)
            return

        # 3. Case B: No target specified -> Show recent server moderation registry
        recent_cases = await ModService.get_recent_cases(ctx.guild.id, limit=12)
        if not recent_cases:
            embed = SyncInkEmbed(
                title=f"{Emojis.MODERATION} Server Moderation Registry",
                description=f"{Emojis.CHECK_YES} No moderation cases recorded on this server yet.",
                color=SUCCESS_COLOR
            )
            await ctx.send(embed=embed)
            return

        embed = SyncInkEmbed(
            title=f"{Emojis.MODERATION} Server Moderation Registry",
            description="Recent staff moderation actions across the server (Latest 12 cases):",
            color=BRAND_ACCENT
        )
        lines = []
        for c in recent_cases:
            icon = action_icons.get(c['action'], "•")
            ts = int(c['created_at'].timestamp()) if hasattr(c['created_at'], 'timestamp') else 0
            ts_str = f"<t:{ts}:R>" if ts else ""
            reason_clean = (c.get('reason') or 'No reason provided')[:80]
            lines.append(
                f"{icon} **Case #{c['case_id']}** `{c['action']}` on <@{c['user_id']}> • {ts_str}\n"
                f"╰ **Mod:** <@{c['mod_id']}> | **Reason:** {reason_clean}"
            )
        embed.add_field(name="Recent Actions", value="\n".join(lines), inline=False)
        embed.set_footer(text="Use ?modlogs @member for user history • ?case <id> for full details")
        await ctx.send(embed=embed)

    @commands.command(name="case", description="View full details of a specific moderation case (Staff channel only).")
    async def case_detail(self, ctx: commands.Context, case_id: int):
        # Enforce authorized staff channels
        if ctx.channel.id not in STAFF_RECORD_CHANNELS:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            restricted_embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Channel Restriction**",
                description="Moderation records can only be viewed in authorized staff channels (<#1520879581400141856>, <#1520462320235577454>).",
                color=ERROR_COLOR
            )
            try:
                await ctx.send(embed=restricted_embed, delete_after=5)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        c = await ModService.get_case(ctx.guild.id, case_id)
        if not c:
            err = await ctx.send(embed=ErrorEmbed(f"Case `#{case_id}` was not found in this server's records."))
            await err.delete(delay=5)
            return

        action_icons = {
            "WARN": "⚠️",
            "TIMEOUT": "⏱️",
            "JAIL": "🔒",
            "KICK": "🚪",
            "BAN": "🔨",
            "UNBAN": "🔓",
            "UNJAIL": "🔓"
        }
        icon = action_icons.get(c['action'], "🛡️")
        embed = SyncInkEmbed(
            title=f"{icon} Case #{c['case_id']} Details",
            color=WARNING_COLOR if c['action'] in ("WARN", "TIMEOUT", "JAIL") else ERROR_COLOR
        )
        embed.add_field(name="Action", value=f"`{c['action']}`", inline=True)
        embed.add_field(name="Target Member", value=f"<@{c['user_id']}> (`{c['user_id']}`)", inline=True)
        embed.add_field(name="Moderator", value=f"<@{c['mod_id']}> (`{c['mod_id']}`)", inline=True)
        embed.add_field(name="Reason", value=c.get('reason') or "No reason provided", inline=False)
        ts = int(c['created_at'].timestamp()) if hasattr(c['created_at'], 'timestamp') else 0
        if ts:
            embed.add_field(name="Date", value=f"<t:{ts}:F> (<t:{ts}:R>)", inline=False)
        embed.set_footer(text=f"SyncInk Moderation Records • Case #{case_id}")
        await ctx.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
