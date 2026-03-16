import type { ArticleObject } from '../types/article'

const HISTORY_KEY = 'articlex-history-v1'
const HISTORY_LIMIT = 12

export const loadHistory = (): ArticleObject[] => {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(HISTORY_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as ArticleObject[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

export const saveHistory = (entries: ArticleObject[]): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
}

export const pushHistoryEntry = (entry: ArticleObject): ArticleObject[] => {
  const existing = loadHistory().filter((item) => item.tweetId !== entry.tweetId)
  const next = [entry, ...existing].slice(0, HISTORY_LIMIT)
  saveHistory(next)
  return next
}
