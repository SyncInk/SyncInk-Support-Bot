import discord
from discord.ext import commands
from utils.ui import SyncInkEmbed, ERROR_COLOR

HELP_COLOR = discord.Color(0xE74C3C)

# Category definitions
# is_mod: requires moderate_members, manage_messages, or administrator
# is_admin: requires administrator
CATEGORIES = {
    "suggestions": {
        "emoji": "💡",
        "label": "Suggestions",
        "desc": "Submit and vote on ideas for the SyncInk platform",
        "role_req": "public",
        "commands": [
            ("?suggest <title | description>", "Submit an idea or request with community voting in <#1546548728721178724>."),
            ("?feature_request <title | description>", "Submit a formal feature request with community voting.")
        ]
    },
    "utilities": {
        "emoji": "📊",
        "label": "Utilities",
        "desc": "View bot status, ping statistics, and official platform links",
        "role_req": "public",
        "commands": [
            ("?botstats", "View bot latency, uptime, and server count (Alias: `?ping`)."),
            ("?status", "Check real-time operational status of the SyncInk platform."),
            ("?products", "Explore SyncInk products, hosting, and bot solutions."),
            ("?links", "View official website, dashboard, and community links."),
            ("?cleanup [amount]", "Clean up recent bot responses in the current channel.")
        ]
    },
    "ai": {
        "emoji": "🤖",
        "label": "AI Assistant",
        "desc": "Ask questions and get instant intelligent answers",
        "role_req": "public",
        "commands": [
            ("?ask <question>", "Ask any question to the integrated OpenAI assistant (Alias: `?ai`).")
        ]
    },
    "moderation": {
        "emoji": "🛡️",
        "label": "Moderation",
        "desc": "Staff disciplinary tools (warn, mute, kick, ban, jail)",
        "role_req": "mod",
        "commands": [
            ("?warn <@member> [reason]", "Issue an official logged warning to a member."),
            ("?timeout <@member> <minutes> [reason]", "Temporarily restrict chat access for a duration (Alias: `?mute`)."),
            ("?kick <@member> [reason]", "Kick a member from the server."),
            ("?ban <@member> [reason]", "Permanently ban a member from the server."),
            ("?unban <user_id> [reason]", "Lift a ban using the target's Discord user ID."),
            ("?jail <@member> [minutes] [reason]", "Restrict member to isolation jail. Evasion-proof; persists on re-join."),
            ("?unjail <@member> [reason]", "Release a user from jail and restore their original roles."),
            ("?purge <amount>", "Bulk delete between 1 and 100 messages in current channel (Alias: `?clear`)."),
            ("?history <@member>", "Export member's recent 30 recorded messages as a text file.")
        ]
    },
    "setup": {
        "emoji": "⚙️",
        "label": "Logging & Setup",
        "desc": "Configure server audit channels for all server events",
        "role_req": "admin",
        "commands": [
            ("?set_message_logs #channel", "Bind message edits, deletions, and bulk purge logs."),
            ("?set_member_logs #channel", "Bind member join, leave, role update, and nick logs."),
            ("?set_moderation_logs #channel", "Bind warnings, timeouts, kicks, bans, and jail logs."),
            ("?set_server_logs #channel", "Bind channel creations, role edits, and server updates."),
            ("?set_voice_logs #channel", "Bind voice joins, leaves, mutes, and channel switches."),
            ("?set_verification_logs #channel", "Bind verification checkpoint audit logs."),
            ("?set_suggestions_channel #channel", "Configure the official community suggestions channel.")
        ]
    },
    "security": {
        "emoji": "🔒",
        "label": "Security & Admin",
        "desc": "Verification checkpoint, role buttons, and admin settings",
        "role_req": "admin",
        "commands": [
            ("?config", "Open the interactive server configuration and automod dashboard."),
            ("?onboard", "Run the guided interactive setup for server security."),
            ("?spawn_verification", "Deploy the persistent 'Verify Now' security gate button."),
            ("?create_button_role <@role> [message]", "Spawn a persistent button allowing members to toggle a role."),
            ("?announce [#channel] <message>", "Broadcast a formatted markdown announcement."),
            ("?webhook_post <name | content>", "Post a custom announcement using a webhook (guides/rules)."),
            ("?set_suggestion_status <id> <status>", "Update suggestion status: pending, approved, implemented, declined.")
        ]
    }
}

def can_access_category(cat_key: str, member: discord.Member) -> bool:
    req = CATEGORIES[cat_key]["role_req"]
    if req == "public":
        return True
    if req == "mod":
        return (
            member.guild_permissions.moderate_members
            or member.guild_permissions.manage_messages
            or member.guild_permissions.administrator
        )
    if req == "admin":
        return member.guild_permissions.administrator
    return False

class HelpCategorySelect(discord.ui.Select):
    def __init__(self, allowed_categories: list[str]):
        options = [
            discord.SelectOption(
                label="Getting Started",
                value="overview",
                emoji="❔",
                description="Return to the main category overview"
            )
        ]
        for cat_key in allowed_categories:
            c = CATEGORIES[cat_key]
            options.append(
                discord.SelectOption(
                    label=c["label"],
                    value=cat_key,
                    emoji=c["emoji"],
                    description=c["desc"][:100]
                )
            )
        super().__init__(placeholder="⚙️ Select a category", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        selected = self.values[0]
        if selected == "overview":
            embed = self.view.build_overview_embed()
        else:
            embed = self.view.build_category_embed(selected)
        await interaction.response.edit_message(embed=embed, view=self.view)

class HelpView(discord.ui.View):
    def __init__(self, author: discord.Member):
        super().__init__(timeout=180)
        self.author = author
        self.allowed_categories = [k for k in CATEGORIES if can_access_category(k, author)]
        self.add_item(HelpCategorySelect(self.allowed_categories))

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author.id:
            await interaction.response.send_message("Use `?help` to open your own interactive menu!", ephemeral=True)
            return False
        return True

    def build_overview_embed(self) -> discord.Embed:
        embed = discord.Embed(
            title="❔ Help - Getting Started",
            color=HELP_COLOR
        )
        
        lines = []
        for cat_key in self.allowed_categories:
            c = CATEGORIES[cat_key]
            lines.append(f"{c['emoji']} **{c['label']}**\n╰ {c['desc']}\n")
        
        embed.description = "\n".join(lines).strip()
        return embed

    def build_category_embed(self, cat_key: str) -> discord.Embed:
        c = CATEGORIES.get(cat_key)
        if not c or cat_key not in self.allowed_categories:
            return self.build_overview_embed()

        embed = discord.Embed(
            title=f"❔ Help - {c['label']}",
            color=HELP_COLOR
        )
        
        lines = []
        for syntax, desc in c["commands"]:
            lines.append(f"`{syntax}`\n╰ {desc}\n")
            
        embed.description = "\n".join(lines).strip()
        return embed

class Help(commands.Cog):
    """Sleek Help command matching the category design; hides moderation/admin from regular users."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="help", description="View available commands and usage instructions.")
    async def help(self, ctx: commands.Context, *, query: str = None):
        member = ctx.author

        if not query:
            view = HelpView(author=member)
            embed = view.build_overview_embed()
            await ctx.send(embed=embed, view=view)
            return

        query_clean = query.lower().strip().lstrip("?")
        
        # Check if query matches an accessible category
        matched_cat = None
        for cat_key, c in CATEGORIES.items():
            if query_clean in (cat_key, c["label"].lower()) and can_access_category(cat_key, member):
                matched_cat = cat_key
                break

        if matched_cat:
            view = HelpView(author=member)
            embed = view.build_category_embed(matched_cat)
            await ctx.send(embed=embed, view=view)
            return

        # Check if query matches a command inside an ACCESSIBLE category
        found_cmd = None
        for cat_key, c in CATEGORIES.items():
            if not can_access_category(cat_key, member):
                continue # Regular members cannot search moderation or admin commands
            for syntax, desc in c["commands"]:
                cmd_name = syntax.split()[0].lstrip("?")
                if query_clean == cmd_name or query_clean in syntax.lower():
                    found_cmd = (syntax, desc, c["label"], c["emoji"])
                    break
            if found_cmd:
                break

        if found_cmd:
            syntax, desc, cat_label, emoji = found_cmd
            embed = discord.Embed(
                title=f"❔ Help - {query_clean}",
                color=HELP_COLOR
            )
            embed.description = f"**Category:** {emoji} {cat_label}\n\n`{syntax}`\n╰ {desc}"
            await ctx.send(embed=embed)
            return

        # Fallback: if regular member or command not found/not permitted
        embed = SyncInkEmbed(
            title="<a:refused:1520914088568295564> Command Not Found",
            description=f"Could not find any command or category matching `{query}`.\nType `?help` to view all available commands.",
            color=ERROR_COLOR
        )
        await ctx.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Help(bot))
