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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = (req.body ?? {}) as { id?: string }
  if (!id) return res.status(400).json({ error: 'id is required' })

  const supabase = getSupabase()
  if (!supabase) return res.status(200).json({ ok: true })

  try {
    await supabase.rpc('increment_collection_views', { collection_id: id })
  } catch { /* fire-and-forget */ }

  return res.status(200).json({ ok: true })
}
