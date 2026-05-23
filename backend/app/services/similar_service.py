import httpx
import json
from app.core.config import settings
from app.services.ai_service import _call_ai

GITHUB_API = "https://api.github.com"


def _gh_headers() -> dict:
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


async def _fetch_github_user(username: str) -> dict | None:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(f"{GITHUB_API}/users/{username}", headers=_gh_headers())
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
    return None


async def _fetch_user_top_languages(username: str) -> list[str]:
    """Return top 5 languages used across recent repos."""
    lang_counts: dict[str, int] = {}
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(
                f"{GITHUB_API}/users/{username}/repos?per_page=30&sort=pushed",
                headers=_gh_headers(),
            )
            if r.status_code == 200:
                for repo in r.json():
                    lang = repo.get("language")
                    if lang:
                        lang_counts[lang] = lang_counts.get(lang, 0) + 1
        except Exception:
            pass
    return sorted(lang_counts, key=lambda x: -lang_counts[x])[:5]


async def find_similar_profiles(
    username: str,
    languages: dict,
    score_breakdown: dict,
    global_score: int,
) -> list[dict]:
    """
    Ask AI to suggest 3 real GitHub developers similar to `username`
    but with better practices. Each suggestion is validated against
    the GitHub API before being returned.
    """
    top_langs = list(languages.keys())[:5]

    # Identify weakest scoring dimensions
    weak_dims: list[str] = []
    for dim, data in score_breakdown.items():
        max_val = data.get("max", 1) or 1
        pct = (data.get("score", 0) / max_val) * 100
        if pct < 60:
            weak_dims.append(dim.replace("_", " "))

    prompt_context = (
        f"Developer username: {username}\n"
        f"Overall score: {global_score}/100\n"
        f"Top languages: {', '.join(top_langs) if top_langs else 'not specified'}\n"
        f"Weak areas that need improvement: {', '.join(weak_dims) if weak_dims else 'general improvement needed'}\n"
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a GitHub mentor who recommends real developers for inspiration. "
                "You know many real, active GitHub users across different tech stacks. "
                "You suggest developers who are a step above the target — "
                "same tech stack but with measurably better practices: good READMEs, "
                "CI/CD pipelines, test suites, open source contributions, consistent commits. "
                "CRITICAL: Only suggest real GitHub usernames that actually exist and are active. "
                "Prefer well-known open-source contributors but not the absolute top 1% (avoid torvalds, gvanrossum, etc.). "
                "Suggest approachable role models the developer can realistically aspire to. "
                "Reply ONLY with valid JSON, no markdown fences, no text outside the JSON array."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Here is the developer profile to find inspirations for:\n\n{prompt_context}\n"
                "Suggest exactly 3 real, existing GitHub developers this person should study and follow. "
                "Selection criteria:\n"
                "1. They use similar languages or tech stack\n"
                "2. They clearly have better GitHub hygiene (READMEs, tests, CI/CD, active commits)\n"
                "3. They are realistic, approachable role models\n\n"
                "Return ONLY a JSON array with exactly 3 objects:\n"
                "[\n"
                "  {\n"
                '    "username": "<real github login>",\n'
                '    "why_similar": "<1 sentence: how their stack overlaps with the target developer>",\n'
                '    "what_they_do_better": ["<concrete improvement 1>", "<concrete improvement 2>", "<concrete improvement 3>"]\n'
                "  }\n"
                "]"
            ),
        },
    ]

    content = await _call_ai(messages, max_tokens=700)
    if not content:
        return []

    # Parse the JSON response
    suggestions: list[dict] = []
    try:
        clean = content.strip()
        # Strip markdown code fences if present
        if "```" in clean:
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:].strip()
        # Extract the array
        start = clean.find("[")
        end = clean.rfind("]") + 1
        if start >= 0 and end > start:
            clean = clean[start:end]
        suggestions = json.loads(clean)
        if not isinstance(suggestions, list):
            return []
    except (json.JSONDecodeError, ValueError):
        return []

    # Validate each username against GitHub API and enrich with real data
    result: list[dict] = []
    for suggestion in suggestions[:3]:
        suggested_username = (suggestion.get("username") or "").strip()
        if not suggested_username or suggested_username.lower() == username.lower():
            continue

        gh_user = await _fetch_github_user(suggested_username)
        if not gh_user or gh_user.get("type") == "Organization":
            continue  # skip non-existent or org accounts

        top_languages = await _fetch_user_top_languages(suggested_username)

        result.append({
            "username": gh_user.get("login"),
            "avatar_url": gh_user.get("avatar_url", ""),
            "name": gh_user.get("name") or None,
            "bio": gh_user.get("bio") or None,
            "followers": gh_user.get("followers", 0),
            "public_repos": gh_user.get("public_repos", 0),
            "top_languages": top_languages,
            "why_similar": suggestion.get("why_similar", ""),
            "what_they_do_better": suggestion.get("what_they_do_better", []),
            "github_url": f"https://github.com/{gh_user.get('login')}",
        })

    return result
