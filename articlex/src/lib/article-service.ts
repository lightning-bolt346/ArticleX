import type { ArticleObject } from '../types/article'
import { addToHistory } from './history'
import { normalizeTweet } from './normalizer'
import { getCollection } from './collections'
import { env, resolveEndpoint } from './env'
import { persistArticle, getSavedArticle } from './article-store'
import { fetchTweet, FxTwitterErrorCode, type FxTwitterError } from './fxtwitter'
import { getCachedArticle, setCachedArticle } from './article-cache'
import { extractTweetId } from './tweet'

export class ArticleSourceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArticleSourceError'
  }
}

async function fetchViaProxy(url: string): Promise<Record<string, unknown>> {
  const endpoint = resolveEndpoint('/api/fetch-tweet') ?? `${env.basePath.replace(/\/$/, '')}/api/fetch-tweet`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Proxy error ${res.status}`)
  }

  return res.json() as Promise<Record<string, unknown>>
}

function trackArticle(article: ArticleObject, historyEnabled: boolean): void {
  setCachedArticle(article.tweetId, article)
  void persistArticle(article)
  if (historyEnabled) addToHistory(article, [])
}

export async function loadArticleFromUrl(
  url: string,
  options?: { trackHistory?: boolean },
): Promise<{ article: ArticleObject; fromCache: boolean }> {
  const trackHistory = options?.trackHistory ?? true
  const tweetId = extractTweetId(url)

  if (tweetId) {
    const cached = getCachedArticle(tweetId)
    if (cached) {
      trackArticle(cached, trackHistory)
      return { article: cached, fromCache: true }
    }

    const saved = await getSavedArticle(tweetId)
    if (saved) {
      trackArticle(saved, trackHistory)
      return { article: saved, fromCache: true }
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = await fetchViaProxy(url)
  } catch {
    payload = await fetchTweet(url)
  }

  const article = normalizeTweet(payload)
  trackArticle(article, trackHistory)

  return { article, fromCache: false }
}

export async function loadArticleByTweetId(params: {
  tweetId: string
  sourceUrl?: string | null
  collectionId?: string | null
  trackHistory?: boolean
}): Promise<{ article: ArticleObject; fromCache: boolean }> {
  const { tweetId, sourceUrl, collectionId, trackHistory } = params

  const cached = getCachedArticle(tweetId)
  if (cached) {
    trackArticle(cached, trackHistory ?? true)
    return { article: cached, fromCache: true }
  }

  const saved = await getSavedArticle(tweetId)
  if (saved) {
    trackArticle(saved, trackHistory ?? true)
    return { article: saved, fromCache: true }
  }

  let resolvedUrl = sourceUrl?.trim()

  if (!resolvedUrl && collectionId) {
    const collection = await getCollection(collectionId)
    resolvedUrl = collection?.items.find((item) => item.tweetId === tweetId)?.tweetUrl
  }

  if (!resolvedUrl) {
    throw new ArticleSourceError(
      'This post has not been saved yet. Open it from a collection or convert it once from the homepage first.',
    )
  }

  return loadArticleFromUrl(resolvedUrl, { trackHistory })
}

export function resolveArticleErrorMessage(err: unknown): string {
  if (err instanceof ArticleSourceError) return err.message

  const typedError = err as FxTwitterError
  switch (typedError?.code) {
    case FxTwitterErrorCode.INVALID_URL:
      return 'Please paste a valid X/Twitter URL.'
    case FxTwitterErrorCode.NOT_FOUND:
      return 'Tweet not found. It may have been deleted.'
    case FxTwitterErrorCode.PRIVATE_TWEET:
      return 'This tweet is private and cannot be accessed.'
    case FxTwitterErrorCode.API_ERROR:
      return `FixTweet API error${typedError.status ? ` (${typedError.status})` : ''}. Try again in a moment.`
    case FxTwitterErrorCode.TWEET_ERROR:
      return 'The API returned an invalid tweet payload.'
    default:
      if (err instanceof Error && err.message) return err.message
      return 'Something went wrong while loading this post.'
  }
}
