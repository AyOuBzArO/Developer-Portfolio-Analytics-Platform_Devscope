'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCachedProfile } from '@/lib/api'
import type { RepoSummary } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#2b7489', JavaScript: '#f1e05a',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', Swift: '#F05138',
}

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${clamped} ${100 - clamped}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-100">
          {clamped}
        </span>
      </div>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  )
}

function QualityCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
      ok
        ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
        : 'bg-slate-900 border-slate-800 text-slate-500'
    }`}>
      {ok ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )}
      {label}
    </div>
  )
}

export default function RepoDetailPage({
  params,
}: {
  params: Promise<{ username: string; reponame: string }>
}) {
  const { username, reponame } = use(params)
  const router = useRouter()
  const { lang } = useT()
  const [repo, setRepo] = useState<RepoSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCachedProfile(username)
      .then(profile => {
        if (!profile) { setError('Analyse introuvable pour cet utilisateur.'); return }
        const found = profile.top_repositories.find(
          r => r.name.toLowerCase() === reponame.toLowerCase()
        )
        if (!found) { setError(`Repo "${reponame}" non trouvé dans l'analyse.`); return }
        setRepo(found)
      })
      .catch(() => setError('Erreur lors du chargement.'))
      .finally(() => setLoading(false))
  }, [username, reponame])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !repo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Données introuvables'}</p>
          <Link href={`/dashboard/${username}`} className="text-blue-400 hover:underline">
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#64748b') : '#64748b'
  const overallScore = Math.round((repo.readme_score + repo.activity_score) / 2)

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <button onClick={() => router.push('/')} className="hover:text-slate-300 transition-colors">
          Accueil
        </button>
        <span>/</span>
        <Link href={`/dashboard/${username}`} className="hover:text-slate-300 transition-colors">
          @{username}
        </Link>
        <span>/</span>
        <span className="text-slate-200">{repo.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-100">{repo.name}</h1>
              {repo.language && (
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: langColor }} />
                  {repo.language}
                </span>
              )}
            </div>
            {repo.description && (
              <p className="text-slate-400 text-sm mb-4">{repo.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              {repo.stars > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <strong className="text-slate-300">{repo.stars}</strong> stars
                </span>
              )}
              {repo.forks > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
                    <path d="M6 9v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
                  </svg>
                  <strong className="text-slate-300">{repo.forks}</strong> forks
                </span>
              )}
              {(repo.watchers ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <strong className="text-slate-300">{repo.watchers}</strong> watchers
                </span>
              )}
              {repo.size_kb !== undefined && repo.size_kb > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                  {repo.size_kb > 1024 ? `${(repo.size_kb / 1024).toFixed(1)} MB` : `${repo.size_kb} KB`}
                </span>
              )}
            </div>
          </div>
          <a
            href={`https://github.com/${username}/${repo.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Voir sur GitHub
          </a>
        </div>

        {/* Topics */}
        {(repo.topics?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {repo.topics!.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 bg-blue-950/50 border border-blue-800/40 text-blue-400 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="flex gap-6 mt-4 text-xs text-slate-500">
          {repo.last_commit && (
            <span>
              {lang === 'fr' ? 'Dernier commit :' : 'Last commit:'}
              {' '}<span className="text-slate-400">{timeAgo(repo.last_commit, lang)}</span>
            </span>
          )}
          {repo.created_at && (
            <span>
              {lang === 'fr' ? 'Créé :' : 'Created:'}
              {' '}<span className="text-slate-400">{new Date(repo.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short' })}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score gauges */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-200 font-semibold mb-6">Scores du repo</h2>
          <div className="flex justify-around">
            <ScoreGauge value={overallScore} label="Score global" color="#3b82f6" />
            <ScoreGauge value={repo.readme_score} label="Documentation" color="#8b5cf6" />
            <ScoreGauge value={repo.activity_score} label="Activité" color="#10b981" />
          </div>
        </div>

        {/* Quality checks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-slate-200 font-semibold mb-4">Qualité du code</h2>
          <div className="flex flex-col gap-2">
            <QualityCheck ok={!!repo.has_cicd} label="CI/CD (GitHub Actions)" />
            <QualityCheck ok={!!repo.has_tests} label="Tests automatisés" />
            <QualityCheck ok={!!repo.has_license} label="Licence open source" />
            <QualityCheck ok={!!repo.has_gitignore} label=".gitignore présent" />
          </div>
        </div>
      </div>

      {/* Score interpretation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
        <h2 className="text-slate-200 font-semibold mb-4">Analyse détaillée</h2>
        <div className="space-y-3">
          <ScoreRow
            label="Documentation (README)"
            score={repo.readme_score}
            description={
              repo.readme_score >= 70 ? 'README bien structuré avec badges, sections, et contenu.' :
              repo.readme_score >= 40 ? 'README présent mais peut être enrichi (badges, installation, usage).' :
              'README absent ou très minimal — priorité critique.'
            }
          />
          <ScoreRow
            label="Activité récente"
            score={repo.activity_score}
            description={
              repo.activity_score >= 70 ? 'Repo actif, commits récents.' :
              repo.activity_score >= 30 ? 'Activité modérée, quelques mois sans commit.' :
              'Repo inactif depuis longtemps.'
            }
          />
        </div>
      </div>
    </div>
  )
}

function ScoreRow({ label, score, description }: { label: string; score: number; description: string }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-medium text-slate-200">{score}/100</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mb-1">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  )
}
