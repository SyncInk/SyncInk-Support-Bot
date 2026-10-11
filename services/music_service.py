import asyncio
import os
import re
import shutil
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional
import aiohttp
import discord
try:
    import yt_dlp
except ImportError:
    yt_dlp = None
    log.warning("[Music Service] yt-dlp is not installed. Run ?fixmusic to auto-install dependencies.")
import discord.opus
from utils.emojis import Emojis, EmojiPartials
from utils.logger import log

def ensure_opus_loaded() -> bool:
    """Ensures native libopus C library is loaded for smooth, stutter-free Discord voice encoding."""
    if discord.opus.is_loaded():
        return True
    try:
        discord.opus._load_default()
        if discord.opus.is_loaded():
            log.info("[Audio Engine] Native libopus library successfully loaded via default loader.")
            return True
    except Exception as e:
        log.debug(f"[Audio Engine] _load_default: {e}")

    candidates = [
        "libopus-0.x64.dll",
        "libopus.so.0",
        "libopus.so",
        "/data/data/com.termux/files/usr/lib/libopus.so",
        "/usr/lib/x86_64-linux-gnu/libopus.so.0",
        "/usr/lib/aarch64-linux-gnu/libopus.so.0",
        "/usr/local/lib/libopus.so",
        "libopus.dylib",
    ]
    for candidate in candidates:
        try:
            discord.opus.load_opus(candidate)
            if discord.opus.is_loaded():
                log.info(f"[Audio Engine] Native libopus loaded from {candidate}")
                return True
        except Exception:
            continue

    log.warning("[Audio Engine] Could not load native libopus library; software fallback will be used.")
    return False

# Initialize Opus engine immediately on module import
ensure_opus_loaded()

def get_ffmpeg_path() -> str:
    """Finds the best ffmpeg executable available across Termux, Linux, and Windows."""
    env_path = os.getenv("FFMPEG_PATH")
    if env_path and (os.path.exists(env_path) or shutil.which(env_path)):
        return env_path
    candidates = [
        "/data/data/com.termux/files/usr/bin/ffmpeg",
        "/usr/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "ffmpeg.exe"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "ffmpeg"),
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    sys_path = shutil.which("ffmpeg")
    if sys_path:
        return sys_path
    return "ffmpeg"

def clean_title(title: str) -> str:
    """Removes video tags, bracketed text, and noise from titles."""
    if not title:
        return "Unknown Track"
    cleaned = re.sub(r'(?i)\s*[\[(](official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)?|hd|4k|hq|lyrics?)[\])]', '', title)
    cleaned = re.sub(r'(?i)\s*\|\s*(official\s*(music\s*)?(video|audio)|visualizer)', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned or title

def format_duration(seconds: Optional[int]) -> str:
    if seconds is None or seconds <= 0:
        return "LIVE"
    minutes, secs = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

def parse_time_to_seconds(time_str: str) -> Optional[int]:
    if not time_str:
        return None
    time_str = time_str.strip()
    if time_str.isdigit():
        return int(time_str)
    parts = time_str.split(":")
    try:
        if len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    except ValueError:
        return None
    return None

RADIO_STATIONS = {
    'lofi': {
        'name': '24/7 Lofi & Chill Beats',
        'genre': 'Lofi Chill / Instrumental',
        'queries': [
            'lofi instrumental song',
            'chillhop instrumental track',
            'jazzy lofi beat song',
            'relaxing lofi song no vocals'
        ],
    },
    'synthwave': {
        'name': '80s Synthwave / Retro Chill',
        'genre': 'Synthwave / Retro 80s',
        'queries': [
            'synthwave instrumental song',
            'retrowave outrun track',
            'chill synthwave song',
            '80s retro electronic track'
        ],
    },
    'coffee': {
        'name': 'Smooth Coffee Shop Jazz',
        'genre': 'Jazz & Acoustic Lounge',
        'queries': [
            'coffee shop jazz song instrumental',
            'smooth jazz track',
            'acoustic cafe instrumental song',
            'relaxing jazz piano track'
        ],
    },
    'sleep': {
        'name': 'Deep Sleep Ambient Music',
        'genre': 'Ambient / Sleep Waves',
        'queries': [
            'deep sleep ambient song',
            'calm ambient track no vocals',
            'soft piano sleep track',
            'peaceful soundscape instrumental song'
        ],
    },
    'gaming': {
        'name': 'NCS EDM Gaming Radio',
        'genre': 'Electronic & Gaming EDM',
        'queries': [
            'gaming edm track',
            'melodic electronic gaming song',
            'drum and bass gaming track',
            'copyright free edm song'
        ],
    },
}

PLATFORM_EMOJIS_MAP = {
    'youtube': Emojis.YOUTUBEMUSIC,
    'youtubemusic': Emojis.YOUTUBEMUSIC,
    'spotify': Emojis.SPOTIFY,
    'applemusic': Emojis.APPLEMUSIC,
    'apple_music': Emojis.APPLEMUSIC,
    'deezer': Emojis.DEEZER,
    'tidal': Emojis.TIDAL,
    'soundcloud': Emojis.SOUNDCLOUD,
    'radio': Emojis.RADIO,
    'arbitrary': Emojis.SYNCINK_MUSIC,
}

@dataclass
class Track:
    title: str
    clean_title: str
    author: str
    duration: Optional[int]
    url: str
    stream_url: str
    thumbnail: Optional[str]
    platform: str
    requested_by: discord.Member
    is_live: bool = False
    is_radio: bool = False
    radio_station_id: Optional[str] = None

    @property
    def formatted_duration(self) -> str:
        return "LIVE" if self.is_live else format_duration(self.duration)

    @property
    def platform_emoji(self) -> str:
        return PLATFORM_EMOJIS_MAP.get(self.platform.lower(), Emojis.SYNCINK_MUSIC)

class GuildMusicQueue:
    def __init__(self, guild_id: int):
        self.guild_id = guild_id
        self.voice_client: Optional[discord.VoiceClient] = None
        self.text_channel: Optional[discord.abc.Messageable] = None
        self.tracks: List[Track] = []
        self.current_track: Optional[Track] = None
        self.history: List[Track] = []
        self.volume: int = 100
        self.repeat_mode: str = "off"  # 'off', 'track', 'queue'
        self.autoplay: bool = False
        self.is_247: bool = False
        self.now_playing_message: Optional[discord.Message] = None
        self.start_time: float = 0.0
        self.paused_at: Optional[float] = None
        self.total_paused_duration: float = 0.0
        self.inactivity_task: Optional[asyncio.Task] = None
        self.active_radio_station: Optional[str] = None
        self.radio_recent_urls: List[str] = []

    @property
    def size(self) -> int:
        return len(self.tracks)

    def get_playback_time(self) -> int:
        if not self.current_track or self.start_time == 0.0:
            return 0
        if self.paused_at is not None:
            active = self.paused_at - self.start_time - self.total_paused_duration
        else:
            active = time.time() - self.start_time - self.total_paused_duration
        return max(0, int(active))

    def get_progress_bar(self, width: int = 16) -> str:
        current_sec = self.get_playback_time()
        total_sec = self.current_track.duration if self.current_track else 0
        if not total_sec or self.current_track.is_live:
            return f"{format_duration(current_sec)} ━━━━━━━━🔘━━━━━━━━ LIVE"
        progress = min(1.0, max(0.0, current_sec / total_sec))
        knob_pos = int(progress * width)
        line = ""
        for i in range(width):
            if i == knob_pos:
                line += "🔘"
            else:
                line += "━"
        return f"{format_duration(current_sec)} {line} {format_duration(total_sec)}"

    def cancel_inactivity(self):
        if self.inactivity_task and not self.inactivity_task.done():
            self.inactivity_task.cancel()
        self.inactivity_task = None

class MusicService:
    _instance: Optional['MusicService'] = None

    def __init__(self):
        self.queues: Dict[int, GuildMusicQueue] = {}
        self.ydl_opts = {
            'format': 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best',
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'default_search': 'ytsearch',
            'extract_flat': False,
            'source_address': '0.0.0.0',
            'skip_download': True,
            'socket_timeout': 15,
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web', 'mweb'],
                }
            },
        }

    @classmethod
    def get_instance(cls) -> 'MusicService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_queue(self, guild_id: int) -> GuildMusicQueue:
        if guild_id not in self.queues:
            self.queues[guild_id] = GuildMusicQueue(guild_id)
        return self.queues[guild_id]

    def remove_queue(self, guild_id: int):
        if guild_id in self.queues:
            q = self.queues[guild_id]
            q.cancel_inactivity()
            q.tracks.clear()
            q.current_track = None
            del self.queues[guild_id]

    async def resolve_spotify(self, url: str) -> Optional[dict]:
        """Resolves Spotify track title via public Spotify oEmbed API."""
        try:
            oembed_url = f"https://open.spotify.com/oembed?url={url}"
            async with aiohttp.ClientSession() as session:
                async with session.get(oembed_url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        title = data.get("title", "")
                        thumbnail = data.get("thumbnail_url")
                        return {"search_query": title, "thumbnail": thumbnail}
        except Exception as e:
            log.warning(f"Spotify oEmbed resolve error: {e}")
        return None

    async def search_and_extract(
        self,
        query: str,
        requester: discord.Member,
        platform: str = "auto",
        limit: int = 1
    ) -> List[Track]:
        """Extracts playable Tracks using yt-dlp with Spotify oEmbed fallback."""
        query = query.strip()
        detected_platform = platform.lower()
        forced_thumbnail = None

        if "spotify.com" in query.lower():
            detected_platform = "spotify"
            meta = await self.resolve_spotify(query)
            if meta and meta.get("search_query"):
                query = meta["search_query"]
                forced_thumbnail = meta.get("thumbnail")
        elif "soundcloud.com" in query.lower():
            detected_platform = "soundcloud"
        elif "apple.com" in query.lower():
            detected_platform = "applemusic"
        elif "deezer.com" in query.lower():
            detected_platform = "deezer"
        elif "tidal.com" in query.lower():
            detected_platform = "tidal"
        elif "youtube.com" in query.lower() or "youtu.be" in query.lower():
            detected_platform = "youtube"

        search_query = query
        if not query.startswith("http://") and not query.startswith("https://"):
            if detected_platform == "soundcloud":
                search_query = f"scsearch{limit}:{query}"
            else:
                search_query = f"ytsearch{limit}:{query}"

        loop = asyncio.get_event_loop()
        opts = dict(self.ydl_opts)

        def _extract():
            if yt_dlp is None:
                raise RuntimeError("yt-dlp is not installed. An administrator can run `?fixmusic` or `pip install yt-dlp` to enable audio playback.")
            with yt_dlp.YoutubeDL(opts) as ydl:
                return ydl.extract_info(search_query, download=False)

        info = None
        try:
            info = await loop.run_in_executor(None, _extract)
        except Exception as primary_err:
            log.warning(f"[Music Extract] Primary extraction failed for '{search_query}': {primary_err}")
            # If search query is not a direct URL and not soundcloud, attempt soundcloud fallback
            if not query.startswith("http://") and not query.startswith("https://") and detected_platform != "soundcloud":
                log.info(f"[Music Extract] Attempting SoundCloud fallback for: {query}")
                sc_query = f"scsearch{limit}:{query}"
                def _sc_fallback():
                    sc_opts = dict(self.ydl_opts)
                    sc_opts.pop('extractor_args', None)
                    with yt_dlp.YoutubeDL(sc_opts) as ydl:
                        return ydl.extract_info(sc_query, download=False)
                try:
                    info = await loop.run_in_executor(None, _sc_fallback)
                    detected_platform = "soundcloud"
                except Exception as sc_err:
                    log.error(f"[Music Extract] SoundCloud fallback also failed: {sc_err}")
                    raise RuntimeError(f"Audio extraction failed: {primary_err}")
            else:
                raise RuntimeError(f"Audio extraction failed: {primary_err}")

        if not info:
            return []

        entries = info.get("entries") if "entries" in info else [info]
        tracks: List[Track] = []

        for entry in entries:
            if not entry:
                continue
            raw_title = entry.get("title") or "Unknown Track"
            c_title = clean_title(raw_title)
            artist = entry.get("uploader") or entry.get("artist") or entry.get("channel") or "Unknown Artist"
            duration = entry.get("duration")
            webpage_url = entry.get("webpage_url") or entry.get("url") or query
            stream_url = entry.get("url")
            thumb = forced_thumbnail or entry.get("thumbnail")
            is_live = bool(entry.get("is_live", False))

            if not stream_url:
                continue

            track = Track(
                title=raw_title,
                clean_title=c_title,
                author=artist,
                duration=duration,
                url=webpage_url,
                stream_url=stream_url,
                thumbnail=thumb,
                platform=detected_platform if detected_platform != "auto" else "youtube",
                requested_by=requester,
                is_live=is_live,
            )
            tracks.append(track)

        return tracks

    def create_audio_source(self, track: Track, volume: int = 100) -> discord.AudioSource:
        """Constructs an FFmpeg-backed PCMVolumeTransformer with resilient streaming options."""
        ffmpeg_bin = get_ffmpeg_path()
        before_options = (
            "-reconnect 1 "
            "-reconnect_streamed 1 "
            "-reconnect_delay_max 5 "
            "-probesize 10000000 "
            "-analyzeduration 15000000 "
            "-nostdin"
        )
        options = "-vn -ar 48000 -ac 2 -b:a 192k"

        pcm = discord.FFmpegPCMAudio(
            track.stream_url,
            executable=ffmpeg_bin,
            before_options=before_options,
            options=options
        )
        vol_normalized = max(0.01, min(2.0, volume / 100.0))
        return discord.PCMVolumeTransformer(pcm, volume=vol_normalized)

    async def start_radio_station(
        self,
        voice_channel: discord.VoiceChannel,
        text_channel: discord.abc.Messageable,
        requester: discord.Member,
        station_id: str
    ) -> Track:
        """Starts 24/7 continuous radio streaming for a specific station."""
        station = RADIO_STATIONS.get(station_id, RADIO_STATIONS['lofi'])
        guild_id = voice_channel.guild.id
        queue = self.get_queue(guild_id)
        queue.text_channel = text_channel
        queue.active_radio_station = station_id

        # Pick a fresh query from station
        import random
        queries = station.get("queries", ["lofi beat instrumental"])
        query = random.choice(queries)

        tracks = await self.search_and_extract(query, requester, platform="radio", limit=5)
        if not tracks:
            raise RuntimeError(f"Could not load radio station {station['name']}.")

        # Pick one that wasn't recently played
        selected_track = tracks[0]
        for t in tracks:
            if t.url not in queue.radio_recent_urls:
                selected_track = t
                break

        selected_track.is_radio = True
        selected_track.radio_station_id = station_id
        selected_track.platform = "radio"
        queue.radio_recent_urls.append(selected_track.url)
        if len(queue.radio_recent_urls) > 50:
            queue.radio_recent_urls.pop(0)

        # Clear active upcoming tracks and play immediately
        queue.tracks.clear()
        queue.tracks.append(selected_track)
        return selected_track
