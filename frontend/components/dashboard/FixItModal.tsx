'use client'

import { useState, useEffect } from 'react'
import { generateFile } from '@/lib/api'
import type { RepoSummary, GeneratedFile } from '@/lib/types'

interface Props {
  username: string
  repo: RepoSummary
  onClose: () => void
}

type FileTab = 'readme' | 'ci' | 'gitignore' | 'license'

const ReadmeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const CiIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const ScaleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="22"/>
    <path d="M5 6h14"/>
    <path d="M5 6 3 12h4L5 6z"/>
    <path d="M19 6l-2 6h4l-2-6z"/>
    <path d="M6 20h12"/>
  </svg>
)
const ClipboardIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)
const CopiedCheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const TABS: { key: FileTab; label: string; file: string; Icon: React.FC }[] = [
  { key: 'readme',    label: 'README',     file: 'README.md',                 Icon: ReadmeIcon },
  { key: 'ci',        label: 'CI/CD',      file: '.github/workflows/ci.yml',  Icon: CiIcon     },
  { key: 'gitignore', label: '.gitignore', file: '.gitignore',                Icon: ShieldIcon },
  { key: 'license',   label: 'LICENSE',    file: 'LICENSE',                   Icon: ScaleIcon  },
]

function missingFiles(repo: RepoSummary): FileTab[] {
  const missing: FileTab[] = []
  if (repo.readme_score < 50) missing.push('readme')
  if (!repo.has_cicd)         missing.push('ci')
  if (!repo.has_gitignore)    missing.push('gitignore')
  if (!repo.has_license)      missing.push('license')
  return missing
}

export function FixItModal({ username, repo, onClose }: Props) {
  const defaultTab = missingFiles(repo)[0] ?? 'readme'
  const [activeTab, setActiveTab] = useState<FileTab>(defaultTab)
  const [cache, setCache] = useState<Partial<Record<FileTab, GeneratedFile>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<FileTab | null>(null)

  const missing = missingFiles(repo)

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Auto-generate the first missing file as soon as the modal opens
  useEffect(() => {
    generate(defaultTab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate(tab: FileTab) {
    if (cache[tab]) { setActiveTab(tab); return }
    setActiveTab(tab)
    setLoading(true)
    setError('')
    try {
      const result = await generateFile(username, repo.name, tab)
      setCache(prev => ({ ...prev, [tab]: result }))
    } catch {
      setError(`Failed to generate ${tab}. Try again.`)
    } finally {
      setLoading(false)
    }
  }

  function copy(tab: FileTab) {
    const file = cache[tab]
    if (!file) return
    navigator.clipboard.writeText(file.content)
    setCopied(tab)
    setTimeout(() => setCopied(null), 2000)
  }

  const current = cache[activeTab]

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        background: '#161b22', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'fadeUp .2s ease',
        display: 'flex', flexDirection: 'column',
        maxHeight: '88vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f0f6fc' }}>
              Fix it — <span style={{ color: '#818cf8' }}>{repo.name}</span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#8b949e' }}>
              AI-generated files you can copy directly into your repo
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.06)', color: '#8b949e',
              cursor: 'pointer', fontSize: 18, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, padding: '12px 22px 0',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const isMissing = missing.includes(tab.key)
            const isActive = activeTab === tab.key
            const isGenerated = !!cache[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => generate(tab.key)}
                style={{
                  padding: '8px 14px', borderRadius: '8px 8px 0 0', border: 'none',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                  color: isActive ? '#818cf8' : '#8b949e',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all .15s',
                }}
              >
                <tab.Icon />
                {tab.label}
                {isMissing && !isGenerated && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#f87171', display: 'inline-block',
                  }} />
                )}
                {isGenerated && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#34d399', display: 'inline-block',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
          {/* File info */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <code style={{ fontSize: 12, color: '#8b949e', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 5 }}>
              {TABS.find(t => t.key === activeTab)?.file}
            </code>
            {current && (
              <button
                onClick={() => copy(activeTab)}
                style={{
                  padding: '5px 14px', borderRadius: 8, border: 'none',
                  background: copied === activeTab ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                  color: copied === activeTab ? '#34d399' : '#818cf8',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                }}
              >
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  {copied === activeTab ? <CopiedCheckIcon /> : <ClipboardIcon />}
                  {copied === activeTab ? 'Copied!' : 'Copy'}
                </span>
              </button>
            )}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 32, height: 32, border: '2px solid rgba(99,102,241,0.2)',
                borderTopColor: '#6366f1', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <p style={{ fontSize: 13.5, color: '#8b949e' }}>Generating file…</p>
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              fontSize: 13, color: '#fca5a5',
            }}>{error}</div>
          )}

          {!loading && !current && !error && (
            <div style={{
              textAlign: 'center', padding: '40px 0',
              color: '#484f58', fontSize: 13.5,
            }}>
              <p style={{ marginBottom: 0 }}>Select a tab to generate the file.</p>
            </div>
          )}

          {current && !loading && (
            <pre style={{
              margin: 0,
              padding: '16px',
              background: 'rgba(13,17,23,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.6,
              color: '#c9d1d9',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            }}>
              {current.content}
            </pre>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '12px 22px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#484f58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 11.5, color: '#484f58' }}>
            Copy the content and paste it into the correct file path in your repository.
          </span>
        </div>
      </div>
    </div>
  )
}
