'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Props {
  username: string
}

export function EmailDigestSignup({ username }: Props) {
  const { data: session } = useSession()
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong.')
      } else {
        setStatus('success')
        setMessage(`You're subscribed! Weekly digest for @${username} will land in ${email}`)
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  return (
    <div style={{
      background: 'rgba(22,27,34,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '22px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f0f6fc' }}>
            Weekly Score Digest
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>
            Get a weekly email with @{username}'s score, top changes, and your next action item — every Monday.
          </p>
        </div>
      </div>

      {status === 'success' ? (
        <div style={{
          padding: '13px 16px', borderRadius: 10,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style={{ margin: 0, fontSize: 13, color: '#6ee7b7' }}>{message}</p>
        </div>
      ) : (
        <form onSubmit={subscribe} style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === 'loading'}
            style={{
              flex: 1, padding: '9px 13px', borderRadius: 9,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.09)'}`,
              color: '#f0f6fc', fontFamily: 'inherit', fontSize: 13.5,
              outline: 'none', transition: 'border-color .15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = status === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.09)')}
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email.trim()}
            style={{
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: status === 'loading' ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#fff', fontSize: 13.5, fontWeight: 600,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
              transition: 'opacity .15s',
            }}
          >
            {status === 'loading' ? '…' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && message && (
        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: '#f87171' }}>{message}</p>
      )}

      <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#484f58' }}>
        No spam. Unsubscribe any time. One email per week maximum.
      </p>
    </div>
  )
}
