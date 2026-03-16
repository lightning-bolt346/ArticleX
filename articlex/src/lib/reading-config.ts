export interface ReadingConfig {
  fontSize: number
  lineHeight: number
  fontFamily: 'inter' | 'georgia' | 'mono' | 'system' | 'literata'
  maxWidth: 'narrow' | 'normal' | 'wide'
}

const STORAGE_KEY = 'articlex-reading-config'

export const READING_DEFAULTS: ReadingConfig = {
  fontSize: 15,
  lineHeight: 1.85,
  fontFamily: 'inter',
  maxWidth: 'normal',
}

export function getReadingConfig(): ReadingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return READING_DEFAULTS
    return { ...READING_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return READING_DEFAULTS
  }
}

export function saveReadingConfig(config: ReadingConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export const readingFontStyle: Record<ReadingConfig['fontFamily'], string> = {
  inter: "'Inter', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', monospace",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  literata: "'Literata', Georgia, serif",
}

export const cardMaxWidth: Record<ReadingConfig['maxWidth'], string> = {
  narrow: '580px',
  normal: '768px',
  wide: '960px',
}
