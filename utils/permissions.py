import discord
from discord import app_commands
from utils.i18n import i18n
from utils.exceptions import UserFacingError

def has_permission(**perms):
    """
    A centralized permission checker.
    In the future, this can be hooked into the DB to check if a user has a specific DB-configured role
    rather than just Discord permissions.
    """
    async def predicate(interaction: discord.Interaction) -> bool:
        ch = interaction.channel
        permissions = ch.permissions_for(interaction.user)
        
        missing = [perm for perm, value in perms.items() if getattr(permissions, perm, None) != value]
        
        if not missing:
            return True
            
        raise UserFacingError(i18n.get("error_no_permission"))
        
    return app_commands.check(predicate)

STAFF_MOD_CHANNEL_IDS = {1520462320235577454, 1520879581400141856}

async def require_staff_channel(ctx) -> bool:
    """Verifies that the command is run by staff in one of the authorized staff private channels."""
    if not ctx.guild:
        return False

    # 1. Check whether user has staff/moderator permissions
    is_staff = (
        ctx.author.id == ctx.guild.owner_id or 
        await ctx.bot.is_owner(ctx.author) or
        ctx.author.guild_permissions.moderate_members or
        ctx.author.guild_permissions.kick_members or
        ctx.author.guild_permissions.ban_members or
        ctx.author.guild_permissions.manage_messages or
        ctx.author.guild_permissions.manage_guild or
        ctx.author.guild_permissions.administrator
    )

    if not is_staff:
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass
        from utils.ui import SyncInkEmbed, ERROR_COLOR
        from utils.emojis import Emojis
        embed = SyncInkEmbed(
            title=f"{Emojis.REFUSED} **Access Denied**",
            description="You do not have access to this command.",
            color=ERROR_COLOR
        )
        try:
            await ctx.send(embed=embed, delete_after=6)
        except (discord.Forbidden, discord.HTTPException):
            pass
        return False

    # 2. Staff user - check channel restriction
    if ctx.channel.id not in STAFF_MOD_CHANNEL_IDS:
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass
        from utils.ui import SyncInkEmbed, ERROR_COLOR
        from utils.emojis import Emojis
        embed = SyncInkEmbed(
            title=f"{Emojis.REFUSED} **Channel Restriction**",
            description="Moderation commands can only be used in authorized staff channels (<#1520462320235577454>, <#1520879581400141856>).",
            color=ERROR_COLOR
        )
        try:
            await ctx.send(embed=embed, delete_after=6)
        except (discord.Forbidden, discord.HTTPException):
            pass
        return False
    return True

async def require_server_owner(ctx) -> bool:
    """Verifies that the command is run by the Server Owner or Bot Owner."""
    is_owner = (ctx.guild and ctx.author.id == ctx.guild.owner_id) or await ctx.bot.is_owner(ctx.author)
    if not is_owner:
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound, discord.HTTPException):
            pass
        from utils.ui import SyncInkEmbed, ERROR_COLOR
        from utils.emojis import Emojis
        embed = SyncInkEmbed(
            title=f"{Emojis.REFUSED} **Access Denied**",
            description="You do not have access to this command.",
            color=ERROR_COLOR
        )
        try:
            await ctx.send(embed=embed, delete_after=6)
        except (discord.Forbidden, discord.HTTPException):
            pass
        return False
    return True

