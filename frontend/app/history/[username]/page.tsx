'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { getHistory } from '@/lib/api'
import type { HistoryEntry } from '@/lib/types'
import { getLevelBg } from '@/lib/utils'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

export default function HistoryPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getHistory(username).then(setEntries).finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Reverse for chronological order in chart
  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    score: e.global_score,
    level: e.level,
  }))

  const best = entries.reduce((b, e) => e.global_score > b.global_score ? e : b, entries[0])
  const latest = entries[0]
  const oldest = entries[entries.length - 1]
  const trend = entries.length >= 2 ? latest.global_score - oldest.global_score : 0

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link href="/" className="hover:text-slate-300 transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={`/dashboard/${username}`} className="hover:text-slate-300 transition-colors">
          @{username}
        </Link>
        <span>/</span>
        <span className="text-slate-200">Historique</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">
          Historique de <span className="text-blue-400">@{username}</span>
        </h1>
        <Link
          href={`/dashboard/${username}`}
          className="text-sm text-slate-400 hover:text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Dashboard →
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 mb-4">Aucune analyse trouvée pour @{username}.</p>
          <Link href={`/dashboard/${username}`} className="text-blue-400 hover:underline text-sm">
            Lancer une analyse →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Analyses" value={String(entries.length)} />
            <StatCard label="Score actuel" value={String(latest.global_score)} unit="/100" />
            <StatCard label="Meilleur score" value={String(best?.global_score ?? '—')} unit="/100" />
            <StatCard
              label="Progression"
              value={trend > 0 ? `+${trend}` : String(trend)}
              color={trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-400'}
            />
          </div>

          {/* Score chart — only if multiple entries */}
          {entries.length > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-slate-200 font-semibold mb-4">Évolution du score</h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [Number(value ?? 0), 'score']}
                  />
                  <ReferenceLine y={50} stroke="#334155" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Entries list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-slate-200 font-semibold">Toutes les analyses</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {entries.map((entry, i) => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-slate-500 text-xs w-5 text-right">{i + 1}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-slate-200 font-semibold">{entry.global_score}/100</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${getLevelBg(entry.level)}`}>
                          {entry.level}
                        </span>
                        {i === 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/40 border border-blue-700/40 text-blue-400">
                            Dernière
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(entry.created_at).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  {i > 0 && (
                    <ScoreDelta current={entry.global_score} previous={entries[i - 1].global_score} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-slate-100'}`}>
        {value}<span className="text-sm font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  )
}

function ScoreDelta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  if (diff === 0) return null
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
      diff > 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'
    }`}>
      {diff > 0 ? '+' : ''}{diff} vs précédente
    </span>
  )
}
