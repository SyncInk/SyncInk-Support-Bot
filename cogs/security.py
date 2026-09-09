import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from services.security_service import SecurityService
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed, BRAND_ACCENT, SUCCESS_COLOR, WARNING_COLOR, ERROR_COLOR
from utils.emojis import Emojis, EmojiPartials
from utils.permissions import has_permission
from utils.logger import log
from database import db
import asyncio
import re

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Verify Now", style=discord.ButtonStyle.primary, custom_id="persistent_verify_btn", emoji=EmojiPartials.APPROVED)
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        role_id = settings.get("verification_role_id")
        unverified_id = settings.get("unverified_role_id")
        
        if not settings.get('verification_enabled'):
            embed = ErrorEmbed(
                description="The verification system is currently disabled on this server.",
                resolution="A server administrator must enable verification via the `?config` or `/security` dashboard."
            )
            embed.title = "Verification Disabled"
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        
        if not role_id or not unverified_id:
            embed = ErrorEmbed(
                description="The verification system is missing required role configurations.",
                resolution="A server administrator must select both roles via the `?config` or `/security` dashboard."
            )
            embed.title = "Configuration Error"
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
            
        role = interaction.guild.get_role(role_id)
        unverified_role = interaction.guild.get_role(unverified_id)
        
        if not role or not unverified_role:
            embed = ErrorEmbed(
                description="The designated verification roles could not be found.",
                resolution="A server administrator must re-select valid roles via the `?config` or `/security` dashboard."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
            
        # Check if user is jailed or quarantined (Active jail in DB or possessing jail/quarantine role)
        from services.automod_service import AutomodService
        is_jailed = await AutomodService.is_user_jailed(interaction.guild, interaction.user)
        if not is_jailed:
            active_jail = await db.fetchrow(
                "SELECT id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)",
                interaction.guild.id, interaction.user.id
            )
            if active_jail:
                is_jailed = True

        if is_jailed:
            # Strip verified role if user somehow possesses it
            if role and role in interaction.user.roles:
                try:
                    await interaction.user.remove_roles(role, reason="Jailed member attempted verification")
                except discord.Forbidden:
                    pass

            # Re-apply jail/quarantine role if missing
            jail_role_id = settings.get("quarantine_role_id") or settings.get("jail_role_id")
            if jail_role_id:
                jail_role = interaction.guild.get_role(int(jail_role_id))
                if jail_role and jail_role not in interaction.user.roles:
                    try:
                        await interaction.user.add_roles(jail_role, reason="Re-applying quarantine role on verification attempt")
                    except discord.Forbidden:
                        pass

            denied_embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Verification Denied**",
                color=ERROR_COLOR
            )
            denied_embed.description = (
                f"{Emojis.REFUSED} **Access Denied: You are currently Quarantined / Jailed.**\n\n"
                f"You cannot complete verification or access the server while serving a disciplinary sentence.\n"
                f"If you wish to appeal your penalty, please use the official appeal channel or contact the administration team."
            )
            await interaction.response.send_message(embed=denied_embed, ephemeral=True)
            return

        if role in interaction.user.roles:
            embed = SyncInkEmbed(title="Already Verified", description="You already possess the verification role and full access to the server.")
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        try:
            await interaction.user.add_roles(role, reason="Passed Verification Checkpoint")
            if unverified_role in interaction.user.roles:
                await interaction.user.remove_roles(unverified_role, reason="Passed Verification Checkpoint")
            
            success_embed = SuccessEmbed("Verification completed.")
            success_embed.title = "Welcome to SyncInk!"
            success_embed.description = (
                "• Your account has been successfully verified.\n"
                "• You now have access to the entire server.\n"
                "• If you need assistance, visit the Support channels."
            )
            await interaction.response.send_message(embed=success_embed, ephemeral=True)

            # Dispatch Verification Log
            log_channel_id = settings.get('log_channel_verification')
            if log_channel_id:
                log_chan = interaction.guild.get_channel(log_channel_id)
                if log_chan:
                    log_embed = SyncInkEmbed(title="Member Verified", color=SUCCESS_COLOR)
                    log_embed.set_author(name=f"{interaction.user} ({interaction.user.id})", icon_url=interaction.user.display_avatar.url)
                    log_embed.add_field(name="Action", value="Completed Verification", inline=False)
                    log_embed.add_field(name="Assigned Role", value=role.mention, inline=True)
                    if unverified_role:
                        log_embed.add_field(name="Removed Role", value=unverified_role.mention, inline=True)
                    try:
                        await log_chan.send(embed=log_embed)
                    except discord.Forbidden:
                        pass
                        
            # Send welcome message if configured
            welcome_channel_id = settings.get('welcome_channel_id')
            if welcome_channel_id:
                channel = interaction.guild.get_channel(welcome_channel_id)
                if channel:
                    custom_msg = settings.get('welcome_message')
                    if custom_msg:
                        desc = custom_msg.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name)
                    else:
                        desc = (
                            f"Welcome to the {interaction.guild.name}, {interaction.user.mention}!\n\n"
                            "We are thrilled to have you here. To get started, please check out our core channels:\n"
                            "📢 **Announcements** - Stay updated with our latest news.\n"
                            "💬 **Support Chat** - Get help from our dedicated team.\n"
                            "💡 **Feature Requests** - Share your ideas for the platform.\n"
                            "📦 **Products** - Explore what we have to offer."
                        )
                    
                    w_embed = SyncInkEmbed(title=f"Welcome to {interaction.guild.name}", description=desc)
                    w_embed.set_thumbnail(url=interaction.user.display_avatar.url)
                    try:
                        await channel.send(content=interaction.user.mention, embed=w_embed)
                    except discord.Forbidden:
                        pass
        except discord.Forbidden:
            embed = ErrorEmbed(
                description="The bot lacks the necessary permissions to assign or remove roles.",
                resolution="Ensure the bot's role is placed **above** the verified and unverified roles in the server settings."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(description="An unexpected error occurred during verification.", resolution=f"Details: `{e}`"), ephemeral=True)
            log.error(f"Verification error: {e}")

class Security(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        settings = await SettingsService.get_guild_settings(member.guild.id)

        # -------------------------------------------------------------
        # 1. MASS BOT ADD PROTECTION
        # -------------------------------------------------------------
        if member.bot:
            if settings.get('mass_bot_protection_enabled', True):
                await asyncio.sleep(1.5) # allow audit log to settle
                adder = None
                try:
                    async for entry in member.guild.audit_logs(action=discord.AuditLogAction.bot_add, limit=3):
                        if entry.target and entry.target.id == member.id:
                            adder = entry.user
                            break
                except Exception:
                    pass

                if adder:
                    # Check if adder is Server Owner or whitelisted
                    is_authorized = (adder.id == member.guild.owner_id) or await SecurityService.is_whitelisted(member.guild.id, "user", str(adder.id))
                    if not is_authorized:
                        try:
                            await member.kick(reason=f"Mass Bot Protection: Unauthorized bot added by {adder} ({adder.id}).")
                            log.warning(f"Kicked unauthorized bot {member.id} added by {adder.id}")

                            # Dispatch security alert
                            log_chan_id = settings.get("log_channel_moderation") or settings.get("automod_log_channel_id")
                            if log_chan_id:
                                ch = member.guild.get_channel(log_chan_id)
                                if ch:
                                    alert_embed = SyncInkEmbed(
                                        title=f"{Emojis.ALERT} Unauthorized Bot Kicked",
                                        color=ERROR_COLOR
                                    )
                                    alert_embed.add_field(name="Bot", value=f"{member.mention} (`{member.id}`)", inline=True)
                                    alert_embed.add_field(name="Added By", value=f"{adder.mention} (`{adder.id}`)", inline=True)
                                    alert_embed.add_field(name="Action Taken", value="**Instantly Kicked**", inline=False)
                                    await ch.send(embed=alert_embed)
                        except Exception as e:
                            log.error(f"Failed to kick unauthorized bot {member.id}: {e}")
                        return
            return

        # -------------------------------------------------------------
        # 2. ANTI-RAID & JOIN VELOCITY CHECK
        # -------------------------------------------------------------
        is_burst, current_state, action_taken = await SecurityService.record_member_join(member.guild, member)
        if action_taken:
            # High-risk account auto-quarantined during raid state
            log_chan_id = settings.get("log_channel_moderation") or settings.get("automod_log_channel_id")
            if log_chan_id:
                ch = member.guild.get_channel(log_chan_id)
                if ch:
                    alert_embed = SyncInkEmbed(
                        title=f"{Emojis.ALERT} Anti-Raid Shield Triggered",
                        color=ERROR_COLOR
                    )
                    alert_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
                    alert_embed.add_field(name="Active Raid State", value=f"`{current_state}`", inline=True)
                    alert_embed.add_field(name="Action", value=f"**{action_taken}**", inline=True)
                    try:
                        await ch.send(embed=alert_embed)
                    except Exception:
                        pass
            return # Block regular verification setup while quarantined

        # -------------------------------------------------------------
        # 3. JAIL / QUARANTINE EVASION PROTECTION
        # -------------------------------------------------------------
        active_jail = await db.fetchrow(
            "SELECT id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)",
            member.guild.id, member.id
        )
        if active_jail:
            jail_role_id = settings.get('quarantine_role_id') or settings.get('jail_role_id')
            if jail_role_id:
                jail_role = member.guild.get_role(int(jail_role_id))
                if jail_role:
                    try:
                        await member.add_roles(jail_role, reason="Jail Evasion Protection: Re-applied quarantine role on join.")
                    except discord.Forbidden:
                        pass
            return

        # -------------------------------------------------------------
        # 4. VERIFICATION / WELCOME FLOW
        # -------------------------------------------------------------
        if settings.get('verification_enabled'):
            unverified_id = settings.get('unverified_role_id')
            if unverified_id:
                unverified_role = member.guild.get_role(unverified_id)
                if unverified_role:
                    try:
                        await member.add_roles(unverified_role, reason="Assigned Unverified role on join")
                    except Exception as e:
                        log.error(f"Failed to assign unverified role to {member.id}: {e}")

            # Dispatch Verification Log
            log_channel_id = settings.get('log_channel_verification')
            if log_channel_id:
                log_chan = member.guild.get_channel(log_channel_id)
                if log_chan:
                    log_embed = SyncInkEmbed(title="Verification Started", color=WARNING_COLOR)
                    log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
                    log_embed.add_field(name="Action", value="Member Joined (Unverified)", inline=False)
                    try:
                        await log_chan.send(embed=log_embed)
                    except discord.Forbidden:
                        pass
        else:
            # If verification is disabled, member instantly gets access. Send welcome message now.
            welcome_channel_id = settings.get('welcome_channel_id')
            if welcome_channel_id:
                channel = member.guild.get_channel(welcome_channel_id)
                if channel:
                    custom_msg = settings.get('welcome_message')
                    if custom_msg:
                        desc = custom_msg.replace("{user}", member.mention).replace("{server}", member.guild.name)
                    else:
                        desc = (
                            f"Welcome to the {member.guild.name}, {member.mention}!\n\n"
                            "We are thrilled to have you here. To get started, please check out our core channels:\n"
                            "📢 **Announcements** - Stay updated with our latest news.\n"
                            "💬 **Support Chat** - Get help from our dedicated team.\n"
                            "💡 **Feature Requests** - Share your ideas for the platform.\n"
                            "📦 **Products** - Explore what we have to offer."
                        )
                    
                    w_embed = SyncInkEmbed(title=f"Welcome to {member.guild.name}", description=desc)
                    w_embed.set_thumbnail(url=member.display_avatar.url)
                    try:
                        await channel.send(content=member.mention, embed=w_embed)
                    except discord.Forbidden:
                        pass

    # -------------------------------------------------------------
    # 5. ANTI-NUKE AUDIT LOG STREAMER
    # -------------------------------------------------------------
    @commands.Cog.listener()
    async def on_audit_log_entry_create(self, entry: discord.AuditLogEntry):
        """Streams Discord audit log events in real-time to intercept rogue moderators."""
        if not entry.guild or not entry.user or entry.user.bot:
            return

        action = entry.action
        destructive_actions = {
            discord.AuditLogAction.channel_delete: "Channel Deleted",
            discord.AuditLogAction.channel_create: "Channel Created",
            discord.AuditLogAction.role_delete: "Role Deleted",
            discord.AuditLogAction.role_create: "Role Created",
            discord.AuditLogAction.kick: "Member Kicked",
            discord.AuditLogAction.ban: "Member Banned",
            discord.AuditLogAction.webhook_delete: "Webhook Deleted",
            discord.AuditLogAction.webhook_create: "Webhook Created",
        }

        action_name = destructive_actions.get(action)
        if action_name:
            target_str = str(entry.target) if entry.target else "Unknown Target"
            await SecurityService.record_audit_action(
                entry.guild, entry.user, action_name, details=f"Target: `{target_str}`"
            )
            return

        # Check dangerous permission escalations on role updates
        if action == discord.AuditLogAction.role_update:
            try:
                after = getattr(entry.after, 'permissions', None)
                if after:
                    dangerous = after.administrator or after.manage_guild or after.ban_members or after.mention_everyone
                    if dangerous:
                        await SecurityService.record_audit_action(
                            entry.guild, entry.user, "Dangerous Role Permissions Granted", 
                            details=f"Modified role: `{entry.target}`"
                        )
            except Exception:
                pass

    # -------------------------------------------------------------
    # 6. COMMANDS
    # -------------------------------------------------------------
    @commands.command(name="spawn_verification", description="Deploy the advanced verification checkpoint to the current channel.")
    @commands.has_permissions(administrator=True)
    async def spawn_verification(self, ctx: commands.Context):
        settings = await SettingsService.get_guild_settings(ctx.guild.id)
        if not settings.get('verification_enabled') or not settings.get('verification_role_id') or not settings.get('unverified_role_id'):
            embed = ErrorEmbed(
                description="The verification module must be fully configured before deployment.",
                resolution="Use the `?config` or `/security` dashboard to assign both Verified and Unverified roles, then enable verification."
            )
            await ctx.send(embed=embed)
            return

        embed = SyncInkEmbed(title=f"{Emojis.RULES} Security Checkpoint", color=BRAND_ACCENT)
        embed.set_author(name="Server Security", icon_url="https://cdn.discordapp.com/emojis/1547034265076760707.png")
        embed.description = "To protect our community from spam, automated accounts, malicious users, and unauthorized access, all members must complete verification before accessing the server."
        embed.add_field(name="", value=f"> {Emojis.LOCK} Please click the button below to verify your account and instantly unlock server access.", inline=False)
        
        await ctx.channel.send(embed=embed, view=VerificationView())
        await ctx.send(embed=SuccessEmbed("The security checkpoint has been successfully deployed to this channel."))

async def setup(bot: commands.Bot):
    await bot.add_cog(Security(bot))
