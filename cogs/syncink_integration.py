import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, BRAND_ACCENT, check_bot_online_status, get_latency_badge, send_clean_v2_message
from utils.emojis import Emojis

TICKET_BOT_ID = 1513075101992747158
VOICE_BOT_ID = 1516578887109181520

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
                f"**Infrastructure & Network**\n"
                f"{Emojis.CPU} **Host Latency:** {ping_badge} `{latency_ms}ms` ({ping_quality})\n"
                f"{Emojis.SETTINGS} **Active Guilds:** `{len(self.bot.guilds)}`"
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
        fallback.add_field(name="Infrastructure", value=f"{Emojis.CPU} {ping_badge} `{latency_ms}ms` ({ping_quality})", inline=True)
        fallback.add_field(name="Active Guilds", value=f"{Emojis.SETTINGS} `{len(self.bot.guilds)}`", inline=True)

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

    @commands.command(name="products", description="Browse the suite of SyncInk products and services.")
    async def products(self, ctx: commands.Context):
        embed = SyncInkEmbed(title=f"{Emojis.SETTINGS} Our Products")
        embed.description = "Explore our ecosystem of premium Discord applications and web platforms."
        embed.set_thumbnail(url="https://syncink.xyz/assets/products_icon.png")
        
        embed.add_field(name="SyncInk Studio", value="Professional bot hosting and management.", inline=False)
        embed.add_field(name="SyncInk Support", value="Advanced community moderation platform.", inline=False)
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="View All Products", style=discord.ButtonStyle.link, url="https://syncink.xyz"))
        
        await ctx.send(embed=embed, view=view)

    @commands.command(name="links", description="View official SyncInk platform links.")
    async def links(self, ctx: commands.Context):
        embed = SyncInkEmbed(title=f"{Emojis.LOOKING} Official Resources")
        embed.description = "Quick access to the SyncInk ecosystem."
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="Website", style=discord.ButtonStyle.link, url="https://syncink.xyz"))
        view.add_item(discord.ui.Button(label="Dashboard", style=discord.ButtonStyle.link, url="https://dash.syncink.xyz"))
        view.add_item(discord.ui.Button(label="Community", style=discord.ButtonStyle.link, url="https://discord.gg/syncink"))
        
        await ctx.send(embed=embed, view=view)

async def setup(bot: commands.Bot):
    await bot.add_cog(SyncInkIntegration(bot))
