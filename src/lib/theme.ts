export const THEMES = [
  { id: 'navy', label: '남색', swatch: '#12304c' },
  { id: 'teal', label: '청록', swatch: '#0e7f8c' },
  { id: 'day', label: '하양', swatch: '#f4f7fb' },
  { id: 'sky', label: '하늘', swatch: '#d7ebf7' },
  { id: 'sand', label: '모래', swatch: '#f3e6d4' },
  { id: 'mint', label: '민트', swatch: '#d7f0e4' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export type ChartTone = {
  text: string
  muted: string
  grid: string
  line: string
  area: string
  tip: string
  tipLine: string
  ink: string
  track: string
}

const CHART: Record<ThemeId, ChartTone> = {
  navy: {
    text: '#e7f2ff',
    muted: '#9fb3c8',
    grid: 'rgba(120, 170, 210, 0.16)',
    line: '#3dd6ff',
    area: 'rgba(61, 214, 255, 0.16)',
    tip: '#0c1c2e',
    tipLine: 'rgba(120, 180, 220, 0.35)',
    ink: '#f4fbff',
    track: 'rgba(120, 170, 210, 0.18)',
  },
  teal: {
    text: '#e7fbff',
    muted: '#9ec9d4',
    grid: 'rgba(80, 200, 220, 0.18)',
    line: '#3ee0f0',
    area: 'rgba(62, 224, 240, 0.16)',
    tip: '#071722',
    tipLine: 'rgba(80, 210, 220, 0.4)',
    ink: '#f4fbff',
    track: 'rgba(80, 200, 220, 0.18)',
  },
  day: {
    text: '#173044',
    muted: '#5c7388',
    grid: 'rgba(70, 110, 150, 0.16)',
    line: '#0e7f8c',
    area: 'rgba(14, 127, 140, 0.12)',
    tip: '#ffffff',
    tipLine: 'rgba(70, 110, 150, 0.28)',
    ink: '#173044',
    track: 'rgba(70, 110, 150, 0.16)',
  },
  sky: {
    text: '#143044',
    muted: '#5a7386',
    grid: 'rgba(40, 120, 170, 0.16)',
    line: '#1a7cad',
    area: 'rgba(26, 124, 173, 0.12)',
    tip: '#ffffff',
    tipLine: 'rgba(40, 120, 170, 0.28)',
    ink: '#143044',
    track: 'rgba(40, 120, 170, 0.16)',
  },
  sand: {
    text: '#3a2e22',
    muted: '#7a6554',
    grid: 'rgba(140, 100, 60, 0.16)',
    line: '#b56a2b',
    area: 'rgba(181, 106, 43, 0.12)',
    tip: '#fffdf8',
    tipLine: 'rgba(140, 100, 60, 0.28)',
    ink: '#3a2e22',
    track: 'rgba(140, 100, 60, 0.16)',
  },
  mint: {
    text: '#163028',
    muted: '#4f6b5e',
    grid: 'rgba(30, 120, 80, 0.16)',
    line: '#1f8a62',
    area: 'rgba(31, 138, 98, 0.12)',
    tip: '#ffffff',
    tipLine: 'rgba(30, 120, 80, 0.28)',
    ink: '#163028',
    track: 'rgba(30, 120, 80, 0.16)',
  },
}

export function chartTone(id: ThemeId = readTheme()): ChartTone {
  return CHART[id]
}

const KEY = 't-arch-theme'

export function readTheme(): ThemeId {
  try {
    const value = localStorage.getItem(KEY)
    if (THEMES.some((item) => item.id === value)) return value as ThemeId
  } catch {
    /* ignore */
  }
  return 'navy'
}

export function writeTheme(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('t-arch-theme'))
}

export function siteTint(siteId: string | undefined): string | undefined {
  if (!siteId) return undefined
  let hash = 0
  for (let index = 0; index < siteId.length; index += 1) {
    hash = (hash * 33 + siteId.charCodeAt(index)) >>> 0
  }
  const hue = (hash % 12) * 30
  return `hsl(${hue} 68% 48%)`
}
