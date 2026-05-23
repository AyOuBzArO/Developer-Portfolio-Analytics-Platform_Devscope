import pytest
from app.models.github import GitHubUser, GitHubRepo
from app.services.scoring_service import (
    score_readme,
    compute_score,
    get_level,
    build_recommendations,
)


def make_user(**kwargs) -> GitHubUser:
    defaults = {"login": "testuser", "followers": 0, "following": 0, "public_repos": 0}
    return GitHubUser(**{**defaults, **kwargs})


def make_repo(**kwargs) -> GitHubRepo:
    defaults = {
        "name": "test-repo",
        "stargazers_count": 0,
        "forks_count": 0,
        "topics": [],
    }
    return GitHubRepo(**{**defaults, **kwargs})


class TestReadmeScore:
    def test_empty_readme(self):
        assert score_readme(None) == 0
        assert score_readme("") == 0

    def test_short_readme(self):
        assert score_readme("Hello") == 0

    def test_readme_with_installation(self):
        content = "x" * 600 + "\n## Installation\n## Usage\n## License\n![]() " + "x" * 1500
        s = score_readme(content)
        assert s == 100

    def test_readme_partial(self):
        content = "x" * 600 + "\n## Installation\n"
        s = score_readme(content)
        assert s == 50  # 30 (length>500) + 20 (installation)


class TestGetLevel:
    def test_levels(self):
        assert get_level(0) == "Débutant"
        assert get_level(29) == "Débutant"
        assert get_level(30) == "Intermédiaire"
        assert get_level(54) == "Intermédiaire"
        assert get_level(55) == "Avancé"
        assert get_level(74) == "Avancé"
        assert get_level(75) == "Expert"
        assert get_level(100) == "Expert"


class TestComputeScore:
    def test_empty_profile(self):
        user = make_user()
        result = compute_score(user, [])
        assert result["global_score"] == 0
        assert result["level"] == "Débutant"
        assert "score_breakdown" in result

    def test_score_capped_at_100(self):
        user = make_user(followers=1000, bio="Senior Dev")
        repos = [
            make_repo(
                name=f"repo-{i}",
                language="Python",
                stargazers_count=50,
                forks_count=20,
                topics=["python", "api", "docker"],
                pushed_at="2025-05-01T00:00:00Z",
                readme_content="x" * 600 + "\n## Installation\n## Usage\n## License\n![badge]()\n" + "x" * 1500,
                has_gitignore=True,
                has_license=True,
                has_cicd=True,
                has_tests=True,
            )
            for i in range(10)
        ]
        result = compute_score(user, repos)
        assert result["global_score"] <= 100

    def test_breakdown_has_all_dimensions(self):
        user = make_user()
        result = compute_score(user, [])
        dimensions = result["score_breakdown"].keys()
        assert "activity" in dimensions
        assert "code_quality" in dimensions
        assert "documentation" in dimensions
        assert "diversity" in dimensions
        assert "community" in dimensions


class TestRecommendations:
    def test_no_bio_generates_recommendation(self):
        user = make_user(bio=None)
        repos = [make_repo()]
        scoring = compute_score(user, repos)
        recs = build_recommendations(user, repos, scoring["score_breakdown"])
        titles = [r["title"] for r in recs]
        assert any("bio" in t.lower() for t in titles)
