'use client'

import { useT } from '@/lib/i18n'

interface Props {
  /** compact: smaller padding/text — for tight nav headers */
  compact?: boolean
}

export function LangThemeToggles({ compact }: Props) {
  const { lang, setLang } = useT()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
      title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      style={{
        padding: compact ? '4px 9px' : '5px 11px',
        fontSize: compact ? 11 : 12,
        fontWeight: 700,
        letterSpacing: '.04em',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: '#8b949e',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.color = '#f0f6fc'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.color = '#8b949e'
      }}
    >
      {lang === 'en' ? 'FR' : 'EN'}
    </button>
  )
}
