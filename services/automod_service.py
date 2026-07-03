import discord
import asyncio
from datetime import datetime, timedelta
from database import db
from services.settings_service import SettingsService
from services.mod_service import ModService
from utils.logger import log
from utils.ui import ErrorEmbed, SyncInkEmbed, WARNING_COLOR, ERROR_COLOR

class AutomodService:
    @staticmethod
    async def get_score(guild_id: int, user_id: int) -> int:
        record = await db.fetchrow("SELECT points FROM automod_scores WHERE guild_id = $1 AND user_id = $2", guild_id, user_id)
        return record['points'] if record else 0

    @staticmethod
    async def add_violation(bot, guild: discord.Guild, member: discord.Member, points: int, reason: str, detection_type: str, message: discord.Message = None):
        if points <= 0:
            return None

        # Add points to DB
        await db.execute("""
            INSERT INTO automod_scores (guild_id, user_id, points, last_updated)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (guild_id, user_id) DO UPDATE 
            SET points = automod_scores.points + $3, last_updated = CURRENT_TIMESTAMP
        """, guild.id, member.id, points)
        
        total_points = await AutomodService.get_score(guild.id, member.id)
        
        # Check punishments
        punishment = await db.fetchrow("""
            SELECT action, duration_mins FROM automod_punishments 
            WHERE guild_id = $1 AND points <= $2 
            ORDER BY points DESC LIMIT 1
        """, guild.id, total_points)
        
        action_taken = "Logged (No threshold met)"
        case_id = None
        duration = None

        if punishment:
            action = punishment['action'].upper()
            duration = punishment['duration_mins']
            
            try:
                if action == 'WARN':
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "WARN (Automod)", reason)
                    action_taken = "Warned"
                    try:
                        await member.send(embed=ErrorEmbed(description=f"You have received an automated warning in **{guild.name}**.\nReason: {reason}"))
                    except discord.Forbidden:
                        pass
                
                elif action == 'TIMEOUT':
                    duration_td = timedelta(minutes=duration) if duration else timedelta(minutes=5)
                    await member.timeout(duration_td, reason=reason)
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "TIMEOUT (Automod)", reason)
                    action_taken = f"Timed Out ({duration} mins)"
                    if message:
                        try:
                            await message.channel.send(embed=ErrorEmbed(description=f"🔨 {member.mention} has been timed out by Automod for {reason}."), delete_after=15)
                        except discord.Forbidden:
                            pass
                
                elif action == 'JAIL':
                    case_id = await AutomodService.jail_user(guild, member, bot.user, reason, duration)
                    action_taken = f"Jailed"
                    if message:
                        try:
                            await message.channel.send(embed=ErrorEmbed(description=f"🔒 {member.mention} has been jailed by Automod for {reason}."), delete_after=15)
                        except discord.Forbidden:
                            pass
                
                elif action == 'KICK':
                    await member.kick(reason=reason)
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "KICK (Automod)", reason)
                    action_taken = "Kicked"
                    if message:
                        try:
                            await message.channel.send(embed=ErrorEmbed(description=f"👢 {member.mention} was kicked by Automod for {reason}."), delete_after=15)
                        except discord.Forbidden:
                            pass
                
                elif action == 'BAN':
                    await member.ban(reason=reason)
                    case_id = await ModService.log_case(guild.id, member.id, bot.user.id, "BAN (Automod)", reason)
                    action_taken = "Banned"
                    if message:
                        try:
                            await message.channel.send(embed=ErrorEmbed(description=f"🔨 {member.mention} was permanently banned by Automod for {reason}."), delete_after=15)
                        except discord.Forbidden:
                            pass
            
            except discord.Forbidden:
                action_taken = f"Failed to execute {action} (Missing Permissions)"
            except Exception as e:
                log.error(f"Failed to execute automod action {action}: {e}")
                action_taken = f"Error executing {action}"

        # Dispatch Log
        original_message = message.content if message else None
        jump_url = message.jump_url if message else None
        await AutomodService._dispatch_log(bot, guild, member, action_taken, detection_type, reason, total_points, case_id, original_message, jump_url)

    @staticmethod
    async def _dispatch_log(bot, guild, member, action, detection, reason, score, case_id, message_content, jump_url):
        settings = await SettingsService.get_guild_settings(guild.id)
        log_chan_id = settings.get("automod_log_channel_id") or settings.get("log_channel_moderation")
        if not log_chan_id:
            return
            
        channel = guild.get_channel(log_chan_id)
        if not channel:
            return

        embed = SyncInkEmbed(title="Automod Incident", color=ERROR_COLOR)
        embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        embed.add_field(name="Action Taken", value=action, inline=True)
        embed.add_field(name="Detection", value=detection, inline=True)
        embed.add_field(name="Current Score", value=f"{score} Points", inline=True)
        embed.add_field(name="Reason", value=reason, inline=False)
        
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
    async def jail_user(guild: discord.Guild, member: discord.Member, moderator: discord.Member, reason: str, duration_mins: int = None) -> int:
        settings = await SettingsService.get_guild_settings(guild.id)
        jail_role_id = settings.get('jail_role_id')
        if not jail_role_id:
            raise Exception("Jail role is not configured on this server.")
            
        jail_role = guild.get_role(jail_role_id)
        if not jail_role:
            raise Exception("Jail role could not be found.")

        # Snapshot current roles
        stored_roles = []
        roles_to_remove = []
        for role in member.roles:
            if role.id != guild.default_role.id and not role.is_integration() and not role.is_premium_subscriber() and role < guild.me.top_role:
                stored_roles.append(str(role.id))
                roles_to_remove.append(role)

        # Apply jail
        try:
            await member.remove_roles(*roles_to_remove, reason="Jailed")
            await member.add_roles(jail_role, reason="Jailed")
        except discord.Forbidden:
            raise Exception("Missing permissions to modify roles.")

        case_id = await ModService.log_case(guild.id, member.id, moderator.id, "JAIL", reason)
        roles_str = ",".join(stored_roles)
        release_at = (datetime.utcnow() + timedelta(minutes=duration_mins)) if duration_mins else None

        await db.execute("""
            INSERT INTO automod_jails (guild_id, user_id, mod_id, reason, previous_roles, release_at, case_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, guild.id, member.id, moderator.id, reason, roles_str, release_at, case_id)

        # DM the user with an Appeal button
        from utils.ui import JailAppealView
        try:
            embed = ErrorEmbed(
                description=f"You have been placed in jail in **{guild.name}**.\nThis is a strict disciplinary action.",
                resolution="You have lost access to all standard channels. You may submit an appeal using the button below to be reviewed by the administration team."
            )
            embed.title = "Official Jail Notice"
            embed.add_field(name="Infraction Reason", value=f"```\n{reason}\n```", inline=False)
            embed.add_field(name="Case ID", value=str(case_id), inline=False)
            embed.set_thumbnail(url="https://files.catbox.moe/74l9su.png")
            await member.send(embed=embed, view=JailAppealView())
        except discord.Forbidden:
            pass

        return case_id

    @staticmethod
    async def unjail_user(guild: discord.Guild, member: discord.Member, moderator: discord.Member, reason: str):
        jail_record = await db.fetchrow("SELECT previous_roles, id FROM automod_jails WHERE guild_id = $1 AND user_id = $2 ORDER BY jailed_at DESC LIMIT 1", guild.id, member.id)
        if not jail_record:
            raise Exception("No active jail record found for this user.")

        settings = await SettingsService.get_guild_settings(guild.id)
        jail_role_id = settings.get('jail_role_id')
        if jail_role_id:
            jail_role = guild.get_role(jail_role_id)
            if jail_role:
                await member.remove_roles(jail_role, reason="Unjailed")

        if jail_record['previous_roles']:
            role_ids = [int(rid) for rid in jail_record['previous_roles'].split(',')]
            roles_to_add = [guild.get_role(rid) for rid in role_ids if guild.get_role(rid)]
            try:
                await member.add_roles(*roles_to_add, reason="Unjailed - Restoring Roles")
            except discord.Forbidden:
                pass

        await db.execute("DELETE FROM automod_jails WHERE id = $1", jail_record['id'])
        await ModService.log_case(guild.id, member.id, moderator.id, "UNJAIL", reason)

    @staticmethod
    async def point_decay_task():
        # Decay points globally based on settings
        records = await db.fetch("SELECT guild_id, point_decay_rate, point_decay_hours FROM guild_settings WHERE automod_enabled = TRUE AND point_decay_rate > 0")
        for settings in records:
            guild_id = settings['guild_id']
            rate = settings['point_decay_rate']
            hours = settings['point_decay_hours'] or 24
            
            # Find scores that haven't been updated in `hours` and have points > 0
            # To simulate decay perfectly: We will just deduct `rate` points if `last_updated` is older than `hours`
            # and set `last_updated` to CURRENT_TIMESTAMP so it waits another 24h.
            
            await db.execute("""
                UPDATE automod_scores
                SET points = GREATEST(points - $1, 0),
                    last_updated = CURRENT_TIMESTAMP
                WHERE guild_id = $2 
                  AND points > 0 
                  AND last_updated <= (CURRENT_TIMESTAMP - INTERVAL '1 hour' * $3)
            """, rate, guild_id, hours)

    @staticmethod
    async def check_timed_jails(bot):
        records = await db.fetch("SELECT id, guild_id, user_id FROM automod_jails WHERE release_at IS NOT NULL AND release_at <= CURRENT_TIMESTAMP")
        for record in records:
            guild = bot.get_guild(record['guild_id'])
            if guild:
                member = guild.get_member(record['user_id'])
                if member:
                    try:
                        await AutomodService.unjail_user(guild, member, bot.user, "Automatic Timed Release")
                    except Exception as e:
                        log.error(f"Failed to auto-unjail {member.id}: {e}")
            # Ensure it's deleted even if member left
            await db.execute("DELETE FROM automod_jails WHERE id = $1", record['id'])
