import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const FX_URL_REGEX = /(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { url } = req.body as { url?: string }
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' })
    }

    const normalized = url.trim().replace('mobile.x.com', 'x.com').replace('/article/', '/status/')
    const match = normalized.match(FX_URL_REGEX)
    if (!match) return res.status(400).json({ error: 'Invalid Twitter/X URL' })

    const [, username, tweetId] = match
    const supabase = getSupabase()

    if (supabase) {
      const { data } = await supabase
        .from('tweet_cache')
        .select('payload, fetched_at')
        .eq('tweet_id', tweetId)
        .single()

      if (data) {
        const age = Date.now() - new Date(data.fetched_at as string).getTime()
        if (age < CACHE_TTL_MS) {
          res.setHeader('X-Cache', 'HIT')
          return res.status(200).json({ ...(data.payload as Record<string, unknown>), _cached: true })
        }
      }
    }

    const fxRes = await fetch(`https://api.fxtwitter.com/${username}/status/${tweetId}`)
    if (fxRes.status === 404) return res.status(404).json({ error: 'Tweet not found' })
    if (!fxRes.ok) return res.status(502).json({ error: 'FxTwitter API error', status: fxRes.status })

    const payload = (await fxRes.json()) as Record<string, unknown>
    if ((payload?.code as number) !== 200) {
      const message = String(payload?.message ?? '').toLowerCase()
      if (message.includes('private')) return res.status(403).json({ error: 'Private tweet' })
      return res.status(422).json({ error: 'Tweet error' })
    }

    if (supabase) {
      supabase
        .from('tweet_cache')
        .upsert(
          { tweet_id: tweetId, payload, fetched_at: new Date().toISOString() },
          { onConflict: 'tweet_id' },
        )
        .then(() => {})
        .catch(() => {})
    }

    res.setHeader('X-Cache', 'MISS')
    return res.status(200).json(payload)
  } catch (err) {
    console.error('[fetch-tweet]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
