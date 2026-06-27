import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed, SuccessEmbed
from utils.permissions import has_permission

class ConfigDashboardView(discord.ui.View):
    def __init__(self, guild_id: int):
        super().__init__(timeout=180.0)
        self.guild_id = guild_id
        
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
            embed.description = f"**Verification System:** {verif}\nUse `/set_role` to configure the verification role."
        elif category == "logging":
            log_ch = f"<#{settings['log_channel_id']}>" if settings.get('log_channel_id') else "Not Set"
            embed.description = f"**Log Channel:** {log_ch}\nUse `/set_channel setting:Log Channel` to update."
        elif category == "members":
            welcome = f"<#{settings['welcome_channel_id']}>" if settings.get('welcome_channel_id') else "Not Set"
            auto = f"<@&{settings['autorole_id']}>" if settings.get('autorole_id') else "Not Set"
            embed.description = f"**Welcome Channel:** {welcome}\n**Auto Role:** {auto}"
            
        await interaction.response.edit_message(embed=embed, view=self)

class Settings(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="config", description="Open the interactive configuration dashboard")
    @has_permission(administrator=True)
    async def config(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="⚙️ SyncInk Configuration Dashboard")
        embed.description = "Welcome to the control panel. Select a category below to view and manage your server settings."
        await interaction.response.send_message(embed=embed, view=ConfigDashboardView(interaction.guild.id), ephemeral=True)
        
    @app_commands.command(name="onboard", description="Start the guided setup wizard for new servers")
    @has_permission(administrator=True)
    async def onboard(self, interaction: discord.Interaction):
        # A true wizard would have sequential modals. For this scale, we'll explain the flow.
        embed = SyncInkEmbed(title="✨ SyncInk Setup Wizard")
        embed.description = (
            "Welcome to SyncInk!\n\n"
            "To get started quickly, please run the following commands:\n"
            "1. `/set_channel setting:Welcome Channel`\n"
            "2. `/set_channel setting:Log Channel`\n"
            "3. `/set_role setting:Auto Role`\n\n"
            "You can always view your full setup using `/config`."
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)
        
    @app_commands.command(name="set_channel", description="Quickly set a configuration channel")
    @has_permission(administrator=True)
    @app_commands.describe(setting="The setting to configure", channel="The target channel")
    @app_commands.choices(setting=[
        app_commands.Choice(name="Welcome Channel", value="welcome_channel_id"),
        app_commands.Choice(name="Log Channel", value="log_channel_id"),
    ])
    async def set_channel(self, interaction: discord.Interaction, setting: app_commands.Choice[str], channel: discord.TextChannel):
        await SettingsService.update_setting(interaction.guild.id, setting.value, channel.id)
        await interaction.response.send_message(embed=SuccessEmbed(f"Successfully set {setting.name} to {channel.mention}"), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Settings(bot))
