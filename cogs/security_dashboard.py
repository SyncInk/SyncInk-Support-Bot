import discord
from discord.ext import commands
from discord import app_commands
from services.settings_service import SettingsService
from services.security_service import SecurityService
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed, BRAND_ACCENT, SUCCESS_COLOR, WARNING_COLOR, ERROR_COLOR
from utils.emojis import Emojis, EmojiPartials
from utils.logger import log
from database import db
from typing import Optional, Literal

class ThresholdModal(discord.ui.Modal, title="Security Thresholds"):
    spam_limit = discord.ui.TextInput(
        label="Spam Message Limit (Window: 10s)",
        placeholder="Default: 5",
        required=True,
        max_length=2
    )
    mention_limit = discord.ui.TextInput(
        label="Mention Threshold (Limit before action)",
        placeholder="Default: 5",
        required=True,
        max_length=2
    )
    raid_limit = discord.ui.TextInput(
        label="Anti-Raid Join Threshold (Window: 10s)",
        placeholder="Default: 5",
        required=True,
        max_length=2
    )
    nuke_limit = discord.ui.TextInput(
        label="Anti-Nuke Action Limit (Window: 10s)",
        placeholder="Default: 3",
        required=True,
        max_length=2
    )

    def __init__(self, guild_id: int, current_settings: dict):
        super().__init__()
        self.guild_id = guild_id
        self.spam_limit.default = str(current_settings.get("spam_threshold", 5))
        self.mention_limit.default = str(current_settings.get("mention_threshold", 5))
        self.raid_limit.default = str(current_settings.get("anti_raid_threshold", 5))
        self.nuke_limit.default = str(current_settings.get("anti_nuke_threshold", 3))

    async def on_submit(self, interaction: discord.Interaction):
        try:
            s_lim = int(self.spam_limit.value)
            m_lim = int(self.mention_limit.value)
            r_lim = int(self.raid_limit.value)
            n_lim = int(self.nuke_limit.value)

            if min(s_lim, m_lim, r_lim, n_lim) < 1:
                await interaction.response.send_message("Thresholds must be positive numbers >= 1.", ephemeral=True)
                return

            await SettingsService.update_setting(self.guild_id, "spam_threshold", s_lim)
            await SettingsService.update_setting(self.guild_id, "mention_threshold", m_lim)
            await SettingsService.update_setting(self.guild_id, "anti_raid_threshold", r_lim)
            await SettingsService.update_setting(self.guild_id, "anti_nuke_threshold", n_lim)

            await interaction.response.send_message(
                embed=SuccessEmbed(
                    f"Updated security thresholds:\n"
                    f"• Spam Limit: **{s_lim}**\n"
                    f"• Mention Limit: **{m_lim}**\n"
                    f"• Anti-Raid Threshold: **{r_lim}**\n"
                    f"• Anti-Nuke Threshold: **{n_lim}**"
                ),
                ephemeral=True
            )
        except ValueError:
            await interaction.response.send_message("Please enter valid integers for all thresholds.", ephemeral=True)


class SecurityDashboardView(discord.ui.View):
    def __init__(self, guild: discord.Guild, author_id: int):
        super().__init__(timeout=300)
        self.guild = guild
        self.author_id = author_id

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author_id and interaction.user.id != self.guild.owner_id:
            await interaction.response.send_message("You are not authorized to use this control panel.", ephemeral=True)
            return False
        return True

    @discord.ui.button(label="Anti-Spam", emoji=EmojiPartials.SETTINGS, style=discord.ButtonStyle.secondary, row=0, custom_id="sec_toggle_spam")
    async def toggle_spam(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(self.guild.id)
        current = settings.get("automod_enabled", False)
        new_state = not current
        await SettingsService.update_setting(self.guild.id, "automod_enabled", new_state)
        embed = await build_security_dashboard_embed(self.guild)
        await interaction.response.edit_message(embed=embed, view=self)

    @discord.ui.button(label="Anti-Raid", emoji=EmojiPartials.ALERT, style=discord.ButtonStyle.secondary, row=0, custom_id="sec_toggle_raid")
    async def toggle_raid(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(self.guild.id)
        current = settings.get("anti_raid_enabled", True)
        new_state = not current
        await SettingsService.update_setting(self.guild.id, "anti_raid_enabled", new_state)
        embed = await build_security_dashboard_embed(self.guild)
        await interaction.response.edit_message(embed=embed, view=self)

    @discord.ui.button(label="Anti-Nuke", emoji=EmojiPartials.MODERATION, style=discord.ButtonStyle.secondary, row=0, custom_id="sec_toggle_nuke")
    async def toggle_nuke(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(self.guild.id)
        current = settings.get("anti_nuke_enabled", True)
        new_state = not current
        await SettingsService.update_setting(self.guild.id, "anti_nuke_enabled", new_state)
        embed = await build_security_dashboard_embed(self.guild)
        await interaction.response.edit_message(embed=embed, view=self)

    @discord.ui.button(label="Phishing Shield", emoji=EmojiPartials.RULES, style=discord.ButtonStyle.secondary, row=0, custom_id="sec_toggle_phish")
    async def toggle_phishing(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(self.guild.id)
        current = settings.get("anti_phishing_enabled", True)
        new_state = not current
        await SettingsService.update_setting(self.guild.id, "anti_phishing_enabled", new_state)
        embed = await build_security_dashboard_embed(self.guild)
        await interaction.response.edit_message(embed=embed, view=self)

    @discord.ui.button(label="Emergency Lockdown", emoji=EmojiPartials.LOCK, style=discord.ButtonStyle.danger, row=1, custom_id="sec_lockdown_btn")
    async def emergency_lockdown(self, interaction: discord.Interaction, button: discord.ui.Button):
        current_state = await SecurityService.get_raid_state(self.guild.id)
        if current_state == "LOCKDOWN":
            await SecurityService.set_raid_state(self.guild.id, "NORMAL")
            msg = "Emergency lockdown lifted. Server returned to **NORMAL**."
        else:
            await SecurityService.set_raid_state(self.guild.id, "LOCKDOWN")
            msg = "🚨 **EMERGENCY LOCKDOWN ACTIVATED!** All incoming joins will be quarantined and security shields maxed."

        embed = await build_security_dashboard_embed(self.guild)
        await interaction.response.edit_message(embed=embed, view=self)
        await interaction.followup.send(content=msg, ephemeral=True)

    @discord.ui.button(label="Tune Thresholds", emoji=EmojiPartials.SETTINGS, style=discord.ButtonStyle.primary, row=1, custom_id="sec_thresholds_btn")
    async def tune_thresholds(self, interaction: discord.Interaction, button: discord.ui.Button):
        settings = await SettingsService.get_guild_settings(self.guild.id)
        await interaction.response.send_modal(ThresholdModal(self.guild.id, settings))

    @discord.ui.button(label="View Whitelist", emoji=EmojiPartials.LOOKING, style=discord.ButtonStyle.secondary, row=1, custom_id="sec_whitelist_btn")
    async def view_whitelist(self, interaction: discord.Interaction, button: discord.ui.Button):
        entries = await SecurityService.get_whitelist_entries(self.guild.id)
        if not entries:
            await interaction.response.send_message("No whitelist exemptions configured yet.", ephemeral=True)
            return

        lines = []
        for e in entries[:25]:
            etype = e['entity_type'].upper()
            val = e['entity_id_or_val']
            if etype == "USER":
                val = f"<@{val}> (`{val}`)"
            elif etype == "ROLE":
                val = f"<@&{val}> (`{val}`)"
            elif etype == "CHANNEL":
                val = f"<#{val}> (`{val}`)"
            else:
                val = f"`{val}`"
            lines.append(f"• **[{etype}]** {val}")

        w_embed = SyncInkEmbed(
            title=f"{Emojis.MODERATION} Server Security Whitelist",
            description="\n".join(lines),
            color=BRAND_ACCENT
        )
        await interaction.response.send_message(embed=w_embed, ephemeral=True)

    @discord.ui.button(label="🔄 Refresh", style=discord.ButtonStyle.secondary, row=1, custom_id="sec_refresh_btn")
    async def refresh_dashboard(self, interaction: discord.Interaction, button: discord.ui.Button):
        embed = await build_security_dashboard_embed(self.guild)
        await interaction.response.edit_message(embed=embed, view=self)


async def build_security_dashboard_embed(guild: discord.Guild) -> discord.Embed:
    """Builds the comprehensive security overview embed for the dashboard."""
    settings = await SettingsService.get_guild_settings(guild.id)
    raid_state = await SecurityService.get_raid_state(guild.id)

    # State badges
    state_badges = {
        "NORMAL": f"{Emojis.APPROVED} **NORMAL** (Standard Monitoring)",
        "WATCH": f"{Emojis.WARNING} **WATCH** (Elevated Join Velocity)",
        "ALERT": f"{Emojis.ALERT} **ALERT** (Join Burst / Raid Active)",
        "LOCKDOWN": f"{Emojis.LOCK} **LOCKDOWN** (Strict Quarantine Active)"
    }
    raid_badge = state_badges.get(raid_state, f"⚪ **{raid_state}**")

    # Counts
    jailed_rec = await db.fetchrow("SELECT COUNT(*) as count FROM automod_jails WHERE guild_id = $1", guild.id)
    jailed_count = jailed_rec['count'] if jailed_rec else 0

    whitelist_rec = await db.fetchrow("SELECT COUNT(*) as count FROM security_whitelist WHERE guild_id = $1", guild.id)
    whitelist_count = whitelist_rec['count'] if whitelist_rec else 0

    incidents_rec = await db.fetchrow("SELECT COUNT(*) as count FROM security_incidents WHERE guild_id = $1", guild.id)
    incidents_count = incidents_rec['count'] if incidents_rec else 0

    embed = SyncInkEmbed(
        title=f"{Emojis.MODERATION} SyncInk Security & Defense System",
        color=BRAND_ACCENT
    )
    embed.set_author(name=f"{guild.name} Security Operations", icon_url=guild.icon.url if guild.icon else None)
    embed.description = (
        "Production-grade server security, anti-nuke, and automod engine active.\n"
        "Configure modules, tune sensitivity thresholds, or toggle emergency lockdown below."
    )

    # Status Overview
    embed.add_field(
        name=f"{Emojis.ALERT} Active Raid State",
        value=raid_badge,
        inline=False
    )

    # Modules Grid
    nuke_on = f"{Emojis.APPROVED} ON" if settings.get("anti_nuke_enabled", True) else f"{Emojis.REFUSED} OFF"
    raid_on = f"{Emojis.APPROVED} ON" if settings.get("anti_raid_enabled", True) else f"{Emojis.REFUSED} OFF"
    spam_on = f"{Emojis.APPROVED} ON" if settings.get("automod_enabled", False) else f"{Emojis.REFUSED} OFF"
    phish_on = f"{Emojis.APPROVED} ON" if settings.get("anti_phishing_enabled", True) else f"{Emojis.REFUSED} OFF"
    mention_on = f"{Emojis.APPROVED} ON" if settings.get("mention_guard_enabled", True) else f"{Emojis.REFUSED} OFF"
    content_on = f"{Emojis.APPROVED} ON" if settings.get("content_filter_enabled", True) else f"{Emojis.REFUSED} OFF"

    modules_desc = (
        f"• **Anti-Nuke Shield:** {nuke_on} (Limit: {settings.get('anti_nuke_threshold', 3)}/10s)\n"
        f"• **Anti-Raid Engine:** {raid_on} (Limit: {settings.get('anti_raid_threshold', 5)}/10s)\n"
        f"• **Anti-Spam Filter:** {spam_on} (Limit: {settings.get('spam_threshold', 5)} msgs)\n"
        f"• **Phishing & Scam Guard:** {phish_on}\n"
        f"• **Mass Mention Guard:** {mention_on} (Limit: {settings.get('mention_threshold', 5)} pings)\n"
        f"• **Content & Word Filter:** {content_on}"
    )
    embed.add_field(name=f"{Emojis.SETTINGS} Security Modules", value=modules_desc, inline=False)

    # Forensics & Quarantines
    forensics_desc = (
        f"• **Quarantined Members:** `{jailed_count}`\n"
        f"• **Logged Incidents:** `{incidents_count}`\n"
        f"• **Whitelisted Entities:** `{whitelist_count}`"
    )
    embed.add_field(name=f"{Emojis.LOOKING} Forensics & Isolation", value=forensics_desc, inline=False)
    embed.set_footer(text="SyncInk Security Shield", icon_url="https://cdn.discordapp.com/emojis/1547034265076760707.png")
    return embed


class SecurityDashboard(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # -------------------------------------------------------------
    # SLASH COMMAND: /security
    # -------------------------------------------------------------
    @app_commands.command(name="security", description="Open the master interactive security dashboard and anti-nuke controls.")
    @app_commands.default_permissions(administrator=True)
    async def slash_security(self, interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return

        embed = await build_security_dashboard_embed(interaction.guild)
        view = SecurityDashboardView(interaction.guild, interaction.user.id)
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    # -------------------------------------------------------------
    # SLASH COMMAND: /automod
    # -------------------------------------------------------------
    @app_commands.command(name="automod", description="Quick overview of automod and content filtering modules.")
    @app_commands.default_permissions(administrator=True)
    async def slash_automod(self, interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return

        embed = await build_security_dashboard_embed(interaction.guild)
        view = SecurityDashboardView(interaction.guild, interaction.user.id)
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    # -------------------------------------------------------------
    # SLASH COMMAND: /lockdown
    # -------------------------------------------------------------
    @app_commands.command(name="lockdown", description="Instantly toggle emergency server lockdown or restore normal state.")
    @app_commands.describe(
        action="Choose whether to activate or lift lockdown",
        reason="Reason for lockdown action"
    )
    @app_commands.default_permissions(administrator=True)
    async def slash_lockdown(
        self, interaction: discord.Interaction, 
        action: Literal["activate", "lift"], 
        reason: str = "No reason provided"
    ):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return

        if action == "activate":
            await SecurityService.set_raid_state(interaction.guild.id, "LOCKDOWN")
            await interaction.response.send_message(
                embed=ErrorEmbed(
                    description=f"{Emojis.LOCK} **Server entered EMERGENCY LOCKDOWN.**\nReason: *{reason}*",
                    resolution="All new incoming joins will be quarantined. Use `/lockdown lift` to restore normal state."
                ),
                ephemeral=True
            )
        else:
            await SecurityService.set_raid_state(interaction.guild.id, "NORMAL")
            await interaction.response.send_message(
                embed=SuccessEmbed(
                    f"{Emojis.APPROVED} **Lockdown lifted.** Server returned to **NORMAL** operations.\nReason: *{reason}*"
                ),
                ephemeral=True
            )

    # -------------------------------------------------------------
    # SLASH COMMAND: /whitelist
    # -------------------------------------------------------------
    @app_commands.command(name="whitelist", description="Manage trusted exemptions for roles, users, channels, or domains.")
    @app_commands.describe(
        action="Action to perform",
        entity_type="Type of entity to whitelist",
        target="Target ID, mention, or domain name"
    )
    @app_commands.default_permissions(administrator=True)
    async def slash_whitelist(
        self, interaction: discord.Interaction,
        action: Literal["add", "remove", "list"],
        entity_type: Optional[Literal["user", "role", "channel", "domain"]] = None,
        target: Optional[str] = None
    ):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return

        if action == "list":
            entries = await SecurityService.get_whitelist_entries(interaction.guild.id, entity_type)
            if not entries:
                await interaction.response.send_message("No whitelist entries found.", ephemeral=True)
                return

            lines = [f"• **[{e['entity_type'].upper()}]** `{e['entity_id_or_val']}`" for e in entries[:25]]
            embed = SyncInkEmbed(title=f"{Emojis.MODERATION} Security Whitelist", description="\n".join(lines), color=BRAND_ACCENT)
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        if not entity_type or not target:
            await interaction.response.send_message("Please provide both `entity_type` and `target` for add/remove.", ephemeral=True)
            return

        # Clean target string (strip <@>, <#>, <@&>)
        clean_target = target.strip("<@!&#> ").lower()

        if action == "add":
            success = await SecurityService.add_whitelist(interaction.guild.id, entity_type, clean_target, interaction.user.id)
            if success:
                await interaction.response.send_message(embed=SuccessEmbed(f"Added **[{entity_type.upper()}]** `{clean_target}` to whitelist."), ephemeral=True)
            else:
                await interaction.response.send_message(embed=ErrorEmbed("Failed to add whitelist entry."), ephemeral=True)
        else: # remove
            success = await SecurityService.remove_whitelist(interaction.guild.id, entity_type, clean_target)
            if success:
                await interaction.response.send_message(embed=SuccessEmbed(f"Removed **[{entity_type.upper()}]** `{clean_target}` from whitelist."), ephemeral=True)
            else:
                await interaction.response.send_message(embed=ErrorEmbed("Failed to remove whitelist entry."), ephemeral=True)

    # -------------------------------------------------------------
    # PREFIX COMMANDS: ?security, ?automod, ?lockdown, ?whitelist
    # -------------------------------------------------------------
    @commands.command(name="security", description="Open the interactive security dashboard.")
    @commands.has_permissions(administrator=True)
    async def prefix_security(self, ctx: commands.Context):
        from utils.permissions import require_staff_channel
        if not await require_staff_channel(ctx):
            return
        embed = await build_security_dashboard_embed(ctx.guild)
        view = SecurityDashboardView(ctx.guild, ctx.author.id)
        await ctx.send(embed=embed, view=view, delete_after=120)

    @commands.command(name="automod_panel", aliases=["automod"], description="Open the automod overview panel.")
    @commands.has_permissions(administrator=True)
    async def prefix_automod(self, ctx: commands.Context):
        from utils.permissions import require_staff_channel
        if not await require_staff_channel(ctx):
            return
        embed = await build_security_dashboard_embed(ctx.guild)
        view = SecurityDashboardView(ctx.guild, ctx.author.id)
        await ctx.send(embed=embed, view=view, delete_after=120)

    @commands.command(name="lockdown", description="Emergency lockdown or restore server channels.")
    @commands.has_permissions(administrator=True)
    async def prefix_lockdown(self, ctx: commands.Context, *, reason: str = "No reason provided"):
        from utils.permissions import require_staff_channel
        if not await require_staff_channel(ctx):
            return
        current_state = await SecurityService.get_raid_state(ctx.guild.id)
        if current_state == "LOCKDOWN":
            await SecurityService.set_raid_state(ctx.guild.id, "NORMAL")
            await ctx.send(embed=SuccessEmbed(f"✅ **Lockdown lifted.** Server returned to **NORMAL** operations.\nReason: *{reason}*"))
        else:
            await SecurityService.set_raid_state(ctx.guild.id, "LOCKDOWN")
            await ctx.send(embed=ErrorEmbed(
                description=f"🚨 **Server entered EMERGENCY LOCKDOWN.**\nReason: *{reason}*",
                resolution="All new incoming joins will be quarantined. Type `?lockdown` again to restore normal state."
            ))

    @commands.command(name="whitelist", description="Manage security exemptions for roles, users, channels, or domains.")
    @commands.has_permissions(administrator=True)
    async def prefix_whitelist(self, ctx: commands.Context, action: str, entity_type: str = None, target: str = None):
        from utils.permissions import require_staff_channel
        if not await require_staff_channel(ctx):
            return
        action_clean = action.lower()
        if action_clean == "list":
            entries = await SecurityService.get_whitelist_entries(ctx.guild.id, entity_type.lower() if entity_type else None)
            if not entries:
                await ctx.send("No whitelist entries found.")
                return
            lines = [f"• **[{e['entity_type'].upper()}]** `{e['entity_id_or_val']}`" for e in entries[:25]]
            embed = SyncInkEmbed(title="Security Whitelist", description="\n".join(lines), color=BRAND_ACCENT)
            await ctx.send(embed=embed)
            return

        if not entity_type or not target:
            await ctx.send(embed=ErrorEmbed("Usage: `?whitelist <add|remove|list> <user|role|channel|domain> <target>`"))
            return

        clean_type = entity_type.lower()
        if clean_type not in ("user", "role", "channel", "domain"):
            await ctx.send(embed=ErrorEmbed("Invalid entity type. Must be `user`, `role`, `channel`, or `domain`."))
            return

        clean_target = target.strip("<@!&#> ").lower()

        if action_clean == "add":
            success = await SecurityService.add_whitelist(ctx.guild.id, clean_type, clean_target, ctx.author.id)
            if success:
                await ctx.send(embed=SuccessEmbed(f"Added **[{clean_type.upper()}]** `{clean_target}` to whitelist."))
            else:
                await ctx.send(embed=ErrorEmbed("Failed to add whitelist entry."))
        elif action_clean == "remove":
            success = await SecurityService.remove_whitelist(ctx.guild.id, clean_type, clean_target)
            if success:
                await ctx.send(embed=SuccessEmbed(f"Removed **[{clean_type.upper()}]** `{clean_target}` from whitelist."))
            else:
                await ctx.send(embed=ErrorEmbed("Failed to remove whitelist entry."))
        else:
            await ctx.send(embed=ErrorEmbed("Unknown action. Use `add`, `remove`, or `list`."))


async def setup(bot: commands.Bot):
    await bot.add_cog(SecurityDashboard(bot))
