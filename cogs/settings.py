import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed
from utils.permissions import has_permission

class ConfigDashboardView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        
    @discord.ui.select(
        custom_id="config_category_select",
        placeholder="Select a category to configure...",
        options=[
            discord.SelectOption(label="Security", description="Verification and Anti-Spam settings", emoji="🛡️", value="security"),
            discord.SelectOption(label="Logging", description="Audit logs and channel tracking", emoji="📜", value="logging"),
            discord.SelectOption(label="Members", description="Welcome messages and Auto Roles", emoji="👋", value="members"),
        ]
    )
    async def select_category(self, interaction: discord.Interaction, select: discord.ui.Select):
        category = select.values[0]
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        
        embed = SyncInkEmbed(title=f"{category.capitalize()} Configuration")
        
        if category == "security":
            embed.description = "Manage server access and protect your community from spam."
            verif = "🟢 Enabled" if settings.get('verification_enabled') else "🔴 Disabled"
            embed.add_field(name="Verification System", value=verif, inline=False)
            embed.add_field(name="Assigned Role", value=f"<@&{settings['verification_role_id']}>" if settings.get('verification_role_id') else "Not configured", inline=False)
            
        elif category == "logging":
            embed.description = "Track moderation actions, messages, and server events."
            log_ch = f"<#{settings['log_channel_id']}>" if settings.get('log_channel_id') else "Not configured"
            embed.add_field(name="Audit Log Channel", value=log_ch, inline=False)
            
        elif category == "members":
            embed.description = "Configure the onboarding experience for new members."
            welcome = f"<#{settings['welcome_channel_id']}>" if settings.get('welcome_channel_id') else "Not configured"
            auto = f"<@&{settings['autorole_id']}>" if settings.get('autorole_id') else "Not configured"
            embed.add_field(name="Welcome Channel", value=welcome, inline=True)
            embed.add_field(name="Auto Role", value=auto, inline=True)
            
        embed.add_field(name="", value="> ⚙️ *Interactive configuration buttons coming soon.*", inline=False)
        await interaction.response.edit_message(embed=embed, view=self)

class Settings(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="config", description="Manage server settings via the interactive dashboard.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def config(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="Platform Dashboard")
        embed.set_author(name="SyncInk Administration", icon_url="https://syncink.xyz/assets/logo.png")
        embed.description = "Welcome to the control panel. Use the dropdown below to navigate through your server's configuration."
        
        embed.add_field(name="Quick Stats", value="Platform Version: v1.0.0\nModules Active: 4", inline=False)
        
        await interaction.response.send_message(embed=embed, view=ConfigDashboardView(), ephemeral=True)
        
    @app_commands.command(name="onboard", description="Initialize SyncInk and start the guided setup.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def onboard(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="Welcome to SyncInk")
        embed.description = "Thank you for trusting SyncInk Support Platform.\nTo secure your community, please complete the initial setup."
        embed.add_field(name="Next Steps", value="> 1. Run the `/config` command.\n> 2. Navigate to **Security** and enable verification.\n> 3. Set your audit log and welcome channels.", inline=False)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Settings(bot))
