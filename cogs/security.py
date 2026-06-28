import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed, BRAND_ACCENT
from utils.permissions import has_permission
from utils.logger import log
import re

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Verify Now", style=discord.ButtonStyle.primary, custom_id="persistent_verify_btn", emoji="✅")
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        role_id = settings.get("verification_role_id")
        unverified_id = settings.get("unverified_role_id")
        
        if not settings.get('verification_enabled'):
            embed = ErrorEmbed(
                description="The verification system is currently disabled on this server.",
                resolution="A server administrator must enable verification via the `/config` dashboard."
            )
            embed.title = "Verification Disabled"
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        
        if not role_id or not unverified_id:
            embed = ErrorEmbed(
                description="The verification system is missing required role configurations.",
                resolution="A server administrator must select both roles via the `/config` dashboard."
            )
            embed.title = "Configuration Error"
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
            
        role = interaction.guild.get_role(role_id)
        unverified_role = interaction.guild.get_role(unverified_id)
        
        if not role or not unverified_role:
            embed = ErrorEmbed(
                description="The designated verification roles could not be found.",
                resolution="A server administrator must re-select valid roles via the `/config` dashboard."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
            
        if role in interaction.user.roles:
            embed = SyncInkEmbed(title="Already Verified", description="You already possess the verification role and full access to the server.")
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        try:
            await interaction.user.add_roles(role, reason="Passed Verification Checkpoint")
            if unverified_role in interaction.user.roles:
                await interaction.user.remove_roles(unverified_role, reason="Passed Verification Checkpoint")
            
            success_embed = SuccessEmbed("Verification completed.")
            success_embed.title = "Welcome to SyncInk!"
            success_embed.description = (
                "• Your account has been successfully verified.\n"
                "• You now have access to the entire server.\n"
                "• If you need assistance, visit the Support channels."
            )
            await interaction.response.send_message(embed=success_embed, ephemeral=True)

            # Delete personalized prompt if applicable
            if interaction.message.content and str(interaction.user.id) in interaction.message.content:
                try:
                    await interaction.message.delete()
                except discord.NotFound:
                    pass

            # Dispatch Verification Log
            log_channel_id = settings.get('log_channel_verification')
            if log_channel_id:
                log_chan = interaction.guild.get_channel(log_channel_id)
                if log_chan:
                    log_embed = SyncInkEmbed(title="Member Verified", color=SUCCESS_COLOR)
                    log_embed.set_author(name=f"{interaction.user} ({interaction.user.id})", icon_url=interaction.user.display_avatar.url)
                    log_embed.add_field(name="Action", value="Completed Verification", inline=False)
                    log_embed.add_field(name="Assigned Role", value=role.mention, inline=True)
                    if unverified_role:
                        log_embed.add_field(name="Removed Role", value=unverified_role.mention, inline=True)
                    try:
                        await log_chan.send(embed=log_embed)
                    except discord.Forbidden:
                        pass
                        
            # Send welcome message if configured
            welcome_channel_id = settings.get('welcome_channel_id')
            if welcome_channel_id:
                channel = interaction.guild.get_channel(welcome_channel_id)
                if channel:
                    custom_msg = settings.get('welcome_message')
                    if custom_msg:
                        desc = custom_msg.replace("{user}", interaction.user.mention).replace("{server}", interaction.guild.name)
                    else:
                        from utils.i18n import i18n
                        desc = i18n.get("welcome_message_desc", user=interaction.user.mention)
                    
                    w_embed = SyncInkEmbed(title=f"Welcome to {interaction.guild.name}", description=desc)
                    w_embed.set_thumbnail(url=interaction.user.display_avatar.url)
                    try:
                        await channel.send(content=interaction.user.mention, embed=w_embed)
                    except discord.Forbidden:
                        pass
        except discord.Forbidden:
            embed = ErrorEmbed(
                description="The bot lacks the necessary permissions to assign or remove roles.",
                resolution="Ensure the bot's role is placed **above** the verified and unverified roles in the server settings."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(description="An unexpected error occurred during verification.", resolution=f"Details: `{e}`"), ephemeral=True)
            log.error(f"Verification error: {e}")

class Security(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.scam_links = [r"discord\.gift", r"steamcommunity-", r"nitro-free"]

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        if member.bot:
            return
            
        settings = await SettingsService.get_guild_settings(member.guild.id)
        if settings.get('verification_enabled'):
            unverified_id = settings.get('unverified_role_id')
            verif_chan_id = settings.get('verification_channel_id')
            
            if unverified_id:
                unverified_role = member.guild.get_role(unverified_id)
                if unverified_role:
                    try:
                        await member.add_roles(unverified_role, reason="Assigned Unverified role on join")
                    except Exception as e:
                        log.error(f"Failed to assign unverified role to {member.id}: {e}")
            
            # Send Verification Prompt
            if verif_chan_id:
                verif_chan = member.guild.get_channel(verif_chan_id)
                if verif_chan:
                    prompt_embed = SyncInkEmbed(title="Authentication Required", color=BRAND_ACCENT)
                    prompt_embed.description = (
                        "To protect our community from spam, automated accounts, and unauthorized access, "
                        "you'll need to verify before accessing the server.\n\n"
                        "Click **Verify Now** below to unlock access."
                    )
                    try:
                        await verif_chan.send(content=f"Welcome, {member.mention}!", embed=prompt_embed, view=VerificationView())
                    except discord.Forbidden:
                        pass

            # Dispatch Verification Log
            log_channel_id = settings.get('log_channel_verification')
            if log_channel_id:
                log_chan = member.guild.get_channel(log_channel_id)
                if log_chan:
                    log_embed = SyncInkEmbed(title="Verification Started", color=WARNING_COLOR)
                    log_embed.set_author(name=f"{member} ({member.id})", icon_url=member.display_avatar.url)
                    log_embed.add_field(name="Action", value="Member Joined (Unverified)", inline=False)
                    try:
                        await log_chan.send(embed=log_embed)
                    except discord.Forbidden:
                        pass
        else:
            # If verification is disabled, user instantly gets access. Send welcome message now.
            welcome_channel_id = settings.get('welcome_channel_id')
            if welcome_channel_id:
                channel = member.guild.get_channel(welcome_channel_id)
                if channel:
                    custom_msg = settings.get('welcome_message')
                    if custom_msg:
                        desc = custom_msg.replace("{user}", member.mention).replace("{server}", member.guild.name)
                    else:
                        from utils.i18n import i18n
                        desc = i18n.get("welcome_message_desc", user=member.mention)
                    
                    w_embed = SyncInkEmbed(title=f"Welcome to {member.guild.name}", description=desc)
                    w_embed.set_thumbnail(url=member.display_avatar.url)
                    try:
                        await channel.send(content=member.mention, embed=w_embed)
                    except discord.Forbidden:
                        pass

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        content = message.content.lower()
        if any(re.search(pattern, content) for pattern in self.scam_links):
            try:
                await message.delete()
                await message.channel.send(embed=ErrorEmbed(description=f"{message.author.mention}, that link is blacklisted and has been blocked.", resolution="Avoid sending unauthorized links to prevent account penalties."), delete_after=10)
            except discord.Forbidden:
                pass

    @app_commands.command(name="spawn_verification", description="Deploy the advanced verification checkpoint to the current channel.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def spawn_verification(self, interaction: discord.Interaction):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        if not settings.get('verification_enabled') or not settings.get('verification_role_id') or not settings.get('unverified_role_id'):
            embed = ErrorEmbed(
                description="The verification module must be fully configured before deployment.",
                resolution="Use the `/config` dashboard to assign both Verified and Unverified roles, then enable verification."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        embed = SyncInkEmbed(title="Security Checkpoint", color=BRAND_ACCENT)
        embed.set_author(name="Server Security", icon_url="https://cdn.discordapp.com/emojis/1045237731211755561.webp")
        embed.description = "To protect our community from spam, automated accounts, malicious users, and unauthorized access, all members must complete verification before accessing the server."
        embed.add_field(name="", value="> 🔒 Please click the button below to verify your account and instantly unlock server access.", inline=False)
        
        await interaction.channel.send(embed=embed, view=VerificationView())
        await interaction.response.send_message(embed=SuccessEmbed("The security checkpoint has been successfully deployed to this channel."), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Security(bot))
