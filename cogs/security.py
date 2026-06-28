import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed, BRAND_ACCENT, ERROR_COLOR
from utils.permissions import has_permission
from utils.logger import log
from utils.i18n import i18n
import re

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(discord.ui.Button(label="Contact Support", style=discord.ButtonStyle.secondary, url="https://syncink.xyz/support"))

    @discord.ui.button(label="Verify Now", style=discord.ButtonStyle.primary, custom_id="persistent_verify_btn", emoji="✅")
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        role_id = settings.get("verification_role_id")
        
        if not role_id:
            embed = ErrorEmbed(
                description="The verification system is currently disabled on this server.",
                resolution="Please enable verification from the configuration dashboard or contact a server administrator."
            )
            embed.title = "Verification Not Enabled"
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
            
        role = interaction.guild.get_role(role_id)
        if not role:
            embed = ErrorEmbed(
                description="The designated verification role could not be found.",
                resolution="The server administrator must re-select a valid role in the configuration dashboard."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
            
        if role in interaction.user.roles:
            await interaction.response.send_message(embed=SyncInkEmbed(title="Already Verified", description="You already have the verification role and full access to the server."), ephemeral=True)
            return

        try:
            await interaction.user.add_roles(role, reason="Passed Verification")
            await interaction.response.send_message(embed=SuccessEmbed("You have been verified successfully and granted access to the server channels."), ephemeral=True)
        except discord.Forbidden:
            embed = ErrorEmbed(
                description="The bot lacks the necessary permissions to assign the verification role.",
                resolution="Please ensure the bot's role is placed **above** the verification role in the server settings."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(description=i18n.get("error_verify_failed")), ephemeral=True)
            log.error(f"Verification error: {e}")

class Security(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.scam_links = [r"discord\.gift", r"steamcommunity-", r"nitro-free"]

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

    @app_commands.command(name="spawn_verification", description="Deploy the interactive verification panel to the current channel.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def spawn_verification(self, interaction: discord.Interaction):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        if not settings.get('verification_enabled') or not settings.get('verification_role_id'):
            embed = ErrorEmbed(
                description="The verification module must be fully configured before deployment.",
                resolution="Use the `/config` dashboard to enable verification and assign a role."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        embed = SyncInkEmbed(title="Server Verification", color=BRAND_ACCENT)
        embed.set_author(name="Welcome to SyncInk", icon_url="https://cdn.discordapp.com/emojis/1045237731211755561.webp") # Shield-like generic check icon
        embed.description = "To access the server and unlock all channels, please verify yourself."
        embed.add_field(name="", value="> 🔒 Verification helps us keep the community safe, secure, and spam-free.", inline=False)
        
        await interaction.channel.send(embed=embed, view=VerificationView())
        await interaction.response.send_message(embed=SuccessEmbed("The verification panel has been successfully deployed to this channel."), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Security(bot))
