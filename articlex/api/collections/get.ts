import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getSupabase()
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' })

  const id = req.query.id as string | undefined
  if (!id) return res.status(400).json({ error: 'id query param is required' })

  try {
    const [collRes, itemsRes] = await Promise.all([
      supabase.from('collections').select('*').eq('id', id).single(),
      supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', id)
        .order('added_at', { ascending: true }),
    ])

    if (collRes.error || !collRes.data) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    const c = collRes.data as Record<string, unknown>
    const items = ((itemsRes.data ?? []) as Record<string, unknown>[]).map((i) => ({
      tweetId: i.tweet_id,
      tweetUrl: i.tweet_url,
      authorName: i.author_name,
      authorHandle: i.author_handle,
      authorAvatar: i.author_avatar ?? '',
      title: i.title,
      snippet: i.snippet,
      coverImage: i.cover_image,
      addedAt: i.added_at,
    }))

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return res.status(200).json({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.created_at,
      viewCount: c.view_count,
      itemCount: items.length,
      items,
    })
  } catch (err) {
    console.error('[collections/get]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
