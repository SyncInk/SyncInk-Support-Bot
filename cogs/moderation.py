import discord
from discord.ext import commands
from discord import app_commands
from services.mod_service import ModService
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed
from utils.permissions import has_permission
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
            embed = ErrorEmbed(
                description=f"You have received a formal warning in **{interaction.guild.name}**.",
                resolution="Please review the server rules to avoid further moderation actions."
            )
            embed.title = "Official Warning"
            embed.add_field(name="Reason", value=reason, inline=False)
            await member.send(embed=embed)
        except discord.Forbidden:
            pass

        await interaction.response.send_message(embed=SuccessEmbed(f"Warning issued to {member.mention} for: `{reason}`"), ephemeral=True)

    @app_commands.command(name="timeout", description="Temporarily restrict a member's chat access.")
    @app_commands.default_permissions(moderate_members=True)
    @has_permission(moderate_members=True)
    async def timeout(self, interaction: discord.Interaction, member: discord.Member, duration_minutes: int, reason: str):
        try:
            duration = timedelta(minutes=duration_minutes)
            await member.timeout(duration, reason=reason)
            await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "TIMEOUT", reason)
            
            embed = SuccessEmbed(f"{member.mention} has been timed out for {duration_minutes} minutes.")
            embed.add_field(name="Reason", value=reason, inline=False)
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except discord.Forbidden:
            embed = ErrorEmbed(
                description="Failed to timeout member due to role hierarchy constraints.",
                resolution="Ensure the bot's role is positioned higher than the target member's top role."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
    @app_commands.command(name="purge", description="Bulk delete recent messages in the current channel.")
    @app_commands.default_permissions(manage_messages=True)
    @has_permission(manage_messages=True)
    async def purge(self, interaction: discord.Interaction, amount: app_commands.Range[int, 1, 100]):
        await interaction.response.defer(ephemeral=True)
        try:
            deleted = await interaction.channel.purge(limit=amount)
            await interaction.followup.send(embed=SuccessEmbed(f"Successfully deleted {len(deleted)} messages from this channel."))
        except Exception as e:
            await interaction.followup.send(embed=ErrorEmbed(description="An error occurred while purging messages.", resolution=f"Details: `{e}`"))

async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
