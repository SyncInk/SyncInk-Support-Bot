import os
import re
import json
import time
import asyncio
import aiohttp
from typing import Tuple, Optional, Set
from collections import deque
from utils.logger import log

class AIModerationService:
    """
    AI-powered swear word and profanity detection using Google Gemini & OpenRouter.
    Specialized in catching disguised vulgarity, leetspeak bypasses, and hateful slurs
    that evade static dictionaries, while strictly protecting API rate limits.
    """

    gemini_key: Optional[str] = os.getenv("GEMINI_API_KEY")
    openrouter_key: Optional[str] = os.getenv("OPENROUTER_API_KEY")

    # In-memory clean phrase cache to eliminate duplicate API calls for common messages
    clean_cache: Set[str] = set()
    MAX_CACHE_SIZE: int = 1500

    # Rate limiting protection: sliding window of request timestamps
    request_history: deque = deque(maxlen=20)
    MAX_REQUESTS_PER_MINUTE: int = 10  # Leaves plenty of quota for chatbot queries

    # Preferred active Gemini models for moderation (fastest, lightweight)
    candidate_models = [
        "models/gemini-2.0-flash-lite",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-flash-8b",
        "models/gemini-2.0-flash"
    ]

    @classmethod
    def reload_keys(cls):
        env_gemini = os.getenv("GEMINI_API_KEY")
        if env_gemini:
            cls.gemini_key = env_gemini
        env_openrouter = os.getenv("OPENROUTER_API_KEY")
        if env_openrouter:
            cls.openrouter_key = env_openrouter

    @classmethod
    def has_api_key(cls) -> bool:
        return bool(cls.gemini_key or cls.openrouter_key)

    @classmethod
    def should_skip(cls, text: str) -> bool:
        """Fast heuristics to skip messages that cannot be swear words or shouldn't hit the LLM."""
        if not text:
            return True

        clean = text.strip()
        # Skip very short content (< 3 characters like 'hi', 'ok', 'k')
        if len(clean) < 3:
            return True

        # Skip command invocations
        if clean.startswith(('?', '/', '!', '.', '$', '-', ';', '+', '~', '<')):
            return True

        # Skip pure URLs
        if re.match(r'^https?://\S+$', clean, re.IGNORECASE):
            return True

        # Skip pure numbers or timestamps
        if re.match(r'^[\d\s:./\-]+$', clean):
            return True

        # Check clean cache
        norm = clean.lower()
        if norm in cls.clean_cache:
            return True

        return False

    @classmethod
    def _is_rate_limited(cls) -> bool:
        """Sliding window check to ensure AI moderation never starves the Gemini quota."""
        now = time.time()
        while cls.request_history and (now - cls.request_history[0]) > 60:
            cls.request_history.popleft()

        return len(cls.request_history) >= cls.MAX_REQUESTS_PER_MINUTE

    @classmethod
    def _record_request(cls):
        cls.request_history.append(time.time())

    @classmethod
    def add_to_clean_cache(cls, text: str):
        norm = text.strip().lower()
        if len(cls.clean_cache) >= cls.MAX_CACHE_SIZE:
            cls.clean_cache.clear()
        cls.clean_cache.add(norm)

    @classmethod
    async def scan_message(cls, text: str) -> Tuple[bool, str, str]:
        """
        Scans a message for swear words and profanity using Gemini AI.
        Returns:
            (is_swear: bool, detected_word: str, confidence: 'high'|'medium'|'low')
        """
        cls.reload_keys()
        if not cls.has_api_key():
            return False, "", "low"

        if cls.should_skip(text):
            return False, "", "low"

        if cls._is_rate_limited():
            # Rate limit bucket full; fail open to avoid lag
            return False, "", "low"

        system_instruction = (
            "You are a strict Discord content moderation filter for swear words and profanity.\n"
            "Analyze the given message strictly for:\n"
            "1. Vulgar swear words, profanity, and offensive sexual obscenity.\n"
            "2. Hateful slurs and abusive insults.\n"
            "3. Disguised swear words (leetspeak, asterisks, phonetics, e.g. 'f*ck', 'b!tch', 'c*nt', 'stfu', etc.).\n\n"
            "IMPORTANT RULES:\n"
            "- Do NOT flag innocent conversational words, programming terms, gaming slang, or harmless mild expressions (like 'damn', 'crap', 'hell', 'omg', 'lmao').\n"
            "- If the text contains genuine swear words or vulgar profanity, set is_swear to true.\n"
            "- Output ONLY valid JSON in this exact format with no extra text or markdown:\n"
            '{\"is_swear\": true or false, \"detected\": \"exact word or brief reason\", \"confidence\": \"high\" or \"medium\" or \"low\"}'
        )

        cls._record_request()

        # Try Google Gemini first
        if cls.gemini_key:
            res = await cls._call_gemini(system_instruction, text)
            if res:
                is_swear, detected, conf = cls._parse_response(res)
                if not is_swear:
                    cls.add_to_clean_cache(text)
                return is_swear, detected, conf

        # Fallback to OpenRouter if configured
        if cls.openrouter_key:
            res = await cls._call_openrouter(system_instruction, text)
            if res:
                is_swear, detected, conf = cls._parse_response(res)
                if not is_swear:
                    cls.add_to_clean_cache(text)
                return is_swear, detected, conf

        return False, "", "low"

    @classmethod
    def _parse_response(cls, raw: str) -> Tuple[bool, str, str]:
        """Parses the JSON response from the LLM."""
        try:
            clean = raw.strip()
            if clean.startswith("```"):
                clean = re.sub(r"^```(?:json)?\s*", "", clean)
                clean = re.sub(r"\s*```$", "", clean)

            data = json.loads(clean)
            is_swear = bool(data.get("is_swear", False))
            detected = str(data.get("detected", "")).strip()
            conf = str(data.get("confidence", "medium")).lower().strip()
            if conf not in ("high", "medium", "low"):
                conf = "medium"
            return is_swear, detected, conf
        except Exception as e:
            log.warning(f"Could not parse AI moderation JSON: {e} | Raw: {raw[:100]}")
            return False, "", "low"

    @classmethod
    async def _call_gemini(cls, system_instruction: str, user_text: str) -> Optional[str]:
        payload = {
            "system_instruction": {"parts": [{"text": system_instruction}]},
            "contents": [{"role": "user", "parts": [{"text": user_text}]}],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 80,
                "responseMimeType": "application/json"
            }
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": cls.gemini_key
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            for model_name in cls.candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/{model_name}:generateContent?key={cls.gemini_key}"
                try:
                    async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=4)) as response:
                        if response.status == 200:
                            data = await response.json()
                            return data["candidates"][0]["content"]["parts"][0]["text"]
                        elif response.status == 429:
                            log.warning(f"AI Moderation Gemini {model_name} rate limited (429).")
                            continue
                        else:
                            continue
                except Exception:
                    continue
        return None

    @classmethod
    async def _call_openrouter(cls, system_instruction: str, user_text: str) -> Optional[str]:
        headers = {
            "Authorization": f"Bearer {cls.openrouter_key}",
            "Content-Type": "application/json",
            "X-Title": "SyncInk AutoMod AI"
        }
        payload = {
            "model": "google/gemini-2.0-flash-exp:free",
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_text}
            ],
            "max_tokens": 80,
            "temperature": 0.1
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=4)) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["choices"][0]["message"]["content"]
        except Exception:
            pass
        return None
