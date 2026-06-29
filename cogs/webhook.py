import discord
from discord.ext import commands
from discord import app_commands
from utils.permissions import has_permission
from utils.ui import SuccessEmbed, ErrorEmbed

def split_message(content: str, max_length: int = 1950) -> list[str]:
    """
    Splits a long string into chunks of max_length, attempting to preserve Markdown 
    by breaking on lines and managing code block state.
    """
    chunks = []
    lines = content.split('\n')
    current_chunk = ""
    in_code_block = False

    for line in lines:
        # Toggle code block state if ``` is present
        if "```" in line:
            in_code_block = (in_code_block != (line.count("```") % 2 != 0))
        
        # Fallback: if a single line is absurdly long, we must split it by characters.
        if len(line) > max_length:
            if current_chunk.strip():
                if in_code_block:
                    current_chunk += "\n```"
                chunks.append(current_chunk.strip())
                current_chunk = "```\n" if in_code_block else ""
                
            for i in range(0, len(line), max_length):
                chunks.append(line[i:i+max_length])
            continue
            
        if len(current_chunk) + len(line) + 1 > max_length:
            # Finalize the current chunk and prepare the next
            if in_code_block:
                current_chunk += "\n```"
                chunks.append(current_chunk.strip())
                current_chunk = "```\n" + line + "\n"
            else:
                chunks.append(current_chunk.strip())
                current_chunk = line + "\n"
        else:
            current_chunk += line + "\n"
            
    if current_chunk.strip():
        if in_code_block and not current_chunk.strip().endswith('```'):
            current_chunk += "\n```"
        chunks.append(current_chunk.strip())
        
    return chunks

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
        # Defers the interaction to show a loading state while processing and posting
        await interaction.response.defer(ephemeral=True)
        try:
            # Check if a webhook created by the bot already exists in the channel
            webhooks = await interaction.channel.webhooks()
            webhook = next((wh for wh in webhooks if wh.user == interaction.client.user), None)
            
            if not webhook:
                webhook = await interaction.channel.create_webhook(name="SyncInk Webhook")

            kwargs = {
                "username": self.webhook_name.value
            }
            if self.avatar_url.value:
                kwargs["avatar_url"] = self.avatar_url.value

            # Split the message into chunks if it exceeds Discord's limits
            chunks = split_message(self.message_content.value)
            
            # Send the parts sequentially
            for i, chunk in enumerate(chunks):
                kwargs["content"] = chunk
                try:
                    await webhook.send(**kwargs)
                except Exception as e:
                    # If one part fails, explicitly tell the user which part failed
                    await interaction.followup.send(embed=ErrorEmbed(description=f"Failed to post part {i+1} out of {len(chunks)}.", resolution=str(e)))
                    return
            
            plural = "message" if len(chunks) == 1 else "messages"
            await interaction.followup.send(embed=SuccessEmbed(f"Successfully posted custom webhook across {len(chunks)} {plural}."))
        except discord.Forbidden:
            await interaction.followup.send(embed=ErrorEmbed("I don't have permission to manage webhooks in this channel."))
        except Exception as e:
            await interaction.followup.send(embed=ErrorEmbed(description="Failed to prepare webhook.", resolution=str(e)))

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
