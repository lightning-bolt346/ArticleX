export interface ReadingConfig {
  fontSize: number
  lineHeight: number
  fontFamily: 'inter' | 'georgia' | 'mono' | 'system' | 'literata'
  maxWidth: 'narrow' | 'normal' | 'wide'
  readingModeWidth: number
  readingModeAlign: 'left' | 'center' | 'justify'
  theme: ReadingTheme
}

const STORAGE_KEY = 'articlex-reading-config'

export type ReadingTheme =
  | 'midnight-gold'
  | 'vellum'
  | 'monochrome-pop'
  | 'crisp-clean'
  | 'sepia-comfort'
  | 'dynamic-dim'

export interface ReaderThemePalette {
  id: ReadingTheme
  label: string
  blurb: string
  headingFont: string
  bodyFont: string
  codeFont: string
  colors: {
    bgSurface: string
    bgElevated: string
    textPrimary: string
    textMuted: string
    textDim: string
    accent: string
    accentAlt: string
    borderSubtle: string
    cardBg: string
    cardBorder: string
    cardShadow: string
    bodyText: string
    codeBg: string
    codeText: string
    gradientFade: string
    sourceBtnBg: string
    sourceBtnBorder: string
    quoteBg: string
    quoteBorder: string
  }
}

export const READING_THEME_OPTIONS: { value: ReadingTheme; label: string; blurb: string }[] = [
  { value: 'midnight-gold', label: 'Midnight Gold', blurb: 'Luxury dark reading' },
  { value: 'vellum', label: 'Vellum', blurb: 'Classic book-paper look' },
  { value: 'monochrome-pop', label: 'Monochrome Pop', blurb: 'Modern dark with vibrant accent' },
  { value: 'crisp-clean', label: 'Crisp & Clean', blurb: 'Minimal bright readability' },
  { value: 'sepia-comfort', label: 'Sepia Comfort', blurb: 'Warm low-strain reading' },
  { value: 'dynamic-dim', label: 'Dynamic Dim', blurb: 'Auto day/night adaptive' },
]

export const READING_DEFAULTS: ReadingConfig = {
  fontSize: 15,
  lineHeight: 1.85,
  fontFamily: 'inter',
  maxWidth: 'normal',
  readingModeWidth: 72,
  readingModeAlign: 'left',
  theme: 'dynamic-dim',
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

const THEME_LIBRARY: Record<Exclude<ReadingTheme, 'dynamic-dim'>, ReaderThemePalette> = {
  'midnight-gold': {
    id: 'midnight-gold',
    label: 'Midnight Gold',
    blurb: 'Sophisticated, immersive nighttime reading.',
    headingFont: "'Lora', Georgia, serif",
    bodyFont: "'Inter', sans-serif",
    codeFont: "'JetBrains Mono', monospace",
    colors: {
      bgSurface: '#1a1d21',
      bgElevated: '#20252b',
      textPrimary: '#d4d2cc',
      textMuted: '#9a988f',
      textDim: '#7f7d77',
      accent: '#d4af37',
      accentAlt: '#c79a23',
      borderSubtle: 'rgba(212, 210, 204, 0.16)',
      cardBg: 'rgba(26, 29, 33, 0.96)',
      cardBorder: 'rgba(212, 175, 55, 0.28)',
      cardShadow: '0 8px 40px rgba(0,0,0,0.55), 0 20px 60px rgba(0,0,0,0.35)',
      bodyText: '#d4d2cc',
      codeBg: '#2f333a',
      codeText: '#e4e1d9',
      gradientFade: 'rgba(26, 29, 33, 0.98)',
      sourceBtnBg: 'rgba(212, 175, 55, 0.10)',
      sourceBtnBorder: 'rgba(212, 175, 55, 0.35)',
      quoteBg: '#2f333a',
      quoteBorder: '#d4af37',
    },
  },
  vellum: {
    id: 'vellum',
    label: 'Vellum',
    blurb: 'Classic premium paper and warm serif rhythm.',
    headingFont: "'Lora', Georgia, serif",
    bodyFont: "'Inter', sans-serif",
    codeFont: "'JetBrains Mono', monospace",
    colors: {
      bgSurface: '#f7f3e8',
      bgElevated: '#fdfbf4',
      textPrimary: '#2f2b27',
      textMuted: '#6c6259',
      textDim: '#8b7f72',
      accent: '#8a6a2f',
      accentAlt: '#7a5924',
      borderSubtle: 'rgba(75, 60, 42, 0.16)',
      cardBg: 'rgba(253, 251, 244, 0.96)',
      cardBorder: 'rgba(122, 89, 36, 0.22)',
      cardShadow: '0 8px 24px rgba(80, 60, 40, 0.16)',
      bodyText: '#3a332c',
      codeBg: '#ede6d8',
      codeText: '#2f2b27',
      gradientFade: 'rgba(253, 251, 244, 0.98)',
      sourceBtnBg: 'rgba(138, 106, 47, 0.08)',
      sourceBtnBorder: 'rgba(138, 106, 47, 0.2)',
      quoteBg: '#f1eadc',
      quoteBorder: '#8a6a2f',
    },
  },
  'monochrome-pop': {
    id: 'monochrome-pop',
    label: 'Monochrome Pop',
    blurb: 'Crisp dark canvas with energetic accent pops.',
    headingFont: "'Lato', 'Inter', sans-serif",
    bodyFont: "'Lato', 'Inter', sans-serif",
    codeFont: "'Fira Code', 'JetBrains Mono', monospace",
    colors: {
      bgSurface: '#151515',
      bgElevated: '#1d1d1d',
      textPrimary: '#f5f5f5',
      textMuted: '#b7b7b7',
      textDim: '#8d8d8d',
      accent: '#00a3ff',
      accentAlt: '#33b5ff',
      borderSubtle: 'rgba(255, 255, 255, 0.14)',
      cardBg: 'rgba(21, 21, 21, 0.96)',
      cardBorder: 'rgba(0, 163, 255, 0.35)',
      cardShadow: '0 12px 36px rgba(0,0,0,0.5)',
      bodyText: '#ebebeb',
      codeBg: '#1f252a',
      codeText: '#f5f5f5',
      gradientFade: 'rgba(21, 21, 21, 0.98)',
      sourceBtnBg: 'rgba(0, 163, 255, 0.12)',
      sourceBtnBorder: 'rgba(0, 163, 255, 0.3)',
      quoteBg: '#1e2429',
      quoteBorder: '#00a3ff',
    },
  },
  'crisp-clean': {
    id: 'crisp-clean',
    label: 'Crisp & Clean',
    blurb: 'Airy modern minimalism focused on readability.',
    headingFont: "'Lato', 'Inter', sans-serif",
    bodyFont: "'Lato', 'Inter', sans-serif",
    codeFont: "'Fira Code', 'JetBrains Mono', monospace",
    colors: {
      bgSurface: '#ffffff',
      bgElevated: '#ffffff',
      textPrimary: '#111111',
      textMuted: '#6b7280',
      textDim: '#8b93a3',
      accent: '#007aff',
      accentAlt: '#2f8fff',
      borderSubtle: 'rgba(17, 17, 17, 0.12)',
      cardBg: '#ffffff',
      cardBorder: 'rgba(17, 17, 17, 0.14)',
      cardShadow: '0 1px 2px rgba(0,0,0,0.08), 0 8px 28px rgba(0,0,0,0.08)',
      bodyText: '#1f2937',
      codeBg: '#f3f4f6',
      codeText: '#111111',
      gradientFade: 'rgba(255, 255, 255, 0.98)',
      sourceBtnBg: '#f3f4f6',
      sourceBtnBorder: 'rgba(17, 17, 17, 0.12)',
      quoteBg: '#f3f4f6',
      quoteBorder: '#d1d5db',
    },
  },
  'sepia-comfort': {
    id: 'sepia-comfort',
    label: 'Sepia Comfort',
    blurb: 'Warm, nostalgic long-session reading mode.',
    headingFont: "'Merriweather', Georgia, serif",
    bodyFont: "'Source Sans 3', 'Inter', sans-serif",
    codeFont: "'Inconsolata', 'JetBrains Mono', monospace",
    colors: {
      bgSurface: '#fbf5e9',
      bgElevated: '#fff9ef',
      textPrimary: '#423a30',
      textMuted: '#8c7d6e',
      textDim: '#a1917f',
      accent: '#d95d39',
      accentAlt: '#e1704f',
      borderSubtle: 'rgba(66, 58, 48, 0.15)',
      cardBg: 'rgba(255, 249, 239, 0.98)',
      cardBorder: 'rgba(217, 93, 57, 0.24)',
      cardShadow: '0 8px 26px rgba(109, 80, 46, 0.16)',
      bodyText: '#423a30',
      codeBg: '#f5efe1',
      codeText: '#423a30',
      gradientFade: 'rgba(255, 249, 239, 0.98)',
      sourceBtnBg: 'rgba(217, 93, 57, 0.10)',
      sourceBtnBorder: 'rgba(217, 93, 57, 0.25)',
      quoteBg: '#f5efe1',
      quoteBorder: '#d95d39',
    },
  },
}

function getDynamicDimPalette(now: Date): ReaderThemePalette {
  const hour = now.getHours()
  if (hour >= 7 && hour < 18) {
    return {
      ...THEME_LIBRARY['crisp-clean'],
      id: 'dynamic-dim',
      label: 'Dynamic Dim',
      blurb: 'Adaptive: clean day mode',
    }
  }
  return {
    ...THEME_LIBRARY['midnight-gold'],
    id: 'dynamic-dim',
    label: 'Dynamic Dim',
    blurb: 'Adaptive: gently dim evening mode',
    colors: {
      ...THEME_LIBRARY['midnight-gold'].colors,
      bgSurface: '#1e232a',
      bgElevated: '#242a32',
      cardBg: 'rgba(30, 35, 42, 0.96)',
      gradientFade: 'rgba(30, 35, 42, 0.98)',
      accent: '#d4af37',
      accentAlt: '#e0bf57',
    },
  }
}

export function getReaderThemePalette(theme: ReadingTheme, now = new Date()): ReaderThemePalette {
  if (theme === 'dynamic-dim') return getDynamicDimPalette(now)
  return THEME_LIBRARY[theme]
}
