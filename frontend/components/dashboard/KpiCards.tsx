import type { AnalysisResult } from '@/lib/types'

// ── Inline SVG icons ───────────────────────────────────────────────────
const RepoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/>
    <path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
  </svg>
)

const FlameIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const PeopleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const CARDS = [
  { key: 'total_repos',  label: 'Repositories', Icon: RepoIcon,   accent: '#6366f1' },
  { key: 'active_repos', label: 'Active 90d',    Icon: FlameIcon,  accent: '#f97316' },
  { key: 'total_stars',  label: 'Total Stars',   Icon: StarIcon,   accent: '#fbbf24' },
  { key: 'followers',    label: 'Followers',     Icon: PeopleIcon, accent: '#34d399' },
]

interface Props { stats?: AnalysisResult['stats'] }

export function KpiCards({ stats }: Props) {
  if (!stats) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, Icon, accent }) => {
        const val = stats[key as keyof typeof stats]
        return (
          <div key={key} style={{
            background: 'rgba(22,27,34,0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, marginBottom: 12,
              background: `${accent}18`,
              border: `1px solid ${accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accent,
            }}>
              <Icon />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f6fc', lineHeight: 1 }}>
              {typeof val === 'number' ? val.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: 11.5, color: '#8b949e', marginTop: 5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
