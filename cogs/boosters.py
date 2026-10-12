import discord
from discord.ext import commands
from discord import app_commands
import aiohttp
import asyncio
import time
from typing import Optional
from utils.logger import log
from utils.ui import SuccessEmbed, ErrorEmbed

TARGET_GUILD_ID = 1520457643842342912
BOOSTER_CHANNEL_ID = 1558585414829211668
VIP_CHAT_CHANNEL_ID = 1558589470469525504
BOOSTER_ROLE_ID = 1558584451724738640
MUSIC_COMMAND_CHANNEL_ID = 1520749466330857492
OWNER_ROLE_ID = 1520856232460550194
MANAGER_ROLE_ID = 1520854378192572546

def is_owner_or_higher_admin(member: discord.Member) -> bool:
    """Verifies that the member is the server owner, an administrator, or holds higher leadership roles."""
    if not member or not hasattr(member, "guild") or not member.guild:
        return False
    if member.id == member.guild.owner_id:
        return True
    if getattr(member.guild_permissions, "administrator", False):
        return True
    higher_roles = {OWNER_ROLE_ID, MANAGER_ROLE_ID}
    return any(r.id in higher_roles for r in member.roles)

WEBHOOK_NAME = "Boosters"
WEBHOOK_AVATAR_URL = "https://cdn3.emoji.gg/emojis/853887-serverboost.png"

# Official & Interactive Emojis
EMOJI_BOOSTER = "<:booster:1558595630660714616>"
EMOJI_NEON_HEART = "<:neonheart:1558594319227813949>"
EMOJI_HEART_POP = "<a:heartpop:1558594180937424896>"
EMOJI_SCRIBBLE_HEART = "<a:scribbleheart:1558596661087969300>"
EMOJI_ARROW = "<a:arrow:1558799019927543878>"
EMOJI_PURPLE_HEART_EXCLAIM = "<a:purpleheartexclaim:1558799132871757844>"
EMOJI_S_ARROW = "<:s_arrow:1558799699102793801>"
EMOJI_TIME = "<:time:1558804154963468288>"

class Boosters(commands.Cog):
    """Automated Server Booster Celebration, Webhook Dispatcher & Role Handler."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        # Member ID -> timestamp of last processed boost (deduplication cache)
        self._recent_boosts: dict[int, float] = {}

    async def get_or_create_webhook(self, channel: discord.TextChannel) -> Optional[discord.Webhook]:
        """Finds or creates the dedicated Boosters webhook in the target channel."""
        try:
            webhooks = await channel.webhooks()
            # Match existing webhook created by bot or named Boosters
            for wh in webhooks:
                if wh.name.lower() == WEBHOOK_NAME.lower() or (wh.user and wh.user.id == channel.guild.me.id):
                    return wh

            # Fetch avatar bytes to create webhook with the custom pfp
            avatar_bytes = None
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(WEBHOOK_AVATAR_URL) as resp:
                        if resp.status == 200:
                            avatar_bytes = await resp.read()
            except Exception as e:
                log.warning(f"Could not download booster webhook pfp: {e}")

            webhook = await channel.create_webhook(
                name=WEBHOOK_NAME,
                avatar=avatar_bytes,
                reason="SyncInk Boosters: Automatic booster announcement webhook"
            )
            log.info(f"Created dedicated Boosters webhook in #{channel.name} ({channel.id})")
            return webhook
        except discord.Forbidden:
            log.error(f"Missing permissions to manage webhooks in #{channel.name} ({channel.id})")
            return None
        except Exception as e:
            log.error(f"Error resolving booster webhook in #{channel.name}: {e}")
            return None

    async def assign_booster_role(self, member: discord.Member) -> bool:
        """Assigns the booster role to the member if not already present."""
        role = member.guild.get_role(BOOSTER_ROLE_ID)
        if not role:
            log.warning(f"Booster role {BOOSTER_ROLE_ID} was not found in guild {member.guild.name} ({member.guild.id})")
            return False

        if role not in member.roles:
            try:
                await member.add_roles(role, reason="SyncInk Booster Perks: Automated booster role assignment")
                log.info(f"Assigned booster role {role.name} to {member.name} ({member.id})")
                return True
            except discord.Forbidden:
                log.error(f"Permission denied: cannot assign role {role.name} to {member.name}")
                return False
            except Exception as e:
                log.error(f"Failed to assign booster role to {member.name}: {e}")
                return False
        return True

    def build_booster_announcement(self, member: discord.Member) -> tuple[str, discord.Embed]:
        """Generates the styled booster greeting message and embed."""
        # Clean mention text above embed matching user's requested layout
        content = f"{EMOJI_HEART_POP} {member.mention}, read <#{BOOSTER_CHANNEL_ID}> to learn more."

        embed = discord.Embed(
            description=(
                f"{EMOJI_PURPLE_HEART_EXCLAIM} **Huge thank you to {member.mention} for boosting SyncInk Support!**\n"
                f"You're absolute royalty in our server! Your support helps keep our infrastructure powered and our community thriving! {EMOJI_NEON_HEART}\n\n"
                f"**Exclusive Booster Perks:**\n"
                f"{EMOJI_ARROW} **VIP Support Chat:** Head over to <#{VIP_CHAT_CHANNEL_ID}> for exclusive VIP chat & direct developer assistance.\n"
                f"{EMOJI_ARROW} **Exclusive Music & Radio:** Stream high-fidelity music & 240+ countries live radio via `/play` and `/radio` in <#{MUSIC_COMMAND_CHANNEL_ID}>!\n"
                f"{EMOJI_ARROW} **Media & Upload Privileges:** Enjoy unrestricted permission to upload media, images, video clips, and attachments.\n"
                f"{EMOJI_ARROW} **Priority Ticket Support:** Inquired faster & kept on main priority.\n"
                f"{EMOJI_ARROW} **Booster Badge & Role:** Equipped with the {EMOJI_BOOSTER} <@&{BOOSTER_ROLE_ID}> role!\n\n"
                f"-# all tickets created will be resolved if no rush but for boosters it will be on main priority {EMOJI_SCRIBBLE_HEART}"
            ),
            color=0xF47FFF,  # Discord Nitro Pink
            timestamp=discord.utils.utcnow()
        )

        # Set user avatar as thumbnail
        avatar_url = member.display_avatar.with_size(512).url
        embed.set_thumbnail(url=avatar_url)

        # Footer with scribble heart and server booster icon
        embed.set_footer(
            text="Enjoy your new perks! • SyncInk Support Boosters",
            icon_url=WEBHOOK_AVATAR_URL
        )

        return content, embed

    async def announce_boost(self, member: discord.Member, is_test: bool = False) -> tuple[bool, str]:
        """Handles full booster pipeline: role assignment + webhook announcement."""
        now = time.time()
        # Cooldown deduplication (60 seconds) unless it is a manual test
        if not is_test:
            last_boost = self._recent_boosts.get(member.id, 0)
            if now - last_boost < 60:
                log.info(f"Skipping duplicate booster event for {member.name} ({member.id}) within cooldown.")
                return False, "Duplicate booster event within 60s cooldown."
            self._recent_boosts[member.id] = now

        guild = member.guild
        channel = guild.get_channel(BOOSTER_CHANNEL_ID)
        if not channel or not isinstance(channel, discord.TextChannel):
            err_msg = f"Booster channel {BOOSTER_CHANNEL_ID} not found or is not a text channel."
            log.error(err_msg)
            return False, err_msg

        # 1. Assign booster role
        await self.assign_booster_role(member)

        # 2. Get or create webhook
        webhook = await self.get_or_create_webhook(channel)
        content, embed = self.build_booster_announcement(member)

        if webhook:
            try:
                sent_msg = await webhook.send(
                    content=content,
                    embed=embed,
                    username=WEBHOOK_NAME,
                    avatar_url=WEBHOOK_AVATAR_URL,
                    wait=True
                )
                log.info(f"Dispatched booster webhook announcement for {member.name} in #{channel.name}")
                if sent_msg:
                    try:
                        await sent_msg.add_reaction(EMOJI_SCRIBBLE_HEART)
                    except Exception as react_e:
                        log.warning(f"Could not react to booster webhook message: {react_e}")
                return True, f"Successfully posted via Boosters webhook in {channel.mention}."
            except Exception as e:
                log.error(f"Failed to dispatch booster webhook: {e}")
                # Fallback to normal bot message if webhook fails
                try:
                    sent_msg = await channel.send(content=content, embed=embed)
                    try:
                        await sent_msg.add_reaction(EMOJI_SCRIBBLE_HEART)
                    except Exception:
                        pass
                    return True, f"Webhook failed; posted as bot fallback in {channel.mention}."
                except Exception as inner_e:
                    return False, f"Failed to post announcement: {inner_e}"
        else:
            # Fallback to channel send
            try:
                sent_msg = await channel.send(content=content, embed=embed)
                try:
                    await sent_msg.add_reaction(EMOJI_SCRIBBLE_HEART)
                except Exception:
                    pass
                return True, f"Posted announcement directly in {channel.mention}."
            except Exception as e:
                return False, f"Failed to post announcement: {e}"

    # ==========================================
    # EVENT LISTENERS
    # ==========================================

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        """Detects when a member boosts the server."""
        if after.guild.id != TARGET_GUILD_ID:
            return

        # Check if member just boosted
        was_booster = before.premium_since is not None
        is_booster = after.premium_since is not None

        if not was_booster and is_booster:
            log.info(f"Detected new server boost from {after.name} ({after.id}) via member_update!")
            await self.announce_boost(after)

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        """Detects official Discord booster system messages."""
        if not message.guild or message.guild.id != TARGET_GUILD_ID:
            return

        # Discord system boost message types
        booster_types = (
            discord.MessageType.premium_guild_subscription,
            discord.MessageType.premium_guild_tier_1,
            discord.MessageType.premium_guild_tier_2,
            discord.MessageType.premium_guild_tier_3,
        )

        if message.type in booster_types and isinstance(message.author, discord.Member):
            log.info(f"Detected server boost message ({message.type}) from {message.author.name}!")
            await self.announce_boost(message.author)

    # ==========================================
    # TEST COMMANDS (Testable without boosting)
    # ==========================================

    @commands.command(
        name="testboost",
        aliases=["simulateboost", "boosttest", "testwebhook", "test_webhook"],
        description="[Owner & Higher Admin Only] Simulate a server boost announcement and webhook dispatch."
    )
    async def testboost_cmd(self, ctx: commands.Context, member: Optional[discord.Member] = None):
        """Prefix command to test booster webhook announcement and role assignment."""
        # Cleanly delete trigger command message
        try:
            await ctx.message.delete()
        except Exception:
            pass

        # Check Owner & Higher Administrator permissions
        is_bot_owner = await ctx.bot.is_owner(ctx.author)
        if not is_bot_owner and not is_owner_or_higher_admin(ctx.author):
            embed = ErrorEmbed(
                description="### <a:syncwarning:1547034231438319616> Access Denied",
                resolution="This command is strictly restricted to Server Owners and Higher Administrators."
            )
            await ctx.send(embed=embed, delete_after=6)
            return

        if ctx.guild.id != TARGET_GUILD_ID:
            await ctx.send(
                embed=ErrorEmbed(
                    description=f"This booster system is configured for Guild ID `{TARGET_GUILD_ID}`.",
                    resolution="Please run this command inside the official SyncInk Support server."
                ),
                delete_after=6
            )
            return

        target = member or ctx.author
        success, details = await self.announce_boost(target, is_test=True)

        if success:
            await ctx.send(
                embed=SuccessEmbed(
                    f"**Booster Webhook Test Complete!** {EMOJI_HEART_POP}\n\n"
                    f"{EMOJI_S_ARROW} **Target Member:** {target.mention} (`{target.id}`)\n"
                    f"{EMOJI_S_ARROW} **Assigned Role:** <@&{BOOSTER_ROLE_ID}> (`{BOOSTER_ROLE_ID}`)\n"
                    f"{EMOJI_S_ARROW} **Announcement Channel:** <#{BOOSTER_CHANNEL_ID}>\n"
                    f"{EMOJI_S_ARROW} **Status:** {details}\n\n"
                    f"-# This confirmation message will self-delete in 6 seconds."
                ),
                delete_after=6
            )
        else:
            await ctx.send(
                embed=ErrorEmbed(
                    description=f"Failed to test booster webhook for {target.mention}.",
                    resolution=details
                ),
                delete_after=8
            )

async def setup(bot: commands.Bot):
    await bot.add_cog(Boosters(bot))
