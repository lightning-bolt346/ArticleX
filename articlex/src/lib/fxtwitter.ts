import type { ArticleObject } from '../types/article'
import { countWords, extractTitleFromBody, normalizeArticleBody } from './normalizer'

const X_STATUS_REGEX =
  /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/i

export interface ParsedXUrl {
  handle: string
  tweetId: string
  canonicalUrl: string
}

export const parseXArticleUrl = (input: string): ParsedXUrl | null => {
  const trimmed = input.trim()
  const match = trimmed.match(X_STATUS_REGEX)

  if (!match) {
    return null
  }

  const [, handle, tweetId] = match
  return {
    handle,
    tweetId,
    canonicalUrl: `https://x.com/${handle}/status/${tweetId}`,
  }
}

export const buildPreviewArticleFromUrl = (input: string): ArticleObject | null => {
  const parsed = parseXArticleUrl(input)
  if (!parsed) {
    return null
  }

  const draftBody = `Building Notes from @${parsed.handle}

This preview is generated entirely in the browser for the ArticleX Phase 1 experience.
In the next phases, ArticleX will parse richer thread/article content and media directly from compatible sources.

Original post: ${parsed.canonicalUrl}`

  const body = normalizeArticleBody(draftBody)
  const wordCount = countWords(body)

  return {
    tweetId: parsed.tweetId,
    url: parsed.canonicalUrl,
    authorName: parsed.handle,
    authorHandle: parsed.handle,
    authorAvatar: `https://unavatar.io/x/${parsed.handle}`,
    publishedAt: new Date().toISOString(),
    title: extractTitleFromBody(body),
    body,
    images: [],
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
  }
}
