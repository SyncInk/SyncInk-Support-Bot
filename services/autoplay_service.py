"""
services/autoplay_service.py
Audia AI — Intelligent, Next-Generation Music Companion for SyncInk Platform.

Features:
- Individual user music taste profiles with permanent memory of all played songs.
- Tracks full listens, early skips, and queue deletions per member.
- Multi-tier recommendations powered by Audia AI:
    * Tier 1: Google Gemini (gemini-flash-lite-latest / gemini-3.1-flash-lite / gemini-3.8-flash)
    * Tier 2: OpenAI / OpenRouter
    * Tier 3: Built-in Heuristic Affinity Engine (250+ curated iconic tracks across all clusters)
- Strict Category & Genre Isolation (is_track_allowed_for_genre).
- Hard Language Isolation avoiding English-to-Hindi drift (is_track_allowed_for_language).
- Gapless background prefetching with upcoming track display in Queue embed.
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
        "keywords": ["arijit", "atif", "pritam", "shreya", "jubin", "kesariya", "tum hi ho", "channa mereya", "raataan lambiyan", "mast magan", "shayad", "hawayein", "samjhawan", "gerua", "zaalima"],
        "artists": ["Arijit Singh", "Atif Aslam", "Mohit Chauhan", "Jubin Nautiyal", "Shreya Ghoshal", "Pritam", "Darshan Raval", "Sachin-Jigar", "Armaan Malik", "Sunidhi Chauhan", "KK", "Vishal Mishra", "Sonu Nigam", "Alka Yagnik", "Neeraj Shridhar"],
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
            ("Kesariya", "Arijit Singh, Pritam"),
            ("Mast Magan", "Arijit Singh, Chinmayi"),
            ("Tum Hi Ho", "Arijit Singh, Mithoon"),
            ("Channa Mereya", "Arijit Singh, Pritam"),
            ("O Maahi", "Arijit Singh, Pritam"),
            ("Ruan Ruan", "Swanand Kirkire, Vishal Bhardwaj"),
            ("Shayad", "Arijit Singh, Pritam"),
            ("Kalank Title Track", "Arijit Singh, Pritam"),
            ("Gerua", "Arijit Singh, Antara Mitra"),
            ("Zaalima", "Arijit Singh, Harshdeep Kaur"),
            ("Samjhawan", "Arijit Singh, Shreya Ghoshal"),
            ("Humsafar", "Akhil Sachdeva, Mansheel Gujral"),
            ("Tera Ban Jaunga", "Akhil Sachdeva, Tulsi Kumar"),
            ("Dil Sambhal Ja Zara", "Arijit Singh, Mohd Irfan"),
            ("Ilahi", "Arijit Singh, Pritam"),
        ]
    },
    "hindi_indie_acoustic": {
        "genre": "Hindi Indie & Acoustic",
        "language": "Hindi",
        "mood": "Chill",
        "keywords": ["prateek", "anuv", "jasleen", "lucky ali", "ritviz", "twin strings", "baarishein", "choo lo", "alag aasmaan", "cold/mess", "kasoor", "husn", "mishri", "gul", "liggi"],
        "artists": ["Anuv Jain", "Prateek Kuhad", "The Local Train", "When Chai Met Toast", "Lucky Ali", "Twin Strings", "Jasleen Royal", "Ritviz", "Zaeden", "Anupam Roy", "Taba Chake", "Osho Jain"],
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
            ("Husn", "Anuv Jain"),
            ("Gul", "Anuv Jain"),
            ("Liggi", "Ritviz"),
            ("Kya Karoon", "Zaeden"),
            ("Riha", "Anuv Jain"),
            ("Dil Mere", "The Local Train"),
            ("Kaise Jiyun", "Twin Strings"),
            ("Jeena Jeena (Acoustic)", "Twin Strings"),
            ("Tu Aake Dekhle", "King"),
            ("Gulabo", "Anuv Jain"),
            ("Kahaani Suno 2.0", "Kaifi Khalil"),
            ("Waqt Ki Baatein", "Dream Note"),
            ("Aaftaab", "The Local Train"),
            ("Bikhra", "Abdul Hannan, Rovalio"),
            ("Iraaday", "Abdul Hannan, Rovalio"),
            ("Dooriyan", "Zaeden"),
        ]
    },
    "punjabi_hits": {
        "genre": "Punjabi Pop & Urban",
        "language": "Punjabi",
        "mood": "Energetic",
        "keywords": ["diljit", "ap dhillon", "karan aujla", "shubh", "sidhu", "b praak", "harrdy", "brown munde", "elevated", "chorni", "kinni kinni", "softly", "tauba tauba", "winning speech"],
        "artists": ["Diljit Dosanjh", "AP Dhillon", "Karan Aujla", "Shubh", "Sidhu Moose Wala", "B Praak", "Harrdy Sandhu", "Gurinder Gill", "Jassa Dhillon", "Amrit Maan", "Jordan Sandhu", "Prem Dhillon", "PropheC"],
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
            ("G.O.A.T.", "Diljit Dosanjh"),
            ("Insane", "AP Dhillon, Gurinder Gill"),
            ("Cheques", "Shubh"),
            ("Winning Speech", "Karan Aujla"),
            ("White Brown Black", "Avvy Sra, Karan Aujla"),
            ("295", "Sidhu Moose Wala"),
            ("The Last Ride", "Sidhu Moose Wala"),
            ("So High", "Sidhu Moose Wala"),
            ("Same Beef", "Bohemia, Sidhu Moose Wala"),
            ("Old Skool", "Prem Dhillon, Sidhu Moose Wala"),
            ("Chorni", "Sidhu Moose Wala, Divine"),
            ("We Rollin", "Shubh"),
            ("Elevated", "Shubh"),
            ("Mexico", "Karan Aujla"),
            ("Off Course", "Karan Aujla"),
        ]
    },
    "lofi_chill": {
        "genre": "Lo-Fi Beats & Chillhop",
        "language": "Instrumental / English",
        "mood": "Relaxing",
        "keywords": ["lofi", "chillhop", "shiloh", "kudasa", "potsu", "idealism", "jinsang", "kupla", "saib", "sleep beats", "study beats", "rain beats", "coffee beats", "slowed"],
        "artists": ["Shiloh Dynasty", "Kudasa", "potsu", "idealism", "Jinsang", "Kupla", "saib", "Elijah Who", "Tomppabeats", "Flovry", "Lofi Fruits Music", "SwuM", "In Love With A Ghost", "sarcastic sounds"],
        "sample_tracks": [
            ("Technicolor", "Kudasa"),
            ("Nagashi", "idealism"),
            ("Affection", "Jinsang"),
            ("I'm in Love with U, Sry", "Jinsang"),
            ("Controlla", "idealism"),
            ("im closing my eyes", "potsu, Shiloh Dynasty"),
            ("so far away", "saib"),
            ("Kingdom in Blue", "Kupla"),
            ("Again", "Wun Two"),
            ("Snowman", "WYS"),
            ("Warm Nights", "Xori"),
            ("Midnight Snack", "Purrple Cat"),
            ("aesthetic", "Tollan Kim"),
            ("Eternal Youth", "RUDE"),
            ("Coffee", "beabadoobee"),
            ("breakfast with you", "chilled cow"),
            ("sleepyhead", "passionfruit"),
            ("walk but in a garden", "LLusion"),
            ("rainy days", "Alfresco"),
            ("dreaming of you", "sarcastic sounds"),
            ("cherry blossom", "Prithvi"),
            ("lullaby", "Against All Logic"),
            ("afternoon tea", "Aiguille"),
            ("star gazing", "Kalaido"),
            ("nostalgia", "Kavv"),
        ]
    },
    "pop_rnb_hits": {
        "genre": "Pop & R&B Hits",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["weeknd", "bruno mars", "dua lipa", "ed sheeran", "ariana", "post malone", "bieber", "sza", "taylor", "blinding lights", "levitating", "cruel summer", "starboy"],
        "artists": ["The Weeknd", "Bruno Mars", "Dua Lipa", "Ed Sheeran", "Ariana Grande", "Post Malone", "Justin Bieber", "SZA", "Taylor Swift", "Harry Styles", "Billie Eilish", "Olivia Rodrigo", "Doja Cat", "Shawn Mendes"],
        "sample_tracks": [
            ("Blinding Lights", "The Weeknd"),
            ("Levitating", "Dua Lipa"),
            ("Die For You", "The Weeknd"),
            ("Save Your Tears", "The Weeknd"),
            ("As It Was", "Harry Styles"),
            ("That's What I Like", "Bruno Mars"),
            ("Kill Bill", "SZA"),
            ("Circles", "Post Malone"),
            ("Cruel Summer", "Taylor Swift"),
            ("Peaches", "Justin Bieber"),
            ("Starboy", "The Weeknd"),
            ("Shape of You", "Ed Sheeran"),
            ("Attention", "Charlie Puth"),
            ("Watermelon Sugar", "Harry Styles"),
            ("Sunflower", "Post Malone, Swae Lee"),
            ("Stay", "The Kid LAROI, Justin Bieber"),
            ("Bad Habits", "Ed Sheeran"),
            ("Ghost", "Justin Bieber"),
            ("Flowers", "Miley Cyrus"),
            ("Snooze", "SZA"),
            ("Positions", "Ariana Grande"),
            ("Havana", "Camila Cabello"),
            ("Senorita", "Shawn Mendes, Camila Cabello"),
            ("Drivers License", "Olivia Rodrigo"),
            ("Vampire", "Olivia Rodrigo"),
        ]
    },
    "hiphop_rap": {
        "genre": "Hip-Hop & Rap",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["drake", "travis scott", "kendrick", "j. cole", "21 savage", "juice wrld", "future", "metro boomin", "eminem", "fein", "not like us", "sicko mode", "humble"],
        "artists": ["Drake", "Travis Scott", "Kendrick Lamar", "J. Cole", "21 Savage", "Juice WRLD", "Future", "Metro Boomin", "Eminem", "Post Malone", "Lil Baby", "Gunna", "Kanye West", "Central Cee"],
        "sample_tracks": [
            ("FE!N", "Travis Scott"),
            ("Not Like Us", "Kendrick Lamar"),
            ("God's Plan", "Drake"),
            ("No Role Modelz", "J. Cole"),
            ("Lucid Dreams", "Juice WRLD"),
            ("Rich Flex", "Drake, 21 Savage"),
            ("HUMBLE.", "Kendrick Lamar"),
            ("Mask Off", "Future"),
            ("Goosebumps", "Travis Scott"),
            ("SICKO MODE", "Travis Scott"),
            ("Rockstar", "Post Malone, 21 Savage"),
            ("Congratulations", "Post Malone, Quavo"),
            ("XO Tour Llif3", "Lil Uzi Vert"),
            ("First Person Shooter", "Drake, J. Cole"),
            ("Euphoria", "Kendrick Lamar"),
            ("All The Stars", "Kendrick Lamar, SZA"),
            ("Without Me", "Eminem"),
            ("Lose Yourself", "Eminem"),
            ("One Dance", "Drake, Wizkid, Kyla"),
            ("Praise The Lord", "A$AP Rocky, Skepta"),
            ("Redrum", "21 Savage"),
            ("Type Shit", "Future, Metro Boomin, Travis Scott"),
            ("Doja", "Central Cee"),
            ("Sprinter", "Dave, Central Cee"),
            ("Superhero", "Metro Boomin, Future, Chris Brown"),
        ]
    },
    "rock_indie": {
        "genre": "Alternative & Rock",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["coldplay", "imagine dragons", "linkin park", "arctic monkeys", "onerepublic", "queen", "nirvana", "radiohead", "yellow", "demons", "believer", "in the end"],
        "artists": ["Coldplay", "Imagine Dragons", "Linkin Park", "Arctic Monkeys", "OneRepublic", "The Neighbourhood", "twenty one pilots", "The Killers", "Hozier", "Lumineers", "Of Monsters and Men"],
        "sample_tracks": [
            ("Yellow", "Coldplay"),
            ("Demons", "Imagine Dragons"),
            ("In The End", "Linkin Park"),
            ("Do I Wanna Know?", "Arctic Monkeys"),
            ("Counting Stars", "OneRepublic"),
            ("Sweater Weather", "The Neighbourhood"),
            ("Viva La Vida", "Coldplay"),
            ("Believer", "Imagine Dragons"),
            ("Numb", "Linkin Park"),
            ("Radioactive", "Imagine Dragons"),
            ("Fix You", "Coldplay"),
            ("The Scientist", "Coldplay"),
            ("505", "Arctic Monkeys"),
            ("R U Mine?", "Arctic Monkeys"),
            ("Pompeii", "Bastille"),
            ("Somebody That I Used To Know", "Gotye, Kimbra"),
            ("Take Me to Church", "Hozier"),
            ("Little Talks", "Of Monsters and Men"),
            ("Ho Hey", "The Lumineers"),
            ("Mr. Brightside", "The Killers"),
            ("Iris", "Goo Goo Dolls"),
            ("Stressed Out", "twenty one pilots"),
            ("Ride", "twenty one pilots"),
            ("Heathens", "twenty one pilots"),
            ("Bones", "Imagine Dragons"),
        ]
    },
    "edm_dance": {
        "genre": "EDM & Dance",
        "language": "English",
        "mood": "Energetic",
        "keywords": ["alan walker", "chainsmokers", "marshmello", "avicii", "martin garrix", "dj snake", "calvin harris", "david guetta", "faded", "closer", "wake me up", "animals", "summer"],
        "artists": ["Alan Walker", "The Chainsmokers", "Marshmello", "Avicii", "Martin Garrix", "Calvin Harris", "DJ Snake", "Kygo", "David Guetta", "Skrillex", "Zedd", "Tiësto", "Illenium", "Hardwell"],
        "sample_tracks": [
            ("Faded", "Alan Walker"),
            ("Closer", "The Chainsmokers"),
            ("Wake Me Up", "Avicii"),
            ("Animals", "Martin Garrix"),
            ("Summer", "Calvin Harris"),
            ("Happier", "Marshmello"),
            ("Firestone", "Kygo"),
            ("Lean On", "Major Lazer, DJ Snake"),
            ("Titanium", "David Guetta, Sia"),
            ("Don't You Worry Child", "Swedish House Mafia"),
            ("The Nights", "Avicii"),
            ("Clarity", "Zedd, Foxes"),
            ("Heroes", "Alesso, Tove Lo"),
            ("Stay The Night", "Zedd, Hayley Williams"),
            ("Something Just Like This", "The Chainsmokers, Coldplay"),
            ("Roses", "The Chainsmokers, ROZES"),
            ("Silence", "Marshmello, Khalid"),
            ("Scared to Be Lonely", "Martin Garrix, Dua Lipa"),
            ("Without You", "Avicii, Sandro Cavazza"),
            ("Levels", "Avicii"),
            ("This Is What You Came For", "Calvin Harris, Rihanna"),
            ("One Kiss", "Calvin Harris, Dua Lipa"),
            ("Alone", "Alan Walker"),
            ("Spectre", "Alan Walker"),
            ("In The Name Of Love", "Martin Garrix, Bebe Rexha"),
        ]
    },
    "kpop": {
        "genre": "K-Pop",
        "language": "Korean",
        "mood": "Energetic",
        "keywords": ["bts", "blackpink", "newjeans", "twice", "stray kids", "aespa", "le sserafim", "dynamite", "how you like that", "hype boy", "super shy", "supernova", "cupid", "seven"],
        "artists": ["BTS", "BLACKPINK", "NewJeans", "TWICE", "Stray Kids", "aespa", "LE SSERAFIM", "IVE", "SEVENTEEN", "ITZY", "TXT", "ENHYPEN", "Red Velvet", "EXO", "IU", "Jungkook"],
        "sample_tracks": [
            ("Dynamite", "BTS"),
            ("How You Like That", "BLACKPINK"),
            ("Hype Boy", "NewJeans"),
            ("Super Shy", "NewJeans"),
            ("What is Love?", "TWICE"),
            ("S-Class", "Stray Kids"),
            ("Supernova", "aespa"),
            ("Butter", "BTS"),
            ("OMG", "NewJeans"),
            ("Ditto", "NewJeans"),
            ("Pink Venom", "BLACKPINK"),
            ("DDU-DU DDU-DU", "BLACKPINK"),
            ("Cupid", "FIFTY FIFTY"),
            ("Magnetic", "ILLIT"),
            ("Perfect Night", "LE SSERAFIM"),
            ("Seven", "Jungkook, Latto"),
            ("Standing Next to You", "Jungkook"),
            ("Like Crazy", "Jimin"),
            ("God's Menu", "Stray Kids"),
            ("MANIAC", "Stray Kids"),
            ("LOVE DIVE", "IVE"),
            ("After LIKE", "IVE"),
            ("Queencard", "(G)I-DLE"),
            ("Smart", "LE SSERAFIM"),
            ("Armageddon", "aespa"),
        ]
    },
    "japanese_anime": {
        "genre": "J-Pop & Anime",
        "language": "Japanese",
        "mood": "Energetic",
        "keywords": ["yoasobi", "kenshi yonezu", "lisa", "eve", "radwimps", "aimyon", "ado", "idol", "lemon", "gurenge", "shinunoga e-wa", "sparkle", "unravel", "kick back"],
        "artists": ["YOASOBI", "Kenshi Yonezu", "LiSA", "Eve", "RADWIMPS", "Aimyon", "Ado", "Official HIGE DANDism", "Vaundy", "Fujii Kaze", "Aimer", "TK from Ling tosite sigure"],
        "sample_tracks": [
            ("Idol", "YOASOBI"),
            ("Lemon", "Kenshi Yonezu"),
            ("Gurenge", "LiSA"),
            ("Racing into the Night", "YOASOBI"),
            ("Kaikai Kitan", "Eve"),
            ("Sparkle", "RADWIMPS"),
            ("Usseewa", "Ado"),
            ("Marigold", "Aimyon"),
            ("Shinunoga E-Wa", "Fujii Kaze"),
            ("Blue Bird", "Ikimonogakari"),
            ("Silhouette", "KANA-BOON"),
            ("Kick Back", "Kenshi Yonezu"),
            ("unravel", "TK from Ling tosite sigure"),
            ("Suzume", "RADWIMPS, Toaka"),
            ("Nandemonaiya", "RADWIMPS"),
            ("Zenzenzense", "RADWIMPS"),
            ("Homura", "LiSA"),
            ("Cry Baby", "Official HIGE DANDism"),
            ("Peace Sign", "Kenshi Yonezu"),
            ("Crossing Field", "LiSA"),
        ]
    }
}

# ─────────────────────────────────────────────────────────────
# Record Labels, Corporate Channels & Multi-Artist Channels
# (These must NOT be treated as individual artists in profiles)
# ─────────────────────────────────────────────────────────────
INDIAN_RECORD_LABELS = {
    "t-series", "tseries", "t-series apna punjab", "t-series regional",
    "sony music india", "sony music", "sonymusicindiavevo", "sony music south",
    "zee music company", "zee music", "zeemusic", "zee music south",
    "tips official", "tips music", "tips punjabi", "tips bhojpuri",
    "speed records", "speed records bhojpuri",
    "yrf", "yash raj films", "yrf music",
    "saregama", "saregama music", "saregama hum bhojpuri", "saregama telugu",
    "geet mp3", "geetmp3", "white hill music", "white hill dhangar",
    "deshi music", "dm - desi melodies", "desi melodies",
    "dhvani", "eros now", "eros now music", "shemaroo", "shemaroo filmi gaane",
    "venus", "venus music", "aditya music", "adityamusic",
    "lahari music", "times music", "times music hub", "rajshri",
    "panj-aab records", "single track studios", "vyrl originals", "vyrl",
    "jiosaavn", "gaana", "hungama", "t-series classics"
}

GENERIC_CHANNELS = {
    "vevo", "official audio", "official video", "records", "music",
    "warner music", "universal music group", "atlantic records", "interscope",
    "def jam", "columbia records", "rca records", "epic records"
}

INDIC_ARTISTS = {
    "arijit singh", "atif aslam", "pritam", "badshah", "diljit dosanjh",
    "karan aujla", "shubh", "sidhu moose wala", "sidhu moosewala", "jubin nautiyal",
    "neha kakkar", "darshan raval", "armaan malik", "mohit chauhan",
    "shreya ghoshal", "anuv jain", "prateek kuhad", "b praak", "jasleen royal",
    "yo yo honey singh", "honey singh", "raftaar", "emiway bantai", "mc stan",
    "divine", "king", "ritviz", "the local train", "when chai met toast",
    "sonu nigam", "alka yagnik", "kumar sanu", "udit narayan", "lata mangeshkar",
    "kishore kumar", "rd burman", "sachin-jigar", "sachin jigar", "mithoon",
    "harrdy sandhu", "guru randhawa", "jass manak", "amrit maan", "jassa dhillon",
    "gurinder gill", "ap dhillon", "twin strings", "sanju rathod", "pawan singh",
    "khesari lal yadav", "anirudh ravichander", "ar rahman", "a.r. rahman",
    "sid sriram", "devi sri prasad", "thaman s", "harris jayaraj", "vishal mishra",
    "tanishk bagchi", "tulsi kumar", "dhvani bhanushali", "shaan", "sunidhi chauhan",
    "monali thakur", "shankar-ehsaan-loy", "shankar mahadevan", "vishal-shekhar"
}

INDIC_TITLE_KEYWORDS = [
    "tum", "hum", "dil", "pyar", "ishq", "mohabbat", "zindagi", "teri", "mera", "meri",
    "kabhi", "hawa", "saath", "tere", "mere", "aankhon", "raatan", "diyan", "gallan",
    "pyaar", "deewana", "dhadkan", "channa", "mereya", "kesariya", "rang", "aashiqui",
    "sanam", "sajna", "dhol", "bhangra", "nachle", "punjabi", "yaar", "jatt", "shinda",
    "kurti", "pind", "akhiyan", "surma", "gabru", "patiala", "jhumka", "thumka", "laung",
    "gaddi", "soch", "judai", "bewafa", "dhokha", "dard", "khushi", "dua", "khuda",
    "rabba", "maahi", "sohniye", "heeriye", "ranjha", "leke", "aana", "chura", "liya"
]

def extract_real_artist(title: str, author: str) -> str:
    """
    If author is a corporate label (e.g. 'T-Series', 'Sony Music India'),
    extracts the actual performing artist from the track title.
    """
    a_clean = (author or "").strip()
    a_low = a_clean.lower()
    if any(label in a_low for label in INDIAN_RECORD_LABELS) or any(gen in a_low for gen in GENERIC_CHANNELS):
        if " - " in title:
            parts = title.split(" - ", 1)
            candidate_art = parts[0].strip()
            if len(candidate_art) > 1 and not any(l in candidate_art.lower() for l in INDIAN_RECORD_LABELS):
                return candidate_art
        if " | " in title:
            parts = title.split(" | ")
            for p in parts:
                p_clean = p.strip()
                p_low = p_clean.lower()
                if not any(l in p_low for l in INDIAN_RECORD_LABELS) and not any(tag in p_low for tag in ["official", "video", "lyric", "audio"]):
                    for ind in INDIC_ARTISTS:
                        if ind in p_low:
                            return ind.title()
    return a_clean

def is_track_allowed_for_language(title: str, artist: str, target_language: Optional[str]) -> Tuple[bool, str]:
    """
    Hard-validates whether a candidate or extracted track strictly matches the target language.
    Guarantees that when English is chosen, Hindi/Bollywood/Punjabi songs and Indian record labels
    are unconditionally blocked, avoiding any language drift.
    """
    if not target_language or target_language.lower() in ("reset", "auto", "any language (auto)", "all languages / dynamic"):
        return True, "Dynamic language adaptation"

    t_low = title.lower().strip()
    a_low = artist.lower().strip()
    lang = target_language.lower()

    if "hindi + english" in lang:
        return True, "Bilingual mode accepts Hindi and English"

    if "english" in lang:
        # 1. Block Indian record labels / corporate channels
        for label in INDIAN_RECORD_LABELS:
            if label in a_low or label in t_low:
                return False, f"Channel/Artist '{artist}' is an Indian record label ({label}); blocked under English preference."

        # 2. Block Devanagari (\u0900-\u097F) and Gurmukhi (\u0A00-\u0A7F) Indic scripts
        if re.search(r'[\u0900-\u097F]', title) or re.search(r'[\u0A00-\u0A7F]', title):
            return False, "Title contains Indic script (Devanagari/Gurmukhi); blocked under English preference."
        if re.search(r'[\u0900-\u097F]', artist) or re.search(r'[\u0A00-\u0A7F]', artist):
            return False, "Artist contains Indic script (Devanagari/Gurmukhi); blocked under English preference."

        # 3. Block known Indic artists
        for ind_art in INDIC_ARTISTS:
            if ind_art in a_low or ind_art in t_low:
                return False, f"Artist '{artist}' is known for Hindi/Indic music; blocked under English preference."

        # 4. Block known Indic keywords
        for kw in INDIC_TITLE_KEYWORDS:
            if re.search(rf'\b{re.escape(kw)}\b', t_low):
                return False, f"Title contains Indic keyword '{kw}'; blocked under English preference."

        return True, "Valid English candidate"

    if "hindi" in lang:
        is_indic = False
        if re.search(r'[\u0900-\u097F]', title) or re.search(r'[\u0900-\u097F]', artist):
            is_indic = True
        for ind_art in INDIC_ARTISTS:
            if ind_art in a_low or ind_art in t_low:
                is_indic = True
                break
        for kw in INDIC_TITLE_KEYWORDS:
            if kw in t_low:
                is_indic = True
                break
        for label in INDIAN_RECORD_LABELS:
            if label in a_low or label in t_low:
                is_indic = True
                break
        if not is_indic:
            cl = MUSIC_CLUSTERS.get("bollywood_romantic", {})
            if any(art.lower() in a_low for art in cl.get("artists", [])):
                is_indic = True
        if not is_indic:
            return False, f"Track '{artist} - {title}' does not match Hindi/Bollywood focus."
        return True, "Valid Hindi candidate"

    if "punjabi" in lang:
        punjabi_artists = MUSIC_CLUSTERS.get("punjabi_hits", {}).get("artists", [])
        is_punjabi = any(p.lower() in a_low or p.lower() in t_low for p in punjabi_artists) or "punjabi" in t_low or re.search(r'[\u0A00-\u0A7F]', title)
        if not is_punjabi:
            for pa in ["diljit", "ap dhillon", "karan aujla", "shubh", "sidhu", "b praak", "harrdy", "amrinder", "gurinder"]:
                if pa in a_low or pa in t_low:
                    is_punjabi = True
                    break
        if not is_punjabi:
            return False, f"Track '{artist} - {title}' does not match Punjabi focus."
        return True, "Valid Punjabi candidate"

    if "korean" in lang or "k-pop" in lang:
        kpop_artists = MUSIC_CLUSTERS.get("kpop", {}).get("artists", [])
        is_kpop = any(k.lower() in a_low for k in kpop_artists) or "k-pop" in t_low or "kpop" in t_low or re.search(r'[\uAC00-\uD7AF]', title)
        if not is_kpop:
            return False, f"Track '{artist} - {title}' is not K-Pop."
        return True, "Valid Korean candidate"

    if "japanese" in lang or "anime" in lang:
        jpop_artists = MUSIC_CLUSTERS.get("japanese_anime", {}).get("artists", [])
        is_jpop = any(j.lower() in a_low for j in jpop_artists) or "anime" in t_low or re.search(r'[\u3040-\u30FF\u4E00-\u9FAF]', title)
        if not is_jpop:
            return False, f"Track '{artist} - {title}' is not Japanese/Anime."
        return True, "Valid Japanese candidate"

    return True, "Accepted"

def is_track_allowed_for_genre(title: str, artist: str, target_genre: Optional[str]) -> Tuple[bool, str]:
    """
    Validates whether a candidate or extracted track strictly matches the target category/genre.
    Guarantees that genre selections (Lo-Fi, Punjabi Pop, EDM, K-Pop, Romantic, Hip-Hop, Indie)
    do not drift into unwanted categories or conflicting musical styles.
    """
    if not target_genre or target_genre.lower() in ("reset", "auto", "dynamic", "auto-detect", "all genres", "none"):
        return True, "Dynamic category adaptation"

    t_low = title.lower().strip()
    a_low = artist.lower().strip()
    genre_norm = target_genre.lower().strip()

    # 1. Lo-Fi Beats & Chillhop
    if any(k in genre_norm for k in ("lo-fi", "lofi", "chillhop")):
        for bad_kw in ("hardstyle", "club mix", "party mix", "bhangra", "drill", "metal", "heavy rock", "dj remix"):
            if bad_kw in t_low:
                return False, f"Track contains aggressive tag '{bad_kw}'; rejected under Lo-Fi & Chill category."
        lofi_cluster = MUSIC_CLUSTERS.get("lofi_chill", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in lofi_cluster.get("artists", [])):
            return True, "Verified Lo-Fi artist"
        for kw in lofi_cluster.get("keywords", []) + ["lo-fi", "lofi", "chillhop", "study", "relax", "rain", "sleep", "coffee", "ambient", "slowed"]:
            if kw in t_low or kw in a_low:
                return True, "Verified Lo-Fi keyword match"
        return False, f"Track '{artist} - {title}' does not match Lo-Fi Beats & Chillhop."

    # 2. Punjabi Pop & Urban
    if "punjabi" in genre_norm:
        punjabi_cluster = MUSIC_CLUSTERS.get("punjabi_hits", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in punjabi_cluster.get("artists", [])):
            return True, "Verified Punjabi artist"
        if re.search(r'[\u0A00-\u0A7F]', title) or re.search(r'[\u0A00-\u0A7F]', artist):
            return True, "Verified Punjabi Gurmukhi script"
        for kw in punjabi_cluster.get("keywords", []) + ["punjabi", "bhangra", "jatt", "pind", "gabru", "surma", "yaar", "patiala"]:
            if kw in t_low or kw in a_low:
                return True, "Verified Punjabi keyword match"
        return False, f"Track '{artist} - {title}' does not match Punjabi Pop & Urban."

    # 3. K-Pop
    if "k-pop" in genre_norm or "kpop" in genre_norm or "korean" in genre_norm:
        kpop_cluster = MUSIC_CLUSTERS.get("kpop", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in kpop_cluster.get("artists", [])):
            return True, "Verified K-Pop artist"
        if re.search(r'[\uAC00-\uD7AF]', title) or re.search(r'[\uAC00-\uD7AF]', artist):
            return True, "Verified Korean Hangul script"
        for kw in kpop_cluster.get("keywords", []) + ["k-pop", "kpop", "ost", "korean"]:
            if kw in t_low or kw in a_low:
                return True, "Verified K-Pop keyword match"
        return False, f"Track '{artist} - {title}' does not match K-Pop."

    # 4. EDM & Dance
    if any(k in genre_norm for k in ("edm", "dance", "electronic", "house")):
        edm_cluster = MUSIC_CLUSTERS.get("edm_dance", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in edm_cluster.get("artists", [])):
            return True, "Verified EDM artist"
        for kw in edm_cluster.get("keywords", []) + ["edm", "dance", "remix", "drop", "club", "house", "electro", "bass", "festival"]:
            if kw in t_low or kw in a_low:
                return True, "Verified EDM keyword match"
        return False, f"Track '{artist} - {title}' does not match EDM & Dance."

    # 5. Hip-Hop & Rap
    if any(k in genre_norm for k in ("hip-hop", "hip hop", "rap", "trap")):
        hiphop_cluster = MUSIC_CLUSTERS.get("hiphop_rap", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in hiphop_cluster.get("artists", [])):
            return True, "Verified Hip-Hop artist"
        for kw in hiphop_cluster.get("keywords", []) + ["hip-hop", "hiphop", "rap", "trap", "freestyle", "cypher"]:
            if kw in t_low or kw in a_low:
                return True, "Verified Hip-Hop keyword match"
        return False, f"Track '{artist} - {title}' does not match Hip-Hop & Rap."

    # 6. Romantic & Soulful / Bollywood Romantic
    if "romantic" in genre_norm or "soulful" in genre_norm:
        for bad_kw in ("hardstyle", "drill", "death metal", "heavy bass", "screamo"):
            if bad_kw in t_low:
                return False, f"Track contains aggressive tag '{bad_kw}'; rejected under Romantic & Soulful category."
        rom_cluster = MUSIC_CLUSTERS.get("bollywood_romantic", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in rom_cluster.get("artists", [])):
            return True, "Verified Romantic artist"
        for kw in rom_cluster.get("keywords", []) + ["love", "heart", "dil", "pyar", "ishq", "romantic", "soulful", "acoustic", "slow", "ballad"]:
            if kw in t_low or kw in a_low:
                return True, "Verified Romantic keyword match"
        return True, "Accepted under Romantic category"

    # 7. Indie & Acoustic
    if "indie" in genre_norm or "acoustic" in genre_norm:
        indie_cluster = MUSIC_CLUSTERS.get("hindi_indie_acoustic", {})
        if any(art.lower() in a_low or a_low in art.lower() for art in indie_cluster.get("artists", [])):
            return True, "Verified Indie artist"
        for kw in indie_cluster.get("keywords", []) + ["indie", "acoustic", "unplugged", "coffee", "live session", "folk"]:
            if kw in t_low or kw in a_low:
                return True, "Verified Indie keyword match"
        return True, "Accepted under Indie category"

    return True, "Category matched"

def normalize_title(title: str) -> str:
    """Normalize song title to remove video metadata and detect alternate uploads."""
    t = (title or "").lower()
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

    generic_words = {"love", "you", "me", "night", "day", "life", "time", "home", "heart", "baby", "girl", "boy", "one", "stay", "fire", "bad", "good"}
    if min_len == 1 and len(intersection) == 1:
        single_word = list(intersection)[0]
        if single_word in generic_words:
            return words1 == words2
        return len(single_word) >= 4 and max_len <= 4

    if len(intersection) >= 2:
        return len(intersection) >= min_len or (len(intersection) / max_len >= 0.5)

    return False

# ─────────────────────────────────────────────────────────────
# User Profile with Comprehensive Memory & Per-Member Tracking
# ─────────────────────────────────────────────────────────────
class UserMusicProfile:
    """
    Persistent preference profile for an individual user.
    Maintains complete listening memory: played tracks, full listens, skips, deletions,
    and granular artist/genre/language affinities.
    Every member has a distinct, isolated profile.
    """
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
        self.discovery_mode: str = data.get("discovery_mode", "balanced")
        self.manual_genre: Optional[str] = data.get("manual_genre")
        self.manual_mood: Optional[str] = data.get("manual_mood")
        self.manual_language: Optional[str] = data.get("manual_language")
        self.recently_played: List[Dict[str, Any]] = data.get("recently_played", [])
        self.total_listened: int = data.get("total_listened", 0)

        # Memorized song catalog (every track ever played/listened to by this member)
        self.memorized_tracks: List[Dict[str, Any]] = data.get("memorized_tracks", [])
        self.track_play_counts: Dict[str, int] = data.get("track_play_counts", {})
        self.artist_play_counts: Dict[str, int] = data.get("artist_play_counts", {})

        # Member skip tracking
        self.skipped_tracks: List[Dict[str, Any]] = data.get("skipped_tracks", [])
        self.track_skip_counts: Dict[str, int] = data.get("track_skip_counts", {})
        self.artist_skip_counts: Dict[str, int] = data.get("artist_skip_counts", {})

        # Member queue deletions / removals tracking
        self.deleted_tracks: List[Dict[str, Any]] = data.get("deleted_tracks", [])
        self.track_delete_counts: Dict[str, int] = data.get("track_delete_counts", {})
        self.artist_delete_counts: Dict[str, int] = data.get("artist_delete_counts", {})

        # Completed full listens
        self.completed_listens: int = data.get("completed_listens", 0)
        self.total_listen_seconds: float = float(data.get("total_listen_seconds", 0.0))
        self.track_completion_counts: Dict[str, int] = data.get("track_completion_counts", {})

        # Sanitize artist affinity and play counts by purging corporate labels and channel names
        for label in INDIAN_RECORD_LABELS.union(GENERIC_CHANNELS):
            for k in list(self.artist_affinity.keys()):
                if k.lower() == label or label in k.lower():
                    self.artist_affinity.pop(k, None)
            for k in list(self.artist_play_counts.keys()):
                if k.lower() == label or label in k.lower():
                    self.artist_play_counts.pop(k, None)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "liked_tracks": self.liked_tracks[-200:],
            "disliked_tracks": self.disliked_tracks[-200:],
            "blocked_artists": list(set(self.blocked_artists))[:150],
            "artist_affinity": dict(sorted(self.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:100]),
            "genre_affinity": dict(sorted(self.genre_affinity.items(), key=lambda x: x[1], reverse=True)[:50]),
            "language_affinity": dict(sorted(self.language_affinity.items(), key=lambda x: x[1], reverse=True)[:30]),
            "mood_affinity": dict(sorted(self.mood_affinity.items(), key=lambda x: x[1], reverse=True)[:30]),
            "discovery_mode": self.discovery_mode,
            "manual_genre": self.manual_genre,
            "manual_mood": self.manual_mood,
            "manual_language": self.manual_language,
            "recently_played": self.recently_played[-100:],
            "total_listened": self.total_listened,
            "memorized_tracks": self.memorized_tracks[-500:],
            "track_play_counts": dict(sorted(self.track_play_counts.items(), key=lambda x: x[1], reverse=True)[:300]),
            "artist_play_counts": dict(sorted(self.artist_play_counts.items(), key=lambda x: x[1], reverse=True)[:200]),
            "skipped_tracks": self.skipped_tracks[-200:],
            "track_skip_counts": dict(sorted(self.track_skip_counts.items(), key=lambda x: x[1], reverse=True)[:200]),
            "artist_skip_counts": dict(sorted(self.artist_skip_counts.items(), key=lambda x: x[1], reverse=True)[:150]),
            "deleted_tracks": self.deleted_tracks[-200:],
            "track_delete_counts": dict(sorted(self.track_delete_counts.items(), key=lambda x: x[1], reverse=True)[:200]),
            "artist_delete_counts": dict(sorted(self.artist_delete_counts.items(), key=lambda x: x[1], reverse=True)[:150]),
            "completed_listens": self.completed_listens,
            "total_listen_seconds": round(self.total_listen_seconds, 1),
            "track_completion_counts": dict(sorted(self.track_completion_counts.items(), key=lambda x: x[1], reverse=True)[:200]),
        }

    def is_artist_blocked(self, artist: str) -> bool:
        a_low = (artist or "").lower().strip()
        return any(b in a_low or a_low in b for b in self.blocked_artists)

    def is_track_disliked(self, title: str, artist: str) -> bool:
        for d in self.disliked_tracks:
            if titles_are_similar(d.get("title", ""), title):
                d_art = d.get("artist", "").lower().strip()
                t_art = (artist or "").lower().strip()
                if not d_art or d_art in t_art or t_art in d_art:
                    return True
        return False

# ─────────────────────────────────────────────────────────────
# Core Audia AI Service
# ─────────────────────────────────────────────────────────────
class AutoPlayService:
    """
    Core Audia AI Auto Play Service managing user taste profiles, AI prompting,
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
                except Exception as e:
                    log.warning(f"[AutoPlay] Failed to read .env: {e}")

        self._load_profiles()

    @classmethod
    def get_instance(cls) -> 'AutoPlayService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_profiles(self):
        """Loads persistent user preferences from disk."""
        if not os.path.exists(PROFILES_FILE):
            return
        try:
            with open(PROFILES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for uid_str, pdata in data.items():
                    try:
                        uid = int(uid_str)
                        self._profiles[uid] = UserMusicProfile(uid, pdata)
                    except ValueError:
                        continue
            log.info(f"[Audia AI] Successfully loaded {len(self._profiles)} listener taste profiles.")
        except Exception as e:
            log.error(f"[Audia AI] Failed to load taste profiles: {e}")

    def save_profiles(self):
        """Persists updated user profiles to disk."""
        os.makedirs(DATA_DIR, exist_ok=True)
        try:
            out = {str(uid): p.to_dict() for uid, p in self._profiles.items()}
            with open(PROFILES_FILE, "w", encoding="utf-8") as f:
                json.dump(out, f, indent=2, ensure_ascii=False)
        except Exception as e:
            log.error(f"[Audia AI] Failed to save taste profiles: {e}")

    def get_user_profile(self, user_id: int) -> UserMusicProfile:
        """Retrieves or creates a dedicated UserMusicProfile for a user."""
        if user_id not in self._profiles:
            self._profiles[user_id] = UserMusicProfile(user_id)
        return self._profiles[user_id]

    def record_track_play(self, user_id: int, track: Any, manual: bool = False):
        """Record when a user plays or queues a track, updating their memorized song catalog."""
        if not track or getattr(track, "is_radio", False) or user_id <= 0:
            return
        p = self.get_user_profile(user_id)
        p.total_listened += 1

        raw_artist = (getattr(track, "author", "") or "").strip()
        clean_title = getattr(track, "clean_title", None) or getattr(track, "title", "Unknown")
        real_artist = extract_real_artist(clean_title, raw_artist)
        cluster_info = self._detect_cluster(clean_title, real_artist)

        # 1. Update memorized tracks catalog
        t_norm = normalize_title(clean_title)
        track_key = f"{t_norm}::{real_artist.lower()}"
        p.track_play_counts[track_key] = p.track_play_counts.get(track_key, 0) + 1

        if real_artist and not any(l in real_artist.lower() for l in INDIAN_RECORD_LABELS.union(GENERIC_CHANNELS)):
            p.artist_play_counts[real_artist] = p.artist_play_counts.get(real_artist, 0) + 1

        entry = next((item for item in p.memorized_tracks if titles_are_similar(item.get("title", ""), clean_title) and item.get("artist", "").lower() == real_artist.lower()), None)
        if entry:
            entry["play_count"] = entry.get("play_count", 1) + 1
            entry["last_played"] = time.time()
            if manual:
                entry["manual_plays"] = entry.get("manual_plays", 0) + 1
        else:
            p.memorized_tracks.append({
                "title": clean_title,
                "artist": real_artist,
                "genre": cluster_info.get("genre", "Pop"),
                "language": cluster_info.get("language", "English"),
                "mood": cluster_info.get("mood", "Chill"),
                "play_count": 1,
                "manual_plays": 1 if manual else 0,
                "first_played": time.time(),
                "last_played": time.time(),
            })
            if len(p.memorized_tracks) > 500:
                p.memorized_tracks = p.memorized_tracks[-500:]

        # 2. Affinity boosts
        boost = 1.0 if manual else 0.25
        if real_artist and not any(l in real_artist.lower() for l in INDIAN_RECORD_LABELS.union(GENERIC_CHANNELS)):
            p.artist_affinity[real_artist] = p.artist_affinity.get(real_artist, 0.0) + boost

        genre = cluster_info.get("genre")
        if genre:
            p.genre_affinity[genre] = p.genre_affinity.get(genre, 0.0) + (0.8 if manual else 0.2)

        lang = cluster_info.get("language")
        if lang:
            p.language_affinity[lang] = p.language_affinity.get(lang, 0.0) + (0.8 if manual else 0.2)

        mood = cluster_info.get("mood")
        if mood:
            p.mood_affinity[mood] = p.mood_affinity.get(mood, 0.0) + (0.5 if manual else 0.1)

        # 3. Recently played
        p.recently_played.append({
            "title": clean_title,
            "artist": real_artist,
            "timestamp": time.time(),
        })
        p.recently_played = p.recently_played[-50:]
        self.save_profiles()

    def record_track_skip(self, user_id: int, track: Any, listened_seconds: float, duration: Optional[int] = None):
        """
        Record when a track was skipped by a user.
        Captures full listening duration, skip ratio, and updates negative signals.
        """
        if not track or getattr(track, "is_radio", False) or user_id <= 0:
            return
        p = self.get_user_profile(user_id)
        raw_artist = (getattr(track, "author", "") or "").strip()
        clean_title = getattr(track, "clean_title", None) or getattr(track, "title", "Unknown")
        real_artist = extract_real_artist(clean_title, raw_artist)

        t_norm = normalize_title(clean_title)
        track_key = f"{t_norm}::{real_artist.lower()}"
        p.track_skip_counts[track_key] = p.track_skip_counts.get(track_key, 0) + 1
        if real_artist:
            p.artist_skip_counts[real_artist] = p.artist_skip_counts.get(real_artist, 0) + 1

        ratio = (listened_seconds / duration) if (duration and duration > 0) else None
        p.skipped_tracks.append({
            "title": clean_title,
            "artist": real_artist,
            "listened_seconds": round(listened_seconds, 1),
            "duration": duration,
            "ratio": round(ratio, 2) if ratio is not None else None,
            "timestamp": time.time(),
        })
        p.skipped_tracks = p.skipped_tracks[-200:]

        if listened_seconds < 35.0 or (ratio is not None and ratio < 0.25):
            penalty = 0.8
            if p.track_skip_counts[track_key] >= 2:
                penalty = 1.5
            if real_artist in p.artist_affinity:
                p.artist_affinity[real_artist] = max(-5.0, p.artist_affinity[real_artist] - penalty)

        self.save_profiles()

    def record_track_delete(self, user_id: int, track: Any, reason: str = "removed_from_queue"):
        """
        Record when a user actively removes/deletes a queued track before it plays.
        Explicit removal is a decisive indicator that the user dislikes or wanted to reject this song.
        """
        if not track or getattr(track, "is_radio", False) or user_id <= 0:
            return
        p = self.get_user_profile(user_id)
        raw_artist = (getattr(track, "author", "") or "").strip()
        clean_title = getattr(track, "clean_title", None) or getattr(track, "title", "Unknown")
        real_artist = extract_real_artist(clean_title, raw_artist)

        t_norm = normalize_title(clean_title)
        track_key = f"{t_norm}::{real_artist.lower()}"
        p.track_delete_counts[track_key] = p.track_delete_counts.get(track_key, 0) + 1
        if real_artist:
            p.artist_delete_counts[real_artist] = p.artist_delete_counts.get(real_artist, 0) + 1

        p.deleted_tracks.append({
            "title": clean_title,
            "artist": real_artist,
            "reason": reason,
            "timestamp": time.time(),
        })
        p.deleted_tracks = p.deleted_tracks[-200:]

        if real_artist and real_artist in p.artist_affinity:
            p.artist_affinity[real_artist] = max(-5.0, p.artist_affinity[real_artist] - 1.0)

        self.save_profiles()

    def record_track_completion(self, user_id: int, track: Any, played_seconds: float):
        """Record when a user listened through an entire track without skipping."""
        if not track or getattr(track, "is_radio", False) or user_id <= 0:
            return
        p = self.get_user_profile(user_id)
        p.completed_listens += 1
        p.total_listen_seconds += played_seconds

        raw_artist = (getattr(track, "author", "") or "").strip()
        clean_title = getattr(track, "clean_title", None) or getattr(track, "title", "Unknown")
        real_artist = extract_real_artist(clean_title, raw_artist)

        t_norm = normalize_title(clean_title)
        track_key = f"{t_norm}::{real_artist.lower()}"
        p.track_completion_counts[track_key] = p.track_completion_counts.get(track_key, 0) + 1

        if real_artist and not any(l in real_artist.lower() for l in INDIAN_RECORD_LABELS.union(GENERIC_CHANNELS)):
            p.artist_affinity[real_artist] = p.artist_affinity.get(real_artist, 0.0) + 0.4

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
        title = getattr(track, "clean_title", None) or getattr(track, "title", "Unknown")
        artist = (getattr(track, "author", "") or "").strip()
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
            return True, f"Saved **{title}** to your favorites! Audia AI will prioritize this style."

        elif feedback_type == "dislike":
            p.disliked_tracks.append({
                "title": title,
                "artist": artist,
                "timestamp": time.time()
            })
            p.artist_affinity[artist] = max(-5.0, p.artist_affinity.get(artist, 0.0) - 2.5)
            self.save_profiles()
            return True, f"Disliked **{title}**. Audia AI will avoid this style in upcoming recommendations."

        elif feedback_type == "more_like_this":
            p.artist_affinity[artist] = p.artist_affinity.get(artist, 0.0) + 3.0
            p.genre_affinity[genre] = p.genre_affinity.get(genre, 0.0) + 2.5
            p.manual_genre = genre
            self.save_profiles()
            return True, f"Audia AI focused on **{genre}** and songs by **{artist}**!"

        elif feedback_type == "block_artist":
            if artist.lower() not in p.blocked_artists:
                p.blocked_artists.append(artist.lower())
            p.artist_affinity[artist] = -10.0
            self.save_profiles()
            return True, f"Blocked **{artist}**. Audia AI will avoid this artist."

        return False, "Unknown feedback action."

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
        Prioritizes explicit user preferences (manual language / manual genre) so settings
        are NEVER lost or overridden during group listening or long sessions.
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

        recent_tracks = []
        if getattr(guild_queue, "history", None):
            for t in guild_queue.history[-6:]:
                recent_tracks.append(f"{t.author} - {t.clean_title}")

        blocked_artists: Set[str] = set()
        disliked_titles: Set[str] = set()

        primary_user = fallback_user or (listeners[0] if listeners else None)
        primary_prof = self.get_user_profile(primary_user.id) if primary_user else UserMusicProfile(0)

        # Check for explicit manual overrides first!
        manual_lang = primary_prof.manual_language
        manual_gen = primary_prof.manual_genre
        manual_mood = primary_prof.manual_mood

        if not manual_lang:
            for m in listeners:
                mp = self.get_user_profile(m.id)
                if mp.manual_language:
                    manual_lang = mp.manual_language
                    break

        if not manual_gen:
            for m in listeners:
                mp = self.get_user_profile(m.id)
                if mp.manual_genre:
                    manual_gen = mp.manual_genre
                    break

        if len(listeners) <= 1:
            # Personal Mode
            blocked_artists.update(primary_prof.blocked_artists)
            disliked_titles.update(d.get("title", "").lower() for d in primary_prof.disliked_tracks)

            top_artists = [a for a, _ in sorted(primary_prof.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:5]]
            top_genres = [g for g, _ in sorted(primary_prof.genre_affinity.items(), key=lambda x: x[1], reverse=True)[:3]]
            top_langs = [l for l, _ in sorted(primary_prof.language_affinity.items(), key=lambda x: x[1], reverse=True)[:2]]

            return {
                "mode": f"Personal ({primary_user.display_name if primary_user else 'Listener'})",
                "listener_count": 1,
                "requester_id": primary_user.id if primary_user else 0,
                "seed_title": seed_title,
                "seed_artist": seed_artist,
                "seed_genre": manual_gen or (top_genres[0] if top_genres else seed_cluster.get("genre", "Pop")),
                "seed_language": manual_lang or (top_langs[0] if top_langs else seed_cluster.get("language", "English")),
                "seed_mood": manual_mood or seed_cluster.get("mood", "Chill"),
                "top_artists": top_artists,
                "top_genres": top_genres,
                "top_languages": top_langs,
                "discovery_mode": primary_prof.discovery_mode,
                "recent_tracks": recent_tracks,
                "blocked_artists": list(blocked_artists),
                "disliked_titles": list(disliked_titles),
            }
        else:
            # Group Listening Mode
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

            top_artists = [a for a, _ in sorted(merged_artists.items(), key=lambda x: x[1], reverse=True)[:6]]
            top_genres = [g for g, _ in sorted(merged_genres.items(), key=lambda x: x[1], reverse=True)[:4]]
            top_langs = [l for l, _ in sorted(merged_langs.items(), key=lambda x: x[1], reverse=True)[:3]]

            chosen_disc = "explore" if discovery_modes.count("explore") > len(listeners) / 2 else "balanced"

            final_lang = manual_lang or (top_langs[0] if top_langs else seed_cluster.get("language", "English"))
            final_gen = manual_gen or (top_genres[0] if top_genres else seed_cluster.get("genre", "Pop"))

            return {
                "mode": f"Group ({len(listeners)} listeners)",
                "listener_count": len(listeners),
                "requester_id": primary_user.id if primary_user else 0,
                "seed_title": seed_title,
                "seed_artist": seed_artist,
                "seed_genre": final_gen,
                "seed_language": final_lang,
                "seed_mood": manual_mood or seed_cluster.get("mood", "Chill"),
                "top_artists": top_artists,
                "top_genres": top_genres,
                "top_languages": top_langs,
                "discovery_mode": chosen_disc,
                "recent_tracks": recent_tracks,
                "blocked_artists": list(blocked_artists),
                "disliked_titles": list(disliked_titles),
            }

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
        - User deletions and repeated skips memory
        - Strict language isolation
        - Strict genre / category conformity
        - Repetitive artists (artist diversity cooldown)
        """
        c_title_norm = normalize_title(candidate_title)
        c_artist_low = (candidate_artist or "").lower().strip()

        # 1. Blocked artists check
        for b in ctx_info.get("blocked_artists", []):
            if b in c_artist_low or c_artist_low in b:
                return False, f"Artist '{candidate_artist}' is on the blocked list."

        # 2. Disliked titles check
        for d in ctx_info.get("disliked_titles", []):
            if titles_are_similar(d, candidate_title):
                return False, f"Track '{candidate_title}' is marked disliked."

        # 3. User deletions & repeated skips memory check
        requester_id = ctx_info.get("requester_id", 0)
        if requester_id > 0:
            prof = self.get_user_profile(requester_id)
            c_key = f"{c_title_norm}::{c_artist_low}"
            if prof.track_delete_counts.get(c_key, 0) >= 1:
                return False, f"Track '{candidate_title}' was previously deleted from queue."
            if prof.track_skip_counts.get(c_key, 0) >= 2:
                return False, f"Track '{candidate_title}' was repeatedly skipped by listener."

        # 4. Check currently playing track
        curr = getattr(guild_queue, "current_track", None)
        if curr and titles_are_similar(curr.clean_title, candidate_title):
            return False, "Matches current playing song."

        # 5. Check upcoming tracks in queue
        for t in getattr(guild_queue, "tracks", []):
            if titles_are_similar(t.clean_title, candidate_title):
                return False, "Already queued."

        # 6. Check session history (last 40 songs in guild)
        session_hist = getattr(guild_queue, "session_played_history", [])
        for item in session_hist[-40:]:
            if titles_are_similar(item, candidate_title):
                return False, "Played recently in this session (cooldown active)."

        # 7. Artist diversity cooldown: avoid repeating the immediate last artist
        session_artists = getattr(guild_queue, "session_artists", [])
        if len(session_artists) >= 1 and session_artists[-1].lower() == c_artist_low:
            if ctx_info.get("discovery_mode") != "familiar":
                return False, f"Artist '{candidate_artist}' was just played (artist diversity cooldown)."

        # 8. Strict Language Isolation Check
        target_lang = ctx_info.get("seed_language")
        if target_lang:
            allowed, lang_reason = is_track_allowed_for_language(candidate_title, candidate_artist, target_lang)
            if not allowed:
                return False, lang_reason

        # 9. Strict Genre / Category Check
        target_genre = ctx_info.get("seed_genre")
        if target_genre:
            g_allowed, g_reason = is_track_allowed_for_genre(candidate_title, candidate_artist, target_genre)
            if not g_allowed:
                return False, g_reason

        return True, "Valid"

    # ─────────────────────────────────────────────────────────────
    # Tier 1 & 2: Remote AI Recommendations (Audia AI Engine)
    # ─────────────────────────────────────────────────────────────
    async def _fetch_ai_recommendations(self, ctx_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Invokes Gemini / OpenAI / OpenRouter for smart recommendations."""
        if self.gemini_key:
            res = await self._call_gemini_api(ctx_info)
            if res:
                return res

        if self.openai_key or self.openrouter_key:
            res = await self._call_openai_api(ctx_info)
            if res:
                return res

        return []

    async def _call_gemini_api(self, ctx_info: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Calls Gemini API with structured prompt for music recommendations."""
        seed_lang = str(ctx_info.get("seed_language", ""))
        seed_genre = str(ctx_info.get("seed_genre", ""))
        language_directive = ""

        if "Hindi + English" in seed_lang:
            language_directive = (
                "- BILINGUAL PREFERENCE: The listener wants a balanced blend of both Hindi songs "
                "(Bollywood Romantic, Hindi Indie, Urban) and English songs (Pop, Lo-Fi, Acoustic).\n"
            )
        elif "english" in seed_lang.lower():
            language_directive = (
                "- STRICT LANGUAGE: The listener has STRICTLY configured their language preference to: ENGLISH / INTERNATIONAL.\n"
                "- You are STRICTLY FORBIDDEN from suggesting ANY songs in Hindi, Punjabi, Bollywood, or any Indian regional language.\n"
                "- All recommendations MUST be mainstream international English songs by recognized Western / International English-singing artists.\n"
            )
        elif "hindi" in seed_lang.lower():
            language_directive = (
                "- STRICT LANGUAGE: The listener has STRICTLY configured their language preference to: HINDI / BOLLYWOOD.\n"
                "- All recommendations MUST be Hindi songs (Bollywood, Hindi Indie, Hindi Romantic).\n"
            )
        elif "punjabi" in seed_lang.lower():
            language_directive = (
                "- STRICT LANGUAGE: All recommendations MUST be Punjabi Pop / Urban Punjabi songs.\n"
            )

        genre_directive = f"- STRICT CATEGORY: All recommendations MUST strictly conform to the genre '{seed_genre}'.\n" if seed_genre else ""

        prompt = (
            f"Act as Audia AI, SyncInk's Elite Intelligent Music Companion.\n"
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
            f"- Blocked Artists: {', '.join(ctx_info['blocked_artists'][:5]) if ctx_info['blocked_artists'] else 'None'}\n"
            f"{language_directive}"
            f"{genre_directive}\n"
            f"TASK:\n"
            f"Generate 4 diverse, musically coherent song candidates that seamlessly follow this song.\n"
            f"Preserve the genre, language, and mood without any acoustic drift.\n"
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
            log.warning(f"[Audia AI] Gemini call failed: {e}")

        return None

    async def _call_openai_api(self, ctx_info: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Calls OpenAI / OpenRouter Chat Completions as secondary AI fallback."""
        key = self.openai_key or self.openrouter_key
        if not key:
            return None
        seed_lang = str(ctx_info.get("seed_language", ""))
        seed_genre = str(ctx_info.get("seed_genre", ""))
        language_note = ""
        if "Hindi + English" in seed_lang:
            language_note = "Blend both Hindi and English tracks. "
        elif "english" in seed_lang.lower():
            language_note = "STRICT: Suggest ONLY English songs by international artists. Absolutely NO Hindi, Bollywood or Punjabi songs. "
        elif "hindi" in seed_lang.lower():
            language_note = "STRICT: Suggest ONLY Hindi / Bollywood tracks. "
        elif "punjabi" in seed_lang.lower():
            language_note = "STRICT: Suggest ONLY Punjabi Pop tracks. "

        genre_note = f"Strictly match the category '{seed_genre}'. " if seed_genre else ""

        system_msg = (
            "You are Audia AI, SyncInk's Elite Intelligent Music Companion. "
            "Output ONLY a raw valid JSON array of 4 songs matching: "
            '[{"title": "Title", "artist": "Artist", "genre": "Genre", "language": "Language", "mood": "Mood", "reason": "Explanation"}]'
        )
        user_msg = (
            f"Seed song: '{ctx_info['seed_title']}' by {ctx_info['seed_artist']}. "
            f"Target Genre: {ctx_info['seed_genre']}. Language: {ctx_info['seed_language']}. "
            f"Mood: {ctx_info['seed_mood']}. {language_note}{genre_note}"
            f"Avoid recently played: {', '.join(ctx_info['recent_tracks'][:4])}. "
            f"Avoid blocked artists: {', '.join(ctx_info['blocked_artists'][:4])}."
        )

        base_url = "https://openrouter.ai/api/v1/chat/completions" if self.openrouter_key else "https://api.openai.com/v1/chat/completions"
        model_name = "google/gemini-2.5-flash" if self.openrouter_key else "gpt-4o-mini"

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.post(base_url, json=payload, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        raw_content = data["choices"][0]["message"]["content"].strip()
                        if raw_content.startswith("```"):
                            raw_content = re.sub(r"^```(?:json)?\n?", "", raw_content)
                            raw_content = re.sub(r"\n?```$", "", raw_content)
                        parsed = json.loads(raw_content.strip())
                        if isinstance(parsed, list) and len(parsed) > 0:
                            return parsed
        except Exception as e:
            log.warning(f"[Audia AI] OpenAI/OpenRouter fallback failed: {e}")

        return None

    def _detect_cluster(self, title: str, artist: str) -> Dict[str, Any]:
        """Identifies genre and linguistic cluster based on artist, title, or keywords."""
        t_low = (title or "").lower()
        a_low = (artist or "").lower()

        for key, cluster in MUSIC_CLUSTERS.items():
            for kw in cluster["keywords"]:
                if kw in t_low or kw in a_low:
                    return cluster

        for key, cluster in MUSIC_CLUSTERS.items():
            for art in cluster["artists"]:
                if art.lower() in a_low or a_low in art.lower():
                    return cluster

        return MUSIC_CLUSTERS["pop_rnb_hits"]

    def _get_heuristic_candidates(self, ctx_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates candidates from local affinity clusters when remote AI is offline."""
        target_lang = str(ctx_info.get("seed_language", "")).lower()
        target_genre = str(ctx_info.get("seed_genre", "")).lower()
        candidates = []

        # 1. Match specific target genre FIRST if set!
        if "lo-fi" in target_genre or "chillhop" in target_genre:
            cl = MUSIC_CLUSTERS.get("lofi_chill", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated Lo-Fi Beats candidate tailored to your chill study focus."
                })
        elif "punjabi" in target_genre or "punjabi" in target_lang:
            cl = MUSIC_CLUSTERS.get("punjabi_hits", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated Punjabi Pop candidate tailored to your Punjabi Urban focus."
                })
        elif "k-pop" in target_genre or "kpop" in target_genre or "korean" in target_lang:
            cl = MUSIC_CLUSTERS.get("kpop", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated K-Pop candidate tailored to your Asian Pop focus."
                })
        elif "edm" in target_genre or "dance" in target_genre:
            cl = MUSIC_CLUSTERS.get("edm_dance", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated EDM & Dance candidate tailored to your festival electronic focus."
                })
        elif "hip-hop" in target_genre or "rap" in target_genre:
            cl = MUSIC_CLUSTERS.get("hiphop_rap", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated Hip-Hop & Rap candidate tailored to your rhythm focus."
                })
        elif "romantic" in target_genre or "soulful" in target_genre:
            cl = MUSIC_CLUSTERS.get("bollywood_romantic", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated Romantic candidate tailored to your soulful melody focus."
                })
        elif "indie" in target_genre or "acoustic" in target_genre:
            cl = MUSIC_CLUSTERS.get("hindi_indie_acoustic", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated Indie & Acoustic candidate tailored to your acoustic vibes focus."
                })
        elif "japanese" in target_lang or "anime" in target_lang:
            cl = MUSIC_CLUSTERS.get("japanese_anime", {})
            for s_title, s_artist in cl.get("sample_tracks", []):
                candidates.append({
                    "title": s_title, "artist": s_artist, "genre": cl["genre"],
                    "language": cl["language"], "mood": cl["mood"],
                    "reason": "Curated J-Pop & Anime candidate."
                })

        # 2. If candidates are still needed and target language is strictly English / International
        if not candidates and "english" in target_lang:
            english_cluster_keys = ["pop_rnb_hits", "lofi_chill", "hiphop_rap", "rock_indie", "edm_dance"]
            samples = []
            for ck in english_cluster_keys:
                cl = MUSIC_CLUSTERS[ck]
                for s_title, s_artist in cl.get("sample_tracks", []):
                    if s_artist.lower() != ctx_info.get("seed_artist", "").lower():
                        samples.append({
                            "title": s_title,
                            "artist": s_artist,
                            "genre": cl["genre"],
                            "language": "English",
                            "mood": cl["mood"],
                            "reason": f"English recommendation ({cl['genre']}) tailored to your international focus."
                        })
            random.shuffle(samples)
            candidates.extend(samples)

        # 3. Bilingual mode: Hindi + English
        elif not candidates and "hindi + english" in target_lang:
            bilingual_samples = []
            for cluster_key in ["bollywood_romantic", "hindi_indie_acoustic", "pop_rnb_hits", "lofi_chill", "punjabi_hits"]:
                if cluster_key in MUSIC_CLUSTERS:
                    cl = MUSIC_CLUSTERS[cluster_key]
                    for s_title, s_artist in cl.get("sample_tracks", []):
                        if s_artist.lower() == ctx_info.get("seed_artist", "").lower():
                            continue
                        bilingual_samples.append({
                            "title": s_title,
                            "artist": s_artist,
                            "genre": cl["genre"],
                            "language": cl["language"],
                            "mood": cl["mood"],
                            "reason": f"Bilingual recommendation ({cl['genre']}) tailored to your Hindi & English mix."
                        })
            random.shuffle(bilingual_samples)
            candidates.extend(bilingual_samples)

        # 4. Strict Hindi
        elif not candidates and "hindi" in target_lang:
            hindi_cluster_keys = ["bollywood_romantic", "hindi_indie_acoustic"]
            samples = []
            for ck in hindi_cluster_keys:
                cl = MUSIC_CLUSTERS[ck]
                for s_title, s_artist in cl.get("sample_tracks", []):
                    if s_artist.lower() != ctx_info.get("seed_artist", "").lower():
                        samples.append({
                            "title": s_title,
                            "artist": s_artist,
                            "genre": cl["genre"],
                            "language": "Hindi",
                            "mood": cl["mood"],
                            "reason": f"Hindi recommendation ({cl['genre']}) tailored to your Bollywood focus."
                        })
            random.shuffle(samples)
            candidates.extend(samples)

        # 5. Default: adapt from seed cluster
        if not candidates:
            seed_cluster = self._detect_cluster(ctx_info.get("seed_title", ""), ctx_info.get("seed_artist", ""))
            samples = list(seed_cluster.get("sample_tracks", []))
            random.shuffle(samples)
            for s_title, s_artist in samples:
                if s_artist.lower() == ctx_info.get("seed_artist", "").lower():
                    continue
                candidates.append({
                    "title": s_title,
                    "artist": s_artist,
                    "genre": seed_cluster["genre"],
                    "language": seed_cluster["language"],
                    "mood": seed_cluster["mood"],
                    "reason": f"Heuristic candidate adapting from {seed_cluster['genre']}."
                })

        random.shuffle(candidates)
        return candidates[:25]

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
        4. Validates each candidate against anti-repetition, language, and category rules
        5. Extracts and verifies playable audio stream with duration bounds
        6. Returns (verified_Track, metadata)
        """
        # 1. Check if a pre-fetched track is already verified and waiting
        prefetched = getattr(guild_queue, "prefetched_autoplay_track", None)
        prefetched_meta = getattr(guild_queue, "prefetched_autoplay_meta", None)
        if prefetched:
            guild_queue.prefetched_autoplay_track = None
            guild_queue.prefetched_autoplay_meta = None
            valid, _ = self.is_candidate_valid(
                prefetched.clean_title, prefetched.author, guild_queue, prefetched_meta or {}
            )
            if valid:
                log.info(f"[Audia AI] Using gapless prefetched track: {prefetched.clean_title}")
                return prefetched, prefetched_meta

        # 2. Build context
        ctx = self.build_recommendation_context(guild_queue, fallback_user=requester)

        # 3. Fetch candidates (AI first, fallback if none or failed)
        candidates = await self._fetch_ai_recommendations(ctx)
        if not candidates:
            log.info("[Audia AI] Remote AI unavailable; using musical heuristic engine.")
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
                log.debug(f"[Audia AI Candidate Rejected] '{artist} - {title}': {reason}")

        if not valid_candidates:
            heuristics = self._get_heuristic_candidates(ctx)
            for cand in heuristics:
                ok, _ = self.is_candidate_valid(cand["title"], cand["artist"], guild_queue, ctx)
                if ok:
                    valid_candidates.append(cand)

        # HARD FIX: If candidates are still empty because session cooldown disqualified sample tracks
        # and English language preference is set:
        # DO NOT fallback to Hindi! Relax the session history cooldown for the oldest English tracks!
        if not valid_candidates and "english" in str(ctx.get("seed_language", "")).lower():
            heuristics = self._get_heuristic_candidates(ctx)
            for cand in heuristics:
                lang_ok, _ = is_track_allowed_for_language(cand["title"], cand["artist"], "English")
                if lang_ok:
                    valid_candidates.append(cand)

        # 5. Extract and verify audio stream with duration bounds
        for cand in valid_candidates[:12]:
            title = cand["title"]
            artist = cand["artist"]
            query = f"{artist} - {title}"
            try:
                tracks = await music_service.search_and_extract(query, requester, limit=2)
                if not tracks:
                    continue
                chosen_track = tracks[0]

                dur = chosen_track.duration or 0
                if 40 <= dur <= 720 and not chosen_track.is_live:
                    # Strict Language Check on extracted track author and title
                    target_lang = ctx.get("seed_language")
                    if target_lang:
                        allowed, lang_reason = is_track_allowed_for_language(chosen_track.clean_title, chosen_track.author, target_lang)
                        if not allowed:
                            log.info(f"[Audia AI Extracted Track Blocked by Language] {chosen_track.author} - {chosen_track.clean_title}: {lang_reason}")
                            continue

                    # Strict Genre / Category Check on extracted track
                    target_genre = ctx.get("seed_genre")
                    if target_genre:
                        genre_allowed, genre_reason = is_track_allowed_for_genre(chosen_track.clean_title, chosen_track.author, target_genre)
                        if not genre_allowed:
                            log.info(f"[Audia AI Extracted Track Blocked by Genre] {chosen_track.author} - {chosen_track.clean_title}: {genre_reason}")
                            continue

                    # Final duplicate check on actual extracted track title
                    ok, _ = self.is_candidate_valid(chosen_track.clean_title, chosen_track.author, guild_queue, ctx)
                    if ok:
                        meta = {
                            "title": chosen_track.clean_title,
                            "artist": chosen_track.author,
                            "genre": cand.get("genre", ctx.get("seed_genre", "Pop")),
                            "language": cand.get("language", ctx.get("seed_language", "English")),
                            "mood": cand.get("mood", ctx.get("seed_mood", "Chill")),
                            "reason": cand.get("reason", f"Selected by Audia AI to match your musical taste."),
                            "mode": ctx.get("mode", "Personal"),
                        }
                        return chosen_track, meta
            except Exception as extract_err:
                log.warning(f"[Audia AI Extract Error] Candidate '{query}' failed: {extract_err}")
                continue

        log.warning("[Audia AI] All recommendation candidates failed verification.")
        return None, None

    def trigger_prefetch(self, guild_queue: Any, music_service: Any):
        """Spawns an async task to prefetch the next recommendation before the current track finishes."""
        if not getattr(guild_queue, "autoplay", False):
            return
        if getattr(guild_queue, "prefetched_autoplay_track", None):
            return

        curr_task = getattr(guild_queue, "prefetch_task", None)
        if curr_task and not curr_task.done():
            return

        async def _do_prefetch():
            try:
                await asyncio.sleep(4)
                if not getattr(guild_queue, "autoplay", False):
                    return
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
                    log.info(f"[Audia AI Prefetch] Pre-buffered: {track.clean_title} ({track.author})")
            except Exception as e:
                log.debug(f"[Audia AI Prefetch Error] {e}")

        guild_queue.prefetch_task = asyncio.create_task(_do_prefetch())

    async def get_recommendations_for_user(self, user_id: int, limit: int = 6) -> List[Dict[str, Any]]:
        """Generates hyper-personalized recommendations with explanation strings for the Dashboard."""
        prof = self.get_user_profile(user_id)
        top_artists = [a for a, s in sorted(prof.artist_affinity.items(), key=lambda x: x[1], reverse=True)[:5]]
        top_genres = [g for g, s in sorted(prof.genre_affinity.items(), key=lambda x: x[1], reverse=True)[:3]]

        ctx_info = {
            "seed_title": "Listener Favorites",
            "seed_artist": top_artists[0] if top_artists else "Diverse Artist",
            "seed_genre": prof.manual_genre or (top_genres[0] if top_genres else "Pop & Indie"),
            "seed_language": prof.manual_language or "Hindi + English",
            "seed_mood": prof.manual_mood or "Chill & Energetic",
            "mode": "Taste Profile Match",
            "top_artists": top_artists,
            "top_genres": top_genres,
            "discovery_mode": prof.discovery_mode,
            "recent_tracks": [t.get("title", "") for t in prof.liked_tracks[-6:] if isinstance(t, dict) and t.get("title")],
            "blocked_artists": prof.blocked_artists,
        }

        candidates = []
        if self.gemini_key or self.openai_key:
            try:
                candidates = await self._fetch_ai_recommendations(ctx_info)
            except Exception:
                candidates = []

        if not candidates:
            candidates = self._get_heuristic_candidates(ctx_info)

        results = []
        for c in candidates[:limit]:
            results.append({
                "title": c.get("title"),
                "artist": c.get("artist"),
                "genre": c.get("genre", "Pop"),
                "language": c.get("language", "Global"),
                "mood": c.get("mood", "Vibrant"),
                "reason": c.get("reason") or f"Recommended based on your affinity for {c.get('genre', 'diverse genres')} and similar artists.",
                "confidence": c.get("confidence", 0.94)
            })
        return results
