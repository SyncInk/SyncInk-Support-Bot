import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, BRAND_ACCENT, check_bot_online_status, get_latency_badge, send_clean_v2_message
from utils.emojis import Emojis

TICKET_BOT_ID = 1513075101992747158
VOICE_BOT_ID = 1516578887109181520

class Stats(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def _build_stats_payload(self, guild: discord.Guild = None):
        latency_ms = round(self.bot.latency * 1000) if self.bot.latency else 0
        ping_badge, ping_quality = get_latency_badge(latency_ms)

        ticket_emoji, ticket_status = check_bot_online_status(self.bot, guild, TICKET_BOT_ID)
        voice_emoji, voice_status = check_bot_online_status(self.bot, guild, VOICE_BOT_ID)

        # 1. Discord Components V2 LayoutView
        layout = discord.ui.LayoutView()
        container = discord.ui.Container(
            discord.ui.TextDisplay(
                f"### {Emojis.CONNECTION_PING} **Bot Statistics & Network Health**\n"
                "Real-time gateway latency and ecosystem cluster status."
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"**Network Latency**\n"
                f"{ping_badge} **Gateway Ping:** `{latency_ms}ms` ({ping_quality})"
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"**Ecosystem Cluster**\n"
                f"{Emojis.CONNECTION_GOOD} **Support Bot:** Operational\n"
                f"{ticket_emoji} **Ticket Bot:** {ticket_status}\n"
                f"{voice_emoji} **Voice Bot:** {voice_status}"
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay("-# SyncInk Platform • Performance Telemetry"),
            accent_color=BRAND_ACCENT
        )
        layout.add_item(container)

        # 2. Clean fallback embed (No duplicate author, permanent footer only, no manual ASCII lines)
        fallback = SyncInkEmbed(title=f"{Emojis.CONNECTION_PING} Bot Statistics")
        fallback.description = "Real-time gateway latency and ecosystem cluster status."
        fallback.add_field(name="Gateway Latency", value=f"{ping_badge} `{latency_ms}ms` ({ping_quality})", inline=False)
        fallback.add_field(name="Support Bot", value=f"{Emojis.CONNECTION_GOOD} Operational", inline=True)
        fallback.add_field(name="Ticket Bot", value=f"{ticket_emoji} {ticket_status}", inline=True)
        fallback.add_field(name="Voice Bot", value=f"{voice_emoji} {voice_status}", inline=True)

        return layout, fallback

    @commands.command(name="botstats", aliases=["ping", "stats"], description="View public bot performance and ping statistics.")
    async def botstats(self, ctx: commands.Context):
        layout, fallback = self._build_stats_payload(ctx.guild)
        await send_clean_v2_message(ctx, layout, fallback_embed=fallback)

    @app_commands.command(name="ping", description="View bot latency and ecosystem connectivity.")
    async def slash_ping(self, interaction: discord.Interaction):
        layout, fallback = self._build_stats_payload(interaction.guild)
        try:
            await interaction.response.send_message(view=layout)
        except Exception:
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=fallback)
            else:
                await interaction.followup.send(embed=fallback)

    @app_commands.command(name="botstats", description="View bot latency, performance, and server counts.")
    async def slash_botstats(self, interaction: discord.Interaction):
        layout, fallback = self._build_stats_payload(interaction.guild)
        try:
            await interaction.response.send_message(view=layout)
        except Exception:
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=fallback)
            else:
                await interaction.followup.send(embed=fallback)

async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
