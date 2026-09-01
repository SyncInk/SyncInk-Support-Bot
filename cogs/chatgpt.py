import discord
from discord.ext import commands
import os
import random
from openai import AsyncOpenAI
from utils.logger import log

class ChatGPT(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        
        self.api_key = os.getenv("PERPLEXITY_API_KEY")
        self.client = None
        if self.api_key:
            self.client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://api.perplexity.ai/router/v1"
            )
            
        self.ai_channel_id = os.getenv("AI_CHANNEL_ID")
        if self.ai_channel_id:
            self.ai_channel_id = int(self.ai_channel_id)
            
        self.system_prompt = (
            "You are a helpful, professional, and knowledgeable AI assistant. "
            "You provide clear, concise, and accurate answers to user questions."
        )
        self.cached_model = None

    async def get_model(self) -> str:
        """Fetch the first available model from Perplexity Router API"""
        if self.cached_model:
            return self.cached_model
            
        try:
            models_response = await self.client.models.list()
            self.cached_model = models_response.data[0].id
            return self.cached_model
        except Exception as e:
            log.error(f"Failed to fetch Perplexity models: {e}")
            raise e

    async def get_ai_response(self, prompt: str) -> str:
        """Helper to call Perplexity Router API"""
        if not self.client:
            return "My Perplexity API key has not been set up yet! Please configure `PERPLEXITY_API_KEY`."
            
        try:
            model_id = await self.get_model()
            
            response = await self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            usage = response.usage
            prompt_tokens = getattr(usage, 'prompt_tokens', 0)
            completion_tokens = getattr(usage, 'completion_tokens', 0)
            log.info(f"Perplexity Router usage: {prompt_tokens} prompt tokens, {completion_tokens} completion tokens.")
            
            return response.choices[0].message.content
        except Exception as e:
            log.error(f"Perplexity API Error: {e}")
            error_str = str(e)
            if "401" in error_str:
                return "Error 401: Unauthorized. Please check that your PERPLEXITY_API_KEY is real and valid!"
            elif "429" in error_str:
                return "Error 429: Rate limited or model overloaded. Please honor the Retry-After header and try again."
            return f"An error occurred while contacting the AI: {error_str}"

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        # Restrict to a specific channel if configured
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

            async with message.channel.typing():
                response = await self.get_ai_response(prompt)
                
                embed = discord.Embed(
                    title="<:CharGPT:1544376850476826796> OpenAI Response",
                    description=response,
                    color=0x2b2d31
                )
                await message.reply(embed=embed, mention_author=False)

    @discord.app_commands.command(name="ask", description="Ask the AI a question")
    @discord.app_commands.describe(question="The question you want to ask")
    async def ask(self, interaction: discord.Interaction, question: str):
        if self.ai_channel_id and interaction.channel_id != self.ai_channel_id:
            await interaction.response.send_message(f"This command can only be used in <#{self.ai_channel_id}>!", ephemeral=True)
            return
            
        await interaction.response.defer(thinking=True)
        response = await self.get_ai_response(question)
        
        embed = discord.Embed(
            title="<:CharGPT:1544376850476826796> OpenAI Response",
            description=response,
            color=0x2b2d31
        )
        await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(ChatGPT(bot))
