import re

with open('cogs/settings.py', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CategorySelect
old_options = """        options = [
            discord.SelectOption(label="Security", description="Verification System", emoji="🛡️", value="security"),
            discord.SelectOption(label="Logging", description="Audit Logs", emoji="📜", value="logging"),
            discord.SelectOption(label="Members", description="Welcome & Auto Roles", emoji="👋", value="members"),
        ]"""
new_options = """        options = [
            discord.SelectOption(label="Automod", description="Security Engine & Punishments", emoji="🤖", value="automod"),
            discord.SelectOption(label="Security", description="Verification System", emoji="🛡️", value="security"),
            discord.SelectOption(label="Logging", description="Audit Logs", emoji="📜", value="logging"),
            discord.SelectOption(label="Members", description="Welcome & Auto Roles", emoji="👋", value="members"),
        ]"""
text = text.replace(old_options, new_options)

# 2. Add Automod UI Classes
automod_classes = """
class ToggleAutomodButton(discord.ui.Button):
    def __init__(self, is_enabled: bool):
        label = "Disable Automod Engine" if is_enabled else "Enable Automod Engine"
        style = discord.ButtonStyle.red if is_enabled else discord.ButtonStyle.green
        super().__init__(label=label, style=style, row=1)
        self.is_enabled = is_enabled
        
    async def callback(self, interaction: discord.Interaction):
        new_state = not self.is_enabled
        await SettingsService.update_setting(interaction.guild.id, "automod_enabled", new_state)
        # Pre-seed default punishments if enabling for the first time
        if new_state:
            from database import db
            has_punishments = await db.fetchrow("SELECT id FROM automod_punishments WHERE guild_id = $1 LIMIT 1", interaction.guild.id)
            if not has_punishments:
                await db.execute("INSERT INTO automod_punishments (guild_id, points, action, duration_mins) VALUES ($1, 2, 'WARN', NULL), ($1, 5, 'TIMEOUT', 5), ($1, 10, 'TIMEOUT', 60), ($1, 20, 'JAIL', NULL) ON CONFLICT DO NOTHING", interaction.guild.id)
        await self.view.update_category(interaction, "automod", success_msg=f"Automod Engine {'enabled' if new_state else 'disabled'}.")

class ToggleRaidModeButton(discord.ui.Button):
    def __init__(self, is_enabled: bool):
        label = "Disable Emergency Raid Mode" if is_enabled else "Enable Emergency Raid Mode"
        style = discord.ButtonStyle.gray if is_enabled else discord.ButtonStyle.danger
        super().__init__(label=label, style=style, row=1)
        self.is_enabled = is_enabled
        
    async def callback(self, interaction: discord.Interaction):
        new_state = not self.is_enabled
        await SettingsService.update_setting(interaction.guild.id, "emergency_mode", new_state)
        await self.view.update_category(interaction, "automod", success_msg=f"Emergency Raid Mode {'enabled' if new_state else 'disabled'}.")

class JailRoleSelect(discord.ui.RoleSelect):
    def __init__(self):
        super().__init__(placeholder="Select Jail Role", min_values=1, max_values=1, row=2)
        
    async def callback(self, interaction: discord.Interaction):
        role = self.values[0]
        await SettingsService.update_setting(interaction.guild.id, "jail_role_id", role.id)
        await self.view.update_category(interaction, "automod", success_msg=f"Jail role set to {role.name}.")

"""
text = text.replace("class ConfigDashboardView(discord.ui.View):", automod_classes + "class ConfigDashboardView(discord.ui.View):")

# 3. Add to ConfigDashboardView __init__
old_init = """        self.cat_select = CategorySelect()
        self.toggle_btn = ToggleVerificationButton(False)"""
new_init = """        self.cat_select = CategorySelect()
        self.toggle_automod_btn = ToggleAutomodButton(False)
        self.toggle_raid_btn = ToggleRaidModeButton(False)
        self.jail_role_select = JailRoleSelect()
        self.toggle_btn = ToggleVerificationButton(False)"""
text = text.replace(old_init, new_init)

# 4. Add rendering logic inside update_category
automod_render = """        if category == "automod":
            is_enabled = bool(settings.get('automod_enabled'))
            embed.description = "Configure the automated security engine and progressive punishments."
            
            am_text = "<a:approved:1520913982678896670> Active" if is_enabled else "<a:refused:1520914088568295564> Offline"
            raid_text = "🚨 **ACTIVE**" if settings.get('emergency_mode') else "Standby"
            jail_id = settings.get('jail_role_id')
            jail_text = f"<@&{jail_id}>" if jail_id else "<a:refused:1520914088568295564> Missing"
            
            embed.add_field(name="Engine Status", value=am_text, inline=True)
            embed.add_field(name="Anti-Raid Mode", value=raid_text, inline=True)
            embed.add_field(name="Jail Role", value=jail_text, inline=False)
            
            self.toggle_automod_btn.is_enabled = is_enabled
            self.toggle_automod_btn.label = "Disable Automod" if is_enabled else "Enable Automod"
            self.toggle_automod_btn.style = discord.ButtonStyle.red if is_enabled else discord.ButtonStyle.green
            
            self.toggle_raid_btn.is_enabled = bool(settings.get('emergency_mode'))
            self.toggle_raid_btn.label = "Disable Emergency Mode" if settings.get('emergency_mode') else "Enable Emergency Mode"
            self.toggle_raid_btn.style = discord.ButtonStyle.gray if settings.get('emergency_mode') else discord.ButtonStyle.danger
            
            self.add_item(self.toggle_automod_btn)
            self.add_item(self.toggle_raid_btn)
            self.add_item(self.jail_role_select)
            
        elif category == "security":"""
text = text.replace("        if category == \"security\":", automod_render)

with open('cogs/settings.py', 'w', encoding='utf-8') as f:
    f.write(text)
print("Injected Automod UI into settings.py")
