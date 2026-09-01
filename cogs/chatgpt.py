import discord
from discord.ext import commands
import os
import random
from openai import AsyncOpenAI
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
        """Helper to call OpenAI API using a random key from the pool"""
        if not self.api_keys:
            return "My OpenAI API keys have not been set up yet! Please configure `OPENAI_API_KEY`."
            
        # Rotate keys by picking a random one per request
        selected_key = random.choice(self.api_keys)
        client = AsyncOpenAI(api_key=selected_key)
        
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            log.error(f"OpenAI API Error: {e}")
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
            prompt = message.content.replace(f'<@{self.bot.user.id}>', '').strip()
            
            if not prompt:
                return

            async with message.channel.typing():
                response = await self.get_ai_response(prompt)
                
                embed = discord.Embed(
                    title="🤖 OpenAI Response",
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
            title="🤖 OpenAI Response",
            description=response,
            color=0x2b2d31
        )
        await interaction.followup.send(embed=embed)

async def setup(bot):
    await bot.add_cog(ChatGPT(bot))
