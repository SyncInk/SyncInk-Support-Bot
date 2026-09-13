import discord
from discord.ext import commands
from discord import app_commands
import os
import aiohttp
from typing import Optional
from utils.logger import log
from utils.emojis import Emojis
from utils.ui import SyncInkEmbed, BRAND_ACCENT, ERROR_COLOR
from services.web_search_service import WebSearchService
from services.settings_service import SettingsService

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
    """SyncInk AI Assistant: Server Guide, FAQ Resolver & Web-Connected Intelligence."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.ai_channel_id = os.getenv("AI_CHANNEL_ID")
        if self.ai_channel_id:
            try:
                self.ai_channel_id = int(self.ai_channel_id)
            except ValueError:
                self.ai_channel_id = None
        self.cached_model = None

    def has_any_api_key(self) -> bool:
        return bool(self.openrouter_key or self.gemini_key or self.openai_key)

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
                            # Prefer high performance free models
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

    async def call_openrouter(self, system_prompt: str, user_prompt: str, use_web_plugin: bool = False) -> str:
        model_id = await self.get_model()
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/SyncInk/SyncInk-Support-Bot",
            "X-Title": "SyncInk Support Bot"
        }
        payload = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
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

    async def call_gemini(self, system_prompt: str, user_prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": [
                {"role": "user", "parts": [{"text": user_prompt}]}
            ]
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                if response.status != 200:
                    text = await response.text()
                    log.error(f"Gemini API Error ({response.status}): {text}")
                    return f"Gemini API error (HTTP {response.status})."
                data = await response.json()
                try:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    return "No response received from Gemini."

    async def call_openai(self, system_prompt: str, user_prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
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

    async def get_ai_response(self, prompt: str, guild: Optional[discord.Guild] = None) -> tuple[str, bool]:
        """
        Coordinates server context mapping, real-time web search grounding,
        and AI response generation. Returns (response_text, used_web_search).
        """
        if not self.has_any_api_key():
            msg = (
                "**SyncInk AI Assistant requires an API key in your `.env` file!**\n\n"
                "Please configure one of the following in Termux `.env`:\n"
                "• `OPENROUTER_API_KEY=your_key` *(Free models available at https://openrouter.ai/)*\n"
                "• OR `GEMINI_API_KEY=your_key` *(Free keys at https://aistudio.google.com/)*\n"
                "• OR `OPENAI_API_KEY=your_key`\n\n"
                "After adding the key, restart the bot to activate AI features."
            )
            return msg, False

        # 1. Server Context Mapping
        server_context = ""
        if guild:
            settings = await SettingsService.get_guild_settings(guild.id)
            server_context = build_server_guide_context(guild, settings)

        # 2. Live Internet Search Grounding
        used_web = False
        search_prompt_context = ""
        if WebSearchService.should_search_web(prompt):
            search_results = await WebSearchService.search(prompt, max_results=3)
            if search_results:
                used_web = True
                search_prompt_context = WebSearchService.format_for_prompt(search_results, prompt)

        # 3. Assemble System Prompt
        guild_name = guild.name if guild else "the server"
        system_prompt = (
            f"You are SyncInk Assistant, the official AI helper and server guide for {guild_name}.\n\n"
            "GUIDELINES:\n"
            "1. When guiding members to rules, verification, chat, or support channels, ALWAYS use Discord clickable channel mentions in the format <#channel_id>.\n"
            "2. Be concise, polite, helpful, and well-structured using markdown formatting (bullet points, bold text).\n"
            "3. If real-time internet search results are provided below, prioritize them to provide up-to-date and accurate information.\n\n"
        )
        if server_context:
            system_prompt += f"--- SERVER STRUCTURE & CHANNELS ---\n{server_context}\n\n"
        if search_prompt_context:
            system_prompt += f"--- LIVE INTERNET SEARCH GROUNDING ---\n{search_prompt_context}\n\n"

        # 4. Dispatch to Available AI Provider
        try:
            if self.openrouter_key:
                res = await self.call_openrouter(system_prompt, prompt, use_web_plugin=False)
            elif self.gemini_key:
                res = await self.call_gemini(system_prompt, prompt)
            elif self.openai_key:
                res = await self.call_openai(system_prompt, prompt)
            else:
                res = "No configured AI provider found."

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
                    response, used_web = await self.get_ai_response(prompt, message.guild)
                    desc = response[:4000] + "..." if len(response) > 4000 else response

                    embed = SyncInkEmbed(
                        title="<:trusted_user:1547621146558730340> **SyncInk Assistant**",
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
            except (discord.Forbidden, discord.NotFound):
                pass
            try:
                await ctx.send(f"This command can only be used in <#{self.ai_channel_id}>!", delete_after=6)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        if not question:
            await ctx.send("Please provide a question for the assistant! Usage: `?ask <question>`")
            return

        try:
            async with ctx.typing():
                response, used_web = await self.get_ai_response(question, ctx.guild)
                desc = response[:4000] + "..." if len(response) > 4000 else response

                embed = SyncInkEmbed(
                    title="<:trusted_user:1547621146558730340> **SyncInk Assistant**",
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
            await interaction.response.send_message(
                f"This command can only be used in <#{self.ai_channel_id}>!",
                ephemeral=True
            )
            return

        await interaction.response.defer()
        try:
            response, used_web = await self.get_ai_response(question, interaction.guild)
            desc = response[:4000] + "..." if len(response) > 4000 else response

            embed = SyncInkEmbed(
                title="<:trusted_user:1547621146558730340> **SyncInk Assistant**",
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


async def setup(bot: commands.Bot):
    await bot.add_cog(ChatGPT(bot))
