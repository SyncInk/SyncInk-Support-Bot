import discord
from discord.ext import commands
from utils.ui import SyncInkEmbed, BRAND_ACCENT, SUCCESS_COLOR, WARNING_COLOR, ERROR_COLOR

CATEGORIES = {
    "moderation": {
        "title": "🛡️ Moderation & Disciplinary Commands",
        "description": "Powerful moderation utilities to maintain order and enforce server rules.",
        "commands": [
            ("?warn <@member> [reason]", "Issue an official logged warning to a member."),
            ("?timeout <@member> <minutes> [reason]", "Mute/timeout a member for a specified duration (Alias: `?mute`)."),
            ("?kick <@member> [reason]", "Kick a member from the server."),
            ("?ban <@member> [reason]", "Permanently ban a member from the server."),
            ("?unban <user_id> [reason]", "Lift a ban for a user using their ID."),
            ("?jail <@member> [minutes] [reason]", "Isolate member in jail role. Evasion-proof; persists on re-join."),
            ("?unjail <@member> [reason]", "Release a user from jail and restore their original roles."),
            ("?purge <amount>", "Bulk delete between 1 and 100 recent messages in channel (Alias: `?clear`)."),
            ("?history <@member>", "Export a member's recent 30 recorded messages as a text file.")
        ]
    },
    "suggestions": {
        "title": "💡 Suggestions & Feedback System",
        "description": "Collect, vote, and track community feature requests and suggestions.\n*Strictly restricted to channel <#1546548728721178724>*.",
        "commands": [
            ("?suggest <Title | Description>", "Post a suggestion with interactive upvote/downvote buttons."),
            ("?feature_request <Title | Description>", "Submit a formal feature request with community voting."),
            ("?set_suggestion_status <id> <status>", "Update request status: `pending`, `approved`, `implemented`, or `declined` (Staff).")
        ]
    },
    "setup": {
        "title": "⚙️ Logging & Setup Configuration",
        "description": "Bind dedicated audit channels for deep event tracking (Administrator only).",
        "commands": [
            ("?set_message_logs #channel", "Logs message edits, deletes, and bulk purges."),
            ("?set_member_logs #channel", "Logs member joins, leaves, role updates, and nick changes."),
            ("?set_moderation_logs #channel", "Logs warnings, timeouts, kicks, bans, unbans, and jails."),
            ("?set_server_logs #channel", "Logs channel creations, role edits, and server updates."),
            ("?set_voice_logs #channel", "Logs voice channel joins, leaves, mutes, and moves."),
            ("?set_verification_logs #channel", "Logs verification attempts, successes, and failures."),
            ("?set_suggestions_channel #channel", "Designates the official channel for community feature requests.")
        ]
    },
    "security": {
        "title": "🔒 Security & Administration",
        "description": "Server protection, verification gates, and admin broadcast tools.",
        "commands": [
            ("?config", "Open the interactive server configuration and management dashboard."),
            ("?onboard", "Run the interactive guided setup for server security."),
            ("?spawn_verification", "Deploy the persistent 'Verify Now' security gate button in the channel."),
            ("?create_button_role <@role> [msg]", "Spawn a persistent button allowing members to toggle a role."),
            ("?announce [#channel] <message>", "Broadcast a formatted markdown announcement."),
            ("?webhook_post <Name | Content>", "Post a custom announcement using a webhook (great for guides/rules).")
        ]
    },
    "utilities": {
        "title": "📊 Platform Utilities & AI",
        "description": "Bot diagnostics, ecosystem status, and integrated AI assistant.",
        "commands": [
            ("?botstats", "Check current bot latency and server statistics (Alias: `?ping`)."),
            ("?platform_metrics", "View internal uptime, execution analytics, and health (Alias: `?metrics`)."),
            ("?status", "Check real-time status of SyncInk services and tickets."),
            ("?products", "Explore the SyncInk product lineup and platform tools."),
            ("?links", "Get official links to the SyncInk website, dashboard, and community."),
            ("?cleanup [amount]", "Delete recent bot messages to keep channels neat."),
            ("?ask <question>", "Ask the integrated AI assistant any question (Alias: `?ai`).")
        ]
    }
}

class HelpSelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="All Commands (Overview)", value="overview", emoji="📋", description="Complete directory of all bot features"),
            discord.SelectOption(label="Moderation", value="moderation", emoji="🛡️", description="Warn, timeout, kick, ban, jail, purge"),
            discord.SelectOption(label="Suggestions", value="suggestions", emoji="💡", description="Feature requests and voting in <#1546548728721178724>"),
            discord.SelectOption(label="Logging Setup", value="setup", emoji="⚙️", description="Configure message, member, mod, and voice logs"),
            discord.SelectOption(label="Security & Admin", value="security", emoji="🔒", description="Config dashboard, verification, announcements"),
            discord.SelectOption(label="Utilities & AI", value="utilities", emoji="📊", description="Metrics, latency, bot status, and AI queries")
        ]
        super().__init__(placeholder="Select a category for details...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        cat_key = self.values[0]
        if cat_key == "overview":
            embed = self.view.build_overview_embed()
        else:
            embed = self.view.build_category_embed(cat_key)
        await interaction.response.edit_message(embed=embed, view=self.view)

class HelpView(discord.ui.View):
    def __init__(self, author_id: int):
        super().__init__(timeout=180)
        self.author_id = author_id
        self.add_item(HelpSelect())

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author_id:
            await interaction.response.send_message("Use `?help` to open your own interactive menu!", ephemeral=True)
            return False
        return True

    def build_overview_embed(self) -> SyncInkEmbed:
        embed = SyncInkEmbed(
            title="⚡ SyncInk Support Bot — Command Directory",
            description=(
                "**Bot Prefix:** `?` *(Slash commands `/` are disabled for privacy)*\n"
                "**Direct Messages (DMs):** Completely disabled (the bot will not respond in DMs)\n"
                "Use the dropdown below to view detailed syntax and argument guides for each category."
            ),
            color=BRAND_ACCENT
        )
        embed.set_author(name="SyncInk Platform", icon_url="https://syncink.xyz/assets/logo.png")

        embed.add_field(
            name="🛡️ **Moderation & Disciplinary**",
            value="`?warn` `?timeout` `?kick` `?ban` `?unban` `?jail` `?unjail` `?purge` `?history`",
            inline=False
        )
        embed.add_field(
            name="💡 **Suggestions & Feedback** *(Channel: <#1546548728721178724>)*",
            value="`?suggest` `?feature_request` `?set_suggestion_status`",
            inline=False
        )
        embed.add_field(
            name="⚙️ **Logging & Setup Configuration** *(Admin Only)*",
            value="`?set_message_logs` `?set_member_logs` `?set_moderation_logs` `?set_server_logs` `?set_voice_logs` `?set_verification_logs` `?set_suggestions_channel`",
            inline=False
        )
        embed.add_field(
            name="🔒 **Security & Administration**",
            value="`?config` `?onboard` `?spawn_verification` `?create_button_role` `?announce` `?webhook_post`",
            inline=False
        )
        embed.add_field(
            name="📊 **Platform Utilities & AI**",
            value="`?botstats` `?platform_metrics` `?status` `?products` `?links` `?cleanup` `?ask`",
            inline=False
        )
        embed.set_footer(text="SyncInk Platform • Type ?help <command> for specific command help", icon_url="https://files.catbox.moe/74l9su.png")
        return embed

    def build_category_embed(self, cat_key: str) -> SyncInkEmbed:
        cat_data = CATEGORIES.get(cat_key)
        if not cat_data:
            return self.build_overview_embed()

        embed = SyncInkEmbed(
            title=cat_data["title"],
            description=cat_data["description"],
            color=BRAND_ACCENT
        )
        embed.set_author(name="SyncInk Platform Help", icon_url="https://syncink.xyz/assets/logo.png")

        for cmd_syntax, cmd_desc in cat_data["commands"]:
            embed.add_field(name=f"`{cmd_syntax}`", value=f"> {cmd_desc}", inline=False)

        embed.set_footer(text="SyncInk Platform • Use the dropdown menu to switch categories", icon_url="https://files.catbox.moe/74l9su.png")
        return embed

class Help(commands.Cog):
    """Provides a comprehensive help command displaying all bot features with the ? prefix."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="help", description="View all available SyncInk commands and usage instructions.")
    async def help(self, ctx: commands.Context, *, query: str = None):
        if not query:
            view = HelpView(author_id=ctx.author.id)
            embed = view.build_overview_embed()
            await ctx.send(embed=embed, view=view)
            return

        query_clean = query.lower().strip().lstrip("?")
        
        # Check if query matches a category
        if query_clean in CATEGORIES:
            view = HelpView(author_id=ctx.author.id)
            embed = view.build_category_embed(query_clean)
            await ctx.send(embed=embed, view=view)
            return

        # Check if query matches a specific command in our directory
        found_cmd = None
        for cat_key, cat_data in CATEGORIES.items():
            for cmd_syntax, cmd_desc in cat_data["commands"]:
                cmd_name = cmd_syntax.split()[0].lstrip("?")
                if query_clean == cmd_name or query_clean in cmd_syntax:
                    found_cmd = (cmd_syntax, cmd_desc, cat_data["title"])
                    break
            if found_cmd:
                break

        if found_cmd:
            syntax, desc, cat_title = found_cmd
            embed = SyncInkEmbed(
                title=f"Command Help: `?{query_clean}`",
                color=BRAND_ACCENT
            )
            embed.add_field(name="Category", value=cat_title, inline=False)
            embed.add_field(name="Usage Syntax", value=f"```{syntax}```", inline=False)
            embed.add_field(name="Description", value=desc, inline=False)
            embed.set_footer(text="SyncInk Platform • Prefix: ?", icon_url="https://files.catbox.moe/74l9su.png")
            await ctx.send(embed=embed)
            return

        # Fallback search through bot's registered commands
        bot_cmd = self.bot.get_command(query_clean)
        if bot_cmd:
            embed = SyncInkEmbed(
                title=f"Command Help: `?{bot_cmd.name}`",
                color=BRAND_ACCENT
            )
            embed.add_field(name="Usage Syntax", value=f"`?{bot_cmd.name} {bot_cmd.signature}`".strip(), inline=False)
            embed.add_field(name="Description", value=bot_cmd.description or "No description provided.", inline=False)
            if bot_cmd.aliases:
                embed.add_field(name="Aliases", value=", ".join(f"`?{a}`" for a in bot_cmd.aliases), inline=False)
            embed.set_footer(text="SyncInk Platform • Prefix: ?", icon_url="https://files.catbox.moe/74l9su.png")
            await ctx.send(embed=embed)
            return

        # Not found
        embed = SyncInkEmbed(
            title="<a:refused:1520914088568295564> Command Not Found",
            description=f"Could not find any command or category matching `{query}`.\nType `?help` to view all available commands.",
            color=ERROR_COLOR
        )
        await ctx.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Help(bot))
