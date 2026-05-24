'use client'

import { useEffect, useState, useRef } from 'react'
import type { AnalysisResult } from '@/lib/types'

/* ── Dimension config ───────────────────────────────────────── */
const DIMENSIONS: Record<string, {
  label: string
  labelFr: string
  gradient: [string, string]
  icon: React.ReactNode
}> = {
  activity: {
    label: 'Activity', labelFr: 'Activité',
    gradient: ['#6366f1', '#8b5cf6'],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  code_quality: {
    label: 'Code Quality', labelFr: 'Qualité Code',
    gradient: ['#06b6d4', '#3b82f6'],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  documentation: {
    label: 'Documentation', labelFr: 'Documentation',
    gradient: ['#10b981', '#34d399'],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  diversity: {
    label: 'Diversity', labelFr: 'Diversité',
    gradient: ['#f59e0b', '#f97316'],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  community: {
    label: 'Community', labelFr: 'Communauté',
    gradient: ['#ec4899', '#f43f5e'],
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
}

/* ── Animated bar row ───────────────────────────────────────── */
function DimBar({
  dimKey, score, max, delay,
}: { dimKey: string; score: number; max: number; delay: number }) {
  const [animated, setAnimated] = useState(false)
  const [countVal, setCountVal] = useState(0)
  const pct = Math.round((score / max) * 100)
  const cfg = DIMENSIONS[dimKey] ?? {
    label: dimKey, labelFr: dimKey,
    gradient: ['#6366f1', '#818cf8'] as [string, string],
    icon: null,
  }

  useEffect(() => {
    const t1 = setTimeout(() => setAnimated(true), delay)
    return () => clearTimeout(t1)
  }, [delay])

  // Count-up number
  useEffect(() => {
    if (!animated) return
    const target = Math.round(score)
    const duration = 900
    const step = 16
    const steps = duration / step
    let current = 0
    const inc = target / steps
    const timer = setInterval(() => {
      current += inc
      if (current >= target) { setCountVal(target); clearInterval(timer) }
      else setCountVal(Math.round(current))
    }, step)
    return () => clearInterval(timer)
  }, [animated, score])

  const [g1, g2] = cfg.gradient
  const gradId = `grad-${dimKey}`

  return (
    <div style={{
      opacity: animated ? 1 : 0,
      transform: animated ? 'translateX(0)' : 'translateX(-12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            color: g1, display: 'flex', alignItems: 'center',
            filter: `drop-shadow(0 0 4px ${g1}80)`,
          }}>
            {cfg.icon}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#c9d1d9' }}>{cfg.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: g1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {countVal}<span style={{ color: '#6e7681', fontWeight: 400 }}>/{max}</span>
          </span>
          <span style={{
            fontSize: 10, color: g1,
            background: `${g1}18`,
            border: `1px solid ${g1}30`,
            padding: '2px 7px', borderRadius: 99, fontWeight: 600,
          }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Track */}
      <div style={{
        height: 8, background: 'rgba(255,255,255,0.06)',
        borderRadius: 99, overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Filled bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: animated ? `${pct}%` : '0%',
          background: `linear-gradient(90deg, ${g1}, ${g2})`,
          borderRadius: 99,
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 10px ${g1}60`,
        }} />
        {/* Shimmer */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          animation: animated ? 'shimmer 2.5s infinite' : 'none',
          borderRadius: 99,
        }} />
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
interface Props { breakdown: AnalysisResult['score_breakdown'] }

export function DimensionBars({ breakdown }: Props) {
  if (!breakdown) return null

  const entries = Object.entries(breakdown)
  const total = entries.reduce((s, [, d]) => s + d.score, 0)
  const maxTotal = entries.reduce((s, [, d]) => s + d.max, 0)
  const overallPct = Math.round((total / maxTotal) * 100)

  return (
    <div style={{
      background: 'rgba(13,17,23,0.9)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '22px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* bg glow */}
      <div style={{
        position: 'absolute', bottom: -40, right: -40,
        width: 180, height: 180,
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f0f6fc' }}>Score Breakdown</p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#6e7681' }}>5 weighted dimensions</p>
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: overallPct >= 70 ? '#34d399' : overallPct >= 45 ? '#fbbf24' : '#f87171',
          background: overallPct >= 70 ? 'rgba(52,211,153,0.1)' : overallPct >= 45 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${overallPct >= 70 ? 'rgba(52,211,153,0.25)' : overallPct >= 45 ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)'}`,
          padding: '5px 12px', borderRadius: 99,
        }}>
          {overallPct}% overall
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {entries.map(([key, dim], i) => (
          <DimBar
            key={key}
            dimKey={key}
            score={dim.score}
            max={dim.max}
            delay={i * 120 + 150}
          />
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
