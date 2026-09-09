import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed
from utils.emojis import Emojis

class SyncInkIntegration(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="status", description="Check the operational status of the SyncInk Ecosystem.")
    async def status(self, ctx: commands.Context):
        embed = SyncInkEmbed(title=f"{Emojis.LOGO} System Status")
        embed.set_author(name="SyncInk Platform", icon_url="https://cdn.discordapp.com/emojis/1547034265076760707.png")
        embed.description = "All core systems are currently online and functioning normally."
        
        embed.add_field(name=f"{Emojis.APPROVED} Ticket System", value="Operational", inline=True)
        embed.add_field(name=f"{Emojis.APPROVED} Voice Services", value="Operational", inline=True)
        embed.add_field(name=f"{Emojis.APPROVED} Support Hub", value="Operational", inline=True)
        
        await ctx.send(embed=embed)

    @commands.command(name="products", description="Browse the suite of SyncInk products and services.")
    async def products(self, ctx: commands.Context):
        embed = SyncInkEmbed(title=f"{Emojis.SETTINGS} Our Products")
        embed.description = "Explore our ecosystem of premium Discord applications and web platforms."
        embed.set_thumbnail(url="https://syncink.xyz/assets/products_icon.png")
        
        embed.add_field(name="SyncInk Studio", value="Professional bot hosting and management.", inline=False)
        embed.add_field(name="SyncInk Support", value="Advanced community moderation platform.", inline=False)
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="View All Products", style=discord.ButtonStyle.link, url="https://syncink.xyz"))
        
        await ctx.send(embed=embed, view=view)

    @commands.command(name="links", description="View official SyncInk platform links.")
    async def links(self, ctx: commands.Context):
        embed = SyncInkEmbed(title=f"{Emojis.LOOKING} Official Resources")
        embed.description = "Quick access to the SyncInk ecosystem."
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label="Website", style=discord.ButtonStyle.link, url="https://syncink.xyz"))
        view.add_item(discord.ui.Button(label="Dashboard", style=discord.ButtonStyle.link, url="https://dash.syncink.xyz"))
        view.add_item(discord.ui.Button(label="Community", style=discord.ButtonStyle.link, url="https://discord.gg/syncink"))
        
        await ctx.send(embed=embed, view=view)

async def setup(bot: commands.Bot):
    await bot.add_cog(SyncInkIntegration(bot))
