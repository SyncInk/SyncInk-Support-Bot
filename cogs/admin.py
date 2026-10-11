import os
import sys
import asyncio
import subprocess
from typing import Optional, Literal
import discord
from discord.ext import commands, tasks
from discord import app_commands
from utils.ui import SyncInkEmbed, SuccessEmbed
from utils.logger import log

def restart_process():
    """Cleanly restarts the bot process across Termux, Linux, and Windows."""
    log.info("[SyncInk] Initiating bot restart...")
    if os.getenv("SYNCINK_RUNNER") == "1":
        log.info("[SyncInk] Runner script (start.sh) detected. Exiting process so runner can pull and relaunch...")
        os._exit(0)
    else:
        log.info("[SyncInk] Spawning new process before terminating current process...")
        try:
            subprocess.Popen([sys.executable] + sys.argv)
        except Exception as e:
            log.warning(f"subprocess.Popen failed ({e}), falling back to os.execv...")
            try:
                os.execv(sys.executable, [sys.executable] + sys.argv)
            except Exception as e2:
                log.error(f"os.execv failed: {e2}")
        os._exit(0)

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

                # Sync dependencies if new packages were introduced
                try:
                    proc_pip = await asyncio.create_subprocess_exec(
                        sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--quiet",
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    await proc_pip.communicate()
                except Exception as pip_err:
                    log.warning(f"[AutoUpdater] pip install failed: {pip_err}")

                # Get latest commit summary
                proc_log = await asyncio.create_subprocess_exec(
                    "git", "log", "-1", "--pretty=format:%s",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                out_log, _ = await proc_log.communicate()
                commit_title = out_log.decode().strip() or "Updated repository"
                restart_process()
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

            try:
                proc_pip = await asyncio.create_subprocess_exec(
                    sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--quiet",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await proc_pip.communicate()
            except Exception:
                pass

            proc_log = await asyncio.create_subprocess_exec(
                "git", "log", "-1", "--pretty=format:%s (%h by %an)",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out_log, _ = await proc_log.communicate()
            latest = out_log.decode().strip()

            await msg.edit(content=f"🚀 **Successfully updated!**\n> Applied commit: `{latest}`\n\n*Restarting bot now...*")
            await asyncio.sleep(1)
            restart_process()
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
            restart_process()
        except Exception as e:
            log.error(f"Manual slash update failed: {e}")
            await interaction.followup.send(f"❌ **Failed to update from GitHub:** `{e}`")

    @commands.command(name="installpillow", aliases=["pillow", "fixpillow"], description="Install python-pillow package on Termux for visual stats graphics.")
    @commands.has_permissions(administrator=True)
    async def install_pillow_cmd(self, ctx: commands.Context):
        msg = await ctx.send("⏳ **Checking and installing Pillow graphics library...**")
        from services.stats_image_service import ensure_pillow_installed
        success = await asyncio.to_thread(ensure_pillow_installed)
        if success:
            await msg.edit(content="✅ **Pillow is installed and operational!** Visual stats image cards (`?serverstats` & `?userstats`) are now active.")
        else:
            await msg.edit(content="❌ **Auto-install could not complete.** Please run `pkg install -y python-pillow` directly in your Termux app.")

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

    @commands.command(name="sync", description="Force sync application slash commands to this server or globally.")
    @commands.has_permissions(administrator=True)
    async def sync_cmd(self, ctx: commands.Context, scope: str = "guild"):
        """Sync slash commands immediately with Discord."""
        msg = await ctx.send(f"🔄 **Syncing slash commands ({scope})...**")
        try:
            if scope.lower() == "global":
                synced = await self.bot.tree.sync()
                await msg.edit(content=f"✅ **Synced {len(synced)} command(s) globally!** (Discord global cache propagation may take up to 1 hour).")
            else:
                self.bot.tree.copy_global_to(guild=ctx.guild)
                synced = await self.bot.tree.sync(guild=ctx.guild)
                await msg.edit(content=f"✅ **Instantly synced {len(synced)} slash command(s) to this server ({ctx.guild.name})!** Refresh your Discord client (restart app or Ctrl+R) to view them immediately.")
        except Exception as e:
            await msg.edit(content=f"❌ **Sync failed:** `{e}`")

    @app_commands.command(name="sync", description="Force sync application slash commands to this server or globally.")
    @app_commands.default_permissions(administrator=True)
    async def slash_sync(self, interaction: discord.Interaction, scope: Literal["guild", "global"] = "guild"):
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message("❌ Administrator permission required.", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=True)
        try:
            if scope == "global":
                synced = await self.bot.tree.sync()
                await interaction.followup.send(f"✅ **Synced {len(synced)} command(s) globally!**")
            else:
                self.bot.tree.copy_global_to(guild=interaction.guild)
                synced = await self.bot.tree.sync(guild=interaction.guild)
                await interaction.followup.send(f"✅ **Instantly synced {len(synced)} slash command(s) to this server!**")
        except Exception as e:
            await interaction.followup.send(f"❌ **Sync failed:** `{e}`")

    @commands.command(name="installmusic", aliases=["fixmusic"], description="Install music and Discord voice dependencies.")
    @commands.has_permissions(administrator=True)
    async def install_music_cmd(self, ctx: commands.Context):
        msg = await ctx.send("⏳ **Installing the native Discord voice/DAVE and music dependencies...**")
        try:
            install_env = os.environ.copy()
            termux_pkg = "/data/data/com.termux/files/usr/bin/pkg"
            if os.path.exists(termux_pkg):
                pkg_proc = await asyncio.create_subprocess_exec(
                    termux_pkg, "install", "-y", "rust", "clang", "cmake", "pkg-config",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                _, pkg_stderr = await pkg_proc.communicate()
                if pkg_proc.returncode:
                    reason = pkg_stderr.decode(errors="replace").strip()[-1000:] or "Termux could not install its Rust toolchain."
                    await msg.edit(content=f"❌ **Could not prepare the Termux build tools:**\n```text\n{reason}\n```")
                    return

                rust_proc = await asyncio.create_subprocess_exec(
                    "rustc", "-Vv", stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
                )
                rust_stdout, rust_stderr = await rust_proc.communicate()
                if rust_proc.returncode:
                    reason = rust_stderr.decode(errors="replace").strip()[-1000:] or "Termux rustc is not available on PATH."
                    await msg.edit(content=f"❌ **Could not locate Termux Rust:**\n```text\n{reason}\n```")
                    return
                for line in rust_stdout.decode(errors="replace").splitlines():
                    if line.startswith("host: "):
                        install_env["CARGO_BUILD_TARGET"] = line.removeprefix("host: ").strip()
                        break

            proc = await asyncio.create_subprocess_exec(
                sys.executable, "-m", "pip", "install", "--upgrade",
                "discord.py[voice]>=2.7.1,<3", "yt-dlp", "--quiet",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=install_env,
            )
            _, stderr = await proc.communicate()
            if proc.returncode:
                reason = stderr.decode(errors="replace").strip()[-1200:] or f"pip exited with code {proc.returncode}"
                await msg.edit(content=f"❌ **Voice dependencies could not be installed:**\n```text\n{reason}\n```")
                return

            await msg.edit(content=(
                "✅ **Native voice dependencies installed. Restart the bot process before using music; "
                "Discord's DAVE engine is loaded when the process starts.**"
            ))
        except Exception as e:
            await msg.edit(content=f"⚠️ **Command finished with notice:** `{e}`")

async def setup(bot: commands.Bot):
    await bot.add_cog(Admin(bot))
