import re
from typing import Any, Dict, Optional, Tuple

LABEL_CHANNELS = {
    'sony music india', 'sony music', 'sonymusicindiavevo', 't-series', 'tseries',
    't-series apna punjab', 'zee music company', 'zee music', 'yrf', 'yash raj films',
    'speed records', 'tips official', 'tips music', 'saregama music', 'saregama',
    'aditya music', 'lahari music', 'wave music', 'venus', 'eros now', 'geet mp3',
    'white hill music', 'dm - desi melodies', 'desi melodies', 'svf', 'times music',
    'universal music india', 'universal music group', 'warner music india', 'warner records',
    'atlantic records', 'columbia records', 'interscope records', 'def jam recordings',
    'spinnin\' records', 'monstercat', 'ultra records', 'vevo', 'lofi girl', 'chilledcow',
    'trap nation', 'bass nation', 'chill nation', '7clouds', 'proximity', 'mrsuicidesheep',
    'noisiest', 'nocopyrightsounds', 'ncs', 't-series regional', 't-series bhakti sagar'
}

KNOWN_ACTORS = {
    'shah rukh khan', 'shahrukh khan', 'srk', 'kajol', 'ranbir kapoor', 'alia bhatt',
    'salman khan', 'aamir khan', 'deepika padukone', 'ranveer singh', 'katrina kaif',
    'akshay kumar', 'hrithik roshan', 'vicky kaushal', 'triptii dimri', 'kiara advani',
    'sidharth malhotra', 'varun dhawan', 'shraddha kapoor', 'kartik aaryan', 'kriti sanon',
    'shahid kapoor', 'aditya roy kapur', 'jacqueline fernandez', 'nawazuddin siddiqui',
    'nayanthara', 'srk kajol', 'ram charan', 'jr ntr', 'allu arjun', 'prabhas',
    'rashmika mandanna', 'bobby deol', 'anil kapoor', 'ajay devgn', 'kareena kapoor',
    'saif ali khan', 'john abraham', 'tiger shroff', 'disha patani', 'ananya panday',
    'sara ali khan', 'janhvi kapoor', 'ayushmann khurrana', 'rajkummar rao', 'suniel shetty'
}

KNOWN_ARTISTS = {
    'arijit singh', 'atif aslam', 'pritam', 'anirudh', 'a.r. rahman', 'ar rahman',
    'shreya ghoshal', 'neha kakkar', 'jubin nautiyal', 'b praak', 'jasleen royal',
    'darshan raval', 'armaan malik', 'badshah', 'diljit dosanjh', 'karan aujla',
    'ap dhillon', 'shubh', 'sidhu moose wala', 'yo yo honey singh', 'honey singh',
    'guru randhawa', 'hardy sandhu', 'vishal-shekhar', 'sachin-jigar', 'amit trivedi',
    'tanishk bagchi', 'sachet-parampara', 'harshdeep kaur', 'antara mitra',
    'sunidhi chauhan', 'mohit chauhan', 'kk', 'sonu nigam', 'udit narayan',
    'kumar sanu', 'alka yagnik', 'lata mangeshkar', 'kishore kumar', 'the kid laroi',
    'alan walker', 'the weeknd', 'dua lipa', 'post malone', 'swae lee', 'taylor swift',
    'ed sheeran', 'drake', 'eminem', 'billie eilish', 'bruno mars', 'charlie puth',
    'justin bieber', 'selena gomez', 'shawn mendes', 'camila cabello', 'ariana grande'
}

KNOWN_MOVIES = {
    'dilwale', 'raees', 'brahmastra', 'brahmāstra', 'jawan', 'pathaan', 'dangal',
    'kabir singh', 'animal', 'fighter', 'stree 2', 'stree', 'shershaah', 'aashiqui 2',
    'aashiqui', 'ye jawaani hai deewani', 'yjhd', 'rockstar', 'ae dil hai mushkil', 'adhm',
    'kalank', 'war', 'kedarnath', 'tamasha', 'bad newz', 'badhaai do', 'luka chuppi',
    'satyameva jayate', 'simmba', 'sooryavanshi', 'kesari', 'bhool bhulaiyaa 2', 'bhool bhulaiyaa',
    'dunki', 'tiger 3', 'ek tha tiger', 'tiger zinda hai', 'sultan', 'bajrangi bhaijaan',
    'om shanti om', 'chennai express', 'main hoon na', 'kuch kuch hota hai', 'krrish 3',
    'dhoom 3', 'dhoom 2', 'padmaavat', 'bajirao mastani', 'ram leela', 'jab tak hai jaan'
}

HINDI_TO_ENGLISH_MAP = {
    'गेरुआ': 'Gerua',
    'जालिमा': 'Zaalima',
    'केसरिया': 'Kesariya',
    'चलेया': 'Chaleya',
    'तुम ही हो': 'Tum Hi Ho',
    'चन्ना मेरेया': 'Channa Mereya',
    'अपना बना ले': 'Apna Bana Le',
    'रातां लंबियां': 'Raataan Lambiyan',
    'तेरा यार हूं मैं': 'Tera Yaar Hoon Main',
    'हवाएं': 'Hawayein',
    'शायद': 'Shayad',
    'कलंक': 'Kalank',
    'तौबा तौबा': 'Tauba Tauba',
    'गेंद फूल': 'Genda Phool',
    'dilwale': 'Dilwale',
    'dilwala': 'Dilwale',
    'दिलवाले': 'Dilwale',
    'रईस': 'Raees',
    'जवान': 'Jawan',
    'पठान': 'Pathaan',
    'प्रीतम': 'Pritam',
    'अरिजीत सिंह': 'Arijit Singh',
    'अरिजीत': 'Arijit Singh',
    'श्रेया घोषाल': 'Shreya Ghoshal',
    'नेहा कक्कड़': 'Neha Kakkar',
    'जुबिन नौटियाल': 'Jubin Nautiyal',
    'बादशाह': 'Badshah',
    'दिलजीत दोसांझ': 'Diljit Dosanjh',
    'हनी सिंह': 'Honey Singh',
    'यो यो हनी सिंह': 'Yo Yo Honey Singh',
    'आतिफ असलम': 'Atif Aslam',
    'ए आर रहमान': 'A.R. Rahman',
    'सोनू निगम': 'Sonu Nigam',
    'सुनिधि चौहान': 'Sunidhi Chauhan',
    'उदित नारायण': 'Udit Narayan',
    'कुमार सानु': 'Kumar Sanu',
    'अलका याग्निक': 'Alka Yagnik',
    'किशोर कुमार': 'Kishore Kumar',
    'लता मंगेशकर': 'Lata Mangeshkar',
    'मोहम्मद रफी': 'Mohammed Rafi',
    'केके': 'KK',
}

def romanize_devanagari(text: str) -> str:
    """Translates known Devanagari song titles and artists; strips machine-translated Devanagari noise."""
    for hi, en in HINDI_TO_ENGLISH_MAP.items():
        if hi in text:
            text = text.replace(hi, en)
    has_devanagari = any(0x0900 <= ord(char) <= 0x097F for char in text)
    if has_devanagari:
        hi_noise = [
            r'ऑफिशियल\s*पूरे\s*गीत\s*का\s*नई\s*ऑफिशियल\s*वीडियो\s*\d*',
            r'ऑफिशियल\s*(म्यूजिक\s*)?(वीडियो|गीत|ऑडियो)',
            r'लिरिकल\s*वीडियो',
            r'पूरे\s*गीत\s*(का)?',
            r'नया\s*गाना\s*\d*',
            r'फुल\s*वीडियो',
            r'एसआरके\s*काजोल',
            r'शाहरुख\s*खान',
            r'काजोल',
            r'दिलवाले',
            r'वीडियो',
            r'गीत',
            r'गाना',
            r'नई',
            r'नया',
            r'फुल'
        ]
        for hn in hi_noise:
            text = re.sub(hn, '', text, flags=re.IGNORECASE)
    return text.strip()

def clean_track_metadata(raw_title: str, raw_uploader: str = '', entry: Optional[Dict[str, Any]] = None) -> Tuple[str, str]:
    """
    Intelligently extracts the clean song title and the actual main artist.
    Strips noise, video tags, actors, and labels like Sony Music India / T-Series.
    """
    entry = entry or {}
    
    # 1. Official YouTube Music tags
    official_track = entry.get('track')
    official_artist = entry.get('artist')
    if official_track and official_artist:
        return official_track.strip(), official_artist.strip()

    title = raw_title or ''
    title = romanize_devanagari(title)

    # 2. Strip bracketed noise & movie subtitle tags in parentheses e.g. (Spider-Man: Into the Spider-Verse)
    noise_patterns = [
        r'(?i)\s*[\(\[\{][^\)\]\}]*?(official|video|audio|lyrics?|lyrical|visualizer|4k|hd|8k|hq|remastered|full song|teas(er)?|trailer|slowed|reverb|spider-man|soundtrack|ost)[^\)\]\}]*?[\)\]\}]',
        r'(?i)\b(official\s*(music\s*)?(video|audio|visualizer|lyric\s*video|track|full\s*video)?)\b',
        r'(?i)\b(lyric(al)?\s*(video)?)\b',
        r'(?i)\b(full\s*song\s*video|full\s*video\s*song|full\s*song|full\s*video|video\s*song|song\s*video|audio\s*song)\b',
        r'(?i)\b(moonchild\s*era)\b',
        r'(?i)\b(new\s*(punjabi|hindi|bollywood|english)?\s*song\s*\d{4})\b',
        r'(?i)\b(latest\s*(punjabi|hindi|bollywood|english)?\s*song\s*\d{4})\b',
        r'(?i)\b(4k\s*uhd|4k|8k|hd|hq|uhd|remastered)\b',
        r'(?i)\b(lyrics?)\b',
        r'[\(\[\{\)\]\}]',
    ]
    for np in noise_patterns:
        title = re.sub(np, ' ', title)

    title = re.sub(r'\s+', ' ', title).strip()

    uploader = (raw_uploader or '').strip()
    is_channel_label = (
        uploader.lower() in LABEL_CHANNELS or
        any(lbl in uploader.lower() for lbl in ['music', 'records', 'entertainment', 'company', 'vevo', 'series', 'films', 'audio', 'sound', 'productions'])
    )

    extracted_song = ""
    extracted_artist = official_artist or ("" if is_channel_label else uploader)

    pipe_parts = [p.strip() for p in title.split('|') if p.strip()]

    if len(pipe_parts) >= 2:
        first_segment = pipe_parts[0]
        other_segments = pipe_parts[1:]

        filtered_artists = []
        for seg in other_segments:
            seg_clean = re.sub(r'[\-_:\.]+', ' ', seg).strip()
            low = seg_clean.lower()
            if any(actor in low for actor in KNOWN_ACTORS):
                continue
            if any(movie in low for movie in KNOWN_MOVIES):
                continue
            if any(kw in low for kw in ['director', 'producer', 'choreographer', 'screenplay', 'teaser', 'trailer', 'song', 'music', 'full video', 'soundtrack', 'album', 'era']):
                continue
            if len(seg_clean) > 2:
                filtered_artists.append(seg_clean)

        # Check first segment for colon e.g. "Diljit Dosanjh: Lover"
        if ': ' in first_segment:
            c_parts = first_segment.split(': ', 1)
            extracted_artist = c_parts[0].strip()
            extracted_song = c_parts[1].strip()
        else:
            for sep in [' - ', ' – ', ' — ']:
                if sep in first_segment:
                    parts = first_segment.split(sep, 1)
                    left, right = parts[0].strip(), parts[1].strip()
                    left_low = left.lower()
                    right_low = right.lower()

                    if any(art in left_low for art in KNOWN_ARTISTS) or (uploader and uploader.lower() in left_low):
                        extracted_artist = left
                        extracted_song = right
                    elif any(actor in right_low for actor in KNOWN_ACTORS) or any(movie in right_low for movie in KNOWN_MOVIES):
                        extracted_song = left
                    elif any(actor in left_low for actor in KNOWN_ACTORS) or any(movie in left_low for movie in KNOWN_MOVIES):
                        extracted_song = right
                    else:
                        extracted_song = left
                    break

        if not extracted_song:
            if '-' in first_segment:
                parts = [x.strip() for x in first_segment.split('-') if x.strip()]
                extracted_song = parts[0]
            else:
                extracted_song = first_segment

        if not extracted_artist and filtered_artists:
            extracted_artist = ", ".join(filtered_artists[:2])
        elif filtered_artists and (is_channel_label or not extracted_artist):
            extracted_artist = ", ".join(filtered_artists[:2])

    elif len(pipe_parts) == 1:
        single = pipe_parts[0]
        if ': ' in single:
            c_parts = single.split(': ', 1)
            extracted_artist = c_parts[0].strip()
            extracted_song = c_parts[1].strip()
        else:
            for sep in [' - ', ' – ', ' — ']:
                if sep in single:
                    parts = single.split(sep, 1)
                    left, right = parts[0].strip(), parts[1].strip()
                    left_low = left.lower()
                    right_low = right.lower()

                    if uploader and uploader.lower() in left_low:
                        extracted_artist = left
                        extracted_song = right
                    elif uploader and uploader.lower() in right_low:
                        extracted_artist = right
                        extracted_song = left
                    elif any(art in left_low for art in KNOWN_ARTISTS):
                        extracted_artist = left
                        extracted_song = right
                    elif any(actor in left_low for actor in KNOWN_ACTORS) or any(movie in left_low for movie in KNOWN_MOVIES):
                        extracted_song = right
                    elif any(actor in right_low for actor in KNOWN_ACTORS) or any(movie in right_low for movie in KNOWN_MOVIES):
                        extracted_song = left
                    else:
                        extracted_artist = left
                        extracted_song = right
                    break
        if not extracted_song:
            extracted_song = single

    # Clean up trailing/leading punctuation
    extracted_song = re.sub(r'[\-_\|:\.,]+$', '', extracted_song).strip()
    extracted_song = re.sub(r'^[\-_\|:\.,]+', '', extracted_song).strip()
    extracted_song = re.sub(r'\s+', ' ', extracted_song).strip()

    # If movie name is trailing in extracted_song (e.g. 'Tum Hi Ho Aashiqui 2'), strip it
    for mov in sorted(KNOWN_MOVIES, key=len, reverse=True):
        if len(mov) > 3 and mov in extracted_song.lower():
            cand_stripped = re.sub(rf'(?i)\b{re.escape(mov)}\b', '', extracted_song).strip()
            if len(cand_stripped) >= 2:
                extracted_song = re.sub(r'\s+\d+$', '', cand_stripped).strip()
                break

    extracted_artist = re.sub(r'[\-_\|:\.,]+$', '', extracted_artist).strip()
    extracted_artist = re.sub(r'^[\-_\|:\.,]+', '', extracted_artist).strip()
    extracted_artist = re.sub(r'\s+', ' ', extracted_artist).strip()

    if not extracted_song:
        extracted_song = raw_title.strip()
    if not extracted_artist:
        extracted_artist = uploader if (uploader and not is_channel_label) else "Various Artists"

    return extracted_song, extracted_artist

def clean_title(title: str) -> str:
    """Removes video tags, bracketed text, and noise from titles; returns clean song name."""
    if not title:
        return "Unknown Track"
    song, _ = clean_track_metadata(title)
    return song or title
