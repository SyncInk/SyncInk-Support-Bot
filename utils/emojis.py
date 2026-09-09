import discord

class Emojis:
    """Centralized custom Discord application emojis for SyncInk Support Bot."""
    # Animated application emojis (<a:name:id>) verified via Discord CDN
    ALERT = "<a:syncalert:1547036006455189626>"
    SETTINGS = "<a:settings:1547035963073765508>"
    REFUSED = "<a:refused:1547035200926654624>"
    APPROVED = "<a:approved:1547035150964236379>"
    WARNING = "<a:syncwarning:1547034231438319616>"
    CHECK_YES = "<a:check_yes:1547034079076032512>"

    # Static application emojis (<:name:id>) verified via Discord CDN
    MODERATION = "<:moderation:1547035031275573289>"
    LOOKING = "<:looking:1547034317018898552>"
    LOGO = "<:syncinkmainlogo:1547034265076760707>"
    RULES = "<:rules:1547034188702818426>"
    LOCK = "<:syncink_lock:1547034002689491025>"
    SUGGESTION = "<:syncinksuggestion:1547033969646903437>"
    QUESTION = "<:syncinkquestion:1547033451029594222>"
    # Feature request custom emojis
    LOADING = "<a:Loading:1547095365679849492>"
    PENDING = "<a:pending:1547110867466985532>"
    MEMBERS = "<:members:1547109992212205608>"
    CANCELLED = "<:cancelled:1547111776267804692>"

class EmojiPartials:
    """discord.PartialEmoji instances for interactive UI components (Buttons, Menus)."""
    # Animated partials
    ALERT = discord.PartialEmoji(name="syncalert", id=1547036006455189626, animated=True)
    SETTINGS = discord.PartialEmoji(name="settings", id=1547035963073765508, animated=True)
    REFUSED = discord.PartialEmoji(name="refused", id=1547035200926654624, animated=True)
    APPROVED = discord.PartialEmoji(name="approved", id=1547035150964236379, animated=True)
    WARNING = discord.PartialEmoji(name="syncwarning", id=1547034231438319616, animated=True)
    CHECK_YES = discord.PartialEmoji(name="check_yes", id=1547034079076032512, animated=True)
    LOADING = discord.PartialEmoji(name="Loading", id=1547095365679849492, animated=True)
    PENDING = discord.PartialEmoji(name="pending", id=1547110867466985532, animated=True)

    # Static partials
    MODERATION = discord.PartialEmoji(name="moderation", id=1547035031275573289, animated=False)
    LOOKING = discord.PartialEmoji(name="looking", id=1547034317018898552, animated=False)
    LOGO = discord.PartialEmoji(name="syncinkmainlogo", id=1547034265076760707, animated=False)
    RULES = discord.PartialEmoji(name="rules", id=1547034188702818426, animated=False)
    LOCK = discord.PartialEmoji(name="syncink_lock", id=1547034002689491025, animated=False)
    SUGGESTION = discord.PartialEmoji(name="syncinksuggestion", id=1547033969646903437, animated=False)
    QUESTION = discord.PartialEmoji(name="syncinkquestion", id=1547033451029594222, animated=False)
    CHATGPT = discord.PartialEmoji(name="CharGPT", id=1544376850476826796, animated=False)
    MEMBERS = discord.PartialEmoji(name="members", id=1547109992212205608, animated=False)
    CANCELLED = discord.PartialEmoji(name="cancelled", id=1547111776267804692, animated=False)
