import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PageShellProps {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
}

export function PageShell({ eyebrow, title, subtitle, children }: PageShellProps) {
  return (
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-24 pb-16">
      <section className="rounded-3xl border p-6 md:p-10" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-cyan">{eyebrow}</p>
        <h1 className="mt-3 font-jakarta text-3xl font-extrabold leading-tight text-text-primary md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl font-inter text-[15px] leading-relaxed text-text-muted md:text-base">{subtitle}</p>
        <div className="mt-5">
          <Link
            to="/"
            data-cursor="pointer"
            className="inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
            style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
          >
            ← Back to Home
          </Link>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {children}
      </section>
    </main>
  )
}
