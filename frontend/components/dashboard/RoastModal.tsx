'use client'

import { useState, useEffect } from 'react'
import { getRoast } from '@/lib/api'
import type { RoastResult } from '@/lib/types'

import type { AnalysisResult } from '@/lib/types'

interface Props {
  username: string
  score: number
  analysisData: Pick<AnalysisResult, 'score_breakdown' | 'stats' | 'top_repositories'>
  onClose: () => void
}

// ── Level icons (SVG) ──────────────────────────────────────────────────
const SkullIcon = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a9 9 0 0 1 9 9c0 3.18-1.65 5.97-4.13 7.6L16 21H8l-.87-2.4A9 9 0 0 1 3 11a9 9 0 0 1 9-9z"/>
    <line x1="9" y1="15" x2="9" y2="17"/>
    <line x1="15" y1="15" x2="15" y2="17"/>
    <circle cx="9" cy="12" r="1.5" fill={color} stroke="none"/>
    <circle cx="15" cy="12" r="1.5" fill={color} stroke="none"/>
  </svg>
)
const FlameIcon = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)
const SparkleIcon = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
    <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" strokeWidth="1.4"/>
    <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" strokeWidth="1.3"/>
  </svg>
)
const ClipboardIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)
const CopiedIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XShareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

type RoastLevel = { LevelIcon: React.FC<{ color: string }>; label: string; color: string }
const ROAST_LABELS: Record<string, RoastLevel> = {
  low:  { LevelIcon: SkullIcon,   label: 'Crispy',     color: '#f87171' },
  mid:  { LevelIcon: FlameIcon,   label: 'Roasted',    color: '#fb923c' },
  high: { LevelIcon: SparkleIcon, label: 'Mild Roast', color: '#fbbf24' },
}

function getRoastLevel(score: number): RoastLevel {
  if (score < 40) return ROAST_LABELS.low
  if (score < 70) return ROAST_LABELS.mid
  return ROAST_LABELS.high
}

export function RoastModal({ username, score, analysisData, onClose }: Props) {
  const [result, setResult] = useState<RoastResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function runRoast() {
    setLoading(true)
    setError('')
    setResult(null)
    getRoast(username, analysisData)
      .then(setResult)
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? err?.message ?? 'Unknown error'
        setError(`AI failed to roast: ${msg}. Try again.`)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { runRoast() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function copy() {
    if (!result) return
    navigator.clipboard.writeText(result.roast)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const level = getRoastLevel(score)

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        overflowY: 'auto',         // allow scrolling if viewport is short
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#161b22', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'fadeUp .2s ease',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh',          // never taller than viewport
        margin: 'auto',            // center correctly when scrolling
      }}>
        {/* Header — pinned */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(251,146,60,0.06))',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <level.LevelIcon color={level.color} />
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f6fc' }}>
                  {level.label} — @{username}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#8b949e' }}>
                  Score: {score}/100 · DevScope Roast Mode
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#8b949e',
                cursor: 'pointer', fontSize: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >×</button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 36, height: 36, border: '2px solid rgba(248,113,113,0.3)',
                borderTopColor: '#f87171', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 14px',
              }} />
              <p style={{ fontSize: 13.5, color: '#8b949e' }}>
                AI is sharpening its knives…
              </p>
            </div>
          )}

          {error && (
            <div>
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                fontSize: 13, color: '#fca5a5', marginBottom: 14,
              }}>{error}</div>
              <button
                onClick={runRoast}
                style={{
                  width: '100%', padding: '9px', borderRadius: 9, border: 'none',
                  background: 'rgba(248,113,113,0.1)', color: '#fca5a5',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ↺ Try again
              </button>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Divider with flame icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.3))' }} />
                <span style={{ color: '#fb923c', display: 'flex' }}>
                  <FlameIcon color="#fb923c" />
                </span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(248,113,113,0.3), transparent)' }} />
              </div>

              <p style={{
                fontSize: 14, color: '#c9d1d9', lineHeight: 1.75,
                margin: 0, whiteSpace: 'pre-wrap',
              }}>
                {result.roast}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={copy}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9,
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)'}`,
                    color: copied ? '#34d399' : '#8b949e', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {copied ? <CopiedIcon /> : <ClipboardIcon />}
                    {copied ? 'Copied' : 'Copy roast'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`I got roasted by DevScope 🔥\n\n"${result.roast.slice(0, 200)}..."\n\nMy score: ${score}/100 devscope.app`)
                    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
                  }}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 9,
                    background: 'rgba(29,155,240,0.1)', border: '1px solid rgba(29,155,240,0.2)',
                    color: '#60a5fa', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,155,240,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(29,155,240,0.1)')}
                >
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <XShareIcon /> Share the pain
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
