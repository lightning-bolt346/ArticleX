import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import { PageShell } from '../components/PageShell'

const faqs = [
  {
    q: 'Do I need an account to use ArticleX?',
    a: 'No. ArticleX is designed for instant, no-login usage.',
  },
  {
    q: 'Is my data stored on your servers?',
    a: 'The app is browser-first and client-side focused. Conversions happen locally with minimal external dependencies.',
  },
  {
    q: 'Which formats can I export?',
    a: 'You can export to HTML, Markdown, DOCX, PDF, and HD image.',
  },
  {
    q: 'What is reading mode?',
    a: 'Reading mode provides a focused fullscreen article surface with theme, typography, and layout controls.',
  },
  {
    q: 'How can I support the project?',
    a: 'Use the support button inside the preview flow. When payments are unavailable, ArticleX switches to gratitude mode.',
  },
]

export function FaqPage() {
  return (
    <PageShell
      eyebrow="FAQ"
      title="Questions users ask most often."
      subtitle="Clear answers for workflow, privacy, exports, and product behavior."
    >
      <div className="space-y-3">
        {faqs.map((item) => (
          <motion.article
            key={item.q}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="flex items-start gap-2">
              <HelpCircle className="mt-0.5 h-4.5 w-4.5 text-accent-violet" />
              <h2 className="font-jakarta text-base font-bold text-text-primary">{item.q}</h2>
            </div>
            <p className="mt-2 font-inter text-sm leading-relaxed text-text-muted">{item.a}</p>
          </motion.article>
        ))}
      </div>
    </PageShell>
  )
}
