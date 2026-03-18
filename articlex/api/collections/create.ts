import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

interface ItemPayload {
  tweetId: string
  tweetUrl: string
  authorName: string
  authorHandle: string
  authorAvatar: string
  title: string | null
  snippet: string
  coverImage: string | null
  addedAt: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getSupabase()
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured' })

  try {
    const { name, description, items } = req.body as {
      name?: string
      description?: string
      items?: ItemPayload[]
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 60) {
      return res.status(400).json({ error: 'name is required (1-60 chars)' })
    }

    const cleanItems = Array.isArray(items) ? items.slice(0, 50) : []
    const id = nanoid(6)

    const { error } = await supabase.from('collections').insert({
      id,
      name: name.trim(),
      description: description?.trim() || null,
      created_at: new Date().toISOString(),
      view_count: 0,
    })
    if (error) return res.status(500).json({ error: error.message })

    if (cleanItems.length > 0) {
      const { error: itemsError } = await supabase.from('collection_items').insert(
        cleanItems.map((item) => ({
          collection_id: id,
          tweet_id: item.tweetId,
          tweet_url: item.tweetUrl,
          author_name: item.authorName ?? '',
          author_handle: item.authorHandle ?? '',
          author_avatar: item.authorAvatar ?? '',
          title: item.title ?? null,
          snippet: item.snippet ?? '',
          cover_image: item.coverImage ?? null,
          added_at: item.addedAt ?? new Date().toISOString(),
        })),
      )
      if (itemsError) return res.status(500).json({ error: itemsError.message })
    }

    return res.status(201).json({ id })
  } catch (err) {
    console.error('[collections/create]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
