import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed
from utils.logger import log

class SuggestionModal(discord.ui.Modal, title="Submit Feedback"):
    suggestion = discord.ui.TextInput(
        label="Your Suggestion / Bug Report",
        style=discord.TextStyle.paragraph,
        placeholder="Please describe your idea or the issue you found...",
        min_length=10,
        max_length=1024
    )

    async def on_submit(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="💡 New Feedback")
        embed.set_author(name=f"{interaction.user} ({interaction.user.id})", icon_url=interaction.user.display_avatar.url)
        embed.description = self.suggestion.value
        
        # In a full implementation, we'd send this to a specific feedback channel set in the DB
        # For now, we just send it to the channel where it was invoked
        msg = await interaction.channel.send(embed=embed)
        
        try:
            await msg.add_reaction("👍")
            await msg.add_reaction("👎")
        except discord.Forbidden:
            log.warning("Could not add reactions to suggestion message.")
            
        await interaction.response.send_message(embed=SuccessEmbed("Your feedback has been submitted successfully!"), ephemeral=True)

class Feedback(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="suggest", description="Submit a suggestion or bug report to the developers")
    async def suggest(self, interaction: discord.Interaction):
        await interaction.response.send_modal(SuggestionModal())

async def setup(bot: commands.Bot):
    await bot.add_cog(Feedback(bot))
