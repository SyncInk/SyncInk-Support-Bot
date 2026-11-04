#!/usr/bin/env bash
# SyncInk Support Bot - Termux & Linux Auto-Updater and Keepalive Runner

# Ensure script runs from the bot directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "=================================================="
echo "    Starting SyncInk Support Bot (Keepalive)      "
echo "=================================================="

export SYNCINK_RUNNER=1

# Detect Python interpreter
if command -v python3 >/dev/null 2>&1; then
    PY_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PY_CMD="python"
else
    echo "[SyncInk Error] Python was not found. Please install Python (e.g. 'pkg install python')."
    exit 1
fi

# Acquire Termux wake-lock to prevent Android battery optimization from sleeping the bot
if command -v termux-wake-lock >/dev/null 2>&1; then
    termux-wake-lock 2>/dev/null || true
    echo "[SyncInk] Acquired Termux wake-lock to keep bot running 24/7."
fi

while true; do
    echo ""
    echo "[SyncInk] Checking GitHub for updates..."
    # GIT_TERMINAL_PROMPT=0 ensures git does not freeze waiting for credentials if repo is private
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        GIT_TERMINAL_PROMPT=0 git pull origin main 2>/dev/null || {
            echo "[SyncInk] Note: GitHub pull skipped (private repo requires token or offline). Continuing locally..."
        }
    fi

    echo "[SyncInk] Checking dependencies..."
    if ! "$PY_CMD" -c "import PIL, yt_dlp, nacl, discord; assert discord.version_info >= (2, 7, 0)" >/dev/null 2>&1; then
        echo "[SyncInk] Installing missing core dependencies..."
        if command -v pkg >/dev/null 2>&1; then
            pkg install -y python-pillow ffmpeg libopus libsodium python-pynacl clang make python-dev libffi >/dev/null 2>&1 || true
        fi
        "$PY_CMD" -m pip install -r requirements.txt --quiet >/dev/null 2>&1 || "$PY_CMD" -m pip install -r requirements.txt || true
    fi

    echo "[SyncInk] Launching bot ($PY_CMD main.py)..."
    "$PY_CMD" main.py
    EXIT_CODE=$?

    echo "[SyncInk] Bot stopped with code $EXIT_CODE."
    echo "[SyncInk] Restarting in 3 seconds (Press Ctrl+C to stop)..."
    sleep 3
done
