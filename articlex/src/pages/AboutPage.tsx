import { motion } from 'framer-motion'
import { Eye, ShieldCheck, Sparkles } from 'lucide-react'
import { PageShell } from '../components/PageShell'

const principles = [
  {
    icon: Eye,
    title: 'Reader-first by design',
    description:
      'ArticleX was created to make social content easier to read, save, and revisit. The interface stays calm so the content remains the hero.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy as default',
    description:
      'No login is required. The experience is browser-first and client-side so users can convert content quickly without handing over personal data.',
  },
  {
    icon: Sparkles,
    title: 'Premium output quality',
    description:
      'From Markdown to DOCX and PDF, each export is crafted to be clean and publication-ready with strong typography and visual hierarchy.',
  },
]

export function AboutPage() {
  return (
    <PageShell
      eyebrow="About ArticleX"
      title="A focused document experience for modern readers."
      subtitle="ArticleX transforms posts and long-form threads into elegant reading documents, built with speed, privacy, and design quality in mind."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {principles.map((item) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-subtle)' }}
          >
            <item.icon className="h-5 w-5 text-accent-violet" />
            <h2 className="mt-3 font-jakarta text-lg font-bold text-text-primary">{item.title}</h2>
            <p className="mt-2 font-inter text-sm leading-relaxed text-text-muted">{item.description}</p>
          </motion.article>
        ))}
      </div>

      <article className="rounded-2xl border p-6" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <h2 className="font-jakarta text-xl font-bold text-text-primary">Our brand promise</h2>
        <p className="mt-3 font-inter text-[15px] leading-relaxed text-text-muted">
          Every feature in ArticleX exists for one reason: helping people convert noise into clarity.
          We care about readability, performance, and trust — and we keep improving the product as a tool
          professionals can rely on daily.
        </p>
      </article>
    </PageShell>
  )
}
