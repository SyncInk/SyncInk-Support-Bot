import discord
from discord.ext import commands
from services.settings_service import SettingsService
from utils.ui import SyncInkEmbed
from utils.logger import log
from utils.i18n import i18n

class Members(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        settings = await SettingsService.get_guild_settings(member.guild.id)

        # Handle Auto-Role
        if settings.get('autorole_id'):
            role = member.guild.get_role(settings['autorole_id'])
            if role:
                try:
                    await member.add_roles(role, reason="Auto-role on join")
                except discord.Forbidden:
                    log.warning(f"Missing permissions to assign autorole in {member.guild.name}")

        # Handle Welcome Message
        if settings.get('welcome_channel_id'):
            channel = member.guild.get_channel(settings['welcome_channel_id'])
            if channel:
                embed = SyncInkEmbed(
                    title=i18n.get("welcome_message_title"),
                    description=i18n.get("welcome_message_desc", user=member.mention)
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                try:
                    await channel.send(content=member.mention, embed=embed)
                except discord.Forbidden:
                    log.warning(f"Missing permissions to send welcome message in {channel.name}")

async def setup(bot: commands.Bot):
    await bot.add_cog(Members(bot))
