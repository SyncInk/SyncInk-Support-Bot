import asyncio
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
from utils.emojis import Emojis, EmojiPartials
from utils.logger import log

ERROR_MESSAGE = (
    "### <a:refused:1547035200926654624> Something went wrong while running the command, "
    "please try again or contact server administrator on "
    "https://discord.com/channels/1520457643842342912/1520460764937322566"
)

BRAND_COLOR = 0x7b2cbf  # SyncInk Cyber Violet
BRAND_LOGO_URL = "https://files.catbox.moe/74l9su.png"

def make_error_embed(
    description: str = ERROR_MESSAGE,
    details: Optional[str] = None,
    is_warning: bool = False
) -> discord.Embed:
    icon = Emojis.WARNING if is_warning else Emojis.REFUSED
    color = 0xFEE75C if is_warning else 0xED4245

    formatted_desc = description
    if not (description.startswith("<") or description.startswith(":") or description.startswith("⚠️") or description.startswith("❌") or description.startswith("###")):
        formatted_desc = f"{icon} **{description}**"

    if details:
        formatted_desc += f"\n\n> {details}"

    embed = discord.Embed(
        description=formatted_desc,
        color=color
    )
    embed.set_author(name="SyncInk Platform", icon_url=BRAND_LOGO_URL)
    embed.set_footer(
        text="⏱️ This message will automatically delete in 30 seconds • SyncInk Support",
        icon_url=BRAND_LOGO_URL
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
    if not current:
        embed = discord.Embed(
            description=f"{Emojis.SYNCINK_MUSIC} **Nothing is currently playing.**\nUse `/play` or `/radio` to begin playback.",
            color=BRAND_COLOR,
        )
        embed.set_author(name="SyncInk Radio • Pure Audio", icon_url=BRAND_LOGO_URL)
        return embed

    next_track = queue.tracks[0] if queue.tracks else None
    if next_track:
        up_next = f"**[{next_track.clean_title}]({next_track.url})** by **{next_track.author}** [{next_track.formatted_duration}]"
    elif queue.autoplay:
        up_next = f"{Emojis.RADIO} **Smart Autoplay Recommendation**"
    elif queue.active_radio_station:
        up_next = f"{Emojis.RADIO} **24/7 Continuous Radio Station**"
    else:
        up_next = "End of queue (Add tracks with `/play`)"

    embed = discord.Embed(
        title=f"{current.clean_title[:80]}",
        url=current.url,
        color=BRAND_COLOR,
    )
    embed.set_author(name="SyncInk Radio • Now Playing", icon_url=BRAND_LOGO_URL)

    station_tag = f" • 📻 `{RADIO_STATIONS[queue.active_radio_station]['genre']}`" if queue.active_radio_station and queue.active_radio_station in RADIO_STATIONS else ""
    loop_tag = f" • 🔁 `{queue.repeat_mode.upper()}`" if queue.repeat_mode != "off" else ""

    embed.description = (
        f"{current.platform_emoji} **Artist:** {current.author} [{current.formatted_duration}]\n\n"
        f"{Emojis.TIME} `{queue.get_progress_bar()}`\n\n"
        f"👤 **Requested by:** <@{current.requested_by.id}> • {current.platform.capitalize()}{station_tag}{loop_tag}\n\n"
        f"⏭️ **Up Next:** {up_next}"
    )

    if current.thumbnail and current.thumbnail.startswith("http"):
        embed.set_thumbnail(url=current.thumbnail)

    embed.set_footer(
        text=f"SyncInk Platform • Pure Audio Experience • {queue.size} in queue • Volume: {queue.volume}%",
        icon_url=BRAND_LOGO_URL,
    )
    return embed

class MusicPlayerView(discord.ui.View):
    def __init__(self, music_cog: 'Music', queue: GuildMusicQueue):
        super().__init__(timeout=None)
        self.music_cog = music_cog
        self.queue = queue
        self.update_buttons()

    def update_buttons(self):
        # Update pause/resume button appearance
        is_paused = self.queue.voice_client and self.queue.voice_client.is_paused()
        self.btn_pause_resume.emoji = EmojiPartials.PLAY_BUTTON if is_paused else EmojiPartials.PAUSE_BUTTON
        self.btn_pause_resume.style = discord.ButtonStyle.green if is_paused else discord.ButtonStyle.primary

        # Update repeat button appearance
        if self.queue.repeat_mode == "track":
            self.btn_repeat.style = discord.ButtonStyle.primary
        else:
            self.btn_repeat.style = discord.ButtonStyle.secondary

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if not interaction.user.voice or not interaction.guild.voice_client:
            await self.music_cog.send_error_embed(
                interaction,
                description="You must be in the voice channel to use music controls.",
                is_warning=True,
                delay=30
            )
            return False
        if interaction.user.voice.channel.id != interaction.guild.voice_client.channel.id:
            await self.music_cog.send_error_embed(
                interaction,
                description="You must be in the same voice channel as the bot.",
                is_warning=True,
                delay=30
            )
            return False
        return True

    @discord.ui.button(custom_id="music_prev", emoji=EmojiPartials.PREVIOUS, style=discord.ButtonStyle.secondary, row=0)
    async def btn_prev(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not self.queue.history:
            await self.music_cog.send_error_embed(
                interaction,
                description="No previous track in history.",
                is_warning=True,
                delay=30
            )
            return
        prev_track = self.queue.history.pop()
        if self.queue.current_track:
            self.queue.tracks.insert(0, self.queue.current_track)
        self.queue.tracks.insert(0, prev_track)
        if self.queue.voice_client:
            self.queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.PREVIOUS} Jumped back to previous track: **{prev_track.clean_title}**", ephemeral=True)

    @discord.ui.button(custom_id="music_pause_resume", emoji=EmojiPartials.PAUSE_BUTTON, style=discord.ButtonStyle.primary, row=0)
    async def btn_pause_resume(self, interaction: discord.Interaction, button: discord.ui.Button):
        vc = self.queue.voice_client
        if not vc:
            await self.music_cog.send_error_embed(
                interaction,
                description="Not currently connected to voice.",
                is_warning=True,
                delay=30
            )
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

        self.update_buttons()
        await interaction.response.edit_message(embed=build_now_playing_embed(self.queue), view=self)
        await interaction.followup.send(msg, ephemeral=True)

    @discord.ui.button(custom_id="music_skip", emoji=EmojiPartials.NEXT, style=discord.ButtonStyle.secondary, row=0)
    async def btn_skip(self, interaction: discord.Interaction, button: discord.ui.Button):
        vc = self.queue.voice_client
        if not vc or not self.queue.current_track:
            await self.music_cog.send_error_embed(
                interaction,
                description="Nothing is currently playing.",
                is_warning=True,
                delay=30
            )
            return
        skipped_name = self.queue.current_track.clean_title
        vc.stop()
        await interaction.response.send_message(f"{Emojis.NEXT} Skipped: **{skipped_name}**", ephemeral=True)

    @discord.ui.button(custom_id="music_repeat", emoji=EmojiPartials.REPEAT, style=discord.ButtonStyle.secondary, row=0)
    async def btn_repeat(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.queue.repeat_mode == "off":
            self.queue.repeat_mode = "track"
            label = "Repeating current track"
        elif self.queue.repeat_mode == "track":
            self.queue.repeat_mode = "queue"
            label = "Repeating entire queue"
        else:
            self.queue.repeat_mode = "off"
            label = "Repeat disabled"

        self.update_buttons()
        await interaction.response.edit_message(embed=build_now_playing_embed(self.queue), view=self)
        await interaction.followup.send(f"{Emojis.REPEAT} Mode updated: **{label}**", ephemeral=True)

    @discord.ui.button(custom_id="music_stop", emoji=EmojiPartials.DELETE, style=discord.ButtonStyle.danger, row=0)
    async def btn_stop(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.queue.tracks.clear()
        self.queue.active_radio_station = None
        self.queue.autoplay = False
        if self.queue.voice_client:
            self.queue.voice_client.stop()
        embed = discord.Embed(
            description=f"{Emojis.DELETE} Playback stopped and queue cleared.",
            color=BRAND_COLOR
        )
        embed.set_author(name="SyncInk Radio", icon_url=BRAND_LOGO_URL)
        await interaction.response.send_message(embed=embed)

    @discord.ui.button(custom_id="music_queue", emoji=EmojiPartials.QUEUE, style=discord.ButtonStyle.secondary, row=1)
    async def btn_queue(self, interaction: discord.Interaction, button: discord.ui.Button):
        embed = self.music_cog.build_queue_embed(self.queue)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @discord.ui.button(custom_id="music_shuffle", emoji=EmojiPartials.SHUFFLE, style=discord.ButtonStyle.secondary, row=1)
    async def btn_shuffle(self, interaction: discord.Interaction, button: discord.ui.Button):
        if len(self.queue.tracks) < 2:
            await self.music_cog.send_error_embed(
                interaction,
                description="Need at least 2 tracks in the queue to shuffle.",
                is_warning=True,
                delay=30
            )
            return
        random.shuffle(self.queue.tracks)
        await interaction.response.send_message(f"{Emojis.SHUFFLE} Randomized **{len(self.queue.tracks)}** upcoming tracks!", ephemeral=True)
        if self.queue.now_playing_message:
            try:
                await self.queue.now_playing_message.edit(embed=build_now_playing_embed(self.queue), view=self)
            except Exception:
                pass

    @discord.ui.button(custom_id="music_radio", emoji=EmojiPartials.RADIO, style=discord.ButtonStyle.secondary, row=1)
    async def btn_radio(self, interaction: discord.Interaction, button: discord.ui.Button):
        view = RadioSelectView(self.music_cog, interaction.user)
        await interaction.response.send_message("📻 **Select a 24/7 Radio Station:**", view=view, ephemeral=True)

class RadioSelectView(discord.ui.View):
    def __init__(self, music_cog: 'Music', user: discord.Member):
        super().__init__(timeout=60.0)
        self.music_cog = music_cog
        self.user = user

        options = [
            discord.SelectOption(label="24/7 Lofi & Chill Beats", value="lofi", description="Relaxing study and focus beats", emoji="☕"),
            discord.SelectOption(label="80s Synthwave / Retro Chill", value="synthwave", description="Outrun retro electronic waves", emoji="🌆"),
            discord.SelectOption(label="Smooth Coffee Shop Jazz", value="coffee", description="Acoustic lounge and jazz piano", emoji="🎷"),
            discord.SelectOption(label="Deep Sleep Ambient", value="sleep", description="Calm peaceful sleep soundscapes", emoji="🌙"),
            discord.SelectOption(label="NCS EDM Gaming Radio", value="gaming", description="High-energy electronic gaming tracks", emoji="🎮"),
        ]
        select = discord.ui.Select(placeholder="Tune into a continuous radio station...", options=options)
        select.callback = self.select_callback
        self.add_item(select)

    async def select_callback(self, interaction: discord.Interaction):
        station_id = interaction.data["values"][0]
        await interaction.response.defer(ephemeral=True)
        await self.music_cog.start_radio_for_interaction(interaction, station_id)

class SearchPickerView(discord.ui.View):
    def __init__(self, music_cog: 'Music', user: discord.Member, tracks: list[Track]):
        super().__init__(timeout=45.0)
        self.music_cog = music_cog
        self.user = user
        self.tracks = tracks

        for i in range(min(5, len(tracks))):
            btn = discord.ui.Button(
                label=f"{i + 1}",
                style=discord.ButtonStyle.primary,
                custom_id=f"search_pick_{i}"
            )
            btn.callback = self.make_callback(i)
            self.add_item(btn)

        cancel_btn = discord.ui.Button(label="Cancel", style=discord.ButtonStyle.danger, custom_id="search_cancel", emoji=EmojiPartials.REFUSED)
        cancel_btn.callback = self.cancel_callback
        self.add_item(cancel_btn)

    def make_callback(self, index: int):
        async def _callback(interaction: discord.Interaction):
            if interaction.user.id != self.user.id:
                await self.music_cog.send_error_embed(
                    interaction,
                    description="Only the search requester can select tracks.",
                    is_warning=True,
                    delay=30
                )
                return
            selected = self.tracks[index]
            self.stop()
            await interaction.response.defer()
            await self.music_cog.enqueue_and_play(interaction, [selected])
        return _callback

    async def cancel_callback(self, interaction: discord.Interaction):
        if interaction.user.id != self.user.id:
            await self.music_cog.send_error_embed(
                interaction,
                description="Only the search requester can cancel this search.",
                is_warning=True,
                delay=30
            )
            return
        self.stop()
        embed = discord.Embed(description=f"{Emojis.REFUSED} Search menu closed.", color=BRAND_COLOR)
        await interaction.response.edit_message(embed=embed, view=None)

class Music(commands.Cog):
    """High-fidelity Discord Radio & Music Playback System."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.service = MusicService.get_instance()

    async def _repair_davey(self) -> bool:
        """Loads DAVE compatibility shim or native davey library without requiring compiler."""
        try:
            import utils.davey_shim
            utils.davey_shim.ensure_davey_loaded()
            return True
        except Exception as repair_err:
            log.warning(f"[Voice Engine] davey shim load note: {repair_err}")
            return False

    async def _ensure_voice_dependencies(self):
        """Ensures davey / DAVE voice libraries are active before attempting connection."""
        try:
            import discord.voice_client
            if getattr(discord.voice_client, "has_dave", False):
                return
            import utils.davey_shim
            utils.davey_shim.ensure_davey_loaded()
        except Exception:
            await self._repair_davey()

    async def send_error_embed(
        self,
        target: Union[discord.Interaction, commands.Context, discord.abc.Messageable],
        description: str,
        details: Optional[str] = None,
        delay: int = 30,
        is_warning: bool = False,
    ) -> Optional[discord.Message]:
        """Sends a standardized error embed and schedules its automatic deletion after delay seconds."""
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
                if sent_msg:
                    asyncio.create_task(_delayed_delete_msg(sent_msg, delay))
            elif isinstance(target, commands.Context):
                sent_msg = await target.send(embed=embed, delete_after=delay)
                if target.message:
                    asyncio.create_task(_delayed_delete_msg(target.message, delay))
            elif hasattr(target, "send"):
                sent_msg = await target.send(embed=embed, delete_after=delay)
        except Exception as e:
            log.error(f"[send_error_embed Error] {e}")

        return sent_msg

    async def cog_app_command_error(self, interaction: discord.Interaction, error: app_commands.AppCommandError):
        orig = getattr(error, "original", error)
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

    async def ensure_voice(self, interaction: discord.Interaction) -> Optional[discord.VoiceClient]:
        member = interaction.user
        if not isinstance(member, discord.Member):
            member = interaction.guild.get_member(interaction.user.id) or interaction.user

        if not hasattr(member, "voice") or not member.voice or not member.voice.channel:
            await self.send_error_embed(
                interaction,
                description="You must be in a voice channel first! Please join a voice channel and try again.",
                is_warning=True,
                delay=30
            )
            return None

        channel = member.voice.channel
        permissions = channel.permissions_for(interaction.guild.me)
        if not permissions.connect or not permissions.speak:
            await self.send_error_embed(
                interaction,
                description=f"I do not have permission to connect or speak in {channel.mention}.",
                delay=30
            )
            return None

        await self._ensure_voice_dependencies()

        vc = interaction.guild.voice_client
        try:
            if not vc or not vc.is_connected():
                if vc:
                    try:
                        await vc.disconnect(force=True)
                    except Exception:
                        pass
                vc = await channel.connect(self_deaf=True, timeout=15.0, reconnect=True)
            elif vc.channel.id != channel.id:
                await vc.move_to(channel)
        except Exception as e:
            log.error(f"[Voice Connect Error] {e}")
            err_str = str(e)
            if "davey" in err_str:
                repaired = await self._repair_davey()
                if repaired:
                    try:
                        return await channel.connect(self_deaf=True, timeout=15.0, reconnect=True)
                    except Exception as retry_err:
                        log.error(f"[Voice Retry Connect Error] {retry_err}")
                        err_str = str(retry_err)

            if "PyNaCl" in err_str:
                res = "PyNaCl audio encryption library is missing.\nPlease type `?fixmusic` in chat or run `pkg install python-pynacl` in Termux."
            elif "davey" in err_str:
                res = "Voice DAVE compatibility shim loaded. Please retry running the command now."
            else:
                res = "Please check voice permissions, region connection, or try again in a few moments."

            await self.send_error_embed(
                interaction,
                description=f"Voice connection failed: `{e}`",
                details=res,
                delay=30
            )
            return None

        return vc

    def build_queue_embed(self, queue: GuildMusicQueue) -> discord.Embed:
        embed = discord.Embed(title="📜 Music Queue", color=BRAND_COLOR)
        embed.set_author(name="SyncInk Radio • Queue", icon_url=BRAND_LOGO_URL)

        current = queue.current_track
        desc = ""
        if current:
            desc += f"▶ **Now Playing:**\n[{current.clean_title}]({current.url})  •  `{current.formatted_duration}`  •  *{current.author}*\n\n"
        else:
            desc += f"{Emojis.WARNING} Queue is currently empty.\n\n"

        if queue.tracks:
            lines = []
            for i, t in enumerate(queue.tracks[:10]):
                lines.append(f"**{i + 1}.** [{t.clean_title}]({t.url})  •  `{t.formatted_duration}`  •  *{t.author}*")
            desc += f"**Up Next ({queue.size} total):**\n" + "\n".join(lines)
            if queue.size > 10:
                desc += f"\n*...and {queue.size - 10} more track(s)*"
        else:
            desc += "No upcoming tracks in queue."

        embed.description = desc
        embed.set_footer(text=f"SyncInk Platform • Volume: {queue.volume}% • 24/7: {'On' if queue.is_247 else 'Off'}")
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

            view = MusicPlayerView(self, queue)
            embed = build_now_playing_embed(queue)
            if interaction.response.is_done():
                msg = await interaction.followup.send(embed=embed, view=view)
            else:
                msg = await interaction.response.send_message(embed=embed, view=view)
            queue.now_playing_message = msg
        else:
            queue.tracks.extend(tracks)
            added_track = tracks[0]
            embed = discord.Embed(title="➕ Track Added to Queue", color=BRAND_COLOR)
            embed.set_author(name="SyncInk Radio", icon_url=BRAND_LOGO_URL)
            embed.description = (
                f"{Emojis.QUEUE_ADD} **[{added_track.clean_title}]({added_track.url})**\n\n"
                f"• **Position in Queue:** `#{queue.size}`\n"
                f"• **Artist:** {added_track.author}\n"
                f"• **Duration:** `{added_track.formatted_duration}`\n"
                f"• **Requested by:** <@{interaction.user.id}> • {added_track.platform.capitalize()}\n\n"
                f"▶ **Currently Playing:** **{queue.current_track.clean_title if queue.current_track else 'None'}**"
            )
            if added_track.thumbnail:
                embed.set_thumbnail(url=added_track.thumbnail)
            embed.set_footer(text=f"SyncInk Platform • {queue.size} track(s) waiting")

            if interaction.response.is_done():
                await interaction.followup.send(embed=embed)
            else:
                await interaction.response.send_message(embed=embed)

    async def play_track(self, queue: GuildMusicQueue, track: Track):
        queue.current_track = track
        queue.start_time = time.time()
        queue.paused_at = None
        queue.total_paused_duration = 0.0

        try:
            audio_source = self.service.create_audio_source(track, volume=queue.volume)
        except Exception as src_err:
            log.error(f"[Audio Source Error] {src_err}")
            if queue.text_channel:
                await self.send_error_embed(
                    queue.text_channel,
                    description=f"Audio Decoder Error: `{src_err}`",
                    details="The audio stream could not be loaded or decoded.",
                    delay=30
                )
            await self.advance_queue(queue)
            return

        def _after_playback(error):
            if error:
                log.error(f"[Audio Playback Error] {error}")
            asyncio.run_coroutine_threadsafe(self.advance_queue(queue), self.bot.loop)

        if queue.voice_client:
            try:
                if queue.voice_client.is_playing() or queue.voice_client.is_paused():
                    queue.voice_client.stop()
                queue.voice_client.play(audio_source, after=_after_playback)
            except Exception as play_err:
                log.error(f"[Playback Play Error] {play_err}")
                if queue.text_channel:
                    await self.send_error_embed(
                        queue.text_channel,
                        description=f"Playback Start Error: `{play_err}`",
                        details="Could not stream audio to voice channel.",
                        delay=30
                    )

    async def advance_queue(self, queue: GuildMusicQueue):
        if queue.repeat_mode == "track" and queue.current_track:
            next_track = queue.current_track
        elif queue.repeat_mode == "queue" and queue.current_track:
            queue.history.append(queue.current_track)
            queue.tracks.append(queue.current_track)
            next_track = queue.tracks.pop(0) if queue.tracks else None
        else:
            if queue.current_track:
                queue.history.append(queue.current_track)
            next_track = queue.tracks.pop(0) if queue.tracks else None

        if next_track:
            await self.play_track(queue, next_track)
            if queue.text_channel:
                view = MusicPlayerView(self, queue)
                embed = build_now_playing_embed(queue)
                try:
                    queue.now_playing_message = await queue.text_channel.send(embed=embed, view=view)
                except Exception as e:
                    log.warning(f"Failed to send Now Playing embed: {e}")
            return

        # Queue is empty - Check 24/7 radio or Autoplay
        if queue.active_radio_station:
            station = RADIO_STATIONS.get(queue.active_radio_station)
            if station:
                query = random.choice(station["queries"])
                tracks = await self.service.search_and_extract(query, queue.current_track.requested_by, platform="radio", limit=5)
                chosen = tracks[0]
                for t in tracks:
                    if t.url not in queue.radio_recent_urls:
                        chosen = t
                        break
                chosen.is_radio = True
                chosen.radio_station_id = queue.active_radio_station
                queue.radio_recent_urls.append(chosen.url)
                await self.play_track(queue, chosen)
                if queue.text_channel:
                    view = MusicPlayerView(self, queue)
                    queue.now_playing_message = await queue.text_channel.send(embed=build_now_playing_embed(queue), view=view)
                return

        if queue.autoplay and queue.history:
            last = queue.history[-1]
            rec_query = f"{last.author} {last.clean_title} related song"
            rec_tracks = await self.service.search_and_extract(rec_query, last.requested_by, limit=3)
            if rec_tracks:
                await self.play_track(queue, rec_tracks[0])
                if queue.text_channel:
                    view = MusicPlayerView(self, queue)
                    queue.now_playing_message = await queue.text_channel.send(embed=build_now_playing_embed(queue), view=view)
                return

        # End of queue reached
        queue.current_track = None
        if queue.text_channel:
            embed_finished = discord.Embed(
                description="### Reached the end of the queue. Please queue some track(s) again!",
                color=BRAND_COLOR
            )
            embed_finished.set_author(name="SyncInk Radio • Queue Complete", icon_url=BRAND_LOGO_URL)
            await queue.text_channel.send(embed=embed_finished)

        # Inactivity countdown (leave VC after 60s if not in 24/7 mode)
        if not queue.is_247:
            queue.cancel_inactivity()
            queue.inactivity_task = asyncio.create_task(self._inactivity_countdown(queue.guild_id))

    async def _inactivity_countdown(self, guild_id: int):
        await asyncio.sleep(60)
        queue = self.service.get_queue(guild_id)
        if not queue.tracks and queue.current_track is None and not queue.is_247:
            vc = queue.voice_client
            if vc and vc.is_connected():
                await vc.disconnect(force=True)
                if queue.text_channel:
                    embed_leave = discord.Embed(
                        description="### Left the voice channel due to empty queue",
                        color=0xED4245
                    )
                    embed_leave.set_author(name="SyncInk Radio", icon_url=BRAND_LOGO_URL)
                    await queue.text_channel.send(embed=embed_leave)
            self.service.remove_queue(guild_id)

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

        view = MusicPlayerView(self, queue)
        embed = build_now_playing_embed(queue)
        msg = await interaction.followup.send(embed=embed, view=view)
        queue.now_playing_message = msg

    async def ensure_voice_ctx(self, ctx: commands.Context) -> Optional[discord.VoiceClient]:
        if not ctx.author.voice or not ctx.author.voice.channel:
            await self.send_error_embed(
                ctx,
                description="Please join a voice channel first, then try again.",
                is_warning=True,
                delay=30
            )
            return None

        channel = ctx.author.voice.channel
        permissions = channel.permissions_for(ctx.guild.me)
        if not permissions.connect or not permissions.speak:
            await self.send_error_embed(
                ctx,
                description=f"I do not have permission to connect or speak in {channel.mention}.",
                delay=30
            )
            return None

        await self._ensure_voice_dependencies()

        vc = ctx.guild.voice_client
        try:
            if not vc or not vc.is_connected():
                if vc:
                    try:
                        await vc.disconnect(force=True)
                    except Exception:
                        pass
                vc = await channel.connect(self_deaf=True, timeout=15.0, reconnect=True)
            elif vc.channel.id != channel.id:
                await vc.move_to(channel)
        except Exception as e:
            log.error(f"[Voice Connect Error] {e}")
            err_str = str(e)
            if "davey" in err_str:
                repaired = await self._repair_davey()
                if repaired:
                    try:
                        return await channel.connect(self_deaf=True, timeout=15.0, reconnect=True)
                    except Exception as retry_err:
                        log.error(f"[Voice Retry Connect Error] {retry_err}")
                        err_str = str(retry_err)

            if "PyNaCl" in err_str:
                res = "PyNaCl audio encryption library is missing.\nPlease type `?fixmusic` in chat or run `pkg install python-pynacl` in Termux."
            elif "davey" in err_str:
                res = "Voice DAVE compatibility shim loaded. Please retry running the command now."
            else:
                res = "Please check voice permissions, region connection, or try again in a few moments."

            await self.send_error_embed(
                ctx,
                description=f"Voice connection failed: `{e}`",
                details=res,
                delay=30
            )
            return None

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

            view = MusicPlayerView(self, queue)
            embed = build_now_playing_embed(queue)
            msg = await ctx.send(embed=embed, view=view)
            queue.now_playing_message = msg
        else:
            queue.tracks.extend(tracks)
            added_track = tracks[0]
            embed = discord.Embed(title="➕ Track Added to Queue", color=BRAND_COLOR)
            embed.set_author(name="SyncInk Radio", icon_url=BRAND_LOGO_URL)
            embed.description = (
                f"{Emojis.QUEUE_ADD} **[{added_track.clean_title}]({added_track.url})**\n\n"
                f"• **Position in Queue:** `#{queue.size}`\n"
                f"• **Artist:** {added_track.author}\n"
                f"• **Duration:** `{added_track.formatted_duration}`\n"
                f"• **Requested by:** <@{ctx.author.id}> • {added_track.platform.capitalize()}\n\n"
                f"▶ **Currently Playing:** **{queue.current_track.clean_title if queue.current_track else 'None'}**"
            )
            if added_track.thumbnail:
                embed.set_thumbnail(url=added_track.thumbnail)
            embed.set_footer(text=f"SyncInk Platform • {queue.size} track(s) waiting")
            await ctx.send(embed=embed)

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
        view = MusicPlayerView(self, queue)
        embed = build_now_playing_embed(queue)
        msg = await ctx.send(embed=embed, view=view)
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
            await self.send_error_embed(interaction, description=f"No tracks found for: **{query}**", delay=30)
            return

        # 4. Play
        try:
            await self.enqueue_and_play(interaction, tracks)
        except Exception as e:
            log.error(f"[Enqueue Error] {e}")
            await self.send_error_embed(interaction, description=f"Could not start playback: `{e}`", delay=30)

    @app_commands.command(name="radio", description="Tune into endless 24/7 curated audio stations.")
    @app_commands.describe(station="Choose your radio vibe")
    async def slash_radio(self, interaction: discord.Interaction, station: Literal["lofi", "synthwave", "coffee", "sleep", "gaming"] = "lofi"):
        await interaction.response.defer()
        await self.start_radio_for_interaction(interaction, station)

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
            tracks = await self.service.search_and_extract(query, interaction.user, platform=platform, limit=5)
        except Exception as e:
            log.error(f"[Music Search Error] {e}")
            await self.send_error_embed(interaction, description=f"Search failed: `{e}`", delay=30)
            return

        if not tracks:
            await self.send_error_embed(interaction, description=f"No results found for **{query}**.", delay=30)
            return

        embed = discord.Embed(title="🔍 Search Results", color=BRAND_COLOR)
        embed.set_author(name="SyncInk Radio", icon_url=BRAND_LOGO_URL)
        lines = []
        for i, t in enumerate(tracks):
            lines.append(f"**{i + 1}.** [{t.clean_title}]({t.url})\n{Emojis.TIME} `{t.formatted_duration}`  •  *{t.author}*")
        embed.description = f"Query: **{query}**\n\n" + "\n\n".join(lines)
        embed.set_footer(text="Click a numbered button below to queue your track, or Cancel.")

        view = SearchPickerView(self, interaction.user, tracks)
        await interaction.followup.send(embed=embed, view=view)

    @app_commands.command(name="pause", description="Pause active music playback.")
    async def slash_pause(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.voice_client or not queue.voice_client.is_playing():
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True, delay=30)
            return
        queue.voice_client.pause()
        queue.paused_at = time.time()
        await interaction.response.send_message(f"{Emojis.PAUSE_BUTTON} Playback paused. Resume anytime with `/resume`.")
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.edit(embed=build_now_playing_embed(queue), view=MusicPlayerView(self, queue))
            except Exception:
                pass

    @app_commands.command(name="resume", description="Resume paused music playback.")
    async def slash_resume(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.voice_client or not queue.voice_client.is_paused():
            await self.send_error_embed(interaction, description="Playback is not paused.", is_warning=True, delay=30)
            return
        queue.voice_client.resume()
        if queue.paused_at is not None:
            queue.total_paused_duration += (time.time() - queue.paused_at)
            queue.paused_at = None
        await interaction.response.send_message(f"{Emojis.PLAY_BUTTON} Playback resumed.")
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.edit(embed=build_now_playing_embed(queue), view=MusicPlayerView(self, queue))
            except Exception:
                pass

    @app_commands.command(name="skip", description="Skip current track forward.")
    @app_commands.describe(count="Number of tracks to skip")
    async def slash_skip(self, interaction: discord.Interaction, count: int = 1):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.voice_client or not queue.current_track:
            await self.send_error_embed(interaction, description="Nothing is currently playing to skip.", is_warning=True, delay=30)
            return
        to_drop = max(0, count - 1)
        for _ in range(min(to_drop, len(queue.tracks))):
            queue.tracks.pop(0)
        skipped = queue.current_track.clean_title
        queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.NEXT} Skipped: **{skipped}**")

    @app_commands.command(name="previous", description="Replay the previous track in history.")
    async def slash_previous(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.history:
            await self.send_error_embed(interaction, description="No history available.", is_warning=True, delay=30)
            return
        prev = queue.history.pop()
        if queue.current_track:
            queue.tracks.insert(0, queue.current_track)
        queue.tracks.insert(0, prev)
        if queue.voice_client:
            queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.PREVIOUS} Replaying previous track: **{prev.clean_title}**")

    @app_commands.command(name="stop", description="Stop music and clear the queue.")
    async def slash_stop(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        queue.tracks.clear()
        queue.active_radio_station = None
        queue.autoplay = False
        if queue.voice_client:
            queue.voice_client.stop()
        embed = discord.Embed(description=f"{Emojis.DELETE} Stopped playback and cleared the session.", color=BRAND_COLOR)
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="leave", description="Disconnect from voice channel.")
    async def slash_leave(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if queue.voice_client and queue.voice_client.is_connected():
            await queue.voice_client.disconnect(force=True)
            self.service.remove_queue(interaction.guild_id)
            embed = discord.Embed(description=f"{Emojis.DELETE} Left the voice channel and cleared active session.", color=BRAND_COLOR)
            await interaction.response.send_message(embed=embed)
        else:
            await self.send_error_embed(interaction, description="Not currently connected to voice.", is_warning=True, delay=30)

    @app_commands.command(name="queue", description="Manage or display the music queue.")
    @app_commands.describe(action="View or clear the upcoming queue")
    async def slash_queue(self, interaction: discord.Interaction, action: Literal["list", "clear"] = "list"):
        queue = self.service.get_queue(interaction.guild_id)
        if action == "clear":
            count = len(queue.tracks)
            queue.tracks.clear()
            embed = discord.Embed(description=f"{Emojis.APPROVED} Cleared **{count}** track(s) from the upcoming queue.", color=BRAND_COLOR)
            await interaction.response.send_message(embed=embed)
        else:
            embed = self.build_queue_embed(queue)
            await interaction.response.send_message(embed=embed)

    @app_commands.command(name="np", description="Display the interactive now playing music card.")
    async def slash_np(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.current_track:
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True, delay=30)
            return
        embed = build_now_playing_embed(queue)
        view = MusicPlayerView(self, queue)
        await interaction.response.send_message(embed=embed, view=view)

    @app_commands.command(name="shuffle", description="Randomize upcoming tracks in queue.")
    async def slash_shuffle(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if len(queue.tracks) < 2:
            await self.send_error_embed(interaction, description="Need at least 2 tracks in queue to shuffle.", is_warning=True, delay=30)
            return
        random.shuffle(queue.tracks)
        await interaction.response.send_message(f"{Emojis.SHUFFLE} Randomized **{len(queue.tracks)}** upcoming tracks!")

    @app_commands.command(name="loop", description="Toggle loop mode.")
    @app_commands.describe(mode="Repeat mode")
    async def slash_loop(self, interaction: discord.Interaction, mode: Literal["off", "track", "queue"]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.repeat_mode = mode
        await interaction.response.send_message(f"{Emojis.REPEAT} Repeat mode set to: **{mode.upper()}**")

    @app_commands.command(name="volume", description="Set audio gain volume (1% to 200%).")
    @app_commands.describe(percent="Volume percentage")
    async def slash_volume(self, interaction: discord.Interaction, percent: int):
        val = max(1, min(200, percent))
        queue = self.service.get_queue(interaction.guild_id)
        queue.volume = val
        if queue.voice_client and queue.voice_client.source and hasattr(queue.voice_client.source, "volume"):
            queue.voice_client.source.volume = val / 100.0
        await interaction.response.send_message(f"{Emojis.SYNCBOT} Volume adjusted to **{val}%**.")

    @app_commands.command(name="autoplay", description="Endless related song recommendation.")
    @app_commands.describe(mode="Enable or disable smart autoplay")
    async def slash_autoplay(self, interaction: discord.Interaction, mode: Literal["on", "off"]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.autoplay = (mode == "on")
        status = "ENABLED" if queue.autoplay else "DISABLED"
        await interaction.response.send_message(f"{Emojis.RADIO} Autoplay is now **{status}**.")

    @app_commands.command(name="247", description="Keep bot in voice channel 24/7.")
    @app_commands.describe(mode="Enable or disable 24/7 mode")
    async def slash_247(self, interaction: discord.Interaction, mode: Literal["on", "off"]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.is_247 = (mode == "on")
        if queue.is_247:
            queue.cancel_inactivity()
        status = "ENABLED" if queue.is_247 else "DISABLED"
        await interaction.response.send_message(f"{Emojis.SYNCINK_MUSIC} 24/7 Voice Channel Mode is now **{status}**.")

    @app_commands.command(name="replay", description="Replay current track from the beginning.")
    async def slash_replay(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.current_track or not queue.voice_client:
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True, delay=30)
            return
        curr = queue.current_track
        queue.tracks.insert(0, curr)
        queue.voice_client.stop()
        await interaction.response.send_message(f"{Emojis.PREVIOUS} Replaying: **{curr.clean_title}**")

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
                is_warning=True,
                delay=30
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
            await self.send_error_embed(ctx, description=f"No tracks found for: **{query}**", delay=30)
            return

        try:
            await self.enqueue_and_play_ctx(ctx, tracks)
        except Exception as e:
            await self.send_error_embed(ctx, description=f"Could not begin playback: `{e}`", delay=30)

    @commands.command(name="radio", description="Tune into endless 24/7 curated audio stations.")
    async def cmd_radio(self, ctx: commands.Context, station: Optional[str] = None):
        if not station:
            view = RadioSelectView(self, ctx.author)
            await ctx.send("📻 **Select a 24/7 Radio Station:**", view=view)
            return
        st = station.lower().strip()
        if st not in RADIO_STATIONS:
            stations_list = ", ".join(f"`{k}`" for k in RADIO_STATIONS.keys())
            await self.send_error_embed(
                ctx,
                description=f"Unknown station `{station}`.",
                details=f"Available stations: {stations_list}",
                is_warning=True,
                delay=30
            )
            return
        await self.start_radio_for_ctx(ctx, st)

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
            tracks = await self.service.search_and_extract(query, ctx.author, platform="auto", limit=5)
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
            await self.send_error_embed(ctx, description=f"No results found for **{query}**.", delay=30)
            return

        embed = discord.Embed(title="🔍 Search Results", color=BRAND_COLOR)
        embed.set_author(name="SyncInk Radio", icon_url=BRAND_LOGO_URL)
        lines = []
        for i, t in enumerate(tracks):
            lines.append(f"**{i + 1}.** [{t.clean_title}]({t.url})\n{Emojis.TIME} `{t.formatted_duration}`  •  *{t.author}*")
        embed.description = f"Query: **{query}**\n\n" + "\n\n".join(lines)
        embed.set_footer(text="Click a numbered button below to queue your track, or Cancel.")

        view = SearchPickerView(self, ctx.author, tracks)
        await ctx.send(embed=embed, view=view)

    @commands.command(name="pause", description="Pause active music playback.")
    async def cmd_pause(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.voice_client or not queue.voice_client.is_playing():
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True, delay=30)
            return
        queue.voice_client.pause()
        queue.paused_at = time.time()
        await ctx.send(f"{Emojis.PAUSE_BUTTON} Playback paused. Resume anytime with `?resume`.")
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.edit(embed=build_now_playing_embed(queue), view=MusicPlayerView(self, queue))
            except Exception:
                pass

    @commands.command(name="resume", description="Resume paused music playback.")
    async def cmd_resume(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.voice_client or not queue.voice_client.is_paused():
            await self.send_error_embed(ctx, description="Playback is not paused.", is_warning=True, delay=30)
            return
        queue.voice_client.resume()
        if queue.paused_at is not None:
            queue.total_paused_duration += (time.time() - queue.paused_at)
            queue.paused_at = None
        await ctx.send(f"{Emojis.PLAY_BUTTON} Playback resumed.")
        if queue.now_playing_message:
            try:
                await queue.now_playing_message.edit(embed=build_now_playing_embed(queue), view=MusicPlayerView(self, queue))
            except Exception:
                pass

    @commands.command(name="skip", aliases=["s", "next"], description="Skip current track forward.")
    async def cmd_skip(self, ctx: commands.Context, count: int = 1):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.voice_client or not queue.current_track:
            await self.send_error_embed(ctx, description="Nothing is currently playing to skip.", is_warning=True, delay=30)
            return
        to_drop = max(0, count - 1)
        for _ in range(min(to_drop, len(queue.tracks))):
            queue.tracks.pop(0)
        skipped = queue.current_track.clean_title
        queue.voice_client.stop()
        await ctx.send(f"{Emojis.NEXT} Skipped: **{skipped}**")

    @commands.command(name="previous", aliases=["prev"], description="Replay previous track in history.")
    async def cmd_previous(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.history:
            await self.send_error_embed(ctx, description="No history available.", is_warning=True, delay=30)
            return
        prev = queue.history.pop()
        if queue.current_track:
            queue.tracks.insert(0, queue.current_track)
        queue.tracks.insert(0, prev)
        if queue.voice_client:
            queue.voice_client.stop()
        await ctx.send(f"{Emojis.PREVIOUS} Replaying previous track: **{prev.clean_title}**")

    @commands.command(name="stop", description="Stop music and clear the queue.")
    async def cmd_stop(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        queue.tracks.clear()
        queue.active_radio_station = None
        queue.autoplay = False
        if queue.voice_client:
            queue.voice_client.stop()
        embed = discord.Embed(description=f"{Emojis.DELETE} Stopped playback and cleared the session.", color=BRAND_COLOR)
        await ctx.send(embed=embed)

    @commands.command(name="leave", aliases=["dc", "disconnect"], description="Disconnect from voice channel.")
    async def cmd_leave(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if queue.voice_client and queue.voice_client.is_connected():
            await queue.voice_client.disconnect(force=True)
            self.service.remove_queue(ctx.guild.id)
            embed = discord.Embed(description=f"{Emojis.DELETE} Left the voice channel and cleared active session.", color=BRAND_COLOR)
            await ctx.send(embed=embed)
        else:
            await self.send_error_embed(ctx, description="Not currently connected to voice.", is_warning=True, delay=30)

    @commands.command(name="queue", aliases=["q"], description="Manage or display the music queue.")
    async def cmd_queue(self, ctx: commands.Context, action: str = "list"):
        queue = self.service.get_queue(ctx.guild.id)
        if action.lower() == "clear":
            count = len(queue.tracks)
            queue.tracks.clear()
            embed = discord.Embed(description=f"{Emojis.APPROVED} Cleared **{count}** track(s) from the upcoming queue.", color=BRAND_COLOR)
            await ctx.send(embed=embed)
        else:
            embed = self.build_queue_embed(queue)
            await ctx.send(embed=embed)

    @commands.command(name="np", aliases=["nowplaying"], description="Display interactive now playing music card.")
    async def cmd_np(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.current_track:
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True, delay=30)
            return
        embed = build_now_playing_embed(queue)
        view = MusicPlayerView(self, queue)
        await ctx.send(embed=embed, view=view)

    @commands.command(name="shuffle", description="Randomize upcoming tracks in queue.")
    async def cmd_shuffle(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if len(queue.tracks) < 2:
            await self.send_error_embed(ctx, description="Need at least 2 tracks in queue to shuffle.", is_warning=True, delay=30)
            return
        random.shuffle(queue.tracks)
        await ctx.send(f"{Emojis.SHUFFLE} Randomized **{len(queue.tracks)}** upcoming tracks!")

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
        await ctx.send(f"{Emojis.REPEAT} Repeat mode set to: **{queue.repeat_mode.upper()}**")

    @commands.command(name="volume", aliases=["vol"], description="Set audio gain volume (1% to 200%).")
    async def cmd_volume(self, ctx: commands.Context, percent: Optional[int] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if percent is None:
            await ctx.send(f"🔊 Current volume: **{queue.volume}%**")
            return
        val = max(1, min(200, percent))
        queue.volume = val
        if queue.voice_client and queue.voice_client.source and hasattr(queue.voice_client.source, "volume"):
            queue.voice_client.source.volume = val / 100.0
        await ctx.send(f"{Emojis.SYNCBOT} Volume adjusted to **{val}%**.")

    @commands.command(name="autoplay", description="Endless related song recommendation.")
    async def cmd_autoplay(self, ctx: commands.Context, mode: Optional[str] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if mode:
            m = mode.lower().strip()
            queue.autoplay = (m in ("on", "true", "enable", "1"))
        else:
            queue.autoplay = not queue.autoplay
        status = "ENABLED" if queue.autoplay else "DISABLED"
        await ctx.send(f"{Emojis.RADIO} Autoplay is now **{status}**.")

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
        await ctx.send(f"{Emojis.SYNCINK_MUSIC} 24/7 Voice Channel Mode is now **{status}**.")

    @commands.command(name="replay", description="Replay current track from the beginning.")
    async def cmd_replay(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.current_track or not queue.voice_client:
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True, delay=30)
            return
        curr = queue.current_track
        queue.tracks.insert(0, curr)
        queue.voice_client.stop()
        await ctx.send(f"{Emojis.PREVIOUS} Replaying: **{curr.clean_title}**")

async def setup(bot: commands.Bot):
    await bot.add_cog(Music(bot))
    log.info("[SyncInk Support] Music & Radio Cog successfully loaded.")
