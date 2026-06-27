import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed

class SyncInkIntegration(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="status", description="Check the status of SyncInk services")
    async def status(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="🌐 SyncInk Service Status")
        embed.description = "Current operational status of our infrastructure."
        
        # Placeholders for actual API status checks
        embed.add_field(name="Ticket Bot", value="✅ Online", inline=True)
        embed.add_field(name="Voice Bot", value="✅ Online", inline=True)
        embed.add_field(name="Dashboard", value="✅ Online", inline=True)
        embed.add_field(name="API Core", value="✅ Online", inline=True)
        embed.add_field(name="Database", value="✅ Healthy", inline=True)
        
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="products", description="View all SyncInk products")
    async def products(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="📦 SyncInk Products")
        embed.description = (
            "**1. SyncInk Main Bot**\nPowering your server with automation.\n\n"
            "**2. SyncInk Ticket**\nAdvanced support ticket management.\n\n"
            "**3. SyncInk Voice**\nDynamic temporary voice channels."
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="links", description="Get important SyncInk links")
    async def links(self, interaction: discord.Interaction):
        embed = SyncInkEmbed(title="🔗 SyncInk Links")
        embed.description = (
            "[Documentation](https://docs.syncink.xyz)\n"
            "[Dashboard](https://dash.syncink.xyz)\n"
            "[Invite Main Bot](https://syncink.xyz/invite)\n"
            "[Invite Ticket Bot](https://syncink.xyz/invite-ticket)"
        )
        await interaction.response.send_message(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(SyncInkIntegration(bot))
