import type { ArticleObject } from '../types/article'

const HISTORY_KEY = 'articlex-history-v1'
const HISTORY_LIMIT = 20

export interface HistoryEntry {
  tweetId: string
  url: string
  authorName: string
  authorHandle: string
  title: string | null
  snippet: string
  convertedAt: string
  formats: string[]
}

const readHistory = (): HistoryEntry[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(HISTORY_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as HistoryEntry[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (entry) =>
        typeof entry?.tweetId === 'string' &&
        typeof entry?.url === 'string' &&
        typeof entry?.authorName === 'string' &&
        typeof entry?.authorHandle === 'string' &&
        (typeof entry?.title === 'string' || entry?.title === null) &&
        typeof entry?.snippet === 'string' &&
        typeof entry?.convertedAt === 'string' &&
        Array.isArray(entry?.formats),
    )
  } catch {
    return []
  }
}

const writeHistory = (entries: HistoryEntry[]): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
}

export const getHistory = (): HistoryEntry[] => readHistory()

export const addToHistory = (article: ArticleObject, formats: string[]): void => {
  const entry: HistoryEntry = {
    tweetId: article.tweetId,
    url: article.url,
    authorName: article.authorName,
    authorHandle: article.authorHandle,
    title: article.title,
    snippet: article.body.slice(0, 100),
    convertedAt: new Date().toISOString(),
    formats: Array.from(new Set(formats)),
  }

  const existing = readHistory().filter((item) => item.tweetId !== article.tweetId)
  const next = [entry, ...existing].slice(0, HISTORY_LIMIT)
  writeHistory(next)
}

export const clearHistory = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(HISTORY_KEY)
}

export const updateFormats = (tweetId: string, format: string): void => {
  const history = readHistory()
  const updated = history.map((entry) => {
    if (entry.tweetId !== tweetId) {
      return entry
    }

    if (entry.formats.includes(format)) {
      return entry
    }

    return {
      ...entry,
      formats: [...entry.formats, format],
    }
  })

  writeHistory(updated)
}
