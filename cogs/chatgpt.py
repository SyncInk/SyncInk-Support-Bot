import discord
from discord.ext import commands
from discord import app_commands
import os
import aiohttp
import time
import json
import re
from collections import defaultdict, deque
from typing import Optional, List, Tuple
from utils.logger import log
from utils.emojis import Emojis
from utils.ui import SyncInkEmbed, SuccessEmbed, BRAND_ACCENT, ERROR_COLOR, WARNING_COLOR
from services.web_search_service import WebSearchService
from services.settings_service import SettingsService

DEFAULT_AI_CHANNEL_ID = 1544361954574073916

def is_creator_query(prompt: str) -> bool:
    """Checks if the user query is asking about the bot's creator, maker, or origin."""
    clean = prompt.lower().strip()
    patterns = [
        "who made you", "who made u",
        "who created you", "who created u",
        "who developed you", "who developed u",
        "who built you", "who built u",
        "who is your creator", "who is your maker", "who is your developer",
        "who are your creators", "who are your developers", "who are your makers",
        "who programmed you", "who programmed u",
        "who coded you", "who coded u",
        "who owns you", "what company made you", "what team made you",
        "who made this bot", "who created this bot", "who developed this bot",
        "who built this bot", "who programmed this bot", "who coded this bot",
        "who is the creator of this bot", "who is the developer of this bot",
        "who made syncink", "who created syncink", "who developed syncink",
        "who designed you", "who designed this bot"
    ]
    return any(p in clean for p in patterns)

def sanitize_ai_identity(text: str) -> str:
    """Ensures AI never leaks third-party vendor names or confuses support chat with general chat."""
    replacements = [
        ("I was trained by Google", "I was developed by the SyncInk Development Team"),
        ("I am a large language model trained by Google", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
        ("I am a large language model, trained by Google", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
        ("I was created by Google", "I was created by the SyncInk Development Team"),
        ("I was developed by OpenAI", "I was developed by the SyncInk Development Team"),
        ("I was created by OpenAI", "I was created by the SyncInk Development Team"),
        ("I am ChatGPT", "I am SyncInk Assistant"),
        ("I am a large language model, trained by OpenAI", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
        ("I am a large language model trained by OpenAI", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
    ]
    res = text
    for old, new in replacements:
        res = re.sub(re.escape(old), new, res, flags=re.IGNORECASE)

    # Prevent AI from associating hanging out/talking with support chat
    res = re.sub(
        r"(hang out.*?(?:talk|chat).*?in\s+)<#1520460808499363840>",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    res = re.sub(
        r"(talk with everyone in\s+)<#1520460808499363840>",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    res = re.sub(
        r"(talk with everyone in\s+)#?\s*💬?\s*・?\s*support-chat",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    res = re.sub(
        r"(hang out.*?(?:talk|chat).*?in\s+)#?\s*💬?\s*・?\s*support-chat",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    return res

def build_server_guide_context(guild: discord.Guild, settings: Optional[dict] = None) -> str:
    """Builds the comprehensive official server channel and guide knowledge base."""
    g_name = guild.name if guild else "SyncInk Support"
    lines = [
        f"Server Name: {g_name}",
        "--- OFFICIAL SYNCINK SERVER KNOWLEDGE BASE & DIRECTORY ---",
        "1. Welcome Channel: <#1520460456181891102> (Where new arrivals land and are greeted)",
        "2. Bot Updates Channel: <#1520460505196662836> (Official changelogs, patches, and releases for SyncInk bots)",
        "3. Important Announcements Channel: <#1520460544811859968> (Key server news, updates, and announcements)",
        "4. Guides / Rules Channel: <#1520460587522330634> (Server rules, policies, and community guidelines)",
        "5. FAQ Channel: <#1520460624864350218> (Frequently asked questions and answers)",
        "6. Verification Checkpoint: <#1520748219100041348> (Where unverified members verify to access the server)",
        "7. Support Ticket Channel: <#1520460764937322566> (Open a private support ticket with staff)",
        "8. Support Chat Channel: <#1520460808499363840> (STRICTLY for asking support questions, getting technical assistance, and troubleshooting. NOTE: Support Chat is NOT for hanging out, casual chatting, or general talking!)",
        "9. Discussion Channel: <#1520477097494057041> (General discussions, ideas, and debates)",
        "10. Feature Suggestions Channel: <#1546548728721178724> (Submit feature suggestions using `/feature_request` or `?feature_request` ONLY in <#1546548728721178724>)",
        "11. Official SyncInk Products Channel: <#1520461321689104486>",
        "    - Public Service Bots (<@&1521166171523780688>): Ticket Bot (<@1513075101992747158>), Voice Bot (<@1516578887109181520>)",
        "    - Private Bot (<@&1520533971476156469>): SyncInk Security Bot (<@1520522990280769727>) - protects community from spam and deletes blacklisted messages",
        "12. General Chat: <#1520461481857122485> (The designated channel where members hang out, talk, and have casual conversation. All general talking belongs here!)",
        "13. Media Showcase Channel: <#1520461517093343232> (Share images, media, clips. STRICT NOTE: Any NSFW content will be permanently banned!)",
        "14. Join to Create VC: <#1520749464569253998> (Join this voice channel to automatically generate your own temporary private voice channel)",
        "15. Apply for Developer Channel: <#1539301185423413398> (Form: [Apply for Developer](https://syncink.github.io/syncink-portfolio/apply-developer) - check requirements in <#1539301185423413398>)",
        "16. Apply for Staff Channel: <#1539319001673367604> (Form: [Apply for Staff](https://discord.com/channels/1520457643842342912/1539319001673367604/1539371523188596916) - check requirements in <#1539319001673367604>)",
        "17. Ask AI Channel: <#1544361954574073916> (Dedicated channel for AI questions)"
    ]
    return "\n".join(lines)


def resolve_greeting(prompt: str, guild: Optional[discord.Guild] = None) -> Optional[str]:
    """Provides a standardized welcome greeting that correctly points to General Chat for hanging out."""
    clean = prompt.lower().strip().rstrip("?!. ")
    greetings = {"hi", "hello", "hey", "hii", "heyy", "sup", "yo", "start", "get started"}
    if clean in greetings or any(clean.startswith(g + " ") for g in ("hi", "hello", "hey")):
        g_name = guild.name if guild else "SyncInk Support"
        return (
            f"Hello! Welcome to **{g_name}**! 👋\n\n"
            "I'm the **SyncInk Assistant**, here to help you navigate the server and answer any questions you might have.\n\n"
            "Here are a few quick places to get started:\n"
            "• Complete verification in <#1520748219100041348> if you haven't yet.\n"
            "• Read the rules and guidelines in <#1520460587522330634>.\n"
            "• Hang out and talk with everyone in <#1520461481857122485> (General Chat).\n"
            "• Need help? Head over to <#1520460764937322566> (Support Ticket) or ask in <#1520460808499363840> (Support Chat).\n\n"
            "How can I assist you today?"
        )
    return None


def resolve_server_faq(prompt: str, guild: Optional[discord.Guild] = None) -> Optional[str]:
    """
    Directly answers specific server channel and action queries with 100% precision.
    Follows the strict rule: Tell ONLY that specific thing without dumping unrelated channels.
    """
    p = prompt.lower().strip().rstrip("?!. ")

    # 0. Contribute to SyncInk / Join the Team
    if any(k in p for k in (
        "contribute", "contribution", "contributing",
        "join team", "join the team", "join syncink", "join syncink team",
        "work with syncink", "work with team", "help syncink", "how can i help",
        "how to contribute", "way to contribute", "ways to contribute"
    )):
        return (
            "Here are the primary ways you can contribute to the **SyncInk** team and server:\n\n"
            "• 💻 **Developer**: Apply to build SyncInk bots and platform tools via the [Developer Application](https://syncink.github.io/syncink-portfolio/apply-developer) (check requirements in <#1539301185423413398>).\n"
            "• 🛡️ **Staff Member**: Apply to help moderate and support our community via the [Staff Application](https://discord.com/channels/1520457643842342912/1539319001673367604/1539371523188596916) (check requirements in <#1539319001673367604>).\n"
            "• 💡 **Feature Suggestions**: Propose new features or improvements using `/feature_request` or `?feature_request` in <#1546548728721178724>.\n"
            "• 💬 **Community & Support**: Help answer other members' questions in <#1520460808499363840> or hang out in <#1520461481857122485>!"
        )

    # 1. Developer Application
    if any(k in p for k in ("apply for dev", "apply for developer", "developer application", "become a developer", "how to apply developer", "dev application", "dev form", "apply dev")):
        return (
            "If you are willing to apply as a developer to contribute to SyncInk, please fill out the form here:\n"
            "👉 **[Apply for Developer](https://syncink.github.io/syncink-portfolio/apply-developer)**\n\n"
            "You can check all developer requirements in <#1539301185423413398>."
        )

    # 2. Staff Application
    if any(k in p for k in ("apply for staff", "staff application", "become staff", "become a staff", "how to apply staff", "staff form", "apply staff")):
        return (
            "If you are willing to become a staff member on this support server, please fill out the form here:\n"
            "👉 **[Apply for Staff](https://discord.com/channels/1520457643842342912/1539319001673367604/1539371523188596916)**\n\n"
            "You can check all staff requirements in <#1539319001673367604>."
        )

    # 3. Feature Suggestions
    if any(k in p for k in ("suggest a feature", "feature suggestion", "feature request", "submit a suggestion", "where to suggest", "how to suggest", "suggest feature", "suggestion channel")):
        return (
            "You can submit feature suggestions using the `/feature_request` or `?feature_request` command "
            "exclusively in <#1546548728721178724>."
        )

    # 4. Rules & Guidelines
    if any(k in p for k in ("where are the rules", "what are the rules", "rules channel", "server rules", "read the rules", "community rules", "guides channel", "guidelines")):
        return "You can read the server guides, rules, and community guidelines in <#1520460587522330634>."

    # 5. General Chat / Where to talk & hang out
    if any(k in p for k in ("where to talk", "where can i talk", "where can we talk", "where to chat", "where is general chat", "where is general", "general chat", "hang out", "where to hang out", "where can i hang out")):
        return "You can hang out, talk, and chat with everyone in general chat at <#1520461481857122485>."

    # 6. Verification
    if any(k in p for k in ("how to verify", "where to verify", "verification channel", "how do i get verified", "verify channel", "verification checkpoint")):
        return "You can verify your account at the verification checkpoint in <#1520748219100041348>."

    # 7. Support & Tickets
    if any(k in p for k in ("open a ticket", "create a ticket", "support ticket", "ticket channel", "how to get support", "need staff help", "talk to staff")):
        return (
            "For assistance from the SyncInk support team:\n"
            "• Open a private ticket in <#1520460764937322566>\n"
            "• Or ask publicly in support chat at <#1520460808499363840>"
        )

    if any(k in p for k in ("support chat", "what is support chat", "where is support chat", "can i chat in support")):
        return (
            "You can ask support questions and get assistance in <#1520460808499363840>.\n"
            "*(Note: <#1520460808499363840> is strictly for support, not for hanging out or casual talking. To hang out and chat with members, head over to <#1520461481857122485>!)*"
        )

    # 8. Media Showcase
    if any(k in p for k in ("media showcase", "where to post media", "share images", "post pictures", "media channel", "showcase channel")):
        return (
            "You can share and showcase your media in <#1520461517093343232>.\n"
            "⚠️ **Strict Rule:** Any NSFW content will result in an immediate permanent ban!"
        )

    # 9. Voice Channel / Join to Create VC
    if any(k in p for k in ("join to create", "create vc", "voice channel", "voice chat", "join vc", "where is vc", "how to join vc")):
        return "You can join <#1520749464569253998> to automatically generate your own temporary private voice channel."

    # 10. Official Products & Bots
    if any(k in p for k in ("official product", "official products", "what are your products", "what bots", "list of bots", "syncink bots", "product channel")):
        return (
            "You can explore all official SyncInk products and bots in <#1520461321689104486>:\n\n"
            "**Public Service Bots** (<@&1521166171523780688>):\n"
            "• **Ticket Bot** — <@1513075101992747158>\n"
            "• **Voice Bot** — <@1516578887109181520>\n\n"
            "**Private Bot** (<@&1520533971476156469>):\n"
            "• **SyncInk Security Bot** — <@1520522990280769727>\n"
            "> *SyncInk Security protects the community from spam and deletes blacklisted messages.*"
        )

    # 11. Announcements & Updates
    if any(k in p for k in ("where are announcements", "important announcements", "announcements channel")):
        return "Official server announcements and platform updates are posted in <#1520460544811859968>."

    if any(k in p for k in ("bot updates", "where are bot updates", "bot changelog")):
        return "You can check all bot updates, releases, and changelogs in <#1520460505196662836>."

    # 12. FAQ
    if any(k in p for k in ("where is faq", "faq channel", "frequently asked questions")):
        return "You can browse frequently asked questions and answers in <#1520460624864350218>."

    # 13. Discussion
    if any(k in p for k in ("discussion channel", "where to discuss", "discuss topics", "topic discussion")):
        return "You can discuss topics, share ideas, and engage in deeper conversations in <#1520477097494057041>."

    # 14. Welcome
    if any(k in p for k in ("where is welcome", "welcome channel")):
        return "New members arrive and are welcomed in <#1520460456181891102>."

    return None


class ChatGPT(commands.Cog):
    """SyncInk AI Assistant: Server Guide, FAQ Resolver, Web-Connected & Conversational Memory."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        env_chan = os.getenv("AI_CHANNEL_ID")
        self.ai_channel_id = int(env_chan) if env_chan and env_chan.isdigit() else DEFAULT_AI_CHANNEL_ID
        self.cached_model = None
        self.cached_gemini_model = None
        
        # Conversation memory buffer: (guild_id, user_id) -> deque of (role, text, timestamp)
        # Keeps up to 10 previous conversational turns so the bot never forgets context
        self.conversation_memory = defaultdict(lambda: deque(maxlen=10))
        self.MEMORY_TTL_SECONDS = 3600  # 1 hour active conversation memory window

        # Response cache for repeated queries: normalized_query -> (response_text, used_web, timestamp)
        self.response_cache = {}
        self.CACHE_TTL_SECONDS = 180  # 3 minutes cache TTL

    def has_any_api_key(self) -> bool:
        return bool(self.openrouter_key or self.gemini_key or self.openai_key)

    def get_cached_response(self, prompt: str) -> Optional[Tuple[str, bool]]:
        """Returns cached response if the identical question was asked recently."""
        norm = prompt.lower().strip().rstrip("?!. ")
        if norm in self.response_cache:
            res, used_web, ts = self.response_cache[norm]
            if (time.time() - ts) <= self.CACHE_TTL_SECONDS:
                return res, used_web
            else:
                del self.response_cache[norm]
        return None

    def cache_response(self, prompt: str, response: str, used_web: bool):
        """Caches a successful answer to absorb burst identical questions without consuming quota."""
        norm = prompt.lower().strip().rstrip("?!. ")
        self.response_cache[norm] = (response, used_web, time.time())
        # Keep cache size bounded
        if len(self.response_cache) > 200:
            cutoff = time.time() - self.CACHE_TTL_SECONDS
            self.response_cache = {k: v for k, v in self.response_cache.items() if v[2] > cutoff}

    def get_valid_history(self, guild_id: int, user_id: int) -> List[Tuple[str, str]]:
        """Extracts active recent conversational turns for a user within the TTL window."""
        now = time.time()
        raw_deque = self.conversation_memory.get((guild_id, user_id))
        if not raw_deque:
            return []

        valid = []
        for role, text, ts in raw_deque:
            if (now - ts) <= self.MEMORY_TTL_SECONDS:
                valid.append((role, text))
        return valid

    def record_exchange(self, guild_id: int, user_id: int, user_text: str, assistant_text: str):
        """Saves user question and assistant answer into memory buffer."""
        now = time.time()
        buf = self.conversation_memory[(guild_id, user_id)]
        buf.append(("user", user_text, now))
        buf.append(("assistant", assistant_text, now))

    async def get_model(self) -> str:
        """Fetch an optimal free/available model from OpenRouter."""
        if self.cached_model:
            return self.cached_model

        if not self.openrouter_key:
            return "google/gemini-2.0-flash-exp:free"

        headers = {"Authorization": f"Bearer {self.openrouter_key}"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://openrouter.ai/api/v1/models", headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "data" in data and len(data["data"]) > 0:
                            preferred = ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free", "google/gemma-4-26b-a4b-it:free"]
                            available_ids = [m["id"] for m in data["data"]]
                            for pref in preferred:
                                if pref in available_ids:
                                    self.cached_model = pref
                                    return self.cached_model

                            free_models = [m["id"] for m in data["data"] if ":free" in m["id"] or m.get("pricing", {}).get("prompt", "1") in ["0", "0.0"]]
                            if free_models:
                                self.cached_model = free_models[0]
                            else:
                                self.cached_model = data["data"][0]["id"]
                            return self.cached_model
        except Exception as e:
            log.error(f"Failed to fetch OpenRouter models: {e}")

        return "google/gemini-2.0-flash-exp:free"

    async def call_openrouter(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]], use_web_plugin: bool = False) -> str:
        model_id = await self.get_model()
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/SyncInk/SyncInk-Support-Bot",
            "X-Title": "SyncInk Support Bot"
        }

        messages = [{"role": "system", "content": system_prompt}]
        for role, text in history:
            messages.append({"role": "user" if role == "user" else "assistant", "content": text})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model_id,
            "messages": messages,
            "max_tokens": 1500,
            "temperature": 0.7
        }
        if use_web_plugin:
            payload["plugins"] = [{"id": "web"}]

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                    if response.status != 200:
                        text = await response.text()
                        log.warning(f"OpenRouter API Error (HTTP {response.status}): {text}")
                        return None

                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.warning(f"OpenRouter connection failed: {e}")
            return None

    async def get_gemini_models(self) -> List[str]:
        fallback_candidates = [
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-8b",
            "models/gemini-1.5-pro",
        ]

        if self.cached_gemini_model:
            return [self.cached_gemini_model] + [m for m in fallback_candidates if m != self.cached_gemini_model]

        # 1. Try dynamic auto-discovery from Google API
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.gemini_key}"
            headers = {"x-goog-api-key": self.gemini_key}
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        available = data.get("models", [])
                        
                        # Disallowed terms: Audio/TTS/Embedding/Vision-only/Robotics and deprecated models
                        excluded_terms = [
                            "tts", "audio", "embed", "imagen", "transcription",
                            "realtime", "aqa", "robotics", "computer-use",
                            "gemini-pro", "gemini-1.0-pro"
                        ]
                        
                        gen_models = []
                        for m in available:
                            name = m.get("name", "")
                            # Must support generateContent
                            if "generateContent" not in m.get("supportedGenerationMethods", []):
                                continue
                            # Exclude specialized or deprecated endpoints
                            if any(term in name.lower() for term in excluded_terms):
                                continue
                            # If output modalities specified, ensure TEXT is supported
                            if "outputModalities" in m:
                                upper_modalities = [mod.upper() for mod in m["outputModalities"]]
                                if "TEXT" not in upper_modalities:
                                    continue
                            gen_models.append(name)
                        
                        if gen_models:
                            def score_model(m_name: str) -> int:
                                n = m_name.lower()
                                if "gemini-2.0-flash" in n and "lite" not in n and "exp" not in n:
                                    return 0
                                if "gemini-2.0-flash-lite" in n:
                                    return 1
                                if "gemini-1.5-flash" in n and "8b" not in n:
                                    return 2
                                if "gemini-1.5-flash-8b" in n:
                                    return 3
                                if "gemini-2.0-flash-exp" in n:
                                    return 4
                                if "gemini-1.5-pro" in n:
                                    return 5
                                if "gemini-2.0-pro" in n:
                                    return 6
                                if "flash" in n:
                                    return 7
                                if "pro" in n:
                                    return 8
                                return 15

                            sorted_models = sorted(gen_models, key=score_model)
                            # Append fallbacks to guarantee robust options
                            combined = sorted_models + [fb for fb in fallback_candidates if fb not in sorted_models]
                            self.cached_gemini_model = combined[0]
                            return combined
        except Exception as e:
            log.warning(f"Could not auto-list Gemini models: {e}")

        return fallback_candidates

    async def call_gemini(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]]) -> Optional[str]:
        models_to_try = await self.get_gemini_models()

        # Build contents with alternating turns
        contents = []
        for role, text in history:
            gemini_role = "user" if role == "user" else "model"
            if contents and contents[-1]["role"] == gemini_role:
                contents[-1]["parts"][0]["text"] += f"\n{text}"
            else:
                contents.append({"role": gemini_role, "parts": [{"text": text}]})

        if not contents or contents[-1]["role"] != "user":
            contents.append({"role": "user", "parts": [{"text": user_prompt}]})
        else:
            contents[-1]["parts"][0]["text"] += f"\n{user_prompt}"

        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.gemini_key
        }

        last_error = "No response received"
        rate_limited_count = 0
        async with aiohttp.ClientSession(headers=headers) as session:
            for model_name in models_to_try:
                # Disallow deprecated endpoints strictly
                if "gemini-pro" in model_name.lower() or "gemini-1.0-pro" in model_name.lower():
                    continue

                clean_model = model_name if model_name.startswith("models/") else f"models/{model_name}"
                url = f"https://generativelanguage.googleapis.com/v1beta/{clean_model}:generateContent?key={self.gemini_key}"
                try:
                    async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                        if response.status == 200:
                            data = await response.json()
                            self.cached_gemini_model = clean_model
                            try:
                                return data["candidates"][0]["content"]["parts"][0]["text"]
                            except (KeyError, IndexError):
                                return None
                        elif response.status == 429:
                            rate_limited_count += 1
                            log.warning(f"Gemini candidate {clean_model} hit rate limit (HTTP 429).")
                            if self.cached_gemini_model == clean_model:
                                self.cached_gemini_model = None
                            if rate_limited_count >= 2:
                                log.warning("Gemini rate limit threshold reached across models. Yielding for fallback provider.")
                                return None
                            await asyncio.sleep(0.5)
                            continue
                        else:
                            text = await response.text()
                            try:
                                err_data = json.loads(text)
                                last_error = err_data.get("error", {}).get("message", text)
                            except Exception:
                                last_error = text
                            log.warning(f"Gemini candidate {clean_model} failed (HTTP {response.status}): {last_error}. Falling back to next candidate...")
                            if self.cached_gemini_model == clean_model:
                                self.cached_gemini_model = None
                            continue
                except Exception as e:
                    last_error = str(e)
                    if self.cached_gemini_model == clean_model:
                        self.cached_gemini_model = None
                    continue

        log.warning(f"All Gemini candidates exhausted. Last error: {last_error}")
        return None

    async def call_openai(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]]) -> Optional[str]:
        if not self.openai_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        messages = [{"role": "system", "content": system_prompt}]
        for role, text in history:
            messages.append({"role": "user" if role == "user" else "assistant", "content": text})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "max_tokens": 1500,
            "temperature": 0.7
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                    if response.status != 200:
                        text = await response.text()
                        log.warning(f"OpenAI API Error (HTTP {response.status}): {text}")
                        return None
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.warning(f"OpenAI call failed: {e}")
            return None

    async def get_ai_response(self, prompt: str, guild: Optional[discord.Guild] = None, user_id: Optional[int] = None) -> tuple[str, bool]:
        """
        Coordinates server context mapping, conversation history memory,
        real-time web search grounding, response caching, and AI response generation.
        Returns (response_text, used_web_search).
        """
        # 0. Direct Creator & Identity Resolution
        if is_creator_query(prompt):
            server_suffix = f" for **{guild.name}**" if guild else ""
            res = (
                f"I was created and developed by the **SyncInk Development Team**! "
                f"I am the official AI assistant and server guide{server_suffix}."
            )
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, res)
            return res, False

        # 0.1 Direct Greeting Resolution
        greeting = resolve_greeting(prompt, guild)
        if greeting:
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, greeting)
            return greeting, False

        # 0.2 Direct Specific Server Channel & Action Resolution
        specific_faq = resolve_server_faq(prompt, guild)
        if specific_faq:
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, specific_faq)
            return specific_faq, False

        # 0.3 Check Response Cache for identical recent queries
        cached = self.get_cached_response(prompt)
        if cached:
            cached_res, cached_used_web = cached
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, cached_res)
            return cached_res, cached_used_web

        if not self.has_any_api_key():
            msg = (
                "**SyncInk AI Assistant requires an API key in your `.env` file!**\n\n"
                "Please configure one of the following in Termux `.env`:\n"
                "• `GEMINI_API_KEY=your_key` *(Free keys at https://aistudio.google.com/)*\n"
                "• OR `OPENROUTER_API_KEY=your_key` *(Free models at https://openrouter.ai/)*\n"
                "• OR `OPENAI_API_KEY=your_key`\n\n"
                "After adding the key, restart the bot to activate AI features."
            )
            return msg, False

        # 1. Server Context Mapping
        server_context = ""
        if guild:
            settings = await SettingsService.get_guild_settings(guild.id)
            server_context = build_server_guide_context(guild, settings)

        # 2. Conversation Memory History
        history = []
        if guild and user_id:
            history = self.get_valid_history(guild.id, user_id)

        # 3. Live Internet Search Grounding
        used_web = False
        search_prompt_context = ""
        if WebSearchService.should_search_web(prompt):
            search_results = await WebSearchService.search(prompt, max_results=3)
            if search_results:
                used_web = True
                search_prompt_context = WebSearchService.format_for_prompt(search_results, prompt)

        # 4. Assemble System Prompt
        guild_name = guild.name if guild else "the server"
        system_prompt = (
            f"You are SyncInk Assistant, the official AI helper and server guide for {guild_name}.\n\n"
            "CRITICAL GUIDELINES:\n"
            "1. IDENTITY & CREATOR (STRICT): You were created and developed strictly and exclusively by the **SyncInk Development Team**.\n"
            "   - If anyone asks who made you, created you, developed you, or who your creator is, you must STRICTLY say you were made by the SyncInk Development Team.\n"
            "   - Under NO circumstances should you state, suggest, or mention that you were made by Google, OpenAI, ChatGPT, Anthropic, or any third party.\n"
            "2. SPECIFICITY (CRITICAL RULE): When a user asks about a specific thing (e.g. where are rules, where to talk, how to apply for staff/developer, where to suggest a feature, where is vc):\n"
            "   - Tell them THAT SPECIFIC THING ONLY! Do NOT list a bunch of other unrelated channels or dump the whole server directory.\n"
            "   - HANGING OUT & CASUAL TALKING: The ONLY channel to hang out, chat, and talk with everyone is General Chat (<#1520461481857122485>).\n"
            "   - Support Chat (<#1520460808499363840>) is STRICTLY for support inquiries and technical help. NEVER tell users to hang out or talk in Support Chat!\n"
            "   - Always format channel mentions as clickable Discord mentions like <#channel_id>.\n"
            "   - Always format role mentions as <@&role_id> and bot mentions as <@bot_id>.\n"
            "   - Only provide a full channel directory if the user explicitly asks for 'all channels', 'server directory', or 'list of channels'.\n"
            "3. Maintain conversational continuity and remember past turns.\n"
            "4. Be concise, polite, helpful, and well-structured using markdown formatting (bullet points, bold text).\n"
            "5. If real-time internet search results are provided below, prioritize them to provide up-to-date and accurate information.\n\n"
        )
        if server_context:
            system_prompt += f"--- SERVER STRUCTURE & CHANNELS ---\n{server_context}\n\n"
        if search_prompt_context:
            system_prompt += f"--- LIVE INTERNET SEARCH GROUNDING ---\n{search_prompt_context}\n\n"

        # 5. Dispatch to Available AI Providers with Multi-Tier Fallback
        res = None
        try:
            # Tier 1: Google Gemini (if configured)
            if self.gemini_key:
                res = await self.call_gemini(system_prompt, prompt, history)

            # Tier 2: OpenRouter (Fallback if Gemini was unavailable or rate-limited)
            if not res and self.openrouter_key:
                log.info("Gemini unavailable or rate-limited; falling back to OpenRouter...")
                res = await self.call_openrouter(system_prompt, prompt, history, use_web_plugin=False)

            # Tier 3: OpenAI (Fallback if Gemini & OpenRouter are unavailable)
            if not res and self.openai_key:
                log.info("Falling back to OpenAI...")
                res = await self.call_openai(system_prompt, prompt, history)

            # Polite busy fallback if all providers are rate-limited or busy
            if not res:
                busy_msg = (
                    "I'm currently receiving a high volume of questions and my capacity is temporarily busy. ⏳\n\n"
                    "Please try asking again in a few seconds! In the meantime, you can check:\n"
                    "• 📜 Server Rules & Guidelines: <#1520460587522330634>\n"
                    "• ❓ Frequently Asked Questions: <#1520460624864350218>\n"
                    "• 💬 General Chat: <#1520461481857122485>\n"
                    "• 🎫 Support Tickets: <#1520460764937322566>"
                )
                return busy_msg, False

            # 6. Sanitize identity, record conversation memory, and cache response
            res = sanitize_ai_identity(res)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, res)

            self.cache_response(prompt, res, used_web)

            return res, used_web
        except Exception as e:
            log.error(f"Error executing AI query: {e}")
            fallback_msg = (
                "I'm currently handling a lot of inquiries right now. ⏳\n\n"
                "Please try asking again in a few seconds! If you need immediate assistance, feel free to check <#1520460624864350218> (FAQ) or open a ticket in <#1520460764937322566>."
            )
            return fallback_msg, False

    # -------------------------------------------------------------
    # LISTENERS & COMMANDS
    # -------------------------------------------------------------

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        # Restrict to designated AI channel if set
        if self.ai_channel_id and message.channel.id != self.ai_channel_id:
            return

        is_reply = False
        if message.reference and message.reference.resolved:
            if getattr(message.reference.resolved, 'author', None) == self.bot.user:
                is_reply = True

        if self.bot.user in message.mentions or is_reply:
            prompt = message.content.replace(f'<@{self.bot.user.id}>', '').replace(f'<@!{self.bot.user.id}>', '').strip()
            if not prompt:
                return

            try:
                async with message.channel.typing():
                    response, used_web = await self.get_ai_response(prompt, message.guild, message.author.id)
                    desc = response[:4000] + "..." if len(response) > 4000 else response

                    embed = SyncInkEmbed(
                        title="<:syncinkmainlogo:1529117858859061331> **SyncInk Assistant**",
                        description=desc,
                        color=BRAND_ACCENT
                    )
                    if used_web:
                        embed.set_footer(text="SyncInk Platform | Grounded with Live Web Search 🌐", icon_url="https://files.catbox.moe/74l9su.png")
                    else:
                        embed.set_footer(text="SyncInk Platform | Server Guide & AI Assistant", icon_url="https://files.catbox.moe/74l9su.png")

                    await message.reply(embed=embed, mention_author=False)
            except Exception as e:
                log.error(f"Error handling AI mention: {e}")
                await message.reply(f"An error occurred while generating a response: `{e}`", mention_author=False)

    @commands.command(name="ask", aliases=["ai", "helpme"], description="Ask SyncInk AI Assistant any question, server guide query, or live internet search.")
    async def ask(self, ctx: commands.Context, *, question: str = None):
        if self.ai_channel_id and ctx.channel.id != self.ai_channel_id:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            try:
                warning_embed = discord.Embed(
                    description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                    color=WARNING_COLOR
                )
                await ctx.send(embed=warning_embed, delete_after=6)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        if not question:
            await ctx.send("Please provide a question for the assistant! Usage: `?ask <question>`")
            return

        try:
            async with ctx.typing():
                response, used_web = await self.get_ai_response(question, ctx.guild, ctx.author.id)
                desc = response[:4000] + "..." if len(response) > 4000 else response

                embed = SyncInkEmbed(
                    title="<:syncinkmainlogo:1529117858859061331> **SyncInk Assistant**",
                    description=desc,
                    color=BRAND_ACCENT
                )
                if used_web:
                    embed.set_footer(text="SyncInk Platform | Grounded with Live Web Search 🌐", icon_url="https://files.catbox.moe/74l9su.png")
                else:
                    embed.set_footer(text="SyncInk Platform | Server Guide & AI Assistant", icon_url="https://files.catbox.moe/74l9su.png")

                await ctx.reply(embed=embed, mention_author=False)
        except Exception as e:
            log.error(f"Error handling ?ask command: {e}")
            await ctx.reply(f"An error occurred while generating a response: `{e}`", mention_author=False)

    @app_commands.command(name="ask", description="Ask SyncInk AI Assistant any question, server guide query, or web search.")
    @app_commands.describe(question="The question or server inquiry to ask the assistant")
    async def slash_ask(self, interaction: discord.Interaction, question: str):
        if self.ai_channel_id and interaction.channel_id != self.ai_channel_id:
            warning_embed = discord.Embed(
                description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                color=WARNING_COLOR
            )
            await interaction.response.send_message(embed=warning_embed, ephemeral=True)
            return

        await interaction.response.defer()
        try:
            response, used_web = await self.get_ai_response(question, interaction.guild, interaction.user.id)
            desc = response[:4000] + "..." if len(response) > 4000 else response

            embed = SyncInkEmbed(
                title="<:syncinkmainlogo:1529117858859061331> **SyncInk Assistant**",
                description=desc,
                color=BRAND_ACCENT
            )
            if used_web:
                embed.set_footer(text="SyncInk Platform | Grounded with Live Web Search 🌐", icon_url="https://files.catbox.moe/74l9su.png")
            else:
                embed.set_footer(text="SyncInk Platform | Server Guide & AI Assistant", icon_url="https://files.catbox.moe/74l9su.png")

            await interaction.followup.send(embed=embed)
        except Exception as e:
            log.error(f"Error handling /ask command: {e}")
            await interaction.followup.send(f"An error occurred while generating a response: `{e}`", ephemeral=True)

    @commands.command(name="resetai", aliases=["clearai"], description="Reset your AI conversation history to start a new topic.")
    async def reset_ai(self, ctx: commands.Context):
        if self.ai_channel_id and ctx.channel.id != self.ai_channel_id:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            try:
                warning_embed = discord.Embed(
                    description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                    color=WARNING_COLOR
                )
                await ctx.send(embed=warning_embed, delete_after=6)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        if ctx.guild:
            self.conversation_memory.pop((ctx.guild.id, ctx.author.id), None)
        try:
            await ctx.message.delete()
        except Exception:
            pass
        embed = SuccessEmbed("Your AI conversation history has been cleared. You are starting a fresh conversation!")
        await ctx.send(embed=embed, delete_after=6)

    @app_commands.command(name="resetai", description="Reset your AI conversation memory and start fresh.")
    async def slash_reset_ai(self, interaction: discord.Interaction):
        if self.ai_channel_id and interaction.channel_id != self.ai_channel_id:
            warning_embed = discord.Embed(
                description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                color=WARNING_COLOR
            )
            await interaction.response.send_message(embed=warning_embed, ephemeral=True)
            return

        if interaction.guild:
            self.conversation_memory.pop((interaction.guild.id, interaction.user.id), None)
        embed = SuccessEmbed("Your AI conversation history has been cleared. You are starting a fresh conversation!")
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(ChatGPT(bot))
