'use client'

import { useState } from 'react'
import { getHiringSignal } from '@/lib/api'
import type { AnalysisResult, HiringSignal } from '@/lib/types'

interface Props {
  username: string
  analysisData: Pick<AnalysisResult, 'score_breakdown' | 'stats' | 'top_repositories' | 'languages'>
}

const HireableIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const MaybeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
)
const NotYetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const MinusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

type VerdictCfg = { color: string; bg: string; border: string; Icon: React.FC; glow: string }
const VERDICT_CONFIG: Record<string, VerdictCfg> = {
  'Hireable': {
    color: '#34d399', bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.25)', Icon: HireableIcon,
    glow: 'rgba(16,185,129,0.15)',
  },
  'Strong Maybe': {
    color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.25)', Icon: MaybeIcon,
    glow: 'rgba(251,191,36,0.1)',
  },
  'Not Yet': {
    color: '#f87171', bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.25)', Icon: NotYetIcon,
    glow: 'rgba(248,113,113,0.1)',
  },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? '#34d399' : value >= 45 ? '#fbbf24' : '#f87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 5, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 99, transition: 'width .8s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{value}%</span>
    </div>
  )
}

export function HiringSignalCard({ username, analysisData }: Props) {
  const [data, setData] = useState<HiringSignal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revealed, setRevealed] = useState(false)

  async function run() {
    setLoading(true)
    setError('')
    setRevealed(false)
    try {
      const result = await getHiringSignal(username, analysisData)
      setData(result)
      setRevealed(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail ?? 'AI service unavailable.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const cfg = data ? VERDICT_CONFIG[data.verdict] ?? VERDICT_CONFIG['Strong Maybe'] : null

  return (
    <div style={{
      background: 'rgba(22,27,34,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f0f6fc' }}>
            Hiring Signal
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#8b949e' }}>
            Recruiter-perspective verdict on @{username}
          </p>
        </div>
        <div style={{
          padding: '3px 10px', borderRadius: 99,
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
          fontSize: 11, color: '#a5b4fc', fontWeight: 500,
        }}>
          AI-powered
        </div>
      </div>

      <div style={{ padding: '22px' }}>
        {/* Idle state */}
        {!revealed && !loading && (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
                </svg>
              </div>
              <p style={{ fontSize: 13.5, color: '#8b949e', maxWidth: 320, margin: '0 auto' }}>
                Get a senior recruiter's honest take — would they hire this developer today?
              </p>
            </div>
            {error && (
              <div style={{
                marginBottom: 14, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                fontSize: 13, color: '#fca5a5', textAlign: 'left',
              }}>{error}</div>
            )}
            <button
              onClick={run}
              style={{
                padding: '10px 28px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Generate hiring signal
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 36, height: 36, border: '2px solid rgba(99,102,241,0.2)',
              borderTopColor: '#6366f1', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 14px',
            }} />
            <p style={{ fontSize: 13.5, color: '#8b949e' }}>
              Recruiter is reviewing the profile…
            </p>
          </div>
        )}

        {/* Result */}
        {revealed && data && cfg && (
          <div style={{ animation: 'fadeUp .3s ease' }}>
            {/* Verdict banner */}
            <div style={{
              padding: '18px 20px', borderRadius: 14, marginBottom: 20,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 0 30px ${cfg.glow}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, border: `2px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cfg.color,
                }}>
                  <cfg.Icon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: cfg.color }}>
                      {data.verdict}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#c9d1d9' }}>
                    {data.one_liner}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, color: '#8b949e' }}>Recruiter confidence</span>
                </div>
                <ConfidenceBar value={data.confidence} />
              </div>
            </div>

            {/* Two columns: strengths + concerns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Strengths
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(data.strengths || []).map((s, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6, fontSize: 12.5, color: '#c9d1d9' }}>
                      <span style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }}><PlusIcon /></span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Concerns
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(data.concerns || []).map((c, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 6, fontSize: 12.5, color: '#c9d1d9' }}>
                      <span style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }}><MinusIcon /></span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Best fit roles */}
            {(data.best_fit_roles || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#8b949e', fontWeight: 500 }}>Best fit roles</p>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {data.best_fit_roles.map((role, i) => (
                    <span key={i} style={{
                      padding: '4px 11px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                      background: 'rgba(139,92,246,0.1)', color: '#c4b5fd',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}>{role}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <p style={{ margin: 0, fontSize: 13, color: '#8b949e', lineHeight: 1.65, fontStyle: 'italic' }}>
                "{data.summary}"
              </p>
            </div>

            {/* Redo */}
            <div style={{ textAlign: 'right', marginTop: 14 }}>
              <button
                onClick={run}
                style={{
                  padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent', color: '#8b949e', fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
              >
                ↺ Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
