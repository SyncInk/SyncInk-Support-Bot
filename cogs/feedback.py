import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed, BRAND_ACCENT, SUCCESS_COLOR, ERROR_COLOR
from utils.metrics import metrics
from services.settings_service import SettingsService
from database import db
from utils.permissions import has_permission
from utils.emojis import Emojis, EmojiPartials

class SuggestionVoteView(discord.ui.View):
    def __init__(self, request_id: int, upvotes: int = 0, downvotes: int = 0):
        super().__init__(timeout=None)
        self.request_id = request_id
        self.upvotes = upvotes
        self.downvotes = downvotes
        self._update_buttons()

    def _update_buttons(self):
        for child in self.children:
            if isinstance(child, discord.ui.Button):
                if child.custom_id and child.custom_id.startswith("vote_up"):
                    child.label = f"Upvote ({self.upvotes})"
                elif child.custom_id and child.custom_id.startswith("vote_down"):
                    child.label = f"Downvote ({self.downvotes})"

    @discord.ui.button(emoji=EmojiPartials.APPROVED, label="Upvote (0)", style=discord.ButtonStyle.green, custom_id="vote_up")
    async def upvote(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._handle_vote(interaction, "UP")

    @discord.ui.button(emoji=EmojiPartials.REFUSED, label="Downvote (0)", style=discord.ButtonStyle.red, custom_id="vote_down")
    async def downvote(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._handle_vote(interaction, "DOWN")

    async def _handle_vote(self, interaction: discord.Interaction, vote_type: str):
        user_id = interaction.user.id
        
        # Check existing vote
        existing = await db.fetchrow(
            "SELECT vote_type FROM feature_request_votes WHERE request_id = $1 AND user_id = $2",
            self.request_id, user_id
        )
        
        if existing and existing['vote_type'] == vote_type:
            # Toggle off vote
            await db.execute(
                "DELETE FROM feature_request_votes WHERE request_id = $1 AND user_id = $2",
                self.request_id, user_id
            )
            resp_msg = f"Your {vote_type.lower()}vote has been removed."
        else:
            # Insert or update vote
            await db.execute("""
                INSERT INTO feature_request_votes (request_id, user_id, vote_type)
                VALUES ($1, $2, $3)
                ON CONFLICT (request_id, user_id) DO UPDATE SET vote_type = $3
            """, self.request_id, user_id, vote_type)
            resp_msg = f"Your {vote_type.lower()}vote has been recorded!"

        # Recount votes
        counts = await db.fetchrow("""
            SELECT 
                COUNT(*) FILTER (WHERE vote_type = 'UP') as up_count,
                COUNT(*) FILTER (WHERE vote_type = 'DOWN') as down_count
            FROM feature_request_votes WHERE request_id = $1
        """, self.request_id)
        
        self.upvotes = counts['up_count'] if counts else 0
        self.downvotes = counts['down_count'] if counts else 0

        # Update DB summary
        await db.execute(
            "UPDATE feature_requests SET upvotes = $1, downvotes = $2 WHERE id = $3",
            self.upvotes, self.downvotes, self.request_id
        )

        self._update_buttons()

        # Update embed
        try:
            embed = interaction.message.embeds[0]
            for i, field in enumerate(embed.fields):
                if "Community Votes" in field.name or "Votes" in field.name:
                    embed.set_field_at(
                        i, 
                        name="🗳️ **Community Votes**", 
                        value=f"{Emojis.APPROVED} **{self.upvotes}** Upvotes   •   {Emojis.REFUSED} **{self.downvotes}** Downvotes", 
                        inline=False
                    )
                    break
            await interaction.response.edit_message(embed=embed, view=self)
        except Exception:
            await interaction.response.edit_message(view=self)

        await interaction.followup.send(resp_msg, ephemeral=True)


REQUIRED_SUGGESTION_CHANNEL_ID = 1546548728721178724
DEVELOPER_ROLE_ID = 1531882215795855511

class FeatureRequestStaffView(discord.ui.View):
    def __init__(self, request_id: int, message_id: int, channel_id: int):
        super().__init__(timeout=None)
        self.request_id = request_id
        self.message_id = message_id
        self.channel_id = channel_id

    async def _check_perm(self, interaction: discord.Interaction) -> bool:
        guild = interaction.guild
        if not guild:
            return False
        is_owner = (interaction.user.id == guild.owner_id)
        has_dev = any(r.id == DEVELOPER_ROLE_ID for r in getattr(interaction.user, 'roles', []))
        is_admin = getattr(interaction.user.guild_permissions, 'administrator', False)
        if not (is_owner or has_dev or is_admin):
            await interaction.response.send_message(
                f"{Emojis.REFUSED} Only the Server Owner and Developers can update request status.", 
                ephemeral=True
            )
            return False
        return True

    async def _update_status(self, interaction: discord.Interaction, db_status: str, display_text: str):
        if not await self._check_perm(interaction):
            return

        await db.execute("UPDATE feature_requests SET status = $1 WHERE id = $2", db_status, self.request_id)

        channel = interaction.guild.get_channel(self.channel_id)
        if channel:
            try:
                msg = await channel.fetch_message(self.message_id)
                if msg and msg.embeds:
                    embed = msg.embeds[0]
                    for i, field in enumerate(embed.fields):
                        if "Status" in field.name:
                            embed.set_field_at(i, name=f"{Emojis.LOADING} **Status**", value=f"**{display_text}**", inline=True)
                            break
                    await msg.edit(embed=embed)
            except Exception:
                pass

        await interaction.response.send_message(
            embed=SuccessEmbed(f"Status updated to **{display_text}** by {interaction.user.mention}.")
        )

    @discord.ui.button(label="Approve", style=discord.ButtonStyle.green, emoji=EmojiPartials.APPROVED, custom_id="req_staff_approve")
    async def approve_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._update_status(interaction, "APPROVED", f"{Emojis.APPROVED} Approved / Planned")

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.red, emoji=EmojiPartials.CANCELLED, custom_id="req_staff_cancel")
    async def cancel_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._update_status(interaction, "DECLINED", f"{Emojis.CANCELLED} Cancelled")

    @discord.ui.button(label="Implemented", style=discord.ButtonStyle.primary, emoji=EmojiPartials.CHECK_YES, custom_id="req_staff_implemented")
    async def implemented_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._update_status(interaction, "IMPLEMENTED", f"{Emojis.CHECK_YES} Implemented")

    @discord.ui.button(label="Pending", style=discord.ButtonStyle.secondary, emoji=EmojiPartials.PENDING, custom_id="req_staff_pending")
    async def pending_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._update_status(interaction, "PENDING", f"{Emojis.PENDING} Pending Review")


class Feedback(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _resolve_suggestion_channel(self, guild: discord.Guild) -> discord.TextChannel:
        ch = guild.get_channel(REQUIRED_SUGGESTION_CHANNEL_ID)
        if ch:
            return ch
        settings = await SettingsService.get_guild_settings(guild.id)
        chan_id = settings.get("suggestion_channel_id")
        if chan_id:
            ch = guild.get_channel(chan_id)
            if ch:
                return ch
        
        # Fallback: Auto-discover channel by name
        for channel in guild.text_channels:
            name = channel.name.lower()
            if any(term in name for term in ["feature-request", "feature", "suggest", "ideas", "feedback"]):
                return channel
                
        return None

    async def _process_suggestion(self, target, title: str, description: str):
        metrics.record_suggestion()
        
        is_interaction = isinstance(target, discord.Interaction)
        guild = target.guild
        author = target.user if is_interaction else target.author
        source_channel = target.channel

        target_channel = await self._resolve_suggestion_channel(guild)
        if not target_channel:
            target_channel = source_channel

        # Insert into DB
        row = await db.fetchrow("""
            INSERT INTO feature_requests (guild_id, user_id, channel_id, title, content, status)
            VALUES ($1, $2, $3, $4, $5, 'PENDING')
            RETURNING id
        """, guild.id, author.id, target_channel.id, title, description)
        request_id = row['id']

        embed = SyncInkEmbed(
            title=f"{Emojis.SUGGESTION} **Feature Request #{request_id}: {title}**",
            color=BRAND_ACCENT
        )
        embed.set_author(name=f"{author.display_name} ({author})", icon_url=author.display_avatar.url)
        embed.description = f"```\n{description}\n```"
        embed.add_field(name=f"{Emojis.MEMBERS} **Submitted By**", value=author.mention, inline=True)
        embed.add_field(name=f"{Emojis.LOADING} **Status**", value=f"{Emojis.PENDING} **Pending Review**", inline=True)
        embed.add_field(
            name="🗳️ **Community Votes**", 
            value=f"{Emojis.APPROVED} **0** Upvotes   •   {Emojis.REFUSED} **0** Downvotes", 
            inline=False
        )
        embed.set_footer(text=f"SyncInk Platform • Request #{request_id}", icon_url="https://files.catbox.moe/74l9su.png")

        view = SuggestionVoteView(request_id, upvotes=0, downvotes=0)

        try:
            sent_msg = await target_channel.send(embed=embed, view=view)
            await db.execute("UPDATE feature_requests SET message_id = $1 WHERE id = $2", sent_msg.id, request_id)

            # Automatically create discussion thread
            try:
                thread = await sent_msg.create_thread(
                    name=f"Request #{request_id}: {title[:35]}"
                )
                
                # Add Server Owner
                if guild.owner:
                    try:
                        await thread.add_user(guild.owner)
                    except Exception:
                        pass
                elif guild.owner_id:
                    owner_mem = guild.get_member(guild.owner_id)
                    if owner_mem:
                        try:
                            await thread.add_user(owner_mem)
                        except Exception:
                            pass

                # Add members with Developer role (1531882215795855511)
                dev_role = guild.get_role(DEVELOPER_ROLE_ID)
                if dev_role:
                    for dev_mem in dev_role.members:
                        try:
                            await thread.add_user(dev_mem)
                        except Exception:
                            pass

                # Post staff status control panel in thread
                staff_view = FeatureRequestStaffView(request_id, sent_msg.id, target_channel.id)
                staff_ctrl_embed = SyncInkEmbed(
                    title="🛠️ Feature Request Controls",
                    description=(
                        f"**Feature Request #{request_id}: {title}**\n\n"
                        f"Discussion thread created for this feature request.\n"
                        f"Server Owner and Developers with <@&{DEVELOPER_ROLE_ID}> can update the status below."
                    ),
                    color=BRAND_ACCENT
                )
                await thread.send(embed=staff_ctrl_embed, view=staff_view)
            except Exception:
                pass
            
            resp = SuccessEmbed(f"Your feature request has been successfully posted in {target_channel.mention}!")
            if is_interaction:
                await target.response.send_message(embed=resp, ephemeral=True)
            else:
                await target.send(embed=resp)
        except discord.Forbidden:
            err = ErrorEmbed(description="Failed to post feature request.", resolution="Bot lacks permissions to send messages in the target channel.")
            if is_interaction:
                await target.response.send_message(embed=err, ephemeral=True)
            else:
                await target.send(embed=err)

    @app_commands.command(name="suggest", description="Submit a feature request or suggestion for the platform.")
    @app_commands.describe(title="Short title for your request", description="Detailed explanation of the feature or idea")
    async def slash_suggest(self, interaction: discord.Interaction, title: str, description: str):
        if interaction.channel_id != REQUIRED_SUGGESTION_CHANNEL_ID:
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Channel Restriction**",
                description=f"This command can only be used in <#{REQUIRED_SUGGESTION_CHANNEL_ID}>.",
                color=ERROR_COLOR
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        await self._process_suggestion(interaction, title, description)

    @app_commands.command(name="feature_request", description="Submit a formal feature request with community voting.")
    @app_commands.describe(title="Short title for your request", description="Detailed explanation of the feature or idea")
    async def slash_feature_request(self, interaction: discord.Interaction, title: str, description: str):
        await self.slash_suggest(interaction, title, description)

    @commands.command(name="suggest", description="Submit a feature request or suggestion for the platform.")
    async def suggest(self, ctx: commands.Context, *, text: str = None):
        if ctx.channel.id != REQUIRED_SUGGESTION_CHANNEL_ID:
            embed = SyncInkEmbed(
                title=f"{Emojis.REFUSED} **Channel Restriction**",
                description=f"This command can only be used in <#{REQUIRED_SUGGESTION_CHANNEL_ID}>.",
                color=ERROR_COLOR
            )
            msg = await ctx.send(embed=embed)
            await msg.delete(delay=8)
            return

        if not text:
            await ctx.send(embed=ErrorEmbed(
                description="Please provide your suggestion!",
                resolution="Format: `?suggest Title | Detailed description` or `?suggest Your idea here`"
            ))
            return

        if "|" in text:
            parts = text.split("|", 1)
            title = parts[0].strip()
            description = parts[1].strip()
        elif "\n" in text:
            parts = text.split("\n", 1)
            title = parts[0].strip()
            description = parts[1].strip()
        else:
            if len(text) > 40:
                cut = text[:40].rfind(" ")
                if cut > 10:
                    title = text[:cut].strip()
                    description = text[cut:].strip()
                else:
                    title = "Suggestion"
                    description = text.strip()
            else:
                title = text.strip()
                description = text.strip()

        await self._process_suggestion(ctx, title, description)

    @commands.command(name="feature_request", description="Submit a formal feature request with community voting.")
    async def feature_request(self, ctx: commands.Context, *, text: str = None):
        await self.suggest(ctx, text=text)

    @commands.command(name="set_suggestion_status", aliases=["set_status"], description="Update the status of a feature request (Staff Only).")
    @commands.has_permissions(manage_guild=True)
    async def set_status(self, ctx: commands.Context, request_id: int = None, status: str = None):
        if request_id is None or status is None:
            await ctx.send(embed=ErrorEmbed(
                description="Missing required arguments.",
                resolution="Usage: `?set_suggestion_status <request_id> <pending|approved|implemented|declined>`"
            ))
            return

        STATUS_MAP = {
            "pending": ("PENDING", f"{Emojis.PENDING} Pending Review"),
            "approved": ("APPROVED", f"{Emojis.APPROVED} Approved / Planned"),
            "planned": ("APPROVED", f"{Emojis.APPROVED} Approved / Planned"),
            "implemented": ("IMPLEMENTED", f"{Emojis.CHECK_YES} Implemented"),
            "done": ("IMPLEMENTED", f"{Emojis.CHECK_YES} Implemented"),
            "declined": ("DECLINED", f"{Emojis.CANCELLED} Cancelled"),
            "rejected": ("DECLINED", f"{Emojis.CANCELLED} Cancelled"),
            "cancelled": ("DECLINED", f"{Emojis.CANCELLED} Cancelled"),
            "canceled": ("DECLINED", f"{Emojis.CANCELLED} Cancelled")
        }
        status_key = status.lower().strip()
        if status_key not in STATUS_MAP:
            valid_statuses = "pending, approved, implemented, declined, cancelled"
            await ctx.send(embed=ErrorEmbed(
                description=f"Invalid status `{status}`.",
                resolution=f"Valid options: `{valid_statuses}`\nUsage: `?set_suggestion_status <id> <status>`"
            ))
            return

        db_status, display_name = STATUS_MAP[status_key]
        req = await db.fetchrow("SELECT * FROM feature_requests WHERE id = $1 AND guild_id = $2", request_id, ctx.guild.id)
        if not req:
            return await ctx.send(embed=ErrorEmbed("Feature request not found."))

        await db.execute("UPDATE feature_requests SET status = $1 WHERE id = $2", db_status, request_id)

        channel = ctx.guild.get_channel(req['channel_id'])
        if channel and req['message_id']:
            try:
                msg = await channel.fetch_message(req['message_id'])
                if msg and msg.embeds:
                    embed = msg.embeds[0]
                    for i, field in enumerate(embed.fields):
                        if "Status" in field.name:
                            embed.set_field_at(i, name=f"{Emojis.LOADING} **Status**", value=f"**{display_name}**", inline=True)
                            break
                    await msg.edit(embed=embed)
            except Exception:
                pass

        await ctx.send(
            embed=SuccessEmbed(f"Feature Request **#{request_id}** status updated to **{display_name}**.")
        )

async def setup(bot: commands.Bot):
    await bot.add_cog(Feedback(bot))
