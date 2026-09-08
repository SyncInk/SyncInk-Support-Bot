import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import asyncio

# Mock asyncpg if not installed locally
if 'asyncpg' not in sys.modules:
    sys.modules['asyncpg'] = MagicMock()

from cogs.automod import normalize_content, count_emojis
from services.security_service import SecurityService
from services.risk_service import RiskEngine

class TestSecurityEngine(unittest.TestCase):
    def test_text_normalization_leetspeak(self):
        self.assertIn("fuck", normalize_content("f u c k"))
        self.assertIn("fuck", normalize_content("f/u/c/k"))
        self.assertIn("fuck", normalize_content("f.u.c.k"))
        self.assertIn("fuck", normalize_content("f-u-c-k"))
        self.assertIn("fuck", normalize_content("fuuuuck"))
        self.assertIn("bitch", normalize_content("b1tch"))
        self.assertIn("shit", normalize_content("sh!t"))
        self.assertIn("ass", normalize_content("@$$"))

    def test_text_normalization_zero_width(self):
        cleaned = normalize_content("b\u200bad\u200cword")
        self.assertEqual(cleaned, "badword")

    def test_text_normalization_homoglyphs(self):
        cyrillic_test = "ԁіѕсоrd" # all Cyrillic / lookalike
        normalized = normalize_content(cyrillic_test)
        self.assertEqual(normalized, "discord")

    def test_emoji_counting(self):
        text = "Hello 😀 😃 😄 😁 <a:test:123456789> <a:anim:987654321>"
        count = count_emojis(text)
        self.assertEqual(count, 6)

    def test_url_extraction(self):
        text = "Check this out https://discord.gg/xyz and http://dlscord-gift.com/free also google.com/search"
        urls = SecurityService.extract_urls(text)
        self.assertTrue(any("dlscord-gift.com" in u for u in urls))
        self.assertTrue(any("discord.gg" in u for u in urls))

    def test_domain_homoglyphs_and_phishing(self):
        domain = "dlscord-gift.com"
        norm = SecurityService.normalize_domain(domain)
        import re
        from services.security_service import PHISHING_PATTERNS
        matched = any(re.search(pat, norm) for pat in PHISHING_PATTERNS)
        self.assertTrue(matched)

    def test_trusted_domains(self):
        from services.security_service import GLOBAL_TRUSTED_DOMAINS
        self.assertIn("discord.com", GLOBAL_TRUSTED_DOMAINS)
        self.assertIn("syncink.com", GLOBAL_TRUSTED_DOMAINS)
        self.assertIn("github.com", GLOBAL_TRUSTED_DOMAINS)

    def test_risk_tiers(self):
        self.assertEqual(RiskEngine.get_tier_badge("LOW"), "🟢 `LOW`")
        self.assertEqual(RiskEngine.get_tier_badge("ELEVATED"), "🟡 `ELEVATED`")
        self.assertEqual(RiskEngine.get_tier_badge("HIGH"), "🟠 `HIGH`")
        self.assertEqual(RiskEngine.get_tier_badge("CRITICAL"), "🔴 `CRITICAL`")

    def test_risk_calculation_mock(self):
        # Create a mock member
        mock_member = MagicMock()
        mock_member.id = 999999
        mock_member.guild.id = 123456
        mock_member.guild.owner_id = 111111 # not owner
        mock_member.created_at = datetime.utcnow() - timedelta(hours=2) # < 1 day: +35
        mock_member.avatar = None # no avatar: +15
        mock_member.joined_at = datetime.utcnow() - timedelta(minutes=10) # < 1 hour: +10

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            with patch('database.db.fetchrow', new=AsyncMock(return_value=None)):
                score, tier, factors = loop.run_until_complete(RiskEngine.compute_risk(mock_member))
                self.assertGreaterEqual(score, 60) # 35 + 15 + 10 = 60
                self.assertIn(tier, ("HIGH", "CRITICAL"))
        finally:
            loop.close()

if __name__ == "__main__":
    unittest.main()
