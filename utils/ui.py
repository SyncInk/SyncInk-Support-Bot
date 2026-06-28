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
        self.title = "<a:approved:1520901996389990440> Action Successful"

class ErrorEmbed(SyncInkEmbed):
    def __init__(self, description: str, resolution: str = "Please contact a server administrator if the issue persists.", **kwargs):
        super().__init__(color=ERROR_COLOR, description=description, **kwargs)
        self.title = "<a:refused:1520901852651323593> Action Required"
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
        self.set_author(name="⏳ Please Wait")

class EmptyStateEmbed(SyncInkEmbed):
    def __init__(self, title: str, description: str, **kwargs):
        super().__init__(color=BRAND_PRIMARY, title=title, description=description, **kwargs)
        self.set_author(name="🔍 Nothing Found")

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
