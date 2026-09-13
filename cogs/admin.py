import os
import sys
import asyncio
import discord
from discord.ext import commands, tasks
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed
from utils.logger import log

class Admin(commands.Cog):
    """Administrative tools, server management, and auto-update system."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.auto_update_enabled = os.getenv("AUTO_UPDATE", "true").lower() in ("true", "1", "yes")
        if self.auto_update_enabled:
            self.auto_update_task.start()

    def cog_unload(self):
        if self.auto_update_task.is_running():
            self.auto_update_task.cancel()

    @tasks.loop(seconds=60)
    async def auto_update_task(self):
        """Periodically checks GitHub origin/main for new commits and auto-updates the bot."""
        try:
            # 1. Fetch remote branch
            proc_fetch = await asyncio.create_subprocess_exec(
                "git", "fetch", "origin", "main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc_fetch.communicate()

            # 2. Compare local and remote commits
            proc_head = await asyncio.create_subprocess_exec(
                "git", "rev-parse", "HEAD",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_head, _ = await proc_head.communicate()
            current_head = out_head.decode().strip()

            proc_remote = await asyncio.create_subprocess_exec(
                "git", "rev-parse", "origin/main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_remote, _ = await proc_remote.communicate()
            remote_head = out_remote.decode().strip()

            if current_head and remote_head and len(remote_head) == 40 and current_head != remote_head:
                log.info(f"[AutoUpdater] New commit detected on GitHub: {remote_head[:7]} (local: {current_head[:7]}). Pulling...")
                proc_pull = await asyncio.create_subprocess_exec(
                    "git", "pull", "origin", "main",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await proc_pull.communicate()

                # Get latest commit summary
                proc_log = await asyncio.create_subprocess_exec(
                    "git", "log", "-1", "--pretty=format:%s",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                out_log, _ = await proc_log.communicate()
                commit_title = out_log.decode().strip() or "Updated repository"
                log.info(f"[AutoUpdater] Successfully pulled: {commit_title}. Restarting process...")

                await self.bot.close()
                os.execv(sys.executable, [sys.executable] + sys.argv)
        except Exception as e:
            log.warning(f"[AutoUpdater] Check failed: {e}")

    @auto_update_task.before_loop
    async def before_auto_update_task(self):
        await self.bot.wait_until_ready()

    @commands.command(name="update", aliases=["gitpull", "pullupdate"], description="Pull latest updates from GitHub and restart the bot.")
    @commands.has_permissions(administrator=True)
    async def update_bot(self, ctx: commands.Context):
        """Owner/admin command to pull updates and restart."""
        msg = await ctx.send("🔄 **Checking GitHub for updates...**")
        try:
            # 1. Fetch remote
            proc_fetch = await asyncio.create_subprocess_exec(
                "git", "fetch", "origin", "main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc_fetch.communicate()

            # 2. Check diff
            proc_head = await asyncio.create_subprocess_exec(
                "git", "rev-parse", "HEAD",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_head, _ = await proc_head.communicate()
            current_head = out_head.decode().strip()

            proc_remote = await asyncio.create_subprocess_exec(
                "git", "rev-parse", "origin/main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_remote, _ = await proc_remote.communicate()
            remote_head = out_remote.decode().strip()

            if current_head and remote_head and current_head == remote_head:
                proc_log = await asyncio.create_subprocess_exec(
                    "git", "log", "-1", "--pretty=format:%s (%h)",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                out_log, _ = await proc_log.communicate()
                latest = out_log.decode().strip()
                await msg.edit(content=f"✅ **Bot is already up to date with `origin/main`!**\n> Current commit: `{latest}`")
                return

            await msg.edit(content="⬇️ **New updates found on GitHub! Pulling latest changes...**")
            proc_pull = await asyncio.create_subprocess_exec(
                "git", "pull", "origin", "main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc_pull.communicate()

            proc_log = await asyncio.create_subprocess_exec(
                "git", "log", "-1", "--pretty=format:%s (%h by %an)",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_log, _ = await proc_log.communicate()
            latest = out_log.decode().strip()

            await msg.edit(content=f"🚀 **Successfully updated!**\n> Applied commit: `{latest}`\n\n*Restarting bot now...*")
            await asyncio.sleep(1)
            await self.bot.close()
            os.execv(sys.executable, [sys.executable] + sys.argv)
        except Exception as e:
            log.error(f"Manual update failed: {e}")
            await msg.edit(content=f"❌ **Failed to update from GitHub:** `{e}`")

    @app_commands.command(name="update", description="Pull latest updates from GitHub and restart the bot.")
    @app_commands.default_permissions(administrator=True)
    async def slash_update(self, interaction: discord.Interaction):
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message("❌ You do not have permission to run this command.", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=False)
        try:
            proc_fetch = await asyncio.create_subprocess_exec(
                "git", "fetch", "origin", "main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc_fetch.communicate()

            proc_head = await asyncio.create_subprocess_exec(
                "git", "rev-parse", "HEAD",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_head, _ = await proc_head.communicate()
            current_head = out_head.decode().strip()

            proc_remote = await asyncio.create_subprocess_exec(
                "git", "rev-parse", "origin/main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_remote, _ = await proc_remote.communicate()
            remote_head = out_remote.decode().strip()

            if current_head and remote_head and current_head == remote_head:
                proc_log = await asyncio.create_subprocess_exec(
                    "git", "log", "-1", "--pretty=format:%s (%h)",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                out_log, _ = await proc_log.communicate()
                latest = out_log.decode().strip()
                await interaction.followup.send(f"✅ **Bot is already up to date with `origin/main`!**\n> Current commit: `{latest}`")
                return

            proc_pull = await asyncio.create_subprocess_exec(
                "git", "pull", "origin", "main",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc_pull.communicate()

            proc_log = await asyncio.create_subprocess_exec(
                "git", "log", "-1", "--pretty=format:%s (%h by %an)",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_log, _ = await proc_log.communicate()
            latest = out_log.decode().strip()

            await interaction.followup.send(f"🚀 **Successfully updated!**\n> Applied commit: `{latest}`\n\n*Restarting bot now...*")
            await asyncio.sleep(1)
            await self.bot.close()
            os.execv(sys.executable, [sys.executable] + sys.argv)
        except Exception as e:
            log.error(f"Manual slash update failed: {e}")
            await interaction.followup.send(f"❌ **Failed to update from GitHub:** `{e}`")

    @commands.command(name="create_button_role", description="Generate a persistent role-toggle button.")
    @commands.has_permissions(administrator=True)
    async def create_button_role(self, ctx: commands.Context, role: discord.Role, *, message: str = "Click the button below to toggle role:"):
        embed = SyncInkEmbed(title="Role Selection")
        embed.set_author(name="Assign Roles", icon_url="https://syncink.xyz/assets/logo.png")
        embed.description = message
        
        view = discord.ui.View()
        view.add_item(discord.ui.Button(label=role.name, style=discord.ButtonStyle.primary, custom_id=f"toggle_role_{role.id}"))
        
        await ctx.channel.send(embed=embed, view=view)
        await ctx.send(embed=SuccessEmbed("Interactive role panel successfully created."))

async def setup(bot: commands.Bot):
    await bot.add_cog(Admin(bot))
