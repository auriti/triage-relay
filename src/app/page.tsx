// Landing page — Server Component
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
    title: 'AI-Powered Briefs',
    description: 'Instant summaries, duplicate detection, and draft responses. AI does the heavy lifting — humans make the calls.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: 'Zero-Risk Proposals',
    description: 'Volunteers suggest labels and comments. No push access needed — maintainers stay in full control.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: 'One-Click Apply',
    description: 'Review proposals in your inbox. One click to label, comment, or close — your backlog becomes a decision queue.',
  },
]

const STEPS = [
  { num: '01', title: 'Connect', desc: 'Link any GitHub repository and invite your community.' },
  { num: '02', title: 'Triage', desc: 'Volunteers generate AI briefs and propose actions on open issues.' },
  { num: '03', title: 'Apply', desc: 'Maintainers review proposals and apply them to GitHub instantly.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="flex items-center gap-2 font-bold tracking-tight">
            <span className="text-primary text-lg">&#9670;</span>
            Triage Relay
          </span>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-3xl px-6 pt-32 pb-20 text-center">
        {/* Glow dietro il testo */}
        <div className="pointer-events-none absolute inset-0 -top-20 flex items-center justify-center">
          <div className="h-64 w-64 rounded-full bg-primary/8 blur-[100px]" />
        </div>

        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Built for the DEV Weekend Challenge
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Triage is a{' '}
            <span className="bg-gradient-to-r from-primary to-[#ffb980] bg-clip-text text-transparent">
              team sport
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Help open-source maintainers manage their backlog — without needing push access.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-orange-600 px-8 text-base shadow-lg shadow-primary/20">
                Start triaging
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </Link>
            <a href="https://github.com/auriti/triage-relay" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="border-border text-muted-foreground">
                View source
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border bg-card/50 p-6 transition-all hover:border-primary/30 hover:bg-card"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — con transizione sottile */}
      <section className="relative border-t border-border bg-card/30 py-20 section-notch">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold">How it works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                  {step.num}
                </div>
                <h3 className="mb-1 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-bold">Ready to lighten the load?</h2>
          <p className="mt-3 text-muted-foreground">
            Your community wants to help. Give them a safe way to do it.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-orange-600 px-8 shadow-lg shadow-primary/20">
              Get started — it&apos;s free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-6 text-center text-xs text-muted-foreground">
          Built for the{' '}
          <a
            href="https://dev.to/devteam/happening-now-dev-weekend-challenge-submissions-due-march-2-at-759am-utc-5fg8"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DEV Weekend Challenge
          </a>
          {' '}· Open source on{' '}
          <a
            href="https://github.com/auriti/triage-relay"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
