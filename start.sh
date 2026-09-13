#!/data/data/com.termux/files/usr/bin/bash
# SyncInk Support Bot - Termux Auto-Updater & Keepalive Runner

echo "=================================================="
echo "    Starting SyncInk Support Bot (Termux Runner)  "
echo "=================================================="

# Acquire Termux wake-lock to prevent Android battery optimization from pausing the bot
if command -v termux-wake-lock >/dev/null 2>&1; then
    termux-wake-lock
    echo "[SyncInk] Acquired Termux wake-lock to keep bot running 24/7."
fi

while true; do
    echo ""
    echo "[SyncInk] Checking GitHub for updates..."
    git pull origin main
    echo "[SyncInk] Launching bot..."
    python main.py
    EXIT_CODE=$?
    echo "[SyncInk] Bot stopped with code $EXIT_CODE."
    echo "[SyncInk] Restarting in 3 seconds (Press Ctrl+C to stop)..."
    sleep 3
done
