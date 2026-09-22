import discord
from discord.ext import commands
from discord import app_commands
from typing import Optional
from utils.ui import SyncInkEmbed, BRAND_ACCENT, check_bot_online_status, get_latency_badge, send_clean_v2_message
from utils.emojis import Emojis
from services.mod_service import ModService
from utils.logger import log

try:
    from services.stats_image_service import StatsImageService, PILLOW_AVAILABLE
except Exception as e:
    log.warning(f"StatsImageService could not be initialized: {e}")
    StatsImageService = None
    PILLOW_AVAILABLE = False

TICKET_BOT_ID = 1513075101992747158
VOICE_BOT_ID = 1516578887109181520

class Stats(commands.Cog):
    """Ecosystem performance telemetry and high-definition visual server & user analytics."""

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

        # 2. Clean fallback embed
        fallback = SyncInkEmbed(title=f"{Emojis.CONNECTION_PING} Bot Statistics")
        fallback.description = "Real-time gateway latency and ecosystem cluster status."
        fallback.add_field(name="Gateway Latency", value=f"{ping_badge} `{latency_ms}ms` ({ping_quality})", inline=False)
        fallback.add_field(name="Support Bot", value=f"{Emojis.CONNECTION_GOOD} Operational", inline=True)
        fallback.add_field(name="Ticket Bot", value=f"{ticket_emoji} {ticket_status}", inline=True)
        fallback.add_field(name="Voice Bot", value=f"{voice_emoji} {voice_status}", inline=True)

        return layout, fallback

    @commands.command(name="botstats", aliases=["ping"], description="View public bot performance and ping statistics.")
    async def botstats(self, ctx: commands.Context):
        layout, fallback = self._build_stats_payload(ctx.guild)
        await send_clean_v2_message(ctx, layout, fallback_embed=fallback)

    @commands.command(name="serverstats", aliases=["guildstats", "sstats"], description="Generate a visual analytics dashboard for the server.")
    async def serverstats(self, ctx: commands.Context):
        """Generates and uploads a high-definition visual analytics card for the current server."""
        if not ctx.guild:
            await ctx.send("This command can only be used within a server.")
            return

        buf = None
        if PILLOW_AVAILABLE and StatsImageService is not None:
            try:
                buf = await StatsImageService.generate_server_stats_card(ctx.guild)
            except Exception as e:
                log.error(f"Error rendering server stats image: {e}")
                buf = None

        if buf is not None:
            try:
                file = discord.File(fp=buf, filename=f"serverstats_{ctx.guild.id}.png")
                await ctx.send(file=file)
                return
            except Exception as e:
                log.error(f"Failed to send server stats image file: {e}")

        # Rich Fallback Embed (guaranteed to always display even if Pillow is uninstalled or file upload fails)
        try:
            member_count = ctx.guild.member_count or len(ctx.guild.members)
            online_count = sum(1 for m in ctx.guild.members if getattr(m, 'status', None) and getattr(m.status, 'name', str(m.status)) in ('online', 'idle', 'dnd'))
            embed = SyncInkEmbed(
                title=f"📊 Server Analytics — {ctx.guild.name}",
                color=BRAND_ACCENT
            )
            if ctx.guild.icon:
                try:
                    embed.set_thumbnail(url=ctx.guild.icon.url)
                except Exception:
                    pass
            embed.add_field(name="Members", value=f"• Total: `{member_count:,}`\n• Online: `{online_count:,}`", inline=True)
            embed.add_field(name="Created", value=f"<t:{int(ctx.guild.created_at.timestamp())}:R>", inline=True)
            text_cnt = len(ctx.guild.text_channels) if hasattr(ctx.guild, 'text_channels') else 0
            voice_cnt = len(ctx.guild.voice_channels) if hasattr(ctx.guild, 'voice_channels') else 0
            embed.add_field(name="Channels", value=f"• Text: `{text_cnt}`\n• Voice: `{voice_cnt}`", inline=True)
            embed.set_footer(text="SyncInk Analytics • Server Telemetry Report", icon_url="https://files.catbox.moe/74l9su.png")
            await ctx.send(embed=embed)
        except Exception as e:
            log.error(f"Error sending fallback server stats embed: {e}")
            await ctx.send(f"📊 **{ctx.guild.name}** has `{getattr(ctx.guild, 'member_count', 'unknown')}` members.")

    @commands.command(name="userstats", aliases=["stats", "ustats"], description="Generate a visual analytics dashboard for a user.")
    async def userstats(self, ctx: commands.Context, *, member: Optional[discord.Member] = None):
        """Generates and uploads a high-definition visual analytics card for a member."""
        target = member or ctx.author
        if not ctx.guild:
            await ctx.send("This command can only be used within a server.")
            return

        buf = None
        mod_counts = {"WARN": 0, "TIMEOUT": 0, "JAIL": 0}
        try:
            mod_counts = await ModService.count_user_cases(ctx.guild.id, target.id)
        except Exception as e:
            log.warning(f"Could not fetch user mod cases: {e}")

        if PILLOW_AVAILABLE and StatsImageService is not None:
            try:
                buf = await StatsImageService.generate_user_stats_card(target, mod_counts)
            except Exception as e:
                log.error(f"Error rendering user stats image: {e}")
                buf = None

        if buf is not None:
            try:
                file = discord.File(fp=buf, filename=f"userstats_{target.id}.png")
                await ctx.send(file=file)
                return
            except Exception as e:
                log.error(f"Failed to send user stats image file: {e}")

        # Rich Fallback Embed
        try:
            warn_cnt = mod_counts.get("WARN", 0)
            timeout_cnt = mod_counts.get("TIMEOUT", 0)
            jail_cnt = mod_counts.get("JAIL", 0)
            total_inf = warn_cnt + timeout_cnt + jail_cnt

            embed = SyncInkEmbed(
                title=f"👤 Member Analytics — {target.display_name}",
                color=BRAND_ACCENT
            )
            try:
                embed.set_thumbnail(url=target.display_avatar.url)
            except Exception:
                pass
            embed.add_field(name="Disciplinary Standing", value="`Clean Record`" if total_inf == 0 else f"`{total_inf} Active Cases`", inline=True)
            embed.add_field(name="Security Infractions", value=f"• Warns: `{warn_cnt}`\n• Timeouts: `{timeout_cnt}`\n• Jails: `{jail_cnt}`", inline=True)
            joined_str = f"<t:{int(target.joined_at.timestamp())}:R>" if target.joined_at else "Unknown"
            created_str = f"<t:{int(target.created_at.timestamp())}:R>"
            embed.add_field(name="Account Details", value=f"• Joined: {joined_str}\n• Created: {created_str}", inline=False)
            top_role = target.top_role.name if target.top_role.name != "@everyone" else "Member"
            embed.add_field(name="Roles & Hierarchy", value=f"• Top Role: `{top_role}`\n• Total Roles: `{len(target.roles) - 1}`", inline=False)
            embed.set_footer(text="SyncInk Analytics • Member Telemetry Report", icon_url="https://files.catbox.moe/74l9su.png")
            await ctx.send(embed=embed)
        except Exception as e:
            log.error(f"Error sending fallback user stats embed: {e}")
            await ctx.send(f"👤 **{target.display_name}** | ID: `{target.id}`")

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

    @app_commands.command(name="serverstats", description="Generate a visual analytics dashboard for the server.")
    async def slash_serverstats(self, interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return

        await interaction.response.defer()
        buf = None
        if PILLOW_AVAILABLE and StatsImageService is not None:
            try:
                buf = await StatsImageService.generate_server_stats_card(interaction.guild)
            except Exception as e:
                log.error(f"Error in slash_serverstats image rendering: {e}")

        if buf is not None:
            try:
                file = discord.File(fp=buf, filename=f"serverstats_{interaction.guild.id}.png")
                await interaction.followup.send(file=file)
                return
            except Exception as e:
                log.error(f"Error sending file in slash_serverstats: {e}")

        # Fallback Embed for slash command
        member_count = interaction.guild.member_count or 1
        embed = SyncInkEmbed(title=f"📊 Server Analytics — {interaction.guild.name}")
        embed.add_field(name="Members", value=f"`{member_count:,}`", inline=True)
        embed.add_field(name="Created", value=f"<t:{int(interaction.guild.created_at.timestamp())}:R>", inline=True)
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="userstats", description="Generate a visual analytics dashboard for a user.")
    async def slash_userstats(self, interaction: discord.Interaction, member: Optional[discord.Member] = None):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return

        target = member or interaction.user
        await interaction.response.defer()
        buf = None
        mod_counts = {"WARN": 0, "TIMEOUT": 0, "JAIL": 0}
        try:
            mod_counts = await ModService.count_user_cases(interaction.guild.id, target.id)
        except Exception:
            pass

        if PILLOW_AVAILABLE and StatsImageService is not None:
            try:
                buf = await StatsImageService.generate_user_stats_card(target, mod_counts)
            except Exception as e:
                log.error(f"Error in slash_userstats image rendering: {e}")

        if buf is not None:
            try:
                file = discord.File(fp=buf, filename=f"userstats_{target.id}.png")
                await interaction.followup.send(file=file)
                return
            except Exception as e:
                log.error(f"Error sending file in slash_userstats: {e}")

        # Fallback Embed for slash command
        embed = SyncInkEmbed(title=f"👤 Member Analytics — {target.display_name}")
        embed.add_field(name="Account", value=f"ID: `{target.id}`", inline=True)
        await interaction.followup.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
