import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed
from utils.permissions import has_permission

class CategorySelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="Security", description="Verification System", emoji="🛡️", value="security"),
            discord.SelectOption(label="Logging", description="Audit Logs", emoji="📜", value="logging"),
            discord.SelectOption(label="Members", description="Welcome & Auto Roles", emoji="👋", value="members"),
        ]
        super().__init__(placeholder="Select a category to configure...", min_values=1, max_values=1, options=options, row=0)

    async def callback(self, interaction: discord.Interaction):
        await self.view.update_category(interaction, self.values[0])

class ToggleVerificationButton(discord.ui.Button):
    def __init__(self, is_enabled: bool):
        label = "Disable Verification" if is_enabled else "Enable Verification"
        style = discord.ButtonStyle.red if is_enabled else discord.ButtonStyle.green
        super().__init__(label=label, style=style, row=1)
        self.is_enabled = is_enabled
        
    async def callback(self, interaction: discord.Interaction):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        
        if not self.is_enabled:
            # We are trying to ENABLE it. Validate requirements.
            missing = []
            if not settings.get('verification_role_id'):
                missing.append("Verified Role")
            if not settings.get('unverified_role_id'):
                missing.append("Unverified Role")
                
            if missing:
                from utils.ui import ErrorEmbed
                await interaction.response.send_message(embed=ErrorEmbed(
                    description=f"Cannot enable verification because the following requirements are missing: **{', '.join(missing)}**",
                    resolution="Please use the dropdowns below to set the required roles first."
                ), ephemeral=True)
                return

        new_state = not self.is_enabled
        await SettingsService.update_setting(interaction.guild.id, "verification_enabled", new_state)
        await self.view.update_category(interaction, "security", success_msg=f"Verification {'enabled' if new_state else 'disabled'}.")

class VerificationRoleSelect(discord.ui.RoleSelect):
    def __init__(self):
        super().__init__(placeholder="Select Verified Role", min_values=1, max_values=1, row=2)
        
    async def callback(self, interaction: discord.Interaction):
        role = self.values[0]
        await SettingsService.update_setting(interaction.guild.id, "verification_role_id", role.id)
        await self.view.update_category(interaction, "security", success_msg=f"Verified role set to {role.name}.")

class UnverifiedRoleSelect(discord.ui.RoleSelect):
    def __init__(self):
        super().__init__(placeholder="Select Unverified Role", min_values=1, max_values=1, row=3)
        
    async def callback(self, interaction: discord.Interaction):
        role = self.values[0]
        await SettingsService.update_setting(interaction.guild.id, "unverified_role_id", role.id)
        await self.view.update_category(interaction, "security", success_msg=f"Unverified role set to {role.name}.")

class VerificationChannelSelect(discord.ui.ChannelSelect):
    def __init__(self):
        super().__init__(channel_types=[discord.ChannelType.text], placeholder="Select Verification Channel (Optional)", min_values=1, max_values=1, row=4)
        
    async def callback(self, interaction: discord.Interaction):
        channel = self.values[0]
        await SettingsService.update_setting(interaction.guild.id, "verification_channel_id", channel.id)
        await self.view.update_category(interaction, "security", success_msg=f"Verification prompt channel set to #{channel.name}.")

class LogChannelSelect(discord.ui.ChannelSelect):
    def __init__(self):
        super().__init__(channel_types=[discord.ChannelType.text], placeholder="Select Audit Log Channel", min_values=1, max_values=1, row=1)
        
    async def callback(self, interaction: discord.Interaction):
        channel = self.values[0]
        await SettingsService.update_setting(interaction.guild.id, "log_channel_id", channel.id)
        await self.view.update_category(interaction, "logging", success_msg=f"Audit log channel set to #{channel.name}.")

class WelcomeChannelSelect(discord.ui.ChannelSelect):
    def __init__(self):
        super().__init__(channel_types=[discord.ChannelType.text], placeholder="Select Welcome Channel", min_values=1, max_values=1, row=1)
        
    async def callback(self, interaction: discord.Interaction):
        channel = self.values[0]
        await SettingsService.update_setting(interaction.guild.id, "welcome_channel_id", channel.id)
        await self.view.update_category(interaction, "members", success_msg=f"Welcome channel set to #{channel.name}.")

class WelcomeMessageModal(discord.ui.Modal, title="Configure Welcome Message"):
    message = discord.ui.TextInput(
        label="Welcome Message",
        style=discord.TextStyle.paragraph,
        placeholder="Type your welcome message here. Use {user} to mention the user, and {server} for the server name.",
        required=True,
        max_length=2000
    )

    async def on_submit(self, interaction: discord.Interaction):
        await SettingsService.update_setting(interaction.guild.id, "welcome_message", self.message.value)
        # Assuming the view is attached to the interaction message, we need to manually trigger an update
        # Since this is a modal, we can't directly access `self.view` from the modal, but we can just send a success message.
        from utils.ui import SuccessEmbed
        await interaction.response.send_message(embed=SuccessEmbed("Welcome message updated successfully. Please run `/config` again if you wish to see the refreshed dashboard."), ephemeral=True)

class WelcomeMessageButton(discord.ui.Button):
    def __init__(self):
        super().__init__(label="Edit Welcome Message", style=discord.ButtonStyle.secondary, row=2)
        
    async def callback(self, interaction: discord.Interaction):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        modal = WelcomeMessageModal()
        if settings.get("welcome_message"):
            modal.message.default = settings["welcome_message"]
        await interaction.response.send_modal(modal)

class ConfigDashboardView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=900) # 15 minutes timeout since it is ephemeral
        self.cat_select = CategorySelect()
        self.toggle_btn = ToggleVerificationButton(False)
        self.role_select = VerificationRoleSelect()
        self.unverified_select = UnverifiedRoleSelect()
        self.verif_channel_select = VerificationChannelSelect()
        self.log_channel = LogChannelSelect()
        self.welcome_channel = WelcomeChannelSelect()
        self.welcome_msg_btn = WelcomeMessageButton()

    def prepare_initial(self):
        self.clear_items()
        self.add_item(self.cat_select)
        return self

    async def update_category(self, interaction: discord.Interaction, category: str, success_msg: str = None):
        settings = await SettingsService.get_guild_settings(interaction.guild.id)
        
        self.clear_items()
        self.add_item(self.cat_select)
        
        embed = SyncInkEmbed(title=f"{category.capitalize()} Configuration")
        
        if category == "security":
            is_enabled = bool(settings.get('verification_enabled'))
            embed.description = "Manage server access and protect your community from spam."
            
            vr_id = settings.get('verification_role_id')
            uv_id = settings.get('unverified_role_id')
            
            verif_text = "<a:approved:1520913982678896670> Enabled" if is_enabled else "<a:refused:1520914088568295564> Disabled"
            vr_text = f"<@&{vr_id}>" if vr_id else "<a:refused:1520914088568295564> Missing (Required)"
            uv_text = f"<@&{uv_id}>" if uv_id else "<a:refused:1520914088568295564> Missing (Required)"
            
            embed.add_field(name="Verification System", value=verif_text, inline=False)
            embed.add_field(name="Verified Role", value=vr_text, inline=True)
            embed.add_field(name="Unverified Role", value=uv_text, inline=True)
            
            vc_id = settings.get("verification_channel_id")
            vc_text = f"<#{vc_id}>" if vc_id else "<a:syncwarning:1520914584012328961> Not configured"
            embed.add_field(name="Verification Channel", value=vc_text, inline=False)
            
            self.toggle_btn.is_enabled = is_enabled
            self.toggle_btn.label = "Disable Verification" if is_enabled else "Enable Verification"
            self.toggle_btn.style = discord.ButtonStyle.red if is_enabled else discord.ButtonStyle.green
            
            self.add_item(self.toggle_btn)
            self.add_item(self.role_select)
            self.add_item(self.unverified_select)
            self.add_item(self.verif_channel_select)
            
        elif category == "logging":
            embed.description = "Track moderation actions, messages, and server events."
            embed.add_field(name="Audit Log Channel", value=f"<#{settings['log_channel_id']}>" if settings.get('log_channel_id') else "Not configured", inline=False)
            self.add_item(self.log_channel)
            
        elif category == "members":
            embed.description = "Configure the onboarding experience for new members."
            embed.add_field(name="Welcome Channel", value=f"<#{settings['welcome_channel_id']}>" if settings.get('welcome_channel_id') else "Not configured", inline=True)
            has_msg = "<a:approved:1520913982678896670> Configured" if settings.get('welcome_message') else "<a:refused:1520914088568295564> Not configured"
            embed.add_field(name="Welcome Message", value=has_msg, inline=True)
            
            self.add_item(self.welcome_channel)
            self.add_item(self.welcome_msg_btn)

        if success_msg:
            embed.set_footer(text=f"<a:approved:1520913982678896670> {success_msg}")
            
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
        embed.description = "Welcome to the control panel. Use the dropdown below to navigate and configure your server."
        embed.add_field(name="Status", value="All Systems Operational", inline=False)
        
        view = ConfigDashboardView().prepare_initial()
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)
        
    @app_commands.command(name="onboard", description="Initialize SyncInk and start the guided setup.")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def onboard(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="Welcome to SyncInk")
        embed.description = "Thank you for trusting the SyncInk Support Platform. To secure your community, please complete the initial setup."
        embed.add_field(name="Setup Guide", value="1. Run the `/config` command.\n2. Navigate to **Security** and set Verified & Unverified roles.\n3. Enable Verification.\n4. Configure your Welcome channel.", inline=False)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Settings(bot))
