'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { analyzeProfile } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { LangThemeToggles } from '@/components/LangThemeToggles'

// Steps are rendered dynamically via t() — see handleAnalyze / loading UI
const STEP_KEYS = [
  'loading.step1', 'loading.step2', 'loading.step3', 'loading.step4', 'loading.step5',
] as const

// ── Feature SVG icons ──────────────────────────────────────────────
const FeatureIcons: Record<string, React.ReactNode> = {
  scoring: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1"/>
      <rect x="10" y="7" width="4" height="14" rx="1"/>
      <rect x="17" y="3" width="4" height="18" rx="1"/>
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" strokeWidth="1.4"/>
      <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" strokeWidth="1.3"/>
    </svg>
  ),
  repo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="13" y2="17"/>
    </svg>
  ),
  compare: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="4"/>
      <circle cx="16" cy="7" r="4"/>
      <path d="M2 21v-2a4 4 0 0 1 4-4h4"/>
      <path d="M22 21v-2a4 4 0 0 0-4-4h-4"/>
    </svg>
  ),
  history: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  recs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
    </svg>
  ),
}

const FEATURES = [
  { iconKey: 'scoring', color: 'rgba(99,102,241,0.1)',  stroke: 'rgba(99,102,241,0.2)',  titleKey: 'features.scoring.title', descKey: 'features.scoring.desc' },
  { iconKey: 'ai',      color: 'rgba(16,185,129,0.1)',  stroke: 'rgba(16,185,129,0.2)',  titleKey: 'features.ai.title',      descKey: 'features.ai.desc' },
  { iconKey: 'repo',    color: 'rgba(139,92,246,0.1)',  stroke: 'rgba(139,92,246,0.2)',  titleKey: 'features.repo.title',    descKey: 'features.repo.desc' },
  { iconKey: 'compare', color: 'rgba(245,158,11,0.1)',  stroke: 'rgba(245,158,11,0.2)',  titleKey: 'features.compare.title', descKey: 'features.compare.desc' },
  { iconKey: 'history', color: 'rgba(244,63,94,0.1)',   stroke: 'rgba(244,63,94,0.2)',   titleKey: 'features.history.title', descKey: 'features.history.desc' },
  { iconKey: 'recs',    color: 'rgba(99,102,241,0.1)',  stroke: 'rgba(99,102,241,0.2)',  titleKey: 'features.recs.title',    descKey: 'features.recs.desc' },
] as const


const COMPARE_ROWS = [
  { labelKey: 'whyUs.row.scoring',   us: true, gh: false, other: 'partial' },
  { labelKey: 'whyUs.row.ai',        us: true, gh: false, other: false },
  { labelKey: 'whyUs.row.repo',      us: true, gh: false, other: 'partial' },
  { labelKey: 'whyUs.row.compare',   us: true, gh: false, other: 'partial' },
  { labelKey: 'whyUs.row.history',   us: true, gh: false, other: false },
  { labelKey: 'whyUs.row.recruiter', us: true, gh: false, other: false },
  { labelKey: 'whyUs.row.nosignup',  us: true, gh: true,  other: 'partial' },
] as const

const TESTIMONIALS = [
  {
    stars: 5,
    text: "Ran DevScope two days before my Meta phone screen. It flagged that 4 of my top repos had no CI setup and weak READMEs. Fixed them overnight. The recruiter literally mentioned my GitHub looked clean during the call.",
    name: 'Ryan Kowalski',
    role: 'Software Engineer · Warsaw → London',
    avatar: 'https://i.pravatar.cc/96?img=12',
    avatarGrad: 'linear-gradient(135deg,#6366f1,#4f46e5)',
  },
  {
    stars: 4,
    text: "The dimension breakdown is genuinely useful — I had no idea my 'community' score was dragging me down because I never opened issues or reviewed others' code. Knocked off one star because the AI review can be a bit generic sometimes, but the raw metrics are spot on.",
    name: 'Amira Ndiaye',
    role: 'Frontend Engineer · Dakar → Paris',
    avatar: 'https://i.pravatar.cc/96?img=45',
    avatarGrad: 'linear-gradient(135deg,#10b981,#059669)',
  },
  {
    stars: 5,
    text: "I was at 29/100 and honestly felt embarrassed. Three weeks of following the roadmap — adding tests, fixing READMEs, pinning repos — and I'm at 71. Got two recruiter messages on LinkedIn the same week. Coincidence? Probably not.",
    name: 'Lucas Ferreira',
    role: 'Backend Developer · São Paulo',
    avatar: 'https://i.pravatar.cc/96?img=52',
    avatarGrad: 'linear-gradient(135deg,#f59e0b,#d97706)',
  },
]

// ── Sub-components ──────────────────────────────────────────────────

// ── Ticker entries (defined once, shared between the two halves) ───────────
const TICKER_ENTRIES = [
  { u: 'alex_morgan42', score: 81, color: '#6366f1', mins: 0  },
  { u: 'sarah_t_codes', score: 63, color: '#6366f1', mins: 1  },
  { u: 'mk_fullstack',  score: 92, color: '#10b981', mins: 2  },
  { u: 'priya_dev99',   score: 58, color: '#f59e0b', mins: 4  },
  { u: 'lukas_backend', score: 74, color: '#6366f1', mins: 6  },
  { u: 'nina_ux_code',  score: 38, color: '#ef4444', mins: 8  },
  { u: 'tad_software',  score: 85, color: '#10b981', mins: 10 },
  { u: 'omar_devs',     score: 67, color: '#6366f1', mins: 13 },
  { u: 'jen_fullstack', score: 77, color: '#6366f1', mins: 15 },
  { u: 'carlos_react',  score: 51, color: '#f59e0b', mins: 18 },
  { u: 'anya_builds',   score: 88, color: '#10b981', mins: 21 },
  { u: 'dev_jm_io',     score: 45, color: '#f59e0b', mins: 24 },
]
// Duplicate for seamless CSS scroll loop
const TICKER_DOUBLED = [...TICKER_ENTRIES, ...TICKER_ENTRIES]

/**
 * Standalone ending section — own state, own submit handler.
 * Never touches the hero's loading / step state, so clicking "Find out →"
 * navigates directly to the dashboard without scrolling to the top.
 */
function LiveTickerSection({ placeholder, freeNote, lang }: { placeholder: string; freeNote: string; lang: string }) {
  const router = useRouter()
  const [tickerInput, setTickerInput] = useState('')
  const [tickerLoading, setTickerLoading] = useState(false)
  const [tickerError, setTickerError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = tickerInput.trim()
    if (!val) return
    setTickerLoading(true)
    setTickerError('')
    try {
      const result = await analyzeProfile(val, { language: lang as 'en' | 'fr' })
      localStorage.setItem('devscope_last_result', JSON.stringify(result))
      router.push(`/dashboard/${val.toLowerCase()}`)
    } catch (err: unknown) {
      setTickerLoading(false)
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) setTickerError(`Profile "${val}" not found on GitHub.`)
      else if (status === 429) setTickerError('Rate limit hit — try again in a moment.')
      else setTickerError('Something went wrong. Please try again.')
    }
  }

  return (
    <section style={{ position: 'relative', zIndex: 1, padding: '90px 0 100px', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }} />
      <style>{`
        @keyframes scrollUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Section title ──────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            color: '#818cf8', letterSpacing: '.12em', textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Don&apos;t wait
          </span>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800,
            letterSpacing: '-1.5px', lineHeight: 1.1,
            color: '#f0f6fc', margin: '0 0 14px',
          }}>
            Your peers are already{' '}
            <span style={{ background: 'linear-gradient(90deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ahead
            </span>
          </h2>
          <p style={{ fontSize: 16, color: '#8b949e', maxWidth: 480, margin: '0 auto' }}>
            Hundreds of developers checked their score this week. The average is{' '}
            <strong style={{ color: '#c9d1d9' }}>58/100</strong>. Are you above or below?
          </p>
        </div>

        {/* ── Two columns ──────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: 56, alignItems: 'center',
        }}>

          {/* ── LEFT: hook + form ──────────────────────────────────── */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 14px', borderRadius: 99,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              marginBottom: 24,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>3,200+ profiles analyzed</span>
            </div>

            <h3 style={{
              fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 800,
              letterSpacing: '-1px', lineHeight: 1.15,
              color: '#f0f6fc', marginBottom: 14,
            }}>
              Where do<br />
              <span style={{ background: 'linear-gradient(90deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                you land?
              </span>
            </h3>

            <p style={{ fontSize: 14.5, color: '#8b949e', lineHeight: 1.7, marginBottom: 28, maxWidth: 360 }}>
              Type any GitHub username and get a full score breakdown — free, no sign-up, results in under 30 seconds.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={tickerInput}
                  onChange={e => { setTickerInput(e.target.value); setTickerError('') }}
                  placeholder={placeholder}
                  disabled={tickerLoading}
                  style={{
                    flex: 1, padding: '13px 16px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${tickerError ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#f0f6fc', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    opacity: tickerLoading ? 0.6 : 1, transition: 'border-color .15s',
                  }}
                  onFocus={e => { if (!tickerError) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' } }}
                  onBlur={e => { e.currentTarget.style.borderColor = tickerError ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="submit"
                  disabled={tickerLoading || !tickerInput.trim()}
                  style={{
                    padding: '13px 22px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: tickerLoading || !tickerInput.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                    opacity: tickerLoading || !tickerInput.trim() ? 0.5 : 1,
                    transition: 'opacity .15s',
                  }}
                >
                  {tickerLoading ? 'Analyzing…' : 'Find out →'}
                </button>
              </div>
              {tickerError && (
                <p style={{ fontSize: 12.5, color: '#fca5a5', margin: 0, paddingLeft: 4 }}>
                  ⚠ {tickerError}
                </p>
              )}
            </form>

            <p style={{ marginTop: 12, fontSize: 12, color: '#30363d' }}>{freeNote}</p>
          </div>

          {/* ── RIGHT: live ticker panel ────────────────────────────── */}
          <div>
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'rgba(22,27,34,0.9)',
              border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none',
              borderRadius: '12px 12px 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                  animation: 'pulse-dot 1.6s ease-in-out infinite', display: 'block',
                }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#10b981', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Live activity
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#484f58' }}>real-time</span>
            </div>

            {/* Scrolling feed */}
            <div style={{
              height: 258, overflow: 'hidden',
              background: 'rgba(13,17,23,0.7)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '0 0 12px 12px',
              position: 'relative',
            }}>
              {/* Top/bottom fades */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, zIndex: 2, background: 'linear-gradient(to bottom,rgba(13,17,23,0.95),transparent)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, zIndex: 2, background: 'linear-gradient(to top,rgba(13,17,23,0.95),transparent)', pointerEvents: 'none' }} />

              <div style={{ animation: 'scrollUp 22s linear infinite' }}>
                {TICKER_DOUBLED.map((e, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: `${e.color}18`, border: `1px solid ${e.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: e.color,
                    }}>
                      {e.score}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: '#c9d1d9', fontWeight: 500, fontFamily: 'monospace', marginBottom: 4 }}>
                        @{e.u}
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${e.score}%`, background: e.color, borderRadius: 99, opacity: 0.7 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#484f58', flexShrink: 0 }}>
                      {e.mins === 0 ? 'just now' : `${e.mins}m ago`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/** Real photo avatar with gradient-initial fallback if the image fails to load */
function AvatarPhoto({ src, name, grad }: { src: string; name: string; grad: string }) {
  return (
    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
      {/* Fallback layer (always rendered, sits behind the img) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: grad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 700, color: '#fff',
      }}>
        {name[0].toUpperCase()}
      </div>
      {/* Photo layer — hides the fallback when it loads */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        width={40}
        height={40}
        style={{
          position: 'absolute', inset: 0,
          width: 40, height: 40,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.08)',
        }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

function ProductMockup() {
  return (
    <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* Glow behind mockup */}
      <div style={{
        position: 'absolute', inset: -60, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(99,102,241,0.09) 0%, transparent 65%)',
      }} />
      {/* Browser shell */}
      <div style={{
        position: 'relative', background: '#161b22',
        border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)',
      }}>
        {/* Browser bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px',
          background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <div style={{
            flex: 1, maxWidth: 280, margin: '0 auto', padding: '5px 12px',
            borderRadius: 6, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11.5, color: '#484f58', textAlign: 'center',
          }}>devscope.app/dashboard/torvalds</div>
        </div>
        {/* Dashboard content */}
        <div style={{ padding: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Left column */}
          <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Score ring */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <svg viewBox="0 0 36 36" width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#rg1)" strokeWidth="3"
                    strokeDasharray="82 18" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="rg1" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8"/>
                      <stop offset="100%" stopColor="#6366f1"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc' }}>82</span>
                  <span style={{ fontSize: 9, color: '#484f58' }}>/ 100</span>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>Avancé</span>
            </div>
            {/* Dimension bars */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 14,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Dimensions</div>
              {[
                { name: 'Activity',     pct: '88%', color: '#6366f1', val: '88' },
                { name: 'Code quality', pct: '76%', color: '#8b5cf6', val: '76' },
                { name: 'Docs',         pct: '65%', color: '#10b981', val: '65' },
                { name: 'Diversity',    pct: '90%', color: '#f59e0b', val: '90' },
                { name: 'Community',    pct: '82%', color: '#ec4899', val: '82' },
              ].map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, color: '#8b949e', width: 75, flexShrink: 0 }}>{d.name}</span>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: d.pct, height: '100%', background: d.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#484f58', width: 22, textAlign: 'right' }}>{d.val}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* KPI row */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: '244', label: 'Repos' },
                { val: '244k', label: 'Stars' },
                { val: '304k', label: 'Followers' },
                { val: '12', label: 'Active' },
              ].map(k => (
                <div key={k.label} style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '11px 12px',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.5px' }}>{k.val}</div>
                  <div style={{ fontSize: 10, color: '#484f58', marginTop: 1 }}>{k.label}</div>
                </div>
              ))}
            </div>
            {/* Activity chart */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 14,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Commit activity</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 50 }}>
                {[35, 55, 42, 70, 60, 85, 72, 90, 65, 48, 78, 95].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
                    background: h > 80 ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.25)',
                  }} />
                ))}
              </div>
            </div>
            {/* Repo cards */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { name: 'linux',     lang: 'C',   color: '#555',    stars: '193k' },
                { name: 'subsurface',lang: 'C++', color: '#f34b7d', stars: '2.3k' },
                { name: 'uemacs',    lang: 'C',   color: '#555',    stars: '1.4k' },
              ].map(r => (
                <div key={r.name} style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 9, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#f0f6fc', marginBottom: 4 }}>{r.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 9.5, color: '#484f58' }}>
                      <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: r.color, marginRight: 3, verticalAlign: 'middle' }} />
                      {r.lang}
                    </span>
                    <span style={{ fontSize: 9.5, color: '#484f58', display:'flex', alignItems:'center', gap:3 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="#484f58" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      {r.stars}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Interactive Demo ────────────────────────────────────────────────
const DEMO_STEPS = [
  { n: '01', color: '#6366f1', titleKey: 'demo.step1.title', descKey: 'demo.step1.desc' },
  { n: '02', color: '#8b5cf6', titleKey: 'demo.step2.title', descKey: 'demo.step2.desc' },
  { n: '03', color: '#10b981', titleKey: 'demo.step3.title', descKey: 'demo.step3.desc' },
  { n: '04', color: '#f59e0b', titleKey: 'demo.step4.title', descKey: 'demo.step4.desc' },
] as const

const DEMO_URLS = [
  'devscope.app',
  'devscope.app — analyzing…',
  'devscope.app/dashboard/torvalds',
  'devscope.app/dashboard/torvalds',
]

function DemoScreen0() {
  return (
    <div style={{ padding: '28px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 12.5, color: '#8b949e', marginBottom: 18 }}>
        Analyze any public GitHub developer
      </p>
      <div style={{ display: 'flex', gap: 8, maxWidth: 340, margin: '0 auto 14px' }}>
        <div style={{
          flex: 1, padding: '9px 13px', borderRadius: 8,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.45)',
          boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
          fontSize: 13, color: '#f0f6fc', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          torvalds
          <span style={{ display: 'inline-block', width: 1.5, height: 13, background: '#6366f1', animation: 'blink 1s step-end infinite', borderRadius: 1 }} />
        </div>
        <div style={{
          padding: '9px 14px', borderRadius: 8,
          background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
          fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap',
        }}>Analyze →</div>
      </div>
      <p style={{ fontSize: 11, color: '#484f58', marginBottom: 22 }}>
        Free · No sign-up · Public profiles only
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {['torvalds', 'gaearon', 'sindresorhus', 'tj'].map(u => (
          <span key={u} style={{
            fontSize: 11.5, color: '#484f58', padding: '4px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>@{u}</span>
        ))}
      </div>
    </div>
  )
}

const DEMO_ANALYSIS_STEPS = [
  { label: 'Fetching GitHub profile',    done: true,  active: false },
  { label: 'Scanning 244 repositories',  done: true,  active: false },
  { label: 'Scoring 5 dimensions',       done: false, active: true  },
  { label: 'Running AI review',          done: false, active: false },
  { label: 'Finalizing report',          done: false, active: false },
]

function DemoScreen1() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        padding: '12px 14px', borderRadius: 10,
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#8b949e">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>Analyzing @torvalds</p>
          <p style={{ fontSize: 11, color: '#8b949e', margin: 0 }}>244 repositories · ~8 seconds</p>
        </div>
      </div>
      {DEMO_ANALYSIS_STEPS.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: s.done ? '#6366f1' : s.active ? 'transparent' : 'rgba(255,255,255,0.04)',
            border: s.active ? '2px solid #6366f1' : 'none',
          }}>
            {s.done && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {s.active && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'pulse 1s ease-in-out infinite' }} />
            )}
          </div>
          <span style={{ fontSize: 13, color: s.done ? '#c9d1d9' : s.active ? '#f0f6fc' : '#484f58', flex: 1 }}>
            {s.label}
          </span>
          {s.done && <span style={{ fontSize: 11, color: '#6366f1' }}>✓</span>}
          {s.active && <span style={{ fontSize: 11, color: '#8b5cf6' }}>running…</span>}
        </div>
      ))}
    </div>
  )
}

function DemoScreen2() {
  return (
    <div style={{ padding: 16, display: 'flex', gap: 12 }}>
      {/* Left */}
      <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <svg viewBox="0 0 36 36" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#rg2)" strokeWidth="3" strokeDasharray="82 18" strokeLinecap="round"/>
              <defs>
                <linearGradient id="rg2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8"/>
                  <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#f0f6fc' }}>82</span>
              <span style={{ fontSize: 8, color: '#484f58' }}>/ 100</span>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>Advanced</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Dimensions</div>
          {[
            { name: 'Activity',  pct: '88%', color: '#6366f1' },
            { name: 'Quality',   pct: '76%', color: '#8b5cf6' },
            { name: 'Docs',      pct: '65%', color: '#10b981' },
            { name: 'Diversity', pct: '90%', color: '#f59e0b' },
            { name: 'Community', pct: '82%', color: '#ec4899' },
          ].map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <span style={{ fontSize: 9.5, color: '#8b949e', width: 54, flexShrink: 0 }}>{d.name}</span>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                <div style={{ width: d.pct, height: '100%', background: d.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Right */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[{ val: '244', label: 'Repos' }, { val: '244k', label: 'Stars' }, { val: '304k', label: 'Followers' }, { val: '12', label: 'Active' }].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>{k.val}</div>
              <div style={{ fontSize: 9.5, color: '#484f58' }}>{k.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>Commit activity</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36 }}>
            {[35,55,42,70,60,85,72,90,65,48,78,95].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: h > 80 ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.22)' }} />
            ))}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>AI Review</div>
          <p style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.5, margin: 0 }}>
            "Exceptional activity and global impact. Strongest in diversity and community. Documentation could be improved on smaller repos."
          </p>
        </div>
      </div>
    </div>
  )
}

function DemoScreen3() {
  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Hiring signal */}
      <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>Hireable</span>
            <span style={{ fontSize: 11, color: '#8b949e', marginLeft: 8 }}>92% confidence</span>
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: '#8b949e', margin: 0, fontStyle: 'italic' }}>
          "Exceptional open-source contributions with proven global reach."
        </p>
      </div>
      {/* Repo health */}
      <p style={{ fontSize: 10, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>Repo Health</p>
      {[
        { name: 'linux',      score: 100, color: '#10b981', fix: false },
        { name: 'subsurface', score: 42,  color: '#f59e0b', fix: true },
        { name: 'uemacs',     score: 24,  color: '#ef4444', fix: true },
      ].map(r => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#c9d1d9', width: 82, flexShrink: 0 }}>{r.name}</span>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${r.score}%`, background: r.color, borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 10.5, color: r.color, width: 30, textAlign: 'right', flexShrink: 0 }}>{r.score}%</span>
          {r.fix && (
            <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', flexShrink: 0 }}>
              Fix →
            </span>
          )}
        </div>
      ))}
      {/* Best fit roles */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
        {['Kernel Dev', 'Systems Eng', 'Open Source Lead'].map(role => (
          <span key={role} style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 99, background: 'rgba(139,92,246,0.1)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.2)' }}>
            {role}
          </span>
        ))}
      </div>
    </div>
  )
}

const DEMO_SCREENS = [<DemoScreen0 key={0}/>, <DemoScreen1 key={1}/>, <DemoScreen2 key={2}/>, <DemoScreen3 key={3}/>]

function InteractiveDemo() {
  const { t } = useT()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive(s => (s + 1) % DEMO_STEPS.length), 4000)
    return () => clearInterval(t)
  }, [paused])

  function handleClick(i: number) {
    setActive(i)
    setPaused(true)
  }

  const step = DEMO_STEPS[active]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40, alignItems: 'start', maxWidth: 960, margin: '0 auto' }}>
      {/* Left: step list */}
      <div>
        {DEMO_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            style={{
              width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
              padding: '16px 18px', borderRadius: 12, marginBottom: 6,
              background: active === i ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderLeft: `3px solid ${active === i ? s.color : 'transparent'}`,
              transition: 'all .2s', outline: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: active === i ? s.color : '#484f58',
                letterSpacing: '.05em', fontFamily: 'monospace', flexShrink: 0,
              }}>{s.n}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: active === i ? '#f0f6fc' : '#8b949e', lineHeight: 1.3 }}>
                {t(s.titleKey)}
              </span>
            </div>
            {active === i && (
              <>
                <p style={{ fontSize: 12.5, color: '#8b949e', lineHeight: 1.6, margin: '8px 0 10px 21px' }}>
                  {t(s.descKey)}
                </p>
                {/* Progress bar */}
                {!paused && (
                  <div style={{ margin: '0 0 0 21px', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div key={active} style={{
                      height: '100%', background: s.color, borderRadius: 99,
                      animation: 'demoProgress 4s linear forwards',
                    }} />
                  </div>
                )}
              </>
            )}
          </button>
        ))}
        {/* Resume auto-play */}
        {paused && (
          <button
            onClick={() => { setPaused(false) }}
            style={{
              marginTop: 8, padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#484f58', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8b949e')}
            onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
          >
            {t('demo.resumeAutoplay')}
          </button>
        )}
      </div>

      {/* Right: browser mockup */}
      <div style={{
        background: '#161b22', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      }}>
        {/* Browser chrome */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px',
          background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#febc2e', flexShrink: 0 }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
          <div style={{
            flex: 1, maxWidth: 260, margin: '0 auto', padding: '4px 10px', borderRadius: 5,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, color: '#484f58', textAlign: 'center', overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>{DEMO_URLS[active]}</div>
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {DEMO_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  width: 6, height: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                  background: i === active ? step.color : 'rgba(255,255,255,0.12)',
                  transition: 'background .2s',
                }}
              />
            ))}
          </div>
        </div>
        {/* Screen — fade on change */}
        <div key={active} style={{ minHeight: 280, animation: 'fadeUp .25s ease' }}>
          {DEMO_SCREENS[active]}
        </div>
      </div>

      <style>{`
        @keyframes demoProgress { from { width: 0 } to { width: 100% } }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
      `}</style>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const { t, lang } = useT()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = () => setUserMenuOpen(false)
    window.addEventListener('click', handler, { capture: true, once: true })
    return () => window.removeEventListener('click', handler, { capture: true })
  }, [userMenuOpen])

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError('')
    setStep(0)
    const interval = setInterval(() => {
      setStep(prev => (prev < STEP_KEYS.length - 1 ? prev + 1 : prev))
    }, 2500)
    try {
      const result = await analyzeProfile(username.trim(), { language: lang })
      clearInterval(interval)
      localStorage.setItem('devscope_last_result', JSON.stringify(result))
      router.push(`/dashboard/${username.trim().toLowerCase()}`)
    } catch (err: unknown) {
      clearInterval(interval)
      setLoading(false)
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (status === 404) setError(t('error.notFound', { u: username }))
      else if (status === 429) setError(t('error.rateLimit'))
      else if (detail) setError(t('error.detail', { d: detail }))
      else setError(t('error.network', { s: String(status ?? 'network') }))
    }
  }

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Background radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 85% 50% at 50% -5%, rgba(99,102,241,0.11) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 15%, rgba(139,92,246,0.06) 0%, transparent 50%)
        `,
      }} />
      {/* Grid */}
      <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'background .3s, border-color .3s, backdrop-filter .3s',
        background: scrolled ? 'rgba(13,17,23,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="DevScope" width={34} height={34}
              style={{ borderRadius: 9, display: 'block', objectFit: 'cover' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: '#f0f6fc', letterSpacing: '-.3px' }}>DevScope</span>
          </a>
          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {([
              ['#features',    t('nav.features')],
              ['#how-it-works', t('nav.howItWorks')],
              ['#why-us',      t('nav.whyUs')],
            ] as [string, string][]).map(([href, label]) => (
              <a key={href} href={href} style={{
                padding: '6px 13px', fontSize: 14, color: '#8b949e', textDecoration: 'none',
                borderRadius: 7, transition: 'color .15s', fontWeight: 450,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
              onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
              >{label}</a>
            ))}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LangThemeToggles compact />
            {session?.user ? (
              /* ── Logged-in state ── */
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '5px 12px 5px 5px', borderRadius: 99,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  {/* Avatar */}
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? 'User'}
                      width={28} height={28}
                      style={{ borderRadius: '50%', display: 'block', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {(session.user.name ?? session.user.email ?? 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: '#f0f6fc', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.user.name ?? session.user.email?.split('@')[0]}
                  </span>
                  {/* Chevron */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      minWidth: 200, background: '#161b22',
                      border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12,
                      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                      overflow: 'hidden', zIndex: 200,
                    }}
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    {/* User info header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>
                        {session.user.name ?? 'User'}
                      </p>
                      <p style={{ fontSize: 12, color: '#8b949e', margin: '2px 0 0' }}>
                        {session.user.email}
                      </p>
                    </div>
                    {/* Links */}
                    <div style={{ padding: '6px' }}>
                      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, textDecoration: 'none', color: '#c9d1d9', fontSize: 13.5, transition: 'background .12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        {t('nav.analyzeProfile')}
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                          width: '100%', border: 'none', background: 'transparent',
                          color: '#f87171', fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
                          fontFamily: 'inherit', transition: 'background .12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Logged-out state ── */
              <>
                <Link href="/auth" style={{
                  padding: '7px 16px', fontSize: 13.5, color: '#8b949e', textDecoration: 'none',
                  transition: 'color .15s',
                }}>{t('nav.signIn')}</Link>
                <Link href="/auth" style={{
                  padding: '7px 16px', fontSize: 13.5, fontWeight: 500, color: '#f0f6fc',
                  textDecoration: 'none', borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.11)',
                  transition: 'all .15s',
                }}>{t('nav.getStarted')}</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '148px 0 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Badge */}
          <div style={{ marginBottom: 24 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px 4px 8px', borderRadius: 999,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              fontSize: 12, fontWeight: 500, color: '#a5b4fc',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
              {t('hero.badge')}
            </span>
          </div>
          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800, letterSpacing: '-2.5px',
            lineHeight: 1.06, marginBottom: 22, color: '#f0f6fc',
          }}>
            {t('hero.title1')}<br />
            <span className="gradient-text">{t('hero.title2')}</span>
          </h1>
          {/* Subtext */}
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 19px)', color: '#8b949e',
            maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65,
          }}>
            {t('hero.subtitle')}
          </p>

          {/* ── Search form (preserved exactly) ── */}
          <form onSubmit={handleAnalyze} style={{ maxWidth: 520, margin: '0 auto 8px', display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('hero.placeholder')}
              disabled={loading}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#f0f6fc', fontSize: 14, outline: 'none',
                transition: 'border-color .15s, box-shadow .15s',
                opacity: loading ? .5 : 1,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              style={{
                padding: '12px 24px', borderRadius: 10, border: 'none',
                background: loading || !username.trim() ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                transition: 'opacity .15s',
              }}
            >
              {loading ? t('hero.analyzing') : t('hero.analyze')}
            </button>
          </form>

          {/* Loading progress */}
          {loading && (
            <div style={{
              maxWidth: 520, margin: '16px auto 0',
              background: 'rgba(22,27,34,0.9)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '18px 20px',
            }}>
              {STEP_KEYS.map((k, i) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < STEP_KEYS.length - 1 ? 10 : 0 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < step ? '#6366f1' : i === step ? '#6366f1' : 'rgba(255,255,255,0.07)',
                    animation: i === step ? 'pulse 1s infinite' : 'none',
                    fontSize: 8, color: '#fff',
                  }}>
                    {i < step && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: i <= step ? '#f0f6fc' : '#484f58' }}>{t(k)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              maxWidth: 520, margin: '12px auto 0',
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: 10, padding: '12px 16px',
              fontSize: 13.5, color: '#fda4af', textAlign: 'left',
            }}>
              {error}
            </div>
          )}

          {/* Metric pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            {([
              {
                label: '<30s results',
                color: '#6366f1',
                icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
              },
              {
                label: '5 scoring dimensions',
                color: '#10b981',
                icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="12" width="4" height="8" rx="1"/>
                    <rect x="10" y="7" width="4" height="13" rx="1"/>
                    <rect x="17" y="3" width="4" height="17" rx="1"/>
                  </svg>
                ),
              },
              {
                label: 'No sign-up · always free',
                color: '#f59e0b',
                icon: (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </svg>
                ),
              },
            ] as { label: string; color: string; icon: React.ReactNode }[]).map(m => (
              <span key={m.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '7px 15px', borderRadius: 99,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 12.5, color: '#8b949e',
              }}>
                <span style={{ color: m.color, display: 'flex', alignItems: 'center' }}>{m.icon}</span>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Mockup ───────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <ProductMockup />
      </div>

      {/* ── Stats bar ────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '16px 0 72px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: 1, borderRadius: 14, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.04)',
          }}>
            {[
              { value: '12k+',  label: 'Profiles analyzed' },
              { value: '5',     label: 'Scoring dimensions' },
              { value: '<30s',  label: 'Time to results' },
              { value: '100%',  label: 'Free to use' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '22px 24px', textAlign: 'center',
                background: '#0d1117',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <div style={{ fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 800, color: '#f0f6fc', letterSpacing: '-1px', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: '#484f58', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Separator ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
      </div>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Section label — numbered, not the same pill as hero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', letterSpacing: '.12em' }}>01</span>
            <div style={{ width: 24, height: 1, background: 'rgba(99,102,241,0.4)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#6366f1', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t('section.features')}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: 14, color: '#f0f6fc', maxWidth: 560 }}>
            {t('features.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#8b949e', maxWidth: 480, margin: '0 0 52px', lineHeight: 1.65 }}>
            {t('features.subtitle')}
          </p>

          {/* Bento grid: first card featured (2 cols wide), rest standard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>

            {/* Featured card — spans 2 columns, has a live mini-viz */}
            <div style={{
              gridColumn: 'span 2',
              background: '#161b22',
              border: '1px solid rgba(99,102,241,0.22)',
              borderRadius: 16, padding: '32px 28px',
              display: 'flex', gap: 32, alignItems: 'flex-start',
              transition: 'border-color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)')}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {FeatureIcons['scoring']}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#484f58', fontFamily: 'monospace', letterSpacing: '.05em' }}>01</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.4px', marginBottom: 10, color: '#f0f6fc', lineHeight: 1.25 }}>
                  {t('features.scoring.title')}
                </h3>
                <p style={{ fontSize: 14.5, color: '#8b949e', lineHeight: 1.7 }}>{t('features.scoring.desc')}</p>
              </div>
              {/* Mini score preview */}
              <div style={{
                width: 170, flexShrink: 0,
                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '14px 14px',
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 11 }}>Score breakdown</div>
                {[
                  { name: 'Activity',  pct: 88, color: '#6366f1' },
                  { name: 'Quality',   pct: 76, color: '#10b981' },
                  { name: 'Docs',      pct: 65, color: '#f59e0b' },
                  { name: 'Diversity', pct: 90, color: '#8b5cf6' },
                  { name: 'Community', pct: 82, color: '#ec4899' },
                ].map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ fontSize: 10.5, color: '#8b949e', width: 60, flexShrink: 0 }}>{d.name}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${d.pct}%`, height: '100%', background: d.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 9.5, color: '#484f58', minWidth: 18, textAlign: 'right' }}>{d.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Remaining 5 features — standard cards with numbered labels */}
            {FEATURES.slice(1).map((f, idx) => (
              <div key={f.titleKey} style={{
                background: '#161b22',
                border: `1px solid ${f.stroke}`,
                borderRadius: 16, padding: '24px 22px',
                transition: 'transform .2s, box-shadow .2s, border-color .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.28)'
                e.currentTarget.style.borderColor = f.stroke.replace('0.2', '0.45')
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = f.stroke
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: f.color, border: `1px solid ${f.stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {FeatureIcons[f.iconKey]}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#484f58', fontFamily: 'monospace', letterSpacing: '.05em' }}>
                    {String(idx + 2).padStart(2, '0')}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px', marginBottom: 7, color: '#f0f6fc' }}>{t(f.titleKey)}</h3>
                <p style={{ fontSize: 13.5, color: '#8b949e', lineHeight: 1.65 }}>{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Separator ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
      </div>

      {/* ── How it works — Interactive Demo ─────────────────────── */}
      <section id="how-it-works" style={{
        position: 'relative', zIndex: 1, padding: '96px 0',
        background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.025) 50%, transparent)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace', letterSpacing: '.12em' }}>02</span>
            <div style={{ width: 24, height: 1, background: 'rgba(139,92,246,0.4)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#8b5cf6', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t('section.howItWorks')}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, textAlign: 'center', letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: 14, color: '#f0f6fc' }}>
            {t('howItWorks.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#8b949e', textAlign: 'center', maxWidth: 500, margin: '0 auto 56px', lineHeight: 1.65 }}>
            {t('howItWorks.subtitle')}
          </p>
          <InteractiveDemo />
        </div>
      </section>

      {/* ── Separator ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
      </div>

      {/* ── Why us ───────────────────────────────────────────────── */}
      <section id="why-us" style={{ position: 'relative', zIndex: 1, padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', fontFamily: 'monospace', letterSpacing: '.12em' }}>03</span>
            <div style={{ width: 24, height: 1, background: 'rgba(16,185,129,0.4)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#10b981', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t('section.whyUs')}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: 14, color: '#f0f6fc', maxWidth: 540 }}>
            {t('whyUs.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#8b949e', maxWidth: 480, margin: '0 0 48px', lineHeight: 1.65 }}>
            {t('whyUs.subtitle')}
          </p>
          <div style={{ maxWidth: 820, margin: '0 auto', background: '#161b22', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px', padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#8b949e' }}>{t('whyUs.col.capability')}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#a5b4fc', textAlign: 'center' }}>{t('whyUs.col.devscope')}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#8b949e', textAlign: 'center' }}>{t('whyUs.col.github')}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#8b949e', textAlign: 'center' }}>{t('whyUs.col.others')}</span>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={row.labelKey} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px',
                padding: '14px 24px', alignItems: 'center',
                borderBottom: i < COMPARE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontSize: 14, color: '#8b949e' }}>{t(row.labelKey)}</span>
                {/* DevScope — always yes */}
                <span style={{ display:'flex', justifyContent:'center', color: '#10b981' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {/* GitHub */}
                <span style={{ display:'flex', justifyContent:'center', color: row.gh === true ? '#10b981' : '#484f58' }}>
                  {row.gh === true
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </span>
                {/* Others */}
                <span style={{ display:'flex', justifyContent:'center', color: row.other === 'partial' ? '#f59e0b' : (row.other as string | boolean) === true ? '#10b981' : '#484f58' }}>
                  {row.other === 'partial'
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    : (row.other as string | boolean) === true
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Separator ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
      </div>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '96px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', letterSpacing: '.12em' }}>04</span>
            <div style={{ width: 24, height: 1, background: 'rgba(245,158,11,0.4)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#f59e0b', letterSpacing: '.1em', textTransform: 'uppercase' }}>{t('section.testimonials')}</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-1.5px', lineHeight: 1.15, marginBottom: 14, color: '#f0f6fc', maxWidth: 520 }}>
            {t('testimonials.title')}
          </h2>
          <p style={{ fontSize: 16, color: '#8b949e', maxWidth: 460, margin: '0 0 48px', lineHeight: 1.65 }}>
            {t('testimonials.subtitle')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
            {TESTIMONIALS.map((tm, idx) => {
              // Middle card is slightly elevated
              const isMiddle = idx === 1
              return (
                <div key={tm.name} style={{
                  background: '#161b22',
                  border: isMiddle ? '1px solid rgba(99,102,241,0.18)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: isMiddle ? '28px 24px' : '24px 22px',
                  marginTop: isMiddle ? -14 : 0,
                  transition: 'border-color .2s, transform .2s',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: isMiddle ? '0 20px 50px rgba(0,0,0,0.3)' : 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.28)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isMiddle ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.transform = 'none'
                }}
                >
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="13" height="13" viewBox="0 0 24 24"
                        fill={i < tm.stars ? '#f59e0b' : 'none'}
                        stroke={i < tm.stars ? '#f59e0b' : '#2d333b'}
                        strokeWidth="1.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  {/* Quote */}
                  <p style={{ fontSize: 14, color: '#8b949e', lineHeight: 1.75, marginBottom: 20, flex: 1 }}>
                    &ldquo;{tm.text}&rdquo;
                  </p>
                  {/* Author — real photo avatar with gradient fallback */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <AvatarPhoto
                      src={tm.avatar}
                      name={tm.name}
                      grad={tm.avatarGrad}
                    />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f6fc', letterSpacing: '-.1px' }}>{tm.name}</div>
                      <div style={{ fontSize: 11.5, color: '#484f58', marginTop: 1 }}>{tm.role}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Live Ticker CTA ──────────────────────────────────────── */}
      <LiveTickerSection placeholder={t('hero.placeholder')} freeNote={t('hero.freeNote')} lang={lang} />

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '48px 0 36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mark.png" alt="DevScope" width={30} height={30}
                  style={{ borderRadius: 8, display: 'block', objectFit: 'cover' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f6fc' }}>DevScope</span>
              </div>
              <p style={{ fontSize: 13.5, color: '#484f58', maxWidth: 240, lineHeight: 1.6 }}>
                AI-powered GitHub portfolio analysis for developers who take their career seriously.
              </p>
            </div>
            {/* Links */}
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              {[
                { title: 'Product', links: ['Features', 'How it works', 'Why DevScope', 'Changelog'] },
                { title: 'Resources', links: ['Documentation', 'API', 'Blog', 'GitHub'] },
                { title: 'Company', links: ['About', 'Contact', 'Privacy', 'Terms'] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 12.5, fontWeight: 600, color: '#8b949e', marginBottom: 14, letterSpacing: '.03em' }}>{col.title}</h4>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ display: 'block', fontSize: 13.5, color: '#484f58', textDecoration: 'none', marginBottom: 9, transition: 'color .12s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#f0f6fc')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
                    >{l}</a>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12.5, color: '#484f58' }}>© 2026 DevScope. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Service', 'Cookies'].map(l => (
                <a key={l} href="#" style={{ fontSize: 12.5, color: '#484f58', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8b949e')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
