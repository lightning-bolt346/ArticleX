import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
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

  const limit = Math.min(Number(req.query.limit) || 20, 50)

  try {
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, description, created_at, view_count')
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) return res.status(500).json({ error: error.message })

    const collections = ((data ?? []) as Record<string, unknown>[]).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.created_at,
      viewCount: c.view_count,
      itemCount: 0,
      items: [],
    }))

    res.setHeader('Cache-Control', 'public, max-age=120')
    return res.status(200).json(collections)
  } catch (err) {
    console.error('[collections/top]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
