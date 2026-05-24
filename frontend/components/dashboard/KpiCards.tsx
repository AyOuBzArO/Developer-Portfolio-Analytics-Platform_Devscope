'use client'

import { useEffect, useState } from 'react'
import type { AnalysisResult } from '@/lib/types'

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
  { key: 'total_repos',  label: 'Repositories', sublabel: 'total public',   Icon: RepoIcon,   accent: '#6366f1', delay: 0   },
  { key: 'active_repos', label: 'Active Repos',  sublabel: 'last 90 days',  Icon: FlameIcon,  accent: '#f97316', delay: 80  },
  { key: 'total_stars',  label: 'Total Stars',   sublabel: 'across all repos', Icon: StarIcon, accent: '#fbbf24', delay: 160 },
  { key: 'followers',    label: 'Followers',     sublabel: 'on GitHub',     Icon: PeopleIcon, accent: '#34d399', delay: 240 },
]

function KpiCard({
  label, sublabel, Icon, accent, value, delay
}: {
  label: string; sublabel: string
  Icon: React.FC; accent: string; value: number; delay: number
}) {
  const [displayVal, setDisplayVal] = useState(0)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!visible) return
    const duration = 900
    const step = 16
    const steps = duration / step
    let current = 0
    const inc = value / steps
    const timer = setInterval(() => {
      current += inc
      if (current >= value) { setDisplayVal(value); clearInterval(timer) }
      else setDisplayVal(Math.round(current))
    }, step)
    return () => clearInterval(timer)
  }, [visible, value])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `rgba(13,17,23,0.95)` : 'rgba(13,17,23,0.8)',
        border: `1px solid ${hovered ? `${accent}40` : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14, padding: '18px 20px',
        position: 'relative', overflow: 'hidden',
        cursor: 'default',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        transition: 'opacity 0.5s ease, transform 0.5s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: hovered ? `0 0 20px ${accent}20` : '0 0 0 transparent',
      }}
    >
      {/* bg glow on hover */}
      <div style={{
        position: 'absolute', bottom: -30, right: -30,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${accent}${hovered ? '18' : '08'} 0%, transparent 70%)`,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, marginBottom: 14,
        background: `${accent}15`,
        border: `1px solid ${accent}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent,
        boxShadow: hovered ? `0 0 12px ${accent}40` : 'none',
        transition: 'box-shadow 0.25s ease',
      }}>
        <Icon />
      </div>

      {/* Value */}
      <div style={{
        fontSize: 28, fontWeight: 800, color: '#f0f6fc', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        textShadow: hovered ? `0 0 16px ${accent}50` : 'none',
        transition: 'text-shadow 0.25s ease',
      }}>
        {displayVal.toLocaleString()}
      </div>

      {/* Labels */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 12.5, color: '#c9d1d9', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: '#6e7681', marginTop: 1 }}>{sublabel}</div>
      </div>
    </div>
  )
}

interface Props { stats?: AnalysisResult['stats'] }

export function KpiCards({ stats }: Props) {
  if (!stats) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, sublabel, Icon, accent, delay }) => (
        <KpiCard
          key={key}
          label={label}
          sublabel={sublabel}
          Icon={Icon}
          accent={accent}
          value={typeof stats[key as keyof typeof stats] === 'number' ? stats[key as keyof typeof stats] as number : 0}
          delay={delay}
        />
      ))}
    </div>
  )
}
