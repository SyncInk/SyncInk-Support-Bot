import discord
from discord.ext import commands
import datetime
from utils.logger import log
from database import db

STAFF_CHANNEL_ID = 1538896833852481556
DEV_CHANNEL_ID = 1538896901007736872
TARGET_GUILD_ID = 1520457643842342912
SUPPORT_MANAGER_ROLE_ID = 1520854378192572546

class ApplicationNotifier:
    """
    Direct Discord Bot Application Notification Dispatcher.
    Replaces incoming webhooks with authenticated Discord bot gateway delivery.
    """

    @staticmethod
    async def process_notification(bot: commands.Bot, app_id: int) -> bool:
        """
        Dispatches a rich Discord embed to the appropriate staff or developer
        channel via the bot instance with exact custom emojis and formatting.
        """
        try:
            app = await db.fetchrow("SELECT * FROM member_applications WHERE id = $1", app_id)
            if not app:
                log.warning(f"[ApplicationNotifier] Application #{app_id} not found in database.")
                return False

            app_type = (app.get("app_type") or "staff").lower()
            channel_id = DEV_CHANNEL_ID if app_type == "developer" else STAFF_CHANNEL_ID

            # Resolve target channel
            channel = bot.get_channel(channel_id)
            if not channel:
                try:
                    channel = await bot.fetch_channel(channel_id)
                except Exception as e:
                    log.error(f"[ApplicationNotifier] Failed to fetch channel {channel_id}: {e}")
                    return False

            # Format timestamp
            created_at = app.get("created_at") or datetime.datetime.utcnow()
            if isinstance(created_at, str):
                try:
                    created_at = datetime.datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except Exception:
                    created_at = datetime.datetime.utcnow()
            formatted_date = created_at.strftime("%d/%m/%Y %H:%M")

            user_id = app.get("user_id")
            username = app.get("username") or f"user_{user_id}"
            age = app.get("age") or "N/A"
            timezone = app.get("timezone") or "N/A"

            color = 0x5865F2  # Discord Blurple / Brand Blue

            if app_type == "developer":
                embed = discord.Embed(
                    title="<:sync_developer:1526607083070554192> New Developer Application",
                    color=color
                )
                # Row 1: Discord ID, Age, Region (inline)
                embed.add_field(
                    name="<:discord:1562536262622118119> Discord ID",
                    value=f"<@{user_id}> ( {user_id} )",
                    inline=True
                )
                embed.add_field(
                    name="<:birthday:1562536325016592434> Age",
                    value=f"`{age}`",
                    inline=True
                )
                embed.add_field(
                    name="<a:syncearthblurple:1519008181550842008> Region",
                    value=f"`{timezone}`",
                    inline=True
                )

                # Languages/Tech
                langs = app.get("languages") or "Not provided"
                embed.add_field(
                    name="<:staff:1513328514529624185> Languages/Tech",
                    value=f"```\n{langs}\n```" if "\n" in langs else f"`{langs}`",
                    inline=False
                )

                # Portfolio/GitHub
                portfolio = app.get("portfolio") or "None"
                embed.add_field(
                    name="<:github:1562536214857261236> Portfolio/GitHub",
                    value=f"{portfolio}",
                    inline=False
                )

                # Bot Experience
                bot_exp = app.get("bot_experience") or "None"
                embed.add_field(
                    name="🤖 Bot Experience",
                    value=f">>> {bot_exp[:1000]}",
                    inline=False
                )

                # Complex Feature Built
                complex_feats = app.get("complex_features") or "None"
                embed.add_field(
                    name="<:buildbadge:1272962807431823380> Complex Feature Built",
                    value=f">>> {complex_feats[:1000]}",
                    inline=False
                )

            else:
                # Staff application
                embed = discord.Embed(
                    title="<:staff:1513328514529624185> New Staff Application",
                    color=color
                )
                # Row 1: Discord ID, Age, Region (inline)
                embed.add_field(
                    name="<:discord:1562536262622118119> Discord ID",
                    value=f"<@{user_id}>\n( {user_id} )",
                    inline=True
                )
                embed.add_field(
                    name="<:birthday:1562536325016592434> Age",
                    value=f"`{age}`",
                    inline=True
                )
                embed.add_field(
                    name="<a:syncearthblurple:1519008181550842008> Region",
                    value=f"`{timezone}`",
                    inline=True
                )

                # Availability
                avail = app.get("availability") or "Not specified"
                embed.add_field(
                    name="⏰ Availability",
                    value=f"`{avail}`",
                    inline=False
                )

                # Why Join?
                reason = app.get("reason") or "Not provided"
                embed.add_field(
                    name="❓ Why join?",
                    value=f">>> {reason[:1000]}",
                    inline=False
                )

                # Experience
                exp = app.get("experience") or "Not provided"
                embed.add_field(
                    name="📓 Experience",
                    value=f">>> {exp[:1000]}",
                    inline=False
                )

                # Scenario 1: Spam Bypass
                scen1 = app.get("scenario_1") or "N/A"
                embed.add_field(
                    name="❗ Scenario 1: Spam Bypass",
                    value=f">>> {scen1[:1000]}",
                    inline=False
                )

                # Scenario 2: Argument
                scen2 = app.get("scenario_2") or "N/A"
                embed.add_field(
                    name="🔨 Scenario 2: Argument",
                    value=f">>> {scen2[:1000]}",
                    inline=False
                )

                # Scenario 3: Abuse Claim
                scen3 = app.get("scenario_3") or "N/A"
                embed.add_field(
                    name="🛡️ Scenario 3: Abuse Claim",
                    value=f">>> {scen3[:1000]}",
                    inline=False
                )

            # Footer
            embed.set_footer(
                text=f"SyncInk Secure Form Submitter • {formatted_date}",
                icon_url="https://syncink.site/syncink-main-logo.png"
            )

            # Mention Support Manager
            content = f"<@&{SUPPORT_MANAGER_ROLE_ID}>"
            await channel.send(content=content, embed=embed)

            # Mark application as notified in database
            try:
                await db.execute(
                    "UPDATE member_applications SET reviewer_notes = COALESCE(reviewer_notes, 'Dispatched to Discord channel via Bot Worker') WHERE id = $1",
                    app_id
                )
                await db.execute(
                    "ALTER TABLE member_applications ADD COLUMN IF NOT EXISTS notified_discord BOOLEAN DEFAULT FALSE"
                )
                await db.execute(
                    "UPDATE member_applications SET notified_discord = TRUE WHERE id = $1",
                    app_id
                )
            except Exception as db_err:
                log.warning(f"[ApplicationNotifier] Could not update notified flag for #{app_id}: {db_err}")

            log.info(f"[ApplicationNotifier] Successfully dispatched {app_type} application #{app_id} to Discord channel {channel_id}")
            return True

        except Exception as e:
            log.error(f"[ApplicationNotifier] Error dispatching application notification #{app_id}: {e}", exc_info=True)
            return False

    @staticmethod
    async def reconcile_unnotified_applications(bot: commands.Bot):
        """
        Safety background reconciliation: checks for any applications in member_applications
        that haven't been posted to Discord yet.
        """
        try:
            # Ensure column exists
            await db.execute(
                "ALTER TABLE member_applications ADD COLUMN IF NOT EXISTS notified_discord BOOLEAN DEFAULT FALSE"
            )
            rows = await db.fetch(
                "SELECT id FROM member_applications WHERE notified_discord IS NOT TRUE ORDER BY id ASC LIMIT 3"
            )
            for row in rows:
                app_id = row["id"]
                log.info(f"[ApplicationNotifier] Reconciling unnotified application #{app_id}...")
                await ApplicationNotifier.process_notification(bot, app_id)
        except Exception as e:
            log.debug(f"[ApplicationNotifier] Reconciliation check completed or table not ready: {e}")
