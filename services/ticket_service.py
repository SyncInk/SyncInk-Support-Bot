import discord
import chat_exporter
import io
from database import db
from services.settings_service import SettingsService
from utils.logger import log
from utils.ui import SuccessEmbed, ErrorEmbed

class TicketService:
    @staticmethod
    async def create_ticket(interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        guild = interaction.guild
        user = interaction.user
        
        # Check if user already has an open ticket
        existing = await db.fetchrow("SELECT id FROM tickets WHERE guild_id = $1 AND creator_id = $2 AND status = 'OPEN'", guild.id, user.id)
        if existing:
            await interaction.followup.send("You already have an open ticket!", ephemeral=True)
            return

        settings = await SettingsService.get_guild_settings(guild.id)
        category_id = settings.get('ticket_category_id')
        category = guild.get_channel(category_id) if category_id else None

        support_role_id = settings.get('ticket_support_role_id')
        support_role = guild.get_role(support_role_id) if support_role_id else None

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            user: discord.PermissionOverwrite(read_messages=True, send_messages=True, attach_files=True),
            guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True)
        }
        
        if support_role:
            overwrites[support_role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

        try:
            ticket_channel = await guild.create_text_channel(
                name=f"ticket-{user.name}",
                category=category,
                overwrites=overwrites,
                reason="Ticket opened"
            )
            
            await db.execute(
                "INSERT INTO tickets (guild_id, channel_id, creator_id) VALUES ($1, $2, $3)",
                guild.id, ticket_channel.id, user.id
            )

            from utils.ui import TicketActionView, SyncInkEmbed
            embed = SyncInkEmbed(
                title="Support Ticket",
                description=f"Welcome {user.mention}!\n\nPlease describe your issue in detail. A staff member will be with you shortly."
            )
            await ticket_channel.send(f"{user.mention}", embed=embed, view=TicketActionView())
            await interaction.followup.send(f"Ticket created: {ticket_channel.mention}", ephemeral=True)
            
        except Exception as e:
            log.error(f"Error creating ticket: {e}")
            await interaction.followup.send("Failed to create ticket. Please contact an administrator.", ephemeral=True)

    @staticmethod
    async def close_ticket(interaction: discord.Interaction, reason: str):
        guild = interaction.guild
        channel = interaction.channel
        user = interaction.user
        
        ticket_record = await db.fetchrow("SELECT id, creator_id FROM tickets WHERE channel_id = $1 AND status = 'OPEN'", channel.id)
        if not ticket_record:
            await interaction.followup.send("This channel is not an active ticket.", ephemeral=True)
            return
            
        await interaction.followup.send("Closing ticket and generating transcript...", ephemeral=True)
        
        try:
            transcript = await chat_exporter.export(channel, tz_info="UTC")
            transcript_file = discord.File(io.BytesIO(transcript.encode()), filename=f"transcript-{channel.name}.html")
            
            settings = await SettingsService.get_guild_settings(guild.id)
            transcript_channel_id = settings.get('ticket_transcript_channel_id')
            transcript_channel = guild.get_channel(transcript_channel_id) if transcript_channel_id else None
            
            if not transcript_channel:
                transcript_channel = guild.get_channel(settings.get('log_channel_id'))
                
            if transcript_channel:
                creator = guild.get_member(ticket_record['creator_id'])
                creator_text = f"{creator.mention} ({creator.id})" if creator else f"ID: {ticket_record['creator_id']}"
                
                embed = SuccessEmbed(
                    description=f"Ticket **{channel.name}** was closed by {user.mention}."
                )
                embed.add_field(name="Creator", value=creator_text, inline=True)
                embed.add_field(name="Reason", value=reason or "No reason provided", inline=True)
                
                await transcript_channel.send(embed=embed, file=transcript_file)
                
            await db.execute("UPDATE tickets SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = $1", ticket_record['id'])
            await channel.delete(reason=f"Ticket closed by {user}")
            
        except Exception as e:
            log.error(f"Error closing ticket: {e}")
            await interaction.followup.send(f"An error occurred while closing the ticket.", ephemeral=True)
