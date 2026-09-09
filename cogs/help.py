import discord
from discord.ext import commands
from utils.ui import SyncInkEmbed, ERROR_COLOR
from utils.emojis import Emojis, EmojiPartials

HELP_COLOR = discord.Color(0xE74C3C)

class HelpCategorySelect(discord.ui.Select):
    def __init__(self, options: list[discord.SelectOption]):
        super().__init__(
            placeholder="⚙️ Select a category",
            min_values=1,
            max_values=1,
            options=options,
            row=0
        )

    async def callback(self, interaction: discord.Interaction):
        view: HelpPaginationView = self.view
        selected_index = int(self.values[0])
        await view.set_page(interaction, selected_index)


class HelpPaginationView(discord.ui.View):
    def __init__(self, pages: list[discord.Embed], author_id: int, select_options: list[discord.SelectOption]):
        super().__init__(timeout=180)
        self.pages = pages
        self.author_id = author_id
        self.current_page = 0
        self.select_menu = HelpCategorySelect(select_options)
        self.add_item(self.select_menu)
        self._update_buttons()

    def _update_buttons(self):
        self.prev_btn.disabled = (self.current_page == 0)
        self.next_btn.disabled = (self.current_page == len(self.pages) - 1)
        self.page_indicator.label = f"Page {self.current_page + 1}/{len(self.pages)}"
        
        # When on overview (page 0), reset select defaults so placeholder shows
        # On category pages (> 0), set default=True for the matching option
        for opt in self.select_menu.options:
            if self.current_page == 0:
                opt.default = False
            else:
                opt.default = (opt.value == str(self.current_page))

    async def set_page(self, interaction: discord.Interaction, page_idx: int):
        self.current_page = page_idx
        self._update_buttons()
        await interaction.response.edit_message(embed=self.pages[self.current_page], view=self)

    @discord.ui.button(label="◀ Previous", style=discord.ButtonStyle.secondary, custom_id="help_prev", row=1)
    async def prev_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.current_page > 0:
            self.current_page -= 1
            self._update_buttons()
            await interaction.response.edit_message(embed=self.pages[self.current_page], view=self)

    @discord.ui.button(label="Page 1/1", style=discord.ButtonStyle.primary, disabled=True, custom_id="help_indicator", row=1)
    async def page_indicator(self, interaction: discord.Interaction, button: discord.ui.Button):
        pass

    @discord.ui.button(label="Next ▶", style=discord.ButtonStyle.secondary, custom_id="help_next", row=1)
    async def next_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.current_page < len(self.pages) - 1:
            self.current_page += 1
            self._update_buttons()
            await interaction.response.edit_message(embed=self.pages[self.current_page], view=self)

    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.author_id:
            await interaction.response.send_message("Use `?help` to open your own command guide!", ephemeral=True)
            return False
        return True


class Help(commands.Cog):
    """Sends an interactive categorized command guide with dropdown selection and role-gated moderation."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def _build_overview_page(self, categories: list[tuple[str, str, str]], total_pages: int) -> discord.Embed:
        embed = discord.Embed(
            title=f"{Emojis.QUESTION} Help - Getting Started",
            color=HELP_COLOR
        )
        desc_lines = [
            "Commands in this server start with `?`\n"
        ]
        for cat_emoji, cat_name, cat_desc in categories:
            desc_lines.append(f"{cat_emoji} **{cat_name}**\n╰ {cat_desc}\n")

        embed.description = "\n".join(desc_lines).strip()
        embed.set_footer(text=f"Page 1 of {total_pages} • SyncInk Support Server", icon_url="https://files.catbox.moe/74l9su.png")
        return embed

    def _build_category_page(self, title_with_emoji: str, commands_list: list[tuple[str, str]], page_num: int, total_pages: int) -> discord.Embed:
        embed = discord.Embed(
            title="SyncInk Support Server",
            color=HELP_COLOR
        )
        desc_lines = [
            "Commands in this server start with `?`\n",
            f"{title_with_emoji}\n"
        ]
        for syntax, desc in commands_list:
            desc_lines.append(f"`{syntax}`\n╰ {desc}\n")

        embed.description = "\n".join(desc_lines).strip()
        embed.set_footer(text=f"Page {page_num} of {total_pages} • SyncInk Support Server", icon_url="https://files.catbox.moe/74l9su.png")
        return embed

    @commands.command(name="help", description="Receive the full SyncInk command guide with category dropdown.")
    async def help(self, ctx: commands.Context, *, query: str = None):
        member = ctx.author
        is_server_owner = (ctx.guild and ctx.author.id == ctx.guild.owner_id)
        is_bot_owner = await self.bot.is_owner(ctx.author)
        is_owner = is_server_owner or is_bot_owner

        # If user searched for a specific command via `?help <command>`
        if query:
            query_clean = query.lower().strip().lstrip("?")
            all_cmds = {
                "suggest": ("`/suggest <title> <description>` or `?suggest <text>`", "Submit an idea or feature request with voting in #suggestions.", False),
                "feature_request": ("`/feature_request <title> <description>`", "Submit a formal feature request with community voting in #suggestions.", False),
                "botstats": ("`?botstats`", "View bot latency, uptime, and server count (Alias: `?ping`).", False),
                "ping": ("`?ping`", "View bot latency and ping.", False),
                "status": ("`?status`", "Check real-time operational status of the SyncInk platform.", False),
                "products": ("`?products`", "Explore SyncInk products, hosting, and bot solutions.", False),
                "links": ("`?links`", "View official website, dashboard, and community links.", False),
                "cleanup": ("`?cleanup [amount]`", "Clean up recent bot responses in the current channel.", False),
                "ask": ("`?ask <question>`", "Ask any question to the integrated OpenAI assistant (Alias: `?ai`).", False),
                "ai": ("`?ai <question>`", "Ask any question to the integrated OpenAI assistant.", False),
                "warn": ("`?warn <@member> [reason]`", "Issue an official logged warning to a member.", True),
                "timeout": ("`?timeout <@member> <minutes> [reason]`", "Temporarily restrict chat access for a duration (Alias: `?mute`).", True),
                "mute": ("`?mute <@member> <minutes> [reason]`", "Mute a member for a duration.", True),
                "kick": ("`?kick <@member> [reason]`", "Kick a member from the server.", True),
                "ban": ("`?ban <@member> [reason]`", "Permanently ban a member from the server.", True),
                "unban": ("`?unban <user_id> [reason]`", "Lift a ban using the target's Discord user ID.", True),
                "jail": ("`?jail <@member> [minutes] [reason]`", "Restrict member to isolation jail. Persists across server re-joins.", True),
                "unjail": ("`?unjail <@member> [reason]`", "Release a user from jail and restore their original roles.", True),
                "purge": ("`?purge <amount>`", "Bulk delete between 1 and 100 messages in current channel (Alias: `?clear`).", True),
                "clear": ("`?clear <amount>`", "Bulk delete recent messages in current channel.", True),
                "history": ("`?history <@member>`", "Export member's recent 30 recorded messages as a text file.", True),
                "config": ("`?config`", "Open the interactive server configuration and automod dashboard.", True),
                "security": ("`?security` or `/security`", "Open the interactive master security dashboard and anti-nuke controls.", True),
                "automod": ("`?automod` or `/automod`", "Open the interactive automod overview and toggle panel.", True),
                "lockdown": ("`?lockdown [reason]` or `/lockdown`", "Emergency lockdown or unlock server channels during a raid.", True),
                "whitelist": ("`?whitelist <add|remove|list> <role|user|channel|domain> <target>`", "Manage trusted exemptions from automod and security.", True),
                "onboard": ("`?onboard`", "Run the guided interactive setup for server security.", True),
                "spawn_verification": ("`?spawn_verification`", "Deploy the persistent 'Verify Now' security gate button.", True),
                "announce": ("`?announce [#channel] <message>`", "Broadcast a formatted markdown announcement.", True),
                "webhook_post": ("`?webhook_post <name | content>`", "Post custom announcement via webhook.", True),
            }

            if query_clean in all_cmds:
                syntax, desc, requires_owner = all_cmds[query_clean]
                if requires_owner and not is_owner:
                    embed = SyncInkEmbed(
                        title=f"{Emojis.REFUSED} Command Not Found",
                        description=f"Could not find any command matching `{query}`.\nType `?help` to view available commands.",
                        color=ERROR_COLOR
                    )
                    await ctx.send(embed=embed)
                    return

                embed = discord.Embed(
                    title="SyncInk Support Server",
                    color=HELP_COLOR
                )
                embed.description = f"Commands in this server start with `?`\n\n**Command:** `{query_clean}`\n{syntax}\n╰ {desc}"
                await ctx.send(embed=embed)
                return

            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} Command Not Found",
                description=f"Could not find any command matching `{query}`.\nType `?help` to view available commands.",
                color=ERROR_COLOR
            )
            await ctx.send(embed=embed)
            return

        overview_categories = [
            (Emojis.SUGGESTION, "Suggestions & Feature Requests", "Submit and vote on ideas in #suggestions"),
            (Emojis.SETTINGS, "Platform & Utilities", "Bot latency, operational status, products, and links"),
            (Emojis.CHATGPT, "AI Assistant", "Ask questions to the integrated OpenAI assistant"),
        ]

        select_options = [
            discord.SelectOption(
                label="Help - Getting Started",
                value="0",
                description="Overview of all bot features & categories",
                emoji=EmojiPartials.QUESTION
            ),
            discord.SelectOption(
                label="Suggestions & Feature Requests",
                value="1",
                description="Submit and vote on ideas in #suggestions",
                emoji=EmojiPartials.SUGGESTION
            ),
            discord.SelectOption(
                label="Platform & Utilities",
                value="2",
                description="Bot status, ping, products, and links",
                emoji=EmojiPartials.SETTINGS
            ),
            discord.SelectOption(
                label="AI Assistant",
                value="3",
                description="Ask questions to the OpenAI assistant",
                emoji=EmojiPartials.CHATGPT
            )
        ]

        category_pages_data = [
            (
                f"{Emojis.SUGGESTION} **Suggestions & Feature Requests**",
                [
                    ("/suggest <title> <description>", "Submit an idea or feature request with community voting in #suggestions (Slash command)."),
                    ("/feature_request <title> <description>", "Submit a formal feature request with community voting in #suggestions (Slash command)."),
                    ("?suggest <title | description>", "Prefix version to submit suggestions directly in #suggestions.")
                ]
            ),
            (
                f"{Emojis.SETTINGS} **Platform & Utilities**",
                [
                    ("?botstats", "View bot latency, uptime, and server count (Alias: `?ping`)."),
                    ("?status", "Check real-time operational status of the SyncInk platform."),
                    ("?products", "Explore SyncInk products, hosting, and bot solutions."),
                    ("?links", "View official website, dashboard, and community links."),
                    ("?cleanup [amount]", "Clean up recent bot responses in the current channel.")
                ]
            ),
            (
                f"{Emojis.CHATGPT} **AI Assistant**",
                [
                    ("?ask <question>", "Ask any question to the integrated OpenAI assistant (Alias: `?ai`).")
                ]
            )
        ]

        if is_owner:
            overview_categories.append(
                (Emojis.MODERATION, "Moderator Actions & Security", "Staff disciplinary actions, anti-nuke, and master config")
            )
            select_options.append(
                discord.SelectOption(
                    label="Moderator Actions & Security",
                    value="4",
                    description="Staff disciplinary actions, anti-nuke & config",
                    emoji=EmojiPartials.MODERATION
                )
            )
            category_pages_data.append((
                f"{Emojis.MODERATION} **Moderator Actions & Security (Owner Only)**",
                [
                    ("?warn <@member> [reason]", "Issue an official logged warning to a member."),
                    ("?timeout <@member> <minutes> [reason]", "Temporarily restrict chat access for a duration (Alias: `?mute`)."),
                    ("?kick <@member> [reason]", "Kick a member from the server."),
                    ("?ban <@member> [reason]", "Permanently ban a member from the server."),
                    ("?unban <user_id> [reason]", "Lift a ban using the target's Discord user ID."),
                    ("?jail <@member> [minutes] [reason]", "Restrict member to isolation jail. Persists across server re-joins."),
                    ("?unjail <@member> [reason]", "Release a user from jail and restore their original roles."),
                    ("?purge <amount>", "Bulk delete between 1 and 100 messages in current channel (Alias: `?clear`)."),
                    ("?history <@member>", "Export member's recent 30 recorded messages as a text file."),
                    ("?security", "Open master security dashboard and anti-nuke control panel (Slash: `/security`)."),
                    ("?automod", "Open automod overview and quick toggles (Slash: `/automod`)."),
                    ("?lockdown [reason]", "Trigger emergency lockdown or restore channels during a raid (Slash: `/lockdown`)."),
                    ("?whitelist <action> <type> <val>", "Manage security exemptions for roles, users, channels, or domains."),
                    ("?config", "Open interactive server configuration and automod dashboard."),
                    ("?onboard", "Run guided interactive setup for server security."),
                    ("?spawn_verification", "Deploy persistent 'Verify Now' security gate button.")
                ]
            ))

        total_pages = 1 + len(category_pages_data)
        
        overview_page = self._build_overview_page(overview_categories, total_pages)
        
        pages = [overview_page]
        for idx, (title, cmds) in enumerate(category_pages_data):
            pages.append(self._build_category_page(title, cmds, idx + 2, total_pages))

        view = HelpPaginationView(pages, author_id=member.id, select_options=select_options)
        await ctx.send(embed=pages[0], view=view)

        dm_embed = discord.Embed(
            title="SyncInk Support Server",
            description="Commands in this server start with `?`",
            color=HELP_COLOR
        )
        dm_embed.set_footer(text="SyncInk Support Server", icon_url="https://files.catbox.moe/74l9su.png")
        try:
            await member.send(embed=dm_embed)
        except (discord.Forbidden, discord.HTTPException):
            pass

async def setup(bot: commands.Bot):
    await bot.add_cog(Help(bot))
