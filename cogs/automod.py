import discord
from discord.ext import commands, tasks
from discord import app_commands
from services.automod_service import AutomodService
from services.settings_service import SettingsService
from utils.permissions import has_permission
from utils.logger import log
import re
from datetime import datetime, timedelta

class Automod(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.message_cache = {} # {user_id: [ (msg_content, timestamp), ... ]}
        
        # Start background tasks
        self.point_decay_loop.start()
        self.timed_jail_loop.start()

    def cog_unload(self):
        self.point_decay_loop.cancel()
        self.timed_jail_loop.cancel()

    @tasks.loop(minutes=30)
    async def point_decay_loop(self):
        try:
            await AutomodService.point_decay_task()
        except Exception as e:
            log.error(f"Point decay task failed: {e}")

    @point_decay_loop.before_loop
    async def before_point_decay(self):
        await self.bot.wait_until_ready()

    @tasks.loop(minutes=1)
    async def timed_jail_loop(self):
        try:
            await AutomodService.check_timed_jails(self.bot)
        except Exception as e:
            log.error(f"Timed jail loop failed: {e}")

    @timed_jail_loop.before_loop
    async def before_timed_jail(self):
        await self.bot.wait_until_ready()

    async def check_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        settings = await SettingsService.get_guild_settings(message.guild.id)
        if not settings.get('automod_enabled'):
            return

        # Check ignored roles/channels (Assuming we load this from DB, but for now we skip staff)
        if message.author.guild_permissions.manage_messages:
            return

        content = message.content
        
        # 1. Spam Detection
        now = datetime.utcnow()
        user_cache = self.message_cache.setdefault(message.author.id, [])
        user_cache.append((content, now))
        
        # Prune cache > 10 seconds old
        self.message_cache[message.author.id] = [m for m in user_cache if now - m[1] < timedelta(seconds=10)]
        recent_msgs = self.message_cache[message.author.id]
        
        spam_threshold = settings.get('spam_threshold', 5)
        if len(recent_msgs) >= spam_threshold:
            self.message_cache[message.author.id] = [] # Reset
            await message.delete()
            await AutomodService.add_violation(self.bot, message.guild, message.author, 3, "Message spam (Rapid messaging)", "Spam Filter", content, message.jump_url)
            return

        # Duplicate detection (same content repeated)
        duplicates = [m for m in recent_msgs if m[0] == content]
        if len(duplicates) >= 3:
            self.message_cache[message.author.id] = []
            await message.delete()
            await AutomodService.add_violation(self.bot, message.guild, message.author, 4, "Duplicate message spam", "Spam Filter", content, message.jump_url)
            return

        # 2. Mention Spam
        mention_threshold = settings.get('mention_threshold', 5)
        if len(message.mentions) >= mention_threshold or message.mention_everyone:
            await message.delete()
            await AutomodService.add_violation(self.bot, message.guild, message.author, 8, "Mass mention spam", "Mention Filter", content, message.jump_url)
            return

        # 3. Discord Invites
        if re.search(r'(discord\.gg/|discordapp\.com/invite/)', content, re.IGNORECASE):
            await message.delete()
            await AutomodService.add_violation(self.bot, message.guild, message.author, 5, "Posted unauthorized Discord invite", "Link Filter", content, message.jump_url)
            return

        # 4. Caps Spam
        if len(content) > 15:
            upper_count = sum(1 for c in content if c.isupper())
            if upper_count / len(content) > 0.7:
                await message.delete()
                await AutomodService.add_violation(self.bot, message.guild, message.author, 2, "Excessive capitalization", "Formatting Filter", content, message.jump_url)
                return

        # 5. DB Blacklist & Scam checks (Assume we fetch blacklist from DB in reality, simulated here)
        from database import db
        blacklisted = await db.fetch("SELECT pattern, points, match_type FROM automod_blacklist WHERE guild_id = $1", message.guild.id)
        for row in blacklisted:
            pattern = row['pattern']
            match_type = row['match_type']
            pts = row['points']
            
            matched = False
            if match_type == 'exact' and pattern.lower() == content.lower():
                matched = True
            elif match_type == 'contains' and pattern.lower() in content.lower():
                matched = True
            elif match_type == 'regex':
                try:
                    if re.search(pattern, content, re.IGNORECASE):
                        matched = True
                except:
                    pass
            
            if matched:
                await message.delete()
                await AutomodService.add_violation(self.bot, message.guild, message.author, pts, f"Triggered blacklist filter: {pattern}", "Content Filter", content, message.jump_url)
                return


    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        await self.check_message(message)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.content != after.content:
            await self.check_message(after)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        settings = await SettingsService.get_guild_settings(member.guild.id)
        if not settings.get('automod_enabled') or not settings.get('emergency_mode'):
            return

        # Anti-Raid Emergency Mode Action
        age_days = (datetime.utcnow() - member.created_at.replace(tzinfo=None)).days
        if age_days < 7:
            await member.kick(reason="Anti-Raid Emergency Mode: Account too new.")
            log.warning(f"Kicked {member.id} via Anti-Raid Mode.")

    @app_commands.command(name="jail", description="Manually jail a user, restricting their server access.")
    @app_commands.default_permissions(moderate_members=True)
    @has_permission(moderate_members=True)
    async def jail(self, interaction: discord.Interaction, member: discord.Member, reason: str, duration_mins: int = None):
        try:
            await AutomodService.jail_user(interaction.guild, member, interaction.user, reason, duration_mins)
            from utils.ui import SuccessEmbed
            await interaction.response.send_message(embed=SuccessEmbed(f"Successfully jailed {member.mention}."), ephemeral=True)
        except Exception as e:
            from utils.ui import ErrorEmbed
            await interaction.response.send_message(embed=ErrorEmbed(description="Failed to jail member.", resolution=str(e)), ephemeral=True)

    @app_commands.command(name="unjail", description="Release a user from jail and restore their roles.")
    @app_commands.default_permissions(moderate_members=True)
    @has_permission(moderate_members=True)
    async def unjail(self, interaction: discord.Interaction, member: discord.Member, reason: str):
        try:
            await AutomodService.unjail_user(interaction.guild, member, interaction.user, reason)
            from utils.ui import SuccessEmbed
            await interaction.response.send_message(embed=SuccessEmbed(f"Successfully unjailed {member.mention}."), ephemeral=True)
        except Exception as e:
            from utils.ui import ErrorEmbed
            await interaction.response.send_message(embed=ErrorEmbed(description="Failed to unjail member.", resolution=str(e)), ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(Automod(bot))
