import discord
from discord.ext import commands
import os
from openai import AsyncOpenAI
from utils.logger import log

class ChatGPT(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        
        # System prompt to give the bot its persona
        self.system_prompt = (
            "You are a helpful, professional, and knowledgeable AI assistant. "
            "You provide clear, concise, and accurate answers to user questions."
        )

    async def get_ai_response(self, prompt: str) -> str:
        """Helper to call OpenAI API"""
        if not self.client:
            return "My OpenAI API key has not been set up yet! Please ask the owner to configure `OPENAI_API_KEY` in their `.env` file."
            
        try:
            response = await self.client.chat.completions.create(
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
        # Ignore bots and webhooks
        if message.author.bot or not message.guild:
            return

        # Check if the bot was mentioned or replied to
        is_reply = False
        if message.reference and message.reference.resolved:
            if getattr(message.reference.resolved, 'author', None) == self.bot.user:
                is_reply = True

        if self.bot.user in message.mentions or is_reply:
            # Clean the prompt by removing the bot mention itself
            prompt = message.content.replace(f'<@{self.bot.user.id}>', '').strip()
            
            if not prompt:
                return

            # Show typing indicator while generating
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
        """Slash command version of the AI interaction"""
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
