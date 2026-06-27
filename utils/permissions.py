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
