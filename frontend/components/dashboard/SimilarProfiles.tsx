'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'
import { getSimilarProfiles } from '@/lib/api'
import type { AnalysisResult, SimilarProfile } from '@/lib/types'

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#2b7489', JavaScript: '#f1e05a',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', Swift: '#F05138',
}

interface Props {
  username: string
  analysisData: Pick<AnalysisResult, 'languages' | 'score_breakdown' | 'global_score'>
}

function ProfileCard({ profile }: { profile: SimilarProfile }) {
  const { t } = useT()
  const router = useRouter()

  return (
    <div style={{
      background: 'rgba(22,27,34,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'border-color .15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      {/* Header: avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar_url}
          alt={profile.username}
          width={44}
          height={44}
          style={{ borderRadius: '50%', border: '2px solid rgba(99,102,241,0.3)', flexShrink: 0 }}
          onError={e => { (e.target as HTMLImageElement).src = `https://github.com/identicons/${profile.username}.png` }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.name ?? `@${profile.username}`}
          </div>
          <a
            href={profile.github_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            @{profile.username}
          </a>
        </div>
        {/* Stats pills */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#8b949e' }}>
            <strong style={{ color: '#c9d1d9' }}>{profile.followers.toLocaleString()}</strong> {t('similar.followers')}
          </span>
          <span style={{ fontSize: 11, color: '#8b949e' }}>
            <strong style={{ color: '#c9d1d9' }}>{profile.public_repos}</strong> {t('similar.repos')}
          </span>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p style={{
          fontSize: 12.5, color: '#8b949e', margin: 0, lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {profile.bio}
        </p>
      )}

      {/* Top languages */}
      {profile.top_languages.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {profile.top_languages.slice(0, 4).map(lang => (
            <span key={lang} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: '#8b949e',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6, padding: '2px 8px',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: LANG_COLORS[lang] ?? '#64748b', display: 'inline-block',
              }} />
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* Why similar */}
      {profile.why_similar && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {t('similar.whySimilar')}
          </div>
          <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {profile.why_similar}
          </p>
        </div>
      )}

      {/* What they do better */}
      {profile.what_they_do_better.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            {t('similar.dosBetter')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {profile.what_they_do_better.slice(0, 3).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 12.5, color: '#8b949e', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
        <button
          onClick={() => router.push(`/dashboard/${profile.username}`)}
          style={{
            flex: 1, padding: '7px 12px', borderRadius: 8,
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            color: '#818cf8', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
        >
          {t('similar.analyzeProfile')}
        </button>
        <a
          href={profile.github_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, transition: 'background .15s', color: '#8b949e', textDecoration: 'none',
          }}
          title={t('similar.viewGitHub')}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

export function SimilarProfiles({ username, analysisData }: Props) {
  const { t } = useT()
  const [profiles, setProfiles] = useState<SimilarProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const result = await getSimilarProfiles(username, analysisData)
      setProfiles(result)
      setLoaded(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load on mount
  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{
            fontSize: 14, fontWeight: 700, color: '#e6edf3',
            textTransform: 'uppercase', letterSpacing: '.06em', margin: 0,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {/* Sparkle icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/>
              <path d="M19 3L19.75 5.25L22 6L19.75 6.75L19 9L18.25 6.75L16 6L18.25 5.25Z"/>
              <path d="M5 17L5.5 18.5L7 19L5.5 19.5L5 21L4.5 19.5L3 19L4.5 18.5Z"/>
            </svg>
            {t('similar.title')}
          </h2>
          <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
            {t('similar.subtitle')}
          </p>
        </div>
        {loaded && !loading && (
          <button
            onClick={load}
            style={{
              padding: '5px 12px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            ↺ {t('similar.retry')}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <div style={{
            width: 20, height: 20, border: '2px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', flexShrink: 0,
          }} />
          <span style={{ fontSize: 13.5, color: '#8b949e' }}>{t('similar.loading')}</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{
          background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)',
          borderRadius: 12, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13.5, color: '#f87171' }}>{t('similar.error')}</span>
          <button
            onClick={load}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
              color: '#fca5a5', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('similar.retry')}
          </button>
        </div>
      )}

      {/* Profile cards */}
      {!loading && !error && profiles.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 14,
        }}>
          {profiles.map(profile => (
            <ProfileCard key={profile.username} profile={profile} />
          ))}
        </div>
      )}
    </div>
  )
}
