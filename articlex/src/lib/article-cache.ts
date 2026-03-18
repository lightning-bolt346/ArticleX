import type { ArticleObject } from '../types/article'

const CACHE_KEY = 'articlex-article-cache-v1'
const TTL_MS = 24 * 60 * 60 * 1000
const MAX_ENTRIES = 50

interface CacheEntry {
  article: ArticleObject
  cachedAt: number
}

type CacheStore = Record<string, CacheEntry>

const readStore = (): CacheStore => {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(CACHE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as CacheStore
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }

    return parsed
  } catch {
    return {}
  }
}

const writeStore = (store: CacheStore): void => {
  if (typeof window === 'undefined') {
    return
  }

  const now = Date.now()
  const entries = Object.entries(store)

  const live = entries.filter(([, entry]) => now - entry.cachedAt < TTL_MS)

  if (live.length > MAX_ENTRIES) {
    live.sort((a, b) => b[1].cachedAt - a[1].cachedAt)
    live.length = MAX_ENTRIES
  }

  const pruned: CacheStore = {}
  for (const [key, entry] of live) {
    pruned[key] = entry
  }

  window.localStorage.setItem(CACHE_KEY, JSON.stringify(pruned))
}

export const getCachedArticle = (tweetId: string): ArticleObject | null => {
  const store = readStore()
  const entry = store[tweetId]
  if (!entry) {
    return null
  }

  if (Date.now() - entry.cachedAt > TTL_MS) {
    return null
  }

  return entry.article
}

export const setCachedArticle = (tweetId: string, article: ArticleObject): void => {
  const store = readStore()
  store[tweetId] = { article, cachedAt: Date.now() }
  writeStore(store)
}

export const isCached = (tweetId: string): boolean => getCachedArticle(tweetId) !== null

export const clearArticleCache = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(CACHE_KEY)
}
