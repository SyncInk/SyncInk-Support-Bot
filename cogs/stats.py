import discord
import asyncio
import os
from datetime import datetime, timezone
from discord.ext import commands
from discord import app_commands
from typing import Optional
from utils.ui import SyncInkEmbed, BRAND_ACCENT, ERROR_COLOR, check_bot_online_status, get_latency_badge, send_clean_v2_message
from utils.emojis import Emojis
from utils.logger import log

try:
    from services.mod_service import ModService
except Exception as e:
    log.warning(f"ModService could not be imported in stats cog: {e}")
    ModService = None

try:
    from database import db
except Exception as e:
    log.warning(f"Database module could not be imported in stats cog: {e}")
    db = None

try:
    from services.stats_image_service import StatsImageService, PILLOW_AVAILABLE, format_relative_time
except Exception as e:
    log.warning(f"StatsImageService could not be initialized: {e}")
    StatsImageService = None
    PILLOW_AVAILABLE = False
    format_relative_time = lambda dt: "recently"

TICKET_BOT_ID = 1513075101992747158
VOICE_BOT_ID = 1516578887109181520
SYNCINK_SUPPORT_GUILD_ID = int(os.getenv("SUPPORT_GUILD_ID", 1520457643842342912))

class Stats(commands.Cog):
    """Ecosystem performance telemetry and high-definition visual server & user analytics."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _build_stats_payload(self, guild: Optional[discord.Guild] = None, message_created_at: Optional[datetime] = None):
        # 1. Gateway WebSocket Ping
        latency_ms = round(self.bot.latency * 1000) if self.bot.latency else 0
        ping_badge, ping_quality = get_latency_badge(latency_ms)

        # 2. REST API Roundtrip Latency (True HTTP roundtrip to Discord API)
        rest_latency_ms = None
        try:
            t0 = asyncio.get_event_loop().time()
            await self.bot.http.get_gateway()
            rest_latency_ms = max(5, round((asyncio.get_event_loop().time() - t0) * 1000))
        except Exception:
            if message_created_at is not None:
                if message_created_at.tzinfo is None:
                    message_created_at = message_created_at.replace(tzinfo=timezone.utc)
                diff = round((datetime.now(timezone.utc) - message_created_at).total_seconds() * 1000)
                rest_latency_ms = max(15, diff)
            else:
                rest_latency_ms = latency_ms

        if rest_latency_ms <= 150:
            rest_badge = Emojis.CONNECTION_GOOD
        elif rest_latency_ms <= 350:
            rest_badge = Emojis.CONNECTION_MODERATE
        else:
            rest_badge = Emojis.CONNECTION_LOW

        # 3. PostgreSQL Database Query Latency
        db_latency_ms = None
        db_status = "Disconnected"
        try:
            if db is not None and db.is_connected():
                t0 = asyncio.get_event_loop().time()
                await db.fetchval("SELECT 1")
                db_latency_ms = round((asyncio.get_event_loop().time() - t0) * 1000, 1)
                db_status = "Operational"
            else:
                db_status = "Standby"
        except Exception as e:
            log.warning(f"Database ping check error: {e}")
            db_status = "Degraded"

        if db_status == "Operational":
            db_badge = Emojis.CONNECTION_GOOD
            db_text = f"`{db_latency_ms}ms` (Operational)"
        elif db_status == "Degraded":
            db_badge = Emojis.CONNECTION_MODERATE
            db_text = "(Degraded)"
        else:
            db_badge = Emojis.CONNECTION_NONE
            db_text = f"({db_status})"

        # 4. Support Bot Operational Assessment
        if self.bot.is_closed():
            bot_status = "Offline"
            bot_badge = Emojis.CONNECTION_NONE
        elif db_status == "Operational" and latency_ms < 500:
            bot_status = "Operational"
            bot_badge = Emojis.CONNECTION_GOOD
        else:
            bot_status = "Degraded"
            bot_badge = Emojis.CONNECTION_MODERATE

        ticket_emoji, ticket_status = check_bot_online_status(self.bot, guild, TICKET_BOT_ID)
        voice_emoji, voice_status = check_bot_online_status(self.bot, guild, VOICE_BOT_ID)

        # 5. Discord Components V2 LayoutView
        layout = discord.ui.LayoutView()
        container = discord.ui.Container(
            discord.ui.TextDisplay(
                f"### {Emojis.CONNECTION_PING} **Bot Statistics & Network Health**\n"
                "Real-time gateway latency, database query time, and ecosystem health."
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"**Real-time Latency Telemetry**\n"
                f"{ping_badge} **Gateway Ping:** `{latency_ms}ms` ({ping_quality})\n"
                f"{rest_badge} **REST Roundtrip:** `{rest_latency_ms}ms`\n"
                f"{db_badge} **Database Ping:** {db_text}"
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay(
                f"**Ecosystem Cluster Health**\n"
                f"{bot_badge} {Emojis.SYNCBOT} **Support Bot:** {bot_status}\n"
                f"{ticket_emoji} {Emojis.SYNCBOT} **Ticket Bot:** {ticket_status}\n"
                f"{voice_emoji} {Emojis.SYNCBOT} **Voice Bot:** {voice_status}"
            ),
            discord.ui.Separator(),
            discord.ui.TextDisplay("-# SyncInk Platform • Verified Real-time Telemetry"),
            accent_color=BRAND_ACCENT
        )
        layout.add_item(container)

        # 6. Clean fallback embed
        fallback = SyncInkEmbed(title=f"{Emojis.CONNECTION_PING} Bot Statistics & Health")
        fallback.description = "Real-time gateway latency, database query time, and ecosystem health."
        fallback.add_field(
            name="Latency Telemetry",
            value=(
                f"• **Gateway:** {ping_badge} `{latency_ms}ms` ({ping_quality})\n"
                f"• **REST API:** {rest_badge} `{rest_latency_ms}ms`\n"
                f"• **PostgreSQL:** {db_badge} {db_text}"
            ),
            inline=False
        )
        fallback.add_field(name="Support Bot", value=f"{bot_badge} {Emojis.SYNCBOT} {bot_status}", inline=True)
        fallback.add_field(name="Ticket Bot", value=f"{ticket_emoji} {Emojis.SYNCBOT} {ticket_status}", inline=True)
        fallback.add_field(name="Voice Bot", value=f"{voice_emoji} {Emojis.SYNCBOT} {voice_status}", inline=True)

        return layout, fallback

    @commands.command(name="botstats", aliases=["ping"], description="View public bot performance and ping statistics.")
    async def botstats(self, ctx: commands.Context):
        created_at = getattr(ctx.message, 'created_at', None)
        layout, fallback = await self._build_stats_payload(ctx.guild, message_created_at=created_at)
        await send_clean_v2_message(ctx, layout, fallback_embed=fallback, reply=True)

    @commands.command(name="serverstats", aliases=["guildstats", "sstats"], description="Generate a visual analytics dashboard for the server.")
    async def serverstats(self, ctx: commands.Context):
        """Generates and uploads a high-definition visual analytics card for the SyncInk Support Server."""
        if not ctx.guild:
            await ctx.send("This command can only be used within the SyncInk Support Server.")
            return

        if ctx.guild.id != SYNCINK_SUPPORT_GUILD_ID:
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Support Server Exclusive**",
                description="Server analytics dashboards are exclusively configured for the official **SyncInk Support Server**.",
                color=ERROR_COLOR
            )
            try:
                await ctx.reply(content=ctx.author.mention, embed=embed, mention_author=True)
            except Exception:
                await ctx.send(content=ctx.author.mention, embed=embed)
            return

        # Attempt on-demand Pillow install if missing
        if StatsImageService is not None and not getattr(StatsImageService, 'PILLOW_AVAILABLE', False):
            await asyncio.to_thread(StatsImageService.ensure_pillow_installed)

        buf = None
        if StatsImageService is not None:
            try:
                buf = await StatsImageService.generate_server_stats_card(ctx.guild)
            except Exception as e:
                log.error(f"Error rendering server stats image: {e}")
                buf = None

        if buf is not None:
            try:
                file = discord.File(fp=buf, filename=f"serverstats_{ctx.guild.id}.png")
                try:
                    await ctx.reply(content=ctx.author.mention, file=file, mention_author=True)
                except Exception:
                    await ctx.send(content=ctx.author.mention, file=file)
                return
            except Exception as e:
                log.error(f"Failed to send server stats image file: {e}")

        # Fallback Embed (shows full server creation time and counts)
        try:
            member_count = ctx.guild.member_count or len(ctx.guild.members)
            online_count = sum(1 for m in ctx.guild.members if getattr(m, 'status', None) and getattr(m.status, 'name', str(m.status)) in ('online', 'idle', 'dnd'))
            created_ts = int(ctx.guild.created_at.timestamp())
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
            embed.add_field(name="Created", value=f"<t:{created_ts}:D>\n(<t:{created_ts}:R>)", inline=True)
            text_cnt = len(ctx.guild.text_channels) if hasattr(ctx.guild, 'text_channels') else 0
            voice_cnt = len(ctx.guild.voice_channels) if hasattr(ctx.guild, 'voice_channels') else 0
            embed.add_field(name="Channels", value=f"• Text: `{text_cnt}`\n• Voice: `{voice_cnt}`", inline=True)
            embed.set_footer(
                text="SyncInk Analytics • Run '?installpillow' or 'pkg install python-pillow' in Termux for HD images",
                icon_url="https://files.catbox.moe/74l9su.png"
            )
            try:
                await ctx.reply(content=ctx.author.mention, embed=embed, mention_author=True)
            except Exception:
                await ctx.send(content=ctx.author.mention, embed=embed)
        except Exception as e:
            log.error(f"Error sending fallback server stats embed: {e}")
            await ctx.send(f"{ctx.author.mention} 📊 **{ctx.guild.name}** has `{getattr(ctx.guild, 'member_count', 'unknown')}` members.")

    @commands.command(name="userstats", aliases=["stats", "ustats"], description="Generate a visual analytics dashboard for a user.")
    async def userstats(self, ctx: commands.Context, *, member: Optional[discord.Member] = None):
        """Generates and uploads a high-definition visual analytics card for a member."""
        if not ctx.guild:
            await ctx.send("This command can only be used within the SyncInk Support Server.")
            return

        if ctx.guild.id != SYNCINK_SUPPORT_GUILD_ID:
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Support Server Exclusive**",
                description="User analytics dashboards are exclusively configured for the official **SyncInk Support Server**.",
                color=ERROR_COLOR
            )
            try:
                await ctx.reply(content=ctx.author.mention, embed=embed, mention_author=True)
            except Exception:
                await ctx.send(content=ctx.author.mention, embed=embed)
            return

        target = member or ctx.author

        # Attempt on-demand Pillow install if missing
        if StatsImageService is not None and not getattr(StatsImageService, 'PILLOW_AVAILABLE', False):
            await asyncio.to_thread(StatsImageService.ensure_pillow_installed)

        buf = None
        mod_counts = {"WARN": 0, "TIMEOUT": 0, "JAIL": 0}
        if ModService is not None:
            try:
                mod_counts = await ModService.count_user_cases(ctx.guild.id, target.id)
            except Exception as e:
                log.warning(f"Could not fetch user mod cases: {e}")

        if StatsImageService is not None:
            try:
                buf = await StatsImageService.generate_user_stats_card(target, mod_counts)
            except Exception as e:
                log.error(f"Error rendering user stats image: {e}")
                buf = None

        if buf is not None:
            try:
                file = discord.File(fp=buf, filename=f"userstats_{target.id}.png")
                try:
                    await ctx.reply(content=ctx.author.mention, file=file, mention_author=True)
                except Exception:
                    await ctx.send(content=ctx.author.mention, file=file)
                return
            except Exception as e:
                log.error(f"Failed to send user stats image file: {e}")

        # Fallback Embed with comprehensive Account Creation Time (ac time)
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
            
            created_ts = int(target.created_at.timestamp())
            joined_str = f"<t:{int(target.joined_at.timestamp())}:R>" if target.joined_at else "Unknown"
            embed.add_field(
                name="Account Details (ac time)", 
                value=f"• **Created (ac time):** <t:{created_ts}:D> (<t:{created_ts}:R>)\n• **Joined Server:** {joined_str}", 
                inline=False
            )
            
            top_role = target.top_role.name if target.top_role.name != "@everyone" else "Member"
            embed.add_field(name="Roles & Hierarchy", value=f"• Top Role: `{top_role}`\n• Total Roles: `{len(target.roles) - 1}`", inline=False)
            embed.set_footer(
                text="SyncInk Analytics • Run '?installpillow' or 'pkg install python-pillow' in Termux for HD images",
                icon_url="https://files.catbox.moe/74l9su.png"
            )
            try:
                await ctx.reply(content=ctx.author.mention, embed=embed, mention_author=True)
            except Exception:
                await ctx.send(content=ctx.author.mention, embed=embed)
        except Exception as e:
            log.error(f"Error sending fallback user stats embed: {e}")
            await ctx.send(f"{ctx.author.mention} 👤 **{target.display_name}** | ID: `{target.id}`")

    @app_commands.command(name="ping", description="View bot latency and ecosystem connectivity.")
    async def slash_ping(self, interaction: discord.Interaction):
        layout, fallback = await self._build_stats_payload(interaction.guild, message_created_at=interaction.created_at)
        try:
            await interaction.response.send_message(view=layout)
        except Exception:
            if not interaction.response.is_done():
                await interaction.response.send_message(embed=fallback)
            else:
                await interaction.followup.send(embed=fallback)

    @app_commands.command(name="botstats", description="View bot latency, performance, and server counts.")
    async def slash_botstats(self, interaction: discord.Interaction):
        layout, fallback = await self._build_stats_payload(interaction.guild, message_created_at=interaction.created_at)
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
            await interaction.response.send_message("This command can only be used within the SyncInk Support Server.", ephemeral=True)
            return

        if interaction.guild.id != SYNCINK_SUPPORT_GUILD_ID:
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Support Server Exclusive**",
                description="Server analytics dashboards are exclusively configured for the official **SyncInk Support Server**.",
                color=ERROR_COLOR
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        await interaction.response.defer()
        buf = None
        if StatsImageService is not None:
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

        member_count = interaction.guild.member_count or 1
        created_ts = int(interaction.guild.created_at.timestamp())
        embed = SyncInkEmbed(title=f"📊 Server Analytics — {interaction.guild.name}")
        embed.add_field(name="Members", value=f"`{member_count:,}`", inline=True)
        embed.add_field(name="Created", value=f"<t:{created_ts}:D> (<t:{created_ts}:R>)", inline=True)
        await interaction.followup.send(embed=embed)

    @app_commands.command(name="userstats", description="Generate a visual analytics dashboard for a user.")
    async def slash_userstats(self, interaction: discord.Interaction, member: Optional[discord.Member] = None):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used within the SyncInk Support Server.", ephemeral=True)
            return

        if interaction.guild.id != SYNCINK_SUPPORT_GUILD_ID:
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Support Server Exclusive**",
                description="User analytics dashboards are exclusively configured for the official **SyncInk Support Server**.",
                color=ERROR_COLOR
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return

        target = member or interaction.user
        await interaction.response.defer()
        buf = None
        mod_counts = {"WARN": 0, "TIMEOUT": 0, "JAIL": 0}
        if ModService is not None:
            try:
                mod_counts = await ModService.count_user_cases(interaction.guild.id, target.id)
            except Exception:
                pass

        if StatsImageService is not None:
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

        created_ts = int(target.created_at.timestamp())
        embed = SyncInkEmbed(title=f"👤 Member Analytics — {target.display_name}")
        embed.add_field(name="Account", value=f"ID: `{target.id}`", inline=True)
        embed.add_field(name="Created (ac time)", value=f"<t:{created_ts}:D> (<t:{created_ts}:R>)", inline=False)
        await interaction.followup.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
