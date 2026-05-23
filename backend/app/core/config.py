from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    github_token: str = ""
    database_url: str = "sqlite:///./data/devscope.db"
    cache_ttl_hours: int = 6

    class Config:
        env_file = ".env"


settings = Settings()
