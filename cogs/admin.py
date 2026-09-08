import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed
from utils.permissions import has_permission

class Admin(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command(name="create_button_role", description="Generate a persistent role-toggle button.")
    @commands.has_permissions(administrator=True)
    async def create_button_role(self, ctx: commands.Context, role: discord.Role, *, message: str = "Click the button below to toggle role:"):
        embed = SyncInkEmbed(title="Role Selection")
        embed.set_author(name="Assign Roles", icon_url="https://syncink.xyz/assets/logo.png")
        embed.description = message
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label=role.name, style=discord.ButtonStyle.primary, custom_id=f"toggle_role_{role.id}"))
        
        await ctx.channel.send(embed=embed, view=view)
        await ctx.send(embed=SuccessEmbed("Interactive role panel successfully created."))

async def setup(bot: commands.Bot):
    await bot.add_cog(Admin(bot))
