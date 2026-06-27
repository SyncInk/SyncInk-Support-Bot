import discord
from discord.ext import commands
from discord import app_commands
from services.mod_service import ModService
from utils.ui import SuccessEmbed, ErrorEmbed
from utils.permissions import has_permission
from utils.i18n import i18n
from datetime import timedelta

class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="warn", description="Issue a warning to a member")
    @has_permission(moderate_members=True)
    async def warn(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "WARN", reason)
        
        try:
            embed = ErrorEmbed(f"You were warned in {interaction.guild.name}.\n**Reason:** {reason}")
            await member.send(embed=embed)
        except:
            pass

        success_msg = i18n.get("mod_warn_success", user=member.mention, reason=reason)
        await interaction.response.send_message(embed=SuccessEmbed(success_msg), ephemeral=True)

    @app_commands.command(name="timeout", description="Timeout a member")
    @has_permission(moderate_members=True)
    async def timeout(self, interaction: discord.Interaction, member: discord.Member, duration_minutes: int, reason: str):
        try:
            duration = timedelta(minutes=duration_minutes)
            await member.timeout(duration, reason=reason)
            await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "TIMEOUT", reason)
            await interaction.response.send_message(embed=SuccessEmbed(f"Timed out {member.mention} for {duration_minutes} minutes."), ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(embed=ErrorEmbed("I don't have permission to timeout this member."), ephemeral=True)
            
    @app_commands.command(name="purge", description="Purge messages")
    @has_permission(manage_messages=True)
    async def purge(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100]):
        await interaction.response.defer(ephemeral=True)
        try:
            deleted = await interaction.channel.purge(limit=amount)
            await interaction.followup.send(embed=SuccessEmbed(f"Deleted {len(deleted)} messages."))
        except Exception as e:
            await interaction.followup.send(embed=ErrorEmbed(f"An error occurred: {e}"))

async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
