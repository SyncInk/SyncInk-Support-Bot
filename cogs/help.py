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
        is_mod_channel = ctx.channel.id in {1520462320235577454, 1520879581400141856}
        show_mod = is_owner and is_mod_channel

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
                "pfp": ("`?pfp [@member/id]`", "Display a member's profile photo in full size (Alias: `?avatar`, `?av`).", False),
                "avatar": ("`?avatar [@member/id]`", "Display a member's profile photo in full size.", False),
                "banner": ("`?banner [@member/id]`", "Display a member's profile banner in full size.", False),
                "cleanup": ("`?cleanup [amount]`", "Clean up recent bot responses in the current channel.", False),
                "ask": ("`?ask <question>`", "Ask any question to the integrated OpenAI assistant (Alias: `?ai`).", False),
                "ai": ("`?ai <question>`", "Ask any question to the integrated OpenAI assistant.", False),
                # Music & 24/7 Radio commands:
                "play": ("`?play <song/url>` or `/play <query>`", "Search & stream high-fidelity audio from YouTube, Spotify, etc. (Alias: `?p`).", False),
                "p": ("`?p <query>`", "Alias for `?play` - Search and stream audio.", False),
                "radio": ("`?radio [station]` or `/radio [station]`", "Tune into 24/7 curated audio stations (lofi, synthwave, coffee, sleep, gaming).", False),
                "lofi": ("`?lofi` or `/lofi`", "Stream continuous 24/7 relaxing lofi study and chill beats.", False),
                "search": ("`?search <query>` or `/search <query>`", "Interactive 5-result music picker to choose and queue songs.", False),
                "pause": ("`?pause` or `/pause`", "Pause active music playback.", False),
                "resume": ("`?resume` or `/resume`", "Resume paused music playback.", False),
                "skip": ("`?skip [count]` or `/skip [count]`", "Skip current track forward (Aliases: `?s`, `?next`).", False),
                "s": ("`?s [count]`", "Alias for `?skip` - Skip current track forward.", False),
                "next": ("`?next`", "Alias for `?skip` - Skip current track forward.", False),
                "previous": ("`?previous` or `/previous`", "Replay previous track in history (Alias: `?prev`).", False),
                "prev": ("`?prev`", "Alias for `?previous` - Replay previous track in history.", False),
                "stop": ("`?stop` or `/stop`", "Stop music playback and clear upcoming queue.", False),
                "leave": ("`?leave` or `/leave`", "Disconnect the bot from voice channel (Aliases: `?dc`, `?disconnect`).", False),
                "dc": ("`?dc`", "Alias for `?leave` - Disconnect from voice channel.", False),
                "disconnect": ("`?disconnect`", "Alias for `?leave` - Disconnect from voice channel.", False),
                "queue": ("`?queue [list/clear]` or `/queue`", "View upcoming tracks in queue or clear queue (Alias: `?q`).", False),
                "q": ("`?q`", "Alias for `?queue` - View track queue.", False),
                "np": ("`?np` or `/np`", "Display interactive Now Playing player card with control buttons (Alias: `?nowplaying`).", False),
                "nowplaying": ("`?nowplaying`", "Alias for `?np` - Display now playing player card.", False),
                "shuffle": ("`?shuffle` or `/shuffle`", "Randomize upcoming tracks in queue.", False),
                "loop": ("`?loop [off|track|queue]` or `/loop`", "Toggle loop mode for current track or entire queue (Alias: `?repeat`).", False),
                "repeat": ("`?repeat [off|track|queue]`", "Alias for `?loop` - Toggle loop mode.", False),
                "volume": ("`?volume <1-200>` or `/volume`", "Adjust playback volume gain (Alias: `?vol`).", False),
                "vol": ("`?vol <1-200>`", "Alias for `?volume` - Adjust audio volume.", False),
                "autoplay": ("`?autoplay [on|off]` or `/autoplay`", "Toggle endless smart recommendations when queue ends.", False),
                "247": ("`?247 [on|off]` or `/247`", "Keep bot in voice channel 24/7 without disconnecting (Alias: `?alwayson`).", False),
                "alwayson": ("`?alwayson [on|off]`", "Alias for `?247` - 24/7 voice channel mode.", False),
                "replay": ("`?replay` or `/replay`", "Replay current track from the beginning.", False),
                # Owner only (visible in private staff channels):
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
                "modlogs": ("`?modlogs [@member]`", "View moderation records for a member or recent server cases (Staff channels only; Aliases: `?history`, `?cases`, `?warnings`).", True),
                "case": ("`?case <case_id>`", "View full details of a specific moderation case (Staff channels only).", True),
                "chat_history": ("`?chat_history <@member>`", "Export member's recent 30 recorded messages as a text file.", True),
                "history": ("`?history [@member]`", "Alias for `?modlogs` - View moderation records in authorized staff channels.", True),
                "config": ("`?config`", "Open the interactive server configuration and automod dashboard.", True),
                "security": ("`?security`", "Open the interactive master security dashboard and anti-nuke controls.", True),
                "automod": ("`?automod`", "Open the interactive automod overview and toggle panel.", True),
                "lockdown": ("`?lockdown [reason]`", "Emergency lockdown or unlock server channels during a raid.", True),
                "whitelist": ("`?whitelist <add|remove|list> <role|user|channel|domain> <target>`", "Manage trusted exemptions from automod and security.", True),
                "onboard": ("`?onboard`", "Run the guided interactive setup for server security.", True),
                "spawn_verification": ("`?spawn_verification`", "Deploy the persistent 'Verify Now' security gate button.", True),
                "announce": ("`?announce [#channel] <message>`", "Broadcast a formatted markdown announcement.", True),
                "webhook_post": ("`?webhook_post <name | content>`", "Post custom announcement via webhook.", True),
                "sync": ("`?sync [guild|global]`", "Force sync slash commands to current server or globally (Admin only).", True),
                "installmusic": ("`?installmusic`", "Auto-install yt-dlp & PyNaCl music dependencies on Termux (Alias: `?fixmusic`).", True),
                "fixmusic": ("`?fixmusic`", "Alias for `?installmusic` - Auto-install music dependencies.", True),
                "update": ("`?update`", "Pull latest updates from GitHub and restart the bot (Alias: `?gitpull`).", True),
                "gitpull": ("`?gitpull`", "Alias for `?update` - Pull latest updates from GitHub.", True),
            }

            if query_clean in all_cmds:
                syntax, desc, requires_owner = all_cmds[query_clean]
                if requires_owner and not show_mod:
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
            (Emojis.AI, "AI Assistant", "Ask questions to the integrated SyncInk AI assistant"),
            (Emojis.RADIO, "Music & 24/7 Radio", "High-fidelity audio streaming, interactive controls, and genre radio"),
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
                description="Ask questions to the SyncInk AI assistant",
                emoji=EmojiPartials.AI
            ),
            discord.SelectOption(
                label="Music & 24/7 Radio (Booster Exclusive)",
                value="4",
                description="Exclusive for Boosters in #music-commands",
                emoji=EmojiPartials.RADIO
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
                    ("?pfp [@member/id]", "Display a member's profile photo in full size (Alias: `?avatar`, `?av`)."),
                    ("?banner [@member/id]", "Display a member's custom profile banner in full size."),
                    ("?cleanup [amount]", "Clean up recent bot responses in the current channel.")
                ]
            ),
            (
                f"{Emojis.AI} **AI Assistant**",
                [
                    ("?ask <question>", "Ask any question to the integrated SyncInk AI assistant (Alias: `?ai`).")
                ]
            ),
            (
                f"{Emojis.RADIO} **Music & 24/7 Radio (Exclusive for <@&1558584451724738640> in <#1520749466330857492>)**",
                [
                    ("?play <query> • /play <query>", "Search & stream audio from YouTube, Spotify, SoundCloud, etc. (Alias: `?p`)."),
                    ("?radio [country] • /radio [country]", "Worldwide live country radio from 240+ countries with country autocomplete."),
                    ("?lofi • /lofi", "Start continuous 24/7 relaxing study and focus lofi beats."),
                    ("?search <query> • /search <query>", "Interactive 10-result picker to select and queue songs next."),
                    ("?np • /np", "Display the interactive Now Playing player card with control buttons."),
                    ("?pause • ?resume", "Pause or resume active music playback."),
                    ("?skip [count] • ?previous", "Skip forward or replay previous track in history (Alias: `?s`)."),
                    ("?stop • ?leave", "Stop playback, clear queue, or disconnect from voice (Alias: `?dc`)."),
                    ("?queue [list/clear] • /queue", "View upcoming track list or clear queue (Alias: `?q`)."),
                    ("?shuffle • ?loop [off/track/queue]", "Randomize queue or loop current track/queue."),
                    ("?volume <percent> • /volume", "Adjust digital audio volume from 1% to 200% (Alias: `?vol`)."),
                    ("?autoplay [on/off] • /autoplay", "Enable smart automatic song recommendations when queue finishes."),
                    ("?247 [on/off] • /247", "Keep bot in voice channel 24/7 without auto-disconnecting (Alias: `?alwayson`).")
                ]
            )
        ]

        if show_mod:
            overview_categories.append(
                (Emojis.MODERATION, "Moderator Actions & Security", "Staff disciplinary actions, anti-nuke, and master config")
            )
            select_options.append(
                discord.SelectOption(
                    label="Moderator Actions & Security",
                    value="5",
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
                    ("?modlogs [@member]", "View moderation history or recent server cases (Staff channels only; Alias: `?history`)."),
                    ("?case <id>", "View specific moderation case details (Staff channels only)."),
                    ("?security", "Open master security dashboard and anti-nuke control panel."),
                    ("?automod", "Open automod overview and quick toggles."),
                    ("?lockdown [reason]", "Trigger emergency lockdown or restore channels during a raid."),
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
