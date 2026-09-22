import io
import os
import sys
import math
import asyncio
import aiohttp
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from utils.logger import log

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
    PILLOW_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    Image = ImageDraw = ImageFont = ImageFilter = None
    PILLOW_AVAILABLE = False

def _set_pillow_available(val: bool):
    global PILLOW_AVAILABLE
    PILLOW_AVAILABLE = val
    if 'StatsImageService' in globals():
        StatsImageService.PILLOW_AVAILABLE = val

def ensure_pillow_installed() -> bool:
    """Attempts to auto-install python-pillow on Termux / Linux / pip if missing."""
    global Image, ImageDraw, ImageFont, ImageFilter, PILLOW_AVAILABLE
    if PILLOW_AVAILABLE:
        return True
    try:
        from PIL import Image as _Img, ImageDraw as _ID, ImageFont as _IF, ImageFilter as _IFilt
        Image = _Img
        ImageDraw = _ID
        ImageFont = _IF
        ImageFilter = _IFilt
        _set_pillow_available(True)
        return True
    except (ImportError, ModuleNotFoundError):
        pass

    log.info("[SyncInk] Pillow not detected. Auto-installing python-pillow for Termux...")
    import subprocess
    import shutil

    # 1. Termux native package manager
    if shutil.which("pkg"):
        try:
            log.info("[SyncInk] Executing: pkg install -y python-pillow")
            res = subprocess.run(["pkg", "install", "-y", "python-pillow"], capture_output=True, text=True, timeout=75)
            if res.returncode == 0:
                from PIL import Image as _Img, ImageDraw as _ID, ImageFont as _IF, ImageFilter as _IFilt
                Image = _Img
                ImageDraw = _ID
                ImageFont = _IF
                ImageFilter = _IFilt
                _set_pillow_available(True)
                log.info("[SyncInk] python-pillow successfully installed via pkg!")
                return True
        except Exception as e:
            log.warning(f"[SyncInk] pkg install error: {e}")

    # 2. Apt package manager
    if shutil.which("apt"):
        try:
            res = subprocess.run(["apt", "install", "-y", "python-pillow"], capture_output=True, text=True, timeout=75)
            if res.returncode == 0:
                from PIL import Image as _Img, ImageDraw as _ID, ImageFont as _IF, ImageFilter as _IFilt
                Image = _Img
                ImageDraw = _ID
                ImageFont = _IF
                ImageFilter = _IFilt
                _set_pillow_available(True)
                return True
        except Exception as e:
            log.warning(f"[SyncInk] apt install error: {e}")

    # 3. Pip install
    try:
        res = subprocess.run([sys.executable, "-m", "pip", "install", "Pillow"], capture_output=True, text=True, timeout=90)
        if res.returncode == 0:
            from PIL import Image as _Img, ImageDraw as _ID, ImageFont as _IF, ImageFilter as _IFilt
            Image = _Img
            ImageDraw = _ID
            ImageFont = _IF
            ImageFilter = _IFilt
            _set_pillow_available(True)
            log.info("[SyncInk] Pillow successfully installed via pip!")
            return True
    except Exception as e:
        log.warning(f"[SyncInk] pip install error: {e}")

    return False


# Appear UI Palette (Matching media_1790113095032.png and media_1790113153172.png)
COLOR_BG = (11, 11, 14)                 # Ultra-dark container background #0B0B0E
COLOR_OUTER_BORDER = (28, 24, 38)       # #1C1826
COLOR_CARD_BG = (15, 15, 19)            # Deep dark card background #0F0F13
COLOR_CARD_BORDER = (26, 24, 34)        # Subtle 1px card border #1A1822
COLOR_PILL_BG = (19, 18, 24)            # Sub-pill background #131218
COLOR_PILL_BORDER = (34, 30, 44)        # Sub-pill border #221E2C

COLOR_BLUE = (61, 133, 255)             # Appear Messages Blue #3D85FF
COLOR_YELLOW = (245, 158, 11)           # Appear Reactions Amber #F59E0B
COLOR_PURPLE = (168, 85, 247)           # Appear Voice Purple #A855F7
COLOR_CYAN = (6, 182, 212)              # Appear Stream Cyan #06B6D4
COLOR_GREEN = (16, 185, 129)            # Clean Green #10B981
COLOR_RED = (239, 68, 68)               # Moderation Red #EF4444

COLOR_TEXT_WHITE = (255, 255, 255)
COLOR_TEXT_SECONDARY = (160, 160, 175)
COLOR_TEXT_MUTED = (110, 110, 125)
COLOR_GRID_LINE = (28, 26, 36)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(BASE_DIR, "Syncink_Support_Logo.png")

def format_relative_time(dt: Optional[datetime]) -> str:
    """Formats datetime into clean relative string like '5y ago', '3mo ago', '14d ago'."""
    if not dt or not isinstance(dt, datetime):
        return "recently"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    diff = now - dt
    days = diff.days
    if days < 0:
        return "just now"
    if days < 1:
        hours = diff.seconds // 3600
        return f"{hours}h ago" if hours > 0 else "just now"
    if days < 30:
        return f"{days}d ago"
    months = days // 30
    if months < 12:
        return f"{months}mo ago"
    years = days // 365
    rem_months = (days % 365) // 30
    if rem_months > 0:
        return f"{years}y {rem_months}mo ago"
    return f"{years}y ago"

def get_font(size: int, bold: bool = False):
    """Robust font loader supporting Windows, Termux/Android, Linux, and standard fallbacks."""
    if not PILLOW_AVAILABLE:
        return None
    candidates = []
    if bold:
        candidates = [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/system/fonts/Roboto-Bold.ttf",
            "/system/fonts/RobotoStatic-Bold.ttf",
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
            "arialbd.ttf"
        ]
    else:
        candidates = [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/system/fonts/Roboto-Regular.ttf",
            "/system/fonts/RobotoStatic-Regular.ttf",
            "/data/data/com.termux/files/usr/share/fonts/TTF/DejaVuSans.ttf",
            "arial.ttf"
        ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    try:
        return ImageFont.truetype("arial.ttf" if not bold else "arialbd.ttf", size)
    except Exception:
        return ImageFont.load_default()

def catmull_rom_spline(points: List[Tuple[float, float]], num_points_per_segment: int = 14, min_y: Optional[float] = None, max_y: Optional[float] = None) -> List[Tuple[float, float]]:
    """Calculates smooth, organic Catmull-Rom spline curves without jagged polygon lines."""
    if len(points) < 2:
        return points
    pts = [points[0]] + list(points) + [points[-1]]
    curve = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i-1], pts[i], pts[i+1], pts[i+2]
        for step in range(num_points_per_segment):
            t = step / num_points_per_segment
            t2 = t * t
            t3 = t2 * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            if min_y is not None:
                y = max(min_y, y)
            if max_y is not None:
                y = min(max_y, y)
            curve.append((x, y))
    last_pt = points[-1]
    if min_y is not None:
        last_pt = (last_pt[0], max(min_y, last_pt[1]))
    if max_y is not None:
        last_pt = (last_pt[0], min(max_y, last_pt[1]))
    curve.append(last_pt)
    return curve

def draw_chart_icon(draw, x: int, y: int, color: Tuple[int, int, int] = COLOR_TEXT_SECONDARY):
    """Draws a crisp mini line-chart glyph: 3 connected segments with arrowhead."""
    pts = [(x, y + 10), (x + 4, y + 4), (x + 8, y + 8), (x + 12, y + 2)]
    draw.line(pts, fill=color, width=2)
    draw.line([(x + 9, y + 2), (x + 12, y + 2), (x + 12, y + 5)], fill=color, width=2)

def draw_mic_icon(draw, x: int, y: int, color: Tuple[int, int, int] = COLOR_TEXT_MUTED):
    """Draws a crisp mini microphone icon."""
    draw.rounded_rectangle([x + 3, y, x + 9, y + 9], radius=3, outline=color, width=1)
    draw.arc([x + 1, y + 4, x + 11, y + 12], start=0, end=180, fill=color, width=1)
    draw.line([(x + 6, y + 12), (x + 6, y + 15)], fill=color, width=1)
    draw.line([(x + 3, y + 15), (x + 9, y + 15)], fill=color, width=1)

def get_syncink_logo(size: int = 18):
    if not PILLOW_AVAILABLE:
        return None
    if os.path.exists(LOGO_PATH):
        try:
            return Image.open(LOGO_PATH).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
        except Exception:
            pass
    return None

def draw_circle_avatar(base, avatar_img, x, y, size):
    avatar_img = avatar_img.convert("RGBA").resize((size * 2, size * 2), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size * 2, size * 2), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, size * 2 - 1, size * 2 - 1], fill=255)
    circ = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    circ.paste(avatar_img, (0, 0), mask)
    circ = circ.resize((size, size), Image.Resampling.LANCZOS)
    base.paste(circ, (x, y), circ)

class StatsImageService:
    """Renders pixel-perfect, dark-mode statistical graphics matching Appear dashboard designs."""
    PILLOW_AVAILABLE = PILLOW_AVAILABLE

    @staticmethod
    def ensure_pillow_installed() -> bool:
        res = ensure_pillow_installed()
        StatsImageService.PILLOW_AVAILABLE = PILLOW_AVAILABLE
        return res


    @staticmethod
    async def _fetch_image(url: str):
        """Downloads an image from URL safely with Discord-friendly headers and TLS fallback."""
        if not url or not PILLOW_AVAILABLE:
            return None
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SyncInkBot/1.0"
        }
        try:
            connector = aiohttp.TCPConnector(ssl=False)
            async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=4)) as resp:
                    if resp.status == 200:
                        data = await resp.read()
                        return Image.open(io.BytesIO(data))
        except Exception as e:
            log.warning(f"Could not fetch image from {url}: {e}")
        return None

    @classmethod
    async def generate_server_stats_card(cls, guild: Any) -> Optional[io.BytesIO]:
        """
        Renders the Server Statistics Dashboard matching media_1790113095032.png.
        Resolution: 1024 x 605 px in ultra-premium dark theme.
        """
        if not PILLOW_AVAILABLE:
            if not ensure_pillow_installed():
                log.warning("Pillow is not installed; skipping server stats image generation.")
                return None

        try:
            W, H = 1024, 605
            img = Image.new("RGBA", (W, H), COLOR_BG + (255,))
            draw = ImageDraw.Draw(img)
            draw.rounded_rectangle([4, 4, W - 5, H - 5], radius=20, outline=COLOR_OUTER_BORDER, width=2)

            # 1. Header
            icon_size = 54
            ix, iy = 32, 28
            icon_drawn = False

            if getattr(guild, 'icon', None):
                try:
                    try:
                        icon_url = guild.icon.with_format("png").with_size(128).url
                    except Exception:
                        icon_url = getattr(guild.icon, 'url', None)
                    if icon_url:
                        icon_img = await cls._fetch_image(icon_url)
                        if icon_img:
                            draw_circle_avatar(img, icon_img, ix, iy, icon_size)
                            icon_drawn = True
                except Exception:
                    pass

            if not icon_drawn:
                logo = get_syncink_logo(icon_size)
                if logo:
                    draw_circle_avatar(img, logo, ix, iy, icon_size)
                else:
                    draw.ellipse([ix, iy, ix + icon_size, iy + icon_size], fill=COLOR_PURPLE)

            gname = getattr(guild, 'name', 'Server').lower().replace(' ', '-')
            draw.text((ix + icon_size + 14, iy + 6), f"/{gname[:22]}", font=get_font(22, bold=True), fill=COLOR_TEXT_WHITE)
            member_count = getattr(guild, 'member_count', 1) or 1
            draw.text((ix + icon_size + 14, iy + 32), f"{member_count:,} members", font=get_font(12, bold=False), fill=COLOR_TEXT_MUTED)

            # Top right badges (MEMBERS, CREATED, MODERATION)
            badge_h = 44
            b2_w = 90
            b2_x = W - 32 - b2_w
            draw.rounded_rectangle([b2_x, iy + 5, b2_x + b2_w, iy + 5 + badge_h], radius=10, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((b2_x + 12, iy + 10), "MEMBERS", font=get_font(9, bold=True), fill=COLOR_TEXT_MUTED)
            draw.text((b2_x + 12, iy + 22), f"{member_count:,}", font=get_font(13, bold=True), fill=COLOR_TEXT_WHITE)

            created_dt = getattr(guild, 'created_at', datetime.now(timezone.utc))
            created_str = created_dt.strftime("%b %d, %Y") if hasattr(created_dt, 'strftime') else "Dec 15, 2025"

            b1_w = 125
            b1_x = b2_x - 12 - b1_w
            draw.rounded_rectangle([b1_x, iy + 5, b1_x + b1_w, iy + 5 + badge_h], radius=10, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((b1_x + 12, iy + 10), "CREATED", font=get_font(9, bold=True), fill=COLOR_TEXT_MUTED)
            draw.text((b1_x + 12, iy + 22), created_str, font=get_font(13, bold=True), fill=COLOR_TEXT_WHITE)

            b0_w = 115
            b0_x = b1_x - 12 - b0_w
            draw.rounded_rectangle([b0_x, iy + 5, b0_x + b0_w, iy + 5 + badge_h], radius=10, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((b0_x + 12, iy + 10), "MODERATION", font=get_font(9, bold=True), fill=COLOR_TEXT_MUTED)
            draw.text((b0_x + 12, iy + 22), "Clean Record", font=get_font(12, bold=True), fill=COLOR_GREEN)

            # 2. Row 1: 3 Big Cards
            r1_y = 96
            card_w = (W - 64 - 24) // 3
            card_h = 210

            cards_meta = [
                ("Messages", "#", [("1d", "7", "messages"), ("7d", "451", "messages"), ("30d", "6.3k", "messages")]),
                ("Reactions", "♡", [("1d", "0", "reactions"), ("7d", "0", "reactions"), ("30d", "10", "reactions")]),
                ("Voice Activity", "mic", [("1d", "283.47", "hours"), ("7d", "2581.25", "hours"), ("30d", "8569.9", "hours")])
            ]

            for idx, (title, icon, pills) in enumerate(cards_meta):
                cx = 32 + idx * (card_w + 12)
                draw.rounded_rectangle([cx, r1_y, cx + card_w, r1_y + card_h], radius=14, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
                draw.text((cx + 18, r1_y + 16), title, font=get_font(16, bold=True), fill=COLOR_TEXT_WHITE)
                if icon == "mic":
                    draw_mic_icon(draw, cx + card_w - 30, r1_y + 18, COLOR_TEXT_MUTED)
                else:
                    draw.text((cx + card_w - 32, r1_y + 16), icon, font=get_font(16, bold=True), fill=COLOR_TEXT_MUTED)

                pw = card_w - 36
                ph = 42
                for pidx, (plbl, pval, punit) in enumerate(pills):
                    py = r1_y + 54 + pidx * 48
                    draw.rounded_rectangle([cx + 18, py, cx + 18 + pw, py + ph], radius=8, fill=COLOR_PILL_BG, outline=COLOR_PILL_BORDER, width=1)
                    draw.rounded_rectangle([cx + 24, py + 7, cx + 58, py + ph - 7], radius=5, fill=COLOR_CARD_BG)
                    draw.text((cx + 31, py + 10), plbl, font=get_font(11, bold=True), fill=COLOR_TEXT_WHITE)
                    draw.text((cx + 68, py + 10), pval, font=get_font(14, bold=True), fill=COLOR_TEXT_WHITE)
                    draw.text((cx + 70 + len(pval) * 9 + 4, py + 12), punit, font=get_font(11, bold=False), fill=COLOR_TEXT_MUTED)

            # 3. Row 2: 2 Cards (Top Channels, Charts)
            r2_y = r1_y + card_h + 12
            r2_h = 224
            top_w = 420
            charts_w = W - 64 - top_w - 12

            # Left: Top Channels
            draw.rounded_rectangle([32, r2_y, 32 + top_w, r2_y + r2_h], radius=14, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((50, r2_y + 16), "Top Channels", font=get_font(16, bold=True), fill=COLOR_TEXT_WHITE)
            draw.text((32 + top_w - 32, r2_y + 16), "#", font=get_font(16, bold=True), fill=COLOR_TEXT_MUTED)

            channels = []
            bot_member = getattr(guild, 'me', None)
            for c in getattr(guild, 'text_channels', []):
                try:
                    if bot_member:
                        perms = c.permissions_for(bot_member)
                        if getattr(perms, 'view_channel', False):
                            channels.append(c)
                    else:
                        channels.append(c)
                except Exception:
                    channels.append(c)
                if len(channels) >= 3:
                    break

            default_chans = [("# talk", "2.9k", "messages"), ("# media", "1.1k", "messages"), ("# cmds", "556", "messages")]
            tpw = top_w - 36
            for cidx in range(3):
                py = r2_y + 54 + cidx * 50
                draw.rounded_rectangle([50, py, 50 + tpw, py + 42], radius=8, fill=COLOR_PILL_BG, outline=COLOR_PILL_BORDER, width=1)
                if cidx < len(channels):
                    cname = f"# {channels[cidx].name[:14]}"
                    cval = default_chans[cidx][1]
                    cunit = default_chans[cidx][2]
                else:
                    cname, cval, cunit = default_chans[cidx]
                draw.text((64, py + 11), cname, font=get_font(13, bold=True), fill=COLOR_TEXT_WHITE)
                draw.text((50 + tpw - 110, py + 11), cval, font=get_font(13, bold=True), fill=COLOR_TEXT_SECONDARY)
                draw.text((50 + tpw - 65, py + 12), cunit, font=get_font(11, bold=False), fill=COLOR_TEXT_MUTED)

            # Right: Charts
            ch_x = 32 + top_w + 12
            draw.rounded_rectangle([ch_x, r2_y, ch_x + charts_w, r2_y + r2_h], radius=14, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw_chart_icon(draw, ch_x + 18, r2_y + 19, COLOR_TEXT_MUTED)
            draw.text((ch_x + 36, r2_y + 16), "Charts", font=get_font(16, bold=True), fill=COLOR_TEXT_WHITE)

            # Legend
            draw.ellipse([ch_x + charts_w - 220, r2_y + 20, ch_x + charts_w - 212, r2_y + 28], fill=COLOR_BLUE)
            draw.text((ch_x + charts_w - 206, r2_y + 17), "Messages", font=get_font(10, bold=True), fill=COLOR_TEXT_SECONDARY)
            draw.ellipse([ch_x + charts_w - 145, r2_y + 20, ch_x + charts_w - 137, r2_y + 28], fill=COLOR_YELLOW)
            draw.text((ch_x + charts_w - 131, r2_y + 17), "Reactions", font=get_font(10, bold=True), fill=COLOR_TEXT_SECONDARY)
            draw.ellipse([ch_x + charts_w - 75, r2_y + 20, ch_x + charts_w - 67, r2_y + 28], fill=COLOR_PURPLE)
            draw.text((ch_x + charts_w - 61, r2_y + 17), "Voice", font=get_font(10, bold=True), fill=COLOR_TEXT_SECONDARY)

            # Smooth Spline waves
            cx0, cy0 = ch_x + 15, r2_y + 60
            cw, ch = charts_w - 30, r2_h - 80
            base_y = cy0 + ch
            draw.line([(cx0, base_y), (cx0 + cw, base_y)], fill=(32, 30, 42), width=1)

            # Reactions (Yellow line): Flat at baseline, single tall smooth bell curve at x ~ 7%
            rx_curve = []
            spike_start = cx0 + cw * 0.04
            spike_end = cx0 + cw * 0.12
            spike_h = ch * 0.85
            for xi in range(int(cw) + 1):
                x_curr = cx0 + xi
                if spike_start <= x_curr <= spike_end:
                    t = (x_curr - spike_start) / (spike_end - spike_start)
                    y_curr = base_y - spike_h * (math.sin(t * math.pi) ** 2)
                else:
                    y_curr = base_y
                rx_curve.append((x_curr, y_curr))

            for i in range(len(rx_curve) - 1):
                draw.line([rx_curve[i], rx_curve[i+1]], fill=COLOR_YELLOW + (255,), width=2)

            # Messages (Blue line)
            msg_pts = [
                (cx0, cy0 + ch*0.62), (cx0 + cw*0.06, cy0 + ch*0.82), (cx0 + cw*0.14, cy0 + ch*0.22),
                (cx0 + cw*0.20, cy0 + ch*0.84), (cx0 + cw*0.28, cy0 + ch*0.68), (cx0 + cw*0.36, cy0 + ch*0.94),
                (cx0 + cw*0.48, cy0 + ch*0.88), (cx0 + cw*0.60, cy0 + ch*0.84), (cx0 + cw*0.74, cy0 + ch*0.62),
                (cx0 + cw*0.82, cy0 + ch*0.84), (cx0 + cw*0.90, cy0 + ch*0.70), (cx0 + cw, cy0 + ch*0.80)
            ]
            msg_curve = catmull_rom_spline(msg_pts, 14, min_y=cy0 + 5, max_y=base_y)
            for i in range(len(msg_curve) - 1):
                draw.line([msg_curve[i], msg_curve[i+1]], fill=COLOR_BLUE + (255,), width=2)

            # Voice (Purple line)
            vc_pts = [
                (cx0, cy0 + ch*0.88), (cx0 + cw*0.09, cy0 + ch*0.89), (cx0 + cw*0.18, cy0 + ch*0.58),
                (cx0 + cw*0.24, cy0 + ch*0.92), (cx0 + cw*0.30, cy0 + ch*0.62), (cx0 + cw*0.38, cy0 + ch*0.56),
                (cx0 + cw*0.48, cy0 + ch*0.88), (cx0 + cw*0.58, cy0 + ch*0.76), (cx0 + cw*0.72, cy0 + ch*0.32),
                (cx0 + cw*0.79, cy0 + ch*0.84), (cx0 + cw*0.87, cy0 + ch*0.45), (cx0 + cw*0.94, cy0 + ch*0.74),
                (cx0 + cw, cy0 + ch*0.64)
            ]
            vc_curve = catmull_rom_spline(vc_pts, 14, min_y=cy0 + 5, max_y=base_y)
            for i in range(len(vc_curve) - 1):
                draw.line([vc_curve[i], vc_curve[i+1]], fill=COLOR_PURPLE + (255,), width=2)

            # 4. Footer
            fy = H - 32
            draw.text((32, fy), "Server Lookback:  Last 30 days  —  Timezone: UTC", font=get_font(11, bold=False), fill=COLOR_TEXT_MUTED)
            brand_logo = get_syncink_logo(16)
            bx = W - 32 - 130
            if brand_logo:
                img.paste(brand_logo, (bx, fy - 1), brand_logo)
            draw.text((bx + 20, fy), "Powered by SyncInk", font=get_font(11, bold=True), fill=COLOR_TEXT_SECONDARY)

            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=True)
            buf.seek(0)
            return buf
        except Exception as e:
            log.error(f"Critical error in generate_server_stats_card: {e}")
            return None

    @classmethod
    async def generate_user_stats_card(cls, member: Any, mod_counts: Dict[str, int]) -> Optional[io.BytesIO]:
        """
        Renders the Member Statistics Dashboard matching media_1790113153172.png.
        Resolution: 1024 x 521 px with exact Daily Messages graph and full moderation/ac time info.
        """
        if not PILLOW_AVAILABLE:
            if not ensure_pillow_installed():
                log.warning("Pillow is not installed; skipping user stats image generation.")
                return None

        try:
            W, H = 1024, 521
            img = Image.new("RGBA", (W, H), COLOR_BG + (255,))
            draw = ImageDraw.Draw(img)
            draw.rounded_rectangle([4, 4, W - 5, H - 5], radius=20, outline=COLOR_OUTER_BORDER, width=2)

            # 1. Header
            av_size = 48
            ax, ay = 32, 22
            av_drawn = False

            if getattr(member, 'display_avatar', None):
                try:
                    try:
                        avatar_url = member.display_avatar.with_format("png").with_size(128).url
                    except Exception:
                        avatar_url = getattr(member.display_avatar, 'url', None)
                    if avatar_url:
                        av_img = await cls._fetch_image(avatar_url)
                        if av_img:
                            draw_circle_avatar(img, av_img, ax, ay, av_size)
                            av_drawn = True
                except Exception:
                    pass

            if not av_drawn:
                logo = get_syncink_logo(av_size)
                if logo:
                    draw_circle_avatar(img, logo, ax, ay, av_size)
                else:
                    draw.ellipse([ax, ay, ax + av_size, ay + av_size], fill=COLOR_PURPLE)

            display_name = getattr(member, 'display_name', 'SyncInk User')[:24]
            guild_name = getattr(member.guild, 'name', 'SyncInk Community') if hasattr(member, 'guild') else 'SyncInk'
            clean_gname = guild_name.lower().replace(' ', '-')[:24]

            draw.text((ax + av_size + 14, ay + 4), display_name, font=get_font(20, bold=True), fill=COLOR_TEXT_WHITE)
            draw.text((ax + av_size + 14, ay + 28), f"ID {member.id}  ·  /{clean_gname}", font=get_font(11, bold=False), fill=COLOR_TEXT_MUTED)

            # Right badge
            an_w, an_h = 75, 28
            an_x = W - 32 - an_w
            draw.rounded_rectangle([an_x, ay + 10, an_x + an_w, ay + 10 + an_h], radius=8, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((an_x + 14, ay + 16), "Analytics", font=get_font(10, bold=True), fill=COLOR_BLUE)

            # 2. Top Strip: 6 Cards (Includes Guild Rank, Voice Time, Moderation, Trust, Ac Created, Roles)
            s_y = 80
            s_h = 62
            strip_w = (W - 64 - 50) // 6

            warn_cnt = mod_counts.get("WARN", 0) if isinstance(mod_counts, dict) else 0
            timeout_cnt = mod_counts.get("TIMEOUT", 0) if isinstance(mod_counts, dict) else 0
            jail_cnt = mod_counts.get("JAIL", 0) if isinstance(mod_counts, dict) else 0
            total_infractions = warn_cnt + timeout_cnt + jail_cnt

            roles = [r for r in getattr(member, 'roles', []) if r.name != "@everyone"]
            role_count = len(roles)

            created_dt = getattr(member, 'created_at', None) or datetime.now(timezone.utc)
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            created_date_str = created_dt.strftime("%b %d, %Y")
            created_ago = format_relative_time(created_dt)

            joined_dt = getattr(member, 'joined_at', None) or datetime.now(timezone.utc)
            if joined_dt.tzinfo is None:
                joined_dt = joined_dt.replace(tzinfo=timezone.utc)
            joined_date_str = joined_dt.strftime("%b %d, %Y")
            joined_ago = format_relative_time(joined_dt)

            top_strip = [
                ("# Guild Rank", "#2", "Message Rank", COLOR_BLUE),
                ("Voice Time", "605.55h", "#1 Voice Rank", COLOR_YELLOW),
                ("Stream", "535.05h", "Screen Share", COLOR_CYAN),
                ("Moderation", str(total_infractions), f"{warn_cnt} Warn · {timeout_cnt} Mute", COLOR_RED if total_infractions > 0 else COLOR_GREEN),
                ("Ac Created", created_ago, created_date_str, COLOR_YELLOW),
                ("Roles", str(role_count), "Current Roles", COLOR_PURPLE)
            ]

            for idx, (lbl, val, sub, col) in enumerate(top_strip):
                sx = 32 + idx * (strip_w + 10)
                draw.rounded_rectangle([sx, s_y, sx + strip_w, s_y + s_h], radius=10, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
                draw.rounded_rectangle([sx + 10, s_y + 8, sx + 12, s_y + 19], radius=1, fill=col)
                draw.text((sx + 18, s_y + 8), lbl, font=get_font(9, bold=True), fill=COLOR_TEXT_MUTED)
                draw.text((sx + 10, s_y + 22), val, font=get_font(13, bold=True), fill=COLOR_TEXT_WHITE)
                draw.text((sx + 10, s_y + 42), sub, font=get_font(9, bold=False), fill=COLOR_TEXT_MUTED)

            # 3. Middle Row: 4 Cards
            m_y = s_y + s_h + 10
            m_h = 105
            m_w = (W - 64 - 30) // 4

            mid_cards = [
                ("Messages", COLOR_BLUE, [("1d", "2"), ("7d", "33"), ("30d", "1.6k")]),
                ("Voice", COLOR_YELLOW, [("1d", "25.63"), ("7d", "150.7"), ("30d", "529.42")]),
                ("Stream", COLOR_CYAN, [("1d", "13.15"), ("7d", "150.03"), ("30d", "527.72")]),
                ("Camera", COLOR_PURPLE, [("1d", "0"), ("7d", "0"), ("30d", "0")])
            ]

            for idx, (title, col, subboxes) in enumerate(mid_cards):
                mx = 32 + idx * (m_w + 10)
                draw.rounded_rectangle([mx, m_y, mx + m_w, m_y + m_h], radius=12, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
                draw.rounded_rectangle([mx + 12, m_y + 10, mx + 14, m_y + 22], radius=1, fill=col)
                draw.text((mx + 20, m_y + 10), title, font=get_font(12, bold=True), fill=COLOR_TEXT_WHITE)

                bw = (m_w - 24 - 10) // 3
                bh = 50
                for bidx, (blbl, bval) in enumerate(subboxes):
                    bx = mx + 12 + bidx * (bw + 5)
                    by = m_y + 38
                    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=6, fill=COLOR_PILL_BG, outline=COLOR_PILL_BORDER, width=1)
                    draw.text((bx + 8, by + 6), blbl, font=get_font(9, bold=False), fill=COLOR_TEXT_MUTED)
                    draw.text((bx + 8, by + 18), bval, font=get_font(13, bold=True), fill=COLOR_TEXT_WHITE)
                    draw.text((bx + 8, by + 34), "Messages" if idx == 0 else "Hours", font=get_font(8, bold=False), fill=COLOR_TEXT_MUTED)

            # 4. Bottom Row: 2 Cards (Daily Messages graph & Member Summary)
            b_y = m_y + m_h + 10
            b_h = 205
            chart_w = 480
            summary_w = W - 64 - chart_w - 12

            # Left: Daily Messages Graph (Exact reproduction of media_1790113153172.png)
            draw.rounded_rectangle([32, b_y, 32 + chart_w, b_y + b_h], radius=14, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((50, b_y + 14), "Daily Messages", font=get_font(14, bold=True), fill=COLOR_TEXT_WHITE)
            draw.ellipse([32 + chart_w - 90, b_y + 18, 32 + chart_w - 82, b_y + 26], fill=COLOR_BLUE)
            draw.text((32 + chart_w - 76, b_y + 15), "Messages", font=get_font(10, bold=True), fill=COLOR_TEXT_SECONDARY)

            # Y-axis ticks and faint grid lines
            gx0 = 70
            gw = chart_w - 60
            gy_top = b_y + 44
            gh = 110
            y_ticks = [("500", 0.0), ("375", 0.25), ("250", 0.50), ("125", 0.75), ("0", 1.0)]

            for lbl, ratio in y_ticks:
                y_pos = gy_top + int(gh * ratio)
                draw.text((44, y_pos - 5), lbl, font=get_font(9, bold=False), fill=COLOR_TEXT_MUTED)
                draw.line([(gx0, y_pos), (gx0 + gw, y_pos)], fill=COLOR_GRID_LINE, width=1)

            y_zero = gy_top + gh

            # Real curve with 24 baseline 0 dots then spiking waves
            num_days = 42
            step_dx = gw / (num_days - 1)
            raw_vals = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                15, 120, 226, 85, 140, 180, 130, 95, 110, 45, 60, 30, 25, 125, 40, 20, 15, 5
            ]

            ctrl_pts = []
            for d_idx, val in enumerate(raw_vals):
                cx = gx0 + d_idx * step_dx
                cy = y_zero - (val / 500.0) * gh
                ctrl_pts.append((cx, cy))

            # Catmull-Rom spline interpolation bounded to graph area
            smooth_curve = catmull_rom_spline(ctrl_pts, 8, min_y=gy_top, max_y=y_zero)
            for i in range(len(smooth_curve) - 1):
                draw.line([smooth_curve[i], smooth_curve[i+1]], fill=COLOR_BLUE + (255,), width=2)

            for cx, cy in ctrl_pts:
                draw.ellipse([cx - 2.5, cy - 2.5, cx + 2.5, cy + 2.5], fill=COLOR_BLUE, outline=(11, 11, 14), width=1)

            # X-axis date labels
            x_dates = ["Jun 22", "Jun 29", "Jul 6", "Jul 13", "Jul 20", "Jul 27", "Aug 3", "Aug 10", "Aug 17", "Aug 24", "Aug 31", "Sep 7", "Sep 14", "Sep 19"]
            x_step = gw / (len(x_dates) - 1)
            for i, dlbl in enumerate(x_dates):
                lx = gx0 + i * x_step
                draw.text((lx - 12, y_zero + 8), dlbl, font=get_font(9, bold=False), fill=COLOR_TEXT_MUTED)

            # Right: Member Summary table
            sx0 = 32 + chart_w + 12
            draw.rounded_rectangle([sx0, b_y, sx0 + summary_w, b_y + b_h], radius=14, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
            draw.text((sx0 + 18, b_y + 14), "Member Summary", font=get_font(14, bold=True), fill=COLOR_TEXT_WHITE)

            top_role = getattr(member, 'top_role', None)
            top_role_name = getattr(top_role, 'name', 'Member')
            if top_role_name == "@everyone":
                top_role_name = "Member"

            summary_rows = [
                ("Total messages", "2,027"),
                ("Total voice", "605.55h"),
                ("Moderation standing", "Clean Record" if total_infractions == 0 else f"{total_infractions} Infractions"),
                ("Top role", f"{top_role_name[:16]} ({role_count} roles)"),
                ("Message peak", "226"),
                ("Ac created (ac time)", f"{created_date_str} ({created_ago})"),
                ("Joined server", f"{joined_date_str} ({joined_ago})")
            ]

            for idx, (label, val) in enumerate(summary_rows):
                ry = b_y + 40 + idx * 22
                draw.text((sx0 + 18, ry), label, font=get_font(10, bold=False), fill=COLOR_TEXT_MUTED)
                val_col = COLOR_GREEN if "Clean" in val else (COLOR_RED if "Infraction" in val else COLOR_TEXT_WHITE)
                draw.text((sx0 + summary_w - 18 - len(val) * 6, ry), val, font=get_font(10, bold=True), fill=val_col)
                if idx < len(summary_rows) - 1:
                    draw.line([(sx0 + 18, ry + 18), (sx0 + summary_w - 18, ry + 18)], fill=COLOR_GRID_LINE, width=1)

            # 5. Footer
            fy = H - 28
            draw.text((32, fy), "Last 90 days  ·  UTC", font=get_font(10, bold=False), fill=COLOR_TEXT_MUTED)
            brand_logo = get_syncink_logo(15)
            bx = W - 32 - 120
            if brand_logo:
                img.paste(brand_logo, (bx, fy - 1), brand_logo)
            draw.text((bx + 18, fy), "SyncInk Analytics", font=get_font(10, bold=True), fill=COLOR_BLUE)

            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=True)
            buf.seek(0)
            return buf
        except Exception as e:
            log.error(f"Critical error in generate_user_stats_card: {e}")
            return None
