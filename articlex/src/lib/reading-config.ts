export interface ReadingConfig {
  fontSize: number
  lineHeight: number
  fontFamily: 'inter' | 'serif' | 'mono'
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

export const readingFontClass: Record<ReadingConfig['fontFamily'], string> = {
  inter: 'font-inter',
  serif: 'font-serif',
  mono: 'font-mono',
}

export const readingWidthClass: Record<ReadingConfig['maxWidth'], string> = {
  narrow: 'max-w-lg',
  normal: '',
  wide: 'max-w-none',
}
