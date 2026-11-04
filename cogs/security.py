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
import os
import secrets
import hashlib
import datetime

class WebVerificationRedirectView(discord.ui.View):
    def __init__(self, token: str):
        super().__init__(timeout=300)
        verify_url = f"https://syncink.site/verify?session={token}"
        self.add_item(
            discord.ui.Button(
                label="Continue to Web Verification",
                style=discord.ButtonStyle.link,
                url=verify_url,
                emoji=EmojiPartials.APPROVED
            )
        )

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Verify Now", style=discord.ButtonStyle.primary, custom_id="persistent_verify_btn", emoji=EmojiPartials.APPROVED)
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        # 1. Immediately defer to avoid Discord 3-second timeout ("didn't respond")
        await interaction.response.defer(ephemeral=True)

        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        role_id = settings.get("verification_role_id") or "1520871574088056952"
        unverified_id = settings.get("unverified_role_id") or "1520870810775060592"
        
        if not settings.get('verification_enabled') and settings.get('verification_enabled') is not None:
            embed = ErrorEmbed(
                description="The verification system is currently disabled on this server.",
                resolution="A server administrator must enable verification via the `?config` or `/security` dashboard."
            )
            embed.title = "Verification Disabled"
            await interaction.followup.send(embed=embed, ephemeral=True)
            return
        
        role = interaction.guild.get_role(int(role_id))
        unverified_role = interaction.guild.get_role(int(unverified_id))
        
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
            await interaction.followup.send(embed=denied_embed, ephemeral=True)
            return

        UPDATES_ROLE_ID = 1547084124983132240

        # Check if already verified
        if role and role in interaction.user.roles:
            updates_role = interaction.guild.get_role(UPDATES_ROLE_ID)
            if updates_role and updates_role not in interaction.user.roles:
                try:
                    await interaction.user.add_roles(updates_role, reason="Verification: Assigned Updates role")
                except Exception:
                    pass
            embed = SyncInkEmbed(
                title="Already Verified",
                description="You already possess the Verified role and have full community access to the server."
            )
            await interaction.followup.send(embed=embed, ephemeral=True)
            return

        # 2. Generate a secure, single-use, 5-minute verification session
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        session_id = secrets.token_hex(16)
        expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=5)

        try:
            # Invalidate any lingering pending session for this user
            await db.execute(
                "UPDATE verification_sessions SET status = 'EXPIRED' WHERE user_id = $1 AND guild_id = $2 AND status = 'PENDING'",
                str(interaction.user.id), str(interaction.guild.id)
            )
            # Insert fresh session
            await db.execute(
                """
                INSERT INTO verification_sessions (session_id, session_token_hash, user_id, guild_id, status, expires_at)
                VALUES ($1, $2, $3, $4, 'PENDING', $5)
                """,
                session_id, token_hash, str(interaction.user.id), str(interaction.guild.id), expires_at
            )
        except Exception as e:
            log.error(f"Error persisting verification session in database: {e}")
            # If database table is initializing, attempt graceful self-heal
            try:
                await db.execute(
                    """
                    CREATE TABLE IF NOT EXISTS verification_sessions (
                        id SERIAL PRIMARY KEY,
                        session_id VARCHAR(128) UNIQUE NOT NULL,
                        session_token_hash VARCHAR(128) UNIQUE NOT NULL,
                        user_id VARCHAR(64) NOT NULL,
                        guild_id VARCHAR(64) NOT NULL,
                        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
                        ip_address VARCHAR(128),
                        user_agent TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        completed_at TIMESTAMP WITH TIME ZONE,
                        result_details JSONB DEFAULT '{}'::jsonb
                    );
                    """
                )
                await db.execute(
                    """
                    INSERT INTO verification_sessions (session_id, session_token_hash, user_id, guild_id, status, expires_at)
                    VALUES ($1, $2, $3, $4, 'PENDING', $5)
                    """,
                    session_id, token_hash, str(interaction.user.id), str(interaction.guild.id), expires_at
                )
            except Exception as e2:
                log.error(f"Fallback verification session creation failed: {e2}")

        # 3. Present ephemeral response with direct web portal link
        reply_embed = SyncInkEmbed(
            title="<:trusted_user:1547621146558730340> **Identity Verification**",
            color=BRAND_ACCENT
        )
        reply_embed.description = (
            f"Hello **{interaction.user.name}**!\n\n"
            f"To protect the community and unlock server access, please click the button below to complete verification on our official portal."
        )
        reply_embed.add_field(
            name="⏱️ Session Validity",
            value="This link is single-use and expires in **5 minutes**.",
            inline=False
        )
        reply_embed.add_field(
            name="🛡️ Roles Granted",
            value=f"• <@&{role_id}> (Verified)\n• <@&{UPDATES_ROLE_ID}> (UPDATES)",
            inline=False
        )
        reply_embed.set_footer(
            text="SyncInk Platform | Server Security",
            icon_url="https://files.catbox.moe/74l9su.png"
        )

        redirect_view = WebVerificationRedirectView(raw_token)
        await interaction.followup.send(embed=reply_embed, view=redirect_view, ephemeral=True)

class Security(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        primary_id = int(os.getenv("TARGET_GUILD_ID", os.getenv("SUPPORT_GUILD_ID", "1520457643842342912")))
        if member.guild.id != primary_id:
            return

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
        if settings.get('verification_enabled', True):
            unverified_id = settings.get('unverified_role_id') or 1520870810775060592
            if unverified_id:
                unverified_role = member.guild.get_role(int(unverified_id))
                if unverified_role and unverified_role not in member.roles:
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

        primary_id = int(os.getenv("TARGET_GUILD_ID", os.getenv("SUPPORT_GUILD_ID", "1520457643842342912")))
        if entry.guild.id != primary_id:
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
    @commands.command(name="spawn_verification", description="Deploy the advanced verification checkpoint to the current channel (Server Owner only).")
    async def spawn_verification(self, ctx: commands.Context):
        from utils.permissions import require_server_owner
        if not await require_server_owner(ctx):
            return

        TARGET_VERIFICATION_CHANNEL_ID = 1520748219100041348
        if ctx.channel.id != TARGET_VERIFICATION_CHANNEL_ID:
            try:
                await ctx.message.delete()
            except Exception:
                pass
            embed = ErrorEmbed(
                description=f"The security checkpoint can only be deployed in <#{TARGET_VERIFICATION_CHANNEL_ID}>.",
                resolution=f"Please switch to <#{TARGET_VERIFICATION_CHANNEL_ID}> to run this command."
            )
            await ctx.send(embed=embed, delete_after=8)
            return

        try:
            await ctx.message.delete()
        except Exception:
            pass

        settings = await SettingsService.get_guild_settings(ctx.guild.id)
        if not settings.get('verification_enabled') or not settings.get('verification_role_id') or not settings.get('unverified_role_id'):
            embed = ErrorEmbed(
                description="The verification module must be fully configured before deployment.",
                resolution="Use the `?config` or `/security` dashboard to assign both Verified and Unverified roles, then enable verification."
            )
            await ctx.send(embed=embed, delete_after=10)
            return

        embed = SyncInkEmbed(title="<:trusted_user:1547621146558730340> **Security Checkpoint**", color=BRAND_ACCENT)
        embed.set_footer(text="SyncInk Platform | Server Security", icon_url="https://files.catbox.moe/74l9su.png")
        embed.description = "To protect our community from spam, automated accounts, malicious users, and unauthorized access, all members must complete verification before accessing the server."
        embed.add_field(name="", value=f"> {Emojis.LOCK} Please click the button below to verify your account and instantly unlock server access.", inline=False)
        
        # Check if persistent verification message already exists to avoid duplicates
        existing_msg = None
        try:
            async for m in ctx.channel.history(limit=25):
                if m.author.id == ctx.bot.user.id and m.components:
                    for comp in m.components:
                        for child in getattr(comp, 'children', []):
                            if getattr(child, 'custom_id', None) == "persistent_verify_btn":
                                existing_msg = m
                                break
                        if existing_msg:
                            break
        except Exception:
            pass

        if existing_msg:
            await existing_msg.edit(embed=embed, view=VerificationView())
            await ctx.send(embed=SuccessEmbed("The security checkpoint has been verified and updated without creating duplicates."), delete_after=6)
        else:
            await ctx.channel.send(embed=embed, view=VerificationView())
            await ctx.send(embed=SuccessEmbed("The security checkpoint has been successfully deployed to this channel."), delete_after=6)

async def setup(bot: commands.Bot):
    await bot.add_cog(Security(bot))
