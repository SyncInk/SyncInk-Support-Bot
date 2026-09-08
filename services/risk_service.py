import discord
from datetime import datetime, timedelta
from typing import Tuple, List, Dict, Any
from database import db

class RiskEngine:
    """
    Computes dynamic risk score (0-100) and risk tier for a guild member.
    Takes into account account age, avatar, server join duration, active 24h strikes,
    and historical moderation cases.
    """

    _temporary_bursts: Dict[int, float] = {} # {user_id: timestamp_of_spike}

    @classmethod
    def record_burst(cls, user_id: int):
        """Flags user with a temporary burst spike that decays over 5 minutes."""
        cls._temporary_bursts[user_id] = datetime.utcnow().timestamp()

    @classmethod
    def has_active_burst(cls, user_id: int) -> bool:
        ts = cls._temporary_bursts.get(user_id)
        if not ts:
            return False
        if datetime.utcnow().timestamp() - ts < 300: # 5 minutes
            return True
        cls._temporary_bursts.pop(user_id, None)
        return False

    @classmethod
    async def compute_risk(cls, member: discord.Member, burst_spike: bool = False) -> Tuple[int, str, List[str]]:
        """
        Computes the member's risk score (0-100), tier, and reasons.
        Returns: (score, tier, factors)
        """
        if member.id == member.guild.owner_id:
            return 0, "IMMUNE", ["Server Owner"]

        score = 0
        factors = []
        now = datetime.utcnow()

        # 1. Account Age Assessment
        created_at = member.created_at.replace(tzinfo=None)
        account_age_days = (now - created_at).total_seconds() / 86400.0

        if account_age_days < 1.0:
            score += 35
            factors.append("Account < 24h old (+35)")
        elif account_age_days < 3.0:
            score += 25
            factors.append("Account < 3 days old (+25)")
        elif account_age_days < 7.0:
            score += 15
            factors.append("Account < 7 days old (+15)")
        elif account_age_days < 30.0:
            score += 5
            factors.append("Account < 30 days old (+5)")

        # 2. Default / Missing Avatar Check
        if member.avatar is None:
            score += 15
            factors.append("Default Avatar (+15)")

        # 3. Server Join Duration Assessment
        joined_at = member.joined_at.replace(tzinfo=None) if member.joined_at else now
        join_duration_hours = (now - joined_at).total_seconds() / 3600.0

        if join_duration_hours < 1.0:
            score += 10
            factors.append("Joined < 1 hour ago (+10)")
        elif join_duration_hours < 24.0:
            score += 5
            factors.append("Joined < 24 hours ago (+5)")

        # 4. Rolling 24-Hour Violations Check
        try:
            strikes_rec = await db.fetchrow("""
                SELECT COUNT(*) as count FROM automod_violations 
                WHERE guild_id = $1 AND user_id = $2 
                  AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '24 hours')
            """, member.guild.id, member.id)
            strikes = strikes_rec['count'] if strikes_rec else 0
            if strikes > 0:
                strike_pts = min(strikes * 15, 45)
                score += strike_pts
                factors.append(f"{strikes} 24h Strike(s) (+{strike_pts})")
        except Exception:
            pass

        # 5. Historical Disciplinary Cases
        try:
            cases_rec = await db.fetchrow("""
                SELECT COUNT(*) as count FROM cases
                WHERE guild_id = $1 AND user_id = $2
            """, member.guild.id, member.id)
            cases_count = cases_rec['count'] if cases_rec else 0
            if cases_count > 0:
                case_pts = min(cases_count * 5, 20)
                score += case_pts
                factors.append(f"{cases_count} Past Case(s) (+{case_pts})")
        except Exception:
            pass

        # 6. Active Burst Activity
        if burst_spike or cls.has_active_burst(member.id):
            score += 20
            factors.append("Recent Burst Spurt (+20)")

        # Clamp between 0 and 100
        final_score = max(0, min(100, score))

        # Determine Tier
        if final_score >= 85:
            tier = "CRITICAL"
        elif final_score >= 60:
            tier = "HIGH"
        elif final_score >= 30:
            tier = "ELEVATED"
        else:
            tier = "LOW"

        return final_score, tier, factors

    @classmethod
    def get_tier_badge(cls, tier: str) -> str:
        badges = {
            "IMMUNE": "👑 `IMMUNE`",
            "LOW": "🟢 `LOW`",
            "ELEVATED": "🟡 `ELEVATED`",
            "HIGH": "🟠 `HIGH`",
            "CRITICAL": "🔴 `CRITICAL`"
        }
        return badges.get(tier, "⚪ `UNKNOWN`")
