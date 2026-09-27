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
    SYNCBOT = "<:syncbot:1552437282059980810>"
    BOT = SYNCBOT
    CPU = "<:CPU:1551310556038701118>"
    # Official Server Role Emojis (Default fallbacks; updated dynamically by EmojiManager)
    ROLE_OWNER = "👑"
    ROLE_MANAGER = "💼"
    ROLE_DEVELOPER = "💻"
    ROLE_STAFF = "🛡️"
    ROLE_PARTNER = "<:partnered:1551337413660381255>"
    ROLE_VERIFIED = "<:verified:1551336293017845822>"

    # Official Ticket Category Emojis (<:name:id>)
    TICKET_PRODUCT = "<:SyncProductSupport:1553532855278116956>"
    TICKET_ACCOUNT = "<:accsvr:1553532858058936424>"
    TICKET_BUG = "<:bugreport:1553532860408012850>"
    TICKET_STAFF_ABUSE = "<:staffabuse:1553532862945562754>"
    TICKET_OTHER = "<:others:1553533697364598814>"
    TICKET_PARTNERSHIP = "<:SyncPartnership:1553532869950046340>"

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
    SYNCBOT = discord.PartialEmoji(name="syncbot", id=1552437282059980810, animated=False)
    BOT = SYNCBOT
    CPU = discord.PartialEmoji(name="CPU", id=1551310556038701118, animated=False)
    ROLE_OWNER = discord.PartialEmoji(name="👑")
    ROLE_MANAGER = discord.PartialEmoji(name="💼")
    ROLE_DEVELOPER = discord.PartialEmoji(name="💻")
    ROLE_STAFF = discord.PartialEmoji(name="🛡️")
    ROLE_PARTNER = discord.PartialEmoji(name="partnered", id=1551337413660381255, animated=False)
    ROLE_VERIFIED = discord.PartialEmoji(name="verified", id=1551336293017845822, animated=False)

    # Ticket category partials
    TICKET_PRODUCT = discord.PartialEmoji(name="SyncProductSupport", id=1553532855278116956, animated=False)
    TICKET_ACCOUNT = discord.PartialEmoji(name="accsvr", id=1553532858058936424, animated=False)
    TICKET_BUG = discord.PartialEmoji(name="bugreport", id=1553532860408012850, animated=False)
    TICKET_STAFF_ABUSE = discord.PartialEmoji(name="staffabuse", id=1553532862945562754, animated=False)
    TICKET_OTHER = discord.PartialEmoji(name="others", id=1553533697364598814, animated=False)
    TICKET_PARTNERSHIP = discord.PartialEmoji(name="SyncPartnership", id=1553532869950046340, animated=False)

    MODERATION = discord.PartialEmoji(name="moderation", id=1547035031275573289, animated=False)
    LOOKING = discord.PartialEmoji(name="looking", id=1547034317018898552, animated=False)
    LOGO = discord.PartialEmoji(name="syncinkmainlogo", id=1547034265076760707, animated=False)
    RULES = discord.PartialEmoji(name="rules", id=1547034188702818426, animated=False)
    LOCK = discord.PartialEmoji(name="syncink_lock", id=1547034002689491025, animated=False)
    SUGGESTION = discord.PartialEmoji(name="syncinksuggestion", id=1547033969646903437, animated=False)
    QUESTION = discord.PartialEmoji(name="syncinkquestion", id=1547033451029594222, animated=False)
    MEMBERS = discord.PartialEmoji(name="members", id=1547109992212205608, animated=False)
    CANCELLED = discord.PartialEmoji(name="cancelled", id=1547111776267804692, animated=False)

import re

# Legacy emoji tags map to ensure any stored or cached tags are upgraded to live server tags
OLD_TAG_MAP = {
    "<:SyncProductSupport:1522287691792912394>": "<:SyncProductSupport:1553532855278116956>",
    "<:userreport:1513336966681460856>": "<:accsvr:1553532858058936424>",
    "<:accsvr:1513336966681460856>": "<:accsvr:1553532858058936424>",
    "<:bugreport:1513337174148513892>": "<:bugreport:1553532860408012850>",
    "<:staffabuse:1513337285024677899>": "<:staffabuse:1553532862945562754>",
    "<:others~1:1513337572078911488>": "<:others:1553533697364598814>",
    "<:others:1513337572078911488>": "<:others:1553533697364598814>",
    "<:SyncPartnership:1522289808599290006>": "<:SyncPartnership:1553532869950046340>",
}

# Comprehensive mapping of raw emoji names to valid custom Discord emoji tags
EMOJI_NAME_MAP = {
    # Ticket Categories (Live Server Emojis)
    "syncproductsupport": "<:SyncProductSupport:1553532855278116956>",
    "productsupport": "<:SyncProductSupport:1553532855278116956>",
    "sync_product_support": "<:SyncProductSupport:1553532855278116956>",
    
    "accsvr": "<:accsvr:1553532858058936424>",
    "userreport": "<:accsvr:1553532858058936424>",
    "user_report": "<:accsvr:1553532858058936424>",
    "accountandserver": "<:accsvr:1553532858058936424>",
    "account_server": "<:accsvr:1553532858058936424>",
    
    "bugreport": "<:bugreport:1553532860408012850>",
    "bug_report": "<:bugreport:1553532860408012850>",
    
    "staffabuse": "<:staffabuse:1553532862945562754>",
    "staff_abuse": "<:staffabuse:1553532862945562754>",
    
    "others": "<:others:1553533697364598814>",
    "others~1": "<:others:1553533697364598814>",
    "other": "<:others:1553533697364598814>",
    
    "syncpartnership": "<:SyncPartnership:1553532869950046340>",
    "sync_partnership": "<:SyncPartnership:1553532869950046340>",
    "partnership": "<:SyncPartnership:1553532869950046340>",

    # Connection & Status Emojis
    "goodconnection": "<:goodconnection:1551311911948394697>",
    "moderateconnection": "<:moderateconnection:1551311891173740644>",
    "lowconnection": "<:lowconnection:1551311863675879494>",
    "noconnection": "<:noconnection:1551311810223931484>",
    "connectionping": "<a:connectionping:1551311432392646737>",
    "syncbot": "<:syncbot:1552437282059980810>",
    "syncinkai": "<:SyncInkAI:1549154093421826058>",
    "cpu": "<:CPU:1551310556038701118>",

    # Roles & Brand Emojis
    "partnered": "<:partnered:1551337413660381255>",
    "verified": "<:verified:1551336293017845822>",
    "syncalert": "<a:syncalert:1547036006455189626>",
    "syncwarning": "<a:syncwarning:1547034231438319616>",
    "refused": "<a:refused:1547035200926654624>",
    "approved": "<a:approved:1547035150964236379>",
    "check_yes": "<a:check_yes:1547034079076032512>",
    "checkyes": "<a:check_yes:1547034079076032512>",
    "syncinkmainlogo": "<:syncinkmainlogo:1547034265076760707>",
    "syncink_lock": "<:syncink_lock:1547034002689491025>",
    "syncinksuggestion": "<:syncinksuggestion:1547033969646903437>",
    "syncinkquestion": "<:syncinkquestion:1547033451029594222>",
    "moderation": "<:moderation:1547035031275573289>",
    "looking": "<:looking:1547034317018898552>",
    "rules": "<:rules:1547034188702818426>",
    "loading": "<a:Loading:1547095365679849492>",
    "pending": "<a:pending:1547110867466985532>",
    "members": "<:members:1547109992212205608>",
    "cancelled": "<:cancelled:1547111776267804692>",
}

def format_discord_emojis(text: str) -> str:
    """
    Scans text for raw emoji names (e.g. :SyncProductSupport:, :bugreport:, :accsvr:) and
    automatically replaces them with valid custom Discord emoji tags (<:name:id>).
    Also upgrades legacy emoji tags to current active server emojis, and strips
    any surrounding backticks (`...`) so Discord displays the emoji as a visual graphic
    rather than typewriter/monospace code text.
    """
    if not text:
        return text

    # 1. Strip backticks around custom emojis <:name:id> or <a:name:id>
    text = re.sub(r'[`\x60]+\s*(<a?:[a-zA-Z0-9_~-]+:\d+>)\s*[`\x60]+', r'\1', text)

    # 2. Strip backticks around raw :name: emojis
    text = re.sub(r'[`\x60]+\s*(:[a-zA-Z0-9_~-]+:)\s*[`\x60]+', r'\1', text)

    # 3. Upgrade legacy tags
    for old_tag, new_tag in OLD_TAG_MAP.items():
        text = text.replace(old_tag, new_tag)

    # 4. Convert unformatted :name: emojis
    def _replace(match):
        name = match.group(1)
        key = name.lower()
        if key in EMOJI_NAME_MAP:
            return EMOJI_NAME_MAP[key]
        return match.group(0)

    # Matches :name: when NOT preceded by <: or <a: and NOT followed by :<id>>
    text = re.sub(r'(?<!<a:)(?<!<:):([a-zA-Z0-9_~-]+):(?![\d]+>)', _replace, text)

    # 5. Final safety strip in case an emoji conversion resulted inside backticks
    text = re.sub(r'[`\x60]+\s*(<a?:[a-zA-Z0-9_~-]+:\d+>)\s*[`\x60]+', r'\1', text)

    return text
