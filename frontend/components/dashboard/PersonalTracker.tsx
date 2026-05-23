'use client'

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useT } from '@/lib/i18n'
import { updateGithubLink } from '@/lib/api'

interface Props {
  /** The GitHub username currently being viewed in the dashboard */
  viewedUsername: string
  /** The logged-in user's currently linked GitHub username (null = not linked) */
  linkedUsername: string | null
  /** Called when the linked username changes so the parent can re-render */
  onLinkChange: (newUsername: string | null) => void
}

export function PersonalTracker({ viewedUsername, linkedUsername, onLinkChange }: Props) {
  const { data: session } = useSession()
  const { t } = useT()
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const isOwnProfile =
    linkedUsername !== null &&
    linkedUsername.toLowerCase() === viewedUsername.toLowerCase()

  function showFlash(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 3000)
  }

  async function handleLink() {
    const val = inputValue.trim()
    if (!val) return
    setSaving(true)
    const result = await updateGithubLink(val)
    setSaving(false)
    if (result !== null) {
      onLinkChange(result)
      setInputValue('')
      showFlash(t('tracker.linkSuccess'))
    }
  }

  async function handleUnlink() {
    setSaving(true)
    await updateGithubLink(null)
    setSaving(false)
    onLinkChange(null)
    showFlash(t('tracker.unlinkSuccess'))
  }

  // ── Not signed in ───────────────────────────────────────────────────
  if (!session) {
    return (
      <div style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t('tracker.signInPrompt')}</span>
        </div>
        <button
          onClick={() => signIn()}
          style={{
            padding: '6px 16px', borderRadius: 8,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8', fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
        >
          {t('tracker.signInBtn')}
        </button>
      </div>
    )
  }

  // ── Signed in: viewing own linked profile ──────────────────────────
  if (isOwnProfile) {
    return (
      <div style={{
        background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Green checkmark badge */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>{t('tracker.yourProfile')}</div>
            <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 1 }}>
              {t('tracker.linkedAs', { u: linkedUsername ?? '' })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {flash && <span style={{ fontSize: 12, color: '#6ee7b7' }}>{flash}</span>}
          <button
            onClick={handleUnlink}
            disabled={saving}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#64748b', fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            {t('tracker.unlinkBtn')}
          </button>
        </div>
      </div>
    )
  }

  // ── Signed in: not linked or viewing someone else's profile ───────
  return (
    <div style={{
      background: 'rgba(22,27,34,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#8b949e', flexShrink: 0 }}>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <span style={{ fontSize: 13, color: '#8b949e' }}>{t('tracker.link')}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {flash && <span style={{ fontSize: 12, color: '#6ee7b7' }}>{flash}</span>}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLink()}
          placeholder={t('tracker.linkPlaceholder')}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 12px', color: '#e6edf3',
            fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 180,
          }}
        />
        <button
          onClick={handleLink}
          disabled={saving || !inputValue.trim()}
          style={{
            padding: '6px 16px', borderRadius: 8,
            background: saving || !inputValue.trim() ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: saving || !inputValue.trim() ? '#4c5180' : '#818cf8',
            fontSize: 12.5, fontWeight: 600,
            cursor: saving || !inputValue.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all .15s',
          }}
        >
          {saving ? '…' : t('tracker.linkBtn')}
        </button>
      </div>
    </div>
  )
}
