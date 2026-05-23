'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useT } from '@/lib/i18n'
import { LangThemeToggles } from '@/components/LangThemeToggles'

type View = 'signin' | 'signup' | 'forgot'

// ── Shared styles ───────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, outline: 'none',
  color: '#f0f6fc', fontFamily: 'inherit', fontSize: 14,
  transition: 'border-color .15s, box-shadow .15s',
  caretColor: '#6366f1',
}

function Field({ label, id, type, placeholder, hint, autoComplete, value, onChange, disabled }: {
  label: string; id: string; type: string; placeholder: string
  hint?: string; autoComplete?: string; value: string
  onChange: (v: string) => void; disabled?: boolean
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#8b949e', marginBottom: 5 }}>
        {label}
      </label>
      <input
        id={id} type={type} placeholder={placeholder}
        autoComplete={autoComplete} value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{ ...inputStyle, opacity: disabled ? .5 : 1 }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none' }}
      />
      {hint && <p style={{ fontSize: 11.5, color: '#484f58', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function PrimaryBtn({ children, loading, onClick, type = 'submit' }: {
  children: React.ReactNode; loading?: boolean
  onClick?: () => void; type?: 'submit' | 'button'
}) {
  return (
    <button type={type} onClick={onClick} disabled={loading} style={{
      width: '100%', padding: '11px 18px',
      background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
      border: 'none', borderRadius: 9, color: '#fff',
      fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
      cursor: loading ? 'not-allowed' : 'pointer',
      boxShadow: '0 2px 10px rgba(99,102,241,0.32)',
      transition: 'opacity .15s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {loading && (
        <span style={{
          width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff', borderRadius: '50%',
          animation: 'spin .7s linear infinite', display: 'inline-block',
        }} />
      )}
      {children}
    </button>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
      borderRadius: 8, padding: '10px 13px', marginBottom: 14,
      fontSize: 13, color: '#fda4af',
    }}>{msg}</div>
  )
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div style={{
      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
      borderRadius: 8, padding: '10px 13px', marginBottom: 14,
      fontSize: 13, color: '#6ee7b7',
    }}>{msg}</div>
  )
}

function OAuthBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      padding: '10px 18px', marginBottom: 9,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8, color: '#8b949e', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
      cursor: 'pointer', transition: 'all .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#f0f6fc' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8b949e' }}
    >{icon}{label}</button>
  )
}

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

// ── Main component ──────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter()
  const { t } = useT()

  const [view, setView]       = useState<View>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Sign In state
  const [siEmail, setSiEmail]   = useState('')
  const [siPass,  setSiPass]    = useState('')

  // Sign Up state
  const [suName,  setSuName]    = useState('')
  const [suEmail, setSuEmail]   = useState('')
  const [suPass,  setSuPass]    = useState('')

  // Forgot state
  const [fpEmail, setFpEmail]   = useState('')

  function clearMessages() { setError(''); setSuccess('') }
  function switchView(v: View) { clearMessages(); setView(v) }

  // ── Handlers ──────────────────────────────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    clearMessages()
    if (!siEmail || !siPass) { setError(t('auth.err.fillAll')); return }
    setLoading(true)
    const res = await signIn('credentials', {
      email: siEmail, password: siPass, redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError(t('auth.err.wrongCreds'))
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    clearMessages()
    if (!suName || !suEmail || !suPass) { setError(t('auth.err.fillAll')); return }
    if (suPass.length < 8) { setError(t('auth.err.shortPass')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: suName, email: suEmail, password: suPass }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? t('auth.err.regFailed')); setLoading(false); return }

      // Auto sign-in after registration
      const login = await signIn('credentials', {
        email: suEmail, password: suPass, redirect: false,
      })
      setLoading(false)
      if (login?.error) {
        setSuccess(t('auth.ok.created'))
        switchView('signin')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setLoading(false)
      setError(t('auth.err.generic'))
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    clearMessages()
    if (!fpEmail) { setError(t('auth.err.enterEmail')); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSuccess(t('auth.ok.resetSent'))
  }

  const viewStyle = (v: View): React.CSSProperties => ({
    display: view === v ? 'block' : 'none',
  })

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#0d1117',
        display: 'grid', placeItems: 'center', padding: '24px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse 90% 55% at 50% -10%, rgba(99,102,241,0.13) 0%, transparent 65%),
            radial-gradient(ellipse 55% 45% at 90% 90%,  rgba(139,92,246,0.07) 0%, transparent 55%)
          `,
        }} />
        <div className="bg-grid" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

        {/* Lang/Theme toggles — top-right corner */}
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 10 }}>
          <LangThemeToggles compact />
        </div>

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 408,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
          animation: 'fadeUp .3s ease',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="DevScope" width={38} height={38}
              style={{ borderRadius: 11, display: 'block', objectFit: 'cover',
                boxShadow: '0 0 20px rgba(99,102,241,0.25), 0 4px 8px rgba(0,0,0,0.4)' }} />
            <span style={{ fontSize: 17, fontWeight: 600, color: '#f0f6fc', letterSpacing: '-.3px' }}>DevScope</span>
          </Link>

          {/* Card */}
          <div className="glass-card" style={{ width: '100%', borderRadius: 18, padding: '32px 30px 28px' }}>

            {/* Tabs */}
            {view !== 'forgot' && (
              <div style={{
                display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: 4, marginBottom: 26,
              }}>
                {(['signin', 'signup'] as View[]).map(v => (
                  <button key={v} type="button" onClick={() => switchView(v)} style={{
                    flex: 1, padding: '8px 14px', border: 'none', borderRadius: 7,
                    background: view === v ? '#1c2128' : 'transparent',
                    color: view === v ? '#f0f6fc' : '#8b949e',
                    fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: view === v ? '0 1px 5px rgba(0,0,0,0.35)' : 'none',
                  }}>
                    {v === 'signin' ? t('auth.tabs.signIn') : t('auth.tabs.signUp')}
                  </button>
                ))}
              </div>
            )}

            {/* ── Sign In ─────────────────────────────────────── */}
            <div style={viewStyle('signin')}>
              <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.45px', marginBottom: 5, color: '#f0f6fc' }}>
                {t('auth.signIn.title')}
              </h1>
              <p style={{ fontSize: 13.5, color: '#8b949e', lineHeight: 1.55, marginBottom: 20 }}>
                {t('auth.signIn.subtitle')}
              </p>

              {error && view === 'signin' && <ErrorBox msg={error} />}
              {success && view === 'signin' && <SuccessBox msg={success} />}

              <form onSubmit={handleSignIn}>
                <Field
                  label={t('auth.fields.email')} id="si-email" type="email"
                  placeholder={t('auth.fields.emailPH')} autoComplete="email"
                  value={siEmail} onChange={setSiEmail} disabled={loading}
                />
                <Field
                  label={t('auth.fields.password')} id="si-pass" type="password"
                  placeholder={t('auth.fields.passPH')} autoComplete="current-password"
                  value={siPass} onChange={setSiPass} disabled={loading}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, marginTop: -6 }}>
                  <button type="button" onClick={() => switchView('forgot')} style={{
                    background: 'none', border: 'none', fontSize: 12.5, color: '#8b949e',
                    cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  }}>{t('auth.actions.forgotPass')}</button>
                </div>

                <PrimaryBtn loading={loading}>{t('auth.actions.continue')}</PrimaryBtn>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11.5, color: '#484f58' }}>{t('auth.oauth.or')}</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <OAuthBtn icon={<GitHubIcon />} label={t('auth.oauth.github')} onClick={() => signIn('github', { callbackUrl: '/' })} />
              <OAuthBtn icon={<GoogleIcon />} label={t('auth.oauth.google')} onClick={() => signIn('google', { callbackUrl: '/' })} />
            </div>

            {/* ── Sign Up ─────────────────────────────────────── */}
            <div style={viewStyle('signup')}>
              <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.45px', marginBottom: 5, color: '#f0f6fc' }}>
                {t('auth.signUp.title')}
              </h1>
              <p style={{ fontSize: 13.5, color: '#8b949e', lineHeight: 1.55, marginBottom: 20 }}>
                {t('auth.signUp.subtitle')}
              </p>

              {error && view === 'signup' && <ErrorBox msg={error} />}

              <form onSubmit={handleSignUp}>
                <Field
                  label={t('auth.fields.name')} id="su-name" type="text"
                  placeholder={t('auth.fields.namePH')} autoComplete="name"
                  value={suName} onChange={setSuName} disabled={loading}
                />
                <Field
                  label={t('auth.fields.email')} id="su-email" type="email"
                  placeholder={t('auth.fields.emailPH')} autoComplete="email"
                  value={suEmail} onChange={setSuEmail} disabled={loading}
                />
                <Field
                  label={t('auth.fields.password')} id="su-pass" type="password"
                  placeholder={t('auth.fields.minPass')} autoComplete="new-password"
                  value={suPass} onChange={setSuPass} disabled={loading}
                />

                <div style={{ marginTop: 6 }}>
                  <PrimaryBtn loading={loading}>{t('auth.actions.createAccount')}</PrimaryBtn>
                </div>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 11.5, color: '#484f58' }}>{t('auth.oauth.or')}</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <OAuthBtn icon={<GitHubIcon />} label={t('auth.oauth.github')} onClick={() => signIn('github', { callbackUrl: '/' })} />
              <OAuthBtn icon={<GoogleIcon />} label={t('auth.oauth.google')} onClick={() => signIn('google', { callbackUrl: '/' })} />

              <p style={{ marginTop: 14, fontSize: 11.5, color: '#484f58', textAlign: 'center', lineHeight: 1.6 }}>
                {t('auth.terms')}{' '}
                <a href="#" style={{ color: '#8b949e', textDecoration: 'none' }}>{t('auth.terms.terms')}</a>
                {' '}{t('auth.terms.and')}{' '}
                <a href="#" style={{ color: '#8b949e', textDecoration: 'none' }}>{t('auth.terms.privacy')}</a>.
              </p>
            </div>

            {/* ── Forgot Password ──────────────────────────────── */}
            <div style={viewStyle('forgot')}>
              <button type="button" onClick={() => switchView('signin')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none',
                border: 'none', padding: 0, marginBottom: 18, color: '#8b949e',
                fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                {t('auth.actions.backToSignIn')}
              </button>

              <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.45px', marginBottom: 5, color: '#f0f6fc' }}>
                {t('auth.forgot.title')}
              </h1>
              <p style={{ fontSize: 13.5, color: '#8b949e', lineHeight: 1.55, marginBottom: 20 }}>
                {t('auth.forgot.subtitle')}
              </p>

              {error && view === 'forgot' && <ErrorBox msg={error} />}
              {success && view === 'forgot' && <SuccessBox msg={success} />}

              <form onSubmit={handleForgot}>
                <Field
                  label={t('auth.fields.email')} id="fp-email" type="email"
                  placeholder={t('auth.fields.emailPH')} autoComplete="email"
                  value={fpEmail} onChange={setFpEmail} disabled={loading}
                />
                <PrimaryBtn loading={loading}>{t('auth.actions.sendReset')}</PrimaryBtn>
              </form>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#484f58', textAlign: 'center' }}>
            {t('auth.footer')} &middot;{' '}
            <a href="#" style={{ color: '#8b949e', textDecoration: 'none' }}>{t('auth.footer.privacy')}</a>
            {' '}&middot;{' '}
            <a href="#" style={{ color: '#8b949e', textDecoration: 'none' }}>{t('auth.footer.terms')}</a>
          </p>
        </div>
      </div>
    </>
  )
}
