import discord
from discord.ext import commands
from discord import app_commands
from utils.permissions import has_permission
from utils.ui import SuccessEmbed, ErrorEmbed

class WebhookModal(discord.ui.Modal, title="Post Custom Webhook"):
    webhook_name = discord.ui.TextInput(
        label="Webhook Profile Name",
        style=discord.TextStyle.short,
        placeholder="e.g. SyncInk Guides",
        required=True,
        max_length=80
    )
    
    avatar_url = discord.ui.TextInput(
        label="Avatar URL (Optional)",
        style=discord.TextStyle.short,
        placeholder="https://example.com/image.png",
        required=False
    )
    
    message_content = discord.ui.TextInput(
        label="Message Content (Supports Markdown)",
        style=discord.TextStyle.paragraph,
        placeholder="Type your FAQ or Guide here...",
        required=True,
        max_length=4000
    )

    async def on_submit(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)
        try:
            # Check if a webhook created by the bot already exists in the channel
            webhooks = await interaction.channel.webhooks()
            webhook = next((wh for wh in webhooks if wh.user == interaction.client.user), None)
            
            if not webhook:
                webhook = await interaction.channel.create_webhook(name="SyncInk Webhook")

            kwargs = {
                "content": self.message_content.value,
                "username": self.webhook_name.value
            }
            if self.avatar_url.value:
                kwargs["avatar_url"] = self.avatar_url.value

            await webhook.send(**kwargs)
            await interaction.followup.send(embed=SuccessEmbed("Successfully posted custom webhook message."))
        except discord.Forbidden:
            await interaction.followup.send(embed=ErrorEmbed("I don't have permission to manage webhooks in this channel."))
        except Exception as e:
            await interaction.followup.send(embed=ErrorEmbed(description="Failed to post webhook.", resolution=str(e)))

class WebhookCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="webhook_post", description="Post a custom message using a webhook (useful for FAQs/Guides).")
    @app_commands.default_permissions(administrator=True)
    @has_permission(administrator=True)
    async def webhook_post(self, interaction: discord.Interaction):
        await interaction.response.send_modal(WebhookModal())

async def setup(bot: commands.Bot):
    await bot.add_cog(WebhookCog(bot))
