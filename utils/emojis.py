import discord

class Emojis:
    """Centralized custom Discord application emojis for SyncInk Support Bot."""
    ALERT = "<:syncalert:1547036006455189626>"
    SETTINGS = "<:settings:1547035963073765508>"
    REFUSED = "<:refused:1547035200926654624>"
    APPROVED = "<:approved:1547035150964236379>"
    MODERATION = "<:moderation:1547035031275573289>"
    LOOKING = "<:looking:1547034317018898552>"
    LOGO = "<:syncinkmainlogo:1547034265076760707>"
    WARNING = "<:syncwarning:1547034231438319616>"
    RULES = "<:rules:1547034188702818426>"
    CHECK_YES = "<:check_yes:1547034079076032512>"
    LOCK = "<:syncink_lock:1547034002689491025>"
    SUGGESTION = "<:syncinksuggestion:1547033969646903437>"
    QUESTION = "<:syncinkquestion:1547033451029594222>"
    CHATGPT = "<:CharGPT:1544376850476826796>"

class EmojiPartials:
    """discord.PartialEmoji instances for interactive UI components (Buttons, Menus)."""
    APPROVED = discord.PartialEmoji(name="approved", id=1547035150964236379)
    REFUSED = discord.PartialEmoji(name="refused", id=1547035200926654624)
    ALERT = discord.PartialEmoji(name="syncalert", id=1547036006455189626)
    SETTINGS = discord.PartialEmoji(name="settings", id=1547035963073765508)
    MODERATION = discord.PartialEmoji(name="moderation", id=1547035031275573289)
    LOOKING = discord.PartialEmoji(name="looking", id=1547034317018898552)
    LOGO = discord.PartialEmoji(name="syncinkmainlogo", id=1547034265076760707)
    WARNING = discord.PartialEmoji(name="syncwarning", id=1547034231438319616)
    RULES = discord.PartialEmoji(name="rules", id=1547034188702818426)
    CHECK_YES = discord.PartialEmoji(name="check_yes", id=1547034079076032512)
    LOCK = discord.PartialEmoji(name="syncink_lock", id=1547034002689491025)
    SUGGESTION = discord.PartialEmoji(name="syncinksuggestion", id=1547033969646903437)
    QUESTION = discord.PartialEmoji(name="syncinkquestion", id=1547033451029594222)
    CHATGPT = discord.PartialEmoji(name="CharGPT", id=1544376850476826796)
