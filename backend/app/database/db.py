import aiosqlite
import os

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./data/devscope.db").replace("sqlite:///", "")


async def init_db():
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    os.makedirs(db_dir, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                created_at TEXT NOT NULL,
                global_score INTEGER NOT NULL,
                level TEXT NOT NULL,
                cached_until TEXT NOT NULL,
                result_json TEXT
            );

            CREATE TABLE IF NOT EXISTS repositories (
                id TEXT PRIMARY KEY,
                analysis_id TEXT NOT NULL,
                name TEXT,
                description TEXT,
                language TEXT,
                stars INTEGER DEFAULT 0,
                forks INTEGER DEFAULT 0,
                readme_score INTEGER DEFAULT 0,
                activity_score INTEGER DEFAULT 0,
                repo_score INTEGER DEFAULT 0,
                last_commit TEXT,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id)
            );

            CREATE TABLE IF NOT EXISTS score_details (
                id TEXT PRIMARY KEY,
                analysis_id TEXT NOT NULL,
                dimension TEXT NOT NULL,
                score REAL NOT NULL,
                weight REAL NOT NULL,
                details_json TEXT,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id)
            );

            CREATE TABLE IF NOT EXISTS recommendations (
                id TEXT PRIMARY KEY,
                analysis_id TEXT NOT NULL,
                priority TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id)
            );

            CREATE TABLE IF NOT EXISTS ai_reviews (
                id TEXT PRIMARY KEY,
                analysis_id TEXT NOT NULL,
                content TEXT NOT NULL,
                model_used TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id)
            );

            CREATE INDEX IF NOT EXISTS idx_analyses_username ON analyses(username);
            CREATE INDEX IF NOT EXISTS idx_analyses_cached_until ON analyses(cached_until);
        """)
        # Add result_json column if it doesn't exist (migration)
        try:
            await db.execute("ALTER TABLE analyses ADD COLUMN result_json TEXT")
            await db.commit()
        except Exception:
            pass  # Column already exists
