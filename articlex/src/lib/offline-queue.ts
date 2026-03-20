import { getSupabaseClient } from './supabase'
import type { Collection, CollectionItem } from './collections'

const QUEUE_KEY = 'articlex-offline-queue-v1'

interface QueuedCreate {
  type: 'create_collection'
  id: string
  name: string
  description: string | null
  tags: string[]
  contactEmail: string | null
  editable: boolean
  isPublic: boolean
  userId: string | null
  items: CollectionItem[]
  queuedAt: string
}

type QueuedOperation = QueuedCreate

function readQueue(): QueuedOperation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedOperation[]
  } catch {
    return []
  }
}

function writeQueue(ops: QueuedOperation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
}

export function queueCreateCollection(collection: Collection): void {
  const ops = readQueue()
  ops.push({
    type: 'create_collection',
    id: collection.id,
    name: collection.name,
    description: collection.description,
    tags: collection.tags,
    contactEmail: collection.contactEmail,
    editable: collection.editable,
    isPublic: collection.isPublic,
    userId: collection.userId,
    items: collection.items,
    queuedAt: new Date().toISOString(),
  })
  writeQueue(ops)
}

export function getPendingCount(): number {
  return readQueue().length
}

export async function syncPendingOperations(): Promise<{ synced: number; failed: number }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { synced: 0, failed: 0 }

  const ops = readQueue()
  if (ops.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0
  const remaining: QueuedOperation[] = []

  for (const op of ops) {
    if (op.type === 'create_collection') {
      try {
        const { error } = await supabase.from('collections').insert({
          id: op.id,
          name: op.name,
          description: op.description,
          tags: op.tags,
          contact_email: op.contactEmail,
          editable: op.editable,
          is_public: op.isPublic,
          user_id: op.userId,
          created_at: op.queuedAt,
          view_count: 0,
        })

        if (error) {
          if (error.code === '23505') {
            synced++
            continue
          }
          remaining.push(op)
          failed++
          continue
        }

        if (op.items.length > 0) {
          await supabase.from('collection_items').insert(
            op.items.map((item) => ({
              collection_id: op.id,
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
        }
        synced++
      } catch {
        remaining.push(op)
        failed++
      }
    }
  }

  writeQueue(remaining)
  return { synced, failed }
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY)
}
