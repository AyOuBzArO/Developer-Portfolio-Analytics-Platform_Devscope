'use client'

import { getLevelColor, getLevelBg } from '@/lib/utils'

interface Props {
  score: number
  level: string
}

export function ScoreRing({ score, level }: Props) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const strokeColor =
    score >= 75 ? '#facc15' : score >= 55 ? '#a78bfa' : score >= 30 ? '#60a5fa' : '#94a3b8'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
      <p className="text-slate-400 text-sm mb-4 font-medium">Score Global</p>
      <div className="relative">
        <svg width="200" height="200" className="-rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#1e293b" strokeWidth="12" />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={strokeColor} strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-slate-100">{score}</span>
          <span className="text-slate-400 text-sm">/100</span>
        </div>
      </div>
      <span className={`mt-3 text-sm px-3 py-1 rounded-full border font-medium ${getLevelBg(level)}`}>
        {level}
      </span>
    </div>
  )
}
