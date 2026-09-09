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
    """Verifies that the command is run in one of the authorized staff private channels."""
    if not ctx.guild or ctx.channel.id not in STAFF_MOD_CHANNEL_IDS:
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.NotFound):
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

