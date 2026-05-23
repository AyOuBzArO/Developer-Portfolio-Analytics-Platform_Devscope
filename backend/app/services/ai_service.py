import httpx
import json
from datetime import datetime
from app.core.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS = [
    "deepseek/deepseek-v4-flash:free",
    "openai/gpt-oss-20b:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3-coder:free",
]


async def _call_ai(messages: list[dict], max_tokens: int = 800) -> str | None:
    """Generic AI call with model fallback."""
    if not settings.openrouter_api_key:
        return None

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://devscope.app",
        "X-Title": "DevScope",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        for model in MODELS:
            try:
                r = await client.post(
                    OPENROUTER_URL,
                    headers=headers,
                    json={"model": model, "messages": messages, "max_tokens": max_tokens},
                )
                if r.status_code == 200:
                    data = r.json()
                    content = data["choices"][0]["message"]["content"]
                    return content
            except Exception:
                continue
    return None


# ── Professional Review ────────────────────────────────────────────────

def _build_review_prompt(username: str, breakdown: dict, stats: dict, language: str) -> list[dict]:
    lang_instruction = "Réponds en français." if language == "fr" else "Reply in English."
    context = json.dumps({
        "username": username,
        "global_score": stats.get("global_score"),
        "level": stats.get("level"),
        "score_breakdown": breakdown,
        "stats": stats,
    }, ensure_ascii=False, indent=2)
    return [
        {
            "role": "system",
            "content": (
                "Tu es un recruteur technique senior avec 10 ans d'expérience dans l'évaluation de profils GitHub. "
                "Tu analyses des portfolios de développeurs de manière objective et constructive. "
                f"{lang_instruction}"
            ),
        },
        {
            "role": "user",
            "content": (
                f"Voici les métriques analysées du profil GitHub de '{username}':\n\n{context}\n\n"
                "Génère une revue professionnelle du portfolio en 4 sections exactement :\n"
                "## Forces\n"
                "## Faiblesses\n"
                "## Recommandations\n"
                "## Verdict\n\n"
                "Sois précis, actionnable, et bienveillant. Entre 300 et 500 mots."
            ),
        },
    ]


async def generate_ai_review(
    username: str,
    breakdown: dict,
    stats: dict,
    language: str = "fr",
) -> dict | None:
    messages = _build_review_prompt(username, breakdown, stats, language)
    content = await _call_ai(messages, max_tokens=800)
    if content:
        return {"content": content, "model_used": "devscope-ai"}
    return None


# ── Roast Mode 🔥 ──────────────────────────────────────────────────────

async def generate_roast(
    username: str,
    breakdown: dict,
    stats: dict,
    repos: list[dict],
) -> dict | None:
    repo_lines = [
        f"- {r['name']}: {r.get('stars', 0)} stars, "
        f"last commit: {r.get('last_commit', '')[:10] if r.get('last_commit') else 'never'}, "
        f"tests: {'yes' if r.get('has_tests') else 'no'}, "
        f"CI: {'yes' if r.get('has_cicd') else 'no'}, "
        f"README: {'good' if r.get('readme_score', 0) > 50 else 'bad'}"
        for r in repos[:6]
    ]

    context = (
        f"GitHub username: {username}\n"
        f"Global score: {stats.get('global_score', '?')}/100\n"
        f"Level: {stats.get('level', '?')}\n"
        f"Total repos: {stats.get('total_repos', 0)}\n"
        f"Active repos (last 90 days): {stats.get('active_repos', 0)}\n"
        f"Total stars: {stats.get('total_stars', 0)}\n"
        f"Followers: {stats.get('followers', 0)}\n\n"
        f"Score breakdown:\n"
        f"  Activity: {breakdown.get('activity', {}).get('score', '?')}/{breakdown.get('activity', {}).get('max', 25)}\n"
        f"  Code Quality: {breakdown.get('code_quality', {}).get('score', '?')}/{breakdown.get('code_quality', {}).get('max', 25)}\n"
        f"  Documentation: {breakdown.get('documentation', {}).get('score', '?')}/{breakdown.get('documentation', {}).get('max', 20)}\n"
        f"  Diversity: {breakdown.get('diversity', {}).get('score', '?')}/{breakdown.get('diversity', {}).get('max', 15)}\n"
        f"  Community: {breakdown.get('community', {}).get('score', '?')}/{breakdown.get('community', {}).get('max', 15)}\n\n"
        f"Top repos:\n" + "\n".join(repo_lines)
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a brutally honest, hilariously sarcastic tech comedian who roasts GitHub profiles. "
                "Like a Comedy Central roast — sharp, specific, funny, but never cruel. "
                "You notice every abandoned repo, every missing README, every 2am side project that died after 3 commits. "
                "Be specific about their actual repos and numbers. Write in English. "
                "Format: 3-4 punchy paragraphs. No headers. No markdown formatting. Pure roast energy."
            ),
        },
        {
            "role": "user",
            "content": f"Roast this GitHub profile:\n\n{context}",
        },
    ]

    content = await _call_ai(messages, max_tokens=600)
    if content:
        return {"roast": content, "score": stats.get("global_score", 0)}
    return None


# ── Hiring Signal ──────────────────────────────────────────────────────

async def generate_hiring_signal(
    username: str,
    breakdown: dict,
    stats: dict,
    repos: list[dict],
    languages: dict,
) -> dict | None:
    top_langs = list(languages.keys())[:5]
    has_tests_count = sum(1 for r in repos if r.get("has_tests"))
    has_ci_count = sum(1 for r in repos if r.get("has_cicd"))
    has_license_count = sum(1 for r in repos if r.get("has_license"))
    total_repos = len(repos)

    context = (
        f"GitHub username: {username}\n"
        f"Global score: {stats.get('global_score', '?')}/100 (level: {stats.get('level', '?')})\n"
        f"Total repos: {stats.get('total_repos', 0)} | Active (90 days): {stats.get('active_repos', 0)}\n"
        f"Total stars: {stats.get('total_stars', 0)} | Followers: {stats.get('followers', 0)}\n"
        f"Top languages: {', '.join(top_langs)}\n"
        f"Repos with tests: {has_tests_count}/{total_repos}\n"
        f"Repos with CI/CD: {has_ci_count}/{total_repos}\n"
        f"Repos with license: {has_license_count}/{total_repos}\n\n"
        f"Score breakdown:\n"
        f"  Activity: {breakdown.get('activity', {}).get('score', '?')}/{breakdown.get('activity', {}).get('max', 25)}\n"
        f"  Code Quality: {breakdown.get('code_quality', {}).get('score', '?')}/{breakdown.get('code_quality', {}).get('max', 25)}\n"
        f"  Documentation: {breakdown.get('documentation', {}).get('score', '?')}/{breakdown.get('documentation', {}).get('max', 20)}\n"
        f"  Diversity: {breakdown.get('diversity', {}).get('score', '?')}/{breakdown.get('diversity', {}).get('max', 15)}\n"
        f"  Community: {breakdown.get('community', {}).get('score', '?')}/{breakdown.get('community', {}).get('max', 15)}"
    )

    messages = [
        {
            "role": "system",
            "content": (
                "You are a senior technical recruiter at a top-tier tech company. "
                "You evaluate GitHub profiles quickly and deliver clear, actionable hiring signals. "
                "Be direct, specific, and professional. Reply in English only."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Evaluate this developer for hiring:\n\n{context}\n\n"
                "Respond with ONLY valid JSON (no markdown, no explanation outside JSON):\n"
                "{\n"
                '  "verdict": "Hireable" | "Strong Maybe" | "Not Yet",\n'
                '  "confidence": <0-100 integer>,\n'
                '  "one_liner": "<one sentence describing this developer>",\n'
                '  "strengths": ["<str1>", "<str2>", "<str3>"],\n'
                '  "concerns": ["<con1>", "<con2>"],\n'
                '  "best_fit_roles": ["<role1>", "<role2>", "<role3>"],\n'
                '  "summary": "<2-3 sentences recruiter-style summary>"\n'
                "}"
            ),
        },
    ]

    content = await _call_ai(messages, max_tokens=500)
    if not content:
        return None

    try:
        clean = content.strip()
        if "```" in clean:
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:]
        # Find first { to last }
        start = clean.find("{")
        end = clean.rfind("}") + 1
        if start >= 0 and end > start:
            clean = clean[start:end]
        return json.loads(clean)
    except (json.JSONDecodeError, ValueError):
        return {
            "verdict": "Strong Maybe",
            "confidence": 50,
            "one_liner": f"Developer with a score of {stats.get('global_score', '?')}/100.",
            "strengths": [],
            "concerns": [],
            "best_fit_roles": [],
            "summary": content[:400],
        }


# ── Fix-it File Generator ──────────────────────────────────────────────

_LANG_BADGE_COLOR: dict[str, str] = {
    "python": "3572A5", "typescript": "2b7489", "javascript": "f1e05a",
    "go": "00ADD8", "rust": "dea584", "java": "b07219", "c++": "f34b7d",
    "c": "555555", "ruby": "701516", "swift": "F05138", "kotlin": "A97BFF",
    "php": "4F5D95", "c#": "239120", "csharp": "239120", "shell": "89e051",
    "dart": "00B4AB", "scala": "c22d40", "r": "198CE7",
}


async def generate_fix_file(
    repo_name: str,
    language: str,
    description: str,
    topics: list[str],
    file_type: str,
    username: str = "",
    stars: int = 0,
    forks: int = 0,
    has_tests: bool = False,
) -> dict | None:
    lang = language or "unknown"
    lang_lower = lang.lower()
    desc = description or f"A {lang} project."
    tags = ", ".join(topics) if topics else "none"
    badge_color = _LANG_BADGE_COLOR.get(lang_lower, "64748b")
    owner = username or "owner"
    year = datetime.now().year

    # ── README ─────────────────────────────────────────────────────────
    if file_type == "readme":
        badge_lang = (
            f"![{lang}](https://img.shields.io/badge/"
            f"{lang.replace('-', '--').replace(' ', '_')}-{badge_color}"
            f"?style=flat-square&logo={lang_lower}&logoColor=white)"
        )
        badge_stars = (
            f"![Stars](https://img.shields.io/github/stars/{owner}/{repo_name}"
            f"?style=flat-square&color=fbbf24)"
        )
        badge_license = (
            "![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)"
        )
        badges_line = f"{badge_lang}  {badge_stars}  {badge_license}"
        tests_note = (
            "The project has a test suite — show how to run tests in a '## Running Tests' section."
            if has_tests
            else "No tests yet — add a short note in '## Running Tests' encouraging contributions."
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a senior open-source developer who writes README files that people "
                    "actually want to read. Your style is clear, direct, and slightly personal — "
                    "like a developer who built something useful and wants others to use it. "
                    "Never write generic filler like 'This project provides a robust solution'. "
                    "Be specific to what this project actually does. "
                    "Use proper markdown: headers, fenced code blocks with language tags, "
                    "bullet points with emojis where natural. "
                    "Output ONLY the markdown — no commentary before or after."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Write a complete, professional README.md for this GitHub project.\n\n"
                    f"**Project info:**\n"
                    f"- Repository: {owner}/{repo_name}\n"
                    f"- Primary language: {lang}\n"
                    f"- Description: {desc}\n"
                    f"- Topics / tags: {tags}\n"
                    f"- Stars: {stars}  |  Forks: {forks}\n\n"
                    f"**Required structure (in this exact order):**\n\n"
                    f"1. `# {repo_name}` as the H1 title\n"
                    f"2. A short, punchy tagline in italics — one sentence that captures "
                    f"   what the project does\n"
                    f"3. Embed these badges exactly as-is on one line:\n"
                    f"   {badges_line}\n\n"
                    f"4. `## Overview` — 2–3 sentences. Be specific: what problem does this solve? "
                    f"   Who is it for? What makes it worth using?\n\n"
                    f"5. `## Features` — 5–7 bullet points. Each starts with a relevant emoji "
                    f"   and describes a concrete capability (not a vague adjective).\n\n"
                    f"6. `## Tech Stack` — bullet list of the main technologies / frameworks used, "
                    f"   inferred from the language, description, and topics.\n\n"
                    f"7. `## Getting Started`\n"
                    f"   ### Prerequisites\n"
                    f"   List what needs to be installed (runtime version, package manager, etc.)\n"
                    f"   ### Installation\n"
                    f"   Numbered steps with shell code blocks. Clone → install → configure.\n\n"
                    f"8. `## Usage` — show a real, realistic code example or CLI invocation "
                    f"   in a fenced code block with the correct language tag.\n\n"
                    f"9. `## Running Tests` — {tests_note}\n\n"
                    f"10. `## Contributing` — 2 friendly sentences. PRs are welcome. "
                    f"    Mention opening an issue first for big changes.\n\n"
                    f"11. `## License` — one line: MIT © {year} {owner}\n\n"
                    f"Tone: write as the developer who built this. Be specific — infer realistic "
                    f"details from the repo name, language, description, and topics. "
                    f"Do NOT write placeholder or lorem ipsum text."
                ),
            },
        ]
        content = await _call_ai(messages, max_tokens=1800)
        if content:
            # Strip any accidental AI preamble before the # title
            lines = content.splitlines()
            for i, line in enumerate(lines):
                if line.startswith("# "):
                    content = "\n".join(lines[i:])
                    break
            return {"file": "README.md", "content": content.strip(), "language": "markdown"}

    # ── CI/CD ──────────────────────────────────────────────────────────
    elif file_type == "ci":
        lang_hints: dict[str, str] = {
            "python": (
                "Use actions/setup-python@v5 with python-version: '3.11'. "
                "Cache pip with actions/cache on ~/.cache/pip. "
                "Steps: pip install -r requirements.txt, flake8 for lint, pytest for tests."
            ),
            "javascript": (
                "Use actions/setup-node@v4 with node-version: '20'. "
                "Cache npm via actions/cache on ~/.npm. "
                "Steps: npm ci, npm run lint (or npx eslint .), npm test."
            ),
            "typescript": (
                "Use actions/setup-node@v4 with node-version: '20'. "
                "Cache npm via actions/cache on ~/.npm. "
                "Steps: npm ci, npm run lint, npm run build, npm test."
            ),
            "go": (
                "Use actions/setup-go@v5 with go-version: '1.22'. "
                "Cache Go modules with actions/cache on ~/go/pkg/mod. "
                "Steps: go vet ./..., golangci-lint run, go test ./... -v -race."
            ),
            "rust": (
                "Use dtolnay/rust-toolchain@stable. "
                "Cache cargo registry with Swatinem/rust-cache@v2. "
                "Steps: cargo fmt --check, cargo clippy -- -D warnings, cargo test."
            ),
            "java": (
                "Use actions/setup-java@v4 with java-version: '21' and distribution: 'temurin'. "
                "Cache Maven ~/.m2 with actions/cache. "
                "Steps: mvn --no-transfer-progress test (or ./gradlew test if Gradle)."
            ),
        }
        lang_hint = lang_hints.get(
            lang_lower,
            f"Set up the {lang} runtime. Install dependencies. Run lint then tests.",
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a DevOps engineer who writes clean, production-ready GitHub Actions "
                    "workflows. Use best practices: pinned action versions (e.g. actions/checkout@v4), "
                    "concurrency groups to cancel stale runs, dependency caching, and clear step names. "
                    "Output ONLY valid YAML — no explanation, no markdown fences, no extra text."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Write a GitHub Actions CI workflow for this project:\n"
                    f"- Repo: {owner}/{repo_name}\n"
                    f"- Language: {lang}\n"
                    f"- Description: {desc}\n\n"
                    f"Requirements:\n"
                    f"- name: CI\n"
                    f"- Trigger on push and pull_request to main and master branches\n"
                    f"- Add a concurrency group to cancel outdated runs on the same branch\n"
                    f"- Single job named 'build-and-test' running on ubuntu-latest\n"
                    f"- First step: actions/checkout@v4\n"
                    f"- Language setup + caching: {lang_hint}\n"
                    f"- Last step: echo '✅ All checks passed'\n"
                    f"Output only the raw YAML content."
                ),
            },
        ]
        content = await _call_ai(messages, max_tokens=900)
        if content:
            clean = content.strip()
            if clean.startswith("```"):
                clean = "\n".join(
                    l for l in clean.splitlines() if not l.strip().startswith("```")
                ).strip()
            return {"file": ".github/workflows/ci.yml", "content": clean, "language": "yaml"}

    # ── .gitignore ─────────────────────────────────────────────────────
    elif file_type == "gitignore":
        lang_extras: dict[str, str] = {
            "python": (
                "__pycache__/, *.py[cod], *.pyo, .venv/, venv/, .env, .env.*, "
                "dist/, build/, *.egg-info/, .pytest_cache/, .mypy_cache/, htmlcov/, .coverage"
            ),
            "javascript": (
                "node_modules/, .env, .env.local, .env.*.local, dist/, build/, "
                ".next/, .nuxt/, coverage/, *.log, npm-debug.log*"
            ),
            "typescript": (
                "node_modules/, .env, .env.local, .env.*.local, dist/, build/, out/, "
                ".next/, coverage/, *.tsbuildinfo, *.log"
            ),
            "go": (
                "/bin/, *.exe, *.exe~, *.dll, *.so, *.dylib, *.test, *.out, coverage.txt, "
                "vendor/ (if not committed)"
            ),
            "rust": "/target/, Cargo.lock (for libraries only), *.pdb",
            "java": (
                "target/, *.class, *.jar, *.war, *.ear, .gradle/, build/, "
                "out/, .idea/, *.iml, *.iws, *.ipr"
            ),
        }
        lang_extra = lang_extras.get(
            lang_lower,
            f"Standard build output and dependency directories for {lang}.",
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You generate clean, well-organized .gitignore files. "
                    "Group entries under comment headers like: # Dependencies, # Build output, "
                    "# Environment, # IDE / Editor, # OS files. "
                    "Output only the file content — no explanation, no markdown fences."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Generate a comprehensive .gitignore for a {lang} project named '{repo_name}'.\n\n"
                    f"Must include:\n"
                    f"- Language-specific entries: {lang_extra}\n"
                    f"- Environment files: .env, .env.*, *.local\n"
                    f"- OS files: .DS_Store, Thumbs.db, desktop.ini\n"
                    f"- Editor files: .vscode/, .idea/, *.swp, *.swo, *~\n\n"
                    "Group with comment headers. No duplicate entries. Clean and minimal."
                ),
            },
        ]
        content = await _call_ai(messages, max_tokens=500)
        if content:
            clean = content.strip()
            if clean.startswith("```"):
                clean = "\n".join(
                    l for l in clean.splitlines() if not l.strip().startswith("```")
                ).strip()
            return {"file": ".gitignore", "content": clean, "language": "plaintext"}

    # ── LICENSE ────────────────────────────────────────────────────────
    elif file_type == "license":
        mit = (
            f"MIT License\n\n"
            f"Copyright (c) {year} {owner}\n\n"
            "Permission is hereby granted, free of charge, to any person obtaining a copy\n"
            "of this software and associated documentation files (the \"Software\"), to deal\n"
            "in the Software without restriction, including without limitation the rights\n"
            "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n"
            "copies of the Software, and to permit persons to whom the Software is\n"
            "furnished to do so, subject to the following conditions:\n\n"
            "The above copyright notice and this permission notice shall be included in all\n"
            "copies or substantial portions of the Software.\n\n"
            "THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n"
            "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n"
            "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n"
            "AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n"
            "LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n"
            "OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n"
            "SOFTWARE."
        )
        return {"file": "LICENSE", "content": mit, "language": "plaintext"}

    return None
