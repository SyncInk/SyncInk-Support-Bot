import discord
from discord.ext import commands
from discord import app_commands
from database import db
from utils.permissions import has_permission
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed, TicketPanelView
from services.ticket_service import TicketService

class Tickets(commands.GroupCog, name="ticket"):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="setup", description="Deploy a professional ticket panel to a channel.")
    @app_commands.describe(channel="The channel to deploy the panel in.", title="Title of the panel", description="Description of the panel")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def ticketsetup(self, interaction: discord.Interaction, channel: discord.TextChannel = None, title: str = "Support Tickets", description: str = "Click the button below to open a secure ticket."):
        target_channel = channel or interaction.channel
        
        embed = SyncInkEmbed(
            title=title,
            description=description
        )
        
        try:
            msg = await target_channel.send(embed=embed, view=TicketPanelView())
            await db.execute(
                "INSERT INTO ticket_panels (guild_id, channel_id, message_id, title, description) VALUES ($1, $2, $3, $4, $5)",
                interaction.guild.id, target_channel.id, msg.id, title, description
            )
            await interaction.response.send_message(embed=SuccessEmbed(f"Ticket panel successfully deployed to {target_channel.mention}."), ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(embed=ErrorEmbed(f"Failed to deploy panel: {e}"), ephemeral=True)

    @app_commands.command(name="add", description="Add a user to the current ticket.")
    @app_commands.describe(user="The user to add.")
    async def ticket_add(self, interaction: discord.Interaction, user: discord.Member):
        ticket = await db.fetchrow("SELECT id FROM tickets WHERE channel_id = $1 AND status = 'OPEN'", interaction.channel.id)
        if not ticket:
            await interaction.response.send_message(embed=ErrorEmbed("This command can only be used inside an active ticket channel."), ephemeral=True)
            return
            
        await interaction.channel.set_permissions(user, read_messages=True, send_messages=True, attach_files=True)
        await interaction.response.send_message(embed=SuccessEmbed(f"{user.mention} has been added to the ticket."))

    @app_commands.command(name="remove", description="Remove a user from the current ticket.")
    @app_commands.describe(user="The user to remove.")
    async def ticket_remove(self, interaction: discord.Interaction, user: discord.Member):
        ticket = await db.fetchrow("SELECT id FROM tickets WHERE channel_id = $1 AND status = 'OPEN'", interaction.channel.id)
        if not ticket:
            await interaction.response.send_message(embed=ErrorEmbed("This command can only be used inside an active ticket channel."), ephemeral=True)
            return
            
        await interaction.channel.set_permissions(user, overwrite=None)
        await interaction.response.send_message(embed=SuccessEmbed(f"{user.mention} has been removed from the ticket."))

    @app_commands.command(name="close", description="Close the current ticket and generate a transcript.")
    async def ticket_close(self, interaction: discord.Interaction, reason: str = None):
        await interaction.response.defer()
        await TicketService.close_ticket(interaction, reason)

async def setup(bot: commands.Bot):
    await bot.add_cog(Tickets(bot))
