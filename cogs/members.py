import discord
from discord.ext import commands
import re
from typing import Optional, Union
from utils.ui import SyncInkEmbed, ErrorEmbed, BRAND_ACCENT
from utils.logger import log

class Members(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _resolve_user(self, ctx: commands.Context, target: Optional[str]) -> Optional[Union[discord.Member, discord.User]]:
        if not target:
            return ctx.author

        # Clean mention or raw ID
        clean_id = re.sub(r'[<@!&>]', '', target).strip()
        if clean_id.isdigit():
            user_id = int(clean_id)
            if ctx.guild:
                member = ctx.guild.get_member(user_id)
                if member:
                    return member
            try:
                return await self.bot.fetch_user(user_id)
            except (discord.NotFound, discord.HTTPException):
                pass

        # Try username or nickname match in guild
        if ctx.guild:
            target_lower = target.lower()
            for m in ctx.guild.members:
                if target_lower in m.name.lower() or target_lower in m.display_name.lower():
                    return m

        return None

    @commands.command(name="pfp", aliases=["avatar", "av"], description="Show a member's profile photo in full size.")
    async def pfp(self, ctx: commands.Context, *, target: str = None):
        user = await self._resolve_user(ctx, target)
        if not user:
            await ctx.send(embed=ErrorEmbed(
                description=f"Could not find any member matching `{target}`.",
                resolution="Try mentioning the user or providing their Discord user ID."
            ))
            return

        avatar = user.display_avatar
        embed = SyncInkEmbed(
            title=f"{user.display_name}'s Profile Photo",
            color=getattr(user, 'accent_color', None) or BRAND_ACCENT
        )
        embed.set_image(url=avatar.with_size(1024).url)

        links = [
            f"[PNG]({avatar.with_format('png').url})",
            f"[JPG]({avatar.with_format('jpg').url})",
            f"[WEBP]({avatar.with_format('webp').url})"
        ]
        if avatar.is_animated():
            links.append(f"[GIF]({avatar.with_format('gif').url})")

        embed.description = " • ".join(links)
        embed.set_footer(text=f"SyncInk Platform • Requested by {ctx.author.display_name}", icon_url="https://files.catbox.moe/74l9su.png")
        await ctx.send(embed=embed)

    @commands.command(name="banner", description="Show a member's profile banner in full size.")
    async def banner(self, ctx: commands.Context, *, target: str = None):
        user = await self._resolve_user(ctx, target)
        if not user:
            await ctx.send(embed=ErrorEmbed(
                description=f"Could not find any member matching `{target}`.",
                resolution="Try mentioning the user or providing their Discord user ID."
            ))
            return

        # Fetch full user to guarantee banner and accent color data is populated
        try:
            full_user = await self.bot.fetch_user(user.id)
        except (discord.NotFound, discord.HTTPException):
            full_user = user

        if not full_user.banner:
            embed = SyncInkEmbed(
                title=f"{full_user.display_name}'s Banner",
                description=f"{full_user.mention} does not have a custom profile banner set.",
                color=full_user.accent_color or BRAND_ACCENT
            )
            if full_user.accent_color:
                embed.add_field(name="Accent Color", value=f"`{full_user.accent_color}`", inline=True)
            embed.set_footer(text=f"SyncInk Platform • Requested by {ctx.author.display_name}", icon_url="https://files.catbox.moe/74l9su.png")
            await ctx.send(embed=embed)
            return

        banner = full_user.banner
        embed = SyncInkEmbed(
            title=f"{full_user.display_name}'s Profile Banner",
            color=full_user.accent_color or BRAND_ACCENT
        )
        embed.set_image(url=banner.with_size(1024).url)

        links = [
            f"[PNG]({banner.with_format('png').url})",
            f"[JPG]({banner.with_format('jpg').url})",
            f"[WEBP]({banner.with_format('webp').url})"
        ]
        if banner.is_animated():
            links.append(f"[GIF]({banner.with_format('gif').url})")

        embed.description = " • ".join(links)
        embed.set_footer(text=f"SyncInk Platform • Requested by {ctx.author.display_name}", icon_url="https://files.catbox.moe/74l9su.png")
        await ctx.send(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(Members(bot))

