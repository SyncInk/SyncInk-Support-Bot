import discord
from typing import Optional, Union, Any

# SyncInk Brand Colors
BRAND_PRIMARY = 0x2b2d31  # Modern dark color (similar to Discord dark mode background)
BRAND_ACCENT = 0x5865F2   # Blurple accent
SUCCESS_COLOR = 0x57F287  # Green
ERROR_COLOR = 0xED4245    # Red
WARNING_COLOR = 0xFEE75C  # Yellow

class SyncInkEmbed(discord.Embed):
    """Base Embed class for SyncInk. Ensures consistent branding across all messages."""
    
    def __init__(self, color: int = BRAND_ACCENT, **kwargs):
        super().__init__(color=color, **kwargs)
        self.timestamp = discord.utils.utcnow()
        self.set_footer(text="SyncInk Support", icon_url="https://syncink.xyz/assets/logo.png") # Placeholder URL

class SuccessEmbed(SyncInkEmbed):
    def __init__(self, description: str, **kwargs):
        super().__init__(color=SUCCESS_COLOR, description=f"✅ {description}", **kwargs)

class ErrorEmbed(SyncInkEmbed):
    def __init__(self, description: str, **kwargs):
        super().__init__(color=ERROR_COLOR, description=f"❌ {description}", **kwargs)

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
    def __init__(self, description: str = "Loading, please wait...", **kwargs):
        super().__init__(color=BRAND_ACCENT, description=f"🔄 {description}", **kwargs)

class EmptyStateEmbed(SyncInkEmbed):
    def __init__(self, title: str, description: str, **kwargs):
        super().__init__(color=BRAND_PRIMARY, title=f"📭 {title}", description=description, **kwargs)

class InfoCard(SyncInkEmbed):
    def __init__(self, title: str, description: str, **kwargs):
        super().__init__(color=BRAND_ACCENT, title=f"ℹ️ {title}", description=description, **kwargs)

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

    @discord.ui.button(label="◀️ Previous", style=discord.ButtonStyle.secondary, custom_id="prev_btn", disabled=True)
    async def prev_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page -= 1
        await self.update_buttons(interaction)

    @discord.ui.button(label="Next ▶️", style=discord.ButtonStyle.secondary, custom_id="next_btn")
    async def next_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.current_page += 1
        await self.update_buttons(interaction)
