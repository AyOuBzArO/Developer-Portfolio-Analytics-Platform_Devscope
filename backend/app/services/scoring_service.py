from datetime import datetime, timezone, timedelta
from app.models.github import GitHubUser, GitHubRepo


def score_readme(content: str | None) -> int:
    if not content:
        return 0
    score = 0
    if len(content) > 500:
        score += 30
    if "## installation" in content.lower() or "# installation" in content.lower():
        score += 20
    if "## usage" in content.lower() or "# usage" in content.lower():
        score += 15
    if "## license" in content.lower() or "# license" in content.lower():
        score += 10
    if "![" in content:
        score += 15
    if len(content) > 2000:
        score += 10
    return min(score, 100)


def _days_since(date_str: str | None) -> int:
    if not date_str:
        return 9999
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).days
    except Exception:
        return 9999


def score_activity(repos: list[GitHubRepo]) -> dict:
    now = datetime.now(timezone.utc)

    # Repos active in last 90 days
    active_repos = [r for r in repos if _days_since(r.pushed_at) <= 90]
    repos_actifs_norm = min(len(active_repos) / max(len(repos), 1), 1.0) if repos else 0

    # Approximate commits in last 30 days from push frequency (heuristic)
    recent_pushes = [r for r in repos if _days_since(r.pushed_at) <= 30]
    commits_30j_norm = min(len(recent_pushes) / 5, 1.0)  # 5 active repos = max

    # Weekly streak heuristic: consecutive weeks with at least one push
    weeks_with_push = set()
    for r in repos:
        if r.pushed_at:
            try:
                dt = datetime.fromisoformat(r.pushed_at.replace("Z", "+00:00"))
                week_num = (now - dt).days // 7
                if week_num < 52:
                    weeks_with_push.add(week_num)
            except Exception:
                pass
    streak = 0
    for i in range(52):
        if i in weeks_with_push:
            streak += 1
        else:
            break
    streak_norm = min(streak / 12, 1.0)

    # Regularity: unique weeks with activity over past year
    regularite = min(len(weeks_with_push) / 26, 1.0)

    score = (
        commits_30j_norm * 8
        + repos_actifs_norm * 7
        + streak_norm * 6
        + regularite * 4
    )

    return {
        "score": round(score, 2),
        "max": 25,
        "details": {
            "active_repos_90d": len(active_repos),
            "recent_pushes_30d": len(recent_pushes),
            "streak_weeks": streak,
        },
    }


def score_code_quality(repos: list[GitHubRepo]) -> dict:
    if not repos:
        return {"score": 0, "max": 25, "details": {}}

    top5 = sorted(repos, key=lambda r: r.stargazers_count, reverse=True)[:5]
    avg_readme = sum(score_readme(r.readme_content) for r in top5) / len(top5) / 100

    total = len(repos)
    gitignore_pct = sum(1 for r in repos if r.has_gitignore) / total
    license_pct = sum(1 for r in repos if r.has_license) / total
    cicd_pct = sum(1 for r in repos if r.has_cicd) / total
    tests_pct = sum(1 for r in repos if r.has_tests) / total

    score = (
        avg_readme * 8
        + gitignore_pct * 5
        + license_pct * 5
        + cicd_pct * 4
        + tests_pct * 3
    )

    return {
        "score": round(score, 2),
        "max": 25,
        "details": {
            "avg_readme_score": round(avg_readme * 100),
            "gitignore_pct": round(gitignore_pct * 100),
            "license_pct": round(license_pct * 100),
            "cicd_pct": round(cicd_pct * 100),
            "tests_pct": round(tests_pct * 100),
        },
    }


def score_documentation(user: GitHubUser, repos: list[GitHubRepo]) -> dict:
    bio_score = 1.0 if user.bio and len(user.bio) > 20 else 0.5 if user.bio else 0.0

    repos_with_desc = sum(1 for r in repos if r.description and len(r.description) > 10)
    desc_pct = repos_with_desc / max(len(repos), 1)

    all_readme_scores = [score_readme(r.readme_content) for r in repos if r.readme_content]
    avg_readme_all = sum(all_readme_scores) / len(all_readme_scores) / 100 if all_readme_scores else 0

    score = bio_score * 4 + desc_pct * 6 + avg_readme_all * 10

    return {
        "score": round(score, 2),
        "max": 20,
        "details": {
            "has_bio": bool(user.bio),
            "repos_with_description_pct": round(desc_pct * 100),
            "avg_readme_quality": round(avg_readme_all * 100),
        },
    }


def score_diversity(repos: list[GitHubRepo]) -> dict:
    languages = set(r.language for r in repos if r.language)
    nb_languages = len(languages)

    all_topics = set()
    for r in repos:
        all_topics.update(r.topics)

    lang_score = min(nb_languages / 5, 1.0)
    topic_score = min(len(all_topics) / 10, 1.0)
    variety_score = min(len(repos) / 10, 1.0)

    score = lang_score * 7 + topic_score * 4 + variety_score * 4

    return {
        "score": round(score, 2),
        "max": 15,
        "details": {
            "languages": list(languages),
            "nb_languages": nb_languages,
            "nb_topics": len(all_topics),
        },
    }


def score_community(user: GitHubUser, repos: list[GitHubRepo]) -> dict:
    total_stars = sum(r.stargazers_count for r in repos)
    total_forks = sum(r.forks_count for r in repos)

    followers_norm = min(user.followers / 100, 1.0)
    stars_norm = min(total_stars / 100, 1.0)
    forks_norm = min(total_forks / 50, 1.0)

    score = followers_norm * 6 + stars_norm * 5 + forks_norm * 4

    return {
        "score": round(score, 2),
        "max": 15,
        "details": {
            "followers": user.followers,
            "total_stars": total_stars,
            "total_forks": total_forks,
        },
    }


def get_level(score: int) -> str:
    if score >= 75:
        return "Expert"
    if score >= 55:
        return "Avancé"
    if score >= 30:
        return "Intermédiaire"
    return "Débutant"


def compute_score(user: GitHubUser, repos: list[GitHubRepo]) -> dict:
    activity = score_activity(repos)
    quality = score_code_quality(repos)
    documentation = score_documentation(user, repos)
    diversity = score_diversity(repos)
    community = score_community(user, repos)

    global_score = int(
        activity["score"]
        + quality["score"]
        + documentation["score"]
        + diversity["score"]
        + community["score"]
    )
    global_score = min(global_score, 100)

    return {
        "global_score": global_score,
        "level": get_level(global_score),
        "score_breakdown": {
            "activity": activity,
            "code_quality": quality,
            "documentation": documentation,
            "diversity": diversity,
            "community": community,
        },
    }


def build_recommendations(user: GitHubUser, repos: list[GitHubRepo], breakdown: dict) -> list[dict]:
    recs = []

    if breakdown["documentation"]["details"].get("avg_readme_quality", 0) < 50:
        recs.append({
            "priority": "critical",
            "category": "documentation",
            "title": "Améliorer vos READMEs",
            "description": "Ajoutez des sections Installation, Usage, et une image/badge dans vos projets principaux.",
        })

    if breakdown["code_quality"]["details"].get("license_pct", 0) < 50:
        recs.append({
            "priority": "important",
            "category": "code_quality",
            "title": "Ajouter des fichiers LICENSE",
            "description": "Plus de la moitié de vos repos n'ont pas de licence. Ajoutez une licence MIT pour signaler un projet open-source.",
        })

    if breakdown["code_quality"]["details"].get("cicd_pct", 0) == 0:
        recs.append({
            "priority": "important",
            "category": "code_quality",
            "title": "Ajouter GitHub Actions",
            "description": "Aucun de vos repos n'a de CI/CD. Même un workflow de lint basique est un signal fort pour les recruteurs.",
        })

    if breakdown["diversity"]["details"].get("nb_languages", 0) < 2:
        recs.append({
            "priority": "improvement",
            "category": "diversity",
            "title": "Diversifier vos technologies",
            "description": "Explorez un nouveau langage ou framework pour démontrer votre adaptabilité technique.",
        })

    if not user.bio:
        recs.append({
            "priority": "improvement",
            "category": "documentation",
            "title": "Compléter votre bio GitHub",
            "description": "Ajoutez une bio concise (poste, stack principal, disponibilité). Visible directement sur votre profil.",
        })

    return recs
