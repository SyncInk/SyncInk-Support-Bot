import discord
from discord.ext import commands
from discord import app_commands
from services.mod_service import ModService
from services.settings_service import SettingsService
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed, WARNING_COLOR, ERROR_COLOR
from utils.permissions import has_permission
from datetime import timedelta
from utils.logger import log

class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _dispatch_mod_log(self, guild: discord.Guild, embed: discord.Embed):
        settings = await SettingsService.get_guild_settings(guild.id)
        channel_id = settings.get("log_channel_moderation")
        if not channel_id:
            return
        channel = guild.get_channel(channel_id)
        if channel:
            try:
                await channel.send(embed=embed)
            except discord.Forbidden:
                pass

    @app_commands.command(name="warn", description="Issue a formal warning to a server member.")
    @app_commands.default_permissions(moderate_members=True)
    @has_permission(moderate_members=True)
    async def warn(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        case_id = await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "WARN", reason)
        
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
        
        # Dispatch log
        log_embed = SyncInkEmbed(title="Member Warned", color=WARNING_COLOR)
        log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
        log_embed.add_field(name="Moderator", value=interaction.user.mention, inline=True)
        log_embed.add_field(name="Reason", value=reason, inline=False)
        await self._dispatch_mod_log(interaction.guild, log_embed)


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
            
            # Dispatch log
            log_embed = SyncInkEmbed(title="Member Timed Out", color=WARNING_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Duration", value=f"{duration_minutes} minutes", inline=True)
            log_embed.add_field(name="Moderator", value=interaction.user.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            await self._dispatch_mod_log(interaction.guild, log_embed)

        except discord.Forbidden:
            embed = ErrorEmbed(
                description="Failed to timeout member due to role hierarchy constraints.",
                resolution="Ensure the bot's role is positioned higher than the target member's top role."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            
    @app_commands.command(name="kick", description="Kick a member from the server.")
    @app_commands.default_permissions(kick_members=True)
    @has_permission(kick_members=True)
    async def kick(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        try:
            await member.kick(reason=reason)
            await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "KICK", reason)
            
            await interaction.response.send_message(embed=SuccessEmbed(f"{member.mention} has been kicked."), ephemeral=True)
            
            log_embed = SyncInkEmbed(title="Member Kicked", color=ERROR_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Moderator", value=interaction.user.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            await self._dispatch_mod_log(interaction.guild, log_embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=ErrorEmbed("Cannot kick this member due to role hierarchy."), ephemeral=True)

    @app_commands.command(name="ban", description="Ban a member from the server.")
    @app_commands.default_permissions(ban_members=True)
    @has_permission(ban_members=True)
    async def ban(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        try:
            await member.ban(reason=reason)
            await ModService.log_case(interaction.guild.id, member.id, interaction.user.id, "BAN", reason)
            
            await interaction.response.send_message(embed=SuccessEmbed(f"{member.mention} has been banned."), ephemeral=True)
            
            log_embed = SyncInkEmbed(title="Member Banned", color=ERROR_COLOR)
            log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
            log_embed.add_field(name="Moderator", value=interaction.user.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            await self._dispatch_mod_log(interaction.guild, log_embed)
        except discord.Forbidden:
            await interaction.response.send_message(embed=ErrorEmbed("Cannot ban this member due to role hierarchy."), ephemeral=True)

    @app_commands.command(name="unban", description="Unban a user from the server.")
    @app_commands.default_permissions(ban_members=True)
    @has_permission(ban_members=True)
    async def unban(self, interaction: discord.Interaction, user_id: str, reason: str):
        try:
            user = await self.bot.fetch_user(int(user_id))
            await interaction.guild.unban(user, reason=reason)
            await ModService.log_case(interaction.guild.id, user.id, interaction.user.id, "UNBAN", reason)
            
            await interaction.response.send_message(embed=SuccessEmbed(f"{user.mention} has been unbanned."), ephemeral=True)
            
            log_embed = SyncInkEmbed(title="Member Unbanned", color=SUCCESS_COLOR)
            log_embed.set_author(name=f"{user} ({user.id})", icon_url=user.display_avatar.url)
            log_embed.add_field(name="Moderator", value=interaction.user.mention, inline=True)
            log_embed.add_field(name="Reason", value=reason, inline=False)
            await self._dispatch_mod_log(interaction.guild, log_embed)
        except discord.NotFound:
            await interaction.response.send_message(embed=ErrorEmbed("User not found or not banned."), ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(f"Failed to unban: {e}"), ephemeral=True)

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
