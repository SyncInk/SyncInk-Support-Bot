import asyncio
import re
from typing import Optional
import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed, BRAND_ACCENT, ERROR_COLOR
from utils.metrics import metrics
from utils.logger import log
from services.settings_service import SettingsService
from database import db
from utils.emojis import Emojis, EmojiPartials, format_discord_emojis

REQUIRED_SUGGESTION_CHANNEL_ID = 1546548728721178724
DEVELOPER_ROLE_ID = 1531882215795855511


def _status_display_for(db_status: str) -> str:
    st = (db_status or "PENDING").upper().strip()
    if st == "APPROVED":
        return f"{Emojis.APPROVED} Approved / Planned"
    if st == "IMPLEMENTED":
        return f"{Emojis.CHECK_YES} Implemented"
    if st == "DECLINED":
        return f"{Emojis.CANCELLED} Cancelled"
    return f"{Emojis.PENDING} Pending Review"


async def _cleanup_thread_status_messages(
    channel: Optional[discord.abc.Messageable],
    bot_user_id: int,
    skip_ids: Optional[set[int]] = None,
    keep_latest: int = 0,
):
    """Deletes previous bot status-update notifications inside a request thread."""
    if not channel or not hasattr(channel, "history"):
        return
    skip = skip_ids or set()
    status_msgs: list[discord.Message] = []
    try:
        async for m in channel.history(limit=60):
            if m.id in skip:
                continue
            if m.author.id != bot_user_id or not m.embeds:
                continue
            emb = m.embeds[0]
            title = emb.title or ""
            desc = emb.description or ""
            # Match status-update notifications while never touching Feature Request Controls
            if "Controls" in title:
                continue
            if "Status updated to" in desc or (
                "Action Successful" in title and "has been posted" not in desc
            ):
                status_msgs.append(m)
    except (discord.Forbidden, discord.HTTPException):
        return

    # channel.history returns newest-first; keep_latest=0 deletes all older status notifications
    for idx, stale_msg in enumerate(status_msgs):
        if idx < keep_latest:
            continue
        try:
            await stale_msg.delete()
        except (discord.NotFound, discord.Forbidden, discord.HTTPException):
            pass


class SuggestionVoteView(discord.ui.View):
    def __init__(self, request_id: int = 0, upvotes: int = 0, downvotes: int = 0):
        super().__init__(timeout=None)
        self.request_id = request_id
        self.upvotes = upvotes
        self.downvotes = downvotes
        self._update_buttons()

    def _update_buttons(self):
        for child in self.children:
            if isinstance(child, discord.ui.Button):
                if child.custom_id and child.custom_id.startswith("vote_up"):
                    child.label = f"Upvote ({self.upvotes})"
                elif child.custom_id and child.custom_id.startswith("vote_down"):
                    child.label = f"Downvote ({self.downvotes})"

    @discord.ui.button(
        emoji=EmojiPartials.APPROVED,
        label="Upvote (0)",
        style=discord.ButtonStyle.green,
        custom_id="vote_up",
    )
    async def upvote(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._handle_vote(interaction, "UP")

    @discord.ui.button(
        emoji=EmojiPartials.REFUSED,
        label="Downvote (0)",
        style=discord.ButtonStyle.red,
        custom_id="vote_down",
    )
    async def downvote(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._handle_vote(interaction, "DOWN")

    async def _handle_vote(self, interaction: discord.Interaction, vote_type: str):
        user_id = interaction.user.id
        req_id = self.request_id

        # Support persistent clicks after bot restarts by resolving request_id from message_id
        if not req_id and interaction.message:
            req_id = await db.fetchval(
                "SELECT id FROM feature_requests WHERE message_id = $1",
                interaction.message.id,
            )
        if not req_id:
            return await interaction.response.send_message(
                f"{Emojis.REFUSED} Could not locate this feature request in the database.",
                ephemeral=True,
            )

        existing = await db.fetchrow(
            "SELECT vote_type FROM feature_request_votes WHERE request_id = $1 AND user_id = $2",
            req_id,
            user_id,
        )

        if existing and existing["vote_type"] == vote_type:
            await db.execute(
                "DELETE FROM feature_request_votes WHERE request_id = $1 AND user_id = $2",
                req_id,
                user_id,
            )
            resp_msg = f"Your {vote_type.lower()}vote has been removed."
        else:
            await db.execute(
                """
                INSERT INTO feature_request_votes (request_id, user_id, vote_type)
                VALUES ($1, $2, $3)
                ON CONFLICT (request_id, user_id) DO UPDATE SET vote_type = $3
                """,
                req_id,
                user_id,
                vote_type,
            )
            resp_msg = f"Your {vote_type.lower()}vote has been recorded."

        counts = await db.fetchrow(
            """
            SELECT
                COUNT(*) FILTER (WHERE vote_type = 'UP') AS up_count,
                COUNT(*) FILTER (WHERE vote_type = 'DOWN') AS down_count
            FROM feature_request_votes WHERE request_id = $1
            """,
            req_id,
        )

        upvotes = counts["up_count"] if counts else 0
        downvotes = counts["down_count"] if counts else 0

        await db.execute(
            "UPDATE feature_requests SET upvotes = $1, downvotes = $2 WHERE id = $3",
            upvotes,
            downvotes,
            req_id,
        )

        updated_view = SuggestionVoteView(req_id, upvotes=upvotes, downvotes=downvotes)

        if interaction.message and interaction.message.embeds:
            embed = interaction.message.embeds[0]
            for i, field in enumerate(embed.fields):
                if "Community Votes" in field.name or "Votes" in field.name:
                    embed.set_field_at(
                        i,
                        name="🗳️ **Community Votes**",
                        value=f"{Emojis.APPROVED} **{upvotes}** Upvotes   •   {Emojis.REFUSED} **{downvotes}** Downvotes",
                        inline=False,
                    )
                elif "Status" in field.name:
                    embed.set_field_at(
                        i,
                        name=f"{Emojis.LOADING} **Status**",
                        value=format_discord_emojis(field.value),
                        inline=True,
                    )
            try:
                await interaction.response.edit_message(embed=embed, view=updated_view)
            except discord.HTTPException:
                if not interaction.response.is_done():
                    await interaction.response.edit_message(view=updated_view)
        else:
            await interaction.response.edit_message(view=updated_view)

        await interaction.followup.send(resp_msg, ephemeral=True)


class FeatureRequestStaffView(discord.ui.View):
    def __init__(self, request_id: int = 0, message_id: int = 0, channel_id: int = 0):
        super().__init__(timeout=None)
        self.request_id = request_id
        self.message_id = message_id
        self.channel_id = channel_id

    async def _check_perm(self, interaction: discord.Interaction) -> bool:
        guild = interaction.guild
        if not guild:
            return False
        is_owner = interaction.user.id == guild.owner_id
        has_dev = any(
            r.id == DEVELOPER_ROLE_ID for r in getattr(interaction.user, "roles", [])
        )
        is_admin = getattr(interaction.user.guild_permissions, "administrator", False)
        if not (is_owner or has_dev or is_admin):
            await interaction.response.send_message(
                f"{Emojis.REFUSED} Only the Server Owner and Developers can update request status.",
                ephemeral=True,
            )
            return False
        return True

    async def _resolve_target(self, interaction: discord.Interaction):
        req_id = self.request_id
        msg_id = self.message_id
        chan_id = self.channel_id

        if not req_id and interaction.message and interaction.message.embeds:
            title = interaction.message.embeds[0].title or ""
            desc = interaction.message.embeds[0].description or ""
            m = re.search(r"#(\d+)", desc) or re.search(r"#(\d+)", title)
            if m:
                req_id = int(m.group(1))

        # Fallback: inside a thread, thread.id matches the starter request message_id
        if not req_id and isinstance(interaction.channel, discord.Thread):
            row = await db.fetchrow(
                "SELECT id, message_id, channel_id FROM feature_requests WHERE message_id = $1",
                interaction.channel.id,
            )
            if row:
                return row["id"], row["message_id"], row["channel_id"]

        if req_id and (not msg_id or not chan_id):
            row = await db.fetchrow(
                "SELECT message_id, channel_id FROM feature_requests WHERE id = $1",
                req_id,
            )
            if row:
                msg_id = row["message_id"]
                chan_id = row["channel_id"]

        return req_id, msg_id, chan_id

    async def _update_status(
        self, interaction: discord.Interaction, db_status: str, display_text: str
    ):
        if not await self._check_perm(interaction):
            return

        await interaction.response.defer()

        req_id, msg_id, chan_id = await self._resolve_target(interaction)
        if not req_id:
            await interaction.followup.send(
                f"{Emojis.REFUSED} Could not resolve feature request ID.",
                ephemeral=True,
            )
            return

        row = await db.fetchrow(
            "UPDATE feature_requests SET status = $1 WHERE id = $2 RETURNING upvotes, downvotes",
            db_status,
            req_id,
        )
        upvotes = row["upvotes"] if row and row["upvotes"] is not None else 0
        downvotes = row["downvotes"] if row and row["downvotes"] is not None else 0

        # Refresh starter embed in #feature-suggestion with updated status & emojis
        channel = interaction.guild.get_channel(chan_id) if chan_id else None
        if channel and msg_id:
            try:
                msg = await channel.fetch_message(msg_id)
                if msg and msg.embeds:
                    embed = msg.embeds[0]
                    for i, field in enumerate(embed.fields):
                        if "Status" in field.name:
                            embed.set_field_at(
                                i,
                                name=f"{Emojis.LOADING} **Status**",
                                value=f"**{display_text}**",
                                inline=True,
                            )
                            break
                    await msg.edit(
                        embed=embed,
                        view=SuggestionVoteView(req_id, upvotes=upvotes, downvotes=downvotes),
                    )
            except Exception as e:
                log.warning(f"Failed editing starter request #{req_id}: {e}")

        # Refresh the control message view so older pre-restart panels also upgrade their button emojis
        try:
            if interaction.message and interaction.message.embeds:
                ctrl_embed = interaction.message.embeds[0]
                await interaction.message.edit(
                    embed=ctrl_embed,
                    view=FeatureRequestStaffView(req_id, msg_id or 0, chan_id or 0),
                )
        except Exception:
            pass

        # Post single crisp status message without footer, then remove all older status logs
        status_embed = SuccessEmbed(
            f"Status updated to **{display_text}** by {interaction.user.mention}.",
            footer=False,
        )
        new_msg = await interaction.followup.send(embed=status_embed, wait=True)

        skip = {new_msg.id}
        if interaction.message:
            skip.add(interaction.message.id)

        bot_id = interaction.client.user.id if interaction.client.user else 0
        await _cleanup_thread_status_messages(
            interaction.channel, bot_user_id=bot_id, skip_ids=skip, keep_latest=0
        )

    @discord.ui.button(
        label="Approve",
        style=discord.ButtonStyle.green,
        emoji=EmojiPartials.APPROVED,
        custom_id="req_staff_approve",
    )
    async def approve_btn(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        await self._update_status(
            interaction, "APPROVED", f"{Emojis.APPROVED} Approved / Planned"
        )

    @discord.ui.button(
        label="Cancel",
        style=discord.ButtonStyle.red,
        emoji=EmojiPartials.CANCELLED,
        custom_id="req_staff_cancel",
    )
    async def cancel_btn(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        await self._update_status(
            interaction, "DECLINED", f"{Emojis.CANCELLED} Cancelled"
        )

    @discord.ui.button(
        label="Implemented",
        style=discord.ButtonStyle.primary,
        emoji=EmojiPartials.CHECK_YES,
        custom_id="req_staff_implemented",
    )
    async def implemented_btn(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        await self._update_status(
            interaction, "IMPLEMENTED", f"{Emojis.CHECK_YES} Implemented"
        )

    @discord.ui.button(
        label="Pending",
        style=discord.ButtonStyle.secondary,
        emoji=EmojiPartials.PENDING,
        custom_id="req_staff_pending",
    )
    async def pending_btn(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        await self._update_status(
            interaction, "PENDING", f"{Emojis.PENDING} Pending Review"
        )


class FeatureRequestModal(discord.ui.Modal, title="Submit Feature Request"):
    feature_title = discord.ui.TextInput(
        label="Feature Title",
        style=discord.TextStyle.short,
        placeholder="Short summary (e.g. 8D Audio Filter for SyncInk Radio)",
        required=True,
        min_length=3,
        max_length=120,
    )
    feature_description = discord.ui.TextInput(
        label="Detailed Description",
        style=discord.TextStyle.paragraph,
        placeholder="Explain what the feature should do and why it would benefit the community...",
        required=True,
        min_length=10,
        max_length=2000,
    )

    def __init__(
        self,
        cog: "Feedback",
        default_title: str = "",
        default_description: str = "",
        launcher_message: Optional[discord.Message] = None,
    ):
        super().__init__()
        self.cog = cog
        self.launcher_message = launcher_message
        if default_title:
            self.feature_title.default = default_title.strip()[:120]
        if default_description:
            self.feature_description.default = default_description.strip()[:2000]

    async def on_submit(self, interaction: discord.Interaction):
        if not interaction.guild or interaction.channel_id != REQUIRED_SUGGESTION_CHANNEL_ID:
            if not interaction.guild or interaction.guild.get_channel(REQUIRED_SUGGESTION_CHANNEL_ID):
                embed = SyncInkEmbed(
                    title=f"{Emojis.REFUSED} Channel Restricted",
                    description=f"This command can only be used in <#{REQUIRED_SUGGESTION_CHANNEL_ID}>.",
                    color=ERROR_COLOR,
                    footer=False,
                )
                await interaction.response.send_message(embed=embed, ephemeral=True)
                return

        await interaction.response.defer(ephemeral=True)

        if self.launcher_message:
            try:
                await self.launcher_message.delete()
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                pass

        await self.cog._process_suggestion(
            interaction,
            self.feature_title.value,
            self.feature_description.value,
            deferred=True,
        )


class FeatureRequestLauncherView(discord.ui.View):
    """Temporary private-action launcher spawned by `?feature request` so users get a native modal + ephemeral confirmation."""

    def __init__(
        self,
        cog: "Feedback",
        author_id: int,
        default_title: str = "",
        default_description: str = "",
        timeout: float = 60.0,
    ):
        super().__init__(timeout=timeout)
        self.cog = cog
        self.author_id = author_id
        self.default_title = default_title
        self.default_description = default_description

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author_id:
            await interaction.response.send_message(
                embed=SyncInkEmbed(
                    title=f"{Emojis.REFUSED} Not Your Prompt",
                    description="Run `?feature request` or `/feature request` to open your own feature request form.",
                    color=ERROR_COLOR,
                    footer=False,
                ),
                ephemeral=True,
            )
            return False
        return True

    @discord.ui.button(
        label="Open Feature Form",
        style=discord.ButtonStyle.primary,
        emoji=EmojiPartials.SUGGESTION,
    )
    async def open_form(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        modal = FeatureRequestModal(
            cog=self.cog,
            default_title=self.default_title,
            default_description=self.default_description,
            launcher_message=interaction.message,
        )
        await interaction.response.send_modal(modal)

    @discord.ui.button(
        label="Cancel",
        style=discord.ButtonStyle.secondary,
        emoji=EmojiPartials.CANCELLED,
    )
    async def dismiss(
        self, interaction: discord.Interaction, button: discord.ui.Button
    ):
        await interaction.response.defer()
        if interaction.message:
            try:
                await interaction.message.delete()
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                pass
        self.stop()


class Feedback(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self._refreshed_on_boot = False

    feature_slash = app_commands.Group(
        name="feature",
        description="Submit and manage SyncInk platform feature requests.",
        guild_only=True,
    )

    @commands.Cog.listener()
    async def on_ready(self):
        if self._refreshed_on_boot:
            return
        self._refreshed_on_boot = True
        asyncio.create_task(self._refresh_existing_feature_requests())

    async def _refresh_existing_feature_requests(self):
        """Updates stale loading/cancelled emojis, cleans duplicate thread status logs, and keeps old cards interactive."""
        await self.bot.wait_until_ready()
        await asyncio.sleep(2)
        try:
            rows = await db.fetch(
                """
                SELECT id, guild_id, channel_id, message_id, status, upvotes, downvotes
                FROM feature_requests
                WHERE message_id IS NOT NULL AND channel_id IS NOT NULL
                ORDER BY id DESC
                LIMIT 100
                """
            )
        except Exception as e:
            log.warning(f"[Feedback] Could not query existing feature requests for refresh: {e}")
            return

        if not rows:
            return

        bot_id = self.bot.user.id if self.bot.user else 0
        refreshed = 0

        for row in rows:
            req_id = row["id"]
            guild = self.bot.get_guild(row["guild_id"])
            if not guild:
                continue
            channel = guild.get_channel(row["channel_id"])
            if not channel or not hasattr(channel, "fetch_message"):
                continue

            upvotes = row["upvotes"] if row["upvotes"] is not None else 0
            downvotes = row["downvotes"] if row["downvotes"] is not None else 0
            db_status = row["status"] or "PENDING"

            try:
                msg = await channel.fetch_message(row["message_id"])
            except Exception:
                continue

            # 1. Refresh starter card embed emojis + persistent Vote buttons
            try:
                if msg.embeds:
                    embed = msg.embeds[0]
                    for i, field in enumerate(embed.fields):
                        if "Status" in field.name:
                            new_val = f"**{_status_display_for(db_status)}**"
                            embed.set_field_at(
                                i,
                                name=f"{Emojis.LOADING} **Status**",
                                value=new_val,
                                inline=True,
                            )
                        elif "Community Votes" in field.name or "Votes" in field.name:
                            embed.set_field_at(
                                i,
                                name="🗳️ **Community Votes**",
                                value=f"{Emojis.APPROVED} **{upvotes}** Upvotes   •   {Emojis.REFUSED} **{downvotes}** Downvotes",
                                inline=False,
                            )
                    await msg.edit(
                        embed=embed,
                        view=SuggestionVoteView(req_id, upvotes=upvotes, downvotes=downvotes),
                    )
                    refreshed += 1
            except Exception as e:
                log.debug(f"[Feedback] Skipped card refresh for #{req_id}: {e}")

            # 2. Refresh thread controls (Cancel emoji) & keep only latest status message without footer
            thread = guild.get_thread(msg.id)
            if not thread and getattr(msg, "flags", None) and msg.flags.has_thread:
                try:
                    fetched = await guild.fetch_channel(msg.id)
                    if isinstance(fetched, discord.Thread):
                        thread = fetched
                except Exception:
                    thread = None

            if thread and not thread.archived:
                try:
                    ctrl_msg: Optional[discord.Message] = None
                    latest_status_msg: Optional[discord.Message] = None
                    async for m in thread.history(limit=60):
                        if m.author.id != bot_id or not m.embeds:
                            continue
                        emb = m.embeds[0]
                        title = emb.title or ""
                        desc = emb.description or ""
                        if "Controls" in title and ctrl_msg is None:
                            ctrl_msg = m
                        elif latest_status_msg is None and (
                            "Status updated to" in desc
                            or ("Action Successful" in title and "has been posted" not in desc)
                        ):
                            latest_status_msg = m

                    if ctrl_msg:
                        ctrl_emb = ctrl_msg.embeds[0]
                        clean_ctrl = discord.Embed(
                            title=format_discord_emojis(ctrl_emb.title or f"{Emojis.SETTINGS} Feature Request Controls"),
                            description=format_discord_emojis(ctrl_emb.description or ""),
                            color=ctrl_emb.color or BRAND_ACCENT,
                        )
                        await ctrl_msg.edit(
                            embed=clean_ctrl,
                            view=FeatureRequestStaffView(req_id, msg.id, channel.id),
                        )

                    if latest_status_msg:
                        st_emb = latest_status_msg.embeds[0]
                        clean_st = SuccessEmbed(
                            format_discord_emojis(st_emb.description or ""),
                            footer=False,
                        )
                        await latest_status_msg.edit(embed=clean_st)

                    skip_ids = {x.id for x in (ctrl_msg, latest_status_msg) if x}
                    await _cleanup_thread_status_messages(
                        thread, bot_user_id=bot_id, skip_ids=skip_ids, keep_latest=0
                    )
                except Exception as te:
                    log.debug(f"[Feedback] Skipped thread refresh for #{req_id}: {te}")

            await asyncio.sleep(0.25)

        if refreshed:
            log.info(f"[Feedback] Refreshed emojis and persistent views on {refreshed} existing feature request(s).")

    async def _resolve_suggestion_channel(
        self, guild: discord.Guild
    ) -> Optional[discord.TextChannel]:
        ch = guild.get_channel(REQUIRED_SUGGESTION_CHANNEL_ID)
        if ch:
            return ch
        settings = await SettingsService.get_guild_settings(guild.id)
        chan_id = settings.get("suggestion_channel_id")
        if chan_id:
            ch = guild.get_channel(chan_id)
            if ch:
                return ch

        for channel in guild.text_channels:
            name = channel.name.lower()
            if any(
                term in name
                for term in ["feature-request", "feature", "suggest", "ideas", "feedback"]
            ):
                return channel

        return None

    async def _process_suggestion(
        self, target: discord.Interaction, title: str, description: str, deferred: bool = True
    ):
        metrics.record_suggestion()

        guild = target.guild
        author = target.user
        source_channel = target.channel

        title = (title or "Suggestion").strip()[:240]
        description = (description or title).strip()[:3800]

        target_channel = await self._resolve_suggestion_channel(guild)
        if not target_channel:
            target_channel = source_channel

        row = await db.fetchrow(
            """
            INSERT INTO feature_requests (guild_id, user_id, channel_id, title, content, status)
            VALUES ($1, $2, $3, $4, $5, 'PENDING')
            RETURNING id
            """,
            guild.id,
            author.id,
            target_channel.id,
            title,
            description,
        )
        request_id = row["id"]

        embed = SyncInkEmbed(
            title=f"{Emojis.SUGGESTION} **Feature Request #{request_id}: {title}**",
            color=BRAND_ACCENT,
        )
        embed.set_author(
            name=f"{author.display_name} ({author})",
            icon_url=author.display_avatar.url,
        )
        embed.description = f"```\n{description}\n```"
        embed.add_field(
            name=f"{Emojis.MEMBERS} **Submitted By**",
            value=author.mention,
            inline=True,
        )
        embed.add_field(
            name=f"{Emojis.LOADING} **Status**",
            value=f"**{_status_display_for('PENDING')}**",
            inline=True,
        )
        embed.add_field(
            name="🗳️ **Community Votes**",
            value=f"{Emojis.APPROVED} **0** Upvotes   •   {Emojis.REFUSED} **0** Downvotes",
            inline=False,
        )
        embed.set_footer(
            text=f"SyncInk Platform • Request #{request_id}",
            icon_url="https://files.catbox.moe/74l9su.png",
        )

        view = SuggestionVoteView(request_id, upvotes=0, downvotes=0)

        try:
            sent_msg = await target_channel.send(embed=embed, view=view)
            await db.execute(
                "UPDATE feature_requests SET message_id = $1 WHERE id = $2",
                sent_msg.id,
                request_id,
            )

            try:
                thread = await sent_msg.create_thread(
                    name=f"Request #{request_id}: {title[:35]}"
                )

                if guild.owner:
                    try:
                        await thread.add_user(guild.owner)
                    except Exception:
                        pass
                elif guild.owner_id:
                    owner_mem = guild.get_member(guild.owner_id)
                    if owner_mem:
                        try:
                            await thread.add_user(owner_mem)
                        except Exception:
                            pass

                dev_role = guild.get_role(DEVELOPER_ROLE_ID)
                if dev_role:
                    for dev_mem in dev_role.members:
                        try:
                            await thread.add_user(dev_mem)
                        except Exception:
                            pass

                staff_view = FeatureRequestStaffView(
                    request_id, sent_msg.id, target_channel.id
                )
                staff_ctrl_embed = SyncInkEmbed(
                    title=f"{Emojis.SETTINGS} Feature Request Controls",
                    description=(
                        f"**Feature Request #{request_id}: {title}**\n\n"
                        f"Discussion thread created for this feature request.\n"
                        f"Server Owner and Developers with <@&{DEVELOPER_ROLE_ID}> can update the status below."
                    ),
                    color=BRAND_ACCENT,
                    footer=False,
                )
                await thread.send(embed=staff_ctrl_embed, view=staff_view)
            except Exception as thread_err:
                log.warning(
                    f"Failed creating feature request discussion thread: {thread_err}"
                )

            resp = SuccessEmbed(
                f"Your feature request **#{request_id}** has been posted in {target_channel.mention}.",
                footer=False,
            )
            if deferred or target.response.is_done():
                await target.followup.send(embed=resp, ephemeral=True)
            else:
                await target.response.send_message(embed=resp, ephemeral=True)
        except discord.Forbidden:
            err = ErrorEmbed(
                description="Failed to post feature request.",
                resolution="Bot lacks permissions to send messages in the target channel.",
                footer=False,
            )
            if deferred or target.response.is_done():
                await target.followup.send(embed=err, ephemeral=True)
            else:
                await target.response.send_message(embed=err, ephemeral=True)

    @staticmethod
    def _parse_optional_draft(text: Optional[str]) -> tuple[str, str]:
        if not text or not text.strip():
            return "", ""
        raw = text.strip()
        if "|" in raw:
            parts = raw.split("|", 1)
            return parts[0].strip()[:120], parts[1].strip()[:2000]
        if "\n" in raw:
            parts = raw.split("\n", 1)
            return parts[0].strip()[:120], parts[1].strip()[:2000]
        if len(raw) <= 60:
            return raw, ""
        return "", raw[:2000]

    # ── Slash Command: ONLY /feature request (opens modal form cleanly) ──
    @feature_slash.command(
        name="request",
        description="Submit a feature request via an interactive form.",
    )
    async def slash_feature_group_request(self, interaction: discord.Interaction):
        if not interaction.guild or (
            interaction.guild.get_channel(REQUIRED_SUGGESTION_CHANNEL_ID)
            and interaction.channel_id != REQUIRED_SUGGESTION_CHANNEL_ID
        ):
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} Channel Restricted",
                description=f"This command can only be used in <#{REQUIRED_SUGGESTION_CHANNEL_ID}>.",
                color=ERROR_COLOR,
                footer=False,
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        await interaction.response.send_modal(FeatureRequestModal(cog=self))

    # ── Prefix Command: ONLY ?feature request (opens interactive modal launcher + deletes trace) ──
    @commands.group(
        name="feature",
        invoke_without_command=True,
        description="Submit a formal feature request via `?feature request`.",
    )
    @commands.guild_only()
    async def feature_group(self, ctx: commands.Context, *, text: str = None):
        try:
            await ctx.message.delete()
        except (discord.NotFound, discord.Forbidden, discord.HTTPException):
            pass

        if ctx.guild and ctx.guild.get_channel(REQUIRED_SUGGESTION_CHANNEL_ID):
            if ctx.channel.id != REQUIRED_SUGGESTION_CHANNEL_ID:
                embed = SyncInkEmbed(
                    title=f"{Emojis.REFUSED} Channel Restricted",
                    description=f"Use `/feature request` or `?feature request` inside <#{REQUIRED_SUGGESTION_CHANNEL_ID}>.",
                    color=ERROR_COLOR,
                    footer=False,
                )
                await ctx.send(embed=embed, delete_after=7)
                return

        hint = SyncInkEmbed(
            title=f"{Emojis.SUGGESTION} Feature Request Usage",
            description="Run **`/feature request`** or **`?feature request`** to open the submission form.",
            color=BRAND_ACCENT,
            footer=False,
        )
        await ctx.send(content=ctx.author.mention, embed=hint, delete_after=8)

    @feature_group.command(
        name="request",
        description="Open an interactive feature request form.",
    )
    @commands.guild_only()
    async def feature_group_request(self, ctx: commands.Context, *, text: str = None):
        try:
            await ctx.message.delete()
        except (discord.NotFound, discord.Forbidden, discord.HTTPException):
            pass

        if ctx.guild and ctx.guild.get_channel(REQUIRED_SUGGESTION_CHANNEL_ID):
            if ctx.channel.id != REQUIRED_SUGGESTION_CHANNEL_ID:
                embed = SyncInkEmbed(
                    title=f"{Emojis.REFUSED} Channel Restricted",
                    description=f"This command can only be used in <#{REQUIRED_SUGGESTION_CHANNEL_ID}>.",
                    color=ERROR_COLOR,
                    footer=False,
                )
                await ctx.send(embed=embed, delete_after=7)
                return

        draft_title, draft_desc = self._parse_optional_draft(text)
        has_draft = bool(draft_title or draft_desc)

        launcher_embed = SyncInkEmbed(
            title=f"{Emojis.SUGGESTION} Submit Feature Request",
            description=(
                f"{ctx.author.mention}, tap **Open Feature Form** below to fill out your title and description privately.\n"
                + ("Your draft text has been pre-filled.\n" if has_draft else "")
                + "-# This prompt deletes automatically after submission or in 60s. Use `/feature request` to open the form directly."
            ),
            color=BRAND_ACCENT,
            footer=False,
        )
        view = FeatureRequestLauncherView(
            cog=self,
            author_id=ctx.author.id,
            default_title=draft_title,
            default_description=draft_desc,
            timeout=60.0,
        )
        await ctx.send(
            content=ctx.author.mention,
            embed=launcher_embed,
            view=view,
            delete_after=60,
        )

    @commands.command(
        name="set_suggestion_status",
        aliases=["set_status"],
        hidden=True,
        description="Update the status of a feature request (Staff Only).",
    )
    @commands.has_permissions(manage_guild=True)
    async def set_status(
        self, ctx: commands.Context, request_id: int = None, status: str = None
    ):
        if request_id is None or status is None:
            await ctx.send(
                embed=ErrorEmbed(
                    description="Missing required arguments.",
                    resolution="Usage: `?set_suggestion_status <request_id> <pending|approved|implemented|cancelled>`",
                    footer=False,
                )
            )
            return

        STATUS_MAP = {
            "pending": ("PENDING", _status_display_for("PENDING")),
            "approved": ("APPROVED", _status_display_for("APPROVED")),
            "planned": ("APPROVED", _status_display_for("APPROVED")),
            "implemented": ("IMPLEMENTED", _status_display_for("IMPLEMENTED")),
            "done": ("IMPLEMENTED", _status_display_for("IMPLEMENTED")),
            "declined": ("DECLINED", _status_display_for("DECLINED")),
            "rejected": ("DECLINED", _status_display_for("DECLINED")),
            "cancelled": ("DECLINED", _status_display_for("DECLINED")),
            "canceled": ("DECLINED", _status_display_for("DECLINED")),
        }
        status_key = status.lower().strip()
        if status_key not in STATUS_MAP:
            valid_statuses = "pending, approved, implemented, cancelled"
            await ctx.send(
                embed=ErrorEmbed(
                    description=f"Invalid status `{status}`.",
                    resolution=f"Valid options: `{valid_statuses}`\nUsage: `?set_suggestion_status <id> <status>`",
                    footer=False,
                )
            )
            return

        db_status, display_name = STATUS_MAP[status_key]
        req = await db.fetchrow(
            "SELECT * FROM feature_requests WHERE id = $1 AND guild_id = $2",
            request_id,
            ctx.guild.id,
        )
        if not req:
            return await ctx.send(
                embed=ErrorEmbed("Feature request not found.", footer=False)
            )

        await db.execute(
            "UPDATE feature_requests SET status = $1 WHERE id = $2",
            db_status,
            request_id,
        )

        channel = ctx.guild.get_channel(req["channel_id"])
        if channel and req["message_id"]:
            try:
                msg = await channel.fetch_message(req["message_id"])
                if msg and msg.embeds:
                    embed = msg.embeds[0]
                    for i, field in enumerate(embed.fields):
                        if "Status" in field.name:
                            embed.set_field_at(
                                i,
                                name=f"{Emojis.LOADING} **Status**",
                                value=f"**{display_name}**",
                                inline=True,
                            )
                            break
                    await msg.edit(embed=embed)

                thread = ctx.guild.get_thread(req["message_id"])
                if not thread:
                    try:
                        fetched = await ctx.guild.fetch_channel(req["message_id"])
                        if isinstance(fetched, discord.Thread):
                            thread = fetched
                    except Exception:
                        thread = None
                if thread:
                    bot_id = self.bot.user.id if self.bot.user else 0
                    await _cleanup_thread_status_messages(thread, bot_user_id=bot_id)
                    await thread.send(
                        embed=SuccessEmbed(
                            f"Status updated to **{display_name}** by {ctx.author.mention}.",
                            footer=False,
                        )
                    )
            except Exception:
                pass

        await ctx.send(
            embed=SuccessEmbed(
                f"Feature Request **#{request_id}** status updated to **{display_name}**.",
                footer=False,
            )
        )


async def setup(bot: commands.Bot):
    await bot.add_cog(Feedback(bot))
