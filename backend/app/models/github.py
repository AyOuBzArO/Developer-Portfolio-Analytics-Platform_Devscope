from pydantic import BaseModel
from typing import Optional


class GitHubUser(BaseModel):
    login: str
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    followers: int = 0
    following: int = 0
    public_repos: int = 0
    created_at: Optional[str] = None


class GitHubRepo(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stargazers_count: int = 0
    forks_count: int = 0
    watchers_count: int = 0
    topics: list[str] = []
    pushed_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    has_issues: bool = False
    fork: bool = False
    size: int = 0
    default_branch: str = "main"
    readme_content: Optional[str] = None
    has_gitignore: bool = False
    has_license: bool = False
    has_cicd: bool = False
    has_tests: bool = False
