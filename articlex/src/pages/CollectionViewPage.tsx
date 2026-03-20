import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Lock,
  Mail,
  Pencil,
  Share2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ImageLightbox } from '../components/ui/ImageLightbox'
import {
  getCollection,
  incrementViewCount,
  type Collection,
  type CollectionItem,
} from '../lib/collections'
import { getTagsByIds } from '../lib/tags'
import { useAuth } from '../hooks/useAuth'

const cardSpring = { type: 'spring' as const, stiffness: 100, damping: 20 }

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '' }
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-[20px] border p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="h-32 w-full rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-elevated)' }} />
              <div className="h-2.5 w-16 rounded" style={{ background: 'var(--bg-elevated)' }} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-3 w-3/4 rounded" style={{ background: 'var(--bg-elevated)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CollectionArticleCard({ item, index }: { item: CollectionItem; index: number }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...cardSpring, delay: index * 0.06 }}
        className="group rounded-[20px] border p-5 backdrop-blur-xl"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        whileHover={{ scale: 1.01, borderColor: 'rgba(124,58,237,0.4)' }}
      >
        {item.coverImage && (
          <div className="mb-4 overflow-hidden rounded-xl" data-cursor="pointer" onClick={() => setLightboxSrc(item.coverImage)}>
            <img src={item.coverImage} alt="" className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          </div>
        )}
        <div className="flex items-center gap-3">
          {item.authorAvatar ? <img src={item.authorAvatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full font-jakarta text-[14px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>{item.authorName.charAt(0).toUpperCase()}</div>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-inter text-[14px] font-semibold text-text-primary">{item.authorName}</p>
            <p className="truncate font-mono text-[12px] text-accent-cyan">@{item.authorHandle}</p>
          </div>
          <a href={item.tweetUrl} target="_blank" rel="noopener noreferrer" data-cursor="pointer" className="flex-shrink-0 text-text-dim transition-colors hover:text-text-primary" onClick={(e) => e.stopPropagation()}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        {item.title && <p className="mt-3 line-clamp-2 font-jakarta text-[17px] font-bold leading-snug text-text-primary">{item.title}</p>}
        <p className="mt-2 line-clamp-3 font-inter text-[13px] leading-relaxed text-text-muted">{item.snippet}</p>
        <div className="mt-3">
          <a href={item.tweetUrl} target="_blank" rel="noopener noreferrer" data-cursor="pointer" className="inline-flex items-center gap-1 font-mono text-[11px] text-text-dim transition-colors hover:text-accent-cyan" onClick={(e) => e.stopPropagation()}>
            Open on X <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </motion.div>
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  )
}

export function CollectionViewPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  const isOwner = Boolean(user && collection?.userId && user.id === collection.userId)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true); setError(false)
    try {
      const data = await getCollection(id)
      setCollection(data)
      if (data) incrementViewCount(id).catch(() => {})
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { void load() }, [load])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }, [])

  if (loading) {
    return (
      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-12">
        <Link to="/collections" data-cursor="pointer" className="mb-6 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}>
          <ArrowLeft className="h-3 w-3" /> Back to Collections
        </Link>
        <div className="mb-8 animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-xl" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-48 rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
        <SkeletonCards />
      </main>
    )
  }

  if (error) {
    return (
      <main className="relative z-10 mx-auto flex min-h-[50vh] w-full max-w-5xl flex-col items-center justify-center px-4 py-12 text-center">
        <p className="font-inter text-lg text-text-muted">Failed to load collection.</p>
        <motion.button type="button" data-cursor="pointer" onClick={() => void load()} className="mt-4 rounded-full px-5 py-2 font-inter text-[14px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Retry</motion.button>
        <Link to="/collections" data-cursor="pointer" className="mt-3 font-mono text-[11px] text-text-muted hover:text-text-primary">&larr; Back to Collections</Link>
      </main>
    )
  }

  if (!collection) {
    return (
      <main className="relative z-10 mx-auto flex min-h-[50vh] w-full max-w-5xl flex-col items-center justify-center px-4 py-12 text-center">
        <p className="font-jakarta text-2xl font-bold text-text-primary">Collection not found</p>
        <p className="mt-2 font-inter text-[14px] text-text-muted">This collection may have been removed or the link is incorrect.</p>
        <Link to="/collections" data-cursor="pointer" className="mt-5 inline-flex items-center rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}>&larr; Browse Collections</Link>
      </main>
    )
  }

  const tags = getTagsByIds(collection.tags)

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-12">
      <Link to="/collections" data-cursor="pointer" className="mb-6 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}>
        <ArrowLeft className="h-3 w-3" /> Back to Collections
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={cardSpring} className="rounded-[28px] border p-6 backdrop-blur-xl md:p-8" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <h1 className="font-jakarta text-3xl font-bold leading-tight md:text-4xl">
          <span className="bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent">{collection.name}</span>
        </h1>
        {collection.description && <p className="mt-3 max-w-2xl font-inter text-[15px] leading-relaxed text-text-muted">{collection.description}</p>}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag.id} className="rounded-full px-2.5 py-0.5 font-mono text-[10px]" style={{ background: `${tag.color}18`, color: tag.color, border: `1px solid ${tag.color}30` }}>
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[11px] text-text-dim">
          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> {collection.itemCount} article{collection.itemCount !== 1 ? 's' : ''}</span>
          <span className="text-border-subtle">·</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {collection.viewCount} view{collection.viewCount !== 1 ? 's' : ''}</span>
          <span className="text-border-subtle">·</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> Created {formatDate(collection.createdAt)}</span>
          {!collection.isPublic && (
            <><span className="text-border-subtle">·</span><span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span></>
          )}
        </div>

        {collection.contactEmail && (
          <div className="mt-3">
            <a href={`mailto:${collection.contactEmail}`} data-cursor="pointer" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted transition-colors hover:text-accent-cyan" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <Mail className="h-3 w-3" /> {collection.contactEmail}
            </a>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <motion.button type="button" data-cursor="pointer" onClick={handleCopy} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied!</> : <><Share2 className="h-3 w-3" /> Share</>}
          </motion.button>
          <motion.button type="button" data-cursor="pointer" onClick={() => { const link = `${window.location.origin}${window.location.pathname}#/collections/${collection.id}`; navigator.clipboard.writeText(link).catch(() => {}) }} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Copy className="h-3 w-3" /> Copy Link
          </motion.button>
          {isOwner && collection.editable && (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] text-accent-cyan" style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)' }}>
              <Pencil className="h-3 w-3" /> You can edit this collection
            </span>
          )}
        </div>
      </motion.div>

      {/* Articles grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        <AnimatePresence>
          {collection.items.map((item, index) => (
            <CollectionArticleCard key={item.tweetId} item={item} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10 flex items-center justify-center gap-2 py-6 font-mono text-[11px] text-text-dim">
        {collection.editable ? <Pencil className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {collection.editable ? 'This collection is editable by its creator' : 'This collection is locked'} · Created with ArticleX
      </motion.div>
    </main>
  )
}
