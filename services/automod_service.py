import discord
import asyncio
from typing import Optional
from datetime import datetime, timedelta
from database import db
from services.settings_service import SettingsService
from services.mod_service import ModService
from utils.logger import log
from utils.ui import ErrorEmbed, SyncInkEmbed, WARNING_COLOR, ERROR_COLOR
from utils.emojis import Emojis

class AutomodService:
    @staticmethod
    async def get_user_24h_strikes(guild_id: int, user_id: int) -> int:
        record = await db.fetchrow("""
            SELECT COUNT(*) as count FROM automod_violations 
            WHERE guild_id = $1 AND user_id = $2 
              AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '24 hours')
        """, guild_id, user_id)
        return record['count'] if record else 0

    @staticmethod
    async def get_score(guild_id: int, user_id: int) -> int:
        return await AutomodService.get_user_24h_strikes(guild_id, user_id)

    @staticmethod
    async def is_user_jailed(guild: discord.Guild, member: discord.Member) -> bool:
        if member.id == guild.owner_id:
            return False

        settings = await SettingsService.get_guild_settings(guild.id)
        jail_role_id = settings.get('quarantine_role_id') or settings.get('jail_role_id')
        jail_role_id_int = int(jail_role_id) if jail_role_id else None

        if jail_role_id_int and any(r.id == jail_role_id_int for r in member.roles):
            return True
        if any("jail" in r.name.lower() or "quarantine" in r.name.lower() for r in member.roles):
            return True

        # Check if user has an active record in automod_jails
        record = await db.fetchrow(
            "SELECT id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 AND (release_at IS NULL OR release_at > CURRENT_TIMESTAMP)",
            guild.id, member.id
        )
        return record is not None

    @staticmethod
    async def add_violation(
        bot, guild: discord.Guild, member: discord.Member, reason: str, 
        detection_type: str, message: discord.Message = None, points: int = None,
        severity: str = "MEDIUM"
    ):
        if member.id == guild.owner_id:
            return  # Server owner is strictly immune to warnings, strikes, timeouts, and jail

        # 1. Record violation into persistent history table
        await db.execute("""
            INSERT INTO automod_violations (guild_id, user_id, reason, detection_type, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        """, guild.id, member.id, reason, detection_type)

        # 2. Count strikes in rolling 24-hour window
        strike_count = await AutomodService.get_user_24h_strikes(guild.id, member.id)

        action_taken = "Logged"
        case_id = None

        # 3. Severity-weighted / Progressive 24-Hour Strike Tier System
        try:
            if severity == "CRITICAL":
                # Instant Quarantine / Jail regardless of strike count
                if await AutomodService.is_user_jailed(guild, member):
                    duration_td = timedelta(hours=2)
                    await member.timeout(duration_td, reason=f"CRITICAL Security Violation while jailed: {reason}")
                    from utils.ui import send_mute_dm
                    await send_mute_dm(member, reason, guild.name)
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "TIMEOUT 2h (Critical Jailed)", f"{reason} [CRITICAL]")
                    action_taken = "Timed Out 2h (Critical Jailed Repeat)"
                else:
                    case_id = await AutomodService.jail_user(guild, member, bot.user, f"CRITICAL Violation: {reason}")
                    action_taken = "Quarantined / Jailed (CRITICAL)"
                    jail_embed = SyncInkEmbed(
                        description=f"{Emojis.REFUSED} {member.mention} **has been quarantined for a critical security violation.**",
                        color=ERROR_COLOR
                    )
                    if message:
                        try:
                            await message.channel.send(content=member.mention, embed=jail_embed, delete_after=15)
                        except discord.Forbidden:
                            pass

            elif severity == "HIGH":
                # High-severity (e.g. phishing, severe spam): Immediate 30m timeout
                duration_td = timedelta(minutes=30)
                await member.timeout(duration_td, reason=f"High-Severity Automod: {reason}")
                from utils.ui import send_mute_dm
                await send_mute_dm(member, reason, guild.name)
                case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "TIMEOUT 30m (Automod High)", f"{reason} [HIGH]")
                action_taken = "Timed Out (30m - HIGH)"
                high_embed = SyncInkEmbed(
                    description=f"{Emojis.WARNING} {member.mention} **Muted for 30 minutes** (High-Severity Infraction) — *{reason}*",
                    color=ERROR_COLOR
                )
                if message:
                    try:
                        await message.channel.send(content=member.mention, embed=high_embed, delete_after=12)
                    except discord.Forbidden:
                        pass

            else:
                # Progressive 24-Hour Strike Tier System:
                # Strike 1: Normal warning in chat + delete message
                # Strike 2: 2 mins mute
                # Strike 3: 10 mins mute
                # Strike 4: 30 mins mute
                # Strike 5: 1h 30m (90 mins) mute
                # Strike 6+: Jail
                if strike_count == 1:
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "WARN (Automod)", f"{reason} [Strike 1/5 (24h)]")
                    action_taken = "Warned (Strike 1/5)"
                    warn_embed = SyncInkEmbed(
                        description=f"{Emojis.WARNING} {member.mention} **Warning:** Please follow server rules. Avoid inappropriate content. (Strike 1/5)",
                        color=WARNING_COLOR
                    )
                    if message:
                        try:
                            await message.channel.send(content=member.mention, embed=warn_embed, delete_after=10)
                        except discord.Forbidden:
                            pass

                elif strike_count in (2, 3, 4, 5):
                    timeout_map = {
                        2: (2, "2 minutes", "TIMEOUT 2m (Automod)"),
                        3: (10, "10 minutes", "TIMEOUT 10m (Automod)"),
                        4: (30, "30 minutes", "TIMEOUT 30m (Automod)"),
                        5: (90, "1 hour 30 minutes", "TIMEOUT 1h30m (Automod)")
                    }
                    duration_mins, duration_label, case_action = timeout_map[strike_count]
                    duration_td = timedelta(minutes=duration_mins)
                    await member.timeout(duration_td, reason=f"Automod Strike {strike_count}/5 (24h): {reason}")
                    from utils.ui import send_mute_dm
                    await send_mute_dm(member, reason, guild.name)
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, case_action, f"{reason} [Strike {strike_count}/5 (24h)]")
                    action_taken = f"Timed Out ({duration_label} - Strike {strike_count}/5)"

                    final_notice = " • **Next strike will result in Jail!**" if strike_count == 5 else ""
                    mute_embed = SyncInkEmbed(
                        description=f"{Emojis.WARNING} {member.mention} **Muted for {duration_label}** (Strike {strike_count}/5) — *{reason}*{final_notice}",
                        color=ERROR_COLOR
                    )
                    if message:
                        try:
                            await message.channel.send(content=member.mention, embed=mute_embed, delete_after=12)
                        except discord.Forbidden:
                            pass

                else: # strike_count >= 6
                    if await AutomodService.is_user_jailed(guild, member):
                        duration_td = timedelta(hours=2)
                        await member.timeout(duration_td, reason=f"Jailed repeat violation (Strike {strike_count} in 24h): {reason}")
                        from utils.ui import send_mute_dm
                        await send_mute_dm(member, reason, guild.name)
                        case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "TIMEOUT 2h (Jailed Repeat)", f"{reason} [Strike {strike_count} in 24h]")
                        action_taken = f"Timed Out 2h (Jailed Repeat - Strike {strike_count})"
                        repeat_embed = SyncInkEmbed(
                            description=f"{Emojis.ALERT} {member.mention} **Timed out for 2 hours** (Repeat violation while jailed).",
                            color=ERROR_COLOR
                        )
                        if message:
                            try:
                                await message.channel.send(content=member.mention, embed=repeat_embed, delete_after=15)
                            except discord.Forbidden:
                                pass
                    else:
                        case_id = await AutomodService.jail_user(guild, member, bot.user, f"Automod Strike {strike_count} in 24h: {reason}")
                        action_taken = f"Jailed (Strike {strike_count} in 24h)"
                        jail_embed = SyncInkEmbed(
                            description=f"{Emojis.REFUSED} {member.mention} **has been jailed for repeated server violations** (Strike {strike_count}).",
                            color=ERROR_COLOR
                        )
                        if message:
                            try:
                                await message.channel.send(content=member.mention, embed=jail_embed, delete_after=15)
                            except discord.Forbidden:
                                pass

        except discord.Forbidden:
            action_taken = f"Failed (Missing Permissions for Strike {strike_count})"
        except Exception as e:
            log.error(f"Failed to execute automod action: {e}")
            action_taken = f"Error ({e})"

        # Dispatch Log with Risk Score
        original_message = message.content if message else None
        jump_url = message.jump_url if message else None
        await AutomodService._dispatch_log(bot, guild, member, action_taken, detection_type, reason, strike_count, case_id, original_message, jump_url, severity)

    @staticmethod
    async def _dispatch_log(bot, guild, member, action, detection, reason, strike_count, case_id, message_content, jump_url, severity="MEDIUM"):
        settings = await SettingsService.get_guild_settings(guild.id)
        log_chan_id = settings.get("automod_log_channel_id") or settings.get("log_channel_moderation")
        if not log_chan_id:
            return
            
        channel = guild.get_channel(log_chan_id)
        if not channel:
            return

        from services.risk_service import RiskEngine
        risk_score, tier, _ = await RiskEngine.compute_risk(member)
        tier_badge = RiskEngine.get_tier_badge(tier)

        embed = SyncInkEmbed(title=f"{Emojis.ALERT} **Automod Security Incident**", color=ERROR_COLOR)
        embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        embed.add_field(name=f"{Emojis.REFUSED} **Action Taken**", value=f"`{action}`", inline=True)
        embed.add_field(name=f"{Emojis.MODERATION} **Detection**", value=f"`{detection}`", inline=True)
        embed.add_field(name="🎯 **Risk Score**", value=f"`{risk_score}/100` ({tier_badge})", inline=True)
        embed.add_field(name=f"{Emojis.WARNING} **24h Strikes**", value=f"`{strike_count} Violation(s)`", inline=True)
        embed.add_field(name="📜 **Reason**", value=f"`{reason}`", inline=False)
        
        if message_content:
            embed.add_field(name="Original Message", value=f"```\n{message_content[:1000]}\n```", inline=False)
        if jump_url:
            embed.add_field(name="Context", value=f"[Jump to Message]({jump_url})", inline=False)
        if case_id:
            embed.set_footer(text=f"Case ID: {case_id}")
            
        try:
            await channel.send(embed=embed)
        except discord.Forbidden:
            pass
        


    @staticmethod
    async def get_or_create_jail_role(guild: discord.Guild) -> Optional[discord.Role]:
        settings = await SettingsService.get_guild_settings(guild.id)
        jail_role_id = settings.get('quarantine_role_id') or settings.get('jail_role_id')
        if jail_role_id:
            role = guild.get_role(int(jail_role_id))
            if role:
                return role

        for r in guild.roles:
            if any(k in r.name.lower() for k in ("quarantine", "jail", "prisoner")):
                await db.execute(
                    "UPDATE guild_settings SET quarantine_role_id = $1 WHERE guild_id = $2",
                    r.id, guild.id
                )
                return r

        # Auto-create Quarantine role if bot has manage_roles permission
        if guild.me.guild_permissions.manage_roles:
            try:
                role = await guild.create_role(
                    name="Quarantined",
                    color=discord.Color.dark_grey(),
                    reason="SyncInk Security: Auto-created quarantine isolation role"
                )
                try:
                    positions = {role: max(1, guild.me.top_role.position - 1)}
                    await guild.edit_role_positions(positions=positions)
                except Exception:
                    pass

                await db.execute(
                    "UPDATE guild_settings SET quarantine_role_id = $1 WHERE guild_id = $2",
                    role.id, guild.id
                )
                log.info(f"Auto-created Quarantined role (ID: {role.id}) in guild {guild.name} ({guild.id})")
                return role
            except Exception as e:
                log.error(f"Failed to auto-create Quarantined role in guild {guild.id}: {e}")

        return None

    @staticmethod
    async def jail_user(guild: discord.Guild, member: discord.Member, moderator: discord.Member, reason: str, duration_mins: int = None) -> int:
        if member.id == guild.owner_id:
            raise Exception("Cannot jail the server owner.")

        jail_role = await AutomodService.get_or_create_jail_role(guild)
        if not jail_role:
            raise Exception("Neither Quarantine nor Jail role is configured on this server, and bot lacks permission to create one.")

        jail_role_id_int = jail_role.id

        # Snapshot current roles (strictly exclude any jail/quarantine roles so unjailing never re-jails)
        stored_roles = []
        roles_to_remove = []
        for role in member.roles:
            if role.id != guild.default_role.id and not role.is_integration() and not role.is_premium_subscriber() and role < guild.me.top_role:
                if (jail_role_id_int and role.id == jail_role_id_int) or any(k in role.name.lower() for k in ("jail", "quarantine")):
                    continue
                stored_roles.append(str(role.id))
                roles_to_remove.append(role)

        # Apply jail
        try:
            if roles_to_remove:
                await member.remove_roles(*roles_to_remove, reason="Quarantine: Roles Stripped")
            if jail_role not in member.roles:
                await member.add_roles(jail_role, reason="Quarantine: Isolation Applied")
        except discord.Forbidden:
            raise Exception("Missing permissions to modify roles.")

        mod_id = moderator.id if moderator else (guild.me.id if guild.me else 0)
        case_id = await ModService.log_case(guild.id, member.id, mod_id, "JAIL", reason)
        roles_str = ",".join(stored_roles)
        release_at = (datetime.utcnow() + timedelta(minutes=duration_mins)) if duration_mins else None

        # Check if record already exists (e.g. from web dashboard)
        existing = await db.fetchrow(
            "SELECT id, previous_roles FROM automod_jails WHERE guild_id = $1 AND user_id = $2 ORDER BY jailed_at DESC LIMIT 1",
            guild.id, member.id
        )
        if existing:
            saved_roles = existing['previous_roles'] if existing['previous_roles'] else roles_str
            await db.execute("""
                UPDATE automod_jails
                SET mod_id = COALESCE($1, mod_id),
                    reason = COALESCE($2, reason),
                    previous_roles = $3,
                    release_at = $4,
                    case_id = COALESCE($5, case_id),
                    jailed_at = CURRENT_TIMESTAMP
                WHERE id = $6
            """, mod_id, reason, saved_roles, release_at, case_id, existing['id'])
        else:
            await db.execute("""
                INSERT INTO automod_jails (guild_id, user_id, mod_id, reason, previous_roles, release_at, case_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, guild.id, member.id, mod_id, reason, roles_str, release_at, case_id)

        # DM the user with an Appeal button
        from utils.ui import JailAppealView
        try:
            embed = ErrorEmbed(
                description=f"You have been placed in quarantine isolation in **{guild.name}**.\nThis is a strict disciplinary action.",
                resolution="You have lost access to standard channels. You may submit an appeal using the button below to be reviewed by the administration team."
            )
            embed.title = f"{Emojis.LOCK} Official Jail Notice"
            embed.add_field(name="Infraction Reason", value=f"```\n{reason}\n```", inline=False)
            embed.add_field(name="Case ID", value=str(case_id), inline=False)
            if release_at:
                embed.add_field(name="Release Due", value=f"<t:{int(release_at.timestamp())}:R>", inline=False)
            embed.set_thumbnail(url="https://files.catbox.moe/74l9su.png")
            embed.set_footer(text=f"SyncInk Platform | Server ID: {guild.id}", icon_url="https://files.catbox.moe/74l9su.png")
            await member.send(embed=embed, view=JailAppealView())
        except Exception:
            pass

        # Asynchronously auto-purge user messages across channels (target channel + all channels)
        asyncio.create_task(AutomodService.purge_jailed_user_messages(guild, member.id))

        return case_id

    @staticmethod
    async def purge_jailed_user_messages(guild: discord.Guild, user_id: int):
        """
        Auto-purges messages sent by a jailed user across server channels.
        Specifically ensures 40-50 messages are purged in designated channel 1520895094629203989,
        and clears recent messages across all accessible guild text channels.
        """
        try:
            target_chan_id = 1520895094629203989
            target_channel = guild.get_channel(target_chan_id)
            if not target_channel:
                try:
                    target_channel = await guild.fetch_channel(target_chan_id)
                except Exception:
                    target_channel = None

            def is_jailed_user(m: discord.Message) -> bool:
                return m.author.id == user_id

            if target_channel and isinstance(target_channel, discord.TextChannel):
                try:
                    deleted = await target_channel.purge(limit=60, check=is_jailed_user)
                    log.info(f"Auto-purged {len(deleted)} messages for jailed user {user_id} in channel {target_chan_id}")
                except Exception as e:
                    log.warning(f"Could not purge target channel {target_chan_id}: {e}")

            # Purge across all other text channels in guild (locked and unlocked)
            for channel in guild.text_channels:
                if channel.id == target_chan_id:
                    continue
                perms = channel.permissions_for(guild.me)
                if not perms.manage_messages or not perms.read_message_history:
                    continue
                try:
                    await channel.purge(limit=50, check=is_jailed_user)
                except Exception:
                    continue
        except Exception as e:
            log.error(f"Error during auto-purge for jailed user {user_id}: {e}")

    @staticmethod
    async def unjail_user(guild: discord.Guild, member: discord.Member, moderator: discord.Member, reason: str):
        jail_record = await db.fetchrow(
            "SELECT previous_roles, id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 ORDER BY jailed_at DESC LIMIT 1",
            guild.id, member.id
        )

        settings = await SettingsService.get_guild_settings(guild.id)
        jail_role_id = settings.get('quarantine_role_id') or settings.get('jail_role_id')
        jail_role_id_int = int(jail_role_id) if jail_role_id else None

        # Remove configured jail role and ANY role containing 'jail' or 'quarantine' in name
        roles_to_strip = []
        for r in member.roles:
            if (jail_role_id_int and r.id == jail_role_id_int) or any(k in r.name.lower() for k in ("jail", "quarantine")):
                roles_to_strip.append(r)
        if roles_to_strip:
            try:
                await member.remove_roles(*roles_to_strip, reason="Unjailed")
            except discord.Forbidden:
                pass

        if jail_record and jail_record['previous_roles']:
            role_ids = [int(rid) for rid in jail_record['previous_roles'].split(',') if rid.strip().isdigit()]
            roles_to_add = [
                guild.get_role(rid) for rid in role_ids 
                if guild.get_role(rid) 
                and not (jail_role_id_int and rid == jail_role_id_int) 
                and not any(k in guild.get_role(rid).name.lower() for k in ("jail", "quarantine"))
                and guild.get_role(rid) < guild.me.top_role
            ]
            if roles_to_add:
                try:
                    await member.add_roles(*roles_to_add, reason="Unjailed - Restoring Roles")
                except discord.Forbidden:
                    pass

        if jail_record:
            await db.execute("DELETE FROM automod_jails WHERE id = $1", jail_record['id'])

        mod_id = moderator.id if moderator else (guild.me.id if guild.me else 0)
        await ModService.log_case(guild.id, member.id, mod_id, "UNJAIL", reason)

        # Notify member in DM
        try:
            from utils.ui import SuccessEmbed
            embed = SuccessEmbed(
                description=f"Your quarantine sentence in **{guild.name}** has been lifted.\nYour normal server access and roles have been restored."
            )
            embed.title = "Quarantine Released"
            embed.set_footer(text=f"SyncInk Platform | Server ID: {guild.id}", icon_url="https://files.catbox.moe/74l9su.png")
            await member.send(embed=embed)
        except Exception:
            pass

    @staticmethod
    async def point_decay_task():
        # Retired in favor of rolling 24-hour progressive violation window.
        pass

    @staticmethod
    async def check_timed_jails(bot):
        records = await db.fetch("SELECT id, guild_id, user_id FROM automod_jails WHERE release_at IS NOT NULL AND release_at <= CURRENT_TIMESTAMP")
        for record in records:
            guild = bot.get_guild(record['guild_id'])
            if not guild and len(bot.guilds) == 1:
                guild = bot.guilds[0]
            if guild:
                member = guild.get_member(record['user_id'])
                if not member:
                    try:
                        member = await guild.fetch_member(record['user_id'])
                    except Exception:
                        member = None
                if member:
                    try:
                        await AutomodService.unjail_user(guild, member, bot.user, "Automatic Timed Release")
                    except Exception as e:
                        log.error(f"Failed to auto-unjail {member.id}: {e}")
            # Ensure it's deleted even if member left
            await db.execute("DELETE FROM automod_jails WHERE id = $1", record['id'])

