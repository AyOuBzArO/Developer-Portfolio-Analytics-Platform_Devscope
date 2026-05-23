'use client'

import type { RepoSummary } from '@/lib/types'

interface Props {
  repos: RepoSummary[]
  username: string
  onFixIt: (repo: RepoSummary) => void
}

function healthScore(repo: RepoSummary): number {
  let score = 0
  if (repo.readme_score > 50) score++
  if (repo.has_tests) score++
  if (repo.has_cicd) score++
  if (repo.has_license) score++
  if (repo.has_gitignore) score++
  return Math.round((score / 5) * 100)
}

const CheckSvg = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XSvg = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const StarSvg = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const ForkSvg = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
    <path d="M6 9v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
  </svg>
)

const ClockSvg = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

function HealthBadge({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.08)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.15)'}`,
      color: ok ? '#34d399' : '#f87171',
    }}>
      {ok ? <CheckSvg /> : <XSvg />}
      <span style={{ fontSize: 11, color: ok ? '#6ee7b7' : '#fca5a5', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  )
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? '#34d399' : value >= 40 ? '#fbbf24' : '#f87171'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 4, borderRadius: 99,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${value}%`,
          background: color, borderRadius: 99,
          transition: 'width .6s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 30, textAlign: 'right' }}>
        {value}%
      </span>
    </div>
  )
}

function daysSince(dateStr?: string): string {
  if (!dateStr) return 'never'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function RepoHealthGrid({ repos, onFixIt }: Props) {
  if (!repos || repos.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        color: '#484f58', fontSize: 14,
      }}>
        No repositories found in this analysis.
      </div>
    )
  }

  const sorted = [...repos].sort((a, b) => healthScore(a) - healthScore(b))

  const avgHealth = Math.round(
    sorted.reduce((s, r) => s + healthScore(r), 0) / sorted.length
  )

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, padding: '14px 18px',
        background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
      }}>
        <div>
          <p style={{ fontSize: 13, color: '#8b949e', margin: 0 }}>
            Average repo health across {repos.length} repositories
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 140 }}>
            <ScoreBar value={avgHealth} />
          </div>
          <span style={{
            fontSize: 12, padding: '3px 10px', borderRadius: 99,
            background: avgHealth >= 70 ? 'rgba(16,185,129,0.1)' : avgHealth >= 40 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
            color: avgHealth >= 70 ? '#34d399' : avgHealth >= 40 ? '#fbbf24' : '#f87171',
            border: `1px solid ${avgHealth >= 70 ? 'rgba(16,185,129,0.2)' : avgHealth >= 40 ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)'}`,
            fontWeight: 600,
          }}>
            {avgHealth >= 70 ? 'Healthy' : avgHealth >= 40 ? 'Needs work' : 'Critical'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 14,
      }}>
        {sorted.map(repo => {
          const hs = healthScore(repo)
          const color = hs >= 70 ? '#34d399' : hs >= 40 ? '#fbbf24' : '#f87171'
          return (
            <div key={repo.name} style={{
              background: 'rgba(22,27,34,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              padding: '16px 18px',
              transition: 'border-color .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.name}
                    </span>
                    {repo.language && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(99,102,241,0.1)', color: '#a5b4fc',
                        border: '1px solid rgba(99,102,241,0.2)', flexShrink: 0,
                      }}>{repo.language}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11.5, color: '#8b949e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {repo.description || 'No description'}
                  </p>
                </div>
                {/* Health circle */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0, marginLeft: 12,
                  background: `conic-gradient(${color} ${hs * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#161b22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color }}>{hs}</span>
                  </div>
                </div>
              </div>

              {/* README score bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#8b949e' }}>README quality</span>
                  <span style={{ fontSize: 11, color: '#8b949e' }}>{repo.readme_score}/100</span>
                </div>
                <ScoreBar value={repo.readme_score} />
              </div>

              {/* Health badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 13 }}>
                <HealthBadge ok={repo.readme_score > 50} label="README" />
                <HealthBadge ok={repo.has_tests} label="Tests" />
                <HealthBadge ok={repo.has_cicd} label="CI/CD" />
                <HealthBadge ok={repo.has_license} label="License" />
                <HealthBadge ok={repo.has_gitignore} label=".gitignore" />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#484f58' }}>
                    <StarSvg />{repo.stars}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#484f58' }}>
                    <ForkSvg />{repo.forks}
                  </span>
                  <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#484f58' }}>
                    <ClockSvg />{daysSince(repo.last_commit)}
                  </span>
                </div>
                {hs < 100 && (
                  <button
                    onClick={() => onFixIt(repo)}
                    style={{
                      padding: '4px 10px', borderRadius: 7, border: 'none',
                      background: 'rgba(99,102,241,0.15)',
                      color: '#818cf8', fontSize: 11.5, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                  >
                    Fix it →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
