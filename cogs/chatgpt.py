import discord
from discord.ext import commands
from discord import app_commands
import os
import aiohttp
import time
import json
from collections import defaultdict, deque
from typing import Optional, List, Tuple
from utils.logger import log
from utils.emojis import Emojis
from utils.ui import SyncInkEmbed, SuccessEmbed, BRAND_ACCENT, ERROR_COLOR, WARNING_COLOR
from services.web_search_service import WebSearchService
from services.settings_service import SettingsService

DEFAULT_AI_CHANNEL_ID = 1544361954574073916

def build_server_guide_context(guild: discord.Guild, settings: Optional[dict] = None) -> str:
    """Extracts structured server channel map and key locations for the AI assistant."""
    if not guild:
        return ""

    channel_map = {}

    # 1. Verification Checkpoint
    target_verification_id = 1520748219100041348
    if settings and settings.get('verification_channel_id'):
        try:
            target_verification_id = int(settings['verification_channel_id'])
        except (ValueError, TypeError):
            pass

    verif_chan = guild.get_channel(target_verification_id)
    if verif_chan:
        channel_map["Verification Checkpoint"] = f"<#{verif_chan.id}>"
    else:
        for c in guild.text_channels:
            if any(k in c.name.lower() for k in ("verify", "verification", "checkpoint")):
                channel_map["Verification Checkpoint"] = f"<#{c.id}>"
                break

    # 2. Welcome Channel
    if settings and settings.get('welcome_channel_id'):
        try:
            w_chan = guild.get_channel(int(settings['welcome_channel_id']))
            if w_chan:
                channel_map["Welcome Channel"] = f"<#{w_chan.id}>"
        except (ValueError, TypeError):
            pass

    # 3. Suggestions Channel
    if settings and settings.get('suggestion_channel_id'):
        try:
            s_chan = guild.get_channel(int(settings['suggestion_channel_id']))
            if s_chan:
                channel_map["Suggestions & Feature Requests"] = f"<#{s_chan.id}>"
        except (ValueError, TypeError):
            pass

    # 4. Scan channels for Rules, General Chat, Support, Announcements
    for ch in guild.text_channels:
        name = ch.name.lower()
        if "Rules & Guidelines" not in channel_map and any(k in name for k in ("rule", "guideline")):
            channel_map["Rules & Guidelines"] = f"<#{ch.id}>"
        elif "General Chat (Where to talk)" not in channel_map and any(k in name for k in ("general", "chat", "lounge", "main", "talk")):
            channel_map["General Chat (Where to talk)"] = f"<#{ch.id}>"
        elif "Support & Assistance" not in channel_map and any(k in name for k in ("support", "help", "ticket", "assist")):
            channel_map["Support & Assistance"] = f"<#{ch.id}>"
        elif "Announcements" not in channel_map and any(k in name for k in ("announcement", "updates", "news")):
            channel_map["Announcements"] = f"<#{ch.id}>"
        elif "Bot Commands" not in channel_map and any(k in name for k in ("bot-command", "commands", "bot")):
            channel_map["Bot Commands"] = f"<#{ch.id}>"

    guide_lines = [
        f"Server Name: {guild.name}",
        f"Server Owner: {guild.owner.name if guild.owner else 'Server Owner'}",
        "Available Server Channels (CRITICAL: When directing users to a channel, always format it as a Discord channel mention <#channel_id>):"
    ]
    for label, mention in channel_map.items():
        guide_lines.append(f"- {label}: {mention}")

    return "\n".join(guide_lines)


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

    def has_any_api_key(self) -> bool:
        return bool(self.openrouter_key or self.gemini_key or self.openai_key)

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

        async with aiohttp.ClientSession() as session:
            async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                if response.status != 200:
                    text = await response.text()
                    log.error(f"OpenRouter API Error ({response.status}): {text}")
                    if response.status == 401:
                        return "Error 401: Unauthorized. Please check that your `OPENROUTER_API_KEY` is valid."
                    elif response.status == 402:
                        return "Error 402: Insufficient credits on OpenRouter. Please select a free model or recharge."
                    elif response.status == 429:
                        return "Error 429: Rate limited or model overloaded. Please retry in a few seconds."
                    return f"AI provider returned HTTP {response.status}."

                data = await response.json()
                return data["choices"][0]["message"]["content"]

    async def get_gemini_models(self) -> List[str]:
        fallback_candidates = [
            "models/gemini-2.0-flash",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-latest",
            "models/gemini-2.0-flash-exp",
            "models/gemini-2.0-flash-lite",
            "models/gemini-1.5-flash-8b",
            "models/gemini-1.5-pro",
            "models/gemini-pro"
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
                        
                        # Disallowed terms: Audio/TTS/Embedding/Vision-only/Robotics
                        excluded_terms = ["tts", "audio", "embed", "imagen", "transcription", "realtime", "aqa", "robotics", "computer-use"]
                        
                        gen_models = []
                        for m in available:
                            name = m.get("name", "")
                            # Must support generateContent
                            if "generateContent" not in m.get("supportedGenerationMethods", []):
                                continue
                            # Exclude specialized modalities (audio/TTS/embedding)
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
                                if "gemini-1.5-flash" in n and "8b" not in n:
                                    return 1
                                if "gemini-2.0-flash-exp" in n:
                                    return 2
                                if "gemini-2.0-flash-lite" in n:
                                    return 3
                                if "gemini-1.5-flash-8b" in n:
                                    return 4
                                if "gemini-1.5-pro" in n:
                                    return 5
                                if "gemini-2.0-pro" in n:
                                    return 6
                                if "gemini-pro" in n:
                                    return 7
                                if "flash" in n:
                                    return 8
                                if "pro" in n:
                                    return 9
                                return 15

                            sorted_models = sorted(gen_models, key=score_model)
                            # Append fallbacks to guarantee robust options
                            combined = sorted_models + [fb for fb in fallback_candidates if fb not in sorted_models]
                            self.cached_gemini_model = combined[0]
                            return combined
        except Exception as e:
            log.warning(f"Could not auto-list Gemini models: {e}")

        return fallback_candidates

    async def call_gemini(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]]) -> str:
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
        async with aiohttp.ClientSession(headers=headers) as session:
            for model_name in models_to_try:
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
                                return "No response content received from Gemini."
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

        return f"Gemini Error: Could not connect to an active model. ({last_error})"

    async def call_openai(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]]) -> str:
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
        async with aiohttp.ClientSession() as session:
            async with session.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                if response.status != 200:
                    text = await response.text()
                    log.error(f"OpenAI API Error ({response.status}): {text}")
                    return f"OpenAI error (HTTP {response.status})."
                data = await response.json()
                return data["choices"][0]["message"]["content"]

    async def get_ai_response(self, prompt: str, guild: Optional[discord.Guild] = None, user_id: Optional[int] = None) -> tuple[str, bool]:
        """
        Coordinates server context mapping, conversation history memory,
        real-time web search grounding, and AI response generation.
        Returns (response_text, used_web_search).
        """
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
            "GUIDELINES:\n"
            "1. When guiding members to rules, verification, chat, or support channels, ALWAYS use Discord clickable channel mentions in the format <#channel_id>.\n"
            "2. Maintain conversational continuity and remember what was discussed previously in this conversation.\n"
            "3. Be concise, polite, helpful, and well-structured using markdown formatting (bullet points, bold text).\n"
            "4. If real-time internet search results are provided below, prioritize them to provide up-to-date and accurate information.\n\n"
        )
        if server_context:
            system_prompt += f"--- SERVER STRUCTURE & CHANNELS ---\n{server_context}\n\n"
        if search_prompt_context:
            system_prompt += f"--- LIVE INTERNET SEARCH GROUNDING ---\n{search_prompt_context}\n\n"

        # 5. Dispatch to Available AI Provider
        try:
            if self.gemini_key:
                res = await self.call_gemini(system_prompt, prompt, history)
            elif self.openrouter_key:
                res = await self.call_openrouter(system_prompt, prompt, history, use_web_plugin=False)
            elif self.openai_key:
                res = await self.call_openai(system_prompt, prompt, history)
            else:
                res = "No configured AI provider found."

            # 6. Record conversation memory
            if guild and user_id and not res.startswith("Error") and not res.startswith("AI provider"):
                self.record_exchange(guild.id, user_id, prompt, res)

            return res, used_web
        except Exception as e:
            log.error(f"Error executing AI query: {e}")
            return f"An unexpected error occurred while processing your request: `{e}`", False

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
