'use client'

import { useEffect, useState } from 'react'
import { getLevelBg } from '@/lib/utils'

interface Props { score: number; level: string }

export function ScoreRing({ score, level }: Props) {
  const [displayScore, setDisplayScore] = useState(0)
  const [animated, setAnimated] = useState(false)

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (displayScore / 100) * circumference

  const strokeColor =
    score >= 75 ? '#facc15' :
    score >= 55 ? '#a78bfa' :
    score >= 30 ? '#60a5fa' : '#94a3b8'

  const glowColor =
    score >= 75 ? 'rgba(250,204,21,0.3)' :
    score >= 55 ? 'rgba(167,139,250,0.3)' :
    score >= 30 ? 'rgba(96,165,250,0.3)' : 'rgba(148,163,184,0.2)'

  // Count-up animation
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!animated) return
    const duration = 1200
    const step = 16
    const steps = duration / step
    let current = 0
    const inc = score / steps
    const timer = setInterval(() => {
      current += inc
      if (current >= score) { setDisplayScore(score); clearInterval(timer) }
      else setDisplayScore(Math.round(current))
    }, step)
    return () => clearInterval(timer)
  }, [animated, score])

  const grade =
    score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' :
    score >= 60 ? 'B' : score >= 50 ? 'C+' : score >= 40 ? 'C' : 'D'

  return (
    <div style={{
      background: 'rgba(13,17,23,0.9)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, padding: '24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Bg glow behind ring */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 180, height: 180,
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'background 1s ease',
      }} />

      <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '.07em' }}>
        Global Score
      </p>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
              filter: `drop-shadow(0 0 6px ${strokeColor})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 52, fontWeight: 800, color: '#f0f6fc',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 20px ${strokeColor}60`,
          }}>
            {displayScore}
          </span>
          <span style={{ fontSize: 13, color: '#6e7681', marginTop: 2 }}>/100</span>
          <span style={{
            fontSize: 18, fontWeight: 800, color: strokeColor,
            marginTop: 4,
            textShadow: `0 0 12px ${strokeColor}80`,
          }}>
            {grade}
          </span>
        </div>
      </div>

      {/* Level badge */}
      <span style={{ marginTop: 14 }} className={`text-sm px-4 py-1.5 rounded-full border font-semibold ${getLevelBg(level)}`}>
        {level}
      </span>
    </div>
  )
}
