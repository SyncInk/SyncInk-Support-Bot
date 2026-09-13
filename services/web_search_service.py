import aiohttp
import re
import urllib.parse
from html import unescape
from typing import List, Dict, Optional
from utils.logger import log

class WebSearchService:
    SEARCH_ENDPOINT = "https://html.duckduckgo.com/html/"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    SERVER_INTENT_KEYWORDS = {
        "rule", "rules", "verify", "verification", "unverified", "quarantine",
        "jail", "server", "channel", "channels", "mod", "admin", "owner",
        "welcome", "general", "chat", "where to talk", "how to talk", "talk here",
        "ticket", "tickets", "support", "roles", "role", "checkpoint"
    }

    WEB_INTENT_KEYWORDS = {
        "today", "yesterday", "tomorrow", "news", "latest", "recent", "current",
        "price", "weather", "when will", "when is", "who is", "who won", "score",
        "update", "release", "patch", "stock", "crypto", "bitcoin", "dollar",
        "search", "google", "look up", "online", "internet", "website", "url"
    }

    @staticmethod
    def should_search_web(prompt: str) -> bool:
        """Determines if the prompt asks for real-time external knowledge rather than server info."""
        p_lower = prompt.lower()

        # If user explicitly asked to search or check web/internet
        if any(w in p_lower for w in ("search the web", "search internet", "search online", "look up online", "search for")):
            return True

        # Bot identity or creator queries should never search web
        if any(w in p_lower for w in (
            "who made you", "who made u", "who created you", "who created u",
            "who developed you", "who developed u", "who built you", "who built u",
            "who is your creator", "who is your maker", "who is your developer",
            "who are you", "what are you", "who made this bot", "who created this bot"
        )):
            return False

        # If it's purely a server guide question, skip web search
        has_server_intent = any(w in p_lower for w in WebSearchService.SERVER_INTENT_KEYWORDS)
        if has_server_intent and not any(w in p_lower for w in ("search", "google", "crypto", "price", "news")):
            return False

        # If it has web intent keywords
        if any(w in p_lower for w in WebSearchService.WEB_INTENT_KEYWORDS):
            return True

        # General questions starting with question words
        if any(p_lower.startswith(w) for w in ("what is", "who is", "why is", "how does", "tell me about", "explain")):
            return True

        return False

    @staticmethod
    async def search(query: str, max_results: int = 4) -> List[Dict[str, str]]:
        """Asynchronously queries DuckDuckGo HTML search and returns structured results."""
        results: List[Dict[str, str]] = []
        try:
            async with aiohttp.ClientSession(headers=WebSearchService.HEADERS) as session:
                html = None
                async with session.post(
                    WebSearchService.SEARCH_ENDPOINT,
                    data={'q': query},
                    timeout=aiohttp.ClientTimeout(total=6)
                ) as resp:
                    if resp.status == 200:
                        html = await resp.text()
                    elif resp.status == 202:
                        # Follow meta refresh redirect if provided
                        refresh_text = await resp.text()
                        redirect_match = re.search(r'url=([^"]+)', refresh_text, re.IGNORECASE)
                        if redirect_match:
                            redirect_path = redirect_match.group(1).strip("'\"")
                            if redirect_path.startswith('/'):
                                redirect_url = f"https://html.duckduckgo.com{redirect_path}"
                            else:
                                redirect_url = redirect_path
                            async with session.get(redirect_url, timeout=aiohttp.ClientTimeout(total=6)) as red_resp:
                                if red_resp.status == 200:
                                    html = await red_resp.text()

                if not html:
                    return results

                titles = re.findall(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
                snippets = re.findall(r'<a[^>]+class="result__snippet"[^>]*>(.*?)</a>', html, re.DOTALL)

                count = min(max_results, len(titles), len(snippets))
                for i in range(count):
                    url_match = titles[i][0]
                    actual_url = url_match
                    if "uddg=" in url_match:
                        try:
                            parsed = urllib.parse.parse_qs(urllib.parse.urlparse(url_match).query)
                            if "uddg" in parsed:
                                actual_url = parsed["uddg"][0]
                        except Exception:
                            actual_url = url_match

                    title_clean = unescape(re.sub(r'<[^>]+>', '', titles[i][1])).strip()
                    snippet_clean = unescape(re.sub(r'<[^>]+>', '', snippets[i])).strip()

                    if title_clean and snippet_clean:
                        results.append({
                            "title": title_clean,
                            "snippet": snippet_clean,
                            "url": actual_url
                        })

        except Exception as e:
            log.error(f"Error executing web search for '{query}': {e}")

        return results

    @staticmethod
    def format_for_prompt(results: List[Dict[str, str]], query: str) -> str:
        """Formats search results into a clean grounding context block for the LLM."""
        if not results:
            return ""

        lines = [f"[Real-Time Internet Search Results for \"{query}\"]:"]
        for idx, r in enumerate(results, 1):
            lines.append(f"{idx}. {r['title']}")
            lines.append(f"   Summary: {r['snippet']}")
            lines.append(f"   Source: {r['url']}")
        lines.append("[End of Internet Search Results. Use this information to give an up-to-date and accurate answer. Include source links where helpful.]")
        return "\n".join(lines)
