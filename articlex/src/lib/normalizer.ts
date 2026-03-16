import type { ArticleObject } from '../types/article'

const normalizeBodyText = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/https:\/\/t\.co\/\S+/g, '')
    .trim()

const shouldUseAsTitle = (line: string): boolean => {
  const trimmed = line.trim()
  if (!trimmed) {
    return false
  }

  if (trimmed.length < 10 || trimmed.length > 100) {
    return false
  }

  if (!/^[A-Z]/.test(trimmed)) {
    return false
  }

  return !/[.!?]$/.test(trimmed)
}

const normalizePublishedAt = (value: unknown): string => {
  if (typeof value !== 'string') {
    return new Date().toISOString()
  }

  const asDate = new Date(value)
  if (Number.isNaN(asDate.getTime())) {
    return new Date().toISOString()
  }

  return asDate.toISOString()
}

export const normalizeTweet = (apiResponse: any): ArticleObject => {
  const tweet = apiResponse?.tweet ?? {}
  const author = tweet.author ?? {}

  let body = normalizeBodyText(String(tweet.text ?? ''))
  let title: string | null = null

  const lines = body.split('\n')
  const firstLine = lines[0]?.trim() ?? ''

  if (shouldUseAsTitle(firstLine)) {
    title = firstLine
    body = lines.slice(1).join('\n').trim()
  }

  const mediaSource = Array.isArray(tweet?.media?.photos)
    ? tweet.media.photos
    : Array.isArray(tweet?.media)
      ? tweet.media
      : []

  const images = mediaSource
    .map((media: any) => media?.url ?? media?.src)
    .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
    .slice(0, 6)

  const wordCount = body.split(/\s+/).filter(Boolean).length

  return {
    tweetId: String(tweet.id ?? ''),
    url: String(tweet.url ?? ''),
    authorName: String(author.name ?? ''),
    authorHandle: `@${String(author.screen_name ?? '').replace(/^@/, '')}`,
    authorAvatar: String(author.avatar_url ?? '').replace('_normal', '_400x400'),
    publishedAt: normalizePublishedAt(tweet.created_at),
    title,
    body,
    images,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
  }
}
