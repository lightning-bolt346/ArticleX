import { motion, AnimatePresence } from 'framer-motion'
import { Clock3, FileText, Hash, Link2 } from 'lucide-react'
import { ExportButtons } from './ExportButtons'
import type { ArticleObject } from '../types/article'

interface ArticlePreviewProps {
  article: ArticleObject | null
}

export const ArticlePreview = ({ article }: ArticlePreviewProps) => {
  return (
    <AnimatePresence mode="wait">
      {article ? (
        <motion.article
          key={article.tweetId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-white/10 bg-bg-elevated/70 p-6 shadow-card backdrop-blur xl:p-8"
        >
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
              <Hash className="h-3.5 w-3.5" />
              {article.wordCount} words
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
              <Clock3 className="h-3.5 w-3.5" />
              {article.readingTime} min read
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
              <FileText className="h-3.5 w-3.5" />
              @{article.authorHandle}
            </span>
          </div>

          <h2 className="mt-5 font-jakarta text-2xl font-extrabold text-text-primary sm:text-3xl">
            {article.title ?? 'Untitled Post'}
          </h2>

          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 font-mono text-xs text-accent-cyan hover:text-accent-purple"
          >
            <Link2 className="h-3.5 w-3.5" />
            {article.url}
          </a>

          <div className="mt-6 space-y-4 text-left font-inter text-[15px] leading-7 text-text-primary/95">
            {article.body.split('\n').map((line, index) =>
              line.trim() ? <p key={`${article.tweetId}-${index}`}>{line}</p> : null,
            )}
          </div>

          <ExportButtons article={article} />
        </motion.article>
      ) : null}
    </AnimatePresence>
  )
}
