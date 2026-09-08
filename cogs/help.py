import discord
from discord.ext import commands
from utils.ui import SyncInkEmbed, ERROR_COLOR

HELP_COLOR = discord.Color(0xE74C3C)

class HelpPaginationView(discord.ui.View):
    def __init__(self, pages: list[discord.Embed], author_id: int):
        super().__init__(timeout=180)
        self.pages = pages
        self.author_id = author_id
        self.current_page = 0
        self._update_buttons()

    def _update_buttons(self):
        self.prev_btn.disabled = (self.current_page == 0)
        self.next_btn.disabled = (self.current_page == len(self.pages) - 1)
        self.page_indicator.label = f"Page {self.current_page + 1}/{len(self.pages)}"

    @discord.ui.button(label="◀ Previous", style=discord.ButtonStyle.secondary, custom_id="help_prev")
    async def prev_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.current_page > 0:
            self.current_page -= 1
            self._update_buttons()
            await interaction.response.edit_message(embed=self.pages[self.current_page], view=self)

    @discord.ui.button(label="Page 1/1", style=discord.ButtonStyle.primary, disabled=True, custom_id="help_indicator")
    async def page_indicator(self, interaction: discord.Interaction, button: discord.ui.Button):
        pass

    @discord.ui.button(label="Next ▶", style=discord.ButtonStyle.secondary, custom_id="help_next")
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
    """Sends a paginated command guide directly to user DMs with role-gated moderation."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def _build_page(self, title: str, commands_list: list[tuple[str, str]], page_num: int, total_pages: int) -> discord.Embed:
        embed = discord.Embed(
            title="SyncInk Support Server",
            color=HELP_COLOR
        )
        
        desc_lines = [
            "Commands in this server start with `?`\n",
            f"**{title}**\n"
        ]
        for syntax, desc in commands_list:
            desc_lines.append(f"`{syntax}`\n╰ {desc}\n")

        embed.description = "\n".join(desc_lines).strip()
        embed.set_footer(text=f"Page {page_num} of {total_pages} • SyncInk Support Server", icon_url="https://files.catbox.moe/74l9su.png")
        return embed

    @commands.command(name="help", description="Receive the full SyncInk command guide in your direct messages.")
    async def help(self, ctx: commands.Context, *, query: str = None):
        member = ctx.author
        is_mod = (
            member.guild_permissions.moderate_members
            or member.guild_permissions.manage_messages
            or member.guild_permissions.administrator
        )
        is_admin = member.guild_permissions.administrator

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
                # Staff only:
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
                "onboard": ("`?onboard`", "Run the guided interactive setup for server security.", True),
                "spawn_verification": ("`?spawn_verification`", "Deploy the persistent 'Verify Now' security gate button.", True),
                "announce": ("`?announce [#channel] <message>`", "Broadcast a formatted markdown announcement.", True),
                "webhook_post": ("`?webhook_post <name | content>`", "Post custom announcement via webhook.", True),
            }

            if query_clean in all_cmds:
                syntax, desc, requires_mod = all_cmds[query_clean]
                if requires_mod and not is_mod:
                    # Regular members cannot see or query moderation commands
                    embed = SyncInkEmbed(
                        title="<a:refused:1520914088568295564> Command Not Found",
                        description=f"Could not find any command matching `{query}`.\nType `?help` to receive the full command guide in your DMs.",
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
                title="<a:refused:1520914088568295564> Command Not Found",
                description=f"Could not find any command matching `{query}`.\nType `?help` to receive the full command guide in your DMs.",
                color=ERROR_COLOR
            )
            await ctx.send(embed=embed)
            return

        # Prepare Pages:
        # Page 1: Suggestions & Ideas
        # Page 2: Platform & Utilities
        # Page 3: AI Assistant
        # (If Moderator) Page 4: Moderation Commands
        # (If Administrator) Page 5: Administration & Setup
        raw_pages_data = [
            (
                "💡 Suggestions & Feature Requests",
                [
                    ("/suggest <title> <description>", "Submit an idea or feature request with community voting in #suggestions (Slash command)."),
                    ("/feature_request <title> <description>", "Submit a formal feature request with community voting in #suggestions (Slash command)."),
                    ("?suggest <title | description>", "Prefix version to submit suggestions directly in #suggestions.")
                ]
            ),
            (
                "📊 Platform & Utilities",
                [
                    ("?botstats", "View bot latency, uptime, and server count (Alias: `?ping`)."),
                    ("?status", "Check real-time operational status of the SyncInk platform."),
                    ("?products", "Explore SyncInk products, hosting, and bot solutions."),
                    ("?links", "View official website, dashboard, and community links."),
                    ("?cleanup [amount]", "Clean up recent bot responses in the current channel.")
                ]
            ),
            (
                "🤖 AI Assistant",
                [
                    ("?ask <question>", "Ask any question to the integrated OpenAI assistant (Alias: `?ai`).")
                ]
            )
        ]

        if is_mod:
            raw_pages_data.append((
                "🛡️ Moderator Actions (Staff Only)",
                [
                    ("?warn <@member> [reason]", "Issue an official logged warning to a member."),
                    ("?timeout <@member> <minutes> [reason]", "Temporarily restrict chat access for a duration (Alias: `?mute`)."),
                    ("?kick <@member> [reason]", "Kick a member from the server."),
                    ("?ban <@member> [reason]", "Permanently ban a member from the server."),
                    ("?unban <user_id> [reason]", "Lift a ban using the target's Discord user ID."),
                    ("?jail <@member> [minutes] [reason]", "Restrict member to isolation jail. Persists across server re-joins."),
                    ("?unjail <@member> [reason]", "Release a user from jail and restore their original roles."),
                    ("?purge <amount>", "Bulk delete between 1 and 100 messages in current channel (Alias: `?clear`)."),
                    ("?history <@member>", "Export member's recent 30 recorded messages as a text file.")
                ]
            ))

        if is_admin:
            raw_pages_data.append((
                "⚙️ Administration & Setup (Admin Only)",
                [
                    ("?config", "Open the interactive server configuration and automod dashboard."),
                    ("?onboard", "Run the guided interactive setup for server security."),
                    ("?spawn_verification", "Deploy the persistent 'Verify Now' security gate button."),
                    ("?create_button_role <@role> [msg]", "Spawn a persistent button allowing members to toggle a role."),
                    ("?announce [#channel] <message>", "Broadcast a formatted markdown announcement."),
                    ("?webhook_post <name | content>", "Post a custom announcement using a webhook (guides/rules)."),
                    ("?set_suggestion_status <id> <status>", "Update suggestion status: pending, approved, implemented, declined."),
                    ("?set_<log_type>_logs #channel", "Bind audit log channels: message, member, moderation, server, voice, verification.")
                ]
            ))

        total_pages = len(raw_pages_data)
        pages = [
            self._build_page(title, cmds, idx + 1, total_pages)
            for idx, (title, cmds) in enumerate(raw_pages_data)
        ]

        try:
            view = HelpPaginationView(pages, author_id=member.id)
            await member.send(embed=pages[0], view=view)
            try:
                ack = await ctx.send("📬 Check your DMs! I've sent you the command list.")
                await ack.delete(delay=6)
            except Exception:
                pass
        except discord.Forbidden:
            err = await ctx.send("❌ I couldn't send you a DM. Please enable direct messages from server members in your privacy settings to view the help guide.")
            await err.delete(delay=10)

async def setup(bot: commands.Bot):
    await bot.add_cog(Help(bot))
