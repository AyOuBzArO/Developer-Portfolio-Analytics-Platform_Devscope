import httpx
from typing import Optional
from app.models.github import GitHubUser, GitHubRepo
from app.core.config import settings

GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    h = {"Accept": "application/vnd.github.v3+json", "User-Agent": "DevScope/1.0"}
    if settings.github_token:
        h["Authorization"] = f"token {settings.github_token}"
    return h


async def fetch_user(username: str) -> GitHubUser:
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{GITHUB_API}/users/{username}", headers=_headers())
        if r.status_code == 404:
            raise ValueError(f"GitHub user '{username}' not found")
        if r.status_code == 429:
            raise RuntimeError("GitHub API rate limit exceeded")
        r.raise_for_status()
        return GitHubUser(**r.json())


async def fetch_repos(username: str) -> list[GitHubRepo]:
    repos = []
    page = 1
    async with httpx.AsyncClient(timeout=15) as client:
        while True:
            r = await client.get(
                f"{GITHUB_API}/users/{username}/repos",
                headers=_headers(),
                params={"per_page": 100, "page": page, "sort": "updated", "type": "owner"},
            )
            r.raise_for_status()
            data = r.json()
            if not data:
                break
            repos.extend(data)
            if len(data) < 100:
                break
            page += 1

    return [GitHubRepo(**r) for r in repos if not r.get("fork", False)]


async def fetch_readme(username: str, repo_name: str, client: httpx.AsyncClient) -> Optional[str]:
    try:
        r = await client.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}/readme",
            headers={**_headers(), "Accept": "application/vnd.github.raw"},
            timeout=10,
        )
        if r.status_code == 200:
            return r.text
    except Exception:
        pass
    return None


async def fetch_repo_tree(username: str, repo_name: str, client: httpx.AsyncClient) -> list[str]:
    try:
        r = await client.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}/git/trees/HEAD",
            headers=_headers(),
            params={"recursive": "1"},
            timeout=10,
        )
        if r.status_code == 200:
            return [item["path"] for item in r.json().get("tree", [])]
    except Exception:
        pass
    return []


async def fetch_commit_activity(username: str, repo_name: str, client: httpx.AsyncClient) -> list:
    try:
        r = await client.get(
            f"{GITHUB_API}/repos/{username}/{repo_name}/stats/commit_activity",
            headers=_headers(),
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return []


async def fetch_user_activity(username: str, repos: list[GitHubRepo]) -> list[dict]:
    """Build monthly commit activity for the last 12 months from repo push dates."""
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    # Initialize 12 months of buckets
    months = {}
    for i in range(11, -1, -1):
        d = now.replace(day=1) - timedelta(days=i * 30)
        key = d.strftime("%b %Y")
        months[key] = 0

    # Use pushed_at as a proxy for activity (one push = one commit signal)
    async with httpx.AsyncClient(timeout=15) as client:
        for repo in repos[:8]:  # limit to avoid rate limits
            try:
                r = await client.get(
                    f"{GITHUB_API}/repos/{username}/{repo.name}/commits",
                    headers=_headers(),
                    params={"per_page": 100, "since": (now - timedelta(days=365)).isoformat()},
                    timeout=10,
                )
                if r.status_code == 200:
                    for commit in r.json():
                        date_str = commit.get("commit", {}).get("author", {}).get("date", "")
                        if date_str:
                            try:
                                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                                key = dt.strftime("%b %Y")
                                if key in months:
                                    months[key] += 1
                            except Exception:
                                pass
            except Exception:
                pass

    return [{"month": k, "commits": v} for k, v in months.items()]


async def enrich_repos(username: str, repos: list[GitHubRepo]) -> list[GitHubRepo]:
    """Fetch README, file tree, and signals for top repos (max 10 to stay under rate limits)."""
    top = sorted(repos, key=lambda r: r.stargazers_count + r.forks_count, reverse=True)[:10]

    async with httpx.AsyncClient(timeout=15) as client:
        for repo in top:
            repo.readme_content = await fetch_readme(username, repo.name, client)
            tree = await fetch_repo_tree(username, repo.name, client)
            paths_lower = [p.lower() for p in tree]
            repo.has_gitignore = any(".gitignore" in p for p in paths_lower)
            repo.has_license = any("license" in p for p in paths_lower)
            repo.has_cicd = any(".github/workflows" in p for p in paths_lower)
            repo.has_tests = any(
                p.startswith("test") or "/test" in p or p.startswith("spec") or "/spec" in p
                for p in paths_lower
            )

    return repos
