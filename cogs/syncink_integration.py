import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, DIVIDER

class SyncInkIntegration(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="status", description="Check the operational status of the SyncInk Ecosystem")
    async def status(self, interaction: discord.Interaction):
        embed = SyncInkEmbed()
        embed.description = (
            f"{DIVIDER}\n"
            f"**SyncInk Platform**\n\n"
            f"🟢 Ticket\n"
            f"*Operational*\n\n"
            f"🟢 Voice\n"
            f"*Operational*\n\n"
            f"🟢 Support\n"
            f"*Operational*\n\n"
            f"{DIVIDER}"
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="products", description="Browse the suite of SyncInk products")
    async def products(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(
            title="SyncInk Products", 
            description="Explore our ecosystem of premium Discord applications and web platforms at [syncink.xyz](https://syncink.xyz)."
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="links", description="View official SyncInk links and resources")
    async def links(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="Official Links")
        embed.description = (
            "• **Website**: [syncink.xyz](https://syncink.xyz)\n"
            "• **Dashboard**: [dash.syncink.xyz](https://dash.syncink.xyz)\n"
            "• **Support**: [discord.gg/syncink](https://discord.gg/syncink)"
        )
        await interaction.response.send_message(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(SyncInkIntegration(bot))
