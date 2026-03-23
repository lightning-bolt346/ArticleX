import type { VercelRequest, VercelResponse } from '@vercel/node'

const ALLOWED_HOST_RE = /^[a-z0-9-]+\.substack\.com$/i

const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|0\.|::1|fd[0-9a-f]{2}:)/i

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_RE.test(hostname)
}

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOST_RE.test(hostname)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const body = req.body as { url?: unknown }
    const rawUrl = body?.url

    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'url is required' })
    }

    const trimmedUrl = rawUrl.trim()

    let parsed: URL
    try {
      parsed = new URL(trimmedUrl)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Only http/https allowed
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only http/https URLs are allowed' })
    }

    // SSRF protection — reject private/loopback addresses
    if (isPrivateHost(parsed.hostname)) {
      return res.status(400).json({ error: 'Private network addresses are not allowed' })
    }

    // Restrict to Substack feeds only
    if (!isAllowedHost(parsed.hostname)) {
      return res.status(400).json({
        error: 'Only Substack publication feeds are supported (*.substack.com)',
      })
    }

    // Path must include /feed
    if (!parsed.pathname.includes('/feed')) {
      return res.status(400).json({
        error: 'URL must point to a feed path (e.g. https://example.substack.com/feed)',
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12_000)

    let rssRes: Response
    try {
      rssRes = await fetch(trimmedUrl, {
        headers: {
          'User-Agent': 'ArticleX-RSS-Reader/1.0 (+https://github.com/lightning-bolt346/ArticleX)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: controller.signal,
      })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      const name = (fetchErr as { name?: string }).name
      if (name === 'AbortError') {
        return res.status(504).json({ error: 'Feed request timed out' })
      }
      throw fetchErr
    }

    clearTimeout(timeoutId)

    if (!rssRes.ok) {
      return res.status(502).json({ error: `Feed returned HTTP ${rssRes.status}` })
    }

    const contentType = rssRes.headers.get('content-type') ?? ''
    const isXml =
      contentType.includes('xml') ||
      contentType.includes('rss') ||
      contentType.includes('atom') ||
      contentType.includes('text/plain')

    if (!isXml) {
      // Still allow and let the client decide — some servers return text/html for RSS
    }

    const xml = await rssRes.text()

    res.setHeader('Content-Type', 'text/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=1800, max-age=1800')
    return res.status(200).send(xml)
  } catch (err) {
    console.error('[fetch-rss]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
