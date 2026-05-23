import json
import uuid
from datetime import datetime, timezone
from typing import Optional
import aiosqlite
from .db import DB_PATH


async def get_cached_analysis(username: str) -> Optional[dict]:
    now = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analyses WHERE username = ? AND cached_until > ? ORDER BY created_at DESC LIMIT 1",
            (username.lower(), now),
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            row_dict = dict(row)
            # Return full result JSON if available
            if row_dict.get("result_json"):
                return json.loads(row_dict["result_json"])
            return row_dict


async def get_analysis_history(username: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, username, created_at, global_score, level FROM analyses WHERE username = ? ORDER BY created_at DESC LIMIT 30",
            (username.lower(),),
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def save_analysis(analysis_id: str, username: str, result: dict, cached_until: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR REPLACE INTO analyses (id, username, created_at, global_score, level, cached_until, result_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                analysis_id,
                username.lower(),
                datetime.now(timezone.utc).isoformat(),
                result["global_score"],
                result["level"],
                cached_until,
                json.dumps(result),
            ),
        )

        for repo in result.get("top_repositories", []):
            await db.execute(
                "INSERT OR REPLACE INTO repositories (id, analysis_id, name, description, language, stars, forks, readme_score, activity_score, repo_score, last_commit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    analysis_id,
                    repo.get("name"),
                    repo.get("description"),
                    repo.get("language"),
                    repo.get("stars", 0),
                    repo.get("forks", 0),
                    repo.get("readme_score", 0),
                    repo.get("activity_score", 0),
                    repo.get("repo_score", 0),
                    repo.get("last_commit"),
                ),
            )

        for dimension, data in result.get("score_breakdown", {}).items():
            await db.execute(
                "INSERT OR REPLACE INTO score_details (id, analysis_id, dimension, score, weight, details_json) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    analysis_id,
                    dimension,
                    data.get("score", 0),
                    data.get("max", 0),
                    json.dumps(data.get("details", {})),
                ),
            )

        for rec in result.get("recommendations", []):
            await db.execute(
                "INSERT OR REPLACE INTO recommendations (id, analysis_id, priority, category, title, description) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    analysis_id,
                    rec.get("priority"),
                    rec.get("category"),
                    rec.get("title"),
                    rec.get("description"),
                ),
            )

        ai_review = result.get("ai_review")
        if ai_review and ai_review.get("content"):
            await db.execute(
                "INSERT OR REPLACE INTO ai_reviews (id, analysis_id, content, model_used, generated_at) VALUES (?, ?, ?, ?, ?)",
                (
                    str(uuid.uuid4()),
                    analysis_id,
                    ai_review["content"],
                    ai_review.get("model_used", "unknown"),
                    datetime.now(timezone.utc).isoformat(),
                ),
            )

        await db.commit()
