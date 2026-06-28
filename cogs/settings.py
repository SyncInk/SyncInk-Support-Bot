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
        placeholder="Select a category to manage...",
        options=[
            discord.SelectOption(label="Security", description="Verification and Anti-Spam", emoji="🛡️", value="security"),
            discord.SelectOption(label="Logging", description="Audit logs and tracking", emoji="📜", value="logging"),
            discord.SelectOption(label="Members", description="Welcome messages and Auto Roles", emoji="👋", value="members"),
        ]
    )
    async def select_category(self, interaction: discord.Interaction, select: discord.ui.Select):
        category = select.values[0]
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        
        embed = SyncInkEmbed(title=f"⚙️ {category.capitalize()} Configuration")
        if category == "security":
            verif = "Enabled ✅" if settings.get('verification_enabled') else "Disabled ❌"
            embed.description = f"**Verification System:** {verif}\n*(Use dashboard buttons to edit - coming soon)*"
        elif category == "logging":
            log_ch = f"<#{settings['log_channel_id']}>" if settings.get('log_channel_id') else "Not Set"
            embed.description = f"**Log Channel:** {log_ch}\n*(Use dashboard buttons to edit - coming soon)*"
        elif category == "members":
            welcome = f"<#{settings['welcome_channel_id']}>" if settings.get('welcome_channel_id') else "Not Set"
            auto = f"<@&{settings['autorole_id']}>" if settings.get('autorole_id') else "Not Set"
            embed.description = f"**Welcome Channel:** {welcome}\n**Auto Role:** {auto}\n*(Use dashboard buttons to edit - coming soon)*"
            
        await interaction.response.edit_message(embed=embed, view=self)

class Settings(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="config", description="Manage server settings via the SyncInk Dashboard")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def config(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(
            title="⚙️ Dashboard", 
            description="Welcome to the SyncInk Control Panel.\n\nPlease select a category from the dropdown below to view and modify your server settings."
        )
        await interaction.response.send_message(embed=embed, view=ConfigDashboardView(), ephemeral=True)
        
    @app_commands.command(name="onboard", description="Initialize SyncInk on your server")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def onboard(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(
            title="✨ SyncInk Setup",
            description="Welcome to SyncInk Platform!\n\nTo begin configuring your server, please run the `/config` command to open the interactive dashboard."
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Settings(bot))
