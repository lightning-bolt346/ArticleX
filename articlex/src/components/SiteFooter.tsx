import { Github, Heart } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import brandMark from '../assets/articlex-mark.svg'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/collections', label: 'Collections' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
]

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-jakarta text-lg font-bold text-text-primary">
              <span className="inline-flex items-center gap-2">
                <img src={brandMark} alt="" className="h-4 w-4 opacity-80" />
                <span>
                  Article<span className="bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent">X</span>
                </span>
              </span>
            </p>
            <p className="mt-1 font-inter text-xs text-text-muted">
              Turn X posts into beautiful documents.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-cursor="pointer"
                className={({ isActive }) =>
                  `rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                    isActive ? 'text-accent-violet' : 'text-text-muted hover:text-text-primary'
                  }`
                }
                style={({ isActive }) => ({
                  background: 'var(--source-btn-bg)',
                  borderColor: isActive ? 'var(--accent-violet)' : 'var(--source-btn-border)',
                })}
              >
                {item.label}
              </NavLink>
            ))}
            <a
              href="https://github.com/lightning-bolt346/ArticleX"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="pointer"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
              style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </nav>
        </div>

        <div
          className="mt-6 flex flex-col items-center gap-2 border-t pt-6 text-center md:flex-row md:justify-between md:text-left"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="font-mono text-[10px] text-text-dim">
            Built with FixTweet API · No data collected · 100% client-side
          </p>
          <p className="font-mono text-[10px] text-text-dim">
            Made with <Heart className="inline h-3 w-3 text-red-400" /> · Free & open source
          </p>
        </div>
      </div>
    </footer>
  )
}
