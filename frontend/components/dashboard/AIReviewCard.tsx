import type { AIReview } from '@/lib/types'

interface Props { review: AIReview }

export function AIReviewCard({ review }: Props) {
  const lines = review.content.split('\n')
  return (
    <div style={{
      background: 'rgba(22,27,34,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '22px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sparkle-brain icon */}
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
              <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" strokeWidth="1.4"/>
              <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z" strokeWidth="1.3"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 14.5, fontWeight: 600, color: '#f0f6fc', margin: 0 }}>AI Portfolio Review</h2>
        </div>
        <span style={{
          fontSize: 11, color: '#8b949e',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '3px 9px', borderRadius: 99,
        }}>
          {review.model_used.split('/').pop()}
        </span>
      </div>

      <div style={{ fontSize: 13.5, color: '#c9d1d9', lineHeight: 1.75 }}>
        {lines.map((line, i) => {
          if (line.startsWith('## ')) return (
            <h3 key={i} style={{ fontSize: 13, fontWeight: 700, color: '#818cf8', margin: '16px 0 6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {line.replace('## ', '')}
            </h3>
          )
          if (line.startsWith('# ')) return (
            <h2 key={i} style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc', margin: '16px 0 6px' }}>
              {line.replace('# ', '')}
            </h2>
          )
          if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
          return <p key={i} style={{ margin: 0 }}>{line}</p>
        })}
      </div>
    </div>
  )
}
