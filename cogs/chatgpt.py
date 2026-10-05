import discord
from discord.ext import commands
from discord import app_commands
import os
import aiohttp
import asyncio
import time
import json
import re
import random
from collections import defaultdict, deque
from typing import Optional, List, Tuple
from utils.logger import log
from utils.emojis import Emojis, format_discord_emojis
from utils.emoji_manager import EmojiManager
from utils.ui import SyncInkEmbed, SuccessEmbed, BRAND_ACCENT, ERROR_COLOR, WARNING_COLOR
from services.web_search_service import WebSearchService

try:
    from services.settings_service import SettingsService
except Exception:
    SettingsService = None

DEFAULT_AI_CHANNEL_ID = 1544361954574073916

def is_creator_query(prompt: str) -> bool:
    """Checks if the user query is asking about the bot's creator, maker, or origin."""
    clean = prompt.lower().strip().rstrip("?!. ")
    if clean in ("truth", "dare", "truth or dare", "ask truth", "ask dare", "play truth or dare"):
        return False
    patterns = [
        "who made you", "who made u",
        "who created you", "who created u",
        "who developed you", "who developed u",
        "who built you", "who built u",
        "who is your creator", "who is your maker", "who is your developer",
        "who are your creators", "who are your developers", "who are your makers",
        "who programmed you", "who programmed u",
        "who coded you", "who coded u",
        "who owns you", "what company made you", "what team made you",
        "who made this bot", "who created this bot", "who developed this bot",
        "who built this bot", "who programmed this bot", "who coded this bot",
        "who is the creator of this bot", "who is the developer of this bot",
        "who made syncink", "who created syncink", "who developed syncink",
        "who designed you", "who designed this bot"
    ]
    return any(p in clean for p in patterns)

def sanitize_ai_identity(text: str) -> str:
    """Ensures AI never leaks third-party vendor names, confuses support chat with general chat, and properly formats custom Discord emojis."""
    replacements = [
        ("I was trained by Google", "I was developed by the SyncInk Development Team"),
        ("I am a large language model trained by Google", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
        ("I am a large language model, trained by Google", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
        ("I was created by Google", "I was created by the SyncInk Development Team"),
        ("I was developed by OpenAI", "I was developed by the SyncInk Development Team"),
        ("I was created by OpenAI", "I was created by the SyncInk Development Team"),
        ("I am ChatGPT", "I am SyncInk Assistant"),
        ("I am a large language model, trained by OpenAI", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
        ("I am a large language model trained by OpenAI", "I am SyncInk Assistant, developed by the SyncInk Development Team"),
    ]
    res = text
    for old, new in replacements:
        res = re.sub(re.escape(old), new, res, flags=re.IGNORECASE)

    # Prevent AI from associating hanging out/talking with support chat
    res = re.sub(
        r"(hang out.*?(?:talk|chat).*?in\s+)<#1520460808499363840>",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    res = re.sub(
        r"(talk with everyone in\s+)<#1520460808499363840>",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    res = re.sub(
        r"(talk with everyone in\s+)#?\s*💬?\s*・?\s*support-chat",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )
    res = re.sub(
        r"(hang out.*?(?:talk|chat).*?in\s+)#?\s*💬?\s*・?\s*support-chat",
        r"\1<#1520461481857122485>",
        res,
        flags=re.IGNORECASE
    )

    # Automatically transform any raw :name: emojis into valid <:name:id> custom Discord emojis
    res = format_discord_emojis(res)
    return res

def build_server_guide_context(guild: discord.Guild, settings: Optional[dict] = None) -> str:
    """Builds the comprehensive official server channel, bot ecosystem, and guide knowledge base."""
    g_name = guild.name if guild else "SyncInk Support"
    lines = [
        f"Server Name: {g_name}",
        "--- OFFICIAL SYNCINK SERVER KNOWLEDGE BASE & DIRECTORY ---",
        "1. Welcome Channel: <#1520460456181891102> (Where new arrivals land and are greeted)",
        "2. Bot Updates Channel: <#1520460505196662836> (Official changelogs, patches, and releases for SyncInk bots)",
        "3. Important Announcements Channel: <#1520460544811859968> (Key server news, updates, and announcements)",
        "4. Guides / Rules Channel: <#1520460587522330634> (Server rules, policies, and community guidelines)",
        "5. FAQ Channel: <#1520460624864350218> (Frequently asked questions and answers)",
        "6. Verification Checkpoint: <#1520748219100041348> (Where unverified members verify to access the server)",
        "7. Support Ticket Channel: <#1520460764937322566> (Open a private support ticket with staff)",
        "8. Support Chat Channel: <#1520460808499363840> (STRICTLY for asking support questions, getting technical assistance, and troubleshooting. NOTE: Support Chat is NOT for hanging out, casual chatting, or general talking!)",
        "9. Discussion Channel: <#1520477097494057041> (General discussions, ideas, and debates)",
        "10. Feature Suggestions Channel: <#1546548728721178724> (Submit feature suggestions using `/feature_request` or `?feature_request` ONLY in <#1546548728721178724>)",
        "11. Official SyncInk Products Channel: <#1520461321689104486>",
        "    - Public Service Bots (<@&1521166171523780688>): Ticket Bot (<@1513075101992747158>), Voice Bot (<@1516578887109181520>)",
        "    - Private Bot (<@&1520533971476156469>): SyncInk Security Bot (<@1520522990280769727>) - protects community from spam and deletes blacklisted messages",
        "12. General Chat: <#1520461481857122485> (The designated channel where members hang out, talk, and have casual conversation. All general talking belongs here!)",
        "13. Media Showcase Channel: <#1520461517093343232> (Share images, media, clips. STRICT NOTE: Any NSFW content will result in an immediate permanent ban!)",
        "14. Join to Create VC: <#1520749464569253998> (Join this voice channel to automatically generate your own temporary private voice channel)",
        "15. Apply for Developer Channel: <#1539301185423413398> (Form: [Apply for Developer](https://syncink.github.io/syncink-portfolio/apply-developer) - check requirements in <#1539301185423413398>)",
        "16. Apply for Staff Channel: <#1539319001673367604> (Form: [Apply for Staff](https://discord.com/channels/1520457643842342912/1539319001673367604/1539371523188596916) - check requirements in <#1539319001673367604>)",
        "17. Ask AI Channel: <#1544361954574073916> (Dedicated channel for AI questions)",
        "",
        "--- OFFICIAL SUPPORT SERVER RULES (<#1520460587522330634>) & WEBSITE DOCUMENTATION ---",
        "Discord Guide Channel: <#1520460587522330634> (Reference Post: https://discord.com/channels/1520457643842342912/1520460587522330634/1539582756001161238)",
        "Official Website Rules Page (Public - No Login Required): https://syncink.site/rules",
        "Official Website FAQ Page (Public - No Login Required): https://syncink.site/faq",
        "Official Terms of Use (Public - No Login Required): https://syncink.site/terms",
        "Official Privacy Policy (Public - No Login Required): https://syncink.site/privacy",
        "Official Security & Defense Dashboard: https://syncink.site/",
        "• Rule 1: Verification Required — All members must complete verification in <#1520748219100041348> before gaining access to the rest of the server.",
        "• Rule 2: Professional Conduct & Respect — Treat all members, staff, and developers with respect. Strictly prohibited: harassment, bullying, hate speech, discrimination, personal attacks, toxic behavior, provoking arguments.",
        "• Rule 3: Keep Discussions Relevant — Keep conversations in proper channels:",
        "  - General Chat: <#1520461481857122485> (Casual & off-topic discussions)",
        "  - Support Requests: <#1520460764937322566> (Private support tickets)",
        "  - Support Chat: <#1520460808499363840> (General questions and public help)",
        "  - Feature Suggestions: <#1546548728721178724> (Submit feature suggestions)",
        "• Rule 4: Zero Tolerance for Spam — Prohibited: Repeated messages, unsolicited mentions/pings, mass emojis/GIFs/stickers, bot command spam.",
        "• Rule 5: No Advertising or Self-Promotion — Direct advertising of external servers, products, bots, or DM advertising without explicit approval is strictly forbidden.",
        "• Rule 6: Security & Responsible Use — No exploiting bugs, security bypassing, malware, or phishing. Report security issues privately via ticket in <#1520460764937322566>.",
        "• Rule 7: Respect Staff Decisions — Comply with staff instructions. Appeals or questions must go privately through a ticket in <#1520460764937322566>, never argued publicly in chat.",
        "• Rule 8: Enforcement Policy — Escalation: Warnings -> Message Deletion -> Timeouts -> Kicks -> Permanent Bans. Severe violations (such as NSFW content, malicious attacks, hate speech) result in an immediate permanent ban without warning!",
        "• Media Showcase Policy (<#1520461517093343232>): Absolutely NO NSFW content. Posting NSFW results in an immediate permanent ban!",
        "",
        "--- RULES FOR USE OF AI (SYNCINK AI ASSISTANT) ---",
        "• AI-Rule 1 (Rate Limits & Fair Use): 1-minute cooldown per member across ?ask and /ask to ensure fair server resources. Automated flooding/scripting is prohibited.",
        "• AI-Rule 2 (Prompt Integrity & Anti-Jailbreak): Strictly no prompt injection, 'DAN' jailbreaking, instruction overrides, or attempts to extract internal system prompts or secrets.",
        "• AI-Rule 3 (Safe Interactions & PG-13 Standard): All questions, discussions, and Truth or Dare challenges must remain family-friendly, PG-13, and respectful. Absolutely no NSFW, sexually explicit, abusive, or hateful prompts.",
        "• AI-Rule 4 (Channel Discipline): Use <#1544361954574073916> (# 🤖・ask-ai) or /ask for AI interactions to avoid cluttering general chat.",
        "• AI-Rule 5 (Sanctions): Abusing the AI results in automated blacklisting from AI commands, temporary timeouts, or server bans.",
        "",
        "--- SYNCINK TICKET BOT KNOWLEDGE BASE ---",
        "• Bot: SyncInk Ticket Bot (<@1513075101992747158>)",
        "• Ticket Creation Panel: <#1520460764937322566> (Support Requests dropdown menu)",
        "• Support Categories & Emojis (CRITICAL: Always output the exact custom emoji tag <:name:id> directly in plain text. NEVER wrap emojis in backticks `...` as backticks force typewriter monospace code font):",
        "  1. <:SyncProductSupport:1553532855278116956> Product Support (Primary): Get help with any SyncInk product, setup, configuration, or troubleshooting.",
        "  2. <:accsvr:1553532858058936424> Account & Server: Appeals, account-related issues, verification problems, user reports (reporting rule breakers, NSFW in chat, harassment), or server concerns.",
        "  3. <:bugreport:1553532860408012850> Bug Report: Report a bug to the developers.",
        "  4. <:staffabuse:1553532862945562754> Staff Abuse: Report a misbehaving staff member to the admins.",
        "  5. <:others:1553533697364598814> Other: Something else that is not listed above.",
        "  6. <:SyncPartnership:1553532869950046340> Partnership / Business: Business inquiries, collaborations, sponsorships, or partnership requests.",
        "• Ticket Creation Workflow (Exact Process):",
        "  - Step 1: User selects their matching category from the dropdown in <#1520460764937322566>.",
        "  - Step 2: A modal window opens where the user MUST write their issue / description in detail.",
        "  - Step 3: The bot creates a Private Thread inside <#1520460764937322566> specifically for the user and staff.",
        "  - Step 4: The user must wait patiently until any staff member claims it using the 📝 Claim button.",
        "• In-Thread Features: Claimers embed, Reason embed, Action buttons (🔒 Close, 🔄 Transfer, 📝 Claim), and automated HTML transcripts upon closing.",
        "• Ticket Commands: `/ticket-panel`, `/ticket-add @user`, `/ticket-remove @user`, `/ticket-rename <name>`, `/ticket-config`, `/ticket-logs`.",
        "",
        "--- SYNCINK VOICE BOT KNOWLEDGE BASE ---",
        "• Bot: SyncInk Voice Bot (<@1516578887109181520>)",
        "• Join-to-Create Channel: <#1520749464569253998>",
        "• How it works: Joining <#1520749464569253998> automatically spawns a private temporary voice room and linked control panel for the user.",
        "• Room Settings Menu:",
        "  - Name: Rename the temporary voice room.",
        "  - Limit: Set user capacity (0 = unlimited, 1-99).",
        "  - Status: Set a custom status/topic for the voice channel.",
        "  - Game: Sync room name with current game played.",
        "  - LFM: Broadcast Looking For Members announcement.",
        "  - Bitrate: Adjust audio quality.",
        "  - Region: Change voice server region.",
        "  - Text: Toggle temporary private text chat for room members.",
        "  - NSFW: Toggle NSFW age-restriction flag.",
        "  - Claim: Claim ownership if the room owner leaves.",
        "• Room Permissions Menu:",
        "  - Lock: Lock room to prevent unauthorized members from entering.",
        "  - Unlock: Reopen room to all members.",
        "  - Permit: Whitelist specific user or role to join.",
        "  - Reject: Kick user and deny reconnection.",
        "  - Invite: Create instant invite link.",
        "  - Ghost / Hide: Hide channel from the server list.",
        "  - Unghost / Unhide: Reveal channel back on server list.",
        "  - Transfer: Transfer room ownership to another user.",
        "• Action Buttons: Load Settings, Refresh Panel, Dashboard.",
        "",
        "--- OFFICIAL SYNCINK SERVER ROLES (CATEGORY-WISE) ---",
        "• Leadership & Administration:",
        f"  - Owner: {EmojiManager.get_role_emoji(guild, 'owner')} <@&1520856232460550194> (Server Owner & Creator of SyncInk)",
        f"  - Manager: {EmojiManager.get_role_emoji(guild, 'manager')} <@&1520854378192572546> (Management leadership overseeing server operations and team members)",
        "• Development & Support Team:",
        f"  - Developer: {EmojiManager.get_role_emoji(guild, 'developer')} <@&1531882215795855511> (Technical developers building SyncInk bots & platforms; apply in <#1539301185423413398>)",
        f"  - Staff: {EmojiManager.get_role_emoji(guild, 'staff')} <@&1520466655321522486> (Support and moderation staff keeping community safe; apply in <#1539319001673367604>)",
        "• Community & Partnerships:",
        f"  - Partner: {EmojiManager.get_role_emoji(guild, 'partner')} <@&1551337053185114242> (Official server partners and affiliated communities)",
        f"  - Verified: {EmojiManager.get_role_emoji(guild, 'verified')} <@&1520871574088056952> (Community members who completed verification checkpoint in <#1520748219100041348>)"
    ]
    return "\n".join(lines)


def resolve_greeting(prompt: str, guild: Optional[discord.Guild] = None) -> Optional[str]:
    """Provides a standardized welcome greeting that correctly points to General Chat for hanging out."""
    clean = prompt.lower().strip().rstrip("?!. ")
    words = clean.split()
    if len(words) > 3:
        return None
    greetings = {"hi", "hello", "hey", "hii", "heyy", "sup", "yo", "start", "get started"}
    if clean in greetings or any(clean.startswith(g + " ") for g in ("hi", "hello", "hey")):
        g_name = guild.name if guild else "SyncInk Support"
        return (
            f"Hello! Welcome to **{g_name}**! 👋\n\n"
            "I'm the **SyncInk Assistant**, here to help you navigate the server and answer any questions you might have.\n\n"
            "Here are a few quick places to get started:\n"
            "• Complete verification in <#1520748219100041348> if you haven't yet.\n"
            "• Read the rules and guidelines in <#1520460587522330634>.\n"
            "• Hang out and talk with everyone in <#1520461481857122485> (General Chat).\n"
            "• Need help? Head over to <#1520460764937322566> (Support Ticket) or ask in <#1520460808499363840> (Support Chat).\n\n"
            "How can I assist you today?"
        )
    return None

DYNAMIC_TRUTH_QUESTIONS = [
    "What's something (idea, current event, fear) that you find deeply unsettling?",
    "What is a personal conviction you defended passionately in the past that you now find completely misguided?",
    "If your thoughts over the past 48 hours were broadcast publicly in this server, who would you owe an immediate apology to?",
    "What is a truth about your character that you try hardest to hide from people who admire you?",
    "What is the most selfish decision you've ever made that you secretly do not regret at all?",
    "If you had to name one unspoken insecurity that drives most of your daily decisions, what is it?",
    "Have you ever allowed someone else to take the blame or consequences for a mistake you made?",
    "What is a belief you secretly hold that you know would cause serious controversy if you said it out loud?",
    "If you could review an unedited recording of any single conversation in your life, which one would it be?",
    "What is something you pretend to find fulfilling or enjoyable solely to meet the expectations of others?",
    "What is the harshest criticism someone has given you that you know deep down was 100% accurate?",
    "If everyone in your life could read your mind for 60 seconds right now, what is the single thought that would destroy you?",
    "What is a bridge you burned that you pretend was justified, but in reality was caused by your own pride?",
    "What is the most morally ambiguous situation you've ever found yourself in, and how did you resolve it?",
    "If you had to trade your entire digital identity and start completely fresh without any friends knowing, would you do it?",
    "What is an unspoken boundary or rule you hold for other people that you routinely break yourself?",
    "What is a dream or ambition you quietly abandoned because you were terrified of failing publicly?",
    "If you knew with absolute certainty that no one would ever find out, what is one taboo rule you would break?",
    "What is a compliment you received that felt more like an indictment of how fake you were being?",
    "What is a memory that randomly surfaces at 3:00 AM and makes you cringe at your past self?",
    "What is an opinion you hold about modern society that you would never dare post under your real name?",
    "If you could see the exact statistical impact you've had on everyone you've met, what stat would you be most afraid to see?"
]

DYNAMIC_DARE_CHALLENGES = [
    "Speak strictly in philosophical questions for your next 3 messages in General Chat (<#1520461481857122485>)!",
    "Set your Discord custom status to 'Analyzing the simulation matrix 👁️' for the next 25 minutes!",
    "Ping the person directly above you in chat and praise them as if they just saved the universe from destruction!",
    "Write a short, excessively dramatic eulogy for a dead battery or broken charging cable in chat!",
    "Type your next message in General Chat using only your thumb while holding your phone or keyboard upside down!",
    "React with 🗿 to the last 5 messages sent in General Chat (<#1520461481857122485>) without saying a word!",
    "Change your Discord nickname on this server to something ridiculous chosen by the next member who types!",
    "Compose an overly intense, 2-line movie trailer voiceover about eating a midnight snack in chat!",
    "Send a message in chat pretending you just woke up from a 100-year cryogenic sleep and need an explanation of modern Discord!",
    "Post a totally serious, intellectual critique of why water is or is not wet in General Chat!"
]

def get_interactive_game_mode(prompt: str) -> Optional[str]:
    """Detects if prompt is requesting a Truth, Dare, or Truth or Dare game."""
    p = prompt.lower().strip().rstrip("?!. ")
    if p in ("truth", "ask truth", "give me a truth", "truth question", "t", "give truth", "play truth", "gimme truth", "ask me a truth", "send truth"):
        return "truth"
    if p in ("dare", "ask dare", "give me a dare", "dare challenge", "d", "give dare", "play dare", "gimme dare", "ask me a dare", "send dare"):
        return "dare"
    if p in ("truth or dare", "tod", "play truth or dare", "truth and dare", "t or d", "play tod", "give me truth or dare", "play truth and dare"):
        return "random"
    return None

def resolve_fun_interactive(prompt: str) -> Optional[str]:
    """Provides fun, interactive community games fallback."""
    mode = get_interactive_game_mode(prompt)
    if mode == "truth":
        q = random.choice(DYNAMIC_TRUTH_QUESTIONS)
        return f"🕸️ **Truth:** **{q}**"
    if mode == "dare":
        d = random.choice(DYNAMIC_DARE_CHALLENGES)
        return f"⚡ **Dare:** **{d}**"
    if mode == "random":
        q = random.choice(DYNAMIC_TRUTH_QUESTIONS)
        return f"🕸️ **Truth:** **{q}**"
    return None


def resolve_server_faq(prompt: str, guild: Optional[discord.Guild] = None) -> Optional[str]:
    """
    Directly answers specific server channel and action queries with 100% precision.
    Follows the strict rule: Tell ONLY that specific thing without dumping unrelated channels.
    Never intercepts multi-sentence questions, report writing requests, or complex topics.
    """
    p = prompt.lower().strip().rstrip("?!. ")
    words = p.split()

    # Complex queries, multi-sentence questions, drafting requests, or incident reports MUST be handled by the AI model
    complex_triggers = (
        "write", "draft", "incident", "someone", "posting", "giving",
        "nsfw", "photo", "image", "ban", "warn", "kick", "violation", "violating",
        "can u", "can you", "could you", "help me with", "please help", "what should i do",
        "explain", "why", "submit", "ticket because"
    )
    if len(words) > 5 or any(trigger in p for trigger in complex_triggers):
        return None

    # 0. Contribute to SyncInk / Join the Team
    if any(k in p for k in (
        "contribute", "contribution", "contributing",
        "join team", "join the team", "join syncink", "join syncink team",
        "work with syncink", "work with team", "help syncink", "how can i help",
        "how to contribute", "way to contribute", "ways to contribute"
    )):
        return (
            "Here are the primary ways you can contribute to the **SyncInk** team and server:\n\n"
            "• 💻 **Developer**: Apply to build SyncInk bots and platform tools via the [Developer Application](https://syncink.github.io/syncink-portfolio/apply-developer) (check requirements in <#1539301185423413398>).\n"
            "• 🛡️ **Staff Member**: Apply to help moderate and support our community via the [Staff Application](https://discord.com/channels/1520457643842342912/1539319001673367604/1539371523188596916) (check requirements in <#1539319001673367604>).\n"
            "• 💡 **Feature Suggestions**: Propose new features or improvements using `/feature_request` or `?feature_request` in <#1546548728721178724>.\n"
            "• 💬 **Community & Support**: Help answer other members' questions in <#1520460808499363840> or hang out in <#1520461481857122485>!"
        )

    # 1. Developer Application
    if any(k in p for k in ("apply for dev", "apply for developer", "developer application", "become a developer", "how to apply developer", "dev application", "dev form", "apply dev")):
        return (
            "If you are willing to apply as a developer to contribute to SyncInk, please fill out the form here:\n"
            "👉 **[Apply for Developer](https://syncink.github.io/syncink-portfolio/apply-developer)**\n\n"
            "You can check all developer requirements in <#1539301185423413398>."
        )

    # 2. Staff Application
    if any(k in p for k in ("apply for staff", "staff application", "become staff", "become a staff", "how to apply staff", "staff form", "apply staff")):
        return (
            "If you are willing to become a staff member on this support server, please fill out the form here:\n"
            "👉 **[Apply for Staff](https://discord.com/channels/1520457643842342912/1539319001673367604/1539371523188596916)**\n\n"
            "You can check all staff requirements in <#1539319001673367604>."
        )

    # 3. Feature Suggestions
    if any(k in p for k in ("suggest a feature", "feature suggestion", "feature request", "submit a suggestion", "where to suggest", "how to suggest", "suggest feature", "suggestion channel")):
        return (
            "You can submit feature suggestions using the `/feature_request` or `?feature_request` command "
            "exclusively in <#1546548728721178724>."
        )

    # 4. Rules & Guidelines (Strict focused matching)
    if p in ("rules", "server rules", "what are the rules", "where are the rules", "rules channel", "read the rules", "community rules", "guides channel", "guidelines", "rules list", "server rules list", "ai rules", "rules for ai", "use of ai rules", "ai usage rules"):
        return (
            "**Official SyncInk Support Server Rules** (<#1520460587522330634>):\n\n"
            "• **Rule 1: Verification** — Complete verification in <#1520748219100041348>.\n"
            "• **Rule 2: Conduct & Respect** — No harassment, bullying, hate speech, toxicity, or personal attacks.\n"
            "• **Rule 3: Keep Discussions Relevant** — General chat in <#1520461481857122485>, tickets in <#1520460764937322566>, support in <#1520460808499363840>.\n"
            "• **Rule 4: Zero Tolerance for Spam** — No repeated messages, unsolicited pings, mass emojis, or bot spam.\n"
            "• **Rule 5: No Advertising** — External promotions and DM advertising are strictly prohibited.\n"
            "• **Rule 6: Security & Responsible Use** — No exploiting or bypassing security. Report issues via ticket.\n"
            "• **Rule 7: Respect Staff Decisions** — Appeals or questions must go privately through a ticket.\n"
            "• **Rule 8: Enforcement Policy** — Warnings -> Timeouts -> Bans. Severe violations (such as NSFW) result in an immediate permanent ban!\n"
            "• **Rules for Use of AI**: 1-min cooldown per member, strictly no prompt injection/jailbreaking, PG-13 Truth or Dare interactions only, AI queries belong in <#1544361954574073916> or via `/ask`.\n\n"
            "📖 **Official Website Documentation (No Login Required):**\n"
            "👉 **[View Complete Rules on Website](https://syncink.site/rules)**"
        )

    # 4b. FAQ (Frequently Asked Questions)
    if p in ("faq", "server faq", "where is faq", "faqs", "frequently asked questions", "faq channel"):
        return (
            "**Official SyncInk Support Server FAQ** (<#1520460624864350218>):\n\n"
            "Find answers about Verification, Ticket Bot categories, Voice Bot temporary rooms, Security Bot, and Staff Applications.\n\n"
            "❓ **Official Website FAQ (No Login Required):**\n"
            "👉 **[View Server FAQ on Website](https://syncink.site/faq)**"
        )

    # 4c. Terms of Use & Privacy Policy
    if p in ("terms", "terms of use", "terms of service", "tos", "privacy", "privacy policy", "data policy"):
        return (
            "**Official SyncInk Legal & Privacy Documentation** (Public - No Login Required):\n\n"
            "• ⚖️ **Terms of Use:** [syncink.site/terms](https://syncink.site/terms)\n"
            "• 🔒 **Privacy Policy:** [syncink.site/privacy](https://syncink.site/privacy)\n"
            "• 📖 **Server Rules:** [syncink.site/rules](https://syncink.site/rules)\n"
            "• ❓ **Frequently Asked Questions:** [syncink.site/faq](https://syncink.site/faq)"
        )

    # 5. General Chat / Where to talk & hang out (Strict focused matching to avoid false positives)
    if p in ("general chat", "where to talk", "where can i talk", "where can we talk", "where to chat", "where is general chat", "where is general", "where to hang out", "where can i hang out"):
        return "You can hang out, talk, and chat with everyone in general chat at <#1520461481857122485>."

    # 6. Verification
    if any(k in p for k in ("how to verify", "where to verify", "verification channel", "how do i get verified", "verify channel", "verification checkpoint")):
        return "You can verify your account at the verification checkpoint in <#1520748219100041348>."

    # 7. Support & Tickets
    if p in ("ticket bot", "syncink ticket bot", "how does ticket bot work", "how to use ticket bot", "ticket categories", "ticket options", "categories"):
        return (
            "**SyncInk Ticket Bot** (<@1513075101992747158>) Guide:\n\n"
            "Open tickets in <#1520460764937322566> (**Support Requests**) by selecting a category:\n"
            "• <:SyncProductSupport:1553532855278116956> **Product Support (Primary)** — Setup, configuration, or troubleshooting.\n"
            "• <:accsvr:1553532858058936424> **Account & Server** — Appeals, account issues, verification, or reporting rule breakers / bad behavior.\n"
            "• <:bugreport:1553532860408012850> **Bug Report** — Report a bug to developers.\n"
            "• <:staffabuse:1553532862945562754> **Staff Abuse** — Report misbehaving staff to admins & owner.\n"
            "• <:others:1553533697364598814> **Other** — Inquiries not listed above.\n"
            "• <:SyncPartnership:1553532869950046340> **Partnership / Business** — Business inquiries, sponsorships, or partnerships.\n\n"
            "**Ticket Workflow:**\n"
            "1. Choose your category in <#1520460764937322566>.\n"
            "2. A modal will pop up — **write your issue / reason**.\n"
            "3. The bot creates a **Private Thread** specifically for you and staff.\n"
            "4. **Wait patiently until a staff member claims it** (`📝 Claim`)!"
        )

    if p in ("how to report", "how do i report", "how to report someone", "report someone", "report user", "how to report a user", "report nsfw"):
        return (
            "To report a rule violation (such as NSFW, harassment, or bad behavior):\n\n"
            "1. Head to <#1520460764937322566> (**Support Requests**).\n"
            "2. Select <:accsvr:1553532858058936424> **Account & Server** from the category menu.\n"
            "3. A modal will pop up — write your report details and submit.\n"
            "4. The bot will create a **Private Thread** for your ticket.\n"
            "5. Attach your screenshot evidence in the thread, and **wait patiently until a staff member claims it** (`📝 Claim`)."
        )

    if p in ("open a ticket", "create a ticket", "support ticket", "ticket channel", "how to get support", "need staff help", "talk to staff"):
        return (
            "For assistance from the SyncInk support team:\n\n"
            "1. Go to <#1520460764937322566> and choose your category from the menu.\n"
            "2. Write your issue in the modal window that pops up.\n"
            "3. The bot will create a **Private Thread** for you and staff.\n"
            "4. **Wait patiently until a staff member claims it** (`📝 Claim`)!\n\n"
            "*(You can also ask general public questions in <#1520460808499363840>)*"
        )

    if any(k in p for k in ("support chat", "what is support chat", "where is support chat", "can i chat in support")):
        return (
            "You can ask support questions and get assistance in <#1520460808499363840>.\n"
            "*(Note: <#1520460808499363840> is strictly for support, not for hanging out or casual talking. To hang out and chat with members, head over to <#1520461481857122485>!)*"
        )

    # 8. Media Showcase
    if any(k in p for k in ("media showcase", "where to post media", "share images", "post pictures", "media channel", "showcase channel")):
        return (
            "You can share and showcase your media in <#1520461517093343232>.\n"
            "⚠️ **Strict Rule:** Any NSFW content will result in an immediate permanent ban!"
        )

    # 9. Voice Channel / Join to Create VC & Voice Bot
    if p in ("voice bot", "syncink voice", "how does voice bot work", "how to use voice bot", "voice commands", "voice controls"):
        return (
            "**SyncInk Voice Bot** (<@1516578887109181520>) Guide:\n\n"
            "• **Join to Create**: Join <#1520749464569253998> to automatically generate your private voice room.\n"
            "• **Room Settings Menu**: Rename room, set user limits, update status, sync with currently played game, toggle LFM, adjust bitrate, switch region, or toggle temporary text chat.\n"
            "• **Permissions Menu**: Lock/Unlock your room, permit specific members, kick/reject unwanted users, ghost/hide the channel, or transfer ownership."
        )

    if p in ("join to create", "create vc", "voice channel", "voice chat", "join vc", "where is vc", "how to join vc"):
        return "You can join <#1520749464569253998> to automatically generate your own temporary private voice channel."

    # 10. Official Products & Bots
    if any(k in p for k in ("official product", "official products", "what are your products", "what bots", "list of bots", "syncink bots", "product channel")):
        return (
            "You can explore all official SyncInk products and bots in <#1520461321689104486>:\n\n"
            "**Public Service Bots** (<@&1521166171523780688>):\n"
            "• **Ticket Bot** — <@1513075101992747158>\n"
            "• **Voice Bot** — <@1516578887109181520>\n\n"
            "**Private Bot** (<@&1520533971476156469>):\n"
            "• **SyncInk Security Bot** — <@1520522990280769727>\n"
            "> *SyncInk Security protects the community from spam and deletes blacklisted messages.*"
        )

    # 11. Announcements & Updates
    if any(k in p for k in ("where are announcements", "important announcements", "announcements channel")):
        return "Official server announcements and platform updates are posted in <#1520460544811859968>."

    if any(k in p for k in ("bot updates", "where are bot updates", "bot changelog")):
        return "You can check all bot updates, releases, and changelogs in <#1520460505196662836>."

    # 12. FAQ
    if any(k in p for k in ("where is faq", "faq channel", "frequently asked questions")):
        return "You can browse frequently asked questions and answers in <#1520460624864350218>."

    # 13. Discussion
    if any(k in p for k in ("discussion channel", "where to discuss", "discuss topics", "topic discussion")):
        return "You can discuss topics, share ideas, and engage in deeper conversations in <#1520477097494057041>."

    # 14. Welcome
    if any(k in p for k in ("where is welcome", "welcome channel")):
        return "New members arrive and are welcomed in <#1520460456181891102>."

    # 15. Server Roles & Specific Role Inquiries
    if any(k in p for k in (
        "what roles", "what are the roles", "server roles", "roles list", "list of roles",
        "list roles", "tell me roles", "show roles", "who runs the server", "leadership roles",
        "roles here", "what are roles", "roles of the server", "server role structure"
    )) or p == "roles":
        owner_emoji = EmojiManager.get_role_emoji(guild, "owner")
        manager_emoji = EmojiManager.get_role_emoji(guild, "manager")
        dev_emoji = EmojiManager.get_role_emoji(guild, "developer")
        staff_emoji = EmojiManager.get_role_emoji(guild, "staff")
        partner_emoji = EmojiManager.get_role_emoji(guild, "partner")
        verified_emoji = EmojiManager.get_role_emoji(guild, "verified")

        return (
            "Here is the official server role structure and responsibilities:\n\n"
            "**👑 Leadership & Administration**\n"
            f"• {owner_emoji} **Owner**: <@&1520856232460550194>\n"
            "╰ Founder & lead owner of the SyncInk platform and server.\n"
            f"• {manager_emoji} **Manager**: <@&1520854378192572546>\n"
            "╰ Executive management team overseeing community operations, moderation, and team coordination.\n\n"
            "**🛠️ Development & Support Team**\n"
            f"• {dev_emoji} **Developer**: <@&1531882215795855511>\n"
            "╰ Software engineers creating and maintaining SyncInk bots and platforms. *(Apply in <#1539301185423413398>)*\n"
            f"• {staff_emoji} **Staff**: <@&1520466655321522486>\n"
            "╰ Dedicated support & moderation team assisting members and keeping the community safe. *(Apply in <#1539319001673367604>)*\n\n"
            "**🌟 Community & Partnerships**\n"
            f"• {partner_emoji} **Partner**: <@&1551337053185114242>\n"
            "╰ Official community partners and affiliated platform collaborations.\n"
            f"• {verified_emoji} **Verified**: <@&1520871574088056952>\n"
            "╰ Community members who completed verification in <#1520748219100041348>."
        )

    if any(k in p for k in ("staff role", "who are staff", "who is staff", "staff team", "moderator role", "mod role")):
        staff_emoji = EmojiManager.get_role_emoji(guild, "staff")
        return (
            f"• {staff_emoji} **Staff**: <@&1520466655321522486>\n"
            "╰ Dedicated support and moderation team assisting members and enforcing server rules.\n\n"
            "👉 **Want to apply?** Check requirements in <#1539319001673367604> and submit your application!"
        )

    if any(k in p for k in ("manager role", "who is manager", "who are managers", "management role", "who manages")):
        manager_emoji = EmojiManager.get_role_emoji(guild, "manager")
        return (
            f"• {manager_emoji} **Manager**: <@&1520854378192572546>\n"
            "╰ Executive management leadership overseeing server administration, community operations, and team coordination."
        )

    if any(k in p for k in ("developer role", "dev role", "who is developer", "who are developers", "dev team")):
        dev_emoji = EmojiManager.get_role_emoji(guild, "developer")
        return (
            f"• {dev_emoji} **Developer**: <@&1531882215795855511>\n"
            "╰ Software engineers and creators building the SyncInk bots and platform tools.\n\n"
            "👉 **Want to apply?** Check requirements in <#1539301185423413398> and submit the form at [Apply for Developer](https://syncink.github.io/syncink-portfolio/apply-developer)!"
        )

    if any(k in p for k in ("owner role", "who is owner", "who owns the server", "founder role", "server owner")):
        owner_emoji = EmojiManager.get_role_emoji(guild, "owner")
        return (
            f"• {owner_emoji} **Owner**: <@&1520856232460550194>\n"
            "╰ Founder and lead owner of the SyncInk platform and server."
        )

    if any(k in p for k in ("partner role", "partnered role", "who is partner", "how to get partner", "partnership")):
        partner_emoji = EmojiManager.get_role_emoji(guild, "partner")
        return (
            f"• {partner_emoji} **Partner**: <@&1551337053185114242>\n"
            "╰ Granted to official server partners and affiliated communities collaborating with SyncInk."
        )

    if any(k in p for k in ("verified role", "verified members role", "member role", "how to get member role", "how to get verified role", "verify role")):
        verified_emoji = EmojiManager.get_role_emoji(guild, "verified")
        return (
            f"• {verified_emoji} **Verified**: <@&1520871574088056952>\n"
            "╰ Granted to all community members upon verifying at the security checkpoint.\n\n"
            "👉 Complete verification in <#1520748219100041348> to unlock server access!"
        )

    return None


class ChatGPT(commands.Cog):
    """SyncInk AI Assistant: Server Guide, FAQ Resolver, Web-Connected & Conversational Memory."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        env_chan = os.getenv("AI_CHANNEL_ID")
        self.ai_channel_id = int(env_chan) if env_chan and env_chan.isdigit() else DEFAULT_AI_CHANNEL_ID
        self.cached_model = None
        self.cached_gemini_model = None
        
        # Conversation memory buffer: (guild_id, user_id) -> deque of (role, text, timestamp)
        # Keeps up to 10 previous conversational turns so the bot never forgets context
        self.conversation_memory = defaultdict(lambda: deque(maxlen=10))
        self.MEMORY_TTL_SECONDS = 3600  # 1 hour active conversation memory window

        # Response cache for repeated queries: normalized_query -> (response_text, used_web, timestamp)
        self.response_cache = {}
        self.CACHE_TTL_SECONDS = 180  # 3 minutes cache TTL

        # 1-minute AI cooldown per user: user_id -> timestamp
        self.user_cooldowns = {}
        self.COOLDOWN_SECONDS = 60

    def has_any_api_key(self) -> bool:
        return bool(self.openrouter_key or self.gemini_key or self.openai_key)

    def get_remaining_cooldown(self, user_id: int) -> Optional[float]:
        """Returns remaining cooldown seconds if user is within the 1-minute window, else None."""
        now = time.time()
        last = self.user_cooldowns.get(user_id)
        if last is not None and (now - last) < self.COOLDOWN_SECONDS:
            return self.COOLDOWN_SECONDS - (now - last)
        return None

    def trigger_cooldown(self, user_id: int):
        """Records the timestamp when user requested AI assistance."""
        self.user_cooldowns[user_id] = time.time()

    def get_cached_response(self, prompt: str) -> Optional[Tuple[str, bool]]:
        """Returns cached response if the identical question was asked recently."""
        norm = prompt.lower().strip().rstrip("?!. ")
        if norm in self.response_cache:
            res, used_web, ts = self.response_cache[norm]
            if (time.time() - ts) <= self.CACHE_TTL_SECONDS:
                return res, used_web
            else:
                del self.response_cache[norm]
        return None

    def cache_response(self, prompt: str, response: str, used_web: bool):
        """Caches a successful answer to absorb burst identical questions without consuming quota."""
        norm = prompt.lower().strip().rstrip("?!. ")
        self.response_cache[norm] = (response, used_web, time.time())
        # Keep cache size bounded
        if len(self.response_cache) > 200:
            cutoff = time.time() - self.CACHE_TTL_SECONDS
            self.response_cache = {k: v for k, v in self.response_cache.items() if v[2] > cutoff}

    def get_valid_history(self, guild_id: int, user_id: int) -> List[Tuple[str, str]]:
        """Extracts active recent conversational turns for a user within the TTL window."""
        now = time.time()
        raw_deque = self.conversation_memory.get((guild_id, user_id))
        if not raw_deque:
            return []

        valid = []
        for role, text, ts in raw_deque:
            if (now - ts) <= self.MEMORY_TTL_SECONDS:
                valid.append((role, text))
        return valid

    def record_exchange(self, guild_id: int, user_id: int, user_text: str, assistant_text: str):
        """Saves user question and assistant answer into memory buffer."""
        now = time.time()
        buf = self.conversation_memory[(guild_id, user_id)]
        buf.append(("user", user_text, now))
        buf.append(("assistant", assistant_text, now))

    async def get_model(self) -> str:
        """Fetch an optimal free/available model from OpenRouter."""
        if self.cached_model:
            return self.cached_model

        if not self.openrouter_key:
            return "google/gemini-2.0-flash-exp:free"

        headers = {"Authorization": f"Bearer {self.openrouter_key}"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("https://openrouter.ai/api/v1/models", headers=headers, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "data" in data and len(data["data"]) > 0:
                            preferred = ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free", "google/gemma-4-26b-a4b-it:free"]
                            available_ids = [m["id"] for m in data["data"]]
                            for pref in preferred:
                                if pref in available_ids:
                                    self.cached_model = pref
                                    return self.cached_model

                            free_models = [m["id"] for m in data["data"] if ":free" in m["id"] or m.get("pricing", {}).get("prompt", "1") in ["0", "0.0"]]
                            if free_models:
                                self.cached_model = free_models[0]
                            else:
                                self.cached_model = data["data"][0]["id"]
                            return self.cached_model
        except Exception as e:
            log.error(f"Failed to fetch OpenRouter models: {e}")

        return "google/gemini-2.0-flash-exp:free"

    async def call_openrouter(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]], use_web_plugin: bool = False) -> str:
        model_id = await self.get_model()
        headers = {
            "Authorization": f"Bearer {self.openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/SyncInk/SyncInk-Support-Bot",
            "X-Title": "SyncInk Support Bot"
        }

        messages = [{"role": "system", "content": system_prompt}]
        for role, text in history:
            messages.append({"role": "user" if role == "user" else "assistant", "content": text})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model_id,
            "messages": messages,
            "max_tokens": 1500,
            "temperature": 0.7
        }
        if use_web_plugin:
            payload["plugins"] = [{"id": "web"}]

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                    if response.status != 200:
                        text = await response.text()
                        log.warning(f"OpenRouter API Error (HTTP {response.status}): {text}")
                        return None

                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.warning(f"OpenRouter connection failed: {e}")
            return None

    async def get_gemini_models(self) -> List[str]:
        fallback_candidates = [
            "models/gemini-2.0-flash",
            "models/gemini-2.0-flash-lite",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-8b",
            "models/gemini-1.5-pro",
        ]

        if self.cached_gemini_model:
            return [self.cached_gemini_model] + [m for m in fallback_candidates if m != self.cached_gemini_model]

        # 1. Try dynamic auto-discovery from Google API
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.gemini_key}"
            headers = {"x-goog-api-key": self.gemini_key}
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        available = data.get("models", [])
                        
                        # Disallowed terms: Audio/TTS/Embedding/Vision-only/Robotics and deprecated models
                        excluded_terms = [
                            "tts", "audio", "embed", "imagen", "transcription",
                            "realtime", "aqa", "robotics", "computer-use",
                            "gemini-pro", "gemini-1.0-pro"
                        ]
                        
                        gen_models = []
                        for m in available:
                            name = m.get("name", "")
                            # Must support generateContent
                            if "generateContent" not in m.get("supportedGenerationMethods", []):
                                continue
                            # Exclude specialized or deprecated endpoints
                            if any(term in name.lower() for term in excluded_terms):
                                continue
                            # If output modalities specified, ensure TEXT is supported
                            if "outputModalities" in m:
                                upper_modalities = [mod.upper() for mod in m["outputModalities"]]
                                if "TEXT" not in upper_modalities:
                                    continue
                            gen_models.append(name)
                        
                        if gen_models:
                            def score_model(m_name: str) -> int:
                                n = m_name.lower()
                                if "gemini-2.0-flash" in n and "lite" not in n and "exp" not in n:
                                    return 0
                                if "gemini-2.0-flash-lite" in n:
                                    return 1
                                if "gemini-1.5-flash" in n and "8b" not in n:
                                    return 2
                                if "gemini-1.5-flash-8b" in n:
                                    return 3
                                if "gemini-2.0-flash-exp" in n:
                                    return 4
                                if "gemini-1.5-pro" in n:
                                    return 5
                                if "gemini-2.0-pro" in n:
                                    return 6
                                if "flash" in n:
                                    return 7
                                if "pro" in n:
                                    return 8
                                return 15

                            sorted_models = sorted(gen_models, key=score_model)
                            # Append fallbacks to guarantee robust options
                            combined = sorted_models + [fb for fb in fallback_candidates if fb not in sorted_models]
                            self.cached_gemini_model = combined[0]
                            return combined
        except Exception as e:
            log.warning(f"Could not auto-list Gemini models: {e}")

        return fallback_candidates

    async def call_gemini(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]]) -> Optional[str]:
        models_to_try = await self.get_gemini_models()

        # Build contents with alternating turns
        contents = []
        for role, text in history:
            gemini_role = "user" if role == "user" else "model"
            if contents and contents[-1]["role"] == gemini_role:
                contents[-1]["parts"][0]["text"] += f"\n{text}"
            else:
                contents.append({"role": gemini_role, "parts": [{"text": text}]})

        if not contents or contents[-1]["role"] != "user":
            contents.append({"role": "user", "parts": [{"text": user_prompt}]})
        else:
            contents[-1]["parts"][0]["text"] += f"\n{user_prompt}"

        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents
        }
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.gemini_key
        }

        last_error = "No response received"
        rate_limited_count = 0
        async with aiohttp.ClientSession(headers=headers) as session:
            for model_name in models_to_try:
                # Disallow deprecated endpoints strictly
                if "gemini-pro" in model_name.lower() or "gemini-1.0-pro" in model_name.lower():
                    continue

                clean_model = model_name if model_name.startswith("models/") else f"models/{model_name}"
                url = f"https://generativelanguage.googleapis.com/v1beta/{clean_model}:generateContent?key={self.gemini_key}"
                try:
                    async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                        if response.status == 200:
                            data = await response.json()
                            self.cached_gemini_model = clean_model
                            try:
                                return data["candidates"][0]["content"]["parts"][0]["text"]
                            except (KeyError, IndexError):
                                return None
                        elif response.status == 429:
                            rate_limited_count += 1
                            log.warning(f"Gemini candidate {clean_model} hit rate limit (HTTP 429).")
                            if self.cached_gemini_model == clean_model:
                                self.cached_gemini_model = None
                            if rate_limited_count >= 2:
                                log.warning("Gemini rate limit threshold reached across models. Yielding for fallback provider.")
                                return None
                            await asyncio.sleep(0.5)
                            continue
                        else:
                            text = await response.text()
                            try:
                                err_data = json.loads(text)
                                last_error = err_data.get("error", {}).get("message", text)
                            except Exception:
                                last_error = text
                            log.warning(f"Gemini candidate {clean_model} failed (HTTP {response.status}): {last_error}. Falling back to next candidate...")
                            if self.cached_gemini_model == clean_model:
                                self.cached_gemini_model = None
                            continue
                except Exception as e:
                    last_error = str(e)
                    if self.cached_gemini_model == clean_model:
                        self.cached_gemini_model = None
                    continue

        log.warning(f"All Gemini candidates exhausted. Last error: {last_error}")
        return None

    async def call_openai(self, system_prompt: str, user_prompt: str, history: List[Tuple[str, str]]) -> Optional[str]:
        if not self.openai_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        messages = [{"role": "system", "content": system_prompt}]
        for role, text in history:
            messages.append({"role": "user" if role == "user" else "assistant", "content": text})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "max_tokens": 1500,
            "temperature": 0.7
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=20)) as response:
                    if response.status != 200:
                        text = await response.text()
                        log.warning(f"OpenAI API Error (HTTP {response.status}): {text}")
                        return None
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.warning(f"OpenAI call failed: {e}")
            return None

    async def get_ai_response(self, prompt: str, guild: Optional[discord.Guild] = None, user_id: Optional[int] = None) -> tuple[str, bool]:
        """
        Coordinates server context mapping, conversation history memory,
        real-time web search grounding, response caching, and AI response generation.
        Returns (response_text, used_web_search).
        """
        # 0. Direct Creator & Identity Resolution
        if is_creator_query(prompt):
            server_suffix = f" for **{guild.name}**" if guild else ""
            res = (
                f"I was created and developed by the **SyncInk Development Team**! "
                f"I am the official AI assistant and server guide{server_suffix}."
            )
            res = sanitize_ai_identity(res)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, res)
            return res, False

        # 0.1 Direct Fun Interactive Games Resolution (Truth or Dare, playful prompts)
        fun_res = resolve_fun_interactive(prompt)
        if fun_res:
            fun_res = sanitize_ai_identity(fun_res)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, fun_res)
            return fun_res, False

        # 0.1 Direct Greeting Resolution
        greeting = resolve_greeting(prompt, guild)
        if greeting:
            greeting = sanitize_ai_identity(greeting)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, greeting)
            return greeting, False

        # 0.2 Direct Specific Server Channel & Action Resolution
        specific_faq = resolve_server_faq(prompt, guild)
        if specific_faq:
            specific_faq = sanitize_ai_identity(specific_faq)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, specific_faq)
            return specific_faq, False

        # 0.3 Check Response Cache for identical recent queries
        cached = self.get_cached_response(prompt)
        if cached:
            cached_res, cached_used_web = cached
            cached_res = sanitize_ai_identity(cached_res)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, cached_res)
            return cached_res, cached_used_web

        if not self.has_any_api_key():
            msg = (
                "**SyncInk AI Assistant requires an API key in your `.env` file!**\n\n"
                "Please configure one of the following in Termux `.env`:\n"
                "• `GEMINI_API_KEY=your_key` *(Free keys at https://aistudio.google.com/)*\n"
                "• OR `OPENROUTER_API_KEY=your_key` *(Free models at https://openrouter.ai/)*\n"
                "• OR `OPENAI_API_KEY=your_key`\n\n"
                "After adding the key, restart the bot to activate AI features."
            )
            return msg, False

        # 1. Server Context Mapping
        server_context = ""
        if guild:
            settings = await SettingsService.get_guild_settings(guild.id) if SettingsService else None
            server_context = build_server_guide_context(guild, settings)

        # 2. Conversation Memory History
        history = []
        if guild and user_id:
            history = self.get_valid_history(guild.id, user_id)

        # 3. Live Internet Search Grounding
        used_web = False
        search_prompt_context = ""
        if WebSearchService.should_search_web(prompt):
            search_results = await WebSearchService.search(prompt, max_results=3)
            if search_results:
                used_web = True
                search_prompt_context = WebSearchService.format_for_prompt(search_results, prompt)

        # 4. Assemble System Prompt
        guild_name = guild.name if guild else "the server"
        owner_emoji = EmojiManager.get_role_emoji(guild, "owner")
        manager_emoji = EmojiManager.get_role_emoji(guild, "manager")
        dev_emoji = EmojiManager.get_role_emoji(guild, "developer")
        staff_emoji = EmojiManager.get_role_emoji(guild, "staff")
        partner_emoji = EmojiManager.get_role_emoji(guild, "partner")
        verified_emoji = EmojiManager.get_role_emoji(guild, "verified")

        system_prompt = (
            f"You are **SyncInk Assistant**, the official AI companion and intelligence assistant for {guild_name}.\n\n"
            "CORE INSTRUCTIONS & ADAPTIVE INTELLIGENCE:\n"
            "1. **ANSWER EVERY QUESTION DIRECTLY & ACCURATELY**:\n"
            "   - You MUST answer every question asked by users. Never refuse, avoid, or deflect inquiries.\n"
            "   - Whether the query is about programming, algorithms, software development, Discord bot design, server administration, mathematics, physics, science, gaming (e.g. GTA 6), movies, tech, history, life advice, or general trivia, deliver a high-quality, comprehensive, and accurate response directly addressing what was asked.\n"
            "   - **NEVER** recite generic server navigation introductions ('I am SyncInk Assistant, here to navigate...') unless the user explicitly asks for server navigation or channel help.\n"
            "2. **DISCORD-STYLE PROFESSIONAL & SHORT MESSAGES**:\n"
              "   - Format all responses using crisp Discord Markdown! Extensively use headings (`# Heading 1`, `## Heading 2`), bold text (`**bold**`), and typewriter code blocks (`` `inline` `` or triple backticks) to make your output highly styled and professional.\n"
            "   - Keep messages short, structured, professional, and directly to the point. Avoid conversational filler, wordy apologies, or repeating the user's prompt.\n"
            "3. **INCIDENT REPORTING & TICKET HANDLING (CRITICAL)**:\n"
            "   - When a member asks to write, draft, or submit a report for an incident (e.g. someone in general chat posting NSFW photos, harassment, toxicity, bot abuse, unauthorized advertising):\n"
            "     • Do NOT deflect or tell them to 'hang out in general chat'.\n"
            "     • Cite the official violated rule: **Rule 8 (Enforcement Policy & Zero Tolerance)** and **Media Showcase Policy (Strictly NO NSFW)**.\n"
            "     • Provide a clean, structured incident report template ready for copy-pasting:\n"
            "       📋 **Incident Report**\n"
            "       • **Category:** Account & Server (<:accsvr:1553532858058936424>)\n"
            "       • **Reported User:** `[User Mention / Username / User ID]`\n"
            "       • **Channel:** <#1520461481857122485> (General Chat)\n"
            "       • **Rule Violated:** Rule 8 & Zero-Tolerance NSFW Policy\n"
            "       • **Details:** `[User posted unauthorized/NSFW images in chat]`\n"
            "       • **Evidence:** `[Attach screenshot or message link in thread]`\n"
            "     • Direct them clearly through the exact ticket process:\n"
            "       1. Head to <#1520460764937322566> (**Support Requests**).\n"
            "       2. Select <:accsvr:1553532858058936424> **Account & Server** from the category menu.\n"
            "       3. A modal window pops up where they **MUST write their issue / description**.\n"
            "       4. The bot creates a **Private Thread** inside <#1520460764937322566> for them and staff.\n"
            "       5. Post screenshots/evidence in the thread, and **wait patiently until any staff member claims it** (`📝 Claim`).\n"
            "4. **SYNCINK TICKET BOT KNOWLEDGE & CATEGORIES**:\n"
            "   - Ticket Bot (<@1513075101992747158>) manages support tickets in <#1520460764937322566>.\n"
            "   - Support Categories & Custom Emojis (CRITICAL: NEVER wrap emojis in backticks; output directly in plain text so Discord renders them as visual graphics, not typewriter code font):\n"
            "     • <:SyncProductSupport:1553532855278116956> **Product Support (Primary)**: Help with any SyncInk product, setup, configuration, or troubleshooting.\n"
            "     • <:accsvr:1553532858058936424> **Account & Server**: Appeals, account issues, verification problems, user reports (e.g. reporting NSFW in chat, toxicity, rule breaks), or server concerns.\n"
            "     • <:bugreport:1553532860408012850> **Bug Report**: Report bugs to developers.\n"
            "     • <:staffabuse:1553532862945562754> **Staff Abuse**: Report misbehaving staff to admins & owner.\n"
            "     • <:others:1553533697364598814> **Other**: Inquiries not listed above.\n"
            "     • <:SyncPartnership:1553532869950046340> **Partnership / Business**: Business inquiries, collaborations, sponsorships, or partnership requests.\n"
            "   - Ticket Flow:\n"
            "     • Selecting a category opens a modal where the user **MUST write their issue**.\n"
            "     • The bot generates a **Private Thread** specifically for the user and staff.\n"
            "     • The user must **wait patiently until any staff claims it** (via the `📝 Claim` button).\n"
            "     • Controls: `🔒 Close` (with modal and HTML transcript), `🔄 Transfer`, `📝 Claim`.\n"
            "5. **SYNCINK VOICE BOT KNOWLEDGE**:\n"
            "   - Voice Bot (<@1516578887109181520>) powers temporary voice rooms via <#1520749464569253998>.\n"
            "   - Room Settings: Rename, Limit (0-99), Status topic, Game sync, LFM broadcast, Bitrate, Region, Text chat, NSFW, Claim.\n"
            "   - Room Permissions: Lock, Unlock, Permit, Reject, Invite, Ghost (hide), Unghost (reveal), Transfer.\n"
            "   - Buttons: Load Settings, Refresh Panel, Dashboard.\n"
            "6. **SUPPORT SERVER RULES & WEBSITE DOCUMENTATION (<#1520460587522330634>)**:\n"
            "   - Rule 1: Verification Required (<#1520748219100041348>).\n"
            "   - Rule 2: Professional Conduct & Respect (No harassment, hate speech, bullying, toxicity).\n"
            "   - Rule 3: Keep Discussions Relevant (General: <#1520461481857122485>, Tickets: <#1520460764937322566>, Support: <#1520460808499363840>, Suggestions: <#1546548728721178724>).\n"
            "   - Rule 4: Zero Tolerance for Spam (No repeated messages, pings, mass emojis).\n"
            "   - Rule 5: No Advertising or Self-Promotion (No unauthorized promos or DM advertising).\n"
            "   - Rule 6: Security & Responsible Use (No exploits, malware, or phishing; report bugs via ticket).\n"
            "   - Rule 7: Respect Staff Decisions (Appeals/questions must go through private tickets).\n"
            "   - Rule 8: Enforcement Policy (Warnings -> Timeouts -> Bans; severe violations like NSFW result in immediate permanent ban).\n"
            "   - Media Showcase Policy: Strictly NO NSFW content in <#1520461517093343232>.\n"
            "   - Rules for Use of AI: 1-minute rate limit per member, strictly NO prompt injection, DAN exploits, or jailbreaking attempts. All interactions, Truth or Dare games, and roleplay must strictly remain clean, PG-13, and family-friendly. AI queries belong in <#1544361954574073916> or via `/ask`.\n"
              "   - Official Website: Base URL is `https://syncink.site`. Provide users exact links by appending `/rules`, `/faq`, `/terms` (Unified Legal Hub), `/privacy` (Unified Data Policy), or `/dashboard` (Multi-Bot Console).\n"
            "7. **CHARISMATIC & ENJOYABLE TONE FOR CASUAL INQUIRIES**:\n"
            "   - When engaging in casual conversation, banter, gaming chats, or community games:\n"
            "     • Be friendly, charismatic, and fun to interact with!\n"
            "     • Keep it 'in limit': clean, respectful, PG-13, no toxicity, no offensive language.\n"
            "8. **IDENTITY & ORIGIN**:\n"
            "   - If (and ONLY if) someone explicitly asks who created, built, or developed you ('who made you', 'who created you', 'who is your developer'): proudly state that you were created and developed by the **SyncInk Development Team**!\n"
            "   - Do NOT inject this creator disclaimer into unrelated questions or general discussions.\n"
            "9. **SERVER GUIDELINES & NAVIGATION (ONLY WHEN EXPLICITLY ASKED)**:\n"
            "   - When asked where to do something in {guild_name}, specify ONLY that relevant channel with clickable Discord format (`<#channel_id>`):\n"
            "     • Casual chat & hanging out: General Chat (<#1520461481857122485>).\n"
            "     • Technical support & assistance: Support Chat (<#1520460808499363840>) or Support Ticket (<#1520460764937322566>).\n"
            "     • Rules and policies: <#1520460587522330634>.\n"
            "     • Feature suggestions: <#1546548728721178724>.\n"
            "   - Do not dump the entire server channel directory unless explicitly asked for 'all channels' or 'server directory'.\n"
            "10. **ROLES PRESENTATION (WHEN ASKED)**:\n"
            "   - When asked about server roles, format them cleanly in category groups with custom emojis:\n"
            "     • Leadership & Administration:\n"
            f"       - Owner: {owner_emoji} <@&1520856232460550194> (Server Owner & SyncInk Founder)\n"
            f"       - Manager: {manager_emoji} <@&1520854378192572546> (Management & Operations)\n"
            "     • Development & Support Team:\n"
            f"       - Developer: {dev_emoji} <@&1531882215795855511> (Apply in <#1539301185423413398>)\n"
            f"       - Staff: {staff_emoji} <@&1520466655321522486> (Apply in <#1539319001673367604>)\n"
            "     • Community & Partnerships:\n"
            f"       - Partner: {partner_emoji} <@&1551337053185114242> (Partnered servers & collabs)\n"
            f"       - Verified: {verified_emoji} <@&1520871574088056952> (Verify in <#1520748219100041348>)\n"
        )
        if server_context:
            system_prompt += f"--- SERVER STRUCTURE & CHANNELS ---\n{server_context}\n\n"
        if search_prompt_context:
            system_prompt += f"--- LIVE INTERNET SEARCH GROUNDING ---\n{search_prompt_context}\n\n"

        # 5. Dispatch to Available AI Providers with Multi-Tier Fallback
        res = None
        try:
            # Tier 1: Google Gemini (if configured)
            if self.gemini_key:
                res = await self.call_gemini(system_prompt, prompt, history)

            # Tier 2: OpenRouter (Fallback if Gemini was unavailable or rate-limited)
            if not res and self.openrouter_key:
                log.info("Gemini unavailable or rate-limited; falling back to OpenRouter...")
                res = await self.call_openrouter(system_prompt, prompt, history, use_web_plugin=False)

            # Tier 3: OpenAI (Fallback if Gemini & OpenRouter are unavailable)
            if not res and self.openai_key:
                log.info("Falling back to OpenAI...")
                res = await self.call_openai(system_prompt, prompt, history)

            # Polite busy fallback if all providers are rate-limited or busy
            if not res:
                busy_msg = (
                    "I'm currently receiving a high volume of questions and my capacity is temporarily busy. ⏳\n\n"
                    "Please try asking again in a few seconds! In the meantime, you can check:\n"
                    "• 📜 Server Rules & Guidelines: <#1520460587522330634>\n"
                    "• ❓ Frequently Asked Questions: <#1520460624864350218>\n"
                    "• 💬 General Chat: <#1520461481857122485>\n"
                    "• 🎫 Support Tickets: <#1520460764937322566>"
                )
                return busy_msg, False

            # 6. Sanitize identity, record conversation memory, and cache response
            res = sanitize_ai_identity(res)
            if guild and user_id:
                self.record_exchange(guild.id, user_id, prompt, res)

            self.cache_response(prompt, res, used_web)

            return res, used_web
        except Exception as e:
            log.error(f"Error executing AI query: {e}")
            fallback_msg = (
                "I'm currently handling a lot of inquiries right now. ⏳\n\n"
                "Please try asking again in a few seconds! If you need immediate assistance, feel free to check <#1520460624864350218> (FAQ) or open a ticket in <#1520460764937322566>."
            )
            return fallback_msg, False

    async def generate_truth_or_dare(self, mode: str, author: discord.User, guild: Optional[discord.Guild] = None) -> discord.Embed:
        """
        Dynamically generates an original, thought-provoking Truth question or creative Dare challenge,
        styled identically to the community Truth or Dare design (Spiderweb/Lightning title, purple accent, requester footer).
        """
        if mode == "random":
            mode = random.choice(["truth", "dare"])

        ai_prompt = (
            f"Generate ONE deeply thought-provoking, unique, and intriguing {mode.upper()} prompt for Discord.\n"
            "STRICT RULES:\n"
            "1. It MUST NOT be a cliché or common internet question (avoid generic tropes like 'what's your favorite color', 'who is your crush', 'have you ever lied').\n"
            "2. For TRUTH: Make it psychologically deep, philosophical, unexpected, or revealing about human nature, personal principles, or hidden fears.\n"
            "3. For DARE: Make it witty, creative, entertaining, and Discord-friendly (e.g. typing challenge, playful server message, dramatic roleplay) without violating server rules.\n"
            "4. Return ONLY the question/dare itself in 1 concise sentence. Do not include quotes, prefixes like 'Truth:', markdown asterisks, or any extra text."
        )

        content = None
        # Try dynamic generation via available AI models
        try:
            if self.gemini_key:
                content = await self.call_gemini("You generate elite, original Truth or Dare prompts. Output raw prompt text only.", ai_prompt, [])
            elif self.openrouter_key:
                content = await self.call_openrouter("You generate elite, original Truth or Dare prompts. Output raw prompt text only.", ai_prompt, [])
            elif self.openai_key:
                content = await self.call_openai("You generate elite, original Truth or Dare prompts. Output raw prompt text only.", ai_prompt, [])
        except Exception as e:
            log.warning(f"AI generation for truth/dare failed: {e}")

        # Clean AI output if received
        if content:
            content = content.strip().strip('"').strip("'").strip("*").strip()
            content = re.sub(r'^(?:truth|dare)\s*:\s*', '', content, flags=re.IGNORECASE).strip()
            if len(content) > 300:
                content = content[:300]

        # Robust offline fallback pool if AI call fails or is empty
        if not content:
            if mode == "truth":
                content = random.choice(DYNAMIC_TRUTH_QUESTIONS)
            else:
                content = random.choice(DYNAMIC_DARE_CHALLENGES)

        if mode == "truth":
            title = "🕸️ Truth"
        else:
            title = "⚡ Dare"

        # Color: Purple accent matching SyncInk violet theme (0x79529C)
        embed = discord.Embed(
            title=title,
            description=f"**{content}**",
            color=discord.Color(0x79529C)
        )
        embed.set_footer(
            text=f"requested by {author.name}",
            icon_url=author.display_avatar.url
        )
        return embed

    # -------------------------------------------------------------
    # LISTENERS & COMMANDS
    # -------------------------------------------------------------

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return

        # Restrict to designated AI channel if set
        if self.ai_channel_id and message.channel.id != self.ai_channel_id:
            return

        is_reply = False
        if message.reference and message.reference.resolved:
            if getattr(message.reference.resolved, 'author', None) == self.bot.user:
                is_reply = True

        if self.bot.user in message.mentions or is_reply:
            prompt = message.content.replace(f'<@{self.bot.user.id}>', '').replace(f'<@!{self.bot.user.id}>', '').strip()
            if prompt.lower().startswith("ask "):
                prompt = prompt[4:].strip()
            elif prompt.lower().startswith("ai "):
                prompt = prompt[3:].strip()
            if not prompt:
                return

            remaining = self.get_remaining_cooldown(message.author.id)
            if remaining is not None:
                try:
                    await message.delete()
                except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                    pass
                try:
                    rem_str = "1min" if remaining >= 55 else f"{int(remaining)}s"
                    warning_embed = discord.Embed(
                        description=f"<a:syncwarning:1547034231438319616> **Cooldown: `{rem_str}`**",
                        color=WARNING_COLOR
                    )
                    await message.channel.send(embed=warning_embed, delete_after=5)
                except (discord.Forbidden, discord.HTTPException):
                    pass
                return

            self.trigger_cooldown(message.author.id)

            game_mode = get_interactive_game_mode(prompt)
            if game_mode:
                try:
                    async with message.channel.typing():
                        embed = await self.generate_truth_or_dare(game_mode, message.author, message.guild)
                        await message.reply(embed=embed, mention_author=False)
                    return
                except Exception as e:
                    log.error(f"Error handling truth/dare mention: {e}")

            try:
                async with message.channel.typing():
                    response, used_web = await self.get_ai_response(prompt, message.guild, message.author.id)
                    desc = response[:4000] + "..." if len(response) > 4000 else response

                    embed = SyncInkEmbed(
                        title=f"{Emojis.AI} **SyncInk Assistant**",
                        description=desc,
                        color=BRAND_ACCENT
                    )
                    if used_web:
                        embed.set_footer(text="SyncInk Platform | Grounded with Live Web Search 🌐", icon_url="https://files.catbox.moe/74l9su.png")
                    else:
                        embed.set_footer(text="SyncInk Platform | Server Guide & AI Assistant", icon_url="https://files.catbox.moe/74l9su.png")

                    await message.reply(embed=embed, mention_author=False)
            except Exception as e:
                log.error(f"Error handling AI mention: {e}")
                await message.reply(f"An error occurred while generating a response: `{e}`", mention_author=False)

    @commands.command(name="ask", aliases=["ai", "helpme"], description="Ask SyncInk AI Assistant any question, server guide query, or live internet search.")
    async def ask(self, ctx: commands.Context, *, question: str = None):
        if self.ai_channel_id and ctx.channel.id != self.ai_channel_id:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            try:
                warning_embed = discord.Embed(
                    description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                    color=WARNING_COLOR
                )
                await ctx.send(embed=warning_embed, delete_after=6)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        if not question:
            await ctx.send("Please provide a question for the assistant! Usage: `?ask <question>`")
            return

        q_clean = question.strip()
        if q_clean.lower().startswith("ask "):
            q_clean = q_clean[4:].strip()
        elif q_clean.lower().startswith("ai "):
            q_clean = q_clean[3:].strip()
        if not q_clean:
            await ctx.send("Please provide a question for the assistant! Usage: `?ask <question>`")
            return
        question = q_clean

        remaining = self.get_remaining_cooldown(ctx.author.id)
        if remaining is not None:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            try:
                rem_str = "1min" if remaining >= 55 else f"{int(remaining)}s"
                warning_embed = discord.Embed(
                    description=f"<a:syncwarning:1547034231438319616> **Cooldown: `{rem_str}`**",
                    color=WARNING_COLOR
                )
                await ctx.send(embed=warning_embed, delete_after=5)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        self.trigger_cooldown(ctx.author.id)

        game_mode = get_interactive_game_mode(question)
        if game_mode:
            try:
                async with ctx.typing():
                    embed = await self.generate_truth_or_dare(game_mode, ctx.author, ctx.guild)
                    await ctx.reply(embed=embed, mention_author=False)
                return
            except Exception as e:
                log.error(f"Error handling ?ask truth/dare: {e}")

        try:
            async with ctx.typing():
                response, used_web = await self.get_ai_response(question, ctx.guild, ctx.author.id)
                desc = response[:4000] + "..." if len(response) > 4000 else response

                embed = SyncInkEmbed(
                    title=f"{Emojis.AI} **SyncInk Assistant**",
                    description=desc,
                    color=BRAND_ACCENT
                )
                if used_web:
                    embed.set_footer(text="SyncInk Platform | Grounded with Live Web Search 🌐", icon_url="https://files.catbox.moe/74l9su.png")
                else:
                    embed.set_footer(text="SyncInk Platform | Server Guide & AI Assistant", icon_url="https://files.catbox.moe/74l9su.png")

                await ctx.reply(embed=embed, mention_author=False)
        except Exception as e:
            log.error(f"Error handling ?ask command: {e}")
            await ctx.reply(f"An error occurred while generating a response: `{e}`", mention_author=False)

    @app_commands.command(name="ask", description="Ask SyncInk AI Assistant any question, server guide query, or web search.")
    @app_commands.describe(question="The question or server inquiry to ask the assistant")
    async def slash_ask(self, interaction: discord.Interaction, question: str):
        if self.ai_channel_id and interaction.channel_id != self.ai_channel_id:
            warning_embed = discord.Embed(
                description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                color=WARNING_COLOR
            )
            await interaction.response.send_message(embed=warning_embed, ephemeral=True)
            return

        remaining = self.get_remaining_cooldown(interaction.user.id)
        if remaining is not None:
            rem_str = "1min" if remaining >= 55 else f"{int(remaining)}s"
            warning_embed = discord.Embed(
                description=f"<a:syncwarning:1547034231438319616> **Cooldown: `{rem_str}`**",
                color=WARNING_COLOR
            )
            await interaction.response.send_message(embed=warning_embed, ephemeral=True)
            return

        self.trigger_cooldown(interaction.user.id)

        q_clean = question.strip()
        if q_clean.lower().startswith("ask "):
            q_clean = q_clean[4:].strip()
        elif q_clean.lower().startswith("ai "):
            q_clean = q_clean[3:].strip()
        question = q_clean or question

        game_mode = get_interactive_game_mode(question)
        if game_mode:
            await interaction.response.defer()
            try:
                embed = await self.generate_truth_or_dare(game_mode, interaction.user, interaction.guild)
                await interaction.followup.send(embed=embed)
                return
            except Exception as e:
                log.error(f"Error handling /ask truth/dare: {e}")

        await interaction.response.defer()
        try:
            response, used_web = await self.get_ai_response(question, interaction.guild, interaction.user.id)
            desc = response[:4000] + "..." if len(response) > 4000 else response

            embed = SyncInkEmbed(
                title=f"{Emojis.AI} **SyncInk Assistant**",
                description=desc,
                color=BRAND_ACCENT
            )
            if used_web:
                embed.set_footer(text="SyncInk Platform | Grounded with Live Web Search 🌐", icon_url="https://files.catbox.moe/74l9su.png")
            else:
                embed.set_footer(text="SyncInk Platform | Server Guide & AI Assistant", icon_url="https://files.catbox.moe/74l9su.png")

            await interaction.followup.send(embed=embed)
        except Exception as e:
            log.error(f"Error handling /ask command: {e}")
            await interaction.followup.send(f"An error occurred while generating a response: `{e}`", ephemeral=True)

    @commands.command(name="resetai", aliases=["clearai"], description="Reset your AI conversation history to start a new topic.")
    async def reset_ai(self, ctx: commands.Context):
        if self.ai_channel_id and ctx.channel.id != self.ai_channel_id:
            try:
                await ctx.message.delete()
            except (discord.Forbidden, discord.NotFound, discord.HTTPException):
                pass
            try:
                warning_embed = discord.Embed(
                    description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                    color=WARNING_COLOR
                )
                await ctx.send(embed=warning_embed, delete_after=6)
            except (discord.Forbidden, discord.HTTPException):
                pass
            return

        if ctx.guild:
            self.conversation_memory.pop((ctx.guild.id, ctx.author.id), None)
        try:
            await ctx.message.delete()
        except Exception:
            pass
        embed = SuccessEmbed("Your AI conversation history has been cleared. You are starting a fresh conversation!")
        await ctx.send(embed=embed, delete_after=6)

    @app_commands.command(name="resetai", description="Reset your AI conversation memory and start fresh.")
    async def slash_reset_ai(self, interaction: discord.Interaction):
        if self.ai_channel_id and interaction.channel_id != self.ai_channel_id:
            warning_embed = discord.Embed(
                description=f"<a:syncwarning:1547034231438319616> | **This command can only be used in <#{self.ai_channel_id}>!**",
                color=WARNING_COLOR
            )
            await interaction.response.send_message(embed=warning_embed, ephemeral=True)
            return

        if interaction.guild:
            self.conversation_memory.pop((interaction.guild.id, interaction.user.id), None)
        embed = SuccessEmbed("Your AI conversation history has been cleared. You are starting a fresh conversation!")
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(ChatGPT(bot))
