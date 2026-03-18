import { motion } from 'framer-motion'
import { Download, Palette, Rocket, Settings2, Shield, Wand2 } from 'lucide-react'
import { PageShell } from '../components/PageShell'

const featureGroups = [
  {
    icon: Rocket,
    title: 'Fast conversion flow',
    points: [
      'Paste an X/Twitter URL and generate a readable document instantly.',
      'Recent conversion history for quick re-open and repeat exports.',
      'Optimized startup with on-demand loading for heavy exporters.',
    ],
  },
  {
    icon: Download,
    title: 'Multi-format exports',
    points: [
      'HTML, Markdown, DOCX, PDF, and HD image export options.',
      'Consistent typography and structure across generated formats.',
      'Designed for sharing, editing, archiving, and publishing.',
    ],
  },
  {
    icon: Palette,
    title: 'Premium reading themes',
    points: [
      'Six curated reading themes including adaptive Dynamic Dim mode.',
      'Preview-card and reader-mode settings for typography and spacing.',
      'Live theme previews inside settings to choose with confidence.',
    ],
  },
  {
    icon: Settings2,
    title: 'Reader controls',
    points: [
      'Fullscreen reading mode with smooth transitions.',
      'Reader-mode width and alignment tuning for personal comfort.',
      'Font and line-height controls for long-session readability.',
    ],
  },
  {
    icon: Shield,
    title: 'Privacy + trust',
    points: [
      'No account required to start using ArticleX.',
      'Client-side architecture by design, with minimal data surface.',
      'Clear messaging when payment gateways are unavailable.',
    ],
  },
  {
    icon: Wand2,
    title: 'Design system quality',
    points: [
      'Unified visual language across pages and reader surfaces.',
      'Responsive behavior tuned for desktop, tablet, and mobile.',
      'Micro-interactions that feel modern yet unobtrusive.',
    ],
  },
]

export function FeaturesPage() {
  return (
    <PageShell
      eyebrow="Features"
      title="Everything you need to turn posts into polished documents."
      subtitle="ArticleX combines conversion speed with editorial-grade reading and export quality."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {featureGroups.map((group) => (
          <motion.article
            key={group.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border p-5"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border" style={{ borderColor: 'var(--source-btn-border)', background: 'var(--source-btn-bg)' }}>
              <group.icon className="h-4.5 w-4.5 text-accent-violet" />
            </div>
            <h2 className="mt-3 font-jakarta text-lg font-bold text-text-primary">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              {group.points.map((point) => (
                <li key={point} className="leading-relaxed">
                  • {point}
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </PageShell>
  )
}
