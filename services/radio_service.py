import urllib.request
import urllib.parse
import json
import time
from typing import Optional, List, Dict, Any

from utils.logger import log

import os

RADIO_BROWSER_MIRRORS = [
    "http://de1.api.radio-browser.info",
    "http://all.api.radio-browser.info",
    "https://de1.api.radio-browser.info",
]

# Country flag emoji mapping for popular countries
COUNTRY_FLAGS: Dict[str, str] = {
    "US": "🇺🇸", "GB": "🇬🇧", "IN": "🇮🇳", "CA": "🇨🇦", "AU": "🇦🇺",
    "DE": "🇩🇪", "FR": "🇫🇷", "JP": "🇯🇵", "BR": "🇧🇷", "MX": "🇲🇽",
    "ES": "🇪🇸", "IT": "🇮🇹", "NL": "🇳🇱", "RU": "🇷🇺", "KR": "🇰🇷",
    "ID": "🇮🇩", "TR": "🇹🇷", "PL": "🇵🇱", "AR": "🇦🇷", "CO": "🇨🇴",
    "PH": "🇵🇭", "SE": "🇸🇪", "NO": "🇳🇴", "CH": "🇨🇭", "NZ": "🇳🇿",
    "IE": "🇮🇪", "ZA": "🇿🇦", "EG": "🇪🇬", "PK": "🇵🇰", "BD": "🇧🇩",
}

POPULAR_RADIO_COUNTRIES = [
    ("India", "IN", "🇮🇳"),
    ("United States", "US", "🇺🇸"),
    ("United Kingdom", "GB", "🇬🇧"),
    ("Canada", "CA", "🇨🇦"),
    ("Australia", "AU", "🇦🇺"),
    ("Japan", "JP", "🇯🇵"),
    ("Germany", "DE", "🇩🇪"),
    ("France", "FR", "🇫🇷"),
    ("Brazil", "BR", "🇧🇷"),
    ("Spain", "ES", "🇪🇸"),
    ("Italy", "IT", "🇮🇹"),
    ("Mexico", "MX", "🇲🇽"),
    ("South Korea", "KR", "🇰🇷"),
    ("Netherlands", "NL", "🇳🇱"),
    ("Russia", "RU", "🇷🇺"),
    ("Indonesia", "ID", "🇮🇩"),
    ("Turkey", "TR", "🇹🇷"),
    ("Sweden", "SE", "🇸🇪"),
    ("Norway", "NO", "🇳🇴"),
    ("New Zealand", "NZ", "🇳🇿"),
    ("Pakistan", "PK", "🇵🇰"),
    ("Bangladesh", "BD", "🇧🇩"),
    ("Ireland", "IE", "🇮🇪"),
    ("South Africa", "ZA", "🇿🇦"),
    ("Switzerland", "CH", "🇨🇭"),
]

def country_code_to_flag(code: str) -> str:
    """Converts a 2-letter ISO 3166-1 alpha-2 country code to its Unicode flag emoji."""
    if not code or len(code) != 2 or not code.isalpha():
        return "🌍"
    code = code.upper()
    return "".join(chr(127462 + ord(c) - ord('A')) for c in code)

def get_country_flag(country_name_or_code: str) -> str:
    """Resolves a Unicode national flag emoji from country name or ISO code."""
    if not country_name_or_code:
        return "🌍"
    q = country_name_or_code.strip()
    if len(q) == 2 and q.isalpha():
        return country_code_to_flag(q)

    q_lower = q.lower()
    for name, code, flag in POPULAR_RADIO_COUNTRIES:
        if name.lower() == q_lower or code.lower() == q_lower:
            return flag

    code = RadioService.get_instance().get_country_code(q)
    if code:
        return country_code_to_flag(code)

    return "🌍"

class RadioService:
    _instance: Optional['RadioService'] = None

    def __init__(self):
        self._cached_countries: List[Dict[str, Any]] = []
        self._last_country_cache_time: float = 0.0
        self._working_mirror: str = RADIO_BROWSER_MIRRORS[0]
        self._cached_country_stations: Dict[str, Any] = {}
        self._offline_cache_stations: Dict[str, List[Dict[str, Any]]] = {}

        # Load bundled countries fallback from disk if available
        countries_path = os.path.join(os.path.dirname(__file__), "..", "data", "radio_countries.json")
        if os.path.exists(countries_path):
            try:
                with open(countries_path, "r", encoding="utf-8") as f:
                    self._cached_countries = json.load(f)
                    self._last_country_cache_time = time.time()
            except Exception as e:
                log.warning(f"[RadioService] Could not load countries cache file: {e}")

        # Load bundled stations fallback from disk if available
        stations_path = os.path.join(os.path.dirname(__file__), "..", "data", "radio_stations_cache.json")
        if os.path.exists(stations_path):
            try:
                with open(stations_path, "r", encoding="utf-8") as f:
                    self._offline_cache_stations = json.load(f)
            except Exception as e:
                log.warning(f"[RadioService] Could not load stations cache file: {e}")

    @classmethod
    def get_instance(cls) -> 'RadioService':
        if cls._instance is None:
            cls._instance = RadioService()
        return cls._instance

    def _request_api(self, endpoint: str, timeout: float = 8.0, max_retries: int = 3) -> Any:
        """Fetch data from Radio Browser API with automatic retry and mirror failover."""
        mirrors = [self._working_mirror] + [m for m in RADIO_BROWSER_MIRRORS if m != self._working_mirror]
        headers = {"User-Agent": "SyncInkMusicPlatform/1.0.0 (https://syncink.app; contact@syncink.app)"}

        for mirror in mirrors:
            url = f"{mirror}{endpoint}"
            for attempt in range(max_retries):
                try:
                    req = urllib.request.Request(url, headers=headers)
                    with urllib.request.urlopen(req, timeout=timeout) as resp:
                        if resp.status == 200:
                            self._working_mirror = mirror
                            return json.loads(resp.read().decode("utf-8"))
                except Exception:
                    time.sleep(0.3 * (attempt + 1))
                    continue

        return None

    def get_countries(self) -> List[Dict[str, Any]]:
        """Fetch all countries from Radio Browser, cached for 1 hour."""
        now = time.time()
        if self._cached_countries and (now - self._last_country_cache_time < 3600):
            return self._cached_countries

        data = self._request_api("/json/countries")
        if data and isinstance(data, list):
            # Sort by stationcount descending
            valid = [
                c for c in data
                if c.get("name") and c.get("stationcount", 0) > 0
            ]
            valid.sort(key=lambda x: x.get("stationcount", 0), reverse=True)
            self._cached_countries = valid
            self._last_country_cache_time = now
            return self._cached_countries

        return self._cached_countries or []

    def search_countries(self, query: str, limit: int = 25) -> List[Dict[str, Any]]:
        """Search countries by name or code for Discord autocompletion."""
        countries = self.get_countries()
        if not query:
            return countries[:limit]

        q = query.strip().lower()
        exact_code = [c for c in countries if c.get("iso_3166_1", "").lower() == q]
        starts = [c for c in countries if c.get("name", "").lower().startswith(q) and c not in exact_code]
        contains = [c for c in countries if q in c.get("name", "").lower() and c not in exact_code and c not in starts]

        matches = exact_code + starts + contains
        return matches[:limit]

    def get_country_code(self, country_name: str) -> Optional[str]:
        """Resolves ISO 3166-1 alpha-2 code for a country name."""
        if not country_name:
            return None
        q = country_name.strip().lower()
        for name, code, _ in POPULAR_RADIO_COUNTRIES:
            if name.lower() == q or code.lower() == q:
                return code

        countries = self.get_countries()
        for c in countries:
            if c.get("name", "").lower() == q:
                return c.get("iso_3166_1", "").upper()
            if c.get("iso_3166_1", "").lower() == q:
                return c.get("iso_3166_1", "").upper()

        for c in countries:
            if q in c.get("name", "").lower():
                return c.get("iso_3166_1", "").upper()
        return None

    def _parse_and_clean_stations(self, data: Any, country_name: str) -> List[Dict[str, Any]]:
        """Parses API stations, filtering broken streams and prioritizing healthy verified ones."""
        if not data or not isinstance(data, list):
            return []

        # Split into verified healthy (lastcheckok == 1, no ssl_error) and others
        healthy = []
        fallback = []
        for s in data:
            url = s.get("url_resolved") or s.get("url")
            name = s.get("name", "").strip()
            if not url or not name or not (url.startswith("http://") or url.startswith("https://")):
                continue
            favicon = s.get("favicon", "").strip() if s.get("favicon") else ""
            station_dict = {
                "stationuuid": s.get("stationuuid", ""),
                "name": name,
                "url": url,
                "homepage": s.get("homepage", ""),
                "favicon": favicon if (favicon.startswith("http://") or favicon.startswith("https://")) else "",
                "country": country_name,
                "countrycode": s.get("countrycode", ""),
                "codec": s.get("codec", "MP3"),
                "bitrate": s.get("bitrate", 128),
                "lastcheckok": s.get("lastcheckok", 1),
            }
            if s.get("lastcheckok", 1) == 1 and not s.get("ssl_error", 0):
                healthy.append(station_dict)
            else:
                fallback.append(station_dict)

        return healthy + fallback

    def get_country_stations(self, country_query: str, limit: int = 150) -> List[Dict[str, Any]]:
        """Fetch the top working stations for a country (up to 150 for pagination)."""
        country_query = country_query.strip()
        cache_key = country_query.lower()

        now = time.time()
        if cache_key in self._cached_country_stations:
            cached_time, cached_data = self._cached_country_stations[cache_key]
            if now - cached_time < 3600 and cached_data:
                return cached_data

        matched_country_name = None
        matched_country_code = None

        countries = self.get_countries()
        for c in countries:
            if c.get("iso_3166_1", "").lower() == country_query.lower():
                matched_country_name = c["name"]
                matched_country_code = c.get("iso_3166_1")
                break
            if c.get("name", "").lower() == country_query.lower():
                matched_country_name = c["name"]
                matched_country_code = c.get("iso_3166_1")
                break

        if not matched_country_name:
            search_matches = self.search_countries(country_query, limit=1)
            if search_matches:
                matched_country_name = search_matches[0]["name"]
                matched_country_code = search_matches[0].get("iso_3166_1")
            else:
                matched_country_name = country_query
                matched_country_code = self.get_country_code(country_query)

        data = None
        # 1. Try by country code exact (fastest, most reliable)
        if matched_country_code:
            code_endpoint = f"/json/stations/bycountrycodeexact/{matched_country_code.upper()}?order=clickcount&reverse=true&limit={limit}"
            data = self._request_api(code_endpoint)

        # 2. Try by country name search
        if not data:
            encoded = urllib.parse.quote(matched_country_name)
            endpoint = f"/json/stations/search?country={encoded}&order=clickcount&reverse=true&limit={limit}"
            data = self._request_api(endpoint)

        results = self._parse_and_clean_stations(data, matched_country_name)
        if results:
            self._cached_country_stations[cache_key] = (now, results)
            if matched_country_name:
                self._cached_country_stations[matched_country_name.lower()] = (now, results)
            if matched_country_code:
                self._cached_country_stations[matched_country_code.lower()] = (now, results)
            return results

        # 3. Fallback to bundled offline cache if API failed or returned 0
        if cache_key in self._offline_cache_stations and self._offline_cache_stations[cache_key]:
            return self._offline_cache_stations[cache_key]
        if matched_country_code and matched_country_code.lower() in self._offline_cache_stations:
            return self._offline_cache_stations[matched_country_code.lower()]
        if matched_country_name and matched_country_name.lower() in self._offline_cache_stations:
            return self._offline_cache_stations[matched_country_name.lower()]

        return []

    def search_stations(self, country_query: str, query: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Search stations within a specific country by name or tag (up to 100 results)."""
        country_query = country_query.strip()
        q_lower = query.strip().lower()

        matched_country_name = None
        matched_country_code = self.get_country_code(country_query)

        countries = self.get_countries()
        for c in countries:
            if c.get("iso_3166_1", "").lower() == country_query.lower() or c.get("name", "").lower() == country_query.lower():
                matched_country_name = c["name"]
                matched_country_code = c.get("iso_3166_1")
                break

        if not matched_country_name:
            matched_country_name = country_query

        data = None
        encoded_query = urllib.parse.quote(query.strip())
        if matched_country_code:
            code_endpoint = f"/json/stations/search?countrycode={matched_country_code.upper()}&name={encoded_query}&order=clickcount&reverse=true&limit={limit}"
            data = self._request_api(code_endpoint)

        if not data:
            encoded_country = urllib.parse.quote(matched_country_name)
            endpoint = f"/json/stations/search?country={encoded_country}&name={encoded_query}&order=clickcount&reverse=true&limit={limit}"
            data = self._request_api(endpoint)

        if not data:
            encoded_country = urllib.parse.quote(matched_country_name)
            tag_endpoint = f"/json/stations/search?country={encoded_country}&tag={encoded_query}&order=clickcount&reverse=true&limit={limit}"
            data = self._request_api(tag_endpoint)

        results = self._parse_and_clean_stations(data, matched_country_name)
        if results:
            return results

        # Fallback to local filter over country stations
        all_country_stations = self.get_country_stations(country_query, limit=150)
        local_matches = [
            s for s in all_country_stations
            if q_lower in s.get("name", "").lower()
        ]
        return local_matches[:limit]
