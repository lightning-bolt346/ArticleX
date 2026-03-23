import type { ArticleObject, ContentBlock } from '../types/article'
import { getSupabaseClient } from './supabase'

const CACHE_PREFIX = 'articlex-substack-cache-'
const CACHE_TTL_MS = 30 * 60 * 1000

export interface SubstackArticle {
  id: string
  title: string
  subtitle: string
  url: string
  publishedAt: string
  readingTime: number
  publicationId: string
  publicationName: string
  isRead: boolean
  isBookmarked: boolean
  isPaywalled: boolean
  content?: string
  author?: string
  coverImage?: string
  wordCount: number
}

export interface SubstackPublication {
  id: string
  url: string
  title: string
  description: string
  faviconUrl: string
  lastFetched: string
  articles: SubstackArticle[]
}

export interface SubstackSubscriptionRecord {
  id: string
  user_id: string
  publication_url: string
  title: string | null
  description: string | null
  favicon_url: string | null
  created_at: string
}

interface CacheEntry {
  data: SubstackPublication
  timestamp: number
}

// ─── URL helpers ────────────────────────────────────────────────────────────

export function normalizeFeedUrl(input: string): string {
  const trimmed = input.trim().replace(/\/$/, '')
  if (trimmed.endsWith('/feed')) return trimmed

  const substackMatch = trimmed.match(/^https?:\/\/([a-z0-9-]+)\.substack\.com(\/.*)?$/i)
  if (substackMatch) {
    return `https://${substackMatch[1]}.substack.com/feed`
  }

  try {
    const u = new URL(trimmed)
    return `${u.origin}/feed`
  } catch {
    throw new Error('Invalid URL — please enter a valid web address')
  }
}

export function getPublicationId(url: string): string {
  const substackMatch = url.match(/^https?:\/\/([a-z0-9-]+)\.substack\.com/i)
  if (substackMatch) return substackMatch[1]
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

// ─── RSS fetch via proxy ─────────────────────────────────────────────────────

async function fetchRssXml(feedUrl: string): Promise<string> {
  const res = await fetch('/api/fetch-rss', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: feedUrl }),
  })

  if (!res.ok) {
    let errMsg = `RSS fetch failed (${res.status})`
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) errMsg = data.error
    } catch { /* noop */ }
    throw new Error(errMsg)
  }

  return res.text()
}

// ─── XML parsing helpers ─────────────────────────────────────────────────────

function stripHtml(html: string): string {
  try {
    const div = document.createElement('div')
    div.innerHTML = html
    return (div.textContent ?? div.innerText ?? '').trim()
  } catch {
    return html.replace(/<[^>]+>/g, '').trim()
  }
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function detectPaywall(item: Element): boolean {
  const content =
    item.querySelector('content\\:encoded')?.textContent ??
    item.querySelector('encoded')?.textContent ??
    ''
  const description = item.querySelector('description')?.textContent ?? ''
  const fullText = content + description

  if (
    fullText.includes('class="paywall"') ||
    fullText.includes('subscriberOnly') ||
    fullText.includes('subscriber-only') ||
    fullText.includes('paid subscribers only') ||
    fullText.includes('for paid subscribers')
  ) {
    return true
  }

  if (content.length > 0 && content.length < 600 && description.length < 400) {
    return true
  }

  return false
}

function extractCoverImage(item: Element, content: string): string {
  const enclosure = item.querySelector('enclosure')
  const encType = enclosure?.getAttribute('type') ?? ''
  if (enclosure && encType.startsWith('image/')) {
    return enclosure.getAttribute('url') ?? ''
  }

  const mediaContent = item.querySelector('media\\:content, content')
  if (mediaContent) {
    const medium = mediaContent.getAttribute('medium') ?? ''
    const type = mediaContent.getAttribute('type') ?? ''
    if (medium === 'image' || type.startsWith('image/')) {
      return mediaContent.getAttribute('url') ?? ''
    }
  }

  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch) return imgMatch[1]

  return ''
}

function getTextContent(item: Element, selector: string): string {
  return item.querySelector(selector)?.textContent?.trim() ?? ''
}

function parseRssItem(
  item: Element,
  publicationId: string,
  publicationName: string,
  readStatusMap: Map<string, { isRead: boolean; isBookmarked: boolean }>,
): SubstackArticle {
  const title = getTextContent(item, 'title') || 'Untitled'
  const link = getTextContent(item, 'link')
  const pubDateRaw = getTextContent(item, 'pubDate')

  const rawContent =
    item.querySelector('content\\:encoded')?.textContent ??
    item.querySelector('encoded')?.textContent ??
    ''

  const rawDescription = getTextContent(item, 'description')
  const subtitle = stripHtml(rawDescription).slice(0, 300)

  const author =
    getTextContent(item, 'author') ||
    item.querySelector('dc\\:creator')?.textContent?.trim() ||
    item.querySelector('creator')?.textContent?.trim() ||
    ''

  const isPaywalled = detectPaywall(item)
  const coverImage = extractCoverImage(item, rawContent)

  const textForReadTime = isPaywalled ? subtitle : stripHtml(rawContent) || subtitle
  const readingTime = estimateReadingTime(textForReadTime)
  const wordCount = estimateWordCount(textForReadTime)

  const id = link || `${publicationId}-${title}`
  const readStatus = readStatusMap.get(link) ?? { isRead: false, isBookmarked: false }

  let publishedAt: string
  try {
    publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString()
  } catch {
    publishedAt = new Date().toISOString()
  }

  return {
    id,
    title,
    subtitle,
    url: link,
    publishedAt,
    readingTime,
    wordCount,
    publicationId,
    publicationName,
    isRead: readStatus.isRead,
    isBookmarked: readStatus.isBookmarked,
    isPaywalled,
    content: isPaywalled ? undefined : rawContent || undefined,
    author,
    coverImage,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function parseSubstackFeed(
  inputUrl: string,
  readStatusMap: Map<string, { isRead: boolean; isBookmarked: boolean }> = new Map(),
): Promise<SubstackPublication> {
  const feedUrl = normalizeFeedUrl(inputUrl)
  const xml = await fetchRssXml(feedUrl)

  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('Invalid RSS — the feed could not be parsed')

  const channel = doc.querySelector('channel')
  if (!channel) throw new Error('No channel element found in RSS feed')

  const title =
    channel.querySelector('channel > title')?.textContent?.trim() ||
    'Unknown Publication'
  const description =
    channel.querySelector('channel > description')?.textContent?.trim() || ''
  const canonicalLink =
    channel.querySelector('channel > link')?.textContent?.trim() || feedUrl.replace('/feed', '')

  const imageUrl =
    channel.querySelector('channel > image > url')?.textContent?.trim() ||
    channel.querySelector('image > url')?.textContent?.trim() ||
    `${new URL(canonicalLink).origin}/favicon.ico`

  const publicationId = getPublicationId(canonicalLink)

  const items = Array.from(doc.querySelectorAll('item'))
  const articles = items.map((item) =>
    parseRssItem(item, publicationId, title, readStatusMap),
  )

  return {
    id: publicationId,
    url: canonicalLink,
    title,
    description,
    faviconUrl: imageUrl,
    lastFetched: new Date().toISOString(),
    articles,
  }
}

// ─── LocalStorage cache ──────────────────────────────────────────────────────

function getCacheKey(publicationId: string): string {
  return `${CACHE_PREFIX}${publicationId}`
}

function readCache(publicationId: string): SubstackPublication | null {
  try {
    const raw = localStorage.getItem(getCacheKey(publicationId))
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(getCacheKey(publicationId))
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function writeCache(pub: SubstackPublication): void {
  try {
    const entry: CacheEntry = { data: pub, timestamp: Date.now() }
    localStorage.setItem(getCacheKey(pub.id), JSON.stringify(entry))
  } catch { /* Storage quota exceeded — ignore */ }
}

export function invalidateCache(publicationId: string): void {
  localStorage.removeItem(getCacheKey(publicationId))
}

// ─── Supabase helpers ────────────────────────────────────────────────────────

export async function getUserSubscriptions(
  userId: string,
): Promise<SubstackSubscriptionRecord[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('substack_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[substack] getUserSubscriptions', error)
    return []
  }

  return (data ?? []) as SubstackSubscriptionRecord[]
}

export async function addSubscription(
  userId: string,
  rawUrl: string,
): Promise<
  | { success: true; publication: SubstackPublication }
  | { success: false; error: string }
> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { success: false, error: 'Authentication service not configured' }
  }

  try {
    const pub = await parseSubstackFeed(rawUrl)

    const { error } = await supabase.from('substack_subscriptions').insert({
      user_id: userId,
      publication_url: pub.url,
      title: pub.title,
      description: pub.description,
      favicon_url: pub.faviconUrl,
    })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You are already subscribed to this publication' }
      }
      return { success: false, error: error.message }
    }

    writeCache(pub)
    return { success: true, publication: pub }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add subscription'
    return { success: false, error: message }
  }
}

export async function removeSubscription(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.from('substack_subscriptions').delete().eq('id', id)
}

export async function fetchLatestArticles(
  subscription: SubstackSubscriptionRecord,
  readStatusMap: Map<string, { isRead: boolean; isBookmarked: boolean }> = new Map(),
): Promise<SubstackPublication> {
  const pubId = getPublicationId(subscription.publication_url)
  const cached = readCache(pubId)

  if (cached) {
    const refreshed = {
      ...cached,
      articles: cached.articles.map((a) => ({
        ...a,
        ...(readStatusMap.get(a.url) ?? {}),
      })),
    }
    return refreshed
  }

  const pub = await parseSubstackFeed(subscription.publication_url, readStatusMap)
  writeCache(pub)
  return pub
}

// ─── Read / bookmark status ──────────────────────────────────────────────────

export async function getUserReadStatuses(
  userId: string,
): Promise<Map<string, { isRead: boolean; isBookmarked: boolean }>> {
  const supabase = getSupabaseClient()
  if (!supabase) return new Map()

  const { data } = await supabase
    .from('substack_read_status')
    .select('article_url, is_read, is_bookmarked')
    .eq('user_id', userId)

  const map = new Map<string, { isRead: boolean; isBookmarked: boolean }>()
  for (const row of data ?? []) {
    const r = row as { article_url: string; is_read: boolean; is_bookmarked: boolean }
    map.set(r.article_url, { isRead: r.is_read, isBookmarked: r.is_bookmarked })
  }
  return map
}

export async function markArticleRead(
  userId: string,
  articleUrl: string,
  isRead: boolean,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('substack_read_status').upsert(
    {
      user_id: userId,
      article_url: articleUrl,
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,article_url' },
  )
}

export async function toggleBookmark(
  userId: string,
  articleUrl: string,
  isBookmarked: boolean,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  await supabase.from('substack_read_status').upsert(
    {
      user_id: userId,
      article_url: articleUrl,
      is_bookmarked: isBookmarked,
    },
    { onConflict: 'user_id,article_url' },
  )
}

// ─── Convert Substack article → ArticleObject (for ArticlePreview) ────────────

export function substackArticleToArticleObject(
  article: SubstackArticle,
): ArticleObject {
  const blocks: ContentBlock[] = []

  if (article.subtitle) {
    blocks.push({
      type: 'paragraph',
      text: article.subtitle,
      annotations: [],
    })
  }

  if (article.content) {
    // Parse HTML content into paragraphs
    try {
      const div = document.createElement('div')
      div.innerHTML = article.content

      const processNode = (node: Element) => {
        const tag = node.tagName?.toLowerCase()

        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
          const text = (node.textContent ?? '').trim()
          if (text) {
            blocks.push({
              type: 'heading',
              text,
              level: tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3,
              annotations: [],
            })
          }
        } else if (tag === 'p') {
          const text = (node.textContent ?? '').trim()
          if (text) {
            blocks.push({ type: 'paragraph', text, annotations: [] })
          }
        } else if (tag === 'blockquote') {
          const text = (node.textContent ?? '').trim()
          if (text) {
            blocks.push({ type: 'blockquote', text, annotations: [] })
          }
        } else if (tag === 'img') {
          const src = node.getAttribute('src')
          if (src) {
            blocks.push({
              type: 'image',
              text: node.getAttribute('alt') ?? '',
              imageUrl: src,
              annotations: [],
            })
          }
        } else if (tag === 'li') {
          const text = (node.textContent ?? '').trim()
          if (text) {
            blocks.push({ type: 'list-item', text, annotations: [] })
          }
        } else {
          for (const child of Array.from(node.children)) {
            processNode(child as Element)
          }
        }
      }

      for (const child of Array.from(div.children)) {
        processNode(child as Element)
      }
    } catch { /* DOM parsing failed — fall back to plain body */ }
  }

  const body = article.subtitle + (article.content ? '\n\n' + stripHtml(article.content) : '')

  const tweetId = `substack-${encodeURIComponent(article.url).slice(0, 60)}`

  return {
    tweetId,
    url: article.url,
    authorName: article.author || article.publicationName,
    authorHandle: article.publicationId,
    authorAvatar: '',
    publishedAt: article.publishedAt,
    title: article.title,
    body,
    contentBlocks: blocks,
    coverImage: article.coverImage || undefined,
    images: article.coverImage ? [article.coverImage] : [],
    wordCount: article.wordCount,
    readingTime: article.readingTime,
  }
}
