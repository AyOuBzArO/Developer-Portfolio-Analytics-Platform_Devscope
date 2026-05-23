'use client'

import { use, useEffect, useRef, useState } from 'react'
import { getCachedProfile } from '@/lib/api'
import type { AnalysisResult } from '@/lib/types'
import { useT, translate, type Lang, type TKey } from '@/lib/i18n'
import { LangThemeToggles } from '@/components/LangThemeToggles'

type ScoreKey = keyof AnalysisResult['score_breakdown']

const DIMS: Array<{ labelKey: TKey; key: ScoreKey; color: string }> = [
  { labelKey: 'sc.dims.activity',      key: 'activity',      color: '#6366f1' },
  { labelKey: 'sc.dims.codeQuality',   key: 'code_quality',  color: '#10b981' },
  { labelKey: 'sc.dims.documentation', key: 'documentation', color: '#f59e0b' },
  { labelKey: 'sc.dims.diversity',     key: 'diversity',     color: '#8b5cf6' },
  { labelKey: 'sc.dims.community',     key: 'community',     color: '#ec4899' },
]

const STATS_KEYS = [
  { labelKey: 'sc.stats.repos'       as TKey, dataKey: 'total_repos',  color: '#6366f1' },
  { labelKey: 'sc.stats.stars'       as TKey, dataKey: 'total_stars',  color: '#f59e0b' },
  { labelKey: 'sc.stats.activeRepos' as TKey, dataKey: 'active_repos', color: '#10b981' },
  { labelKey: 'sc.stats.followers'   as TKey, dataKey: 'followers',    color: '#8b5cf6' },
] as const

const langColors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

function getGrade(score: number) {
  if (score >= 90) return { grade: 'A+', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' }
  if (score >= 80) return { grade: 'A',  color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' }
  if (score >= 70) return { grade: 'B+', color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' }
  if (score >= 60) return { grade: 'B',  color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' }
  if (score >= 50) return { grade: 'C',  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
  return            { grade: 'D',  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' }
}

// ── Minimal markdown → JSX renderer for the AI review ─────────────
/**
 * Keep only the first 2 sections (## headings) of the AI review and cap
 * the total character count so the PDF scorecard stays on one page.
 */
function truncateAiContent(raw: string): string {
  const text = raw.replace(/\r\n/g, '\n').trim()
  // Split on section headings
  const sectionRegex = /(?=^## )/m
  const sections = text.split(sectionRegex)

  // Keep Forces + Faiblesses/Weaknesses (first 2 sections that have ## heading)
  const headingSections = sections.filter(s => s.startsWith('## '))
  const kept = headingSections.slice(0, 2).join('\n\n')

  // Hard cap at 600 chars to avoid overflow, break at last space
  if (kept.length <= 620) return kept
  const cut = kept.slice(0, 620)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 400 ? cut.slice(0, lastSpace) : cut) + '…'
}

function renderAiContent(raw: string): React.ReactNode {
  // Normalise line endings and collapse 3+ blank lines to 2
  const text = raw.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  const blocks = text.split('\n\n')

  const inlineBold = (line: string, baseKey: string): React.ReactNode => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={`${baseKey}-b${j}`} style={{ color: '#1e293b', fontWeight: 700 }}>{p.slice(2, -2)}</strong>
        : p
    )
  }

  const nodes: React.ReactNode[] = []

  blocks.forEach((block, bi) => {
    const lines = block.split('\n').filter(l => l.trim() !== '')
    if (!lines.length) return

    // Section heading: ## or #
    if (lines[0].startsWith('## ')) {
      nodes.push(
        <p key={`h-${bi}`} style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.06em', margin: bi === 0 ? '0 0 5px' : '10px 0 5px' }}>
          {lines[0].slice(3)}
        </p>
      )
      // remaining lines as paragraph
      const rest = lines.slice(1).join(' ')
      if (rest) nodes.push(
        <p key={`hp-${bi}`} style={{ fontSize: 11.5, color: '#4b5563', lineHeight: 1.65, margin: '0 0 4px' }}>
          {inlineBold(rest, `hp-${bi}`)}
        </p>
      )
      return
    }

    // Numbered list block: lines starting with "1." "2." etc.
    if (/^\d+\.\s/.test(lines[0])) {
      nodes.push(
        <div key={`ul-${bi}`} style={{ margin: bi === 0 ? '0 0 4px' : '4px 0' }}>
          {lines.map((ln, li) => {
            const match = ln.match(/^(\d+)\.\s(.+)$/)
            if (!match) return null
            return (
              <div key={li} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ minWidth: 16, fontSize: 10, fontWeight: 700, color: '#6366f1', paddingTop: 2 }}>{match[1]}.</span>
                <p style={{ fontSize: 11.5, color: '#4b5563', lineHeight: 1.65, margin: 0, flex: 1 }}>
                  {inlineBold(match[2], `ul-${bi}-${li}`)}
                </p>
              </div>
            )
          })}
        </div>
      )
      return
    }

    // Plain paragraph
    nodes.push(
      <p key={`p-${bi}`} style={{ fontSize: 11.5, color: '#4b5563', lineHeight: 1.65, margin: bi === 0 ? '0 0 4px' : '4px 0' }}>
        {inlineBold(lines.join(' '), `p-${bi}`)}
      </p>
    )
  })

  return nodes
}

export default function ScorecardPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { t, lang } = useT()
  const [data, setData] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  // downloading: which language is currently being generated (null = idle)
  const [downloading, setDownloading] = useState<Lang | null>(null)
  // pdfLang: when set, switches card content to this language before capture
  const [pdfLang, setPdfLang] = useState<Lang | null>(null)
  // pendingCapture: triggers the useEffect that does the actual html2canvas work
  const [pendingCapture, setPendingCapture] = useState<Lang | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCachedProfile(username)
      .then(setData)
      .finally(() => setLoading(false))
  }, [username])

  // Card translate: uses pdfLang when capturing, otherwise current app lang
  const cardLang = pdfLang ?? lang
  const ct = (k: TKey, vars?: Record<string, string>) => translate(cardLang, k, vars)

  // After React re-renders with pdfLang, run the actual capture
  useEffect(() => {
    if (!pendingCapture || !cardRef.current || !data) return
    const timer = setTimeout(async () => {
      try {
        const html2canvas = (await import('html2canvas')).default
        const { jsPDF } = await import('jspdf')

        const canvas = await html2canvas(cardRef.current!, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: cardRef.current!.scrollWidth,
          windowHeight: cardRef.current!.scrollHeight,
        })

        const imgData = canvas.toDataURL('image/png')
        const A4_WIDTH_MM = 210
        const pdfH = (canvas.height * A4_WIDTH_MM) / canvas.width

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [A4_WIDTH_MM, pdfH],
        })

        pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, pdfH)
        pdf.save(`devscope-${data.username}-${pendingCapture}.pdf`)
      } catch (err) {
        console.error('PDF generation failed', err)
      } finally {
        setPendingCapture(null)
        setPdfLang(null)
        setDownloading(null)
      }
    }, 150) // allow one extra render cycle with pdfLang applied
    return () => clearTimeout(timer)
  }, [pendingCapture, data])

  function startDownload(targetLang: Lang) {
    if (!cardRef.current || !data || downloading) return
    setDownloading(targetLang)
    setPdfLang(targetLang)
    setPendingCapture(targetLang)
  }

  // ── Loading / Error states ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d1117' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: '#8b949e', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>{t('sc.loading')}</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0d1117' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <p style={{ color: '#f87171', marginBottom: 14, fontSize: 14 }}>{t('sc.notFound')}</p>
          <button onClick={() => window.close()} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
            {t('sc.closeTab')}
          </button>
        </div>
      </div>
    )
  }

  const topRepos  = (data.top_repositories ?? []).slice(0, 3)
  const topLangs  = Object.entries(data.languages ?? {}).slice(0, 5)
  const sc        = data.global_score
  const scoreColor = sc >= 70 ? '#10b981' : sc >= 40 ? '#f59e0b' : '#ef4444'
  const grade      = getGrade(sc)
  const dateLocale = lang === 'fr' ? 'fr-FR' : 'en-US'
  const langColorMap = Object.fromEntries(topLangs.map(([l], i) => [l, langColors[i]]))
  const getLangColor = (l: string) => langColorMap[l] ?? '#6366f1'

  // ── Download button factory ────────────────────────────────────────
  function DownloadBtn({ targetLang }: { targetLang: Lang }) {
    const isThis = downloading === targetLang
    const label  = targetLang === 'en' ? t('sc.downloadEn') : t('sc.downloadFr')
    return (
      <button
        onClick={() => startDownload(targetLang)}
        disabled={!!downloading}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 9, border: 'none',
          background: downloading
            ? 'rgba(99,102,241,0.35)'
            : 'linear-gradient(135deg,#6366f1,#4f46e5)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: downloading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          boxShadow: downloading ? 'none' : '0 4px 14px rgba(99,102,241,0.32)',
          transition: 'all .15s',
        }}
      >
        {isThis ? (
          <>
            <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            {t('sc.generating')}
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {label}
          </>
        )}
      </button>
    )
  }

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh', padding: '32px 24px', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* Toolbar */}
      <div style={{ maxWidth: 794, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Back */}
        <button
          onClick={() => window.close()}
          style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {t('sc.back')}
        </button>

        {/* Right side: toggles + download buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LangThemeToggles compact />
          <DownloadBtn targetLang="en" />
          <DownloadBtn targetLang="fr" />
        </div>
      </div>

      {/* ── The card — captured by html2canvas ── */}
      <div ref={cardRef} style={{
        width: 794, margin: '0 auto',
        background: '#fff',
        borderRadius: 0,
        overflow: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      } as React.CSSProperties}>

        {/* Accent bar */}
        <div style={{ height: 6, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)' }} />

        <div style={{ padding: '36px 48px 40px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.png"
                  alt="DevScope"
                  width={32}
                  height={32}
                  crossOrigin="anonymous"
                  style={{ borderRadius: 7, objectFit: 'cover', display: 'block' }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '.08em', textTransform: 'uppercase' }}>DevScope</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1, margin: 0 }}>
                @{data.username}
              </h1>
              <p style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                {ct('sc.label')} · {new Date(data.analyzed_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Score + Grade badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

              {/* Letter grade badge */}
              <div style={{
                width: 58, height: 58, borderRadius: 12,
                background: grade.bg, border: `1.5px solid ${grade.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 10px ${grade.color}1a`,
              }}>
                <span style={{ fontSize: 23, fontWeight: 900, color: grade.color, lineHeight: 1 }}>{grade.grade}</span>
                <span style={{ fontSize: 8, color: grade.color, fontWeight: 700, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>grade</span>
              </div>

              {/* Score circle */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 88, height: 88, borderRadius: '50%', position: 'relative',
                  background: `conic-gradient(${scoreColor} ${sc * 3.6}deg, #f1f5f9 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{sc}</span>
                    <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 500 }}>/100</span>
                  </div>
                </div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: scoreColor, marginTop: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {data.level}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 24 }} />

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {STATS_KEYS.map(s => (
              <div key={s.labelKey} style={{
                padding: '14px 16px', borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderTop: `3px solid ${s.color}`,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
                  {(data.stats[s.dataKey] as number).toLocaleString()}
                </p>
                <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', margin: 0 }}>
                  {ct(s.labelKey)}
                </p>
              </div>
            ))}
          </div>

          {/* Score breakdown */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <span style={{ width: 3, height: 13, background: '#6366f1', borderRadius: 99, display: 'block', flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {ct('sc.sections.breakdown')}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
              {DIMS.map(d => {
                const dim = data.score_breakdown[d.key]
                const pct = dim ? Math.round((dim.score / dim.max) * 100) : 0
                return (
                  <div key={d.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{ct(d.labelKey)}</span>
                      <span style={{ fontSize: 11.5, color: '#6b7280' }}>{dim?.score ?? 0}/{dim?.max ?? 0}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: d.color, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top repos */}
          {topRepos.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ width: 3, height: 13, background: '#10b981', borderRadius: 99, display: 'block', flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {ct('sc.sections.topRepos')}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {topRepos.map(repo => (
                  <div key={repo.name} style={{
                    padding: '12px 14px', borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    borderLeft: repo.language ? `3px solid ${getLangColor(repo.language)}` : '1px solid #f1f5f9',
                    background: '#fafafa',
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 3px', wordBreak: 'break-word', lineHeight: 1.3 }}>
                      {repo.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px', wordBreak: 'break-word', lineHeight: 1.4, minHeight: 14 }}>
                      {repo.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {repo.language && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: getLangColor(repo.language), display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: getLangColor(repo.language), display: 'inline-block', flexShrink: 0 }} />
                          {repo.language}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {repo.stars}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack + AI Assessment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ width: 3, height: 13, background: '#f59e0b', borderRadius: 99, display: 'block', flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {ct('sc.sections.techStack')}
                </span>
              </div>
              {topLangs.map(([language, pct], i) => (
                <div key={language} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{language}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: langColors[i] ?? '#6366f1', borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>

            {data.ai_review?.content && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <span style={{ width: 3, height: 13, background: '#8b5cf6', borderRadius: 99, display: 'block', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {ct('sc.sections.aiAssessment')}
                  </span>
                </div>
                <div style={{ padding: '14px 16px', borderRadius: 10, background: '#faf5ff', border: '1px solid #ede9fe', borderLeft: '3px solid #8b5cf6', overflow: 'hidden' }}>
                  {renderAiContent(truncateAiContent(data.ai_review.content))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="" width={14} height={14} crossOrigin="anonymous" style={{ borderRadius: 3, objectFit: 'cover', display: 'block' }} />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{ct('sc.footer')}</p>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>github.com/{data.username}</p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
