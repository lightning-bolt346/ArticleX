/*
 * Collections — Supabase when available, localStorage fallback for dev.
 *
 * Supabase SQL (run in Supabase SQL Editor):
 *
 *   CREATE TABLE collections (
 *     id          TEXT PRIMARY KEY,
 *     name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
 *     description TEXT,
 *     created_at  TIMESTAMPTZ DEFAULT now(),
 *     view_count  INTEGER DEFAULT 0 NOT NULL
 *   );
 *
 *   CREATE TABLE collection_items (
 *     id             BIGSERIAL PRIMARY KEY,
 *     collection_id  TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
 *     tweet_id       TEXT NOT NULL,
 *     tweet_url      TEXT NOT NULL,
 *     author_name    TEXT NOT NULL DEFAULT '',
 *     author_handle  TEXT NOT NULL DEFAULT '',
 *     author_avatar  TEXT NOT NULL DEFAULT '',
 *     title          TEXT,
 *     snippet        TEXT NOT NULL DEFAULT '',
 *     cover_image    TEXT,
 *     added_at       TIMESTAMPTZ DEFAULT now()
 *   );
 *
 *   CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
 *   CREATE INDEX idx_collections_view_count ON collections(view_count DESC);
 *
 *   ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
 *   ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
 *
 *   CREATE POLICY "public_read_collections" ON collections FOR SELECT USING (true);
 *   CREATE POLICY "public_read_items" ON collection_items FOR SELECT USING (true);
 *   CREATE POLICY "service_write_collections" ON collections FOR INSERT WITH CHECK (true);
 *   CREATE POLICY "service_write_items" ON collection_items FOR INSERT WITH CHECK (true);
 *
 *   CREATE OR REPLACE FUNCTION increment_collection_views(collection_id TEXT)
 *   RETURNS void LANGUAGE sql AS $$
 *     UPDATE collections SET view_count = view_count + 1 WHERE id = collection_id;
 *   $$;
 */

import { getSupabaseClient } from './supabase'
import type { ArticleObject } from '../types/article'

export interface CollectionItem {
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

export interface Collection {
  id: string
  name: string
  description: string | null
  tags: string[]
  contactEmail: string | null
  editable: boolean
  isPublic: boolean
  userId: string | null
  createdAt: string
  viewCount: number
  itemCount: number
  items: CollectionItem[]
}

const LOCAL_KEY = 'articlex-collections-dev-v1'

export function articleToCollectionItem(article: ArticleObject): CollectionItem {
  return {
    tweetId: article.tweetId,
    tweetUrl: article.url,
    authorName: article.authorName,
    authorHandle: article.authorHandle,
    authorAvatar: article.authorAvatar ?? '',
    title: article.title,
    snippet: article.body.slice(0, 120),
    coverImage: article.coverImage ?? article.images?.[0] ?? null,
    addedAt: new Date().toISOString(),
  }
}

function readLocalStore(): Record<string, Collection> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}') as Record<string, Collection>
  } catch {
    return {}
  }
}

export async function createCollection(params: {
  name: string
  description?: string
  tags?: string[]
  contactEmail?: string
  editable?: boolean
  isPublic?: boolean
  userId?: string
  items: CollectionItem[]
}): Promise<{ id: string } | { error: string }> {
  const { nanoid } = await import('nanoid')
  const id = nanoid(6)
  const supabase = getSupabaseClient()

  if (supabase) {
    const { error } = await supabase.from('collections').insert({
      id,
      name: params.name,
      description: params.description ?? null,
      tags: params.tags ?? [],
      contact_email: params.contactEmail ?? null,
      editable: params.editable ?? false,
      is_public: params.isPublic ?? true,
      user_id: params.userId ?? null,
      created_at: new Date().toISOString(),
      view_count: 0,
    })
    if (error) return { error: error.message }

    if (params.items.length > 0) {
      const { error: itemsError } = await supabase.from('collection_items').insert(
        params.items.map((item) => ({
          collection_id: id,
          tweet_id: item.tweetId,
          tweet_url: item.tweetUrl,
          author_name: item.authorName,
          author_handle: item.authorHandle,
          author_avatar: item.authorAvatar,
          title: item.title,
          snippet: item.snippet,
          cover_image: item.coverImage,
          added_at: item.addedAt,
        })),
      )
      if (itemsError) return { error: itemsError.message }
    }

    return { id }
  }

  const store = readLocalStore()
  store[id] = {
    id,
    name: params.name,
    description: params.description ?? null,
    tags: params.tags ?? [],
    contactEmail: params.contactEmail ?? null,
    editable: params.editable ?? false,
    isPublic: params.isPublic ?? true,
    userId: params.userId ?? null,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    itemCount: params.items.length,
    items: params.items,
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
  return { id }
}

export async function getCollection(id: string): Promise<Collection | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    const [collRes, itemsRes] = await Promise.all([
      supabase.from('collections').select('*').eq('id', id).single(),
      supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', id)
        .order('added_at', { ascending: true }),
    ])
    if (collRes.error || !collRes.data) return null

    const c = collRes.data as Record<string, unknown>
    const items = ((itemsRes.data ?? []) as Record<string, unknown>[]).map((i) => ({
      tweetId: i.tweet_id as string,
      tweetUrl: i.tweet_url as string,
      authorName: i.author_name as string,
      authorHandle: i.author_handle as string,
      authorAvatar: (i.author_avatar as string) ?? '',
      title: i.title as string | null,
      snippet: i.snippet as string,
      coverImage: i.cover_image as string | null,
      addedAt: i.added_at as string,
    }))

    return {
      id: c.id as string,
      name: c.name as string,
      description: c.description as string | null,
      tags: (c.tags as string[]) ?? [],
      contactEmail: (c.contact_email as string) ?? null,
      editable: (c.editable as boolean) ?? false,
      isPublic: (c.is_public as boolean) ?? true,
      userId: (c.user_id as string) ?? null,
      createdAt: c.created_at as string,
      viewCount: c.view_count as number,
      itemCount: items.length,
      items,
    }
  }

  const store = readLocalStore()
  return store[id] ?? null
}

export async function incrementViewCount(id: string): Promise<void> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      await supabase.rpc('increment_collection_views', { collection_id: id })
    } catch { /* silent */ }
    return
  }

  try {
    const store = readLocalStore()
    if (store[id]) {
      store[id].viewCount += 1
      localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
    }
  } catch { /* silent */ }
}

export async function getTopCollections(limit = 20): Promise<Collection[]> {
  const supabase = getSupabaseClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, description, tags, contact_email, editable, is_public, user_id, created_at, view_count')
      .eq('is_public', true)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return (data as Record<string, unknown>[]).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      description: c.description as string | null,
      tags: (c.tags as string[]) ?? [],
      contactEmail: (c.contact_email as string) ?? null,
      editable: (c.editable as boolean) ?? false,
      isPublic: (c.is_public as boolean) ?? true,
      userId: (c.user_id as string) ?? null,
      createdAt: c.created_at as string,
      viewCount: c.view_count as number,
      itemCount: 0,
      items: [],
    }))
  }

  const store = readLocalStore()
  return Object.values(store)
    .filter((c) => c.isPublic)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
}

export async function updateCollectionItems(
  collectionId: string,
  items: CollectionItem[],
): Promise<{ ok: boolean } | { error: string }> {
  const supabase = getSupabaseClient()

  if (supabase) {
    const { error: delErr } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
    if (delErr) return { error: delErr.message }

    if (items.length > 0) {
      const { error } = await supabase.from('collection_items').insert(
        items.map((item) => ({
          collection_id: collectionId,
          tweet_id: item.tweetId,
          tweet_url: item.tweetUrl,
          author_name: item.authorName,
          author_handle: item.authorHandle,
          author_avatar: item.authorAvatar,
          title: item.title,
          snippet: item.snippet,
          cover_image: item.coverImage,
          added_at: item.addedAt,
        })),
      )
      if (error) return { error: error.message }
    }

    return { ok: true }
  }

  try {
    const store = readLocalStore()
    if (!store[collectionId]) return { error: 'Not found' }
    store[collectionId].items = items
    store[collectionId].itemCount = items.length
    localStorage.setItem(LOCAL_KEY, JSON.stringify(store))
    return { ok: true }
  } catch {
    return { error: 'Failed to update' }
  }
}

export async function getUserCollections(userId: string): Promise<Collection[]> {
  const supabase = getSupabaseClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, description, tags, contact_email, editable, is_public, user_id, created_at, view_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return (data as Record<string, unknown>[]).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      description: c.description as string | null,
      tags: (c.tags as string[]) ?? [],
      contactEmail: (c.contact_email as string) ?? null,
      editable: (c.editable as boolean) ?? false,
      isPublic: (c.is_public as boolean) ?? true,
      userId: (c.user_id as string) ?? null,
      createdAt: c.created_at as string,
      viewCount: c.view_count as number,
      itemCount: 0,
      items: [],
    }))
  }

  const store = readLocalStore()
  return Object.values(store)
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
