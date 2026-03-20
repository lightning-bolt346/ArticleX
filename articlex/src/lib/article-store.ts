import type { ArticleObject } from '../types/article'
import { getCachedArticle, setCachedArticle } from './article-cache'
import { getSupabaseClient } from './supabase'

const LOCAL_KEY = 'articlex-saved-articles-v1'
const LOCAL_LIMIT = 150

interface StoredArticleEntry {
  article: ArticleObject
  savedAt: string
}

type StoredArticleMap = Record<string, StoredArticleEntry>

function isArticleObject(value: unknown): value is ArticleObject {
  if (!value || typeof value !== 'object') return false
  const article = value as Partial<ArticleObject>
  return (
    typeof article.tweetId === 'string' &&
    typeof article.url === 'string' &&
    typeof article.authorName === 'string' &&
    typeof article.authorHandle === 'string' &&
    typeof article.authorAvatar === 'string' &&
    typeof article.publishedAt === 'string' &&
    (typeof article.title === 'string' || article.title === null) &&
    typeof article.body === 'string' &&
    Array.isArray(article.contentBlocks) &&
    Array.isArray(article.images) &&
    typeof article.wordCount === 'number' &&
    typeof article.readingTime === 'number'
  )
}

function readLocalStore(): StoredArticleMap {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredArticleMap
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

function writeLocalStore(store: StoredArticleMap): void {
  if (typeof window === 'undefined') return

  const entries = Object.entries(store)
    .filter(([, entry]) => isArticleObject(entry?.article))
    .sort((a, b) => new Date(b[1].savedAt).getTime() - new Date(a[1].savedAt).getTime())
    .slice(0, LOCAL_LIMIT)

  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(Object.fromEntries(entries)))
}

function buildRow(article: ArticleObject) {
  return {
    tweet_id: article.tweetId,
    tweet_url: article.url,
    author_name: article.authorName,
    author_handle: article.authorHandle,
    author_avatar: article.authorAvatar,
    published_at: article.publishedAt,
    title: article.title,
    snippet: article.body.slice(0, 240),
    cover_image: article.coverImage ?? null,
    word_count: article.wordCount,
    reading_time: article.readingTime,
    payload: article,
    updated_at: new Date().toISOString(),
  }
}

export function saveArticleLocally(article: ArticleObject): void {
  const store = readLocalStore()
  store[article.tweetId] = {
    article,
    savedAt: new Date().toISOString(),
  }
  writeLocalStore(store)
  setCachedArticle(article.tweetId, article)
}

export async function persistArticle(article: ArticleObject): Promise<void> {
  saveArticleLocally(article)

  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    await supabase.from('articles').upsert(buildRow(article), {
      onConflict: 'tweet_id',
    })
  } catch {
    // Local storage remains the durable fallback when Supabase is unavailable.
  }
}

export async function getSavedArticle(tweetId: string): Promise<ArticleObject | null> {
  const cached = getCachedArticle(tweetId)
  if (cached) {
    saveArticleLocally(cached)
    return cached
  }

  const local = readLocalStore()[tweetId]?.article
  if (local && isArticleObject(local)) {
    setCachedArticle(local.tweetId, local)
    return local
  }

  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('payload')
      .eq('tweet_id', tweetId)
      .maybeSingle()

    if (error || !data) return null

    const payload = (data as { payload?: unknown }).payload
    if (!isArticleObject(payload)) return null

    saveArticleLocally(payload)
    return payload
  } catch {
    return null
  }
}
