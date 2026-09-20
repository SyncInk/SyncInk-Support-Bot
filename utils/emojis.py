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
    AI = "<:SyncInkAI:1549154093421826058>"
    CHATGPT = AI
    CONNECTION_GOOD = "<:goodconnection:1551311911948394697>"
    CONNECTION_MODERATE = "<:moderateconnection:1551311891173740644>"
    CONNECTION_LOW = "<:lowconnection:1551311863675879494>"
    CONNECTION_NONE = "<:noconnection:1551311810223931484>"
    CONNECTION_PING = "<a:connectionping:1551311432392646737>"
    CPU = "<:CPU:1551310556038701118>"
    # Official Server Role Emojis (Default fallbacks; updated dynamically by EmojiManager)
    ROLE_OWNER = "👑"
    ROLE_MANAGER = "💼"
    ROLE_DEVELOPER = "💻"
    ROLE_STAFF = "🛡️"
    ROLE_PARTNER = "<:partnered:1551337413660381255>"
    ROLE_VERIFIED = "<:verified:1551336293017845822>"

    MODERATION = "<:moderation:1547035031275573289>"
    LOOKING = "<:looking:1547034317018898552>"
    LOGO = "<:syncinkmainlogo:1547034265076760707>"
    RULES = "<:rules:1547034188702818426>"
    LOCK = "<:syncink_lock:1547034002689491025>"
    SUGGESTION = "<:syncinksuggestion:1547033969646903437>"
    QUESTION = "<:syncinkquestion:1547033451029594222>"
    SYNCINK_LOGO = "<:syncinkmainlogo:1529117858859061331>"
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
    CONNECTION_PING = discord.PartialEmoji(name="connectionping", id=1551311432392646737, animated=True)

    # Static partials
    AI = discord.PartialEmoji(name="SyncInkAI", id=1549154093421826058, animated=False)
    CHATGPT = AI
    CONNECTION_GOOD = discord.PartialEmoji(name="goodconnection", id=1551311911948394697, animated=False)
    CONNECTION_MODERATE = discord.PartialEmoji(name="moderateconnection", id=1551311891173740644, animated=False)
    CONNECTION_LOW = discord.PartialEmoji(name="lowconnection", id=1551311863675879494, animated=False)
    CONNECTION_NONE = discord.PartialEmoji(name="noconnection", id=1551311810223931484, animated=False)
    CPU = discord.PartialEmoji(name="CPU", id=1551310556038701118, animated=False)
    ROLE_OWNER = discord.PartialEmoji(name="👑")
    ROLE_MANAGER = discord.PartialEmoji(name="💼")
    ROLE_DEVELOPER = discord.PartialEmoji(name="💻")
    ROLE_STAFF = discord.PartialEmoji(name="🛡️")
    ROLE_PARTNER = discord.PartialEmoji(name="partnered", id=1551337413660381255, animated=False)
    ROLE_VERIFIED = discord.PartialEmoji(name="verified", id=1551336293017845822, animated=False)
    MODERATION = discord.PartialEmoji(name="moderation", id=1547035031275573289, animated=False)
    LOOKING = discord.PartialEmoji(name="looking", id=1547034317018898552, animated=False)
    LOGO = discord.PartialEmoji(name="syncinkmainlogo", id=1547034265076760707, animated=False)
    RULES = discord.PartialEmoji(name="rules", id=1547034188702818426, animated=False)
    LOCK = discord.PartialEmoji(name="syncink_lock", id=1547034002689491025, animated=False)
    SUGGESTION = discord.PartialEmoji(name="syncinksuggestion", id=1547033969646903437, animated=False)
    QUESTION = discord.PartialEmoji(name="syncinkquestion", id=1547033451029594222, animated=False)
    MEMBERS = discord.PartialEmoji(name="members", id=1547109992212205608, animated=False)
    CANCELLED = discord.PartialEmoji(name="cancelled", id=1547111776267804692, animated=False)
