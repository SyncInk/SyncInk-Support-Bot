import discord
from discord.ext import commands
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed, ErrorEmbed

class ButtonRoleView(discord.ui.View):
    def __init__(self, role_id: int, label: str):
        super().__init__(timeout=None)
        self.role_id = role_id
        
        # Dynamic button
        btn = discord.ui.Button(label=label, style=discord.ButtonStyle.blurple, custom_id=f"role_btn_{role_id}")
        btn.callback = self.button_callback
        self.add_item(btn)

    async def button_callback(self, interaction: discord.Interaction):
        role = interaction.guild.get_role(self.role_id)
        if not role:
            await interaction.response.send_message(embed=ErrorEmbed("This role no longer exists."), ephemeral=True)
            return
            
        if role in interaction.user.roles:
            await interaction.user.remove_roles(role)
            await interaction.response.send_message(embed=SuccessEmbed(f"Removed role {role.name}."), ephemeral=True)
        else:
            await interaction.user.add_roles(role)
            await interaction.response.send_message(embed=SuccessEmbed(f"Added role {role.name}."), ephemeral=True)

class AdminUtilities(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="create_button_role", description="Create a message with a button to toggle a role")
    @app_commands.default_permissions(administrator=True)
    async def create_button_role(self, interaction: discord.Interaction, role: discord.Role, message_text: str, button_label: str = "Get Role"):
        embed = SyncInkEmbed(title="Role Assignment", description=message_text)
        view = ButtonRoleView(role_id=role.id, label=button_label)
        
        await interaction.channel.send(embed=embed, view=view)
        await interaction.response.send_message(embed=SuccessEmbed("Button role created."), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(AdminUtilities(bot))
