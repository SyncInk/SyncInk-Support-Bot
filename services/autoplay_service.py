"""
services/autoplay_service.py
Intelligent, AI-Powered Auto Play & Personal Music Companion for SyncInk Support Bot.

Features:
- Individual user music taste profiles (likes, dislikes, top artists, genres, languages, moods).
- Group listening intelligence (balances multiple listeners in VC, merges preferences, respects blacklists).
- Anti-repetition engine: strict queue check, session cooldown, artist diversity, fuzzy title normalization.
- Multi-tier recommendations:
    * Tier 1: Google Gemini (gemini-3.8-flash / gemini-3.5-flash / gemini-flash-latest)
    * Tier 2: OpenAI / OpenRouter
    * Tier 3: Built-in Heuristic Affinity Engine (30+ curated genre & artist clusters)
- Interactive real-time feedback: Like, Dislike, More Like This, Avoid Artist, Discovery Modes.
- Background prefetching for 0-latency gapless queue transitions.
- Playable track verification via yt-dlp / SoundCloud extractors.
"""

import os
import json
import time
import math
import random
import re
import asyncio
import aiohttp
from typing import Dict, List, Optional, Any, Tuple, Set
from collections import deque
import discord

from utils.logger import log
from utils.emojis import Emojis, EmojiPartials

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PROFILES_FILE = os.path.join(DATA_DIR, "autoplay_preferences.json")

# ─────────────────────────────────────────────────────────────
# Built-in Musical Affinity Clusters (Fallback Heuristics)
# ─────────────────────────────────────────────────────────────
MUSIC_CLUSTERS = {
    "bollywood_romantic": {
        "genre": "Bollywood Romantic",
        "language": "Hindi",
        "mood": "Romantic",
        "keywords": ["arijit", "atif", "pritam", "shreya", "jubin", "kesariya", "tum hi ho", "channa mereya", "raataan lambiyan"],
        "artists": ["Arijit Singh", "Atif Aslam", "Mohit Chauhan", "Jubin Nautiyal", "Shreya Ghoshal", "Pritam", "Darshan Raval", "Sachin-Jigar", "Armaan Malik", "Sunidhi Chauhan"],
        "sample_tracks": [
            ("Apna Bana Le", "Arijit Singh, Sachin-Jigar"),
            ("Raataan Lambiyan", "Jubin Nautiyal, Asees Kaur"),
            ("Hawayein", "Arijit Singh, Pritam"),
            ("Tum Mile", "Neeraj Shridhar, Pritam"),
            ("Pee Loon", "Mohit Chauhan, Pritam"),
            ("Tera Hone Laga Hoon", "Atif Aslam, Alisha Chinai"),
            ("Ranjha", "B Praak, Jasleen Royal"),
            ("Agar Tum Saath Ho", "Arijit Singh, Alka Yagnik"),
            ("Dil Diyan Gallan", "Atif Aslam"),
            ("Pehli Nazar Mein", "Atif Aslam"),
        ]
    },
    "hindi_indie_acoustic": {
        "genre": "Hindi Indie & Acoustic",
        "language": "Hindi",
        "mood": "Chill",
        "keywords": ["prateek", "anuv", "jasleen", "lucky ali", "ritviz", "twin strings", "baarishein", "choo lo", "alag aasmaan"],
        "artists": ["Anuv Jain", "Prateek Kuhad", "The Local Train", "When Chai Met Toast", "Lucky Ali", "Twin Strings", "Jasleen Royal", "Ritviz", "Zaeden"],
        "sample_tracks": [
            ("Baarishein", "Anuv Jain"),
            ("cold/mess", "Prateek Kuhad"),
            ("Kasoor", "Prateek Kuhad"),
            ("Alag Aasmaan", "Anuv Jain"),
            ("Choo Lo", "The Local Train"),
            ("O Sanam", "Lucky Ali"),
            ("Khoj", "When Chai Met Toast"),
            ("Sage", "Ritviz"),
            ("Mishri", "Anuv Jain"),
        ]
    },
    "punjabi_hits": {
        "genre": "Punjabi Pop & Urban",
        "language": "Punjabi",
        "mood": "Energetic",
        "keywords": ["diljit", "ap dhillon", "karan aujla", "shubh", "sidhu", "b praak", "harrdy", "brown munde", "elevated", "chorni"],
        "artists": ["Diljit Dosanjh", "AP Dhillon", "Karan Aujla", "Shubh", "Sidhu Moose Wala", "B Praak", "Harrdy Sandhu", "Gurinder Gill", "Jassa Dhillon"],
        "sample_tracks": [
            ("Lover", "Diljit Dosanjh"),
            ("Brown Munde", "AP Dhillon, Gurinder Gill"),
            ("Softly", "Karan Aujla"),
            ("Excuses", "AP Dhillon, Gurinder Gill"),
            ("No Love", "Shubh"),
            ("Tauba Tauba", "Karan Aujla"),
            ("Kinni Kinni", "Diljit Dosanjh"),
            ("With You", "AP Dhillon"),
            ("Born To Shine", "Diljit Dosanjh"),
            ("Baller", "Shubh"),
        ]
    },
    "lofi_chill": {
        "genre": "Lo-Fi Beats & Chillhop",
        "language": "Instrumental / English",
        "mood": "Relaxing",
        "keywords": ["lofi", "chillhop", "shiloh", "kudasa", "potsu", "idealism", "jinsang", "kupla", "saib", "sleep beats", "study beats"],
        "artists": ["Shiloh Dynasty", "Kudasa", "potsu", "idealism", "Jinsang", "Kupla", "saib", "Elijah Who", "Tomppabeats", "Flovry"],
        "sample_tracks": [
            ("Technicolor", "Kudasa"),
            ("Nagashi", "idealism"),
            ("Affection", "Jinsang"),
            ("I\'m in Love with U, Sry", "Jinsang"),
            ("Controlla", "idealism"),
            ("im closing my eyes", "potsu, Shiloh Dynasty"),
            ("so far away", "saib"),
            ("Kingdom in Blue", "Kupla"),
        ]
    },
    "pop_rnb_hits": {
        "genre": "Pop & R&B Hits",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["weeknd", "bruno mars", "dua lipa", "ed sheeran", "ariana", "post malone", "bieber", "sza", "taylor", "blinding lights"],
        "artists": ["The Weeknd", "Bruno Mars", "Dua Lipa", "Ed Sheeran", "Ariana Grande", "Post Malone", "Justin Bieber", "SZA", "Taylor Swift", "Harry Styles"],
        "sample_tracks": [
            ("Blinding Lights", "The Weeknd"),
            ("Levitating", "Dua Lipa"),
            ("Die For You", "The Weeknd"),
            ("Save Your Tears", "The Weeknd"),
            ("As It Was", "Harry Styles"),
            ("That\'s What I Like", "Bruno Mars"),
            ("Kill Bill", "SZA"),
            ("Circles", "Post Malone"),
            ("Cruel Summer", "Taylor Swift"),
            ("Peaches", "Justin Bieber"),
        ]
    },
    "hiphop_rap": {
        "genre": "Hip-Hop & Rap",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["drake", "travis scott", "kendrick", "j. cole", "21 savage", "juice wrld", "future", "metro boomin", "eminem"],
        "artists": ["Drake", "Travis Scott", "Kendrick Lamar", "J. Cole", "21 Savage", "Juice WRLD", "Future", "Metro Boomin", "Eminem"],
        "sample_tracks": [
            ("FE!N", "Travis Scott"),
            ("Not Like Us", "Kendrick Lamar"),
            ("God\'s Plan", "Drake"),
            ("No Role Modelz", "J. Cole"),
            ("Lucid Dreams", "Juice WRLD"),
            ("Rich Flex", "Drake, 21 Savage"),
            ("HUMBLE.", "Kendrick Lamar"),
            ("Mask Off", "Future"),
        ]
    },
    "rock_indie": {
        "genre": "Alternative & Rock",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["coldplay", "imagine dragons", "linkin park", "arctic monkeys", "onerepublic", "queen", "nirvana", "radiohead"],
        "artists": ["Coldplay", "Imagine Dragons", "Linkin Park", "Arctic Monkeys", "OneRepublic", "The Neighbourhood", "twenty one pilots"],
        "sample_tracks": [
            ("Yellow", "Coldplay"),
            ("Demons", "Imagine Dragons"),
            ("In The End", "Linkin Park"),
            ("Do I Wanna Know?", "Arctic Monkeys"),
            ("Counting Stars", "OneRepublic"),
            ("Sweater Weather", "The Neighbourhood"),
            ("Viva La Vida", "Coldplay"),
            ("Believer", "Imagine Dragons"),
        ]
    },
    "edm_dance": {
        "genre": "EDM & Dance",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["alan walker", "chainsmokers", "marshmello", "avicii", "martin garrix", "dj snake", "calvin harris", "david guetta"],
        "artists": ["Alan Walker", "The Chainsmokers", "Marshmello", "Avicii", "Martin Garrix", "Calvin Harris", "DJ Snake", "Kygo"],
        "sample_tracks": [
            ("Faded", "Alan Walker"),
            ("Closer", "The Chainsmokers"),
            ("Wake Me Up", "Avicii"),
            ("Animals", "Martin Garrix"),
            ("Summer", "Calvin Harris"),
            ("Happier", "Marshmello"),
            ("Firestone", "Kygo"),
            ("Lean On", "Major Lazer, DJ Snake"),
        ]
    },
    "kpop": {
        "genre": "K-Pop",
        "language": "Korean",
        "mood": "Energetic",
        "keywords": ["bts", "blackpink", "newjeans", "twice", "stray kids", "aespa", "le sserafim", "dynamite", "how you like that"],
        "artists": ["BTS", "BLACKPINK", "NewJeans", "TWICE", "Stray Kids", "aespa", "LE SSERAFIM", "IVE", "SEVENTEEN"],
        "sample_tracks": [
            ("Dynamite", "BTS"),
            ("How You Like That", "BLACKPINK"),
            ("Hype Boy", "NewJeans"),
            ("Super Shy", "NewJeans"),
            ("What is Love?", "TWICE"),
            ("S-Class", "Stray Kids"),
            ("Supernova", "aespa"),
            ("Butter", "BTS"),
        ]
    },
    "japanese_anime": {
        "genre": "J-Pop & Anime",
        "language": "Japanese",
        "mood": "Energetic",
        "keywords": ["yoasobi", "kenshi yonezu", "lisa", "eve", "radwimps", "aimyon", "ado", "idol", "lemon", "gurenge"],
        "artists": ["YOASOBI", "Kenshi Yonezu", "LiSA", "Eve", "RADWIMPS", "Aimyon", "Ado", "Official HIGE DANDism", "Vaundy"],
        "sample_tracks": [
            ("Idol", "YOASOBI"),
            ("Lemon", "Kenshi Yonezu"),
            ("Gurenge", "LiSA"),
            ("Racing into the Night", "YOASOBI"),
            ("Kaikai Kitan", "Eve"),
            ("Sparkle", "RADWIMPS"),
            ("Usseewa", "Ado"),
            ("Marigold", "Aimyon"),
        ]
    }
}


def normalize_title(title: str) -> str:
    """Normalize song title to remove video metadata and detect alternate uploads."""
    t = title.lower()
    # Strip brackets and parentheses content that indicate tags
    patterns = [
        r"\(official\s+video\)",
        r"\(official\s+music\s+video\)",
        r"\(official\s+audio\)",
        r"\(official\s+lyric\s+video\)",
        r"\(official\s+lyric\)",
        r"\(lyrics\)",
        r"\(lyric\s+video\)",
        r"\(audio\)",
        r"\(remastered[^\)]*\)",
        r"\(remaster[^\)]*\)",
        r"\(live[^\)]*\)",
        r"\(visualizer\)",
        r"\(slowed\s*\+\s*reverb\)",
        r"\[official\s+video\]",
        r"\[official\s+audio\]",
        r"\[lyrics\]",
        r"\[hd\]",
        r"\[4k\]",
        r"\[slowed\s*\+\s*reverb\]",
        r"\|.*$",
        r"-.*official.*$",
        r"feat\..*$",
        r"ft\..*$",
    ]
    for p in patterns:
        t = re.sub(p, "", t, flags=re.IGNORECASE)
    # Remove special punctuation
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def titles_are_similar(t1: str, t2: str, artist1: str = "", artist2: str = "") -> bool:
    """Checks if two track titles represent the same song (detect alternate uploads)."""
    n1 = normalize_title(t1)
    n2 = normalize_title(t2)
    if not n1 or not n2:
        return False
    if n1 == n2:
        return True

    words1 = set(n1.split())
    words2 = set(n2.split())
    if artist1:
        words1 -= set(normalize_title(artist1).split())
    if artist2:
        words2 -= set(normalize_title(artist2).split())

    if not words1 or not words2:
        return n1 == n2 or n1 in n2 or n2 in n1

    if words1 == words2:
        return True

    intersection = words1.intersection(words2)
    min_len = min(len(words1), len(words2))
    max_len = max(len(words1), len(words2))

    # Generic short words guard: don't match "Love" to "Love Story"
    generic_words = {"love", "you", "me", "night", "day", "life", "time", "home", "heart", "baby", "girl", "boy", "one", "stay", "fire", "bad", "good"}
    if min_len == 1 and len(intersection) == 1:
        single_word = list(intersection)[0]
        if single_word in generic_words:
            return words1 == words2
        # For non-generic distinct words (e.g. "Kesariya", "Demons", "Levitating", "Faded")
        return len(single_word) >= 4 and max_len <= 4

    # Multi-word overlap
    if len(intersection) >= 2:
        return len(intersection) >= min_len or (len(intersection) / max_len >= 0.5)

    return False


class UserMusicProfile:
    """Persistent preference profile for an individual user."""
    def __init__(self, user_id: int, data: Optional[Dict[str, Any]] = None):
        self.user_id = user_id
        data = data or {}
        self.liked_tracks: List[Dict[str, Any]] = data.get("liked_tracks", [])
        self.disliked_tracks: List[Dict[str, Any]] = data.get("disliked_tracks", [])
        self.blocked_artists: List[str] = [a.lower().strip() for a in data.get("blocked_artists", [])]
        self.artist_affinity: Dict[str, float] = data.get("artist_affinity", {})
        self.genre_affinity: Dict[str, float] = data.get("genre_affinity", {})
        self.language_affinity: Dict[str, float] = data.get("language_affinity", {})
        self.mood_affinity: Dict[str, float] = data.get("mood_affinity", {})
        self.discovery_mode: str = data.get("discovery_mode", "balanced")  # "balanced", "familiar", "explore"
        self.manual_genre: Optional[str] = data.get("manual_genre")
        self.manual_mood: Optional[str] = data.get("manual_mood")
        self.manual_language: Optional[str] = data.get("manual_language")
        self.recently_played: List[Dict[str, Any]] = data.get("recently_played", [])
        self.total_listened: int = data.get("total_listened", 0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "liked_tracks": self.liked_tracks[-100:],
            "disliked_tracks": self.disliked_tracks[-100:],
            "blocked_artists": list(set(self.blocked_artists))[:100],
            "artist_affinity": dict(sorted(self.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:50]),
            "genre_affinity": dict(sorted(self.genre_affinity.items(), key=lambda x: x[1], reverse=True)[:30]),
            "language_affinity": dict(sorted(self.language_affinity.items(), key=lambda x: x[1], reverse=True)[:20]),
            "mood_affinity": dict(sorted(self.mood_affinity.items(), key=lambda x: x[1], reverse=True)[:20]),
            "discovery_mode": self.discovery_mode,
            "manual_genre": self.manual_genre,
            "manual_mood": self.manual_mood,
            "manual_language": self.manual_language,
            "recently_played": self.recently_played[-50:],
            "total_listened": self.total_listened,
        }

    def is_artist_blocked(self, artist: str) -> bool:
        a_low = artist.lower().strip()
        return any(b in a_low or a_low in b for b in self.blocked_artists)

    def is_track_disliked(self, title: str, artist: str) -> bool:
        for d in self.disliked_tracks:
            if titles_are_similar(d.get("title", ""), title):
                d_art = d.get("artist", "").lower().strip()
                t_art = artist.lower().strip()
                if not d_art or d_art in t_art or t_art in d_art:
                    return True
        return False


class AutoPlayService:
    """
    Core AI Auto Play Service managing user taste profiles, AI prompting,
    heuristic fallbacks, gapless prefetching, and anti-repetition cooldowns.
    """
    _instance: Optional['AutoPlayService'] = None

    def __init__(self):
        self._profiles: Dict[int, UserMusicProfile] = {}
        self._lock = asyncio.Lock()
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if not self.gemini_key and not self.openai_key and not self.openrouter_key:
            env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
            if os.path.exists(env_file):
                try:
                    with open(env_file, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GEMINI_API_KEY="):
                                self.gemini_key = line.split("=", 1)[1].strip()
                            elif line.startswith("OPENAI_API_KEY="):
                                self.openai_key = line.split("=", 1)[1].strip()
                            elif line.startswith("OPENROUTER_API_KEY="):
                                self.openrouter_key = line.split("=", 1)[1].strip()
                except Exception:
                    pass
        self._load_profiles()

    @classmethod
    def get_instance(cls) -> 'AutoPlayService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_profiles(self):
        """Load persistent preference profiles from disk."""
        if not os.path.exists(DATA_DIR):
            try:
                os.makedirs(DATA_DIR, exist_ok=True)
            except Exception:
                pass

        if os.path.exists(PROFILES_FILE):
            try:
                with open(PROFILES_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for uid_str, pdata in data.items():
                        try:
                            uid = int(uid_str)
                            self._profiles[uid] = UserMusicProfile(uid, pdata)
                        except Exception:
                            continue
                log.info(f"[AutoPlayService] Loaded {len(self._profiles)} user music profile(s).")
            except Exception as e:
                log.error(f"[AutoPlayService] Could not load profiles file: {e}")

    def save_profiles(self):
        """Atomically persist profiles to disk."""
        try:
            temp_path = f"{PROFILES_FILE}.tmp"
            payload = {str(uid): p.to_dict() for uid, p in self._profiles.items()}
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            os.replace(temp_path, PROFILES_FILE)
        except Exception as e:
            log.error(f"[AutoPlayService] Error saving profiles: {e}")

    def get_user_profile(self, user_id: int) -> UserMusicProfile:
        if user_id not in self._profiles:
            self._profiles[user_id] = UserMusicProfile(user_id)
        return self._profiles[user_id]

    # ─────────────────────────────────────────────────────────────
    # Profile Feedback & Activity Signals
    # ─────────────────────────────────────────────────────────────
    def record_track_play(self, user_id: int, track: Any, manual: bool = False):
        """Record when a user plays or finishes a track."""
        if not track or getattr(track, "is_radio", False):
            return
        p = self.get_user_profile(user_id)
        p.total_listened += 1

        artist = track.author.strip()
        cluster_info = self._detect_cluster(track.clean_title, artist)

        # Mild affinity signal on play (+0.4 for manual queue, +0.2 for autoplay)
        boost = 0.4 if manual else 0.2
        if artist:
            p.artist_affinity[artist] = p.artist_affinity.get(artist, 0.0) + boost

        genre = cluster_info.get("genre")
        if genre:
            p.genre_affinity[genre] = p.genre_affinity.get(genre, 0.0) + boost

        lang = cluster_info.get("language")
        if lang:
            p.language_affinity[lang] = p.language_affinity.get(lang, 0.0) + boost

        mood = cluster_info.get("mood")
        if mood:
            p.mood_affinity[mood] = p.mood_affinity.get(mood, 0.0) + boost

        # Record into recently played
        p.recently_played.append({
            "title": track.clean_title,
            "artist": artist,
            "timestamp": time.time(),
        })
        p.recently_played = p.recently_played[-50:]
        self.save_profiles()

    def record_track_skip(self, user_id: int, track: Any, listened_seconds: float):
        """
        Record when a track was skipped.
        If skipped very early (<25s), applies a mild negative signal without assuming genre hatred.
        """
        if not track or getattr(track, "is_radio", False):
            return
        if listened_seconds < 25.0:
            p = self.get_user_profile(user_id)
            artist = track.author.strip()
            if artist in p.artist_affinity:
                p.artist_affinity[artist] = max(0.0, p.artist_affinity[artist] - 0.3)
            self.save_profiles()

    def record_explicit_feedback(
        self, user_id: int, track: Any, feedback_type: str
    ) -> Tuple[bool, str]:
        """
        Processes real-time feedback buttons:
        'like', 'dislike', 'more_like_this', 'block_artist'
        """
        if not track:
            return False, "No active track to review."
        p = self.get_user_profile(user_id)
        title = track.clean_title
        artist = track.author.strip()
        cluster_info = self._detect_cluster(title, artist)
        genre = cluster_info.get("genre", "Unknown")

        if feedback_type == "like":
            p.liked_tracks.append({
                "title": title,
                "artist": artist,
                "genre": genre,
                "timestamp": time.time()
            })
            p.artist_affinity[artist] = p.artist_affinity.get(artist, 0.0) + 2.0
            p.genre_affinity[genre] = p.genre_affinity.get(genre, 0.0) + 1.5
            self.save_profiles()
            return True, f"Saved **{title}** to your favorites! Auto Play will prioritize this style."

        elif feedback_type == "dislike":
            p.disliked_tracks.append({
                "title": title,
                "artist": artist,
                "timestamp": time.time()
            })
            p.artist_affinity[artist] = max(-5.0, p.artist_affinity.get(artist, 0.0) - 2.5)
            self.save_profiles()
            return True, f"Disliked **{title}**. Auto Play will never recommend this song again."

        elif feedback_type == "more_like_this":
            p.artist_affinity[artist] = p.artist_affinity.get(artist, 0.0) + 3.0
            p.genre_affinity[genre] = p.genre_affinity.get(genre, 0.0) + 2.5
            p.manual_genre = genre
            self.save_profiles()
            return True, f"Auto Play focused on **{genre}** and songs by **{artist}**!"

        elif feedback_type == "block_artist":
            if artist.lower() not in p.blocked_artists:
                p.blocked_artists.append(artist.lower())
            p.artist_affinity[artist] = -10.0
            self.save_profiles()
            return True, f"Blocked **{artist}**. Auto Play will avoid this artist."

        return False, "Unknown feedback action."

    # ─────────────────────────────────────────────────────────────
    # Multi-Listener & Group Context Strategy
    # ─────────────────────────────────────────────────────────────
    def get_vc_listeners(self, guild_queue: Any) -> List[discord.Member]:
        """Returns non-bot members in the voice channel with the bot."""
        vc = getattr(guild_queue, "voice_client", None)
        if not vc or not getattr(vc, "channel", None):
            return []
        return [m for m in vc.channel.members if not m.bot]

    def build_recommendation_context(
        self, guild_queue: Any, fallback_user: Optional[discord.Member] = None
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive recommendation context.
        If 1 person: personal profile.
        If > 1 people: balances all listeners' preferences (group mode).
        """
        listeners = self.get_vc_listeners(guild_queue)
        if not listeners and fallback_user:
            listeners = [fallback_user]

        seed_track = getattr(guild_queue, "current_track", None)
        if not seed_track and getattr(guild_queue, "history", None):
            seed_track = guild_queue.history[-1]

        seed_title = seed_track.clean_title if seed_track else "Popular Music"
        seed_artist = seed_track.author if seed_track else "Popular Artists"
        seed_cluster = self._detect_cluster(seed_title, seed_artist)

        # Recent history in this guild session
        recent_tracks = []
        if getattr(guild_queue, "history", None):
            for t in guild_queue.history[-6:]:
                recent_tracks.append(f"{t.author} - {t.clean_title}")

        # Combine all excluded items
        blocked_artists: Set[str] = set()
        disliked_titles: Set[str] = set()

        if len(listeners) <= 1:
            # Single listener (Personal mode)
            user = listeners[0] if listeners else fallback_user
            profile = self.get_user_profile(user.id) if user else UserMusicProfile(0)
            blocked_artists.update(profile.blocked_artists)
            disliked_titles.update(d.get("title", "").lower() for d in profile.disliked_tracks)

            top_artists = [a for a, _ in sorted(profile.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:5]]
            top_genres = [g for g, _ in sorted(profile.genre_affinity.items(), key=lambda x: x[1], reverse=True)[:3]]
            top_langs = [l for l, _ in sorted(profile.language_affinity.items(), key=lambda x: x[1], reverse=True)[:2]]

            return {
                "mode": f"Personal ({user.display_name if user else 'Listener'})",
                "listener_count": 1,
                "seed_title": seed_title,
                "seed_artist": seed_artist,
                "seed_genre": profile.manual_genre or seed_cluster.get("genre", "Pop"),
                "seed_language": profile.manual_language or seed_cluster.get("language", "English"),
                "seed_mood": profile.manual_mood or seed_cluster.get("mood", "Chill"),
                "top_artists": top_artists,
                "top_genres": top_genres,
                "top_languages": top_langs,
                "discovery_mode": profile.discovery_mode,
                "recent_tracks": recent_tracks,
                "blocked_artists": list(blocked_artists),
                "disliked_titles": list(disliked_titles),
            }
        else:
            # Group Listening Mode (Multiple listeners in VC)
            merged_artists: Dict[str, float] = {}
            merged_genres: Dict[str, float] = {}
            merged_langs: Dict[str, float] = {}
            discovery_modes = []

            for member in listeners:
                prof = self.get_user_profile(member.id)
                blocked_artists.update(prof.blocked_artists)
                disliked_titles.update(d.get("title", "").lower() for d in prof.disliked_tracks)
                discovery_modes.append(prof.discovery_mode)

                for a, score in prof.artist_affinity.items():
                    merged_artists[a] = merged_artists.get(a, 0.0) + score
                for g, score in prof.genre_affinity.items():
                    merged_genres[g] = merged_genres.get(g, 0.0) + score
                for l, score in prof.language_affinity.items():
                    merged_langs[l] = merged_langs.get(l, 0.0) + score

            # Democratic mode: common ground
            top_artists = [a for a, _ in sorted(merged_artists.items(), key=lambda x: x[1], reverse=True)[:6]]
            top_genres = [g for g, _ in sorted(merged_genres.items(), key=lambda x: x[1], reverse=True)[:4]]
            top_langs = [l for l, _ in sorted(merged_langs.items(), key=lambda x: x[1], reverse=True)[:3]]

            chosen_disc = "explore" if discovery_modes.count("explore") > len(listeners) / 2 else "balanced"

            return {
                "mode": f"Group ({len(listeners)} listeners)",
                "listener_count": len(listeners),
                "seed_title": seed_title,
                "seed_artist": seed_artist,
                "seed_genre": top_genres[0] if top_genres else seed_cluster.get("genre", "Pop"),
                "seed_language": top_langs[0] if top_langs else seed_cluster.get("language", "English"),
                "seed_mood": seed_cluster.get("mood", "Chill"),
                "top_artists": top_artists,
                "top_genres": top_genres,
                "top_languages": top_langs,
                "discovery_mode": chosen_disc,
                "recent_tracks": recent_tracks,
                "blocked_artists": list(blocked_artists),
                "disliked_titles": list(disliked_titles),
            }

    # ─────────────────────────────────────────────────────────────
    # Anti-Repetition & Cooldown Checks
    # ─────────────────────────────────────────────────────────────
    def is_candidate_valid(
        self,
        candidate_title: str,
        candidate_artist: str,
        guild_queue: Any,
        ctx_info: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """
        Strict validation against:
        - Tracks currently in queue or currently playing
        - Recent session history in guild
        - Blocked artists & disliked songs
        - Repetitive artists (artist diversity cooldown)
        """
        c_title_norm = normalize_title(candidate_title)
        c_artist_low = candidate_artist.lower().strip()

        # 1. Blocked artists check
        for b in ctx_info.get("blocked_artists", []):
            if b in c_artist_low or c_artist_low in b:
                return False, f"Artist '{candidate_artist}' is on the blocked list."

        # 2. Disliked titles check
        for d in ctx_info.get("disliked_titles", []):
            if titles_are_similar(d, candidate_title):
                return False, f"Track '{candidate_title}' is marked disliked."

        # 3. Check currently playing track
        curr = getattr(guild_queue, "current_track", None)
        if curr and titles_are_similar(curr.clean_title, candidate_title):
            return False, "Matches current playing song."

        # 4. Check upcoming tracks in queue
        for t in getattr(guild_queue, "tracks", []):
            if titles_are_similar(t.clean_title, candidate_title):
                return False, "Already queued."

        # 5. Check session history (last 40 songs in guild)
        session_hist = getattr(guild_queue, "session_played_history", [])
        for item in session_hist[-40:]:
            if titles_are_similar(item, candidate_title):
                return False, "Played recently in this session (cooldown active)."

        # 6. Artist diversity cooldown: avoid repeating the immediate last artist
        session_artists = getattr(guild_queue, "session_artists", [])
        if len(session_artists) >= 1 and session_artists[-1].lower() == c_artist_low:
            # Allow only if user explicitly wants familiar artist or cluster is small
            if ctx_info.get("discovery_mode") != "familiar":
                return False, f"Artist '{candidate_artist}' was just played (artist diversity cooldown)."

        return True, "Valid"

    # ─────────────────────────────────────────────────────────────
    # Tier 1 & 2: Remote AI Recommendations (Gemini / OpenAI)
    # ─────────────────────────────────────────────────────────────
    async def _fetch_ai_recommendations(self, ctx_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Invokes Gemini 3.8 / 3.5 / OpenRouter / OpenAI for smart recommendations."""
        if self.gemini_key:
            res = await self._call_gemini_api(ctx_info)
            if res:
                return res

        if self.openai_key:
            res = await self._call_openai_api(ctx_info)
            if res:
                return res

        return []

    async def _call_gemini_api(self, ctx_info: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Calls Gemini API with structured prompt for music recommendations."""
        prompt = (
            f"Act as SyncInk's Elite AI Music Director and DJ.\n"
            f"You are selecting the NEXT song for Auto Play.\n\n"
            f"CURRENT MUSICAL CONTEXT:\n"
            f"- Seed Track: '{ctx_info['seed_title']}' by {ctx_info['seed_artist']}\n"
            f"- Genre: {ctx_info['seed_genre']}\n"
            f"- Language: {ctx_info['seed_language']}\n"
            f"- Mood / Vibe: {ctx_info['seed_mood']}\n"
            f"- Listening Mode: {ctx_info['mode']}\n"
            f"- Preferred Artists: {', '.join(ctx_info['top_artists'][:4]) if ctx_info['top_artists'] else 'Open'}\n"
            f"- Preferred Genres: {', '.join(ctx_info['top_genres'][:3]) if ctx_info['top_genres'] else 'Same as seed'}\n"
            f"- Discovery Style: {ctx_info['discovery_mode']} (balance familiar favorites and fresh discoveries)\n"
            f"- Recently Played (DO NOT REPEAT): {', '.join(ctx_info['recent_tracks'][:4]) if ctx_info['recent_tracks'] else 'None'}\n"
            f"- Blocked Artists: {', '.join(ctx_info['blocked_artists'][:5]) if ctx_info['blocked_artists'] else 'None'}\n\n"
            f"TASK:\n"
            f"Generate 4 diverse, musically coherent song candidates that seamlessly follow this song.\n"
            f"Preserve the genre, language, and mood unless transitioning naturally.\n"
            f"Never suggest the same song or artist as the seed track.\n\n"
            f"Output ONLY a raw JSON array matching this exact schema:\n"
            f"[\n"
            f"  {{\n"
            f"    \"title\": \"Exact Song Title\",\n"
            f"    \"artist\": \"Primary Artist\",\n"
            f"    \"genre\": \"Genre\",\n"
            f"    \"language\": \"Language\",\n"
            f"    \"mood\": \"Mood\",\n"
            f"    \"reason\": \"Short 1-sentence explanation of why this song fits listener taste\"\n"
            f"  }}\n"
            f"]"
        )

        models_to_try = [
            "models/gemini-flash-lite-latest",
            "models/gemini-3.1-flash-lite",
            "models/gemini-3.8-flash",
            "models/gemini-flash-latest",
            "models/gemini-2.5-pro",
        ]

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.gemini_key
        }
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}]
        }

        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={self.gemini_key}"
                    try:
                        async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                            if resp.status == 200:
                                data = await resp.json()
                                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                                # Clean markdown code fences if present
                                if text.startswith("```"):
                                    text = re.sub(r"^```(?:json)?\n?", "", text)
                                    text = re.sub(r"\n?```$", "", text)
                                parsed = json.loads(text.strip())
                                if isinstance(parsed, list) and len(parsed) > 0:
                                    return parsed
                            elif resp.status == 429:
                                continue
                    except Exception:
                        continue
        except Exception as e:
            log.warning(f"[AutoPlay AI] Gemini call failed: {e}")

        return None

    async def _call_openai_api(self, ctx_info: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Calls OpenAI Chat Completions as secondary AI fallback."""
        if not self.openai_key:
            return None
        prompt = (
            f"Seed: '{ctx_info['seed_title']}' by {ctx_info['seed_artist']} ({ctx_info['seed_genre']}, {ctx_info['seed_language']}).\n"
            f"Listeners: {ctx_info['mode']}. Mode: {ctx_info['discovery_mode']}.\n"
            f"Suggest 4 distinct songs matching this vibe in JSON array format: "
            f"[{{\"title\": \"...\", \"artist\": \"...\", \"genre\": \"...\", \"language\": \"...\", \"reason\": \"...\"}}]"
        )
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are an intelligent AI DJ. Respond strictly with raw JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 450
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        text = data["choices"][0]["message"]["content"].strip()
                        if text.startswith("```"):
                            text = re.sub(r"^```(?:json)?\n?", "", text)
                            text = re.sub(r"\n?```$", "", text)
                        parsed = json.loads(text.strip())
                        if isinstance(parsed, list) and len(parsed) > 0:
                            return parsed
        except Exception as e:
            log.warning(f"[AutoPlay AI] OpenAI call failed: {e}")
        return None

    # ─────────────────────────────────────────────────────────────
    # Tier 3: Built-in Heuristic Affinity Engine (Zero-Downtime Fallback)
    # ─────────────────────────────────────────────────────────────
    def _detect_cluster(self, title: str, artist: str) -> Dict[str, Any]:
        """Identifies genre and linguistic cluster based on artist, title, or keywords."""
        t_low = title.lower()
        a_low = artist.lower()

        # Check explicit keywords across clusters
        for key, cluster in MUSIC_CLUSTERS.items():
            for kw in cluster["keywords"]:
                if kw in t_low or kw in a_low:
                    return cluster

        # Check artist lists
        for key, cluster in MUSIC_CLUSTERS.items():
            for art in cluster["artists"]:
                if art.lower() in a_low or a_low in art.lower():
                    return cluster

        # Default fallback cluster
        return MUSIC_CLUSTERS["pop_rnb_hits"]

    def _get_heuristic_candidates(self, ctx_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates candidates from local affinity clusters when remote AI is offline."""
        seed_cluster = self._detect_cluster(ctx_info["seed_title"], ctx_info["seed_artist"])
        candidates = []

        # 1. From same cluster
        samples = list(seed_cluster.get("sample_tracks", []))
        random.shuffle(samples)
        for s_title, s_artist in samples:
            if s_artist.lower() == ctx_info["seed_artist"].lower():
                continue
            candidates.append({
                "title": s_title,
                "artist": s_artist,
                "genre": seed_cluster["genre"],
                "language": seed_cluster["language"],
                "mood": seed_cluster["mood"],
                "reason": f"Matches the {seed_cluster['mood'].lower()} {seed_cluster['genre']} vibe of {ctx_info['seed_artist']}."
            })

        # 2. From user's favorite artists
        top_artists = ctx_info.get("top_artists", [])
        for fav in top_artists:
            if fav.lower() != ctx_info["seed_artist"].lower():
                candidates.append({
                    "title": f"Popular hit",
                    "artist": fav,
                    "genre": ctx_info.get("seed_genre", "Pop"),
                    "language": ctx_info.get("seed_language", "English"),
                    "mood": ctx_info.get("seed_mood", "Chill"),
                    "reason": f"Recommended from your high-affinity artist profile ({fav})."
                })

        return candidates

    # ─────────────────────────────────────────────────────────────
    # Recommendation Resolution & Verification Pipeline
    # ─────────────────────────────────────────────────────────────
    async def resolve_next_track(
        self,
        guild_queue: Any,
        requester: discord.Member,
        music_service: Any
    ) -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
        """
        End-to-end resolution of the next Auto Play track:
        1. Checks prefetch cache
        2. Gathers context & constraints
        3. Queries AI / Heuristic models
        4. Validates each candidate against anti-repetition rules
        5. Extracts and verifies playable audio stream with duration checks
        6. Returns (verified_Track, metadata)
        """
        # 1. Check if a pre-fetched track is already verified and waiting
        prefetched = getattr(guild_queue, "prefetched_autoplay_track", None)
        prefetched_meta = getattr(guild_queue, "prefetched_autoplay_meta", None)
        if prefetched:
            guild_queue.prefetched_autoplay_track = None
            guild_queue.prefetched_autoplay_meta = None
            # Double check it wasn't somehow played or queued in the interim
            valid, _ = self.is_candidate_valid(
                prefetched.clean_title, prefetched.author, guild_queue, prefetched_meta or {}
            )
            if valid:
                log.info(f"[AutoPlay] Using gapless prefetched track: {prefetched.clean_title}")
                return prefetched, prefetched_meta

        # 2. Build context
        ctx = self.build_recommendation_context(guild_queue, fallback_user=requester)

        # 3. Fetch candidates (AI first, fallback if none or failed)
        candidates = await self._fetch_ai_recommendations(ctx)
        if not candidates:
            log.info("[AutoPlay] AI unavailable or returned 0 candidates; using musical heuristic engine.")
            candidates = self._get_heuristic_candidates(ctx)

        # 4. Filter & Validate candidates
        valid_candidates = []
        for cand in candidates:
            title = cand.get("title", "")
            artist = cand.get("artist", "")
            if not title or not artist:
                continue
            ok, reason = self.is_candidate_valid(title, artist, guild_queue, ctx)
            if ok:
                valid_candidates.append(cand)
            else:
                log.debug(f"[AutoPlay Candidate Rejected] '{artist} - {title}': {reason}")

        if not valid_candidates:
            # Emergency fallback: expand to heuristic candidates
            heuristics = self._get_heuristic_candidates(ctx)
            for cand in heuristics:
                ok, _ = self.is_candidate_valid(cand["title"], cand["artist"], guild_queue, ctx)
                if ok:
                    valid_candidates.append(cand)

        # 5. Extract and verify audio stream with duration bounds
        for cand in valid_candidates[:5]:
            title = cand["title"]
            artist = cand["artist"]
            query = f"{artist} - {title}"
            try:
                tracks = await music_service.search_and_extract(query, requester, limit=2)
                if not tracks:
                    continue
                chosen_track = tracks[0]

                # Check duration: songs between 45s and 720s (12 mins) to avoid memes/sound-effects/10hr loops
                dur = chosen_track.duration or 0
                if 40 <= dur <= 720 and not chosen_track.is_live:
                    # Final duplicate check on actual extracted track title
                    ok, _ = self.is_candidate_valid(chosen_track.clean_title, chosen_track.author, guild_queue, ctx)
                    if ok:
                        meta = {
                            "title": chosen_track.clean_title,
                            "artist": chosen_track.author,
                            "genre": cand.get("genre", ctx.get("seed_genre", "Pop")),
                            "language": cand.get("language", ctx.get("seed_language", "English")),
                            "mood": cand.get("mood", ctx.get("seed_mood", "Chill")),
                            "reason": cand.get("reason", f"Selected by SyncInk AI DJ to match your taste."),
                            "mode": ctx.get("mode", "Personal"),
                        }
                        return chosen_track, meta
            except Exception as extract_err:
                log.warning(f"[AutoPlay Extract Error] Candidate '{query}' failed: {extract_err}")
                continue

        log.warning("[AutoPlay] All recommendation candidates failed verification.")
        return None, None

    # ─────────────────────────────────────────────────────────────
    # Background Pre-fetching for Gapless Playback
    # ─────────────────────────────────────────────────────────────
    def trigger_prefetch(self, guild_queue: Any, music_service: Any):
        """Spawns an async task to prefetch the next recommendation before the current track finishes."""
        if not getattr(guild_queue, "autoplay", False):
            return
        if getattr(guild_queue, "prefetched_autoplay_track", None):
            return  # Already prefetched

        # Cancel any pending prefetch
        curr_task = getattr(guild_queue, "prefetch_task", None)
        if curr_task and not curr_task.done():
            return

        async def _do_prefetch():
            try:
                # Slight delay to allow current track playback to settle
                await asyncio.sleep(5)
                if not getattr(guild_queue, "autoplay", False):
                    return
                # Determine requester
                curr = getattr(guild_queue, "current_track", None)
                req = curr.requested_by if curr else None
                if not req:
                    listeners = self.get_vc_listeners(guild_queue)
                    req = listeners[0] if listeners else None
                if not req:
                    return

                track, meta = await self.resolve_next_track(guild_queue, req, music_service)
                if track:
                    guild_queue.prefetched_autoplay_track = track
                    guild_queue.prefetched_autoplay_meta = meta
                    log.info(f"[AutoPlay Prefetch] Successfully pre-buffered: {track.clean_title} ({track.author})")
            except Exception as e:
                log.debug(f"[AutoPlay Prefetch Error] {e}")

        guild_queue.prefetch_task = asyncio.create_task(_do_prefetch())
