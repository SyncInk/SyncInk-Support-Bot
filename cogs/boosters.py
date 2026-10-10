import discord
from discord.ext import commands
from discord import app_commands
import aiohttp
import time
from typing import Optional
from utils.logger import log
from utils.ui import SuccessEmbed, ErrorEmbed

TARGET_GUILD_ID = 1520457643842342912
BOOSTER_CHANNEL_ID = 1558585414829211668
VIP_CHAT_CHANNEL_ID = 1558589470469525504
BOOSTER_ROLE_ID = 1558584451724738640

WEBHOOK_NAME = "Boosters"
WEBHOOK_AVATAR_URL = "https://cdn3.emoji.gg/emojis/853887-serverboost.png"

# Official Emojis
EMOJI_BOOSTER = "<:booster:1558595630660714616>"
EMOJI_NEON_HEART = "<:neonheart:1558594319227813949>"
EMOJI_HEART_POP = "<a:heartpop:1558594180937424896>"
EMOJI_SCRIBBLE_HEART = "<a:scribbleheart:1558596661087969300>"

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
                f"{EMOJI_NEON_HEART} **Huge thank you to {member.mention} for boosting SyncInk Support!**\n"
                f"You're absolute royalty in our server! Your support helps keep our infrastructure powered and our community thriving! {EMOJI_HEART_POP}\n\n"
                f"- **VIP Support Chat:** Head over to <#{VIP_CHAT_CHANNEL_ID}> for exclusive VIP chat & direct developer assistance.\n"
                f"- **Media & Upload Privileges:** Enjoy unrestricted permission to upload media, images, video clips, and attachments.\n"
                f"- **Priority Ticket Support:** Inquired faster & kept in main priority.\n"
                f"- **Booster Badge:** Equipped with the {EMOJI_BOOSTER} <@&{BOOSTER_ROLE_ID}> role!\n\n"
                f"*all tickets created will be resolved if no rush but for boosters it will be on main priority*"
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
                await webhook.send(
                    content=content,
                    embed=embed,
                    username=WEBHOOK_NAME,
                    avatar_url=WEBHOOK_AVATAR_URL
                )
                log.info(f"Dispatched booster webhook announcement for {member.name} in #{channel.name}")
                return True, f"Successfully posted via Boosters webhook in {channel.mention}."
            except Exception as e:
                log.error(f"Failed to dispatch booster webhook: {e}")
                # Fallback to normal bot message if webhook fails
                try:
                    await channel.send(content=content, embed=embed)
                    return True, f"Webhook failed; posted as bot fallback in {channel.mention}."
                except Exception as inner_e:
                    return False, f"Failed to post announcement: {inner_e}"
        else:
            # Fallback to channel send
            try:
                await channel.send(content=content, embed=embed)
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
        aliases=["simulateboost", "boosttest"],
        description="[Admin Only] Simulate a server boost announcement and assign booster perks without boosting."
    )
    @commands.has_permissions(administrator=True)
    async def testboost_cmd(self, ctx: commands.Context, member: Optional[discord.Member] = None):
        """Prefix command to test booster webhook announcement and role assignment."""
        target = member or ctx.author
        if ctx.guild.id != TARGET_GUILD_ID:
            await ctx.send(embed=ErrorEmbed(
                description=f"This booster system is configured for Guild ID `{TARGET_GUILD_ID}`.",
                resolution="Please run this command inside the official SyncInk Support server."
            ))
            return

        msg = await ctx.send(f"Simulating server boost for {target.mention}...")
        success, details = await self.announce_boost(target, is_test=True)

        if success:
            await msg.edit(
                content=None,
                embed=SuccessEmbed(
                    f"**Booster Simulation Complete!** {EMOJI_HEART_POP}\n\n"
                    f"• **Target Member:** {target.mention} (`{target.id}`)\n"
                    f"• **Assigned Role:** <@&{BOOSTER_ROLE_ID}> (`{BOOSTER_ROLE_ID}`)\n"
                    f"• **Announcement Channel:** <#{BOOSTER_CHANNEL_ID}>\n"
                    f"• **Status:** {details}"
                )
            )
        else:
            await msg.edit(
                content=None,
                embed=ErrorEmbed(
                    description=f"Failed to simulate boost for {target.mention}.",
                    resolution=details
                )
            )

    @app_commands.command(
        name="testboost",
        description="[Admin Only] Simulate a server boost announcement and assign booster perks."
    )
    @app_commands.describe(member="Member to simulate boosting for (defaults to yourself)")
    @app_commands.default_permissions(administrator=True)
    async def testboost_slash(self, interaction: discord.Interaction, member: Optional[discord.Member] = None):
        """Slash command to test booster webhook announcement and role assignment."""
        target = member or interaction.user
        if not isinstance(target, discord.Member):
            if interaction.guild:
                target = interaction.guild.get_member(target.id) or target

        if interaction.guild_id != TARGET_GUILD_ID:
            await interaction.response.send_message(
                embed=ErrorEmbed(
                    description=f"This booster system is configured for Guild ID `{TARGET_GUILD_ID}`.",
                    resolution="Please run this command inside the official SyncInk Support server."
                ),
                ephemeral=True
            )
            return

        await interaction.response.defer(ephemeral=True)
        success, details = await self.announce_boost(target, is_test=True)

        if success:
            await interaction.followup.send(
                embed=SuccessEmbed(
                    f"**Booster Simulation Complete!** {EMOJI_HEART_POP}\n\n"
                    f"• **Target Member:** {target.mention} (`{target.id}`)\n"
                    f"• **Assigned Role:** <@&{BOOSTER_ROLE_ID}> (`{BOOSTER_ROLE_ID}`)\n"
                    f"• **Announcement Channel:** <#{BOOSTER_CHANNEL_ID}>\n"
                    f"• **Status:** {details}"
                ),
                ephemeral=True
            )
        else:
            await interaction.followup.send(
                embed=ErrorEmbed(
                    description=f"Failed to simulate boost for {target.mention}.",
                    resolution=details
                ),
                ephemeral=True
            )

async def setup(bot: commands.Bot):
    await bot.add_cog(Boosters(bot))
