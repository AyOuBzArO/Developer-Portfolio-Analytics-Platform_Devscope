'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { analyzeProfile } from '@/lib/api'
import type { AnalysisResult, RepoSummary } from '@/lib/types'
import Link from 'next/link'
import { useT } from '@/lib/i18n'
import { LangThemeToggles } from '@/components/LangThemeToggles'
import { ScoreRing } from '@/components/dashboard/ScoreRing'
import { DimensionBars } from '@/components/dashboard/DimensionBars'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { RepoCard } from '@/components/dashboard/RepoCard'
import { RecommendationList } from '@/components/dashboard/RecommendationList'
import { AIReviewCard } from '@/components/dashboard/AIReviewCard'
import { LanguageChart } from '@/components/charts/LanguageChart'
import { ActivityChart } from '@/components/charts/ActivityChart'
import { RepoHealthGrid } from '@/components/dashboard/RepoHealthGrid'
import { RoastModal } from '@/components/dashboard/RoastModal'
import { HiringSignalCard } from '@/components/dashboard/HiringSignalCard'
import { FixItModal } from '@/components/dashboard/FixItModal'
import { EmailDigestSignup } from '@/components/dashboard/EmailDigestSignup'
import { PersonalTracker } from '@/components/dashboard/PersonalTracker'
import { SimilarProfiles } from '@/components/dashboard/SimilarProfiles'
import { getLevelBg } from '@/lib/utils'
import { getUserGithubLink } from '@/lib/api'

type Tab = 'overview' | 'health' | 'hiring'

export default function DashboardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const router = useRouter()
  const { t, lang } = useT()
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [showRoast, setShowRoast] = useState(false)
  const [fixRepo, setFixRepo] = useState<RepoSummary | null>(null)
  const [linkedGithub, setLinkedGithub] = useState<string | null>(null)

  useEffect(() => {
    const cached = localStorage.getItem('devscope_last_result')
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as AnalysisResult
        localStorage.removeItem('devscope_last_result')
        if (parsed.username === username.toLowerCase() && parsed.score_breakdown && parsed.stats) {
          setData(parsed)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    analyzeProfile(username)
      .then(setData)
      .catch(() => setError(t('dash.error')))
      .finally(() => setLoading(false))
  }, [username])

  // Fetch the signed-in user's linked GitHub username
  useEffect(() => {
    getUserGithubLink().then(setLinkedGithub)
  }, [])

  async function reanalyze() {
    setLoading(true)
    setError('')
    try {
      const result = await analyzeProfile(username, { force_refresh: true, language: lang })
      setData(result)
    } catch {
      setError(t('dash.reanalyzeError'))
    } finally {
      setLoading(false)
    }
  }

  // ── Loading / error states ──────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d1117',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, border: '2px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#8b949e', fontSize: 14 }}>{t('dash.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d1117',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171', marginBottom: 16 }}>{error || 'Data not found'}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              color: '#818cf8', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    )
  }

  const isOwnProfile =
    linkedGithub !== null &&
    linkedGithub.toLowerCase() === username.toLowerCase()

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'overview',
      label: t('dash.tabs.overview'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      key: 'health',
      label: t('dash.tabs.health'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      key: 'hiring',
      label: t('dash.tabs.hiring'),
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      {/* Modals */}
      {showRoast && (
        <RoastModal
          username={data.username}
          score={data.global_score}
          analysisData={data}
          onClose={() => setShowRoast(false)}
        />
      )}
      {fixRepo && (
        <FixItModal
          username={data.username}
          repo={fixRepo}
          onClose={() => setFixRepo(null)}
        />
      )}

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(22,27,34,0.5)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'none', border: 'none', color: '#8b949e',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: 0, transition: 'color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="DS" width={20} height={20} style={{ borderRadius: 4, objectFit: 'cover' }} />
              DevScope
            </button>
            <span style={{ color: '#30363d', fontSize: 16 }}>/</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#e6edf3' }}>@{data.username}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getLevelBg(data.level)}`}>
              {data.level}
            </span>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Language + Theme toggles */}
            <LangThemeToggles compact />
            {/* Roast button */}
            <button
              onClick={() => setShowRoast(true)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.25)',
                background: 'rgba(248,113,113,0.08)', color: '#fca5a5',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              {t('dash.actions.roast')}
            </button>

            {/* Score card / PDF */}
            <button
              onClick={() => window.open(`/scorecard/${data.username}`, '_blank')}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#8b949e',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f0f6fc' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8b949e' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {t('dash.actions.pdf')}
            </button>

            <Link
              href={`/history/${data.username}`}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#8b949e',
                fontSize: 12.5, fontWeight: 500, textDecoration: 'none',
                transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {t('dash.actions.history')}
            </Link>

            <button
              onClick={reanalyze}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)',
                background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
            >
              {t('dash.actions.reanalyze')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(13,17,23,0.5)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '12px 16px', border: 'none',
                borderBottom: `2px solid ${tab === t.key ? '#6366f1' : 'transparent'}`,
                background: 'transparent',
                color: tab === t.key ? '#818cf8' : '#8b949e',
                fontSize: 13.5, fontWeight: tab === t.key ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'color .15s',
              }}
              onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.color = '#f0f6fc' }}
              onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.color = '#8b949e' }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* Personal tracker banner */}
            <div style={{ marginBottom: 16 }}>
              <PersonalTracker
                viewedUsername={username}
                linkedUsername={linkedGithub}
                onLinkChange={setLinkedGithub}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ScoreRing score={data.global_score} level={data.level} />
                <DimensionBars breakdown={data.score_breakdown} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <KpiCards stats={data.stats} />
                {data.activity && <ActivityChart data={data.activity} />}
                {data.languages && Object.keys(data.languages).length > 0 && (
                  <LanguageChart languages={data.languages} />
                )}
                {data.ai_review && <AIReviewCard review={data.ai_review} />}
                <RecommendationList recommendations={data.recommendations ?? []} />
              </div>
            </div>

            {/* Top repos */}
            {(data.top_repositories?.length ?? 0) > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
                  {t('dash.sections.topRepos')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                  {data.top_repositories.map(repo => (
                    <RepoCard key={repo.name} repo={repo} username={data.username} lang={lang} />
                  ))}
                </div>
              </div>
            )}

            {/* Similar profiles — only shown when viewing own linked profile */}
            {isOwnProfile && data && (
              <div style={{ marginBottom: 20 }}>
                <SimilarProfiles
                  username={data.username}
                  analysisData={data}
                />
              </div>
            )}

            {/* Email digest */}
            <EmailDigestSignup username={data.username} />
          </>
        )}

        {/* ── REPO HEALTH TAB ──────────────────────────────────── */}
        {tab === 'health' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', marginBottom: 6 }}>
                {t('dash.health.title')}
              </h2>
              <p style={{ fontSize: 13.5, color: '#8b949e' }}>
                {t('dash.health.subtitle')}
              </p>
            </div>
            <RepoHealthGrid
              repos={data.top_repositories}
              username={data.username}
              onFixIt={(repo) => setFixRepo(repo)}
            />
            {/* Email digest at the bottom */}
            <div style={{ marginTop: 28 }}>
              <EmailDigestSignup username={data.username} />
            </div>
          </>
        )}

        {/* ── HIRING SIGNAL TAB ────────────────────────────────── */}
        {tab === 'hiring' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', marginBottom: 6 }}>
                {t('dash.hiring.title')}
              </h2>
              <p style={{ fontSize: 13.5, color: '#8b949e' }}>
                {t('dash.hiring.subtitle', { u: data.username })}
              </p>
            </div>
            <div style={{ maxWidth: 680 }}>
              <HiringSignalCard username={data.username} analysisData={data} />
            </div>
            <div style={{ marginTop: 24, maxWidth: 680 }}>
              <EmailDigestSignup username={data.username} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
