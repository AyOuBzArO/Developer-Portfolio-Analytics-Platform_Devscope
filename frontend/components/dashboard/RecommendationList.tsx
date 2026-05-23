import type { Recommendation } from '@/lib/types'
import { getPriorityColor } from '@/lib/utils'

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  important: 'Important',
  improvement: 'Amélioration',
}

interface Props {
  recommendations: Recommendation[]
}

export function RecommendationList({ recommendations }: Props) {
  if (!recommendations?.length) return null

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-slate-200 font-semibold mb-4">Recommandations</h2>
      <div className="flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${getPriorityColor(rec.priority)}`}>
              {PRIORITY_LABELS[rec.priority] ?? rec.priority}
            </span>
            <div>
              <p className="text-slate-200 text-sm font-medium">{rec.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
