'use client'

import { useEffect, useState } from 'react'
import type { AIReview } from '@/lib/types'

/* ── Parser ─────────────────────────────────────────────────── */
interface Bullet { bold: string; text: string }
interface Section { title: string; type: 'strength' | 'weakness' | 'neutral'; bullets: Bullet[] }

function parseReview(content: string): Section[] {
  const sections: Section[] = []
  let cur: Section | null = null

  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (!line || line === '---') continue

    // Header: ## Title  /  **## Title**  /  **## Title
    const hm = line.match(/^\*{0,2}#{1,2}\s+(.+?)\*{0,2}$/)
    if (hm) {
      const title = hm[1].replace(/\*/g, '').trim()
      const lower = title.toLowerCase()
      const type: Section['type'] =
        lower.includes('strength') || lower.includes('force') ? 'strength'
        : lower.includes('weak') || lower.includes('concern') || lower.includes('improvement') ? 'weakness'
        : 'neutral'
      cur = { title, type, bullets: [] }
      sections.push(cur)
      continue
    }

    // Bullet with bold title: - **Title** – body
    const bm = line.match(/^[-•*]\s+\*\*(.+?)\*\*\s*[–—-]\s*(.+)/)
    if (bm && cur) { cur.bullets.push({ bold: bm[1], text: bm[2] }); continue }

    // Plain bullet
    const pm = line.match(/^[-•*]\s+(.+)/)
    if (pm && cur) { cur.bullets.push({ bold: '', text: pm[1] }); continue }

    // Plain paragraph — attach to last section or create neutral
    if (!cur) { cur = { title: '', type: 'neutral', bullets: [] }; sections.push(cur) }
    cur.bullets.push({ bold: '', text: line })
  }

  return sections.filter(s => s.bullets.length > 0)
}

/* ── Section colours ────────────────────────────────────────── */
const SECTION_STYLE = {
  strength: {
    bg: 'rgba(52,211,153,0.06)',
    border: 'rgba(52,211,153,0.18)',
    titleColor: '#34d399',
    dotColor: '#34d399',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  weakness: {
    bg: 'rgba(251,146,60,0.06)',
    border: 'rgba(251,146,60,0.18)',
    titleColor: '#fb923c',
    dotColor: '#fb923c',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ),
  },
  neutral: {
    bg: 'rgba(99,102,241,0.06)',
    border: 'rgba(99,102,241,0.18)',
    titleColor: '#818cf8',
    dotColor: '#818cf8',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
}

/* ── Animated bullet ────────────────────────────────────────── */
function BulletRow({ bullet, delay, dotColor }: { bullet: Bullet; delay: number; dotColor: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: dotColor,
        marginTop: 7, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}80`,
      }} />
      <p style={{ margin: 0, fontSize: 13, color: '#c9d1d9', lineHeight: 1.7 }}>
        {bullet.bold
          ? <><strong style={{ color: '#e6edf3', fontWeight: 600 }}>{bullet.bold}</strong>{' — '}{bullet.text}</>
          : bullet.text
        }
      </p>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
export function AIReviewCard({ review }: { review: AIReview }) {
  const [headerVisible, setHeaderVisible] = useState(false)
  const sections = parseReview(review.content)

  useEffect(() => {
    const t = setTimeout(() => setHeaderVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  let bulletDelay = 200

  return (
    <div style={{
      background: 'rgba(13,17,23,0.9)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 18,
      padding: '24px 26px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle gradient glow top-left */}
      <div style={{
        position: 'absolute', top: -60, left: -60,
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 22,
        opacity: headerVisible ? 1 : 0,
        transform: headerVisible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.2)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
              <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" strokeWidth="1.4"/>
              <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" strokeWidth="1.3"/>
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc', margin: 0, lineHeight: 1 }}>AI Portfolio Review</h2>
            <p style={{ fontSize: 11.5, color: '#6e7681', margin: '3px 0 0' }}>Powered by AI analysis</p>
          </div>
        </div>
        <span style={{
          fontSize: 10.5, color: '#6e7681',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '4px 10px', borderRadius: 99, fontFamily: 'monospace',
        }}>
          {review.model_used.split('/').pop()}
        </span>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sections.map((sec, si) => {
          const style = SECTION_STYLE[sec.type]
          const sectionStartDelay = bulletDelay
          bulletDelay += sec.bullets.length * 80 + 100

          return (
            <SectionBlock
              key={si}
              section={sec}
              style={style}
              startDelay={sectionStartDelay}
            />
          )
        })}
      </div>
    </div>
  )
}

function SectionBlock({
  section, style, startDelay
}: {
  section: Section
  style: typeof SECTION_STYLE['strength']
  startDelay: number
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), startDelay)
    return () => clearTimeout(t)
  }, [startDelay])

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 12, padding: '14px 16px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }}>
      {section.title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6,
            background: `${style.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {style.icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: style.titleColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {section.title}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {section.bullets.map((b, bi) => (
          <BulletRow
            key={bi}
            bullet={b}
            delay={startDelay + 120 + bi * 70}
            dotColor={style.dotColor}
          />
        ))}
      </div>
    </div>
  )
}
