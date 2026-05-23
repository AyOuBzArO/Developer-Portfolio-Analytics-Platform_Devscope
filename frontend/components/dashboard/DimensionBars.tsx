'use client'

import { getDimensionColor } from '@/lib/utils'
import type { AnalysisResult } from '@/lib/types'

const LABELS: Record<string, string> = {
  activity: 'Activité',
  code_quality: 'Qualité Code',
  documentation: 'Documentation',
  diversity: 'Diversité',
  community: 'Communauté',
}

interface Props {
  breakdown: AnalysisResult['score_breakdown']
}

export function DimensionBars({ breakdown }: Props) {
  if (!breakdown) return null
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <p className="text-slate-400 text-sm font-medium mb-4">Détail par dimension</p>
      <div className="flex flex-col gap-4">
        {Object.entries(breakdown).map(([key, dim]) => {
          const pct = Math.round((dim.score / dim.max) * 100)
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 text-sm">{LABELS[key] ?? key}</span>
                <span className="text-slate-400 text-xs">{Math.round(dim.score)}/{dim.max}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: getDimensionColor(key) }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
