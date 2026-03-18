import { motion } from 'framer-motion'
import { Bug, Github, Mail, MessageSquare } from 'lucide-react'
import { PageShell } from '../components/PageShell'

const channels = [
  {
    icon: Mail,
    title: 'General contact',
    description: 'For partnerships, media, or product inquiries.',
    actionLabel: 'Email us',
    href: 'mailto:hello.articlex@gmail.com?subject=ArticleX%20Inquiry',
  },
  {
    icon: Github,
    title: 'Open source',
    description: 'Review code, follow progress, or contribute fixes.',
    actionLabel: 'Open GitHub',
    href: 'https://github.com/lightning-bolt346/ArticleX',
  },
  {
    icon: Bug,
    title: 'Report issues',
    description: 'Share reproducible bugs and UX pain points.',
    actionLabel: 'Report an issue',
    href: 'https://github.com/lightning-bolt346/ArticleX/issues',
  },
]

export function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Let’s improve ArticleX together."
      subtitle="The product gets better through user feedback. If something feels off or can be upgraded, we want to hear it."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <motion.article
            key={channel.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)' }}
          >
            <channel.icon className="h-5 w-5 text-accent-violet" />
            <h2 className="mt-3 font-jakarta text-lg font-bold text-text-primary">{channel.title}</h2>
            <p className="mt-2 font-inter text-sm leading-relaxed text-text-muted">{channel.description}</p>
            <a
              href={channel.href}
              target={channel.href.startsWith('http') ? '_blank' : undefined}
              rel={channel.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              data-cursor="pointer"
              className="mt-4 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
              style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            >
              {channel.actionLabel}
            </a>
          </motion.article>
        ))}
      </div>

      <article className="rounded-2xl border p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 h-5 w-5 text-accent-cyan" />
          <div>
            <h2 className="font-jakarta text-xl font-bold text-text-primary">Feedback that helps most</h2>
            <p className="mt-2 font-inter text-[15px] leading-relaxed text-text-muted">
              Include your device/browser, URL sample, and expected behavior. High-context reports let us ship higher-quality fixes faster.
            </p>
          </div>
        </div>
      </article>
    </PageShell>
  )
}
