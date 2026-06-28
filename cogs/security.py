import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed, DIVIDER
from utils.permissions import has_permission
from utils.logger import log
from utils.i18n import i18n
import re

class VerificationView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(discord.ui.Button(label="Support", style=discord.ButtonStyle.link, url="https://syncink.xyz/support"))

    @discord.ui.button(label="Verify", style=discord.ButtonStyle.green, custom_id="persistent_verify_btn", emoji="✅")
    async def verify_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        role_id = settings.get("verification_role_id")
        
        if not role_id:
            await interaction.response.send_message(embed=ErrorEmbed("Verification role is not configured."), ephemeral=True)
            return
            
        role = interaction.guild.get_role(role_id)
        if not role:
            await interaction.response.send_message(embed=ErrorEmbed("Verification role no longer exists."), ephemeral=True)
            return
            
        if role in interaction.user.roles:
            await interaction.response.send_message(embed=SyncInkEmbed(description="You are already verified!"), ephemeral=True)
            return

        try:
            await interaction.user.add_roles(role, reason="Passed Verification")
            await interaction.response.send_message(embed=SuccessEmbed(i18n.get("success_verified")), ephemeral=True)
        except discord.Forbidden:
            await interaction.response.send_message(embed=ErrorEmbed("I don't have permission to assign the role."), ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(i18n.get("error_verify_failed")), ephemeral=True)
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
                await message.channel.send(embed=ErrorEmbed(f"{message.author.mention}, suspicious link blocked."), delete_after=5)
            except discord.Forbidden:
                pass

    @app_commands.command(name="spawn_verification", description="Spawn the interactive verification panel")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def spawn_verification(self, interaction: discord.Interaction):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        if not settings.get('verification_enabled') or not settings.get('verification_role_id'):
            await interaction.response.send_message(embed=ErrorEmbed("Verification is not enabled. Use `/config`."), ephemeral=True)
            return

        embed = SyncInkEmbed()
        embed.description = (
            f"{DIVIDER}\n\n"
            f"**🛡️ Server Verification**\n\n"
            f"Welcome to SyncInk.\n\n"
            f"To access the server,\n"
            f"please verify yourself.\n\n"
            f"{DIVIDER}"
        )
        
        await interaction.channel.send(embed=embed, view=VerificationView())
        await interaction.response.send_message(embed=SuccessEmbed("Verification panel created."), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Security(bot))
