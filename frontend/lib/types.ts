export interface HistoryEntry {
  id: string
  username: string
  created_at: string
  global_score: number
  level: string
}

export interface ScoreDimension {
  score: number
  max: number
  details: Record<string, unknown>
}

export interface RepoSummary {
  name: string
  description?: string
  language?: string
  stars: number
  forks: number
  watchers?: number
  topics?: string[]
  readme_score: number
  activity_score: number
  repo_score: number
  last_commit?: string
  created_at?: string
  has_gitignore?: boolean
  has_license?: boolean
  has_cicd?: boolean
  has_tests?: boolean
  size_kb?: number
}

export interface AIReview {
  content: string
  model_used: string
}

export interface Recommendation {
  priority: 'critical' | 'important' | 'improvement'
  category: string
  title: string
  description: string
}

export interface AnalysisResult {
  id: string
  username: string
  analyzed_at: string
  global_score: number
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert'
  score_breakdown: {
    activity: ScoreDimension
    code_quality: ScoreDimension
    documentation: ScoreDimension
    diversity: ScoreDimension
    community: ScoreDimension
  }
  top_repositories: RepoSummary[]
  languages: Record<string, number>
  ai_review?: AIReview
  recommendations: Recommendation[]
  stats: {
    total_repos: number
    total_stars: number
    active_repos: number
    followers: number
    global_score: number
    level: string
  }
  activity?: { month: string; commits: number }[]
}

// ── New feature types ──────────────────────────────────────────────────

export interface RoastResult {
  roast: string
  score: number
}

export interface HiringSignal {
  verdict: 'Hireable' | 'Strong Maybe' | 'Not Yet'
  confidence: number
  one_liner: string
  strengths: string[]
  concerns: string[]
  best_fit_roles: string[]
  summary: string
}

export interface GeneratedFile {
  file: string
  content: string
  language: string
}

export interface SimilarProfile {
  username: string
  avatar_url: string
  name: string | null
  bio: string | null
  followers: number
  public_repos: number
  top_languages: string[]
  why_similar: string
  what_they_do_better: string[]
  github_url: string
}
