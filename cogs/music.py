import asyncio
import math
import os
import random
import sys
import time
from typing import Optional, Literal, Union

import discord
from discord.ext import commands
from discord import app_commands

from services.music_service import (
    MusicService,
    GuildMusicQueue,
    Track,
    RADIO_STATIONS,
    clean_title,
    format_duration,
)
from services.radio_service import (
    RadioService,
    COUNTRY_FLAGS,
    POPULAR_RADIO_COUNTRIES,
    get_country_flag,
)
from services.autoplay_service import AutoPlayService, normalize_title
from utils.emojis import Emojis, EmojiPartials
from utils.logger import log

ERROR_MESSAGE = (
    "### <a:refused:1547035200926654624> Something went wrong while running the command, "
    "please try again or contact server administrator on "
    "https://discord.com/channels/1520457643842342912/1520460764937322566"
)

BRAND_COLOR = 0x7b2cbf  # SyncInk Cyber Violet
BRAND_LOGO_URL = "https://files.catbox.moe/74l9su.png"

MUSIC_BOOSTER_ROLE_ID = int(os.getenv("MUSIC_BOOSTER_ROLE_ID", "1558584451724738640"))
MUSIC_COMMAND_CHANNEL_ID = int(os.getenv("MUSIC_COMMAND_CHANNEL_ID", "1520749466330857492"))

def make_radio_track(station: dict, country_name: str, requester: discord.Member, flag: Optional[str] = None) -> Track:
    if not flag:
        flag = get_country_flag(country_name)
    name = station.get("name", "Live Radio").strip()
    stream_url = station.get("url") or station.get("url_resolved")
    homepage = station.get("homepage") or stream_url
    favicon = station.get("favicon", "").strip() if station.get("favicon") else ""
    if not favicon or not (favicon.startswith("http://") or favicon.startswith("https://")):
        favicon = BRAND_LOGO_URL
    return Track(
        title=name,
        clean_title=name,
        author=f"{flag} {country_name} Live Radio",
        duration=0,
        url=homepage,
        stream_url=stream_url,
        thumbnail=favicon,
        platform="radio",
        requested_by=requester,
        is_live=True,
        is_radio=True,
        radio_station_id=station.get("stationuuid") or country_name
    )

def make_error_embed(
    description: str = ERROR_MESSAGE,
    details: Optional[str] = None,
    is_warning: bool = False
) -> discord.Embed:
    icon = Emojis.WARNING
    color = 0xFEE75C if is_warning else 0xED4245

    is_raw_header = description.strip().startswith("###")

    formatted_desc = description
    if not (description.startswith("<") or description.startswith(":") or description.startswith("⚠️") or description.startswith("❌") or is_raw_header):
        formatted_desc = f"{icon} **{description}**"
    elif is_raw_header and not ("<a:syncwarning" in description or "<:syncwarning" in description):
        formatted_desc = description.replace("### ", f"### {icon} ", 1)

    if details:
        formatted_desc += f"\n\n> {details}"

    embed = discord.Embed(
        description=formatted_desc,
        color=color
    )
    return embed

async def _delayed_delete_msg(msg: discord.Message, delay: int = 30):
    """Safely delete a message after delay seconds."""
    try:
        await asyncio.sleep(delay)
        await msg.delete()
    except Exception:
        pass

def build_now_playing_embed(queue: GuildMusicQueue) -> discord.Embed:
    current = queue.current_track
    separator = "───────────────────────────────"

    if not current:
        embed = discord.Embed(
            description=(
                f"{Emojis.SYNCINK_MUSIC} **Nothing is currently playing.**\n\n"
                f"{separator}\n\n"
                f"Use `/play` or `/radio` in <#{MUSIC_COMMAND_CHANNEL_ID}> to begin playback."
            ),
            color=BRAND_COLOR,
        )
        embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)
        return embed

    next_track = queue.tracks[0] if queue.tracks else None
    if next_track:
        up_next = f"**[{next_track.clean_title}]({next_track.url})**  •  *{next_track.author}* [{next_track.formatted_duration}]"
    elif queue.autoplay:
        if getattr(queue, "prefetched_autoplay_track", None):
            pref = queue.prefetched_autoplay_track
            up_next = f"{Emojis.AI} **AI AutoPlay Next:** [{pref.clean_title}]({pref.url}) • *{pref.author}*"
        elif getattr(queue, "last_autoplay_meta", None):
            up_next = f"{Emojis.AI} **AI AutoPlay Active** (`{queue.last_autoplay_meta.get('genre', 'Smart Selection')}`)"
        else:
            up_next = f"{Emojis.AI} **AI AutoPlay:** Intelligently matching upcoming tracks..."
    elif (current.is_radio or current.platform == "radio") and queue.active_radio_station:
        up_next = f"{Emojis.RADIO} **24/7 Continuous Radio Station**"
    else:
        up_next = "End of queue (Add tracks with `/play`)"

    station_tag = f"  •  {Emojis.RADIO} `{RADIO_STATIONS[queue.active_radio_station]['genre']}`" if (current.is_radio or current.platform == "radio") and queue.active_radio_station and queue.active_radio_station in RADIO_STATIONS else ""
    loop_tag = f"  •  🔁 `{queue.repeat_mode.upper()}`" if queue.repeat_mode != "off" else ""

    embed = discord.Embed(
        color=BRAND_COLOR,
    )

    embed.description = (
        f"### {Emojis.PLAYING} Now Playing\n"
        f"[{current.clean_title}]({current.url})\n\n"
        f"{current.platform_emoji} **Artist:** {current.author}  •  `{current.formatted_duration}`\n"
        f"{Emojis.TIME} `{queue.get_progress_bar()}`\n\n"
        f"{Emojis.MEMBER} **Requested by:** <@{current.requested_by.id if current.requested_by else 1520522990280769727}>{station_tag}{loop_tag}\n\n"
        f"⏭️ **Up Next:** {up_next}"
    )

    if current.thumbnail and current.thumbnail.startswith("http"):
        embed.set_thumbnail(url=current.thumbnail)

    embed.set_footer(
        text="SyncInk Platform",
        icon_url=BRAND_LOGO_URL,
    )
    return embed

class MusicPlayerLayoutView(discord.ui.LayoutView):
    """
    Discord Components V2 Player Card matching Chip bot layout:
    - Left accent border with SyncInk brand color (0x7b2cbf)
    - Top Section with title, artist, duration, and right Thumbnail accessory
    - Controls Action Row (Pause/Resume, Previous, Next, Stop, Queue)
    - Discord Native Component Separator (type: 14)
    - Requester subtext at the bottom
    """
    def __init__(self, music_cog: 'Music', queue: GuildMusicQueue):
        super().__init__(timeout=None)
        self.music_cog = music_cog
        self.queue = queue
        self.btn_pause_resume: Optional[discord.ui.Button] = None
        self.btn_prev: Optional[discord.ui.Button] = None
        self.btn_skip: Optional[discord.ui.Button] = None
        self.btn_stop: Optional[discord.ui.Button] = None
        self.btn_queue: Optional[discord.ui.Button] = None
        self.build_components()

    def build_components(self):
        self.clear_items()
        current = self.queue.current_track
        if not current:
            txt = discord.ui.TextDisplay("### ▶ Nothing is currently playing")
            self.add_item(discord.ui.Container(txt, accent_color=BRAND_COLOR))
            return

        # 1. Top Section: Track Title, Artist, and Duration with Thumbnail accessory
        title_text = f"### {Emojis.PLAYING} Now Playing\n[{current.clean_title}]({current.url}) by **{current.author}** `[{current.formatted_duration}]`"
        text_disp = discord.ui.TextDisplay(title_text)
        thumb_url = current.thumbnail if (current.thumbnail and current.thumbnail.startswith("http")) else BRAND_LOGO_URL
        sec = discord.ui.Section(text_disp, accessory=discord.ui.Thumbnail(thumb_url))

        # 2. Controls Action Row
        is_paused = bool(self.queue.voice_client and self.queue.voice_client.is_paused())
        self.btn_pause_resume = discord.ui.Button(
            emoji=EmojiPartials.PLAY_BUTTON if is_paused else EmojiPartials.PAUSE_BUTTON,
            style=discord.ButtonStyle.secondary,
            custom_id="m_pause_resume"
        )
        self.btn_pause_resume.callback = self.on_pause_resume

        self.btn_prev = discord.ui.Button(
            emoji=EmojiPartials.PREVIOUS,
            style=discord.ButtonStyle.secondary,
            custom_id="m_prev"
        )
        self.btn_prev.callback = self.on_prev

        self.btn_skip = discord.ui.Button(
            emoji=EmojiPartials.NEXT,
            style=discord.ButtonStyle.secondary,
            custom_id="m_skip"
        )
        self.btn_skip.callback = self.on_skip

        self.btn_stop = discord.ui.Button(
            emoji=EmojiPartials.DELETE,
            style=discord.ButtonStyle.danger,
            custom_id="m_stop"
        )
        self.btn_stop.callback = self.on_stop

        self.btn_queue = discord.ui.Button(
            emoji=EmojiPartials.QUEUE,
            style=discord.ButtonStyle.secondary,
            custom_id="m_queue"
        )
        self.btn_queue.callback = self.on_queue

        row = discord.ui.ActionRow(self.btn_pause_resume, self.btn_prev, self.btn_skip, self.btn_stop, self.btn_queue)

        items = [sec, row]

        # 3. Dedicated AutoPlay Rating Row (ONLY when AutoPlay is enabled)
        if self.queue.autoplay:
            btn_like = discord.ui.Button(
                emoji=EmojiPartials.LIKE,
                label="Like",
                style=discord.ButtonStyle.secondary,
                custom_id="m_ap_like"
            )
            btn_like.callback = self.on_ap_like

            btn_dislike = discord.ui.Button(
                emoji=EmojiPartials.DISLIKE,
                label="Dislike",
                style=discord.ButtonStyle.secondary,
                custom_id="m_ap_dislike"
            )
            btn_dislike.callback = self.on_ap_dislike

            ap_row = discord.ui.ActionRow(btn_like, btn_dislike)
            items.append(ap_row)

        # 4. Separator component
        sep = discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small)
        items.append(sep)

        # 5. Requester / AutoPlay footer
        req_id = current.requested_by.id if (current.requested_by and hasattr(current.requested_by, "id")) else 1520522990280769727
        if self.queue.autoplay and getattr(self.queue, "last_autoplay_meta", None):
            genre_tag = self.queue.last_autoplay_meta.get("genre", "Smart Selection")
            footer_text = f"-# {Emojis.AI} AutoPlay Active (`{genre_tag}`) • Rate with {Emojis.LIKE} or {Emojis.DISLIKE}"
        else:
            footer_text = f"-# {Emojis.MEMBER} Track requested by <@{req_id}>"
        footer = discord.ui.TextDisplay(footer_text)
        items.append(footer)

        cnt = discord.ui.Container(*items, accent_color=BRAND_COLOR)
        self.add_item(cnt)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # 1. Booster role restriction
        if not self.music_cog._is_booster_or_admin(interaction.user, interaction.guild):
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Music & Radio commands are exclusive for <@&{MUSIC_BOOSTER_ROLE_ID}>!",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        # 2. Channel restriction
        if not self.music_cog._is_allowed_channel(interaction.channel_id):
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Music commands can only be used in <#{MUSIC_COMMAND_CHANNEL_ID}>!",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        # 3. Voice channel checks
        if not interaction.user.voice or not interaction.guild.voice_client:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} You must be in the voice channel to use music controls.",
                color=0xFEE75C
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        if interaction.user.voice.channel.id != interaction.guild.voice_client.channel.id:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} You must be in the same voice channel as the bot.",
                color=0xFEE75C
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        return True

    async def on_pause_resume(self, interaction: discord.Interaction):
        vc = self.queue.voice_client
        if not vc:
            embed = discord.Embed(description=f"### {Emojis.WARNING} Not currently connected to voice.", color=0xFEE75C)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        if vc.is_paused():
            vc.resume()
            if self.queue.paused_at is not None:
                self.queue.total_paused_duration += (time.time() - self.queue.paused_at)
                self.queue.paused_at = None
            msg = f"{Emojis.PLAY_BUTTON} Music playback resumed."
        else:
            vc.pause()
            self.queue.paused_at = time.time()
            msg = f"{Emojis.PAUSE_BUTTON} Music playback paused."

        self.build_components()
        await interaction.response.edit_message(view=self)
        await interaction.followup.send(msg, ephemeral=True)

    async def on_prev(self, interaction: discord.Interaction):
        if not self.queue.history:
            embed = discord.Embed(description=f"### {Emojis.WARNING} No previous track in history.", color=0xFEE75C)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        prev_track = self.queue.history.pop()
        if self.queue.current_track:
            self.queue.tracks.insert(0, self.queue.current_track)
        self.queue.tracks.insert(0, prev_track)
        if self.queue.voice_client:
            self.queue.voice_client.stop()
        await interaction.response.send_message(
            f"{Emojis.PREVIOUS} Jumped back to previous track: **{prev_track.clean_title}**",
            ephemeral=True
        )

    async def on_skip(self, interaction: discord.Interaction):
        vc = self.queue.voice_client
        if not vc or not self.queue.current_track:
            embed = discord.Embed(description=f"### {Emojis.WARNING} Nothing is currently playing.", color=0xFEE75C)
            await interaction.response.send_message(embed=embed, ephemeral=True)
        played_sec = self.queue.get_playback_time()
        AutoPlayService.get_instance().record_track_skip(interaction.user.id, self.queue.current_track, played_sec)
        skipped_name = self.queue.current_track.clean_title
        self.queue.manual_skip = True
        vc.stop()
        await interaction.response.send_message(
            f"{Emojis.NEXT} Skipped: **{skipped_name}**",
            ephemeral=True
        )

    async def on_stop(self, interaction: discord.Interaction):
        self.queue.tracks.clear()
        self.queue.active_radio_station = None
        self.queue.active_radio_station_info = None
        self.queue.autoplay = False
        if self.queue.voice_client:
            self.queue.voice_client.stop()
        self.queue.current_track = None
        if self.queue.now_playing_message:
            try:
                await self.queue.now_playing_message.delete()
            except Exception:
                pass
            self.queue.now_playing_message = None
        self.music_cog.start_inactivity_countdown(self.queue, delay=60)
        embed = discord.Embed(
            description=f"{Emojis.DELETE} Playback stopped and queue cleared.",
            color=BRAND_COLOR
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    async def on_queue(self, interaction: discord.Interaction):
        embed = self.music_cog.build_queue_embed(self.queue)
        view = QueueLayoutView(self.music_cog, self.queue, interaction.user.id)
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    async def on_ap_like(self, interaction: discord.Interaction):
        current = self.queue.current_track
        if not current:
            embed = discord.Embed(description=f"### {Emojis.WARNING} Nothing is currently playing.", color=0xFEE75C)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        ok, msg = AutoPlayService.get_instance().record_explicit_feedback(
            interaction.user.id, current, "like"
        )
        embed = discord.Embed(
            description=(
                f"### {Emojis.LIKE} Preference Recorded Successfully\n"
                f"Thank you for rating! Your positive feedback for **{current.clean_title}** by **{current.author}** has been incorporated into your personal taste profile.\n\n"
                f"{Emojis.S_ARROW} **Impact:** AutoPlay will prioritize similar melodies, artists, and acoustic vibes for your future recommendations."
            ),
            color=BRAND_COLOR
        )
        embed.set_footer(text="SyncInk AI AutoPlay DJ", icon_url=BRAND_LOGO_URL)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    async def on_ap_dislike(self, interaction: discord.Interaction):
        current = self.queue.current_track
        if not current:
            embed = discord.Embed(description=f"### {Emojis.WARNING} Nothing is currently playing.", color=0xFEE75C)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        ok, msg = AutoPlayService.get_instance().record_explicit_feedback(
            interaction.user.id, current, "dislike"
        )

        # Invalidate current prefetch so next song immediately avoids this style and provides a better recommendation
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)

        # Do NOT stop playback directly; let current song finish smoothly and refine next recommendation
        embed = discord.Embed(
            description=(
                f"### {Emojis.DISLIKE} Preference Recorded Successfully\n"
                f"Your feedback has been noted. We've marked **{current.clean_title}** by **{current.author}** as disliked in your profile.\n\n"
                f"{Emojis.S_ARROW} **Impact:** Current playback will continue smoothly without interruption, and AutoPlay will refine upcoming selections to avoid this style and deliver better recommendations."
            ),
            color=BRAND_COLOR
        )
        embed.set_footer(text="SyncInk AI AutoPlay DJ", icon_url=BRAND_LOGO_URL)
        await interaction.response.send_message(embed=embed, ephemeral=True)

MusicPlayerView = MusicPlayerLayoutView


class TrackEnqueuedLayoutView(discord.ui.LayoutView):
    """
    Discord Components V2 Track Added notification matching Chip bot layout:
    - Accent colored Container
    - Top Section with position, title, author, duration and right Thumbnail
    - Native Separator
    - Helpful hint footer about /search
    """
    def __init__(self, track: Track, position: int):
        super().__init__(timeout=None)
        self.track = track
        self.position = position
        self.build_components()

    def build_components(self):
        self.clear_items()
        thumb_url = self.track.thumbnail if (self.track.thumbnail and self.track.thumbnail.startswith("http")) else BRAND_LOGO_URL
        header_text = (
            f"### Queued at position #{self.position}\n"
            f"[{self.track.clean_title}]({self.track.url}) by **{self.track.author}** `[{self.track.formatted_duration}]`"
        )
        sec = discord.ui.Section(
            discord.ui.TextDisplay(header_text),
            accessory=discord.ui.Thumbnail(thumb_url)
        )
        sep = discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small)
        hint = discord.ui.TextDisplay("Not the correct track? Try being more specific or use `/search`")
        cnt = discord.ui.Container(sec, sep, hint, accent_color=BRAND_COLOR)
        self.add_item(cnt)


class NowPlayingLayoutView(discord.ui.LayoutView):
    """
    Discord Components V2 Now Playing Card matching Chip bot layout:
    - Left accent border with SyncInk brand color (0x7b2cbf)
    - Top Section with title, artist and album thumbnail
    - Native Separator (visible=True)
    - Playback progress bar with elapsed, total duration, volume and repeat state
    - Native Separator (visible=True)
    - Requester footer with custom member emoji (<:member:1559185207033077901>)
    """
    def __init__(self, queue: GuildMusicQueue):
        super().__init__(timeout=None)
        self.queue = queue
        self.build_components()

    def build_components(self):
        self.clear_items()
        current = self.queue.current_track
        if not current:
            txt = discord.ui.TextDisplay(f"### {Emojis.WARNING} Nothing is currently playing.")
            self.add_item(discord.ui.Container(txt, accent_color=BRAND_COLOR))
            return

        thumb_url = current.thumbnail if (current.thumbnail and current.thumbnail.startswith("http")) else BRAND_LOGO_URL
        sec = discord.ui.Section(
            discord.ui.TextDisplay(f"### {Emojis.PLAYING} Now Playing\n[{current.clean_title}]({current.url}) by **{current.author}**"),
            accessory=discord.ui.Thumbnail(thumb_url)
        )
        sep1 = discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small)

        info_lines = [self.queue.get_progress_bar()]

        extra = [f"Volume: `{self.queue.volume}%`", f"Repeat: `{self.queue.repeat_mode.upper()}`"]
        if current.is_radio or current.platform == "radio":
            if self.queue.active_radio_station:
                station_info = RADIO_STATIONS.get(self.queue.active_radio_station)
                if station_info:
                    genre = station_info.get("genre", "Radio")
                    extra.append(f"Station: `{genre}`")
                else:
                    extra.append(f"Radio: `{self.queue.active_radio_station}`")
            elif current.clean_title:
                extra.append(f"Radio: `{current.clean_title}`")
        elif self.queue.autoplay:
            extra.append("Autoplay: `ON`")

        info_lines.append("• " + " • ".join(extra))
        mid_display = discord.ui.TextDisplay("\n".join(info_lines))

        sep2 = discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small)

        req_id = current.requested_by.id if (current.requested_by and hasattr(current.requested_by, "id")) else 1520522990280769727
        footer = discord.ui.TextDisplay(f"{Emojis.MEMBER} Track requested by <@{req_id}>")

        cnt = discord.ui.Container(sec, sep1, mid_display, sep2, footer, accent_color=BRAND_COLOR)
        self.add_item(cnt)


class QueueLayoutView(discord.ui.View):
    """Interactive queue view with a Shuffle button."""
    def __init__(self, music_cog: 'Music', queue: GuildMusicQueue, user_id: int):
        super().__init__(timeout=60.0)
        self.music_cog = music_cog
        self.queue = queue
        self.user_id = user_id

        self.btn_shuffle = discord.ui.Button(
            label="Shuffle",
            emoji=EmojiPartials.SHUFFLE,
            style=discord.ButtonStyle.secondary,
            custom_id="queue_shuffle_btn"
        )
        self.btn_shuffle.callback = self.on_shuffle
        self.add_item(self.btn_shuffle)

    async def on_shuffle(self, interaction: discord.Interaction):
        if interaction.user.id != self.user_id:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Only the requester can shuffle this queue view.",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        if len(self.queue.tracks) < 2:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Need at least 2 upcoming tracks in queue to shuffle.",
                color=0xFEE75C
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        random.shuffle(self.queue.tracks)
        new_embed = self.music_cog.build_queue_embed(self.queue)
        await interaction.response.edit_message(embed=new_embed, view=self)
        await interaction.followup.send(f"{Emojis.SHUFFLE} Upcoming tracks shuffled!", ephemeral=True)


class CountrySearchModal(discord.ui.Modal, title="Search Radio Countries"):
    query_input = discord.ui.TextInput(
        label="Country Name or ISO Code",
        placeholder="e.g. India, Japan, US, Germany, Brazil...",
        required=True,
        min_length=1,
        max_length=60
    )

    def __init__(self, parent_view: 'CountryRadioSelectView'):
        super().__init__()
        self.parent_view = parent_view

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer()
        search_query = self.query_input.value.strip()
        matched = RadioService.get_instance().search_countries(search_query, limit=50)
        if not matched:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} No countries found matching **{search_query}**.\n{Emojis.S_ARROW} *Please try another country name or ISO 2-letter code.*",
                color=0xFEE75C
            )
            await interaction.followup.send(embed=embed, ephemeral=True)
            return

        self.parent_view.countries = matched
        self.parent_view.current_page = 0
        self.parent_view.is_filtered = True
        self.parent_view.filter_label = search_query
        self.parent_view.build_components()

        embed = discord.Embed(
            description=f"### {Emojis.RADIO} Worldwide Country Radio\nFound **{len(matched)}** countries matching **{search_query}**.\nSelect a country below (Pg 1/{self.parent_view.total_pages}) or click 🔍 to search again:",
            color=BRAND_COLOR
        )
        try:
            await interaction.edit_original_response(embed=embed, view=self.parent_view)
            orig = await interaction.original_response()
            if orig:
                q = self.parent_view.music_cog.service.get_queue(interaction.guild_id)
                q.radio_menu_url = orig.jump_url
                q.radio_menu_message = orig
        except Exception:
            try:
                msg = await interaction.followup.send(embed=embed, view=self.parent_view)
                if msg:
                    q = self.parent_view.music_cog.service.get_queue(interaction.guild_id)
                    q.radio_menu_url = msg.jump_url
                    q.radio_menu_message = msg
            except Exception:
                pass


class CountryRadioSelectView(discord.ui.View):
    """
    Paginated dropdown selector for ALL countries worldwide.
    Supports Next / Prev navigation, search modal, and reset button.
    """
    def __init__(
        self,
        music_cog: 'Music',
        user: Union[discord.Member, discord.User],
        countries: Optional[list] = None,
        page: int = 0,
        is_filtered: bool = False,
        filter_label: Optional[str] = None
    ):
        super().__init__(timeout=180.0)
        self.music_cog = music_cog
        self.user = user
        self.current_page = page
        self.is_filtered = is_filtered
        self.filter_label = filter_label

        if countries is not None:
            self.countries = countries
        else:
            self.countries = RadioService.get_instance().get_countries()

        self.build_components()

    @property
    def total_pages(self) -> int:
        return max(1, math.ceil(len(self.countries) / 25))

    def build_components(self):
        self.clear_items()
        total_p = self.total_pages
        if self.current_page >= total_p:
            self.current_page = total_p - 1
        if self.current_page < 0:
            self.current_page = 0

        start_idx = self.current_page * 25
        end_idx = start_idx + 25
        page_countries = self.countries[start_idx:end_idx]

        options = []
        for c in page_countries:
            name = c.get("name", "Unknown")
            code = c.get("iso_3166_1", "")
            flag = get_country_flag(code or name)
            count = c.get("stationcount", 0)
            desc = f"{count} live radio stations" if count else f"Live radio from {name}"
            options.append(
                discord.SelectOption(
                    label=f"{flag} {name}"[:100],
                    value=name[:100],
                    description=desc[:100],
                    emoji=EmojiPartials.RADIO
                )
            )

        if not options:
            options.append(
                discord.SelectOption(
                    label="No countries available",
                    value="none",
                    emoji=EmojiPartials.RADIO
                )
            )

        filter_text = f" [{self.filter_label}]" if self.is_filtered and self.filter_label else ""
        placeholder_text = f"🌍 Select a country{filter_text} (Pg {self.current_page + 1}/{total_p})..."[:100]

        select = discord.ui.Select(
            placeholder=placeholder_text,
            options=options,
            custom_id="country_radio_select",
            row=0
        )
        select.callback = self.select_callback
        self.add_item(select)

        # Row 1 controls: Prev, Next, Search, Reset
        btn_prev = discord.ui.Button(
            label="◀ Prev",
            style=discord.ButtonStyle.secondary,
            disabled=(self.current_page == 0),
            custom_id="country_page_prev",
            row=1
        )
        btn_prev.callback = self.prev_callback
        self.add_item(btn_prev)

        btn_next = discord.ui.Button(
            label="Next ▶",
            style=discord.ButtonStyle.secondary,
            disabled=(self.current_page >= total_p - 1),
            custom_id="country_page_next",
            row=1
        )
        btn_next.callback = self.next_callback
        self.add_item(btn_next)

        btn_search = discord.ui.Button(
            label="🔍 Search",
            style=discord.ButtonStyle.primary,
            custom_id="country_search_modal_btn",
            row=1
        )
        btn_search.callback = self.search_callback
        self.add_item(btn_search)

        if self.is_filtered:
            btn_reset = discord.ui.Button(
                label="↺ All Countries",
                style=discord.ButtonStyle.danger,
                custom_id="country_reset_filter_btn",
                row=1
            )
            btn_reset.callback = self.reset_callback
            self.add_item(btn_reset)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.user.id:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Only the requester can choose or search countries.",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False
        return True

    async def select_callback(self, interaction: discord.Interaction):
        val = interaction.data["values"][0]
        if val == "none":
            return

        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message

        await interaction.response.defer()
        await self.music_cog.start_country_radio_flow(interaction, val, is_select_callback=True)

    async def prev_callback(self, interaction: discord.Interaction):
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        if self.current_page > 0:
            self.current_page -= 1
            self.build_components()
            filter_info = f" for **{self.filter_label}**" if self.is_filtered and self.filter_label else ""
            embed = discord.Embed(
                description=f"### {Emojis.RADIO} Worldwide Country Radio\nSelect a country below (Pg {self.current_page + 1}/{self.total_pages}){filter_info} or click 🔍 to search:",
                color=BRAND_COLOR
            )
            await interaction.response.edit_message(embed=embed, view=self)
        else:
            await interaction.response.defer()

    async def next_callback(self, interaction: discord.Interaction):
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.build_components()
            filter_info = f" for **{self.filter_label}**" if self.is_filtered and self.filter_label else ""
            embed = discord.Embed(
                description=f"### {Emojis.RADIO} Worldwide Country Radio\nSelect a country below (Pg {self.current_page + 1}/{self.total_pages}){filter_info} or click 🔍 to search:",
                color=BRAND_COLOR
            )
            await interaction.response.edit_message(embed=embed, view=self)
        else:
            await interaction.response.defer()

    async def search_callback(self, interaction: discord.Interaction):
        await interaction.response.send_modal(CountrySearchModal(self))

    async def reset_callback(self, interaction: discord.Interaction):
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        await interaction.response.defer()
        self.countries = RadioService.get_instance().get_countries()
        self.current_page = 0
        self.is_filtered = False
        self.filter_label = None
        self.build_components()
        embed = discord.Embed(
            description=f"### {Emojis.RADIO} Worldwide Country Radio\nSelect a country below (Pg 1/{self.total_pages}) or click 🔍 to search:",
            color=BRAND_COLOR
        )
        try:
            await interaction.edit_original_response(embed=embed, view=self)
        except Exception:
            pass


class RadioStationSearchModal(discord.ui.Modal, title="Search Radio Stations"):
    query_input = discord.ui.TextInput(
        label="Station Name or Keyword",
        placeholder="e.g. Jazz, Rock, BBC, NPR, Mirchi, Hits...",
        required=True,
        min_length=1,
        max_length=60
    )

    def __init__(self, parent_view: 'RadioStationSelectView'):
        super().__init__()
        self.parent_view = parent_view

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer()
        search_query = self.query_input.value.strip()
        matched = RadioService.get_instance().search_stations(self.parent_view.country_name, search_query, limit=100)
        if not matched:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} No radio stations found matching **{search_query}** in {self.parent_view.flag} {self.parent_view.country_name}.",
                color=0xFEE75C
            )
            await interaction.followup.send(embed=embed, ephemeral=True)
            return

        self.parent_view.stations = matched
        self.parent_view.current_page = 0
        self.parent_view.is_filtered = True
        self.parent_view.filter_label = search_query
        self.parent_view.build_components()

        info_embed = discord.Embed(
            description=f"{Emojis.RADIO} Found **{len(matched)}** station(s) for **{search_query}** in {self.parent_view.flag} **{self.parent_view.country_name}**.\n{Emojis.S_ARROW} *Select a station from the dropdown below:*",
            color=BRAND_COLOR
        )
        try:
            await interaction.edit_original_response(embed=info_embed, view=self.parent_view)
            orig = await interaction.original_response()
            if orig:
                q = self.parent_view.music_cog.service.get_queue(interaction.guild_id)
                q.radio_menu_url = orig.jump_url
                q.radio_menu_message = orig
        except Exception:
            try:
                msg = await interaction.followup.send(embed=info_embed, view=self.parent_view, ephemeral=True)
                if msg:
                    q = self.parent_view.music_cog.service.get_queue(interaction.guild_id)
                    q.radio_menu_url = msg.jump_url
                    q.radio_menu_message = msg
            except Exception:
                pass


class RadioStationSelectView(discord.ui.View):
    """
    Paginated dropdown selector to pick from ALL live stations in a country.
    Supports Next / Prev navigation, search modal, and reset button.
    """
    def __init__(
        self,
        music_cog: 'Music',
        user: Union[discord.Member, discord.User],
        country_name: str,
        stations: list[dict],
        page: int = 0,
        is_filtered: bool = False,
        filter_label: Optional[str] = None
    ):
        super().__init__(timeout=180.0)
        self.music_cog = music_cog
        self.user = user
        self.country_name = country_name
        self.stations = stations
        self.current_page = page
        self.is_filtered = is_filtered
        self.filter_label = filter_label
        self.flag = get_country_flag(country_name)
        self.build_components()

    @property
    def total_pages(self) -> int:
        return max(1, math.ceil(len(self.stations) / 25))

    def build_components(self):
        self.clear_items()
        total_p = self.total_pages
        if self.current_page >= total_p:
            self.current_page = total_p - 1
        if self.current_page < 0:
            self.current_page = 0

        start_idx = self.current_page * 25
        end_idx = start_idx + 25
        page_stations = self.stations[start_idx:end_idx]

        options = []
        for i, s in enumerate(page_stations):
            label = s.get("name", "Unknown Station")[:100]
            desc = f"{s.get('codec', 'MP3')} • {s.get('bitrate', 128)}k"[:100]
            options.append(
                discord.SelectOption(
                    label=label,
                    value=str(start_idx + i),
                    description=desc,
                    emoji=EmojiPartials.RADIO
                )
            )

        if not options:
            options.append(
                discord.SelectOption(
                    label="No stations available",
                    value="none",
                    emoji=EmojiPartials.RADIO
                )
            )

        filter_text = f" [{self.filter_label}]" if self.is_filtered and self.filter_label else ""
        placeholder_text = f"{self.flag} {self.country_name}{filter_text} (Pg {self.current_page + 1}/{total_p})..."[:100]

        select = discord.ui.Select(
            placeholder=placeholder_text,
            options=options,
            custom_id="radio_station_switch",
            row=0
        )
        select.callback = self.select_callback
        self.add_item(select)

        # Row 1 controls: Prev, Next, Search, Reset
        btn_prev = discord.ui.Button(
            label="◀ Prev",
            style=discord.ButtonStyle.secondary,
            disabled=(self.current_page == 0),
            custom_id="radio_page_prev",
            row=1
        )
        btn_prev.callback = self.prev_callback
        self.add_item(btn_prev)

        btn_next = discord.ui.Button(
            label="Next ▶",
            style=discord.ButtonStyle.secondary,
            disabled=(self.current_page >= total_p - 1),
            custom_id="radio_page_next",
            row=1
        )
        btn_next.callback = self.next_callback
        self.add_item(btn_next)

        btn_search = discord.ui.Button(
            label="🔍 Search",
            style=discord.ButtonStyle.primary,
            custom_id="radio_search_modal_btn",
            row=1
        )
        btn_search.callback = self.search_callback
        self.add_item(btn_search)

        if self.is_filtered:
            btn_reset = discord.ui.Button(
                label="↺ All Stations",
                style=discord.ButtonStyle.danger,
                custom_id="radio_reset_filter_btn",
                row=1
            )
            btn_reset.callback = self.reset_callback
            self.add_item(btn_reset)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.user.id:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Only the requester can navigate or switch radio stations.",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False
        return True

    async def select_callback(self, interaction: discord.Interaction):
        val = interaction.data["values"][0]
        if val == "none":
            return
        idx = int(val)
        if idx >= len(self.stations):
            return
        chosen = self.stations[idx]
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        await interaction.response.defer()
        await self.music_cog.tune_into_station(
            interaction, chosen, self.country_name, stations=self.stations, is_switch_callback=True
        )

    async def prev_callback(self, interaction: discord.Interaction):
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        if self.current_page > 0:
            self.current_page -= 1
            self.build_components()
            await interaction.response.edit_message(view=self)
        else:
            await interaction.response.defer()

    async def next_callback(self, interaction: discord.Interaction):
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.build_components()
            await interaction.response.edit_message(view=self)
        else:
            await interaction.response.defer()

    async def search_callback(self, interaction: discord.Interaction):
        await interaction.response.send_modal(RadioStationSearchModal(self))

    async def reset_callback(self, interaction: discord.Interaction):
        if interaction.message:
            q = self.music_cog.service.get_queue(interaction.guild_id)
            q.radio_menu_url = interaction.message.jump_url
            q.radio_menu_message = interaction.message
        await interaction.response.defer()
        all_stations = RadioService.get_instance().get_country_stations(self.country_name, limit=150)
        self.stations = all_stations or self.stations
        self.current_page = 0
        self.is_filtered = False
        self.filter_label = None
        self.build_components()
        flag = get_country_flag(self.country_name)
        embed = discord.Embed(
            description=f"{Emojis.RADIO} **{flag} {self.country_name} Radio Stations** ({len(self.stations)} available)\n{Emojis.S_ARROW} *Select a station below or use 🔍 Search to find any station:*",
            color=BRAND_COLOR
        )
        try:
            await interaction.edit_original_response(embed=embed, view=self)
            orig = await interaction.original_response()
            if orig:
                q = self.music_cog.service.get_queue(interaction.guild_id)
                q.radio_menu_url = orig.jump_url
                q.radio_menu_message = orig
        except Exception:
            pass


RadioSelectView = CountryRadioSelectView


class SearchPickerLayoutView(discord.ui.LayoutView):
    """
    Discord Components V2 Search Results Picker matching Chip bot layout:
    - Container with brand accent color
    - Top header: '### There are X results'
    - Up to 10 Sections, each containing track title and duration/author, with right accessory button (✔)
    - Bottom ActionRow with Cancel button (❌ Cancel)
    """
    def __init__(self, music_cog: 'Music', user: Union[discord.Member, discord.User], tracks: list[Track]):
        super().__init__(timeout=60.0)
        self.music_cog = music_cog
        self.user = user
        self.tracks = tracks
        self.build_components()

    def build_components(self):
        self.clear_items()
        items = []
        count = len(self.tracks)
        items.append(discord.ui.TextDisplay(f"### There are {count} results"))

        for i, t in enumerate(self.tracks[:10]):
            btn = discord.ui.Button(
                emoji="✔",
                style=discord.ButtonStyle.primary,
                custom_id=f"spick_{i}"
            )
            btn.callback = self.make_callback(i)
            sec = discord.ui.Section(
                discord.ui.TextDisplay(f"**{t.clean_title}**\nDuration: {t.formatted_duration} • Author: {t.author}"),
                accessory=btn
            )
            items.append(sec)

        cancel_btn = discord.ui.Button(
            label="Cancel",
            emoji="❌",
            style=discord.ButtonStyle.danger,
            custom_id="scancel"
        )
        cancel_btn.callback = self.cancel_callback
        row = discord.ui.ActionRow(cancel_btn)
        items.append(row)

        cnt = discord.ui.Container(*items, accent_color=BRAND_COLOR)
        self.add_item(cnt)

    def make_callback(self, index: int):
        async def _callback(interaction: discord.Interaction):
            if interaction.user.id != self.user.id:
                embed = discord.Embed(
                    description=f"### {Emojis.WARNING} Only the search requester can select tracks.",
                    color=0xED4245
                )
                await interaction.response.send_message(embed=embed, ephemeral=True)
                return
            selected = self.tracks[index]
            self.stop()
            try:
                await interaction.message.delete()
            except Exception:
                pass
            await interaction.response.defer()
            await self.music_cog.enqueue_and_play(interaction, [selected])
        return _callback

    async def cancel_callback(self, interaction: discord.Interaction):
        if interaction.user.id != self.user.id:
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Only the search requester can cancel this search.",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        self.stop()
        try:
            await interaction.message.delete()
        except Exception:
            pass


SearchPickerView = SearchPickerLayoutView


class AutoPlayBlockArtistModal(discord.ui.Modal, title="Block or Unblock Artist"):
    artist_input = discord.ui.TextInput(
        label="Artist Name",
        placeholder="e.g. Drake, Taylor Swift, Badshah...",
        required=True,
        min_length=2,
        max_length=60
    )

    def __init__(self, music_cog: 'Music', user_id: int):
        super().__init__()
        self.music_cog = music_cog
        self.user_id = user_id

    async def on_submit(self, interaction: discord.Interaction):
        artist_name = self.artist_input.value.strip()
        prof = AutoPlayService.get_instance().get_user_profile(self.user_id)
        a_low = artist_name.lower()
        if a_low in prof.blocked_artists:
            prof.blocked_artists.remove(a_low)
            AutoPlayService.get_instance().save_profiles()
            msg = f"{Emojis.CHECK_YES} Unblocked **{artist_name}**. AutoPlay may recommend them again."
        else:
            prof.blocked_artists.append(a_low)
            prof.artist_affinity[artist_name] = -10.0
            AutoPlayService.get_instance().save_profiles()
            msg = f"{Emojis.REFUSED} Blocked **{artist_name}**. AutoPlay will never recommend songs by this artist."
        await interaction.response.send_message(msg, ephemeral=True)


class AutoPlayFeedbackView(discord.ui.View):
    """
    Real-time interactive feedback row attached to AutoPlay recommendations:
    [👍 Like] [👎 Dislike] [🎶 More Like This] [✨ Discover] [⚙️ Tune DJ]
    """
    def __init__(self, music_cog: 'Music', queue: GuildMusicQueue, track: Track):
        super().__init__(timeout=300.0)
        self.music_cog = music_cog
        self.queue = queue
        self.track = track

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if not self.music_cog._is_booster_or_admin(interaction.user, interaction.guild):
            await interaction.response.send_message(
                f"{Emojis.WARNING} Music commands and controls are exclusive to Boosters and Admins!",
                ephemeral=True
            )
            return False
        return True

    @discord.ui.button(label="Like", emoji="👍", style=discord.ButtonStyle.secondary, custom_id="ap_btn_like")
    async def on_like(self, interaction: discord.Interaction, button: discord.ui.Button):
        ok, msg = AutoPlayService.get_instance().record_explicit_feedback(
            interaction.user.id, self.track, "like"
        )
        button.style = discord.ButtonStyle.success
        button.disabled = True
        try:
            await interaction.response.edit_message(view=self)
            await interaction.followup.send(f"{Emojis.APPROVED} {msg}", ephemeral=True)
        except Exception:
            await interaction.response.send_message(f"{Emojis.APPROVED} {msg}", ephemeral=True)

    @discord.ui.button(label="Dislike", emoji="👎", style=discord.ButtonStyle.secondary, custom_id="ap_btn_dislike")
    async def on_dislike(self, interaction: discord.Interaction, button: discord.ui.Button):
        ok, msg = AutoPlayService.get_instance().record_explicit_feedback(
            interaction.user.id, self.track, "dislike"
        )
        button.style = discord.ButtonStyle.danger
        button.disabled = True
        # Invalidate current prefetch so next song avoids this style and delivers better recommendations
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        try:
            await interaction.response.edit_message(view=self)
            await interaction.followup.send(f"{Emojis.REFUSED} {msg} Current playback will continue smoothly, and next selections will be refined.", ephemeral=True)
        except Exception:
            await interaction.response.send_message(f"{Emojis.REFUSED} {msg} Current playback will continue smoothly, and next selections will be refined.", ephemeral=True)

    @discord.ui.button(label="More Like This", emoji="🎶", style=discord.ButtonStyle.secondary, custom_id="ap_btn_more")
    async def on_more(self, interaction: discord.Interaction, button: discord.ui.Button):
        ok, msg = AutoPlayService.get_instance().record_explicit_feedback(
            interaction.user.id, self.track, "more_like_this"
        )
        button.style = discord.ButtonStyle.primary
        button.disabled = True
        # Invalidate current prefetch so next song honors the new focus immediately
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        try:
            await interaction.response.edit_message(view=self)
            await interaction.followup.send(f"{Emojis.AI} {msg}", ephemeral=True)
        except Exception:
            await interaction.response.send_message(f"{Emojis.AI} {msg}", ephemeral=True)

    @discord.ui.button(label="Discover", emoji="✨", style=discord.ButtonStyle.secondary, custom_id="ap_btn_discover")
    async def on_discover(self, interaction: discord.Interaction, button: discord.ui.Button):
        prof = AutoPlayService.get_instance().get_user_profile(interaction.user.id)
        if prof.discovery_mode == "balanced":
            prof.discovery_mode = "explore"
            mode_desc = "Fresh Discoveries & New Artists ✨"
        elif prof.discovery_mode == "explore":
            prof.discovery_mode = "familiar"
            mode_desc = "Familiar Favorites & Beloved Artists 🎵"
        else:
            prof.discovery_mode = "balanced"
            mode_desc = "Balanced (Favorites + Discoveries) ⚖️"
        AutoPlayService.get_instance().save_profiles()
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        await interaction.response.send_message(
            f"{Emojis.AI} AutoPlay Discovery mode switched to **{mode_desc}**.",
            ephemeral=True
        )

    @discord.ui.button(label="Tune DJ", emoji="⚙️", style=discord.ButtonStyle.secondary, custom_id="ap_btn_tune")
    async def on_tune(self, interaction: discord.Interaction, button: discord.ui.Button):
        view = AutoPlayControlCenterView(self.music_cog, interaction.user, self.queue)
        embed = view.build_embed()
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)


class AutoPlayControlCenterView(discord.ui.View):
    """
    Interactive Control Center for AI AutoPlay:
    Allows user to tune genre, mood, language, discovery style, block artists, and toggle.
    """
    def __init__(self, music_cog: 'Music', user: Union[discord.Member, discord.User], queue: GuildMusicQueue):
        super().__init__(timeout=180.0)
        self.music_cog = music_cog
        self.user = user
        self.queue = queue
        self.build_components()

    def build_embed(self) -> discord.Embed:
        prof = AutoPlayService.get_instance().get_user_profile(self.user.id)
        status_str = f"**ENABLED** {Emojis.CHECK_YES}" if self.queue.autoplay else f"**DISABLED** {Emojis.REFUSED}"

        ctx = AutoPlayService.get_instance().build_recommendation_context(self.queue, fallback_user=self.user)
        mode_str = ctx.get("mode", "Personal")

        fav_artists = [f"`{a}`" for a, _ in sorted(prof.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:3]]
        fav_str = ", ".join(fav_artists) if fav_artists else "*None yet (plays will auto-learn)*"

        disc_map = {
            "balanced": "Balanced ⚖️ (Favorites + Fresh Finds)",
            "familiar": "Familiar 🎵 (Beloved Favorites)",
            "explore": "Explore ✨ (Fresh Discoveries & Hidden Gems)"
        }
        disc_str = disc_map.get(prof.discovery_mode, "Balanced")

        mood_genre_str = f"Genre: `{prof.manual_genre or 'Auto-Detect'}` • Mood: `{prof.manual_mood or 'Dynamic'}`"
        lang_str = f"`{prof.manual_language or 'All Languages / Dynamic'}`"

        desc = (
            f"### {Emojis.AI} SyncInk AI DJ • Auto Play Control Center\n"
            f"Your personal AI music companion continuously learns your musical preferences and keeps high-fidelity audio playing seamlessly when the queue ends.\n\n"
            f"{Emojis.S_ARROW} **Status:** {status_str}\n"
            f"{Emojis.S_ARROW} **Listening Mode:** `{mode_str}`\n"
            f"{Emojis.S_ARROW} **Discovery Style:** {disc_str}\n"
            f"{Emojis.S_ARROW} **Style Focus:** {mood_genre_str}\n"
            f"{Emojis.S_ARROW} **Language Focus:** {lang_str}\n"
            f"{Emojis.S_ARROW} **Top Learned Artists:** {fav_str}\n\n"
            f"*Tune your personalized listening experience using the interactive controls below:*"
        )

        embed = discord.Embed(description=desc, color=BRAND_COLOR)
        embed.set_footer(text="SyncInk AI Music Engine", icon_url=BRAND_LOGO_URL)
        return embed

    def build_components(self):
        self.clear_items()
        prof = AutoPlayService.get_instance().get_user_profile(self.user.id)

        # 1. Select Menu: Mood & Genre (Row 0)
        mood_options = [
            discord.SelectOption(label="Romantic & Soulful", value="Romantic|Bollywood Romantic", description="Acoustic melodies, heartfelt love songs", emoji="💖"),
            discord.SelectOption(label="Lo-Fi & Chill", value="Relaxing|Lo-Fi Beats & Chillhop", description="Relaxing beats, study & chillhop vibes", emoji="☕"),
            discord.SelectOption(label="Energetic & High BPM", value="Energetic|Pop & R&B Hits", description="Uplifting pop hits, dance grooves", emoji="⚡"),
            discord.SelectOption(label="Punjabi Pop & Urban", value="Energetic|Punjabi Pop & Urban", description="Punjabi folk, urban pop & bass", emoji="🔥"),
            discord.SelectOption(label="Hip-Hop & Rap", value="Energetic|Hip-Hop & Rap", description="Modern hip-hop, trap & rap rhythms", emoji="🎤"),
            discord.SelectOption(label="Indie & Acoustic", value="Chill|Hindi Indie & Acoustic", description="Coffeehouse acoustic & indie vibes", emoji="🎸"),
            discord.SelectOption(label="EDM & Dance", value="Energetic|EDM & Dance", description="Festival electronic, melodic EDM", emoji="🎧"),
            discord.SelectOption(label="K-Pop & J-Pop", value="Energetic|K-Pop", description="Korean pop & Japanese anime hits", emoji="🌸"),
            discord.SelectOption(label="↺ Reset Genre & Mood", value="reset", description="Clear focus; let AI dynamically adapt", emoji="🔄"),
        ]
        mood_select = discord.ui.Select(
            placeholder="🎭 Select Preferred Mood & Genre...",
            options=mood_options,
            custom_id="ap_select_mood",
            row=0
        )
        mood_select.callback = self.on_mood_select
        self.add_item(mood_select)

        # 2. Select Menu: Language (Row 1)
        lang_options = [
            discord.SelectOption(label="Hindi + English (Bilingual)", value="Hindi + English", description="Seamless blend of Bollywood, Hindi Indie & English Pop", emoji="🇮🇳"),
            discord.SelectOption(label="Hindi / Bollywood", value="Hindi", description="Bollywood hits, Hindi indie & romantic tracks", emoji="🇮🇳"),
            discord.SelectOption(label="English / International", value="English", description="Global pop, billboard hits & English rock", emoji="🌐"),
            discord.SelectOption(label="Punjabi", value="Punjabi", description="Punjabi pop, urban beats & bhangra", emoji="🪕"),
            discord.SelectOption(label="Korean / K-Pop", value="Korean", description="K-Pop idols, OSTs & Korean R&B", emoji="🇰🇷"),
            discord.SelectOption(label="Japanese / Anime", value="Japanese", description="J-Pop, J-Rock & anime OSTs", emoji="🇯🇵"),
            discord.SelectOption(label="Spanish / Latin", value="Spanish", description="Reggaeton, latin pop & urban latino", emoji="🇪🇸"),
            discord.SelectOption(label="↺ Any Language (Auto)", value="reset", description="Dynamic language adaptation based on session", emoji="🔄"),
        ]
        lang_select = discord.ui.Select(
            placeholder="🌐 Select Preferred Language...",
            options=lang_options,
            custom_id="ap_select_lang",
            row=1
        )
        lang_select.callback = self.on_lang_select
        self.add_item(lang_select)

        # 3. Select Menu: Discovery Mode (Row 2)
        disc_options = [
            discord.SelectOption(label="Balanced (Recommended)", value="balanced", description="Harmonious blend of favorites & new discoveries", emoji="⚖️", default=(prof.discovery_mode == "balanced")),
            discord.SelectOption(label="Familiar Favorites", value="familiar", description="Stick primarily to songs & artists you love", emoji="🎵", default=(prof.discovery_mode == "familiar")),
            discord.SelectOption(label="Fresh Discoveries", value="explore", description="Surfaces exciting new tracks & emerging artists", emoji="✨", default=(prof.discovery_mode == "explore")),
        ]
        disc_select = discord.ui.Select(
            placeholder="✨ Choose Discovery Style...",
            options=disc_options,
            custom_id="ap_select_disc",
            row=2
        )
        disc_select.callback = self.on_disc_select
        self.add_item(disc_select)

        # 4. Action Row (Row 3): Toggle ON/OFF, Block Artist, View Taste Profile
        toggle_label = "Turn OFF AutoPlay" if self.queue.autoplay else "Turn ON AutoPlay"
        toggle_style = discord.ButtonStyle.danger if self.queue.autoplay else discord.ButtonStyle.success
        btn_toggle = discord.ui.Button(
            label=toggle_label,
            style=toggle_style,
            custom_id="ap_btn_toggle",
            row=3
        )
        btn_toggle.callback = self.on_toggle
        self.add_item(btn_toggle)

        btn_block = discord.ui.Button(
            label="Block Artist",
            emoji="🚫",
            style=discord.ButtonStyle.secondary,
            custom_id="ap_btn_block",
            row=3
        )
        btn_block.callback = self.on_block_artist
        self.add_item(btn_block)

        btn_profile = discord.ui.Button(
            label="My Taste Profile",
            emoji="📊",
            style=discord.ButtonStyle.secondary,
            custom_id="ap_btn_profile",
            row=3
        )
        btn_profile.callback = self.on_view_profile
        self.add_item(btn_profile)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.user.id:
            await interaction.response.send_message(
                f"{Emojis.WARNING} Only the requester can configure this AutoPlay control panel.",
                ephemeral=True
            )
            return False
        return True

    async def on_mood_select(self, interaction: discord.Interaction):
        val = interaction.data["values"][0]
        prof = AutoPlayService.get_instance().get_user_profile(self.user.id)
        if val == "reset":
            prof.manual_mood = None
            prof.manual_genre = None
            msg = "Reset Mood & Genre. AI DJ will dynamically adapt."
        else:
            mood, genre = val.split("|", 1)
            prof.manual_mood = mood
            prof.manual_genre = genre
            msg = f"Set Mood to **{mood}** and Genre to **{genre}**."
        AutoPlayService.get_instance().save_profiles()
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        self.build_components()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)
        await interaction.followup.send(f"{Emojis.APPROVED} {msg}", ephemeral=True)

    async def on_lang_select(self, interaction: discord.Interaction):
        val = interaction.data["values"][0]
        prof = AutoPlayService.get_instance().get_user_profile(self.user.id)
        if val == "reset":
            prof.manual_language = None
            msg = "Language set to Auto-Detect across all languages."
        elif val == "Hindi + English":
            prof.manual_language = val
            msg = "Set preferred language focus to **Hindi + English (Bilingual)**."
        else:
            prof.manual_language = val
            msg = f"Set preferred language focus to **{val}**."
        AutoPlayService.get_instance().save_profiles()
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        self.build_components()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)
        await interaction.followup.send(f"{Emojis.APPROVED} {msg}", ephemeral=True)

    async def on_disc_select(self, interaction: discord.Interaction):
        val = interaction.data["values"][0]
        prof = AutoPlayService.get_instance().get_user_profile(self.user.id)
        prof.discovery_mode = val
        AutoPlayService.get_instance().save_profiles()
        self.queue.prefetched_autoplay_track = None
        self.queue.prefetched_autoplay_meta = None
        AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        self.build_components()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)
        await interaction.followup.send(f"{Emojis.APPROVED} Discovery mode updated to **{val.title()}**.", ephemeral=True)

    async def on_toggle(self, interaction: discord.Interaction):
        self.queue.autoplay = not self.queue.autoplay
        status = "ENABLED" if self.queue.autoplay else "DISABLED"
        if self.queue.autoplay:
            AutoPlayService.get_instance().trigger_prefetch(self.queue, self.music_cog.service)
        else:
            self.queue.prefetched_autoplay_track = None
            self.queue.prefetched_autoplay_meta = None
        self.build_components()
        await interaction.response.edit_message(embed=self.build_embed(), view=self)
        await interaction.followup.send(f"{Emojis.AI} AutoPlay is now **{status}**.", ephemeral=True)

    async def on_block_artist(self, interaction: discord.Interaction):
        await interaction.response.send_modal(AutoPlayBlockArtistModal(self.music_cog, self.user.id))

    async def on_view_profile(self, interaction: discord.Interaction):
        prof = AutoPlayService.get_instance().get_user_profile(self.user.id)
        top_art = [f"• **{a}** (score: {s:.1f})" for a, s in sorted(prof.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:5]]
        top_gen = [f"• **{g}** (score: {s:.1f})" for g, s in sorted(prof.genre_affinity.items(), key=lambda x: x[1], reverse=True)[:5]]
        blocked = [f"`{b}`" for b in prof.blocked_artists[:10]]

        art_text = "\n".join(top_art) if top_art else "*No artist history yet.*"
        gen_text = "\n".join(top_gen) if top_gen else "*No genre history yet.*"
        block_text = ", ".join(blocked) if blocked else "*None.*"

        p_embed = discord.Embed(
            description=(
                f"### 📊 Your Personal Music Taste Profile\n"
                f"**Total Songs Listened:** `{prof.total_listened}`\n"
                f"**Liked Tracks:** `{len(prof.liked_tracks)}`  •  **Disliked Tracks:** `{len(prof.disliked_tracks)}`\n\n"
                f"**Top Learned Artists:**\n{art_text}\n\n"
                f"**Top Learned Genres:**\n{gen_text}\n\n"
                f"**Blocked Artists:**\n{block_text}\n\n"
                f"_-# Your profile is 100% private and continuously improves with every listen._"
            ),
            color=BRAND_COLOR
        )
        await interaction.response.send_message(embed=p_embed, ephemeral=True)

class Music(commands.Cog):
    """High-fidelity Discord Radio & Music Playback System."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.service = MusicService.get_instance()

    def _music_allowed_guild_id(self) -> int:
        """Keep music commands in the configured home guild; other guilds can host shared emojis."""
        raw_guild_id = os.getenv("MUSIC_ALLOWED_GUILD_ID") or os.getenv("TARGET_GUILD_ID", "1520457643842342912")
        try:
            return int(raw_guild_id)
        except (TypeError, ValueError):
            return 1520457643842342912

    def _is_booster_or_admin(self, user: Union[discord.Member, discord.User], guild: Optional[discord.Guild]) -> bool:
        if not guild or not hasattr(user, "roles"):
            return False
        has_booster = any(r.id == MUSIC_BOOSTER_ROLE_ID for r in user.roles)
        is_admin_or_owner = user.id == guild.owner_id or getattr(user.guild_permissions, "administrator", False)
        return has_booster or is_admin_or_owner

    def _is_allowed_channel(self, channel_id: int) -> bool:
        return channel_id == MUSIC_COMMAND_CHANNEL_ID

    async def cog_check(self, ctx: commands.Context) -> bool:
        # 1. Guild check (silent reject if in non-support emoji guild)
        if not ctx.guild or ctx.guild.id != self._music_allowed_guild_id():
            return False

        # 2. Channel check (Must be channel 1520749466330857492)
        if not self._is_allowed_channel(ctx.channel.id):
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Music commands can only be used in <#{MUSIC_COMMAND_CHANNEL_ID}>!",
                color=0xED4245
            )
            await ctx.send(embed=embed, delete_after=10)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 10))
            return False

        # 3. Booster role restriction (Must have role 1558584451724738640)
        if not self._is_booster_or_admin(ctx.author, ctx.guild):
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Music & Radio commands are exclusive for <@&{MUSIC_BOOSTER_ROLE_ID}>!",
                color=0xED4245
            )
            await ctx.send(embed=embed, delete_after=10)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 10))
            return False

        return True

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # 1. Guild check (silent reject if in non-support emoji guild)
        if not interaction.guild_id or interaction.guild_id != self._music_allowed_guild_id():
            return False

        # 2. Channel check (Must be channel 1520749466330857492)
        if not self._is_allowed_channel(interaction.channel_id):
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Music commands can only be used in <#{MUSIC_COMMAND_CHANNEL_ID}>!",
                color=0xED4245
            )
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=embed, ephemeral=True)
            else:
                await interaction.followup.send(embed=embed, ephemeral=True)
            return False

        # 3. Booster role restriction (Must have role 1558584451724738640)
        if not self._is_booster_or_admin(interaction.user, interaction.guild):
            embed = discord.Embed(
                description=f"### {Emojis.WARNING} Music & Radio commands are exclusive for <@&{MUSIC_BOOSTER_ROLE_ID}>!",
                color=0xED4245
            )
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=embed, ephemeral=True)
            else:
                await interaction.followup.send(embed=embed, ephemeral=True)
            return False

        return True

    async def _ensure_voice_dependencies(self):
        """Require the real DAVE implementation; a no-op compatibility shim cannot join voice."""
        try:
            import discord.voice_client
            import davey
            if discord.version_info < (2, 7, 0):
                raise RuntimeError("discord.py 2.7 or newer is required for Discord DAVE voice support.")
            if not getattr(discord.voice_client, "has_dave", False):
                raise RuntimeError("discord.py loaded without native DAVE support; restart after installing voice dependencies.")
            if not hasattr(davey, "DaveSession"):
                raise RuntimeError("The installed davey package is incomplete.")
        except ImportError as exc:
            raise RuntimeError(
                "Native Discord DAVE voice support is missing. Install requirements.txt and restart the bot."
            ) from exc

    @staticmethod
    def _voice_error_details(error: Exception) -> tuple[str, str]:
        """Return a useful diagnosis even for exceptions whose str() is empty."""
        message = str(error).strip()
        error_name = type(error).__name__
        display = f"{error_name}: {message}" if message else error_name
        if isinstance(error, (asyncio.TimeoutError, TimeoutError)):
            details = (
                "Discord did not finish the voice handshake in time. Confirm the bot has View Channel, "
                "Connect, and Speak permissions, then check that the host allows outbound UDP and restart the bot."
            )
        elif "dave" in message.lower():
            details = "Install the updated voice dependencies with `pip install -r requirements.txt`, then restart the bot."
        elif isinstance(error, discord.Forbidden):
            details = "The bot lacks permission to view or connect to that voice channel."
        elif isinstance(error, OSError):
            details = "The host could not reach Discord voice. Check outbound UDP/firewall rules and the voice region."
        else:
            details = "Check the bot log for the full voice handshake traceback."
        return display, details

    async def send_error_embed(
        self,
        target: Union[discord.Interaction, commands.Context, discord.abc.Messageable],
        description: str,
        details: Optional[str] = None,
        delay: Optional[int] = None,
        is_warning: bool = False,
    ) -> Optional[discord.Message]:
        """
        Sends a standardized error embed.
        Core software/bot system errors (is_warning=False) auto-delete after 30 seconds.
        Normal user warnings/notices (is_warning=True) are preserved in chat unless delay is explicitly set.
        """
        if delay is None and not is_warning:
            delay = 30

        embed = make_error_embed(description, details=details, is_warning=is_warning)
        sent_msg = None

        try:
            if isinstance(target, discord.Interaction):
                if target.response.is_done():
                    sent_msg = await target.followup.send(embed=embed, ephemeral=False)
                else:
                    await target.response.send_message(embed=embed, ephemeral=False)
                    try:
                        sent_msg = await target.original_response()
                    except Exception:
                        pass
                if sent_msg and delay:
                    asyncio.create_task(_delayed_delete_msg(sent_msg, delay))
            elif isinstance(target, commands.Context):
                if delay:
                    sent_msg = await target.send(embed=embed, delete_after=delay)
                    if target.message:
                        asyncio.create_task(_delayed_delete_msg(target.message, delay))
                else:
                    sent_msg = await target.send(embed=embed)
            elif hasattr(target, "send"):
                if delay:
                    sent_msg = await target.send(embed=embed, delete_after=delay)
                else:
                    sent_msg = await target.send(embed=embed)
        except Exception as e:
            log.error(f"[send_error_embed Error] {e}")

        return sent_msg

    async def cog_app_command_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        if interaction.guild_id and interaction.guild_id != self._music_allowed_guild_id():
            return
        orig = getattr(error, "original", error)
        if isinstance(error, app_commands.CheckFailure) or isinstance(orig, app_commands.CheckFailure):
            return

        log.error(f"[Music AppCommand Error] {type(orig).__name__}: {orig}")
        import traceback
        traceback.print_exception(type(orig), orig, orig.__traceback__)

        if isinstance(orig, discord.errors.NotFound) and getattr(orig, "code", None) == 10062:
            log.warning("[Music] Ignored expired interaction 10062.")
            return

        detail_msg = str(orig) or type(orig).__name__
        resolution = None
        if "davey" in detail_msg:
            detail_msg = "Discord voice DAVE audio encryption initialized."
            resolution = "Please run the command again."
        elif "PyNaCl" in detail_msg:
            detail_msg = "PyNaCl audio encryption library is missing."
            resolution = "Please type `?fixmusic` in chat or run `pkg install python-pynacl` in Termux."
        elif "ffmpeg was not found" in detail_msg or "ffmpeg" in detail_msg.lower():
            detail_msg = "FFmpeg audio binary is missing."
            resolution = "Please run `pkg install -y ffmpeg` on Termux."

        await self.send_error_embed(
            interaction,
            description=f"Command Error: `{detail_msg}`",
            details=resolution,
            delay=30
        )

    async def cog_command_error(self, ctx: commands.Context, error: commands.CommandError):
        orig = getattr(error, "original", error)
        if isinstance(error, commands.CheckFailure) or isinstance(orig, commands.CheckFailure):
            return

        log.error(f"[Music Command Error] {type(orig).__name__}: {orig}")
        detail_msg = str(orig) or type(orig).__name__
        resolution = None
        if "davey" in detail_msg:
            detail_msg = "Discord voice DAVE audio encryption initialized."
            resolution = "Please run the command again."
        elif "PyNaCl" in detail_msg:
            detail_msg = "PyNaCl audio encryption library is missing."
            resolution = "Please type `?fixmusic` in chat or run `pkg install python-pynacl` in Termux."

        await self.send_error_embed(
            ctx,
            description=f"Command Error: `{detail_msg}`",
            details=resolution,
            delay=30
        )

    @commands.Cog.listener()
    async def on_voice_state_update(self, member: discord.Member, before: discord.VoiceState, after: discord.VoiceState):
        if member.bot:
            if member.id == self.bot.user.id:
                if before.channel and not after.channel:
                    queue = self.service.get_queue(member.guild.id)
                    queue.cancel_inactivity()
                    self.service.remove_queue(member.guild.id)
                elif after.channel and before.channel != after.channel:
                    human_members = [m for m in after.channel.members if not m.bot]
                    if len(human_members) == 0:
                        queue = self.service.get_queue(member.guild.id)
                        if not queue.is_247:
                            self.start_inactivity_countdown(queue, delay=30, reason="alone")
            return

        bot_vc = member.guild.voice_client
        if not bot_vc or not bot_vc.channel:
            return

        # Member left or moved away from the bot's channel
        if before.channel == bot_vc.channel and after.channel != bot_vc.channel:
            human_members = [m for m in bot_vc.channel.members if not m.bot]
            if len(human_members) == 0:
                queue = self.service.get_queue(member.guild.id)
                if not queue.is_247:
                    self.start_inactivity_countdown(queue, delay=30, reason="alone")

        # Member joined or moved back into the bot's channel
        elif after.channel == bot_vc.channel and before.channel != bot_vc.channel:
            queue = self.service.get_queue(member.guild.id)
            if queue.current_track is not None or (bot_vc.is_playing() or bot_vc.is_paused()):
                queue.cancel_inactivity()
            else:
                self.start_inactivity_countdown(queue, delay=60, reason="empty_queue")

    async def ensure_voice(self, interaction: discord.Interaction) -> Optional[discord.VoiceClient]:
        member = interaction.user
        if not isinstance(member, discord.Member):
            member = interaction.guild.get_member(interaction.user.id) or interaction.user

        if not hasattr(member, "voice") or not member.voice or not member.voice.channel:
            await self.send_error_embed(
                interaction,
                description="You must be in a voice channel first! Please join a voice channel and try again.",
                is_warning=True
            )
            return None

        channel = member.voice.channel
        permissions = channel.permissions_for(interaction.guild.me)
        if not permissions.view_channel or not permissions.connect or not permissions.speak:
            await self.send_error_embed(
                interaction,
                description=f"I need View Channel, Connect, and Speak permissions in {channel.mention}.",
                is_warning=True
            )
            return None

        vc = interaction.guild.voice_client
        try:
            await self._ensure_voice_dependencies()
            if not vc or not vc.is_connected():
                if vc:
                    try:
                        await vc.disconnect(force=True)
                    except Exception:
                        pass
                vc = await channel.connect(self_deaf=True, timeout=30.0, reconnect=True)
            elif vc.channel.id != channel.id:
                await vc.move_to(channel)
        except Exception as e:
            log.exception("[Voice Connect Error] %s: %r", type(e).__name__, str(e))
            display_error, details = self._voice_error_details(e)

            await self.send_error_embed(
                interaction,
                description=f"Voice connection failed: `{display_error}`",
                details=details,
                delay=30
            )
            return None

        queue = self.service.get_queue(interaction.guild_id)
        queue.voice_client = vc
        if not queue.text_channel and interaction.channel:
            queue.text_channel = interaction.channel
        human_count = len([m for m in channel.members if not m.bot])
        if human_count == 0:
            self.start_inactivity_countdown(queue, delay=30, reason="alone")
        elif not queue.tracks and queue.current_track is None and not (vc.is_playing() or vc.is_paused()):
            self.start_inactivity_countdown(queue, delay=60, reason="empty_queue")

        return vc

    def build_queue_embed(self, queue: GuildMusicQueue) -> discord.Embed:
        embed = discord.Embed(color=BRAND_COLOR)
        embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)

        current = queue.current_track
        lines = []
        if current:
            lines.append(f"### {Emojis.SYNCINK_MUSIC} Current Track")
            lines.append(f"* [{current.clean_title}]({current.url})")
            lines.append(f"  └ {Emojis.TIME} `{current.formatted_duration}`  •  *{current.author}*\n")
        else:
            lines.append(f"### {Emojis.WARNING} Queue is currently empty.\n")

        if queue.tracks:
            lines.append(f"### {Emojis.QUEUE} Up Next ({queue.size} total)")
            for i, t in enumerate(queue.tracks[:10]):
                lines.append(f"* **{i + 1}.** [{t.clean_title}]({t.url})\n  └ {Emojis.TIME} `{t.formatted_duration}`  •  *{t.author}*\n")
            if queue.size > 10:
                lines.append(f"*...and {queue.size - 10} more track(s)*")
        else:
            lines.append(f"* {Emojis.QUEUE} No upcoming tracks in queue.")

        embed.description = "\n".join(lines).strip()
        return embed

    async def enqueue_and_play(self, interaction: discord.Interaction, tracks: list[Track]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.text_channel = interaction.channel
        queue.cancel_inactivity()

        is_first = queue.current_track is None and not (queue.voice_client and queue.voice_client.is_playing())

        if is_first:
            first_track = tracks.pop(0)
            queue.tracks.extend(tracks)
            await self.play_track(queue, first_track)

            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.delete()
                except Exception:
                    pass
                queue.now_playing_message = None

            view = MusicPlayerLayoutView(self, queue)
            if interaction.response.is_done():
                msg = await interaction.followup.send(view=view)
            else:
                msg = await interaction.response.send_message(view=view)
            queue.now_playing_message = msg
        else:
            queue.tracks.extend(tracks)
            added_track = tracks[0]
            view = TrackEnqueuedLayoutView(added_track, position=queue.size)
            if interaction.response.is_done():
                await interaction.followup.send(view=view)
            else:
                await interaction.response.send_message(view=view)

    async def play_track(self, queue: GuildMusicQueue, track: Track) -> bool:
        queue.playback_token += 1
        playback_token = queue.playback_token
        queue.current_track = track
        queue.start_time = time.time()
        queue.paused_at = None
        queue.total_paused_duration = 0.0

        if not track.is_radio:
            queue.active_radio_station = None
            queue.active_radio_station_info = None

        try:
            # yt-dlp media URLs are signed and short-lived. Resolve again when the
            # track actually starts, especially for items that waited in the queue.
            await self.service.refresh_stream_url(track)
            audio_source = self.service.create_audio_source(track, volume=queue.volume)
        except Exception as src_err:
            log.error(f"[Audio Source Error] {src_err}")
            if track.is_radio:
                queue.active_radio_station = None
                queue.active_radio_station_info = None
                queue.current_track = None
                self.start_inactivity_countdown(queue, delay=60)
                return False
            if queue.text_channel:
                await self.send_error_embed(
                    queue.text_channel,
                    description=f"Audio Decoder Error: `{src_err}`",
                    details="The audio stream could not be loaded or decoded.",
                    delay=30
                )
            await self.advance_queue(queue, expected_token=playback_token)
            return False

        def _after_playback(error):
            if error:
                log.error(f"[Audio Playback Error] {error}")
            if not self.bot.loop.is_closed():
                asyncio.run_coroutine_threadsafe(
                    self.advance_queue(queue, expected_token=playback_token), self.bot.loop
                )

        if queue.voice_client:
            try:
                if queue.voice_client.is_playing() or queue.voice_client.is_paused():
                    queue.voice_client.stop()
                    for _ in range(25):
                        if not queue.voice_client.is_playing():
                            break
                        await asyncio.sleep(0.01)
                queue.voice_client.play(audio_source, after=_after_playback)
                queue.cancel_inactivity()
                if not track.is_radio:
                    norm_key = normalize_title(track.clean_title)
                    queue.session_played_history.append(norm_key)
                    queue.session_played_history = queue.session_played_history[-50:]
                    queue.session_artists.append(track.author)
                    queue.session_artists = queue.session_artists[-20:]
                    if track.requested_by and hasattr(track.requested_by, "id"):
                        AutoPlayService.get_instance().record_track_play(track.requested_by.id, track, manual=True)
                    if queue.autoplay:
                        AutoPlayService.get_instance().trigger_prefetch(queue, self.service)
                return True
            except Exception as play_err:
                log.error(f"[Playback Play Error] {play_err}")
                if track.is_radio:
                    queue.active_radio_station = None
                    queue.active_radio_station_info = None
                    queue.current_track = None
                    self.start_inactivity_countdown(queue, delay=60)
                    return False
                if queue.text_channel:
                    await self.send_error_embed(
                        queue.text_channel,
                        description=f"Playback Start Error: `{play_err}`",
                        details="Could not stream audio to voice channel.",
                        delay=30
                    )
                return False
        return False

    async def advance_queue(self, queue: GuildMusicQueue, expected_token: Optional[int] = None):
        async with queue.advance_lock:
            if expected_token is not None and expected_token != queue.playback_token:
                return
            # Invalidate this playback's callback before any awaits, so repeated
            # after() notifications cannot start duplicate tracks.
            queue.playback_token += 1
        await self._advance_queue_locked(queue)

    async def _advance_queue_locked(self, queue: GuildMusicQueue):
        was_manual_skip = getattr(queue, "manual_skip", False)
        queue.manual_skip = False

        last_track = queue.current_track
        was_radio = bool(last_track and (last_track.is_radio or getattr(last_track, "platform", "") == "radio"))
        last_radio_title = (
            (last_track.clean_title if last_track else None)
            or (queue.active_radio_station_info.get("name") if queue.active_radio_station_info else None)
            or (queue.active_radio_station if queue.active_radio_station else "Live Radio")
        )
        stream_duration = time.time() - queue.start_time if queue.start_time > 0 else 0.0

        if queue.repeat_mode == "track" and queue.current_track and not was_radio and not was_manual_skip:
            next_track = queue.current_track
        elif queue.repeat_mode == "queue" and queue.current_track and not was_radio:
            queue.history.append(queue.current_track)
            queue.tracks.append(queue.current_track)
            next_track = queue.tracks.pop(0) if queue.tracks else None
        else:
            if queue.current_track and not was_radio:
                queue.history.append(queue.current_track)
            next_track = queue.tracks.pop(0) if queue.tracks else None

        if next_track:
            await self.play_track(queue, next_track)
            if queue.text_channel:
                if queue.now_playing_message:
                    try:
                        await queue.now_playing_message.delete()
                    except Exception:
                        pass
                    queue.now_playing_message = None
                view = MusicPlayerLayoutView(self, queue)
                try:
                    queue.now_playing_message = await queue.text_channel.send(view=view)
                except Exception as e:
                    log.warning(f"Failed to send Now Playing view: {e}")
            return

        # Queue is empty - Handle Radio vs Normal Autoplay
        if was_radio:
            if was_manual_skip:
                queue.active_radio_station = None
                queue.active_radio_station_info = None
                queue.current_track = None
                if queue.now_playing_message:
                    try:
                        await queue.now_playing_message.delete()
                    except Exception:
                        pass
                    queue.now_playing_message = None
                if queue.text_channel:
                    embed_finished = discord.Embed(
                        description="### Reached the end of the queue. Please queue some track(s) again!",
                        color=BRAND_COLOR
                    )
                    await queue.text_channel.send(embed=embed_finished)
                self.start_inactivity_countdown(queue, delay=60, reason="empty_queue")
                return

            # Check 24/7 predefined radio presets (lofi, synthwave, etc.)
            if queue.active_radio_station and queue.active_radio_station in RADIO_STATIONS:
                station = RADIO_STATIONS[queue.active_radio_station]
                requester = last_track.requested_by if last_track else None
                if requester:
                    queries = list(station.get("queries", []))
                    random.shuffle(queries)
                    chosen = None
                    for query in queries[:3]:
                        try:
                            tracks = await self.service.search_and_extract(query, requester, platform="radio", limit=5)
                        except Exception as radio_err:
                            log.warning(f"[Radio] Could not resolve station track for '{query}': {radio_err}")
                            continue
                        chosen = next((track for track in tracks if track.url not in queue.radio_recent_urls), None)
                        if chosen or tracks:
                            chosen = chosen or tracks[0]
                            break

                    if chosen:
                        chosen.is_radio = True
                        chosen.radio_station_id = queue.active_radio_station
                        chosen.platform = "radio"
                        queue.radio_recent_urls.append(chosen.url)
                        queue.radio_recent_urls = queue.radio_recent_urls[-50:]
                        await self.play_track(queue, chosen)
                        if queue.text_channel:
                            if queue.now_playing_message:
                                try:
                                    await queue.now_playing_message.delete()
                                except Exception:
                                    pass
                                queue.now_playing_message = None
                            view = MusicPlayerLayoutView(self, queue)
                            queue.now_playing_message = await queue.text_channel.send(view=view)
                        return
                    log.warning(f"[Radio] No playable tracks resolved for preset station {queue.active_radio_station}; ending radio session.")

            # Live Country Radio stream ended or failed unexpectedly
            queue.active_radio_station = None
            queue.active_radio_station_info = None
            queue.current_track = None

            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.delete()
                except Exception:
                    pass
                queue.now_playing_message = None

            if queue.text_channel:
                menu_link = f"[radio menu]({queue.radio_menu_url})" if getattr(queue, "radio_menu_url", None) else "radio menu"
                if stream_duration < 5.0:
                    warn_desc = f"### {Emojis.WARNING} Station **{last_radio_title}** is currently offline or unreachable.\nPlease choose another station from the {menu_link}."
                else:
                    warn_desc = f"### {Emojis.WARNING} Live radio stream for **{last_radio_title}** was disconnected or interrupted.\nPlease choose another station from the {menu_link}."

                warn_embed = discord.Embed(
                    description=warn_desc,
                    color=0xED4245
                )
                try:
                    await queue.text_channel.send(embed=warn_embed)
                except Exception:
                    pass

            self.start_inactivity_countdown(queue, delay=60, reason="empty_queue")
            return

        # Normal music playback - Check AI-Powered AutoPlay
        if queue.autoplay:
            requester = None
            if last_track and getattr(last_track, "requested_by", None):
                requester = last_track.requested_by
            elif queue.history and getattr(queue.history[-1], "requested_by", None):
                requester = queue.history[-1].requested_by
            if not requester:
                listeners = AutoPlayService.get_instance().get_vc_listeners(queue)
                requester = listeners[0] if listeners else None

            if requester:
                rec_track, rec_meta = await AutoPlayService.get_instance().resolve_next_track(
                    queue, requester, self.service
                )
                if rec_track:
                    queue.last_autoplay_meta = rec_meta
                    played = await self.play_track(queue, rec_track)
                    if played:
                        if queue.text_channel:
                            if queue.now_playing_message:
                                try:
                                    await queue.now_playing_message.delete()
                                except Exception:
                                    pass
                                queue.now_playing_message = None
                            view = MusicPlayerLayoutView(self, queue)
                            try:
                                queue.now_playing_message = await queue.text_channel.send(view=view)
                            except Exception as e:
                                log.warning(f"Failed to send Now Playing view: {e}")

                        # Gapless prefetch: queue the next song in background so transitions are 0s delay
                        AutoPlayService.get_instance().trigger_prefetch(queue, self.service)
                        return

        # End of queue reached for normal music
        queue.current_track = None
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.delete()
            except Exception:
                pass
            queue.now_playing_message = None

        if queue.text_channel:
            embed_finished = discord.Embed(
                description="### Reached the end of the queue. Please queue some track(s) again!",
                color=BRAND_COLOR
            )
            await queue.text_channel.send(embed=embed_finished)

        self.start_inactivity_countdown(queue, delay=60)

    def start_inactivity_countdown(self, queue: GuildMusicQueue, delay: int = 60, reason: str = "empty_queue"):
        if queue.is_247:
            return
        queue.cancel_inactivity()
        queue.inactivity_task = asyncio.create_task(self._inactivity_countdown(queue.guild_id, delay=delay, reason=reason))

    async def _inactivity_countdown(self, guild_id: int, delay: int = 60, reason: str = "empty_queue"):
        try:
            await asyncio.sleep(delay)
            queue = self.service.get_queue(guild_id)
            if queue.is_247:
                return

            guild = self.bot.get_guild(guild_id)
            vc = (guild.voice_client if guild else None) or queue.voice_client
            if not vc or not vc.is_connected():
                self.service.remove_queue(guild_id)
                return

            # Check if active playback or upcoming tracks exist
            is_active = (queue.current_track is not None) or bool(queue.tracks) or vc.is_playing() or vc.is_paused()

            # Check if alone in VC (only bots)
            human_members = [m for m in vc.channel.members if not m.bot] if vc.channel else []
            alone = len(human_members) == 0

            if not is_active or alone:
                text_chan = queue.text_channel
                if not text_chan and guild:
                    text_chan = guild.get_channel(MUSIC_COMMAND_CHANNEL_ID) or guild.system_channel

                if text_chan:
                    try:
                        if alone or reason == "alone":
                            leave_desc = f"### {Emojis.WARNING} Left the voice channel as no one was in the voice channel."
                        else:
                            leave_desc = "### Left the voice channel due to empty queue"

                        embed_leave = discord.Embed(
                            description=leave_desc,
                            color=0xED4245
                        )
                        await text_chan.send(embed=embed_leave)
                    except Exception as e:
                        log.warning(f"Could not send leave embed: {e}")

                if queue.now_playing_message:
                    try:
                        await queue.now_playing_message.delete()
                    except Exception:
                        pass
                    queue.now_playing_message = None

                try:
                    await vc.disconnect(force=True)
                except Exception as e:
                    log.warning(f"Error disconnecting from voice: {e}")

                self.service.remove_queue(guild_id)
        except asyncio.CancelledError:
            pass
        except Exception as err:
            log.exception(f"Error in inactivity countdown: {err}")

    async def start_radio_for_interaction(self, interaction: discord.Interaction, station_id: str):
        if not interaction.response.is_done():
            await interaction.response.defer()

        vc = await self.ensure_voice(interaction)
        if not vc:
            return
        queue = self.service.get_queue(interaction.guild_id)
        queue.voice_client = vc
        queue.text_channel = interaction.channel
        queue.cancel_inactivity()

        try:
            track = await self.service.start_radio_station(vc.channel, interaction.channel, interaction.user, station_id)
            await self.play_track(queue, track)
        except Exception as e:
            log.error(f"[Radio Start Error] {e}")
            await self.send_error_embed(
                interaction,
                description=f"Could not load radio station: `{e}`",
                delay=30
            )
            return

        if queue.now_playing_message:
            try:
                await queue.now_playing_message.delete()
            except Exception:
                pass
            queue.now_playing_message = None

        view = MusicPlayerLayoutView(self, queue)
        msg = await interaction.followup.send(view=view)
        queue.now_playing_message = msg

    async def start_country_radio_flow(
        self,
        target: Union[discord.Interaction, commands.Context],
        country_name: str,
        is_select_callback: bool = False
    ):
        is_interaction = isinstance(target, discord.Interaction)
        user = target.user if is_interaction else target.author
        guild = target.guild

        if is_interaction:
            vc = await self.ensure_voice(target)
        else:
            vc = await self.ensure_voice_ctx(target)

        if not vc:
            return

        queue = self.service.get_queue(guild.id)
        queue.voice_client = vc
        queue.text_channel = target.channel
        queue.cancel_inactivity()

        stations = RadioService.get_instance().get_country_stations(country_name, limit=150)
        if not stations:
            self.start_inactivity_countdown(queue, delay=60)
            await self.send_error_embed(
                target,
                description=f"No active radio stations found for **{country_name}**.",
                details="Please try another country name or ISO code.",
                is_warning=True
            )
            return

        chosen = stations[0]
        await self.tune_into_station(
            target, chosen, country_name, stations=stations, is_switch_callback=is_select_callback
        )

    async def tune_into_station(
        self,
        target: Union[discord.Interaction, commands.Context],
        station: dict,
        country_name: str,
        stations: Optional[list] = None,
        is_switch_callback: bool = False
    ):
        is_interaction = isinstance(target, discord.Interaction)
        user = target.user if is_interaction else target.author
        guild = target.guild

        if is_interaction:
            vc = await self.ensure_voice(target)
        else:
            vc = await self.ensure_voice_ctx(target)

        if not vc:
            return

        queue = self.service.get_queue(guild.id)
        queue.voice_client = vc
        queue.text_channel = target.channel
        queue.cancel_inactivity()

        if is_interaction and hasattr(target, "message") and target.message:
            queue.radio_menu_url = target.message.jump_url
            queue.radio_menu_message = target.message

        flag = get_country_flag(country_name)
        track = make_radio_track(station, country_name, user, flag=flag)
        queue.active_radio_station = country_name
        queue.active_radio_station_info = station
        queue.tracks.clear()

        if stations is None:
            stations = RadioService.get_instance().get_country_stations(country_name, limit=150)

        stream_started = False
        try:
            stream_started = await self.play_track(queue, track)
        except Exception as play_err:
            log.warning(f"[Radio Play Error] {play_err}")
            stream_started = False

        if not stream_started or not queue.current_track:
            queue.active_radio_station = None
            queue.active_radio_station_info = None
            queue.current_track = None
            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.delete()
                except Exception:
                    pass
                queue.now_playing_message = None
            self.start_inactivity_countdown(queue, delay=60, reason="empty_queue")

            menu_link = f"[radio menu]({queue.radio_menu_url})" if getattr(queue, "radio_menu_url", None) else "the radio menu"
            switch_view = RadioStationSelectView(self, user, country_name, stations or [])
            warn_embed = discord.Embed(
                description=f"### {Emojis.WARNING} Station **{station.get('name', 'Live Radio')}** is currently offline or unreachable.\n{Emojis.S_ARROW} *Please choose another station from {menu_link} or use 🔍 Search:*",
                color=0xED4245
            )
            if is_switch_callback and is_interaction:
                try:
                    await target.edit_original_response(embed=warn_embed, view=switch_view)
                    orig = await target.original_response()
                    if orig:
                        queue.radio_menu_url = orig.jump_url
                        queue.radio_menu_message = orig
                    return
                except Exception:
                    pass
            elif is_interaction:
                try:
                    if target.response.is_done():
                        await target.edit_original_response(embed=warn_embed, view=switch_view)
                    else:
                        await target.response.send_message(embed=warn_embed, view=switch_view)
                    orig = await target.original_response()
                    if orig:
                        queue.radio_menu_url = orig.jump_url
                        queue.radio_menu_message = orig
                    return
                except Exception:
                    try:
                        msg = await target.followup.send(embed=warn_embed, view=switch_view)
                        if msg:
                            queue.radio_menu_url = msg.jump_url
                            queue.radio_menu_message = msg
                        return
                    except Exception:
                        pass
            else:
                msg = await target.send(embed=warn_embed, view=switch_view)
                if msg:
                    queue.radio_menu_url = msg.jump_url
                    queue.radio_menu_message = msg
                return

        # Update or send player card in place without chat spam
        if queue.current_track:
            view = MusicPlayerLayoutView(self, queue)
            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.edit(view=view)
                except Exception:
                    if queue.text_channel:
                        queue.now_playing_message = await queue.text_channel.send(view=view)
            elif queue.text_channel:
                queue.now_playing_message = await queue.text_channel.send(view=view)

        if stations:
            switch_view = RadioStationSelectView(self, user, country_name, stations)
            info_embed = discord.Embed(
                description=f"{Emojis.RADIO} **Tuned into {station['name']} ({flag} {country_name})**\n{Emojis.S_ARROW} *Use dropdown below to switch station anytime (🔍 Search available):*",
                color=BRAND_COLOR
            )
            if is_switch_callback and is_interaction:
                try:
                    await target.edit_original_response(embed=info_embed, view=switch_view)
                    orig = await target.original_response()
                    if orig:
                        queue.radio_menu_url = orig.jump_url
                        queue.radio_menu_message = orig
                except Exception:
                    try:
                        msg = await target.followup.send(embed=info_embed, view=switch_view)
                        if msg:
                            queue.radio_menu_url = msg.jump_url
                            queue.radio_menu_message = msg
                    except Exception:
                        pass
            elif is_interaction:
                try:
                    if target.response.is_done():
                        await target.edit_original_response(embed=info_embed, view=switch_view)
                    else:
                        await target.response.send_message(embed=info_embed, view=switch_view)
                    orig = await target.original_response()
                    if orig:
                        queue.radio_menu_url = orig.jump_url
                        queue.radio_menu_message = orig
                except Exception:
                    try:
                        msg = await target.followup.send(embed=info_embed, view=switch_view)
                        if msg:
                            queue.radio_menu_url = msg.jump_url
                            queue.radio_menu_message = msg
                    except Exception:
                        pass
            else:
                msg = await target.send(embed=info_embed, view=switch_view)
                if msg:
                    queue.radio_menu_url = msg.jump_url
                    queue.radio_menu_message = msg

    async def ensure_voice_ctx(self, ctx: commands.Context) -> Optional[discord.VoiceClient]:
        if not ctx.author.voice or not ctx.author.voice.channel:
            await self.send_error_embed(
                ctx,
                description="Please join a voice channel first, then try again.",
                is_warning=True
            )
            return None

        channel = ctx.author.voice.channel
        permissions = channel.permissions_for(ctx.guild.me)
        if not permissions.view_channel or not permissions.connect or not permissions.speak:
            await self.send_error_embed(
                ctx,
                description=f"I need View Channel, Connect, and Speak permissions in {channel.mention}.",
                is_warning=True
            )
            return None

        vc = ctx.guild.voice_client
        try:
            await self._ensure_voice_dependencies()
            if not vc or not vc.is_connected():
                if vc:
                    try:
                        await vc.disconnect(force=True)
                    except Exception:
                        pass
                    vc = await channel.connect(self_deaf=True, timeout=30.0, reconnect=True)
            elif vc.channel.id != channel.id:
                await vc.move_to(channel)
        except Exception as e:
            log.exception("[Voice Connect Error] %s: %r", type(e).__name__, str(e))
            display_error, details = self._voice_error_details(e)

            await self.send_error_embed(
                ctx,
                description=f"Voice connection failed: `{display_error}`",
                details=details,
                delay=30
            )
            return None

        queue = self.service.get_queue(ctx.guild.id)
        queue.voice_client = vc
        if not queue.text_channel and ctx.channel:
            queue.text_channel = ctx.channel
        human_count = len([m for m in channel.members if not m.bot])
        if human_count == 0:
            self.start_inactivity_countdown(queue, delay=30, reason="alone")
        elif not queue.tracks and queue.current_track is None and not (vc.is_playing() or vc.is_paused()):
            self.start_inactivity_countdown(queue, delay=60, reason="empty_queue")

        return vc

    async def enqueue_and_play_ctx(self, ctx: commands.Context, tracks: list[Track]):
        queue = self.service.get_queue(ctx.guild.id)
        queue.text_channel = ctx.channel
        queue.cancel_inactivity()

        is_first = queue.current_track is None and not (queue.voice_client and queue.voice_client.is_playing())

        if is_first:
            first_track = tracks.pop(0)
            queue.tracks.extend(tracks)
            await self.play_track(queue, first_track)

            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.delete()
                except Exception:
                    pass
                queue.now_playing_message = None

            view = MusicPlayerLayoutView(self, queue)
            msg = await ctx.send(view=view)
            queue.now_playing_message = msg
        else:
            queue.tracks.extend(tracks)
            added_track = tracks[0]
            view = TrackEnqueuedLayoutView(added_track, position=queue.size)
            await ctx.send(view=view)

    async def start_radio_for_ctx(self, ctx: commands.Context, station_id: str):
        vc = await self.ensure_voice_ctx(ctx)
        if not vc:
            return
        queue = self.service.get_queue(ctx.guild.id)
        queue.voice_client = vc
        queue.text_channel = ctx.channel
        queue.cancel_inactivity()

        try:
            track = await self.service.start_radio_station(vc.channel, ctx.channel, ctx.author, station_id)
        except Exception as e:
            await self.send_error_embed(ctx, description=f"Failed to start radio station: `{e}`", delay=30)
            return

        await self.play_track(queue, track)
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.delete()
            except Exception:
                pass
            queue.now_playing_message = None

        view = MusicPlayerLayoutView(self, queue)
        msg = await ctx.send(view=view)
        queue.now_playing_message = msg

    # ==========================================
    # SLASH & HYBRID COMMANDS
    # ==========================================

    @app_commands.command(name="play", description="Search & stream high-fidelity audio from YouTube, Spotify, etc.")
    @app_commands.describe(query="Song title, artist, or music URL", platform="Preferred streaming platform")
    async def slash_play(self, interaction: discord.Interaction, query: str, platform: Literal["auto", "youtube", "spotify", "soundcloud", "applemusic", "deezer", "tidal"] = "auto"):
        # 1. Defer immediately to avoid Discord 3-second interaction timeout
        await interaction.response.defer()

        # 2. Check and connect to voice
        vc = await self.ensure_voice(interaction)
        if not vc:
            return

        queue = self.service.get_queue(interaction.guild_id)
        queue.voice_client = vc
        queue.text_channel = interaction.channel

        # 3. Search and extract
        try:
            tracks = await self.service.search_and_extract(query, interaction.user, platform=platform, limit=1)
        except Exception as e:
            log.error(f"[Music Search Error] {e}")
            await self.send_error_embed(interaction, description=f"Track lookup failed: `{e}`", delay=30)
            return

        if not tracks:
            await self.send_error_embed(interaction, description=f"No tracks found for: **{query}**", is_warning=True)
            return

        # 4. Play
        try:
            await self.enqueue_and_play(interaction, tracks)
        except Exception as e:
            log.error(f"[Enqueue Error] {e}")
            await self.send_error_embed(interaction, description=f"Could not start playback: `{e}`", delay=30)

    @app_commands.command(name="radio", description="Tune into endless live radio stations from any country worldwide.")
    @app_commands.describe(country="Country name or ISO code (e.g. India, United States, Japan, etc.)")
    async def slash_radio(self, interaction: discord.Interaction, country: Optional[str] = None):
        if not country:
            view = CountryRadioSelectView(self, interaction.user)
            embed = discord.Embed(
                description=f"### {Emojis.RADIO} Worldwide Country Radio\nSelect a country below (Pg 1/{view.total_pages}) or click 🔍 to search worldwide:",
                color=BRAND_COLOR
            )
            await interaction.response.send_message(embed=embed, view=view)
            try:
                orig = await interaction.original_response()
                if orig:
                    queue = self.service.get_queue(interaction.guild_id)
                    queue.radio_menu_url = orig.jump_url
                    queue.radio_menu_message = orig
            except Exception:
                pass
            return

        await interaction.response.defer()
        await self.start_country_radio_flow(interaction, country)

    @slash_radio.autocomplete('country')
    async def radio_country_autocomplete(self, interaction: discord.Interaction, current: str) -> list[app_commands.Choice[str]]:
        radio_svc = RadioService.get_instance()
        countries = radio_svc.search_countries(current, limit=25)
        choices = []
        for c in countries:
            name = c.get("name", "")
            code = c.get("iso_3166_1", "")
            flag = get_country_flag(code or name)
            count = c.get("stationcount", 0)
            label = f"{flag} {name} ({count} stations)"[:100]
            choices.append(app_commands.Choice(name=label, value=name[:100]))
        return choices

    @app_commands.command(name="lofi", description="Stream 24/7 relaxing lofi study and chill beats.")
    async def slash_lofi(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.start_radio_for_interaction(interaction, "lofi")

    @app_commands.command(name="search", description="Interactive 5-result music picker.")
    @app_commands.describe(query="Search query", platform="Streaming provider")
    async def slash_search(self, interaction: discord.Interaction, query: str, platform: Literal["auto", "youtube", "spotify", "soundcloud"] = "auto"):
        # 1. Defer immediately
        await interaction.response.defer()

        vc = await self.ensure_voice(interaction)
        if not vc:
            return

        queue = self.service.get_queue(interaction.guild_id)
        queue.voice_client = vc
        queue.text_channel = interaction.channel

        try:
            tracks = await self.service.search_and_extract(query, interaction.user, platform=platform, limit=10)
        except Exception as e:
            log.error(f"[Music Search Error] {e}")
            await self.send_error_embed(interaction, description=f"Search failed: `{e}`", delay=30)
            return

        if not tracks:
            await self.send_error_embed(interaction, description=f"No results found for **{query}**.", is_warning=True)
            return

        view = SearchPickerLayoutView(self, interaction.user, tracks)
        await interaction.followup.send(view=view)

    @app_commands.command(name="pause", description="Pause active music playback.")
    async def slash_pause(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.voice_client or not queue.voice_client.is_playing():
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True)
            return
        queue.voice_client.pause()
        queue.paused_at = time.time()
        await interaction.response.send_message(f"{Emojis.PAUSE_BUTTON} Playback paused. Resume anytime with `/resume`.", ephemeral=True)
        if queue.now_playing_message:
            try:
                view = MusicPlayerLayoutView(self, queue)
                await queue.now_playing_message.edit(view=view)
            except Exception:
                pass

    @app_commands.command(name="resume", description="Resume paused music playback.")
    async def slash_resume(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.voice_client or not queue.voice_client.is_paused():
            await self.send_error_embed(interaction, description="Playback is not paused.", is_warning=True)
            return
        queue.voice_client.resume()
        if queue.paused_at is not None:
            queue.total_paused_duration += (time.time() - queue.paused_at)
            queue.paused_at = None
        await interaction.response.send_message(f"{Emojis.PLAY_BUTTON} Playback resumed.", ephemeral=True)
        if queue.now_playing_message:
            try:
                view = MusicPlayerLayoutView(self, queue)
                await queue.now_playing_message.edit(view=view)
            except Exception:
                pass

    @app_commands.command(name="skip", description="Skip current track forward.")
    @app_commands.describe(count="Number of tracks to skip")
    async def slash_skip(self, interaction: discord.Interaction, count: int = 1):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.voice_client or not queue.current_track:
            await self.send_error_embed(interaction, description="Nothing is currently playing to skip.", is_warning=True)
            return
        to_drop = max(0, count - 1)
        for _ in range(min(to_drop, len(queue.tracks))):
            queue.tracks.pop(0)
        played_sec = queue.get_playback_time()
        AutoPlayService.get_instance().record_track_skip(interaction.user.id, queue.current_track, played_sec)
        skipped = queue.current_track.clean_title
        queue.manual_skip = True
        queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.NEXT} Skipped: **{skipped}**", ephemeral=True)

    @app_commands.command(name="previous", description="Replay the previous track in history.")
    async def slash_previous(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.history:
            await self.send_error_embed(interaction, description="No history available.", is_warning=True)
            return
        prev = queue.history.pop()
        if queue.current_track:
            queue.tracks.insert(0, queue.current_track)
        queue.tracks.insert(0, prev)
        if queue.voice_client:
            queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.PREVIOUS} Replaying previous track: **{prev.clean_title}**", ephemeral=True)

    @app_commands.command(name="stop", description="Stop music and clear the queue.")
    async def slash_stop(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        queue.tracks.clear()
        queue.active_radio_station = None
        queue.active_radio_station_info = None
        queue.manual_skip = True
        queue.autoplay = False
        if queue.voice_client:
            queue.voice_client.stop()
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.delete()
            except Exception:
                pass
            queue.now_playing_message = None
        embed = discord.Embed(description=f"{Emojis.DELETE} Stopped playback and cleared the session.", color=BRAND_COLOR)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="leave", description="Disconnect from voice channel.")
    async def slash_leave(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if queue.voice_client and queue.voice_client.is_connected():
            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.delete()
                except Exception:
                    pass
                queue.now_playing_message = None
            await queue.voice_client.disconnect(force=True)
            self.service.remove_queue(interaction.guild_id)
            embed = discord.Embed(description=f"{Emojis.DELETE} Left the voice channel and cleared active session.", color=BRAND_COLOR)
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            await self.send_error_embed(interaction, description="Not currently connected to voice.", is_warning=True)

    @app_commands.command(name="queue", description="Manage or display the music queue.")
    @app_commands.describe(action="View or clear the upcoming queue")
    async def slash_queue(self, interaction: discord.Interaction, action: Literal["list", "clear"] = "list"):
        queue = self.service.get_queue(interaction.guild_id)
        if action == "clear":
            count = len(queue.tracks)
            queue.tracks.clear()
            embed = discord.Embed(description=f"{Emojis.APPROVED} Cleared **{count}** track(s) from the upcoming queue.", color=BRAND_COLOR)
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            embed = self.build_queue_embed(queue)
            view = QueueLayoutView(self, queue, interaction.user.id)
            await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    @app_commands.command(name="np", description="Display the interactive now playing music card.")
    async def slash_np(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.current_track:
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True)
            return
        view = NowPlayingLayoutView(queue)
        await interaction.response.send_message(view=view, delete_after=30)

    @app_commands.command(name="shuffle", description="Randomize upcoming tracks in queue.")
    async def slash_shuffle(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if len(queue.tracks) < 2:
            await self.send_error_embed(interaction, description="Need at least 2 tracks in queue to shuffle.", is_warning=True)
            return
        random.shuffle(queue.tracks)
        await interaction.response.send_message(f"{Emojis.SHUFFLE} Randomized **{len(queue.tracks)}** upcoming tracks!", ephemeral=True)

    @app_commands.command(name="loop", description="Toggle loop mode.")
    @app_commands.describe(mode="Repeat mode")
    async def slash_loop(self, interaction: discord.Interaction, mode: Literal["off", "track", "queue"]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.repeat_mode = mode
        await interaction.response.send_message(f"{Emojis.REPEAT} Repeat mode set to: **{mode.upper()}**", ephemeral=True)

    @app_commands.command(name="volume", description="Set audio gain volume (1% to 200%).")
    @app_commands.describe(percent="Volume percentage")
    async def slash_volume(self, interaction: discord.Interaction, percent: int):
        val = max(1, min(200, percent))
        queue = self.service.get_queue(interaction.guild_id)
        queue.volume = val
        if queue.voice_client and queue.voice_client.source and hasattr(queue.voice_client.source, "volume"):
            queue.voice_client.source.volume = val / 100.0
        await interaction.response.send_message(f"{Emojis.SYNCBOT} Volume adjusted to **{val}%**.", ephemeral=True)

    @app_commands.command(name="autoplay", description="AI-powered personal DJ & continuous song recommendation.")
    @app_commands.describe(mode="Directly toggle ON or OFF (or omit to open interactive AI DJ settings)")
    async def slash_autoplay(self, interaction: discord.Interaction, mode: Optional[Literal["on", "off"]] = None):
        queue = self.service.get_queue(interaction.guild_id)
        if mode == "on":
            queue.autoplay = True
            AutoPlayService.get_instance().trigger_prefetch(queue, self.service)
            embed = discord.Embed(
                description=f"### {Emojis.AI} AI AutoPlay is now **ENABLED**.\nSyncInk AI DJ will seamlessly recommend matching tracks as your queue finishes.",
                color=BRAND_COLOR
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        elif mode == "off":
            queue.autoplay = False
            queue.prefetched_autoplay_track = None
            queue.prefetched_autoplay_meta = None
            embed = discord.Embed(
                description=f"### {Emojis.REFUSED} AI AutoPlay is now **DISABLED**.",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            view = AutoPlayControlCenterView(self, interaction.user, queue)
            embed = view.build_embed()
            await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    @app_commands.command(name="247", description="Keep bot in voice channel 24/7.")
    @app_commands.describe(mode="Enable or disable 24/7 mode")
    async def slash_247(self, interaction: discord.Interaction, mode: Literal["on", "off"]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.is_247 = (mode == "on")
        if queue.is_247:
            queue.cancel_inactivity()
        status = "ENABLED" if queue.is_247 else "DISABLED"
        await interaction.response.send_message(f"{Emojis.SYNCINK_MUSIC} 24/7 Voice Channel Mode is now **{status}**.", ephemeral=True)

    @app_commands.command(name="replay", description="Replay current track from the beginning.")
    async def slash_replay(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.current_track or not queue.voice_client:
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True)
            return
        curr = queue.current_track
        queue.tracks.insert(0, curr)
        queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.PREVIOUS} Replaying: **{curr.clean_title}**", ephemeral=True)

    # ==========================================
    # PREFIX COMMANDS (?)
    # ==========================================

    @commands.command(name="play", aliases=["p"], description="Search & stream high-fidelity audio from YouTube, Spotify, etc.")
    async def cmd_play(self, ctx: commands.Context, *, query: Optional[str] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if not query:
            if queue.voice_client and queue.voice_client.is_paused():
                queue.voice_client.resume()
                if queue.paused_at is not None:
                    queue.total_paused_duration += (time.time() - queue.paused_at)
                    queue.paused_at = None
                await ctx.send(f"{Emojis.PLAY_BUTTON} Playback resumed.")
                return
            await self.send_error_embed(
                ctx,
                description="Usage: `?play <song title, artist, or music URL>`",
                details="*Example:* `?play lofi hip hop` or `?play https://...`",
                is_warning=True
            )
            return

        vc = await self.ensure_voice_ctx(ctx)
        if not vc:
            return

        queue.voice_client = vc
        queue.text_channel = ctx.channel

        msg = await ctx.send(f"🔍 Searching for **{query}**...")
        try:
            tracks = await self.service.search_and_extract(query, ctx.author, platform="auto", limit=1)
        except Exception as e:
            try:
                await msg.delete()
            except Exception:
                pass
            await self.send_error_embed(ctx, description=f"Track lookup failed: `{e}`", delay=30)
            return

        try:
            await msg.delete()
        except Exception:
            pass

        if not tracks:
            await self.send_error_embed(ctx, description=f"No tracks found for: **{query}**", is_warning=True)
            return

        try:
            await self.enqueue_and_play_ctx(ctx, tracks)
        except Exception as e:
            await self.send_error_embed(ctx, description=f"Could not begin playback: `{e}`", delay=30)

    @commands.command(name="radio", description="Tune into endless live radio stations from any country worldwide.")
    async def cmd_radio(self, ctx: commands.Context, *, country: Optional[str] = None):
        if not country:
            view = CountryRadioSelectView(self, ctx.author)
            embed = discord.Embed(
                description=f"### {Emojis.RADIO} Worldwide Country Radio\nSelect a country below (Pg 1/{view.total_pages}) or click 🔍 to search worldwide:",
                color=BRAND_COLOR
            )
            msg = await ctx.send(embed=embed, view=view)
            if msg:
                queue = self.service.get_queue(ctx.guild.id)
                queue.radio_menu_url = msg.jump_url
                queue.radio_menu_message = msg
            return

        await self.start_country_radio_flow(ctx, country)

    @commands.command(name="lofi", description="Stream 24/7 relaxing lofi study and chill beats.")
    async def cmd_lofi(self, ctx: commands.Context):
        await self.start_radio_for_ctx(ctx, "lofi")

    @commands.command(name="search", description="Interactive 5-result music picker.")
    async def cmd_search(self, ctx: commands.Context, *, query: str):
        vc = await self.ensure_voice_ctx(ctx)
        if not vc:
            return

        queue = self.service.get_queue(ctx.guild.id)
        queue.voice_client = vc
        queue.text_channel = ctx.channel

        msg = await ctx.send(f"🔍 Searching results for **{query}**...")
        try:
            tracks = await self.service.search_and_extract(query, ctx.author, platform="auto", limit=10)
        except Exception as e:
            try:
                await msg.delete()
            except Exception:
                pass
            await self.send_error_embed(ctx, description=f"Search failed: `{e}`", delay=30)
            return

        try:
            await msg.delete()
        except Exception:
            pass

        if not tracks:
            await self.send_error_embed(ctx, description=f"No results found for **{query}**.", is_warning=True)
            return

        view = SearchPickerLayoutView(self, ctx.author, tracks)
        await ctx.send(view=view)

    @commands.command(name="pause", description="Pause active music playback.")
    async def cmd_pause(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.voice_client or not queue.voice_client.is_playing():
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True)
            return
        queue.voice_client.pause()
        queue.paused_at = time.time()
        await ctx.send(f"{Emojis.PAUSE_BUTTON} Playback paused.", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))
        if queue.now_playing_message:
            try:
                view = MusicPlayerLayoutView(self, queue)
                await queue.now_playing_message.edit(view=view)
            except Exception:
                pass

    @commands.command(name="resume", description="Resume paused music playback.")
    async def cmd_resume(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.voice_client or not queue.voice_client.is_paused():
            await self.send_error_embed(ctx, description="Playback is not paused.", is_warning=True)
            return
        queue.voice_client.resume()
        if queue.paused_at is not None:
            queue.total_paused_duration += (time.time() - queue.paused_at)
            queue.paused_at = None
        await ctx.send(f"{Emojis.PLAY_BUTTON} Playback resumed.", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))
        if queue.now_playing_message:
            try:
                view = MusicPlayerLayoutView(self, queue)
                await queue.now_playing_message.edit(view=view)
            except Exception:
                pass

    @commands.command(name="skip", aliases=["s", "next"], description="Skip current track forward.")
    async def cmd_skip(self, ctx: commands.Context, count: int = 1):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.voice_client or not queue.current_track:
            await self.send_error_embed(ctx, description="Nothing is currently playing to skip.", is_warning=True)
            return
        to_drop = max(0, count - 1)
        for _ in range(min(to_drop, len(queue.tracks))):
            queue.tracks.pop(0)
        played_sec = queue.get_playback_time()
        AutoPlayService.get_instance().record_track_skip(ctx.author.id, queue.current_track, played_sec)
        skipped = queue.current_track.clean_title
        queue.manual_skip = True
        queue.voice_client.stop()
        await ctx.send(f"{Emojis.NEXT} Skipped: **{skipped}**", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

    @commands.command(name="previous", aliases=["prev"], description="Replay previous track in history.")
    async def cmd_previous(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.history:
            await self.send_error_embed(ctx, description="No history available.", is_warning=True)
            return
        prev = queue.history.pop()
        if queue.current_track:
            queue.tracks.insert(0, queue.current_track)
        queue.tracks.insert(0, prev)
        if queue.voice_client:
            queue.voice_client.stop()
        await ctx.send(f"{Emojis.PREVIOUS} Replaying previous track: **{prev.clean_title}**", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

    @commands.command(name="stop", description="Stop music and clear the queue.")
    async def cmd_stop(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        queue.tracks.clear()
        queue.active_radio_station = None
        queue.active_radio_station_info = None
        queue.manual_skip = True
        queue.autoplay = False
        if queue.voice_client:
            queue.voice_client.stop()
        queue.current_track = None
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.delete()
            except Exception:
                pass
            queue.now_playing_message = None
        self.start_inactivity_countdown(queue, delay=60)
        embed = discord.Embed(description=f"{Emojis.DELETE} Stopped playback and cleared the session.", color=BRAND_COLOR)
        await ctx.send(embed=embed, delete_after=10)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 10))

    @commands.command(name="leave", aliases=["dc", "disconnect"], description="Disconnect from voice channel.")
    async def cmd_leave(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if queue.voice_client and queue.voice_client.is_connected():
            if queue.now_playing_message:
                try:
                    await queue.now_playing_message.delete()
                except Exception:
                    pass
                queue.now_playing_message = None
            await queue.voice_client.disconnect(force=True)
            self.service.remove_queue(ctx.guild.id)
            embed = discord.Embed(description=f"{Emojis.DELETE} Left the voice channel and cleared active session.", color=BRAND_COLOR)
            await ctx.send(embed=embed, delete_after=10)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 10))
        else:
            await self.send_error_embed(ctx, description="Not currently connected to voice.", is_warning=True)

    @commands.command(name="queue", aliases=["q"], description="Manage or display the music queue.")
    async def cmd_queue(self, ctx: commands.Context, action: str = "list"):
        queue = self.service.get_queue(ctx.guild.id)
        if action.lower() == "clear":
            count = len(queue.tracks)
            queue.tracks.clear()
            embed = discord.Embed(description=f"{Emojis.APPROVED} Cleared **{count}** track(s) from the upcoming queue.", color=BRAND_COLOR)
            await ctx.send(embed=embed, delete_after=10)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 10))
        else:
            embed = self.build_queue_embed(queue)
            view = QueueLayoutView(self, queue, ctx.author.id)
            await ctx.send(embed=embed, view=view, delete_after=30)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 30))

    @commands.command(name="np", aliases=["nowplaying"], description="Display interactive now playing music card.")
    async def cmd_np(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.current_track:
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True)
            return
        view = NowPlayingLayoutView(queue)
        await ctx.send(view=view, delete_after=30)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 30))

    @commands.command(name="shuffle", description="Randomize upcoming tracks in queue.")
    async def cmd_shuffle(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if len(queue.tracks) < 2:
            await self.send_error_embed(ctx, description="Need at least 2 tracks in queue to shuffle.", is_warning=True)
            return
        random.shuffle(queue.tracks)
        await ctx.send(f"{Emojis.SHUFFLE} Randomized **{len(queue.tracks)}** upcoming tracks!", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

    @commands.command(name="loop", aliases=["repeat"], description="Toggle loop mode (off/track/queue).")
    async def cmd_loop(self, ctx: commands.Context, mode: Optional[str] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if not mode:
            if queue.repeat_mode == "off":
                queue.repeat_mode = "track"
            elif queue.repeat_mode == "track":
                queue.repeat_mode = "queue"
            else:
                queue.repeat_mode = "off"
        else:
            m = mode.lower().strip()
            queue.repeat_mode = m if m in ("off", "track", "queue") else "track"
        await ctx.send(f"{Emojis.REPEAT} Repeat mode set to: **{queue.repeat_mode.upper()}**", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

    @commands.command(name="volume", aliases=["vol"], description="Set audio gain volume (1% to 200%).")
    async def cmd_volume(self, ctx: commands.Context, percent: Optional[int] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if percent is None:
            await ctx.send(f"🔊 Current volume: **{queue.volume}%**", delete_after=5)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 5))
            return
        val = max(1, min(200, percent))
        queue.volume = val
        if queue.voice_client and queue.voice_client.source and hasattr(queue.voice_client.source, "volume"):
            queue.voice_client.source.volume = val / 100.0
        await ctx.send(f"{Emojis.SYNCBOT} Volume adjusted to **{val}%**.", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

    @commands.command(name="autoplay", description="AI-powered personal DJ & continuous song recommendation.")
    async def cmd_autoplay(self, ctx: commands.Context, mode: Optional[str] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if mode:
            m = mode.lower().strip()
            if m in ("on", "true", "enable", "1"):
                queue.autoplay = True
                AutoPlayService.get_instance().trigger_prefetch(queue, self.service)
                await ctx.send(f"{Emojis.AI} AI AutoPlay is now **ENABLED**.", delete_after=5)
            elif m in ("off", "false", "disable", "0"):
                queue.autoplay = False
                queue.prefetched_autoplay_track = None
                queue.prefetched_autoplay_meta = None
                await ctx.send(f"{Emojis.REFUSED} AI AutoPlay is now **DISABLED**.", delete_after=5)
            else:
                queue.autoplay = not queue.autoplay
                if queue.autoplay:
                    AutoPlayService.get_instance().trigger_prefetch(queue, self.service)
                else:
                    queue.prefetched_autoplay_track = None
                    queue.prefetched_autoplay_meta = None
                status = "ENABLED" if queue.autoplay else "DISABLED"
                await ctx.send(f"{Emojis.AI} AI AutoPlay is now **{status}**.", delete_after=5)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 5))
        else:
            view = AutoPlayControlCenterView(self, ctx.author, queue)
            embed = view.build_embed()
            await ctx.send(embed=embed, view=view)

    @commands.command(name="247", aliases=["alwayson"], description="Keep bot in voice channel 24/7.")
    async def cmd_247(self, ctx: commands.Context, mode: Optional[str] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if mode:
            m = mode.lower().strip()
            queue.is_247 = (m in ("on", "true", "enable", "1"))
        else:
            queue.is_247 = not queue.is_247
        if queue.is_247:
            queue.cancel_inactivity()
        status = "ENABLED" if queue.is_247 else "DISABLED"
        await ctx.send(f"{Emojis.SYNCINK_MUSIC} 24/7 Voice Channel Mode is now **{status}**.", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

    @commands.command(name="replay", description="Replay current track from the beginning.")
    async def cmd_replay(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.current_track or not queue.voice_client:
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True)
            return
        curr = queue.current_track
        queue.tracks.insert(0, curr)
        queue.voice_client.stop()
        await ctx.send(f"{Emojis.PREVIOUS} Replaying: **{curr.clean_title}**", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

async def setup(bot: commands.Bot):
    await bot.add_cog(Music(bot))
    log.info("[SyncInk Support] Music & Radio Cog successfully loaded.")
