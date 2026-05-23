from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    username: str
    force_refresh: bool = False
    language: str = "fr"


class ScoreDimension(BaseModel):
    score: float
    max: float
    details: dict = {}


class RepoSummary(BaseModel):
    name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    readme_score: int = 0
    activity_score: int = 0
    repo_score: int = 0
    last_commit: Optional[str] = None


class AIReview(BaseModel):
    content: str
    model_used: str


class Recommendation(BaseModel):
    priority: str  # critical | important | improvement
    category: str
    title: str
    description: str


class AnalysisResult(BaseModel):
    id: str
    username: str
    analyzed_at: str
    global_score: int
    level: str
    score_breakdown: dict[str, ScoreDimension]
    top_repositories: list[RepoSummary] = []
    languages: dict[str, float] = {}
    ai_review: Optional[AIReview] = None
    recommendations: list[Recommendation] = []
    stats: dict = {}
