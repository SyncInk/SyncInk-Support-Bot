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

MUSIC_BOOSTER_ROLE_ID = int(os.getenv("MUSIC_BOOSTER_ROLE_ID", "1558584451724738640"))
MUSIC_COMMAND_CHANNEL_ID = int(os.getenv("MUSIC_COMMAND_CHANNEL_ID", "1520749466330857492"))

def make_error_embed(
    description: str = ERROR_MESSAGE,
    details: Optional[str] = None,
    is_warning: bool = False
) -> discord.Embed:
    icon = Emojis.WARNING if is_warning else Emojis.REFUSED
    color = 0xFEE75C if is_warning else 0xED4245

    is_raw_header = description.strip().startswith("###")

    formatted_desc = description
    if not (description.startswith("<") or description.startswith(":") or description.startswith("⚠️") or description.startswith("❌") or is_raw_header):
        formatted_desc = f"{icon} **{description}**"

    if details:
        formatted_desc += f"\n\n> {details}"

    embed = discord.Embed(
        description=formatted_desc,
        color=color
    )
    if not is_raw_header:
        embed.set_footer(
            text="SyncInk Platform",
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
        up_next = f"{Emojis.RADIO} **Smart Autoplay Recommendation**"
    elif queue.active_radio_station:
        up_next = f"{Emojis.RADIO} **24/7 Continuous Radio Station**"
    else:
        up_next = "End of queue (Add tracks with `/play`)"

    station_tag = f"  •  📻 `{RADIO_STATIONS[queue.active_radio_station]['genre']}`" if queue.active_radio_station and queue.active_radio_station in RADIO_STATIONS else ""
    loop_tag = f"  •  🔁 `{queue.repeat_mode.upper()}`" if queue.repeat_mode != "off" else ""

    embed = discord.Embed(
        color=BRAND_COLOR,
    )

    embed.description = (
        f"### {Emojis.SYNCINK_MUSIC} Now Playing\n"
        f"[{current.clean_title}]({current.url})\n\n"
        f"{current.platform_emoji} **Artist:** {current.author}  •  `{current.formatted_duration}`\n\n"
        f"{separator}\n\n"
        f"{Emojis.TIME} `{queue.get_progress_bar()}`\n\n"
        f"{separator}\n\n"
        f"👤 **Requested by:** <@{current.requested_by.id if current.requested_by else 1520522990280769727}>{station_tag}{loop_tag}\n\n"
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
        title_text = f"### ▶ Now Playing\n[{current.clean_title}]({current.url}) by **{current.author}** `[{current.formatted_duration}]`"
        text_disp = discord.ui.TextDisplay(title_text)
        thumb_url = current.thumbnail if (current.thumbnail and current.thumbnail.startswith("http")) else BRAND_LOGO_URL
        sec = discord.ui.Section(text_disp, accessory=discord.ui.Thumbnail(thumb_url))

        # 2. Controls Action Row
        is_paused = bool(self.queue.voice_client and self.queue.voice_client.is_paused())
        self.btn_pause_resume = discord.ui.Button(
            emoji=EmojiPartials.PLAY_BUTTON if is_paused else EmojiPartials.PAUSE_BUTTON,
            style=discord.ButtonStyle.primary if is_paused else discord.ButtonStyle.success,
            custom_id="m_pause_resume"
        )
        self.btn_pause_resume.callback = self.on_pause_resume

        self.btn_prev = discord.ui.Button(
            emoji=EmojiPartials.PREVIOUS,
            style=discord.ButtonStyle.primary,
            custom_id="m_prev"
        )
        self.btn_prev.callback = self.on_prev

        self.btn_skip = discord.ui.Button(
            emoji=EmojiPartials.NEXT,
            style=discord.ButtonStyle.primary,
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

        # 3. Separator component
        sep = discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small)

        # 4. Requester footer
        req_id = current.requested_by.id if (current.requested_by and hasattr(current.requested_by, "id")) else 1520522990280769727
        footer = discord.ui.TextDisplay(f"-# Track requested by <@{req_id}>")

        cnt = discord.ui.Container(sec, row, sep, footer, accent_color=BRAND_COLOR)
        self.add_item(cnt)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # 1. Booster role restriction
        if not self.music_cog._is_booster_or_admin(interaction.user, interaction.guild):
            embed = discord.Embed(
                description=f"### Music & Radio commands are exclusive for <@&{MUSIC_BOOSTER_ROLE_ID}>!",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        # 2. Channel restriction
        if not self.music_cog._is_allowed_channel(interaction.channel_id):
            embed = discord.Embed(
                description=f"### Music commands can only be used in <#{MUSIC_COMMAND_CHANNEL_ID}>!",
                color=0xED4245
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        # 3. Voice channel checks
        if not interaction.user.voice or not interaction.guild.voice_client:
            embed = discord.Embed(
                description="### You must be in the voice channel to use music controls.",
                color=0xFEE75C
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        if interaction.user.voice.channel.id != interaction.guild.voice_client.channel.id:
            embed = discord.Embed(
                description="### You must be in the same voice channel as the bot.",
                color=0xFEE75C
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return False

        return True

    async def on_pause_resume(self, interaction: discord.Interaction):
        vc = self.queue.voice_client
        if not vc:
            embed = discord.Embed(description="### Not currently connected to voice.", color=0xFEE75C)
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
            embed = discord.Embed(description="### No previous track in history.", color=0xFEE75C)
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
            embed = discord.Embed(description="### Nothing is currently playing.", color=0xFEE75C)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        skipped_name = self.queue.current_track.clean_title
        vc.stop()
        await interaction.response.send_message(
            f"{Emojis.NEXT} Skipped: **{skipped_name}**",
            ephemeral=True
        )

    async def on_stop(self, interaction: discord.Interaction):
        self.queue.tracks.clear()
        self.queue.active_radio_station = None
        self.queue.autoplay = False
        if self.queue.voice_client:
            self.queue.voice_client.stop()
        if self.queue.now_playing_message:
            try:
                await self.queue.now_playing_message.delete()
            except Exception:
                pass
            self.queue.now_playing_message = None
        embed = discord.Embed(
            description=f"{Emojis.DELETE} Playback stopped and queue cleared.",
            color=BRAND_COLOR
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

    async def on_queue(self, interaction: discord.Interaction):
        embed = self.music_cog.build_queue_embed(self.queue)
        await interaction.response.send_message(embed=embed, ephemeral=True)

MusicPlayerView = MusicPlayerLayoutView


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
                    is_warning=True
                )
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
            await self.music_cog.send_error_embed(
                interaction,
                description="Only the search requester can cancel this search.",
                is_warning=True
            )
            return
        self.stop()
        try:
            await interaction.message.delete()
        except Exception:
            pass

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
                description=f"### Music commands can only be used in <#{MUSIC_COMMAND_CHANNEL_ID}>!",
                color=0xED4245
            )
            await ctx.send(embed=embed, delete_after=10)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 10))
            return False

        # 3. Booster role restriction (Must have role 1558584451724738640)
        if not self._is_booster_or_admin(ctx.author, ctx.guild):
            embed = discord.Embed(
                description=f"### Music & Radio commands are exclusive for <@&{MUSIC_BOOSTER_ROLE_ID}>!",
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
                description=f"### Music commands can only be used in <#{MUSIC_COMMAND_CHANNEL_ID}>!",
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
                description=f"### Music & Radio commands are exclusive for <@&{MUSIC_BOOSTER_ROLE_ID}>!",
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

        return vc

    def build_queue_embed(self, queue: GuildMusicQueue) -> discord.Embed:
        embed = discord.Embed(color=BRAND_COLOR)
        embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)

        current = queue.current_track
        lines = []
        if current:
            lines.append(f"### {Emojis.SYNCINK_MUSIC} Current Track")
            lines.append(f"{Emojis.S_ARROW} [{current.clean_title}]({current.url})")
            lines.append(f"{Emojis.TIME} `{current.formatted_duration}`  •  *{current.author}*")
        else:
            lines.append(f"### {Emojis.WARNING} Queue is currently empty.")

        lines.append("")
        if queue.tracks:
            lines.append(f"### {Emojis.QUEUE} Up Next ({queue.size} total)")
            for i, t in enumerate(queue.tracks[:10]):
                lines.append(f"{Emojis.S_ARROW} **{i + 1}.** [{t.clean_title}]({t.url})  •  {Emojis.TIME} `{t.formatted_duration}`  •  *{t.author}*")
            if queue.size > 10:
                lines.append(f"\n*...and {queue.size - 10} more track(s)*")
        else:
            lines.append(f"{Emojis.QUEUE} No upcoming tracks in queue.")

        embed.description = "\n".join(lines)
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
            embed = discord.Embed(color=BRAND_COLOR)
            embed.description = (
                f"### {Emojis.QUEUE_ADD} Track Added to Queue\n"
                f"[{added_track.clean_title}]({added_track.url})\n\n"
                f"• **Position:** `#{queue.size}`\n"
                f"• **Artist:** {added_track.author}\n"
                f"• {Emojis.TIME} **Duration:** `{added_track.formatted_duration}`\n"
                f"• 👤 **Requested by:** <@{interaction.user.id}>\n\n"
                f"▶ **Currently Playing:** **{queue.current_track.clean_title if queue.current_track else 'None'}**"
            )
            if added_track.thumbnail:
                embed.set_thumbnail(url=added_track.thumbnail)
            embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)

            if interaction.response.is_done():
                msg = await interaction.followup.send(embed=embed)
                if msg:
                    asyncio.create_task(_delayed_delete_msg(msg, 10))
            else:
                await interaction.response.send_message(embed=embed, delete_after=10)

    async def play_track(self, queue: GuildMusicQueue, track: Track):
        queue.playback_token += 1
        playback_token = queue.playback_token
        queue.current_track = track
        queue.start_time = time.time()
        queue.paused_at = None
        queue.total_paused_duration = 0.0

        try:
            # yt-dlp media URLs are signed and short-lived. Resolve again when the
            # track actually starts, especially for items that waited in the queue.
            await self.service.refresh_stream_url(track)
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
            await self.advance_queue(queue, expected_token=playback_token)
            return

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

    async def advance_queue(self, queue: GuildMusicQueue, expected_token: Optional[int] = None):
        async with queue.advance_lock:
            if expected_token is not None and expected_token != queue.playback_token:
                return
            # Invalidate this playback's callback before any awaits, so repeated
            # after() notifications cannot start duplicate tracks.
            queue.playback_token += 1
        await self._advance_queue_locked(queue)

    async def _advance_queue_locked(self, queue: GuildMusicQueue):
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

        # Queue is empty - Check 24/7 radio or Autoplay
        if queue.active_radio_station:
            station = RADIO_STATIONS.get(queue.active_radio_station)
            requester = queue.current_track.requested_by if queue.current_track else None
            if station and requester:
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
                log.warning(f"[Radio] No playable tracks resolved for station {queue.active_radio_station}; ending radio session.")
                queue.active_radio_station = None

        if queue.autoplay and queue.history:
            last = queue.history[-1]
            rec_query = f"{last.author} {last.clean_title} related song"
            rec_tracks = await self.service.search_and_extract(rec_query, last.requested_by, limit=3)
            if rec_tracks:
                await self.play_track(queue, rec_tracks[0])
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

        # End of queue reached
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
            await queue.text_channel.send(embed=embed_finished, delete_after=15)

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
                    await queue.text_channel.send(embed=embed_leave, delete_after=15)
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

        if queue.now_playing_message:
            try:
                await queue.now_playing_message.delete()
            except Exception:
                pass
            queue.now_playing_message = None

        view = MusicPlayerLayoutView(self, queue)
        msg = await interaction.followup.send(view=view)
        queue.now_playing_message = msg

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
            embed = discord.Embed(color=BRAND_COLOR)
            embed.description = (
                f"### {Emojis.QUEUE_ADD} Track Added to Queue\n"
                f"[{added_track.clean_title}]({added_track.url})\n\n"
                f"• **Position:** `#{queue.size}`\n"
                f"• **Artist:** {added_track.author}\n"
                f"• {Emojis.TIME} **Duration:** `{added_track.formatted_duration}`\n"
                f"• 👤 **Requested by:** <@{ctx.author.id}>\n\n"
                f"▶ **Currently Playing:** **{queue.current_track.clean_title if queue.current_track else 'None'}**"
            )
            if added_track.thumbnail:
                embed.set_thumbnail(url=added_track.thumbnail)
            embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)
            await ctx.send(embed=embed, delete_after=10)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 10))

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
            await self.send_error_embed(interaction, description=f"No results found for **{query}**.", is_warning=True)
            return

        embed = discord.Embed(title="🔍 Search Results", color=BRAND_COLOR)
        lines = []
        for i, t in enumerate(tracks):
            lines.append(f"**{i + 1}.** [{t.clean_title}]({t.url})\n{Emojis.TIME} `{t.formatted_duration}`  •  *{t.author}*")
        embed.description = f"Query: **{query}**\n\n───────────────────────────────\n\n" + "\n\n".join(lines)
        embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)

        view = SearchPickerView(self, interaction.user, tracks)
        await interaction.followup.send(embed=embed, view=view)

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
        skipped = queue.current_track.clean_title
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
            await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="np", description="Display the interactive now playing music card.")
    async def slash_np(self, interaction: discord.Interaction):
        queue = self.service.get_queue(interaction.guild_id)
        if not queue.current_track:
            await self.send_error_embed(interaction, description="Nothing is currently playing.", is_warning=True)
            return
        embed = build_now_playing_embed(queue)
        await interaction.response.send_message(embed=embed, delete_after=30)

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

    @app_commands.command(name="autoplay", description="Endless related song recommendation.")
    @app_commands.describe(mode="Enable or disable smart autoplay")
    async def slash_autoplay(self, interaction: discord.Interaction, mode: Literal["on", "off"]):
        queue = self.service.get_queue(interaction.guild_id)
        queue.autoplay = (mode == "on")
        status = "ENABLED" if queue.autoplay else "DISABLED"
        await interaction.response.send_message(f"{Emojis.RADIO} Autoplay is now **{status}**.", ephemeral=True)

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
                is_warning=True
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
            await self.send_error_embed(ctx, description=f"No results found for **{query}**.", is_warning=True)
            return

        embed = discord.Embed(title="🔍 Search Results", color=BRAND_COLOR)
        lines = []
        for i, t in enumerate(tracks):
            lines.append(f"**{i + 1}.** [{t.clean_title}]({t.url})\n{Emojis.TIME} `{t.formatted_duration}`  •  *{t.author}*")
        embed.description = f"Query: **{query}**\n\n───────────────────────────────\n\n" + "\n\n".join(lines)
        embed.set_footer(text="SyncInk Platform", icon_url=BRAND_LOGO_URL)

        view = SearchPickerView(self, ctx.author, tracks)
        await ctx.send(embed=embed, view=view)

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
        skipped = queue.current_track.clean_title
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
            await ctx.send(embed=embed, delete_after=30)
            if ctx.message:
                asyncio.create_task(_delayed_delete_msg(ctx.message, 30))

    @commands.command(name="np", aliases=["nowplaying"], description="Display interactive now playing music card.")
    async def cmd_np(self, ctx: commands.Context):
        queue = self.service.get_queue(ctx.guild.id)
        if not queue.current_track:
            await self.send_error_embed(ctx, description="Nothing is currently playing.", is_warning=True)
            return
        embed = build_now_playing_embed(queue)
        await ctx.send(embed=embed, delete_after=30)
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

    @commands.command(name="autoplay", description="Endless related song recommendation.")
    async def cmd_autoplay(self, ctx: commands.Context, mode: Optional[str] = None):
        queue = self.service.get_queue(ctx.guild.id)
        if mode:
            m = mode.lower().strip()
            queue.autoplay = (m in ("on", "true", "enable", "1"))
        else:
            queue.autoplay = not queue.autoplay
        status = "ENABLED" if queue.autoplay else "DISABLED"
        await ctx.send(f"{Emojis.RADIO} Autoplay is now **{status}**.", delete_after=5)
        if ctx.message:
            asyncio.create_task(_delayed_delete_msg(ctx.message, 5))

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
