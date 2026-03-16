import type { ArticleObject, ContentBlock, InlineAnnotation } from '../types/article'

const normalizeBodyText = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/https:\/\/t\.co\/\S+/g, '')
    .trim()

const shouldUseAsTitle = (line: string): boolean => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length < 10 || trimmed.length > 100) {
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

interface DraftBlock {
  type: string
  text: string
  inlineStyleRanges: { offset: number; length: number; style: string }[]
  entityRanges: { key: number; offset: number; length: number }[]
}

interface DraftEntity {
  key: string
  value: {
    type: string
    data: {
      url?: string
      markdown?: string
      mediaItems?: { mediaId: string }[]
    }
  }
}

interface ArticleMediaEntity {
  media_id: string
  media_info: {
    original_img_url?: string
  }
}

function buildEntityMap(rawEntities: DraftEntity[]): Map<number, DraftEntity['value']> {
  const map = new Map<number, DraftEntity['value']>()
  if (!Array.isArray(rawEntities)) return map
  for (const entity of rawEntities) {
    map.set(Number(entity.key), entity.value)
  }
  return map
}

function buildMediaLookup(mediaEntities: ArticleMediaEntity[]): Map<string, string> {
  const map = new Map<string, string>()
  if (!Array.isArray(mediaEntities)) return map
  for (const entity of mediaEntities) {
    const url = entity?.media_info?.original_img_url
    if (url && entity.media_id) {
      map.set(String(entity.media_id), url)
    }
  }
  return map
}

function parseAnnotations(
  block: DraftBlock,
  entityMap: Map<number, DraftEntity['value']>,
): InlineAnnotation[] {
  const annotations: InlineAnnotation[] = []

  if (Array.isArray(block.inlineStyleRanges)) {
    for (const range of block.inlineStyleRanges) {
      const styleLower = String(range.style).toLowerCase()
      if (styleLower === 'bold' || styleLower === 'italic') {
        annotations.push({
          offset: range.offset,
          length: range.length,
          type: styleLower as 'bold' | 'italic',
        })
      }
    }
  }

  if (Array.isArray(block.entityRanges)) {
    for (const range of block.entityRanges) {
      const entity = entityMap.get(range.key)
      if (entity?.type === 'LINK' && entity.data?.url) {
        annotations.push({
          offset: range.offset,
          length: range.length,
          type: 'link',
          url: entity.data.url,
        })
      }
    }
  }

  return annotations.sort((a, b) => a.offset - b.offset)
}

function stripCodeFence(raw: string): string {
  let text = raw.trim()
  const fenceStart = /^```\w*\n?/
  const fenceEnd = /\n?```$/
  text = text.replace(fenceStart, '').replace(fenceEnd, '')
  return text
}

function resolveAtomicBlock(
  block: DraftBlock,
  entityMap: Map<number, DraftEntity['value']>,
  mediaLookup: Map<string, string>,
): ContentBlock | null {
  if (!Array.isArray(block.entityRanges) || block.entityRanges.length === 0) return null
  const entityRef = entityMap.get(block.entityRanges[0].key)
  if (!entityRef) return null

  if (entityRef.type === 'MEDIA') {
    const mediaItems = entityRef.data?.mediaItems
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) return null
    const imageUrl = mediaLookup.get(String(mediaItems[0].mediaId))
    if (imageUrl) {
      return { type: 'image', text: '', imageUrl, annotations: [] }
    }
  }

  if (entityRef.type === 'MARKDOWN') {
    const markdown = entityRef.data?.markdown
    if (typeof markdown === 'string' && markdown.trim()) {
      return { type: 'code-block', text: stripCodeFence(markdown), annotations: [] }
    }
  }

  return null
}

function headingLevel(blockType: string): number {
  if (blockType === 'header-one') return 1
  if (blockType === 'header-three') return 3
  return 2
}

function parseArticleBlocks(
  blocks: DraftBlock[],
  entityMap: Map<number, DraftEntity['value']>,
  mediaLookup: Map<string, string>,
): ContentBlock[] {
  const contentBlocks: ContentBlock[] = []

  for (const block of blocks) {
    const blockType = block.type ?? 'unstyled'
    const text = block.text ?? ''

    if (blockType === 'atomic') {
      const resolved = resolveAtomicBlock(block, entityMap, mediaLookup)
      if (resolved) {
        contentBlocks.push(resolved)
      }
      continue
    }

    if (!text.trim()) continue

    const annotations = parseAnnotations(block, entityMap)

    switch (blockType) {
      case 'header-one':
      case 'header-two':
      case 'header-three':
        contentBlocks.push({
          type: 'heading',
          text,
          level: headingLevel(blockType),
          annotations,
        })
        break
      case 'unordered-list-item':
      case 'ordered-list-item':
        contentBlocks.push({ type: 'list-item', text, annotations })
        break
      case 'blockquote':
        contentBlocks.push({ type: 'blockquote', text, annotations })
        break
      default:
        contentBlocks.push({ type: 'paragraph', text, annotations })
        break
    }
  }

  return contentBlocks
}

function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .filter((b) => b.type !== 'image')
    .map((b) => b.text)
    .join('\n')
}

function textToContentBlocks(text: string): ContentBlock[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ type: 'paragraph' as const, text: line, annotations: [] }))
}

function normalizeArticleTweet(
  tweet: Record<string, unknown>,
  author: Record<string, unknown>,
): ArticleObject {
  const article = tweet.article as {
    title?: string
    content?: { blocks?: DraftBlock[]; entityMap?: DraftEntity[] }
    cover_media?: { media_info?: { original_img_url?: string } }
    media_entities?: ArticleMediaEntity[]
    created_at?: string
  }

  const entityMap = buildEntityMap(article.content?.entityMap ?? [])
  const mediaLookup = buildMediaLookup(article.media_entities ?? [])
  const rawBlocks = article.content?.blocks ?? []
  const contentBlocks = parseArticleBlocks(rawBlocks, entityMap, mediaLookup)

  const title = typeof article.title === 'string' && article.title.trim()
    ? article.title.trim()
    : null

  const body = blocksToPlainText(contentBlocks)
  const coverImage = article.cover_media?.media_info?.original_img_url ?? undefined

  const images = Array.from(mediaLookup.values())
  if (coverImage && !images.includes(coverImage)) {
    images.unshift(coverImage)
  }

  const wordCount = body.split(/\s+/).filter(Boolean).length

  return {
    tweetId: String(tweet.id ?? ''),
    url: String(tweet.url ?? ''),
    authorName: String(author.name ?? ''),
    authorHandle: `@${String(author.screen_name ?? '').replace(/^@/, '')}`,
    authorAvatar: String(author.avatar_url ?? '').replace('_normal', '_400x400'),
    publishedAt: normalizePublishedAt(article.created_at ?? tweet.created_at),
    title,
    body,
    contentBlocks,
    coverImage,
    images,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
  }
}

function normalizeRegularTweet(
  tweet: Record<string, unknown>,
  author: Record<string, unknown>,
): ArticleObject {
  let body = normalizeBodyText(String(tweet.text ?? ''))
  let title: string | null = null

  const lines = body.split('\n')
  const firstLine = lines[0]?.trim() ?? ''

  if (shouldUseAsTitle(firstLine)) {
    title = firstLine
    body = lines.slice(1).join('\n').trim()
  }

  const contentBlocks = textToContentBlocks(body)

  const mediaSource = Array.isArray((tweet.media as { photos?: unknown[] })?.photos)
    ? (tweet.media as { photos: { url?: string; src?: string }[] }).photos
    : Array.isArray(tweet.media)
      ? (tweet.media as { url?: string; src?: string }[])
      : []

  const images = mediaSource
    .map((media) => media?.url ?? media?.src)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .slice(0, 6)

  const wordCount = body.split(/\s+/).filter(Boolean).length

  return {
    tweetId: String(tweet.id ?? ''),
    url: String(tweet.url ?? ''),
    authorName: String(author.name ?? ''),
    authorHandle: `@${String(author.screen_name ?? '').replace(/^@/, '')}`,
    authorAvatar: String(author.avatar_url ?? '').replace('_normal', '_400x400'),
    publishedAt: normalizePublishedAt(tweet.created_at as string | undefined),
    title,
    body,
    contentBlocks,
    images,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
  }
}

interface SyndicationTweet {
  id_str: string
  text: string
  user?: { screen_name?: string; name?: string; profile_image_url_https?: string }
  entities?: { urls?: { expanded_url?: string; display_url?: string }[] }
}

function normalizeThreadTweet(
  tweet: Record<string, unknown>,
  author: Record<string, unknown>,
  threadTweets: SyndicationTweet[],
): ArticleObject {
  const rootText = normalizeBodyText(String(tweet.text ?? ''))
  const allTexts = [rootText]

  for (const t of threadTweets) {
    const cleaned = normalizeBodyText(t.text)
    if (cleaned) allTexts.push(cleaned)
  }

  const combinedBody = allTexts.join('\n\n')
  let title: string | null = null
  let body = combinedBody

  const lines = body.split('\n')
  const firstLine = lines[0]?.trim() ?? ''
  if (shouldUseAsTitle(firstLine)) {
    title = firstLine
    body = lines.slice(1).join('\n').trim()
  }

  const contentBlocks = textToContentBlocks(body)

  const mediaSource = Array.isArray((tweet.media as { photos?: unknown[] })?.photos)
    ? (tweet.media as { photos: { url?: string; src?: string }[] }).photos
    : Array.isArray(tweet.media)
      ? (tweet.media as { url?: string; src?: string }[])
      : []

  const images = mediaSource
    .map((media) => media?.url ?? media?.src)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .slice(0, 6)

  const wordCount = body.split(/\s+/).filter(Boolean).length

  return {
    tweetId: String(tweet.id ?? ''),
    url: String(tweet.url ?? ''),
    authorName: String(author.name ?? ''),
    authorHandle: `@${String(author.screen_name ?? '').replace(/^@/, '')}`,
    authorAvatar: String(author.avatar_url ?? '').replace('_normal', '_400x400'),
    publishedAt: normalizePublishedAt(tweet.created_at as string | undefined),
    title,
    body,
    contentBlocks,
    images,
    wordCount,
    readingTime: Math.ceil(wordCount / 200),
  }
}

export const normalizeTweet = (
  apiResponse: Record<string, unknown>,
  threadTweets?: SyndicationTweet[],
): ArticleObject => {
  const tweet = (apiResponse?.tweet ?? {}) as Record<string, unknown>
  const author = (tweet.author ?? {}) as Record<string, unknown>

  if (tweet.article) {
    return normalizeArticleTweet(tweet, author)
  }

  if (threadTweets && threadTweets.length > 0) {
    return normalizeThreadTweet(tweet, author, threadTweets)
  }

  return normalizeRegularTweet(tweet, author)
}
