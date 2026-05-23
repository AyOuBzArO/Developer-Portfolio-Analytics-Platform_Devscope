import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLevelColor(level: string): string {
  switch (level) {
    case 'Expert': return 'text-yellow-400'
    case 'Avancé': return 'text-violet-400'
    case 'Intermédiaire': return 'text-blue-400'
    default: return 'text-slate-400'
  }
}

export function getLevelBg(level: string): string {
  switch (level) {
    case 'Expert': return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    case 'Avancé': return 'bg-violet-400/10 text-violet-400 border-violet-400/20'
    case 'Intermédiaire': return 'bg-blue-400/10 text-blue-400 border-blue-400/20'
    default: return 'bg-slate-400/10 text-slate-400 border-slate-400/20'
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'important': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  }
}

export function getDimensionColor(dimension: string): string {
  const map: Record<string, string> = {
    activity: '#3b82f6',
    code_quality: '#8b5cf6',
    documentation: '#10b981',
    diversity: '#f59e0b',
    community: '#ec4899',
  }
  return map[dimension] ?? '#64748b'
}

export function formatScore(score: number): string {
  return `${Math.round(score)}`
}

export function timeAgo(dateStr?: string, lang: 'en' | 'fr' = 'en'): string {
  if (!dateStr) return lang === 'fr' ? 'Jamais' : 'Never'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (lang === 'fr') {
    if (diff < 86400)  return "Aujourd'hui"
    if (diff < 604800) return `${Math.floor(diff / 86400)}j`
    if (diff < 2592000) return `${Math.floor(diff / 604800)}sem`
    return `${Math.floor(diff / 2592000)}mois`
  }
  if (diff < 86400)  return 'Today'
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w`
  return `${Math.floor(diff / 2592000)}mo`
}
