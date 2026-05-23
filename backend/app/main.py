import uuid
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.db import init_db
from app.database.queries import get_cached_analysis, save_analysis, get_analysis_history
from app.models.analysis import AnalyzeRequest, AnalysisResult
from app.services.github_service import fetch_user, fetch_repos, enrich_repos, fetch_user_activity
from app.services.scoring_service import compute_score, build_recommendations, score_readme
from app.services.ai_service import (
    generate_ai_review,
    generate_roast,
    generate_hiring_signal,
    generate_fix_file,
)
from app.services.similar_service import find_similar_profiles
from pydantic import BaseModel


class GenerateFileRequest(BaseModel):
    file_type: str  # "readme" | "ci" | "gitignore" | "license"


class RoastRequest(BaseModel):
    score_breakdown: dict = {}
    stats: dict = {}
    top_repositories: list = []


class HiringSignalRequest(BaseModel):
    score_breakdown: dict = {}
    stats: dict = {}
    top_repositories: list = []
    languages: dict = {}


class SimilarRequest(BaseModel):
    languages: dict = {}
    score_breakdown: dict = {}
    global_score: int = 0

app = FastAPI(title="DevScope API", version="1.0.0")

# CORS is intentionally open ("*") because DevScope is a public read-only API —
# it only reads public GitHub data and returns analysis results. There are no
# authenticated write endpoints exposed here. Restrict origins when deploying
# behind a domain in production (e.g. allow_origins=["https://devscope.app"]).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "db": "connected"}


@app.post("/api/v1/analyze")
async def analyze(req: AnalyzeRequest):
    username = req.username.strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    # Check cache — only use if it has full data
    if not req.force_refresh:
        cached = await get_cached_analysis(username)
        if cached and cached.get("score_breakdown") and cached.get("stats"):
            return cached

    # Fetch GitHub data
    try:
        user = await fetch_user(username)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))

    repos = await fetch_repos(username)
    repos = await enrich_repos(username, repos)
    activity_data = await fetch_user_activity(username, repos)

    # Scoring
    scoring = compute_score(user, repos)
    recommendations = build_recommendations(user, repos, scoring["score_breakdown"])

    # Language distribution
    lang_counts: dict[str, int] = {}
    for r in repos:
        if r.language:
            lang_counts[r.language] = lang_counts.get(r.language, 0) + 1
    total_lang = sum(lang_counts.values()) or 1
    languages = {k: round(v / total_lang * 100, 1) for k, v in
                 sorted(lang_counts.items(), key=lambda x: -x[1])[:8]}

    # Top repos
    top_repos = sorted(repos, key=lambda r: r.stargazers_count + r.forks_count, reverse=True)[:6]
    top_repos_out = [
        {
            "name": r.name,
            "description": r.description,
            "language": r.language,
            "stars": r.stargazers_count,
            "forks": r.forks_count,
            "watchers": r.watchers_count,
            "topics": r.topics,
            "readme_score": score_readme(r.readme_content),
            "activity_score": max(0, 100 - max(0, (
                (datetime.now(timezone.utc) - datetime.fromisoformat(
                    r.pushed_at.replace("Z", "+00:00"))).days
                if r.pushed_at else 9999
            ))),
            "repo_score": score_readme(r.readme_content) // 2 + r.stargazers_count // 2,
            "last_commit": r.pushed_at,
            "created_at": r.created_at,
            "has_gitignore": r.has_gitignore,
            "has_license": r.has_license,
            "has_cicd": r.has_cicd,
            "has_tests": r.has_tests,
            "size_kb": r.size,
        }
        for r in top_repos
    ]

    stats = {
        "global_score": scoring["global_score"],
        "level": scoring["level"],
        "total_repos": len(repos),
        "total_stars": sum(r.stargazers_count for r in repos),
        "active_repos": len([r for r in repos if r.pushed_at and
                             (datetime.now(timezone.utc) -
                              datetime.fromisoformat(r.pushed_at.replace("Z", "+00:00"))).days <= 90]),
        "followers": user.followers,
    }

    # AI review
    ai_review = await generate_ai_review(
        username, scoring["score_breakdown"], stats, req.language
    )

    analysis_id = str(uuid.uuid4())
    cached_until = (datetime.now(timezone.utc) + timedelta(hours=settings.cache_ttl_hours)).isoformat()

    result = {
        "id": analysis_id,
        "username": username,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "global_score": scoring["global_score"],
        "level": scoring["level"],
        "score_breakdown": scoring["score_breakdown"],
        "top_repositories": top_repos_out,
        "languages": languages,
        "ai_review": ai_review,
        "recommendations": recommendations,
        "stats": stats,
        "activity": activity_data,
    }

    await save_analysis(analysis_id, username, result, cached_until)

    return result


@app.get("/api/v1/profile/{username}")
async def get_profile(username: str):
    cached = await get_cached_analysis(username.lower())
    if not cached:
        raise HTTPException(status_code=404, detail="No cached analysis found for this username")
    return cached


@app.get("/api/v1/history/{username}")
async def get_history(username: str):
    entries = await get_analysis_history(username.lower())
    return {"username": username.lower(), "entries": entries}


# ── Roast Mode 🔥 ──────────────────────────────────────────────────────

@app.post("/api/v1/roast/{username}")
async def roast_profile(username: str, req: RoastRequest):
    # Use data sent from frontend; fall back to DB cache if empty
    breakdown = req.score_breakdown
    stats = req.stats
    repos = req.top_repositories

    if not breakdown or not stats:
        cached = await get_cached_analysis(username.lower())
        if not cached:
            raise HTTPException(
                status_code=404,
                detail="No analysis found. Analyze the profile first."
            )
        breakdown = cached.get("score_breakdown", {})
        stats = cached.get("stats", {})
        repos = cached.get("top_repositories", [])

    result = await generate_roast(username, breakdown, stats, repos)
    if not result:
        raise HTTPException(status_code=503, detail="AI service unavailable.")
    return result


# ── Hiring Signal ──────────────────────────────────────────────────────

@app.post("/api/v1/hiring-signal/{username}")
async def hiring_signal(username: str, req: HiringSignalRequest):
    breakdown = req.score_breakdown
    stats = req.stats
    repos = req.top_repositories
    languages = req.languages

    if not breakdown or not stats:
        cached = await get_cached_analysis(username.lower())
        if not cached:
            raise HTTPException(
                status_code=404,
                detail="No analysis found. Analyze the profile first."
            )
        breakdown = cached.get("score_breakdown", {})
        stats = cached.get("stats", {})
        repos = cached.get("top_repositories", [])
        languages = cached.get("languages", {})

    result = await generate_hiring_signal(username, breakdown, stats, repos, languages)
    if not result:
        raise HTTPException(status_code=503, detail="AI service unavailable.")
    return result


# ── Fix-it File Generator ──────────────────────────────────────────────

@app.post("/api/v1/generate-file/{username}/{repo}")
async def generate_file_for_repo(username: str, repo: str, req: GenerateFileRequest):
    cached = await get_cached_analysis(username.lower())
    repo_info: dict = {}
    if cached:
        repos = cached.get("top_repositories", [])
        repo_info = next(
            (r for r in repos if r.get("name", "").lower() == repo.lower()), {}
        )

    result = await generate_fix_file(
        username=username,
        repo_name=repo,
        language=repo_info.get("language", ""),
        description=repo_info.get("description", ""),
        topics=repo_info.get("topics", []),
        stars=repo_info.get("stars", 0),
        forks=repo_info.get("forks", 0),
        has_tests=repo_info.get("has_tests", False),
        file_type=req.file_type,
    )
    if not result:
        raise HTTPException(status_code=503, detail="AI service unavailable.")
    return result


# ── Similar Profiles ───────────────────────────────────────────────

@app.post("/api/v1/similar/{username}")
async def similar_profiles(username: str, req: SimilarRequest):
    """
    Return 3 real GitHub developers similar to `username` but more advanced.
    Data sent from the frontend is used; falls back to DB cache if empty.
    """
    languages = req.languages
    score_breakdown = req.score_breakdown
    global_score = req.global_score

    if not languages and not score_breakdown:
        cached = await get_cached_analysis(username.lower())
        if not cached:
            raise HTTPException(
                status_code=404,
                detail="No analysis found. Analyze the profile first.",
            )
        languages = cached.get("languages", {})
        score_breakdown = cached.get("score_breakdown", {})
        global_score = cached.get("global_score", 0)

    profiles = await find_similar_profiles(username, languages, score_breakdown, global_score)
    return {"username": username.lower(), "similar_profiles": profiles}
