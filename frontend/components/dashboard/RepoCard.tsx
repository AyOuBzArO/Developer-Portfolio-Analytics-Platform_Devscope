import Link from 'next/link'
import type { RepoSummary } from '@/lib/types'
import { timeAgo } from '@/lib/utils'

interface Props { repo: RepoSummary; username: string; lang?: 'en' | 'fr' }

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#2b7489', JavaScript: '#f1e05a',
  Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Ruby: '#701516', Swift: '#F05138',
}

const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const ForkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
    <path d="M6 9v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export function RepoCard({ repo, username, lang = 'en' }: Props) {
  const color = repo.language ? (LANG_COLORS[repo.language] ?? '#64748b') : '#64748b'
  const qualityCount = [repo.has_cicd, repo.has_tests, repo.has_license, repo.has_gitignore].filter(Boolean).length

  return (
    <div style={{
      background: 'rgba(22,27,34,0.8)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color .15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#e6edf3', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {repo.name}
          </h3>
          {repo.description && (
            <p style={{ fontSize: 12, color: '#8b949e', margin: '4px 0 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {repo.description}
            </p>
          )}
        </div>
        <span style={{ fontSize: 11, color: '#484f58', marginLeft: 10, flexShrink: 0 }}>
          {timeAgo(repo.last_commit, lang)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#8b949e' }}>
          {repo.language && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {repo.language}
            </span>
          )}
          {repo.stars > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b949e' }}>
              <StarIcon /> {repo.stars}
            </span>
          )}
          {repo.forks > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b949e' }}>
              <ForkIcon /> {repo.forks}
            </span>
          )}
        </div>
        {qualityCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#34d399', fontWeight: 600 }}>
            <CheckIcon /> {qualityCount}/4
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href={`/dashboard/${username}/repo/${repo.name}`}
          style={{
            flex: 1, textAlign: 'center', fontSize: 12.5, padding: '7px 12px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
            color: '#818cf8', borderRadius: 8, textDecoration: 'none',
            transition: 'background .15s', fontWeight: 500,
          }}
        >
          View details
        </Link>
        <a
          href={`https://github.com/${username}/${repo.name}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8, transition: 'background .15s', color: '#8b949e',
          }}
          title="View on GitHub"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  )
}
