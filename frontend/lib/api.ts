import axios from 'axios'
import type { AnalysisResult, HistoryEntry, RoastResult, HiringSignal, GeneratedFile, SimilarProfile } from './types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  timeout: 60000,
})

export async function analyzeProfile(
  username: string,
  options?: { force_refresh?: boolean; language?: string }
): Promise<AnalysisResult> {
  const { data } = await api.post<AnalysisResult>('/api/v1/analyze', {
    username,
    force_refresh: options?.force_refresh ?? false,
    language: options?.language ?? 'fr',
  })
  return data
}

export async function getCachedProfile(username: string): Promise<AnalysisResult | null> {
  try {
    const { data } = await api.get<AnalysisResult>(`/api/v1/profile/${username}`)
    return data
  } catch {
    return null
  }
}

export async function getHistory(username: string): Promise<HistoryEntry[]> {
  try {
    const { data } = await api.get<{ username: string; entries: HistoryEntry[] }>(`/api/v1/history/${username}`)
    return data.entries
  } catch {
    return []
  }
}

export async function getRoast(
  username: string,
  analysisData?: Pick<AnalysisResult, 'score_breakdown' | 'stats' | 'top_repositories'>
): Promise<RoastResult> {
  const { data } = await api.post<RoastResult>(`/api/v1/roast/${username}`, {
    score_breakdown: analysisData?.score_breakdown ?? {},
    stats: analysisData?.stats ?? {},
    top_repositories: analysisData?.top_repositories ?? [],
  })
  return data
}

export async function getHiringSignal(
  username: string,
  analysisData?: Pick<AnalysisResult, 'score_breakdown' | 'stats' | 'top_repositories' | 'languages'>
): Promise<HiringSignal> {
  const { data } = await api.post<HiringSignal>(`/api/v1/hiring-signal/${username}`, {
    score_breakdown: analysisData?.score_breakdown ?? {},
    stats: analysisData?.stats ?? {},
    top_repositories: analysisData?.top_repositories ?? [],
    languages: analysisData?.languages ?? {},
  })
  return data
}

export async function generateFile(
  username: string,
  repo: string,
  fileType: 'readme' | 'ci' | 'gitignore' | 'license'
): Promise<GeneratedFile> {
  const { data } = await api.post<GeneratedFile>(`/api/v1/generate-file/${username}/${repo}`, {
    file_type: fileType,
  })
  return data
}

// ── Similar Profiles ──────────────────────────────────────────────────

export async function getSimilarProfiles(
  username: string,
  analysisData?: Pick<AnalysisResult, 'languages' | 'score_breakdown' | 'global_score'>
): Promise<SimilarProfile[]> {
  const { data } = await api.post<{ username: string; similar_profiles: SimilarProfile[] }>(
    `/api/v1/similar/${username}`,
    {
      languages: analysisData?.languages ?? {},
      score_breakdown: analysisData?.score_breakdown ?? {},
      global_score: analysisData?.global_score ?? 0,
    }
  )
  return data.similar_profiles
}

// ── User GitHub link (calls internal Next.js API routes) ──────────────

export async function getUserGithubLink(): Promise<string | null> {
  try {
    const res = await fetch('/api/user/github-link')
    if (!res.ok) return null
    const json = await res.json()
    return json.githubUsername ?? null
  } catch {
    return null
  }
}

export async function updateGithubLink(githubUsername: string | null): Promise<string | null> {
  try {
    const res = await fetch('/api/user/github-link', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubUsername }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.githubUsername ?? null
  } catch {
    return null
  }
}
