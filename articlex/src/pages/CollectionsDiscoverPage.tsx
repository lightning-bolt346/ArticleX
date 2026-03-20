import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Eye,
  FolderOpen,
  LogIn,
  LogOut,
  Plus,
  Search,
  Tag,
  User,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { getTopCollections, getUserCollections, type Collection } from '../lib/collections'
import { COLLECTION_TAGS, getTagsByIds } from '../lib/tags'
import { useAuth } from '../hooks/useAuth'

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
  const tags = getTagsByIds(collection.tags)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...cardSpring, delay: index * 0.04 }}
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

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 font-mono text-[9px]"
              style={{
                background: `${tag.color}18`,
                color: tag.color,
                border: `1px solid ${tag.color}30`,
              }}
            >
              {tag.label}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="rounded-full px-2 py-0.5 font-mono text-[9px] text-text-dim" style={{ background: 'var(--bg-elevated)' }}>
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-text-dim">
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
  const { user, isLoggedIn, logout } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [myCollections, setMyCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [showAuthModal, setShowAuthModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getTopCollections(50)
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    getUserCollections(user.id).then(setMyCollections).catch(() => setMyCollections([]))
  }, [user])

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    let result = collections
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false),
      )
    }
    if (selectedTags.size > 0) {
      result = result.filter((c) =>
        c.tags.some((t) => selectedTags.has(t)),
      )
    }
    return result
  }, [collections, searchQuery, selectedTags])

  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={cardSpring}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to="/"
              data-cursor="pointer"
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
              style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            >
              <ArrowLeft className="h-3 w-3" /> Back to Home
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-cyan">Collections</p>
            <h1 className="mt-2 font-jakarta text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
              Discover{' '}
              <span className="bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent">
                Collections
              </span>
            </h1>
            <p className="mt-2 max-w-xl font-inter text-[15px] text-text-muted">
              Curated reading lists from the ArticleX community.
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 pt-8">
            {isLoggedIn ? (
              <>
                <span className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted sm:inline-flex" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <User className="h-3 w-3" /> {user?.displayName}
                </span>
                <motion.button
                  type="button"
                  data-cursor="pointer"
                  onClick={() => void logout()}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
                  style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <LogOut className="h-3 w-3" /> Logout
                </motion.button>
              </>
            ) : (
              <motion.button
                type="button"
                data-cursor="pointer"
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
                style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogIn className="h-3 w-3" /> Sign In
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Create Collection CTA — always on top */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...cardSpring, delay: 0.05 }}
        className="mt-8 rounded-[28px] border p-6 backdrop-blur-xl md:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))',
          borderColor: 'rgba(124,58,237,0.25)',
        }}
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-jakarta text-xl font-bold text-text-primary">
              Create your own collection
            </h2>
            <p className="mt-1 max-w-md font-inter text-[13px] text-text-muted">
              Curate a shareable reading list of the best X articles and threads.
              {!isLoggedIn && ' Sign in to create private or editable collections.'}
            </p>
          </div>
          <Link
            to="/collections/new"
            data-cursor="pointer"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full px-6 py-2.5 font-inter text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            <Plus className="h-4 w-4" /> Create Collection
          </Link>
        </div>
      </motion.div>

      {/* My Collections (logged in only) */}
      <AnimatePresence>
        {isLoggedIn && myCollections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ ...cardSpring, delay: 0.08 }}
            className="mt-8"
          >
            <h2 className="flex items-center gap-2 font-jakarta text-lg font-bold text-text-primary">
              <User className="h-4 w-4 text-accent-violet" /> My Collections
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myCollections.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...cardSpring, delay: i * 0.04 }}
                  data-cursor="pointer"
                  onClick={() => navigate(`/collections/${c.id}`)}
                  className="rounded-[20px] border p-4 backdrop-blur-xl"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(124,58,237,0.4)' }}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-jakarta text-[15px] font-bold text-text-primary">{c.name}</h3>
                    {!c.isPublic && (
                      <span className="flex-shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] text-text-dim" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                        Private
                      </span>
                    )}
                    {c.editable && (
                      <span className="flex-shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] text-accent-cyan" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                        Editable
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-text-dim">
                    {c.viewCount} views
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Tag Filters */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...cardSpring, delay: 0.1 }}
        className="mt-8 space-y-4"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-jakarta text-lg font-bold text-text-primary">Browse</h2>
          <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] text-text-dim" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Updated live
          </div>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          <Search className="h-4 w-4 flex-shrink-0 text-text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections by name..."
            className="w-full bg-transparent font-inter text-[14px] text-text-primary outline-none placeholder:text-text-dim"
          />
          {searchQuery && (
            <button
              type="button"
              data-cursor="pointer"
              onClick={() => setSearchQuery('')}
              className="text-text-dim hover:text-text-primary"
            >
              <span className="font-mono text-[11px]">Clear</span>
            </button>
          )}
        </div>

        {/* Tag filters */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim">
            <Tag className="h-3 w-3" /> Filter by topic
          </p>
          <div className="flex flex-wrap gap-1.5">
            {COLLECTION_TAGS.map((tag) => {
              const active = selectedTags.has(tag.id)
              return (
                <motion.button
                  key={tag.id}
                  type="button"
                  data-cursor="pointer"
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors"
                  style={{
                    background: active ? `${tag.color}20` : 'var(--bg-elevated)',
                    borderColor: active ? `${tag.color}50` : 'var(--border-subtle)',
                    color: active ? tag.color : 'var(--text-dim)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag.label}
                </motion.button>
              )
            })}
            {selectedTags.size > 0 && (
              <button
                type="button"
                data-cursor="pointer"
                onClick={() => setSelectedTags(new Set())}
                className="rounded-full px-2.5 py-1 font-mono text-[10px] text-red-400 transition-colors hover:text-red-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Collections Grid */}
      <div className="mt-6">
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={cardSpring}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <FolderOpen className="h-14 w-14 text-text-dim" />
            <p className="mt-4 font-jakarta text-xl font-bold text-text-primary">
              {searchQuery || selectedTags.size > 0 ? 'No matching collections' : 'No collections yet'}
            </p>
            <p className="mt-1 font-inter text-[14px] text-text-muted">
              {searchQuery || selectedTags.size > 0
                ? 'Try different search terms or filters.'
                : 'Be the first to create one.'}
            </p>
            {!searchQuery && selectedTags.size === 0 && (
              <Link
                to="/collections/new"
                data-cursor="pointer"
                className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-inter text-[14px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              >
                <Plus className="h-4 w-4" /> Create Collection
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <DiscoverCollectionCard key={c.id} collection={c} rank={i + 1} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={() => setShowAuthModal(false)}
      />
    </main>
  )
}
