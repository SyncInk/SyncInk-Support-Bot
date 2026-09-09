# SyncInk Security Shield — Web Operations Console

Production-ready web dashboard for **SyncInk Security & AutoMod Bot**, designed for instant zero-config deployment to **Vercel** with real-time bi-directional PostgreSQL synchronization.

---

## 🚀 How to Link and Deploy to Vercel (Step-by-Step)

### Step 1: Push Repository to GitHub
Make sure all your bot and dashboard changes are pushed to your GitHub repository (`SyncInk-Support-Bot`):
```bash
git push origin main
```

---

### Step 2: Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click the **"Add New..."** button in your dashboard, then select **"Project"**.
3. Under **"Import Git Repository"**, find and select `SyncInk-Support-Bot`.
4. In the project setup screen:
   - **Framework Preset**: `Next.js` (auto-detected)
   - **Root Directory**: Click **Edit** and select `dashboard`! *(Critical: this tells Vercel where the web dashboard app lives)*.

---

### Step 3: Add Environment Variables in Vercel
Expand the **"Environment Variables"** section and add the following 3 variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `postgres://...` | **Required**: The exact same PostgreSQL database connection URL used by your Discord bot (e.g. from Railway, Supabase, Neon). |
| **`ADMIN_ACCESS_KEY`** | `YourSecretPassword123!` | **Required**: A secure secret passkey of your choice to log in and unlock the dashboard. |
| **`DEFAULT_GUILD_ID`** | `1520461877073674392` | *(Optional)* The SyncInk Support Discord Server ID. Defaults to `1520461877073674392`. |

---

### Step 4: Click "Deploy"
Click the blue **"Deploy"** button.
Vercel will automatically build the Next.js app, optimize all assets, and provision a free production URL (e.g. `https://syncink-security-dashboard.vercel.app`) within ~60 seconds!

---

## ⚡ How Real-Time Synchronization Works

1. **Shared PostgreSQL Database**:
   - Both the Discord Bot and this Vercel Dashboard connect directly to your PostgreSQL database.
   - When you toggle a module (Anti-Nuke, Anti-Raid, Anti-Spam, etc.) or change a threshold on the Vercel site, it writes directly to `guild_settings`.
2. **10-Second Bot Cache Invalidation**:
   - The bot's `CacheService` caches settings with a short 10-second TTL.
   - Any toggle or threshold changed on Vercel is picked up by the live Discord bot within 10 seconds **without needing to restart the bot**!
3. **Live Forensics & Quarantines**:
   - Every incident detected by the bot (`security_incidents`), every member jailed (`automod_jails`), and every whitelist entry (`security_whitelist`) updates live on the website every 6 seconds.
   - You can also release / unjail quarantined members directly from the website!
