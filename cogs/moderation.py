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

    @app_commands.command(name="warn", description="Issue a formal warning to a server member.")
    @app_commands.default_permissions(moderate_members=True)
    @has_permission(moderate_members=True)
    async def warn(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "WARN", reason)
        
        try:
            embed = ErrorEmbed(f"You received a warning in **{interaction.guild.name}**.\n\n**Reason:** {reason}")
            await member.send(embed=embed)
        except discord.Forbidden:
            pass

        success_msg = i18n.get("mod_warn_success", user=member.mention, reason=reason)
        await interaction.response.send_message(embed=SuccessEmbed(success_msg), ephemeral=True)

    @app_commands.command(name="timeout", description="Temporarily restrict a member's chat access.")
    @app_commands.default_permissions(moderate_members=True)
    @has_permission(moderate_members=True)
    async def timeout(self, interaction: discord.Interaction, member: discord.Member, duration_minutes: int, reason: str):
        try:
            duration = timedelta(minutes=duration_minutes)
            await member.timeout(duration, reason=reason)
            await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "TIMEOUT", reason)
            await interaction.response.send_message(embed=SuccessEmbed(f"Applied timeout to {member.mention} for {duration_minutes}m."), ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(embed=ErrorEmbed("Insufficient permissions to timeout this member."), ephemeral=True)
            
    @app_commands.command(name="purge", description="Bulk delete recent messages in the current channel.")
    @app_commands.default_permissions(manage_messages=True)
    @has_permission(manage_messages=True)
    async def purge(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100]):
        await interaction.response.defer(ephemeral=True)
        try:
            deleted = await interaction.channel.purge(limit=amount)
            await interaction.followup.send(embed=SuccessEmbed(f"Cleared {len(deleted)} messages successfully."))
        except Exception as e:
            await interaction.followup.send(embed=ErrorEmbed(f"Purge failed: {e}"))

async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
