import discord
from discord.ext import commands
import os
import random
import aiohttp
from utils.logger import log

class ChatGPT(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        # Load multiple keys separated by commas
        keys_env = os.getenv("OPENAI_API_KEY", "")
        self.api_keys = [k.strip() for k in keys_env.split(",") if k.strip()]
        
        # Load allowed channel
        self.ai_channel_id = os.getenv("AI_CHANNEL_ID")
        if self.ai_channel_id:
            self.ai_channel_id = int(self.ai_channel_id)
        
        self.system_prompt = (
            "You are a helpful, professional, and knowledgeable AI assistant. "
            "You provide clear, concise, and accurate answers to user questions."
        )

    async def get_ai_response(self, prompt: str) -> str:
        """Helper to call OpenAI API using aiohttp to avoid Android rust compilation issues"""
        if not self.api_keys:
            return "My OpenAI API keys have not been set up yet! Please configure `OPENAI_API_KEY`."
            
        selected_key = random.choice(self.api_keys)
        headers = {
            "Authorization": f"Bearer {selected_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1500,
            "temperature": 0.7
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload) as response:
                    if response.status != 200:
                        text = await response.text()
                        log.error(f"OpenAI API Error ({response.status}): {text}")
                        if response.status == 401:
                            return "Error 401: Unauthorized. Please check that your OpenAI API keys are real and valid!"
                        return f"An error occurred (HTTP {response.status})."
                        
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.error(f"OpenAI API HTTP Error: {e}")
            return f"An error occurred while contacting the AI: {str(e)}"

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
                    title="<:ChatGPT:1544367927501787246> OpenAI Response",
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
            title="<:ChatGPT:1544367927501787246> OpenAI Response",
            description=response,
            color=0x2b2d31
        )
        await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(ChatGPT(bot))
