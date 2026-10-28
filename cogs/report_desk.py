import discord
from discord.ext import commands, tasks
import asyncio
import os
from utils.logger import log
from database import db
from utils.ui import SyncInkEmbed

REPORT_CHANNEL_ID = 1541796896199417906
SUPPORT_MANAGER_ROLE_ID = 1520854378192572546
TARGET_GUILD_ID = 1520457643842342912

class ReportDeskCog(commands.Cog):
    """
    Two-way synchronization between Discord support threads
    and the web-based Data Loss Recovery Desk.
    """
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.reconcile_loop.start()

    def cog_unload(self):
        self.reconcile_loop.cancel()

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        """
        Listens for staff replies typed directly inside a Discord report thread,
        and synchronizes them instantly into the website chat database.
        """
        # Ignore bots, DMs, and webhook echoes
        if message.author.bot or message.webhook_id is not None or message.guild is None:
            return

        # Check if message is within a thread under the target report channel
        if not isinstance(message.channel, discord.Thread):
            return

        if message.channel.parent_id != REPORT_CHANNEL_ID:
            return

        thread_id = str(message.channel.id)

        try:
            # Look up corresponding report in database
            report = await db.fetchrow(
                "SELECT id, status, user_id FROM data_loss_reports WHERE discord_thread_id = $1",
                thread_id
            )
            if not report:
                return

            # Check if this message was already stored
            existing = await db.fetchrow(
                "SELECT id FROM report_chat_messages WHERE discord_message_id = $1",
                str(message.id)
            )
            if existing:
                return

            # Determine sender role
            is_owner = (message.author.id == 930306512864280607) or (message.author.id == message.guild.owner_id)
            is_admin = is_owner or message.author.guild_permissions.administrator
            is_staff = is_admin or any("staff" in r.name.lower() or "mod" in r.name.lower() or "support" in r.name.lower() for r in message.author.roles)

            if is_owner:
                sender_role = "OWNER"
            elif is_admin:
                sender_role = "ADMIN"
            elif is_staff:
                sender_role = "STAFF"
            else:
                sender_role = "USER"

            is_staff_reply = (sender_role != "USER")

            # Extract attachment if present
            attachment_url = None
            attachment_name = None
            attachment_type = None
            attachment_size = None

            if message.attachments:
                att = message.attachments[0]
                attachment_url = att.url
                attachment_name = att.filename
                attachment_type = att.content_type or "attachment"
                attachment_size = att.size

            content = message.content.strip() if message.content else ""
            if not content and attachment_url:
                content = "(Sent an attachment)"

            avatar_hash = message.author.avatar.key if message.author.avatar else None

            # Insert into database
            await db.execute(
                """
                INSERT INTO report_chat_messages (
                    report_id, sender_id, sender_name, sender_avatar,
                    sender_role, message, is_staff_reply, attachment_url,
                    attachment_name, attachment_type, attachment_size,
                    discord_message_id, message_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'CHAT')
                """,
                report["id"],
                str(message.author.id),
                message.author.display_name or message.author.name,
                avatar_hash,
                sender_role,
                content,
                is_staff_reply,
                attachment_url,
                attachment_name,
                attachment_type,
                attachment_size,
                str(message.id)
            )

            # Update report timestamp
            await db.execute(
                "UPDATE data_loss_reports SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
                report["id"]
            )

            # Add reaction on Discord to indicate synced status
            try:
                await message.add_reaction("✅")
            except Exception:
                pass

            log.info(f"[ReportDesk] Synced Discord message {message.id} from {message.author} to report #{report['id']}")

        except Exception as e:
            log.error(f"[ReportDesk] Error syncing message from Discord thread: {e}", exc_info=True)

    @tasks.loop(seconds=30)
    async def reconcile_loop(self):
        """
        Safety background worker: ensures any report created while the bot or webhook
        was restarting gets a Discord thread created and existing messages mirrored.
        """
        try:
            unthreaded = await db.fetch(
                """
                SELECT * FROM data_loss_reports 
                WHERE discord_thread_id IS NULL AND UPPER(status) IN ('OPEN', 'IN_PROGRESS')
                ORDER BY id ASC LIMIT 2
                """
            )
            if not unthreaded:
                return

            channel = self.bot.get_channel(REPORT_CHANNEL_ID)
            if not channel:
                try:
                    channel = await self.bot.fetch_channel(REPORT_CHANNEL_ID)
                except Exception:
                    return

            for report in unthreaded:
                safe_title = (report["title"] or "Incident").replace("\n", " ")[:35]
                safe_user = (report["username"] or "Member")[:20]
                thread_name = f"🧵 {report['report_code']} • {safe_user} • {safe_title}"

                try:
                    # Create thread
                    thread = await channel.create_thread(
                        name=thread_name,
                        auto_archive_duration=1440,
                        type=discord.ChannelType.public_thread,
                        reason=f"SyncInk Data Loss Report #{report['report_code']}"
                    )

                    await db.execute(
                        "UPDATE data_loss_reports SET discord_thread_id = $1 WHERE id = $2",
                        str(thread.id), report["id"]
                    )

                    # Post Overview
                    color = 0xef4444 if report["priority"] == "CRITICAL" else 0xf59e0b
                    overview = discord.Embed(
                        title=f"<a:syncwarning:1520914584012328961> Data Loss & Recovery Report — #{report['report_code']}",
                        description=f"**Subject:** {report['title']}",
                        color=color
                    )
                    overview.add_field(name="<:staff:1562591917295009802> Submitter", value=f"<@{report['user_id']}> (`{report['username']}`)", inline=True)
                    overview.add_field(name="<a:region:1562591209543966831> Target Server", value=f"**{report['guild_name'] or 'Server'}**\n`{report['guild_id']}`", inline=True)
                    overview.add_field(name="<:developer:1562591562754424872> Affected Bot", value=f"`{report['bot_target']}`", inline=True)
                    overview.add_field(name="<:argument:1562587869762158762> Category", value=f"`{report['category']}`", inline=True)
                    overview.add_field(name="⚡ Priority", value=f"`{report['priority']}`", inline=True)
                    overview.add_field(name="📅 Incident Date", value=f"`{report['incident_date'] or 'N/A'}`", inline=True)
                    overview.add_field(name="<:admin:1562590696337047744> Affected Channels", value=report["affected_channels"] or "None noted", inline=False)
                    overview.add_field(name="<:experience:1562588852324143125> Incident Statement", value=f"```\n{(report['description'] or '')[:1000]}\n```", inline=False)
                    overview.set_footer(text="SyncInk Support Platform • Two-Way Live Mirror Active", icon_url="https://syncink.site/syncink-main-logo.png")

                    await thread.send(content=f"🚨 **New Recovery Ticket Dispatched** — <@&{SUPPORT_MANAGER_ROLE_ID}>", embed=overview)
                    log.info(f"[ReportDesk] Reconciled and created thread {thread.id} for report #{report['id']}")

                except Exception as ex:
                    log.error(f"[ReportDesk] Failed to reconcile thread for report #{report['id']}: {ex}")

        except Exception as e:
            log.debug(f"[ReportDesk] Reconcile loop tick error: {e}")

    @reconcile_loop.before_loop
    async def before_reconcile(self):
        await self.bot.wait_until_ready()

async def setup(bot: commands.Bot):
    await bot.add_cog(ReportDeskCog(bot))
