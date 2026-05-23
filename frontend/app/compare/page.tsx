'use client'

import { useState } from 'react'
import Link from 'next/link'
import { analyzeProfile } from '@/lib/api'
import type { AnalysisResult } from '@/lib/types'
import { getLevelBg, getDimensionColor } from '@/lib/utils'

const DIMENSION_LABELS: Record<string, string> = {
  activity: 'Activité',
  code_quality: 'Qualité code',
  documentation: 'Documentation',
  diversity: 'Diversité',
  community: 'Communauté',
}

const KPI_KEYS: { key: keyof AnalysisResult['stats']; label: string }[] = [
  { key: 'total_repos', label: 'Repos' },
  { key: 'total_stars', label: 'Stars' },
  { key: 'followers', label: 'Followers' },
  { key: 'active_repos', label: 'Repos actifs' },
]

function MiniRing({ score, color }: { score: number; color: string }) {
  const c = Math.min(100, Math.max(0, score))
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3.5"
          strokeDasharray={`${c} ${100 - c}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-100">
        {c}
      </span>
    </div>
  )
}

function DimensionRow({
  dimension,
  aScore,
  bScore,
  aMax,
  bMax,
}: {
  dimension: string
  aScore: number
  bScore: number
  aMax: number
  bMax: number
}) {
  const aPct = Math.round((aScore / aMax) * 100)
  const bPct = Math.round((bScore / bMax) * 100)
  const aWins = aPct >= bPct
  const color = getDimensionColor(dimension)

  return (
    <div className="flex items-center gap-3">
      {/* A bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${aPct}%`, backgroundColor: aWins ? color : '#475569' }}
          />
        </div>
        <span className={`text-xs w-8 text-right font-medium ${aWins ? 'text-slate-200' : 'text-slate-500'}`}>
          {aPct}
        </span>
        {aWins && aPct > bPct && <span className="text-[10px] text-emerald-400">▲</span>}
        {!aWins && <span className="w-3" />}
      </div>

      {/* Label */}
      <div className="w-28 text-center text-xs text-slate-400 flex-shrink-0">
        {DIMENSION_LABELS[dimension] ?? dimension}
      </div>

      {/* B bar */}
      <div className="flex-1 flex items-center gap-2 flex-row-reverse">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all ml-auto"
            style={{ width: `${bPct}%`, backgroundColor: !aWins ? color : '#475569' }}
          />
        </div>
        <span className={`text-xs w-8 text-left font-medium ${!aWins ? 'text-slate-200' : 'text-slate-500'}`}>
          {bPct}
        </span>
        {!aWins && bPct > aPct && <span className="text-[10px] text-emerald-400">▲</span>}
        {aWins && <span className="w-3" />}
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [userA, setUserA] = useState('')
  const [userB, setUserB] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profileA, setProfileA] = useState<AnalysisResult | null>(null)
  const [profileB, setProfileB] = useState<AnalysisResult | null>(null)

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault()
    if (!userA.trim() || !userB.trim()) return
    if (userA.trim().toLowerCase() === userB.trim().toLowerCase()) {
      setError('Entrez deux usernames différents.')
      return
    }

    setLoading(true)
    setError('')
    setProfileA(null)
    setProfileB(null)

    try {
      const [a, b] = await Promise.all([
        analyzeProfile(userA.trim()),
        analyzeProfile(userB.trim()),
      ])
      setProfileA(a)
      setProfileB(b)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? 'Impossible de charger un des profils. Vérifiez les usernames.')
    } finally {
      setLoading(false)
    }
  }

  const aWinsOverall = (profileA?.global_score ?? 0) >= (profileB?.global_score ?? 0)

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors text-sm">
          ← Accueil
        </Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-xl font-bold text-slate-100">Comparer deux profils</h1>
      </div>

      {/* Search form */}
      <form onSubmit={handleCompare} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            value={userA}
            onChange={e => setUserA(e.target.value)}
            placeholder="Premier username"
            disabled={loading}
            className="flex-1 w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-sm">
            VS
          </div>
          <input
            type="text"
            value={userB}
            onChange={e => setUserB(e.target.value)}
            placeholder="Deuxième username"
            disabled={loading}
            className="flex-1 w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !userA.trim() || !userB.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse...
              </span>
            ) : 'Comparer'}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}
      </form>

      {/* Results */}
      {profileA && profileB && (
        <div className="space-y-6">
          {/* Winner banner */}
          <div className={`rounded-2xl p-4 border text-center ${
            profileA.global_score === profileB.global_score
              ? 'bg-slate-900 border-slate-700'
              : aWinsOverall
                ? 'bg-blue-950/30 border-blue-700/40'
                : 'bg-violet-950/30 border-violet-700/40'
          }`}>
            {profileA.global_score === profileB.global_score ? (
              <p className="text-slate-300 font-semibold">Égalité parfaite ! {profileA.global_score}/100 chacun</p>
            ) : (
              <p className="text-slate-100 font-semibold text-lg">
                <span className={aWinsOverall ? 'text-blue-400' : 'text-violet-400'}>
                  @{aWinsOverall ? profileA.username : profileB.username}
                </span>
                {' '}gagne avec{' '}
                <strong>{aWinsOverall ? profileA.global_score : profileB.global_score}</strong>
                {' '}vs{' '}
                <strong>{aWinsOverall ? profileB.global_score : profileA.global_score}</strong>
                {' '}points
              </p>
            )}
          </div>

          {/* Score header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="grid grid-cols-3 items-center">
              {/* Profile A */}
              <div className="flex flex-col items-center gap-3">
                <Link
                  href={`/dashboard/${profileA.username}`}
                  className="text-lg font-bold text-slate-100 hover:text-blue-400 transition-colors"
                >
                  @{profileA.username}
                </Link>
                <MiniRing
                  score={profileA.global_score}
                  color={aWinsOverall ? '#3b82f6' : '#475569'}
                />
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getLevelBg(profileA.level)}`}>
                  {profileA.level}
                </span>
              </div>

              {/* VS */}
              <div className="text-center text-slate-600 font-bold text-2xl">VS</div>

              {/* Profile B */}
              <div className="flex flex-col items-center gap-3">
                <Link
                  href={`/dashboard/${profileB.username}`}
                  className="text-lg font-bold text-slate-100 hover:text-violet-400 transition-colors"
                >
                  @{profileB.username}
                </Link>
                <MiniRing
                  score={profileB.global_score}
                  color={!aWinsOverall ? '#8b5cf6' : '#475569'}
                />
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getLevelBg(profileB.level)}`}>
                  {profileB.level}
                </span>
              </div>
            </div>
          </div>

          {/* Dimension comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-5">Comparaison par dimension</h2>
            <div className="space-y-4">
              {Object.entries(profileA.score_breakdown).map(([dim, aData]) => {
                const bData = profileB.score_breakdown[dim as keyof typeof profileB.score_breakdown]
                if (!bData) return null
                return (
                  <DimensionRow
                    key={dim}
                    dimension={dim}
                    aScore={aData.score}
                    bScore={bData.score}
                    aMax={aData.max}
                    bMax={bData.max}
                  />
                )
              })}
            </div>
          </div>

          {/* KPI comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">Statistiques</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {KPI_KEYS.map(({ key, label }) => {
                const aVal = profileA.stats[key] as number
                const bVal = profileB.stats[key] as number
                const aW = aVal >= bVal
                return (
                  <div key={key} className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-2">{label}</p>
                    <div className="flex items-end justify-center gap-2">
                      <span className={`text-lg font-bold ${aW ? 'text-slate-100' : 'text-slate-500'}`}>{aVal}</span>
                      <span className="text-slate-600 text-xs mb-0.5">vs</span>
                      <span className={`text-lg font-bold ${!aW ? 'text-slate-100' : 'text-slate-500'}`}>{bVal}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {profileA.username} / {profileB.username}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/dashboard/${profileA.username}`}
              className="text-center py-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl text-sm text-slate-300 transition-colors"
            >
              Voir le dashboard de @{profileA.username} →
            </Link>
            <Link
              href={`/dashboard/${profileB.username}`}
              className="text-center py-3 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl text-sm text-slate-300 transition-colors"
            >
              Voir le dashboard de @{profileB.username} →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
