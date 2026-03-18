import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Eye, FolderOpen, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTopCollections, type Collection } from '../lib/collections'

const cardSpring = { type: 'spring' as const, stiffness: 100, damping: 20 }

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-[20px] border p-5"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <div className="h-4 w-3/4 rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="mt-3 h-3 w-full rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="mt-2 h-3 w-1/2 rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="mt-4 flex gap-4">
            <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-elevated)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DiscoverCollectionCard({
  collection,
  rank,
  index,
}: {
  collection: Collection
  rank: number
  index: number
}) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...cardSpring, delay: index * 0.06 }}
      data-cursor="pointer"
      onClick={() => navigate(`/collections/${collection.id}`)}
      className="relative rounded-[20px] border p-5 backdrop-blur-xl"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
      whileHover={{ scale: 1.02, borderColor: 'rgba(124,58,237,0.4)' }}
    >
      <span
        className="absolute right-3 top-3 rounded-full border px-2 py-0.5 font-mono text-[11px]"
        style={{
          borderColor: 'rgba(124,58,237,0.3)',
          color: 'var(--accent-violet)',
          background: 'var(--bg-elevated)',
        }}
      >
        #{rank}
      </span>

      <h3 className="pr-10 font-jakarta text-[18px] font-bold text-text-primary">
        {collection.name}
      </h3>

      {collection.description && (
        <p className="mt-2 line-clamp-2 font-inter text-[13px] text-text-muted">
          {collection.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-text-dim">
        {collection.itemCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {collection.itemCount} articles
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" /> {collection.viewCount} views
        </span>
      </div>
    </motion.div>
  )
}

export function CollectionsDiscoverPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopCollections(20)
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cardSpring}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-cyan">Collections</p>
        <h1 className="mt-3 font-jakarta text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
          Discover{' '}
          <span className="bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent">
            Collections
          </span>
        </h1>
        <p className="mt-3 max-w-xl font-inter text-[15px] text-text-muted">
          Curated reading lists from the ArticleX community.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] text-text-dim" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Updated live
        </div>
      </motion.div>

      <div className="mt-8">
        {loading ? (
          <SkeletonGrid />
        ) : collections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={cardSpring}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <FolderOpen className="h-14 w-14 text-text-dim" />
            <p className="mt-4 font-jakarta text-xl font-bold text-text-primary">No collections yet</p>
            <p className="mt-1 font-inter text-[14px] text-text-muted">
              Be the first to create one.
            </p>
            <Link
              to="/collections/new"
              data-cursor="pointer"
              className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-inter text-[14px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <Plus className="h-4 w-4" /> Create Collection
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {collections.map((c, i) => (
                <DiscoverCollectionCard key={c.id} collection={c} rank={i + 1} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CTA card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...cardSpring, delay: 0.2 }}
        className="mt-12 rounded-[28px] border p-8 text-center backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
          borderColor: 'rgba(124,58,237,0.3)',
        }}
      >
        <h2 className="font-jakarta text-2xl font-bold text-text-primary">
          Curate your favourite threads
        </h2>
        <p className="mx-auto mt-2 max-w-md font-inter text-[14px] text-text-muted">
          Create a locked, shareable collection of the best X articles and threads.
        </p>
        <Link
          to="/collections/new"
          data-cursor="pointer"
          className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-inter text-[14px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
        >
          Create Collection &rarr;
        </Link>
      </motion.div>
    </main>
  )
}
