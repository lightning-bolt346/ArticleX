import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import {
  articleToCollectionItem,
  createCollection,
  getCollection,
  type CollectionItem,
} from '../lib/collections'
import { loadArticleFromUrl } from '../lib/article-service'
import { COLLECTION_TAGS } from '../lib/tags'
import { useAuth } from '../hooks/useAuth'
import { extractTweetId } from '../lib/tweet'

const COLLECTION_ID_REGEX = /collections\/([a-zA-Z0-9_-]{4,10})/

const cardSpring = { type: 'spring' as const, stiffness: 100, damping: 20 }

export function CollectionCreatePage() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contactEmail, setContactEmail] = useState('')
  const [editable, setEditable] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [items, setItems] = useState<CollectionItem[]>([])
  const [articleUrl, setArticleUrl] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<string | null>(null)
  const [bulkMsg, setBulkMsg] = useState<string | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const urlInputRef = useRef<HTMLInputElement>(null)
  const nameError = name.length > 60 ? 'Max 60 characters' : null

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : prev.length < 5 ? [...prev, tagId] : prev,
    )
  }, [])

  const fetchArticle = useCallback(async (url: string) => {
    const tweetId = extractTweetId(url)
    if (!tweetId) throw new Error('Invalid URL')
    const { article } = await loadArticleFromUrl(url, { trackHistory: false })
    return article
  }, [])

  const handleAddArticle = useCallback(async () => {
    const url = articleUrl.trim()
    if (!url) return
    setAddError(null)
    setAddLoading(true)
    try {
      const tweetId = extractTweetId(url)
      if (!tweetId) { setAddError('Please paste a valid X/Twitter URL.'); return }
      if (items.some((i) => i.tweetId === tweetId)) { setAddError('Already added.'); return }
      if (items.length >= 50) { setAddError('Maximum 50 articles per collection.'); return }
      const article = await fetchArticle(url)
      setItems((prev) => [...prev, articleToCollectionItem(article)])
      setArticleUrl('')
      urlInputRef.current?.focus()
    } catch {
      setAddError('Failed to fetch article. Check the URL and try again.')
    } finally {
      setAddLoading(false)
    }
  }, [articleUrl, items, fetchArticle])

  const handleRemoveItem = useCallback((tweetId: string) => {
    setItems((prev) => prev.filter((i) => i.tweetId !== tweetId))
  }, [])

  const handleMoveItem = useCallback((index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const handleBulkAdd = useCallback(async () => {
    const text = bulkText.trim()
    if (!text) return
    const allMatches = text.match(/https?:\/\/(?:www\.)?(?:x\.com|twitter\.com|mobile\.x\.com)\/[^\s/]+\/(?:status|article)\/\d+/g)
    if (!allMatches || allMatches.length === 0) { setBulkMsg('No X/Twitter URLs found in the text.'); return }
    const seen = new Set<string>()
    const uniqueUrls: string[] = []
    for (const url of allMatches) {
      const id = extractTweetId(url)
      if (id && !seen.has(id)) { seen.add(id); uniqueUrls.push(url) }
    }
    const existingIds = new Set(items.map((i) => i.tweetId))
    const toFetch = uniqueUrls.filter((url) => { const id = extractTweetId(url); return id && !existingIds.has(id) })
    if (toFetch.length === 0) { setBulkMsg(`Found ${uniqueUrls.length} URL${uniqueUrls.length !== 1 ? 's' : ''}, but all are already added.`); return }
    const batch = toFetch.slice(0, 50 - items.length)
    setBulkLoading(true); setBulkMsg(null)
    let added = 0, failed = 0
    for (let i = 0; i < batch.length; i++) {
      setBulkProgress(`Processing ${i + 1}/${batch.length}...`)
      try {
        const article = await fetchArticle(batch[i])
        const item = articleToCollectionItem(article)
        setItems((prev) => prev.some((p) => p.tweetId === item.tweetId) ? prev : [...prev, item])
        added++
      } catch { failed++ }
    }
    const dupes = uniqueUrls.length - toFetch.length
    const parts: string[] = []
    if (added > 0) parts.push(`${added} added`)
    if (dupes > 0) parts.push(`${dupes} already existed`)
    if (failed > 0) parts.push(`${failed} failed`)
    setBulkMsg(`Found ${uniqueUrls.length} URL${uniqueUrls.length !== 1 ? 's' : ''}: ${parts.join(', ')}.`)
    setBulkProgress(null); setBulkLoading(false)
    if (added > 0) setBulkText('')
  }, [bulkText, items, fetchArticle])

  const handleImport = useCallback(async () => {
    const raw = importUrl.trim()
    if (!raw) return
    setImportLoading(true); setImportMsg(null)
    try {
      const idMatch = raw.match(COLLECTION_ID_REGEX)
      const id = idMatch?.[1] ?? raw
      const collection = await getCollection(id)
      if (!collection) { setImportMsg('Collection not found.'); return }
      const existingIds = new Set(items.map((i) => i.tweetId))
      const newItems = collection.items.filter((i) => !existingIds.has(i.tweetId))
      if (newItems.length === 0) { setImportMsg('All articles from that collection are already added.'); return }
      setItems((prev) => [...prev, ...newItems].slice(0, 50))
      setImportMsg(`Imported ${newItems.length} articles from "${collection.name}"`)
      setImportUrl('')
    } catch { setImportMsg('Failed to import collection.') }
    finally { setImportLoading(false) }
  }, [importUrl, items])

  const handleCreate = useCallback(async () => {
    if (!name.trim() || items.length === 0 || creating) return
    if (!isPublic && !isLoggedIn) return
    setCreating(true); setCreateError(null)
    try {
      const result = await createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        tags: selectedTags,
        contactEmail: contactEmail.trim() || undefined,
        editable: isLoggedIn ? editable : false,
        isPublic,
        userId: user?.id,
        items,
      })
      if ('error' in result) { setCreateError(result.error); return }
      setCreatedId(result.id)
    } catch { setCreateError('Something went wrong. Please try again.') }
    finally { setCreating(false) }
  }, [name, description, selectedTags, contactEmail, editable, isPublic, items, creating, isLoggedIn, user])

  const shareUrl = createdId ? `${window.location.origin}${window.location.pathname}#/collections/${createdId}` : ''
  const handleCopy = useCallback(() => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }, [shareUrl])

  const canCreate = name.trim().length > 0 && name.trim().length <= 60 && items.length > 0 && !creating && (isPublic || isLoggedIn)

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={cardSpring}>
        <Link
          to="/collections"
          data-cursor="pointer"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
          style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
        >
          <ArrowLeft className="h-3 w-3" /> Back to Collections
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-cyan">New Collection</p>
        <h1 className="mt-2 font-jakarta text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">
          Create <span className="bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent">Collection</span>
        </h1>
        <p className="mt-2 max-w-xl font-inter text-[15px] text-text-muted">
          Curate a reading list of X/Twitter articles.{' '}
          {!isLoggedIn && (
            <button type="button" data-cursor="pointer" onClick={() => setShowAuthModal(true)} className="text-accent-violet hover:underline">
              Sign in
            </button>
          )}
          {!isLoggedIn && ' for private & editable collections.'}
        </p>
      </motion.div>

      {/* Success state */}
      <AnimatePresence>
        {createdId && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 rounded-[28px] border p-6 text-center backdrop-blur-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
              <Check className="h-7 w-7 text-white" />
            </motion.div>
            <p className="mt-4 font-jakarta text-xl font-bold text-text-primary">Collection Created{!editable && ' & Locked'}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] text-text-dim">
              {editable ? <><Pencil className="h-3 w-3" /> Editable by you</> : <><Lock className="h-3 w-3" /> Read-only</>}
              {!isPublic && <> · <Lock className="h-3 w-3" /> Private</>}
            </p>
            <div className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-xl border p-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              <input readOnly value={shareUrl} className="flex-1 bg-transparent px-2 font-mono text-[12px] text-text-muted outline-none" onClick={(e) => (e.target as HTMLInputElement).select()} />
              <motion.button type="button" data-cursor="pointer" onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
            <motion.button type="button" data-cursor="pointer" onClick={() => navigate(`/collections/${createdId}`)} className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-inter text-[14px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              Go to Collection &rarr;
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {!createdId && (
        <>
          {/* Step 1: Info */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardSpring, delay: 0.05 }} className="mt-8 rounded-[28px] border p-6 backdrop-blur-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">Collection Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My favourite AI threads" maxLength={60} className="mt-2 w-full rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60" style={{ borderColor: 'var(--border-subtle)' }} />
            <div className="mt-1 flex items-center justify-between">
              {nameError && <p className="font-inter text-[12px] text-red-400">{nameError}</p>}
              <p className="ml-auto font-mono text-[11px] text-text-dim">{name.length}/60</p>
            </div>

            <label className="mt-5 block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">Description <span className="normal-case text-text-dim">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A collection of the best AI threads on X" maxLength={200} rows={2} className="mt-2 w-full resize-none rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60" style={{ borderColor: 'var(--border-subtle)' }} />
            <p className="mt-1 text-right font-mono text-[11px] text-text-dim">{description.length}/200</p>

            {/* Tags */}
            <label className="mt-5 block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">Tags <span className="normal-case text-text-dim">(up to 5)</span></label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COLLECTION_TAGS.map((tag) => {
                const active = selectedTags.includes(tag.id)
                return (
                  <motion.button key={tag.id} type="button" data-cursor="pointer" onClick={() => toggleTag(tag.id)}
                    className="rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors"
                    style={{ background: active ? `${tag.color}20` : 'var(--bg-elevated)', borderColor: active ? `${tag.color}50` : 'var(--border-subtle)', color: active ? tag.color : 'var(--text-dim)' }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    {tag.label}
                  </motion.button>
                )
              })}
            </div>

            {/* Contact email */}
            <label className="mt-5 block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> Contact Email</span>
              <span className="normal-case text-text-dim"> (optional — visible to viewers)</span>
            </label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60" style={{ borderColor: 'var(--border-subtle)' }} />
            <p className="mt-1 font-inter text-[11px] text-text-dim">So people can request additions to your collection.</p>

            {/* Visibility + Editable toggles */}
            <div className="mt-5 flex flex-wrap gap-3">
              <motion.button type="button" data-cursor="pointer" onClick={() => { if (!isLoggedIn && !isPublic) return; setIsPublic(!isPublic) }}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-inter text-[13px] transition-colors ${!isLoggedIn && !isPublic ? 'opacity-50' : ''}`}
                style={{ background: isPublic ? 'var(--bg-elevated)' : 'rgba(124,58,237,0.1)', borderColor: isPublic ? 'var(--border-subtle)' : 'rgba(124,58,237,0.3)', color: 'var(--text-primary)' }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {isPublic ? <Globe className="h-4 w-4 text-accent-cyan" /> : <Lock className="h-4 w-4 text-accent-violet" />}
                {isPublic ? 'Public' : 'Private'}
              </motion.button>

              {isLoggedIn ? (
                <motion.button type="button" data-cursor="pointer" onClick={() => setEditable(!editable)}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-inter text-[13px] transition-colors"
                  style={{ background: editable ? 'rgba(6,182,212,0.1)' : 'var(--bg-elevated)', borderColor: editable ? 'rgba(6,182,212,0.3)' : 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {editable ? <Pencil className="h-4 w-4 text-accent-cyan" /> : <Lock className="h-4 w-4 text-text-dim" />}
                  {editable ? 'Editable' : 'Locked after creation'}
                </motion.button>
              ) : (
                <button type="button" data-cursor="pointer" onClick={() => setShowAuthModal(true)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 font-inter text-[13px] text-text-dim" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <LogIn className="h-4 w-4" /> Sign in to edit later
                </button>
              )}
            </div>
            {!isPublic && !isLoggedIn && (
              <p className="mt-2 flex items-center gap-1.5 font-inter text-[12px] text-red-400">
                <AlertCircle className="h-3 w-3" /> Sign in to create private collections.
              </p>
            )}
          </motion.div>

          {/* Step 2: Add articles */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardSpring, delay: 0.1 }} className="mt-5 rounded-[28px] border p-6 backdrop-blur-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="flex items-center gap-3">
              <h2 className="font-jakarta text-lg font-bold text-text-primary">Add Articles</h2>
              {items.length > 0 && (
                <span className="rounded-full px-2 py-0.5 font-mono text-[10px] text-text-muted" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  {items.length} article{items.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input ref={urlInputRef} type="url" value={articleUrl} onChange={(e) => { setArticleUrl(e.target.value); setAddError(null) }} onKeyDown={(e) => { if (e.key === 'Enter') void handleAddArticle() }} placeholder="Paste an X/Twitter URL..." disabled={addLoading} className="flex-1 rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60 disabled:opacity-60" style={{ borderColor: 'var(--border-subtle)' }} />
              <motion.button type="button" data-cursor="pointer" onClick={() => void handleAddArticle()} disabled={addLoading || !articleUrl.trim()} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-3 font-inter text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={addLoading ? undefined : { scale: 1.03 }} whileTap={addLoading ? undefined : { scale: 0.97 }}>
                {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
              </motion.button>
            </div>
            <AnimatePresence>
              {addError && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 font-inter text-[12px] text-red-400"><AlertCircle className="h-3 w-3" /> {addError}</motion.p>}
            </AnimatePresence>

            <div className="mt-4 space-y-2">
              <AnimatePresence initial={false}>
                {items.map((item, index) => (
                  <motion.div key={item.tweetId} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={cardSpring} className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
                    {item.authorAvatar ? <img src={item.authorAvatar} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" /> : <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-jakarta text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>{item.authorName.charAt(0).toUpperCase()}</div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-inter text-[13px] font-semibold text-text-primary">{item.authorName}<span className="ml-1.5 font-mono text-[11px] font-normal text-text-dim">@{item.authorHandle}</span></p>
                      <p className="truncate font-inter text-[12px] text-text-muted">{item.title ?? item.snippet}</p>
                    </div>
                    {item.coverImage && <img src={item.coverImage} alt="" className="hidden h-10 w-[60px] flex-shrink-0 rounded-lg object-cover sm:block" />}
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button type="button" data-cursor="pointer" onClick={() => handleMoveItem(index, -1)} disabled={index === 0} className="rounded-md p-1 text-text-dim transition-colors hover:text-text-primary disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" data-cursor="pointer" onClick={() => handleMoveItem(index, 1)} disabled={index === items.length - 1} className="rounded-md p-1 text-text-dim transition-colors hover:text-text-primary disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" data-cursor="pointer" onClick={() => handleRemoveItem(item.tweetId)} className="rounded-md p-1 text-text-dim transition-colors hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {items.length === 0 && <p className="mt-4 text-center font-inter text-[13px] text-text-dim">No articles added yet. Paste a URL above to get started.</p>}
          </motion.div>

          {/* Bulk Add */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardSpring, delay: 0.12 }} className="mt-5 rounded-[28px] border p-6 backdrop-blur-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <motion.button type="button" data-cursor="pointer" onClick={() => setBulkOpen((p) => !p)} className="flex w-full items-center justify-between font-jakarta text-[15px] font-bold text-text-primary">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent-violet" /> Bulk add from text</span>
              {bulkOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
            </motion.button>
            <AnimatePresence>
              {bulkOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <p className="mt-3 font-inter text-[12px] text-text-dim">Paste any text containing X/Twitter links. All post URLs will be extracted and added automatically.</p>
                  <textarea value={bulkText} onChange={(e) => { setBulkText(e.target.value); setBulkMsg(null) }} placeholder={"Paste text with X links..."} rows={4} disabled={bulkLoading} className="mt-3 w-full resize-none rounded-xl border bg-bg-elevated px-4 py-3 font-mono text-[13px] text-text-primary outline-none transition-colors placeholder:font-inter placeholder:text-[13px] placeholder:text-text-dim focus:border-accent-violet/60 disabled:opacity-60" style={{ borderColor: 'var(--border-subtle)' }} />
                  <div className="mt-3 flex items-center gap-3">
                    <motion.button type="button" data-cursor="pointer" onClick={() => void handleBulkAdd()} disabled={bulkLoading || !bulkText.trim()} className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 font-inter text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={bulkLoading ? undefined : { scale: 1.03 }} whileTap={bulkLoading ? undefined : { scale: 0.97 }}>
                      {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Extract & Add All
                    </motion.button>
                    {bulkProgress && <span className="font-mono text-[11px] text-accent-cyan">{bulkProgress}</span>}
                  </div>
                  <AnimatePresence>{bulkMsg && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-2 font-inter text-[12px] ${bulkMsg.includes('added') ? 'text-emerald-400' : 'text-text-dim'}`}>{bulkMsg}</motion.p>}</AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Import (logged in only) */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardSpring, delay: 0.15 }} className="mt-5 rounded-[28px] border p-6 backdrop-blur-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            {isLoggedIn ? (
              <>
                <motion.button type="button" data-cursor="pointer" onClick={() => setImportOpen((p) => !p)} className="flex w-full items-center justify-between font-jakarta text-[15px] font-bold text-text-primary">
                  <span className="flex items-center gap-2"><LinkIcon className="h-4 w-4 text-accent-cyan" /> Import from existing collection</span>
                  {importOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                </motion.button>
                <AnimatePresence>
                  {importOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 flex gap-2">
                        <input type="text" value={importUrl} onChange={(e) => { setImportUrl(e.target.value); setImportMsg(null) }} onKeyDown={(e) => { if (e.key === 'Enter') void handleImport() }} placeholder="Collection link or ID..." disabled={importLoading} className="flex-1 rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60 disabled:opacity-60" style={{ borderColor: 'var(--border-subtle)' }} />
                        <motion.button type="button" data-cursor="pointer" onClick={() => void handleImport()} disabled={importLoading || !importUrl.trim()} className="rounded-xl px-5 py-3 font-inter text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={importLoading ? undefined : { scale: 1.03 }} whileTap={importLoading ? undefined : { scale: 0.97 }}>
                          {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
                        </motion.button>
                      </div>
                      {importMsg && <p className={`mt-2 font-inter text-[12px] ${importMsg.includes('Imported') ? 'text-emerald-400' : 'text-text-dim'}`}>{importMsg}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-jakarta text-[15px] font-bold text-text-dim"><LinkIcon className="h-4 w-4" /> Import from existing collection</span>
                <button type="button" data-cursor="pointer" onClick={() => setShowAuthModal(true)} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}>
                  <LogIn className="h-3 w-3" /> Sign in to unlock
                </button>
              </div>
            )}
          </motion.div>

          {/* Create button */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...cardSpring, delay: 0.2 }} className="mt-6">
            <AnimatePresence>{createError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-3 flex items-center gap-1.5 font-inter text-[12px] text-red-400"><AlertCircle className="h-3 w-3" /> {createError}</motion.p>}</AnimatePresence>
            <motion.button type="button" data-cursor="pointer" onClick={() => void handleCreate()} disabled={!canCreate} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-inter text-[15px] font-semibold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }} whileHover={canCreate ? { scale: 1.02, boxShadow: '0 0 40px rgba(124,58,237,0.3)' } : undefined} whileTap={canCreate ? { scale: 0.97 } : undefined}>
              {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating collection...</> : <><Lock className="h-4 w-4" /> Create{!editable && ' & Lock'} Collection &rarr;</>}
            </motion.button>
          </motion.div>
        </>
      )}

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={() => setShowAuthModal(false)} />
    </main>
  )
}
