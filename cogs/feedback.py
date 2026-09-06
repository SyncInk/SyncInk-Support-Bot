import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SuccessEmbed, ErrorEmbed, SyncInkEmbed, BRAND_ACCENT, SUCCESS_COLOR, ERROR_COLOR
from utils.metrics import metrics
from services.settings_service import SettingsService
from database import db
from utils.permissions import has_permission

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

    @discord.ui.button(emoji="<a:approved:1520913982678896670>", label="Upvote (0)", style=discord.ButtonStyle.green, custom_id="vote_up")
    async def upvote(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self._handle_vote(interaction, "UP")

    @discord.ui.button(emoji="<a:refused:1520914088568295564>", label="Downvote (0)", style=discord.ButtonStyle.red, custom_id="vote_down")
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
                        value=f"<a:approved:1520913982678896670> **{self.upvotes}** Upvotes   •   <a:refused:1520914088568295564> **{self.downvotes}** Downvotes", 
                        inline=False
                    )
                    break
            await interaction.response.edit_message(embed=embed, view=self)
        except Exception:
            await interaction.response.edit_message(view=self)

        await interaction.followup.send(resp_msg, ephemeral=True)


class Feedback(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _resolve_suggestion_channel(self, guild: discord.Guild) -> discord.TextChannel:
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

    async def _process_suggestion(self, interaction: discord.Interaction, title: str, description: str):
        metrics.record_suggestion()
        
        target_channel = await self._resolve_suggestion_channel(interaction.guild)
        if not target_channel:
            target_channel = interaction.channel

        # Insert into DB
        row = await db.fetchrow("""
            INSERT INTO feature_requests (guild_id, user_id, channel_id, title, content, status)
            VALUES ($1, $2, $3, $4, $5, 'PENDING')
            RETURNING id
        """, interaction.guild.id, interaction.user.id, target_channel.id, title, description)
        request_id = row['id']

        embed = SyncInkEmbed(
            title=f"💡 **Feature Request #{request_id}: {title}**",
            color=BRAND_ACCENT
        )
        embed.set_author(name=f"{interaction.user.display_name} ({interaction.user})", icon_url=interaction.user.display_avatar.url)
        embed.description = f"```\n{description}\n```"
        embed.add_field(name="👤 **Submitted By**", value=interaction.user.mention, inline=True)
        embed.add_field(name="📊 **Status**", value="🟡 **Pending Review**", inline=True)
        embed.add_field(
            name="🗳️ **Community Votes**", 
            value="<a:approved:1520913982678896670> **0** Upvotes   •   <a:refused:1520914088568295564> **0** Downvotes", 
            inline=False
        )
        embed.set_footer(text=f"SyncInk Platform • Request #{request_id}", icon_url="https://files.catbox.moe/74l9su.png")

        view = SuggestionVoteView(request_id, upvotes=0, downvotes=0)

        try:
            sent_msg = await target_channel.send(embed=embed, view=view)
            await db.execute("UPDATE feature_requests SET message_id = $1 WHERE id = $2", sent_msg.id, request_id)
            
            await interaction.response.send_message(
                embed=SuccessEmbed(f"Your feature request has been successfully posted in {target_channel.mention}!"),
                ephemeral=True
            )
        except discord.Forbidden:
            await interaction.response.send_message(
                embed=ErrorEmbed(description="Failed to post feature request.", resolution="Bot lacks permissions to send messages in the target channel."),
                ephemeral=True
            )

    @app_commands.command(name="suggest", description="Submit a feature request or suggestion for the platform.")
    @app_commands.describe(title="Short title for your request", description="Detailed explanation of the feature or idea")
    async def suggest(self, interaction: discord.Interaction, title: str, description: str):
        await self._process_suggestion(interaction, title, description)

    @app_commands.command(name="feature_request", description="Submit a formal feature request with community voting.")
    @app_commands.describe(title="Short title for your request", description="Detailed explanation of the feature or idea")
    async def feature_request(self, interaction: discord.Interaction, title: str, description: str):
        await self._process_suggestion(interaction, title, description)

    @app_commands.command(name="set_suggestion_status", description="Update the status of a feature request (Staff Only).")
    @app_commands.describe(request_id="The ID of the feature request", status="New status")
    @app_commands.choices(status=[
        app_commands.Choice(name="🟡 Pending Review", value="PENDING"),
        app_commands.Choice(name="🟢 Approved / Planned", value="APPROVED"),
        app_commands.Choice(name="🟣 Implemented", value="IMPLEMENTED"),
        app_commands.Choice(name="🔴 Declined", value="DECLINED")
    ])
    @app_commands.default_permissions(manage_guild=True)
    @has_permission(manage_guild=True)
    async def set_status(self, interaction: discord.Interaction, request_id: int, status: app_commands.Choice[str]):
        req = await db.fetchrow("SELECT * FROM feature_requests WHERE id = $1 AND guild_id = $2", request_id, interaction.guild.id)
        if not req:
            return await interaction.response.send_message(embed=ErrorEmbed("Feature request not found."), ephemeral=True)

        await db.execute("UPDATE feature_requests SET status = $1 WHERE id = $2", status.value, request_id)

        channel = interaction.guild.get_channel(req['channel_id'])
        if channel and req['message_id']:
            try:
                msg = await channel.fetch_message(req['message_id'])
                if msg and msg.embeds:
                    embed = msg.embeds[0]
                    for i, field in enumerate(embed.fields):
                        if "Status" in field.name:
                            embed.set_field_at(i, name="📊 **Status**", value=f"**{status.name}**", inline=True)
                            break
                    await msg.edit(embed=embed)
            except Exception:
                pass

        await interaction.response.send_message(
            embed=SuccessEmbed(f"Feature Request **#{request_id}** status updated to **{status.name}**."),
            ephemeral=True
        )

async def setup(bot: commands.Bot):
    await bot.add_cog(Feedback(bot))
