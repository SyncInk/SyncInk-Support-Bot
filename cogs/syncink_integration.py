import discord
from typing import Optional, Literal
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, BRAND_ACCENT, check_bot_online_status, get_latency_badge, send_clean_v2_message
from utils.emojis import Emojis, EmojiPartials
from utils.emoji_manager import EmojiManager

TICKET_BOT_ID = 1513075101992747158
VOICE_BOT_ID = 1516578887109181520
DEV_APPLY_CHANNEL_ID = 1539301185423413398
STAFF_APPLY_CHANNEL_ID = 1539319001673367604
RULES_CHANNEL_ID = 1520460587522330634
DEV_ROLE_ID = 1531882215795855511
STAFF_ROLE_ID = 1520466655321522486
APPLY_DEV_URL = "https://syncink.site/apply?tab=developer"
APPLY_STAFF_URL = "https://syncink.site/apply?tab=staff"
APPLY_PORTAL_URL = "https://syncink.site/apply"

class SyncInkIntegration(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def _build_status_payload(self, guild: discord.Guild = None):
        ticket_emoji, ticket_status = check_bot_online_status(self.bot, guild, TICKET_BOT_ID)
        voice_emoji, voice_status = check_bot_online_status(self.bot, guild, VOICE_BOT_ID)
        
        latency_ms = round(self.bot.latency * 1000) if self.bot.latency else 0
        ping_badge, ping_quality = get_latency_badge(latency_ms)

        # 1. Discord Components V2 LayoutView with native Separators (type: 14) and Container (type: 17)
        layout = discord.ui.LayoutView()
        container = discord.ui.Container(
            discord.ui.TextDisplay(
                f"### {Emojis.CONNECTION_PING} **System Status**\n"
                "All core systems are monitored in real-time."
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"**Ecosystem Services**\n"
                f"{Emojis.CONNECTION_GOOD} **Support Hub** — Operational\n"
                f"{ticket_emoji} **Ticket System** (<@{TICKET_BOT_ID}>) — {ticket_status}\n"
                f"{voice_emoji} **Voice Services** (<@{VOICE_BOT_ID}>) — {voice_status}\n"
                f"{Emojis.AI} **SyncInk AI** — Active"
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"**Network Latency**\n"
                f"{ping_badge} **Gateway Ping:** `{latency_ms}ms` ({ping_quality})"
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay("-# SyncInk Platform • Real-time Ecosystem Telemetry"),
            accent_color=BRAND_ACCENT
        )
        layout.add_item(container)

        # 2. Clean fallback embed (No duplicate author, permanent footer only, no manual ASCII lines)
        fallback = SyncInkEmbed(title=f"{Emojis.CONNECTION_PING} System Status")
        fallback.description = "All core systems are monitored in real-time."
        fallback.add_field(name="Support Hub", value=f"{Emojis.CONNECTION_GOOD} Operational", inline=True)
        fallback.add_field(name="Ticket System", value=f"{ticket_emoji} {ticket_status}", inline=True)
        fallback.add_field(name="Voice Services", value=f"{voice_emoji} {voice_status}", inline=True)
        fallback.add_field(name="SyncInk AI", value=f"{Emojis.AI} Active", inline=True)
        fallback.add_field(name="Network Health", value=f"{ping_badge} `{latency_ms}ms` ({ping_quality})", inline=False)

        return layout, fallback

    @commands.command(name="status", description="Check the operational status of the SyncInk Ecosystem.")
    async def status(self, ctx: commands.Context):
        layout, fallback = self._build_status_payload(ctx.guild)
        await send_clean_v2_message(ctx, layout, fallback_embed=fallback)

    @app_commands.command(name="status", description="Check the operational status of the SyncInk Ecosystem.")
    async def slash_status(self, interaction: discord.Interaction):
        layout, fallback = self._build_status_payload(interaction.guild)
        try:
            await interaction.response.send_message(view=layout)
        except Exception:
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=fallback)
            else:
                await interaction.followup.send(embed=fallback)

    def _build_products_payload(self):
        embed = SyncInkEmbed(title=f"{Emojis.SETTINGS} Our Products")
        embed.description = "Explore our ecosystem of premium Discord applications and web platforms."
        embed.set_thumbnail(url="https://files.catbox.moe/74l9su.png")
        
        embed.add_field(name="SyncInk Studio", value="Professional bot hosting and management.", inline=False)
        embed.add_field(name="SyncInk Support", value="Advanced community moderation platform.", inline=False)
        embed.set_footer(
            text="SyncInk Platform | Product Ecosystem",
            icon_url="https://files.catbox.moe/74l9su.png"
        )
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="Official Website", style=discord.ButtonStyle.link, url="https://syncink.site"))
        view.add_item(discord.ui.Button(label="Support Server", style=discord.ButtonStyle.link, url="https://discord.gg/PmxfJwmQuB"))
        return embed, view

    @commands.command(name="products", description="Browse the suite of SyncInk products and services.")
    async def products(self, ctx: commands.Context):
        embed, view = self._build_products_payload()
        await ctx.send(embed=embed, view=view)

    @app_commands.command(name="products", description="Browse the suite of SyncInk products and services.")
    async def slash_products(self, interaction: discord.Interaction):
        embed, view = self._build_products_payload()
        await interaction.response.send_message(embed=embed, view=view)

    def _build_links_payload(self):
        embed = SyncInkEmbed(title=f"{Emojis.LOOKING} Official Resources")
        embed.description = (
            "Quick access to the official SyncInk platform, documentation, and community guidelines.\n\n"
            "• <:rules:1547034188702818426> **Rules:** [syncink.site/rules](https://syncink.site/rules) • <#1520460587522330634>\n"
            "• <:syncinkquestion:1547033451029594222> **FAQ:** [syncink.site/faq](https://syncink.site/faq) • <#1520460624864350218>\n"
            "• <:terms:1567518395677548585> **Terms:** [syncink.site/terms](https://syncink.site/terms)\n"
            "• <:moderation:1547035031275573289> **Privacy:** [syncink.site/privacy](https://syncink.site/privacy)"
        )
        embed.set_footer(
            text="SyncInk Platform | Official Network",
            icon_url="https://files.catbox.moe/74l9su.png"
        )
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="Website", style=discord.ButtonStyle.link, url="https://syncink.site"))
        view.add_item(discord.ui.Button(label="Rules", style=discord.ButtonStyle.link, url="https://syncink.site/rules", emoji=EmojiPartials.RULES))
        view.add_item(discord.ui.Button(label="FAQ", style=discord.ButtonStyle.link, url="https://syncink.site/faq", emoji=EmojiPartials.QUESTION))
        view.add_item(discord.ui.Button(label="Community", style=discord.ButtonStyle.link, url="https://discord.gg/PmxfJwmQuB"))
        return embed, view

    @commands.command(name="links", description="View official SyncInk platform links.")
    async def links(self, ctx: commands.Context):
        embed, view = self._build_links_payload()
        await ctx.send(embed=embed, view=view)

    @app_commands.command(name="links", description="View official SyncInk platform links.")
    async def slash_links(self, interaction: discord.Interaction):
        embed, view = self._build_links_payload()
        await interaction.response.send_message(embed=embed, view=view)

    def _build_apply_payload(self, guild: Optional[discord.Guild] = None, focus_role: Optional[str] = None):
        dev_emoji = EmojiManager.get_role_emoji(guild, "developer")
        staff_emoji = EmojiManager.get_role_emoji(guild, "staff")
        verified_emoji = EmojiManager.get_role_emoji(guild, "verified")

        role_clean = (focus_role or "").strip().lower()
        is_dev_focus = role_clean in ("dev", "developer", "engineering")
        is_staff_focus = role_clean in ("staff", "mod", "moderator", "support")

        dev_block = (
            f"{dev_emoji} **Developer Team** (<@&{DEV_ROLE_ID}>)\n"
            f"{Emojis.S_ARROW} **Focus:** Discord bots, web dashboards, backend APIs & Audia AI\n"
            f"{Emojis.S_ARROW} **Requirements:** <#{DEV_APPLY_CHANNEL_ID}>\n"
            f"{Emojis.S_ARROW} **Application Form:** **[Apply for Developer]({APPLY_DEV_URL})**"
        )
        staff_block = (
            f"{staff_emoji} **Staff & Moderation Team** (<@&{STAFF_ROLE_ID}>)\n"
            f"{Emojis.S_ARROW} **Focus:** Community moderation, member support & ticket handling\n"
            f"{Emojis.S_ARROW} **Requirements:** <#{STAFF_APPLY_CHANNEL_ID}>\n"
            f"{Emojis.S_ARROW} **Application Form:** **[Apply for Staff]({APPLY_STAFF_URL})**"
        )

        # Order focused track first if specified, otherwise Developer & Staff cleanly
        first_block = staff_block if is_staff_focus else dev_block
        second_block = dev_block if is_staff_focus else staff_block

        intro_line = (
            "Join the SyncInk **Developer** or **Staff** team. Authenticate with Discord on our portal to submit an application in under 2 minutes."
        )
        if is_dev_focus:
            intro_line = "Applying for the **SyncInk Developer Team** — review engineering expectations below and open the Developer Application portal."
        elif is_staff_focus:
            intro_line = "Applying for the **SyncInk Staff & Moderation Team** — review moderation expectations below and open the Staff Application portal."

        action_row = discord.ui.ActionRow(
            discord.ui.Button(
                label="Apply for Developer",
                style=discord.ButtonStyle.link,
                url=APPLY_DEV_URL,
                emoji=EmojiPartials.ROLE_DEVELOPER,
            ),
            discord.ui.Button(
                label="Apply for Staff",
                style=discord.ButtonStyle.link,
                url=APPLY_STAFF_URL,
                emoji=EmojiPartials.ROLE_STAFF,
            ),
            discord.ui.Button(
                label="Recruitment Portal",
                style=discord.ButtonStyle.link,
                url=APPLY_PORTAL_URL,
                emoji=EmojiPartials.EARTH_BLURPLE,
            ),
        )

        layout = discord.ui.LayoutView()
        container = discord.ui.Container(
            discord.ui.Section(
                discord.ui.TextDisplay(
                    f"### {Emojis.LOGO} **SyncInk Team Recruitment**\n"
                    f"{intro_line}"
                ),
                accessory=discord.ui.Thumbnail("https://files.catbox.moe/74l9su.png"),
            ),
            discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small),
            discord.ui.TextDisplay(first_block),
            discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small),
            discord.ui.TextDisplay(second_block),
            discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small),
            discord.ui.TextDisplay(
                f"{Emojis.CHECK_YES} **Minimum Requirements:** 15+ years old, 2FA enabled, active member, and compliant with <#{RULES_CHANNEL_ID}> & Discord ToS.\n"
                f"-# {verified_emoji} Applications are linked directly to your Discord account • [syncink.site/apply]({APPLY_PORTAL_URL})"
            ),
            discord.ui.Separator(visible=True, spacing=discord.enums.SeparatorSpacing.small),
            action_row,
            accent_color=BRAND_ACCENT,
        )
        layout.add_item(container)

        # Clean fallback embed if V2 components ever degrade
        fallback = SyncInkEmbed(
            title=f"{Emojis.LOGO} SyncInk Team Recruitment",
            description=intro_line,
            color=BRAND_ACCENT,
        )
        fallback.set_thumbnail(url="https://files.catbox.moe/74l9su.png")
        fallback.add_field(name=f"{dev_emoji} Developer Team", value=dev_block.split("\n", 1)[1], inline=False)
        fallback.add_field(name=f"{staff_emoji} Staff & Moderation Team", value=staff_block.split("\n", 1)[1], inline=False)
        fallback.add_field(
            name=f"{Emojis.CHECK_YES} Eligibility",
            value=f"15+ years old • 2FA enabled • Active community standing • Follows <#{RULES_CHANNEL_ID}> & Discord ToS",
            inline=False,
        )
        fallback.set_footer(
            text="SyncInk Platform • Official Recruitment Portal",
            icon_url="https://files.catbox.moe/74l9su.png",
        )
        return layout, fallback

    @commands.command(
        name="apply",
        aliases=["recruit", "recruitment", "applydev", "applystaff"],
        description="Get official application links and requirements for SyncInk Developer or Staff roles."
    )
    async def apply_cmd(self, ctx: commands.Context, *, role: Optional[str] = None):
        layout, fallback = self._build_apply_payload(ctx.guild, focus_role=role)
        await send_clean_v2_message(ctx, layout, fallback_embed=fallback, reply=True)

    @app_commands.command(name="apply", description="Get official application links for SyncInk Developer or Staff roles.")
    @app_commands.describe(role="Optional focus role (Developer or Staff)")
    async def slash_apply(self, interaction: discord.Interaction, role: Optional[Literal["developer", "staff"]] = None):
        layout, fallback = self._build_apply_payload(interaction.guild, focus_role=role)
        try:
            await interaction.response.send_message(view=layout)
        except Exception:
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=fallback)
            else:
                await interaction.followup.send(embed=fallback)

async def setup(bot: commands.Bot):
    await bot.add_cog(SyncInkIntegration(bot))
