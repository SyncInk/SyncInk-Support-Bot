import discord
from typing import Optional, Union, Any

# SyncInk Brand Colors
BRAND_PRIMARY = 0x2b2d31  # Modern dark color
BRAND_ACCENT = 0x5865F2   # SyncInk Blurple
SUCCESS_COLOR = 0x57F287  # Green
ERROR_COLOR = 0xED4245    # Red
WARNING_COLOR = 0xFEE75C  # Yellow

class SyncInkEmbed(discord.Embed):
    """Premium Base Embed class for the SyncInk Ecosystem."""
    
    def __init__(self, color: int = BRAND_ACCENT, **kwargs):
        super().__init__(color=color, **kwargs)
        self.timestamp = discord.utils.utcnow()
        self.set_footer(text="SyncInk Platform", icon_url="https://files.catbox.moe/74l9su.png")

class SuccessEmbed(SyncInkEmbed):
    def __init__(self, description: str, **kwargs):
        super().__init__(color=SUCCESS_COLOR, description=description, **kwargs)
        self.title = "<a:approved:1520913982678896670> Action Successful"

class ErrorEmbed(SyncInkEmbed):
    def __init__(self, description: str, resolution: str = "Please contact a server administrator if the issue persists.", **kwargs):
        super().__init__(color=ERROR_COLOR, description=description, **kwargs)
        self.title = "<a:refused:1520914088568295564> Action Required"
        self.add_field(name="How to fix this?", value=f"> {resolution}", inline=False)

class BaseConfirmView(discord.ui.View):
    """A standard confirmation view with Yes/No buttons."""
    def __init__(self, timeout: float = 60.0):
        super().__init__(timeout=timeout)
        self.value: Optional[bool] = None

    @discord.ui.button(label="Confirm", style=discord.ButtonStyle.green, custom_id="confirm_btn")
    async def confirm(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.value = True
        self.stop()
        
    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.red, custom_id="cancel_btn")
    async def cancel(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.value = False
        self.stop()

class LoadingEmbed(SyncInkEmbed):
    def __init__(self, description: str = "Processing request...", **kwargs):
        super().__init__(color=BRAND_ACCENT, description=description, **kwargs)
        self.title = "<a:syncalert:1520914681231839313> Please Wait"

class EmptyStateEmbed(SyncInkEmbed):
    def __init__(self, title: str, description: str, **kwargs):
        super().__init__(color=BRAND_PRIMARY, description=description, **kwargs)
        self.title = f"<a:refused:1520914088568295564> {title}"

class InfoCard(SyncInkEmbed):
    def __init__(self, title: str, description: str, **kwargs):
        super().__init__(color=BRAND_ACCENT, title=title, description=description, **kwargs)

class PaginationView(discord.ui.View):
    """A generic pagination view for embeds."""
    def __init__(self, embeds: list[discord.Embed]):
        super().__init__(timeout=120.0)
        self.embeds = embeds
        self.current_page = 0
        
    async def update_buttons(self, interaction: discord.Interaction):
        for child in self.children:
            if child.custom_id == "prev_btn":
                child.disabled = self.current_page == 0
            elif child.custom_id == "next_btn":
                child.disabled = self.current_page == len(self.embeds) - 1
                
        await interaction.response.edit_message(embed=self.embeds[self.current_page], view=self)

    @discord.ui.button(label="Previous", style=discord.ButtonStyle.secondary, custom_id="prev_btn", disabled=True)
    async def prev_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page -= 1
        await self.update_buttons(interaction)

    @discord.ui.button(label="Next", style=discord.ButtonStyle.secondary, custom_id="next_btn")
    async def next_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page += 1
        await self.update_buttons(interaction)
class JailAppealModal(discord.ui.Modal, title='Jail Appeal'):
    reason = discord.ui.TextInput(
        label='Why should your jail sentence be lifted?',
        style=discord.TextStyle.long,
        placeholder='Please provide a detailed explanation...',
        required=True,
        max_length=1000
    )

    def __init__(self, guild_id: int):
        super().__init__()
        self.guild_id = guild_id

    async def on_submit(self, interaction: discord.Interaction):
        from services.settings_service import SettingsService
        settings = await SettingsService.get_guild_settings(self.guild_id)
        # Check for dedicated appeals channel, fallback to standard moderation log channel
        channel_id = settings.get("log_channel_appeals") or settings.get("log_channel_moderation") or settings.get("log_channel_id")
        
        if not channel_id:
            await interaction.response.send_message("The server has no moderation log channel configured to receive appeals. Please contact an admin directly.", ephemeral=True)
            return
            
        guild = interaction.client.get_guild(self.guild_id)
        if not guild:
            await interaction.response.send_message("Could not find the server. It might be unavailable.", ephemeral=True)
            return
            
        channel = guild.get_channel(channel_id)
        if channel:
            embed = SyncInkEmbed(title="New Jail Appeal", color=WARNING_COLOR)
            embed.set_author(name=f"{interaction.user} ({interaction.user.id})", icon_url=interaction.user.display_avatar.url)
            embed.add_field(name="Reason", value=self.reason.value, inline=False)
            
            # Simple accept/deny buttons for the staff in the log channel
            class AppealActionView(discord.ui.View):
                def __init__(self, user_id: int):
                    super().__init__(timeout=None)
                    self.user_id = user_id
                    
                @discord.ui.button(label="Accept & Unjail", style=discord.ButtonStyle.green, custom_id=f"appeal_accept_{user_id}")
                async def accept(self, btn_interaction: discord.Interaction, button: discord.ui.Button):
                    from services.automod_service import AutomodService
                    guild = btn_interaction.guild
                    member = guild.get_member(self.user_id)
                    if not member:
                        await btn_interaction.response.send_message("Member is no longer in the server.", ephemeral=True)
                        return
                    try:
                        await AutomodService.unjail_user(guild, member, btn_interaction.user, "Appeal Accepted")
                        await btn_interaction.response.send_message("User unjailed successfully.", ephemeral=True)
                        for child in self.children:
                            child.disabled = True
                        await btn_interaction.message.edit(view=self)
                    except Exception as e:
                        await btn_interaction.response.send_message(f"Error unjailing: {e}", ephemeral=True)

                @discord.ui.button(label="Deny", style=discord.ButtonStyle.red, custom_id=f"appeal_deny_{user_id}")
                async def deny(self, btn_interaction: discord.Interaction, button: discord.ui.Button):
                    await btn_interaction.response.send_message("Appeal denied.", ephemeral=True)
                    for child in self.children:
                        child.disabled = True
                    await btn_interaction.message.edit(view=self)
            
            await channel.send(embed=embed, view=AppealActionView(interaction.user.id))
            await interaction.response.send_message("Your appeal has been submitted to the moderation team.", ephemeral=True)
        else:
            await interaction.response.send_message("Could not find the moderation channel.", ephemeral=True)

class JailAppealView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        
    @discord.ui.button(label="Submit Appeal", style=discord.ButtonStyle.primary, custom_id="jail_appeal_btn")
    async def appeal_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            footer_text = interaction.message.embeds[0].footer.text
            guild_id = int(footer_text.split("Server ID: ")[1].strip())
            await interaction.response.send_modal(JailAppealModal(guild_id))
        except Exception as e:
            from utils.logger import log
            log.error(f"Error parsing guild_id for appeal: {e}")
            await interaction.response.send_message("Could not verify server context. Please contact an admin.", ephemeral=True)
