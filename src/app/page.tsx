// Landing page — Server Component
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/* SVG logo riutilizzabile per navbar, sidebar mock e footer */
const Logo = ({ className = 'h-6 w-6' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect width="32" height="32" rx="6" fill="#25343F" />
    <path d="M16 4 L28 16 L16 28 L4 16 Z" fill="#FF9B51" />
  </svg>
)

const FEATURES = [
  {
    eyebrow: 'AI-Powered',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
      </svg>
    ),
    title: 'Smart Briefs',
    description: 'Instant summaries, duplicate detection, and draft responses. AI does the heavy lifting — humans make the calls.',
  },
  {
    eyebrow: 'Zero Risk',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: 'Safe Proposals',
    description: 'Volunteers suggest labels and comments. No push access needed — maintainers stay in full control.',
  },
  {
    eyebrow: 'One Click',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: 'Instant Apply',
    description: 'Review proposals in your inbox. One click to label, comment, or close — your backlog becomes a decision queue.',
  },
]

const STEPS = [
  { num: '01', title: 'Connect', desc: 'Link any GitHub repository and invite your community.', role: 'Maintainer' },
  { num: '02', title: 'Triage', desc: 'Volunteers generate AI briefs and propose actions on open issues.', role: 'Volunteer' },
  { num: '03', title: 'Apply', desc: 'Maintainers review proposals and apply them to GitHub instantly.', role: 'Maintainer' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <Logo className="h-6 w-6" />
            Triage Relay
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-3xl px-6 pt-32 pb-24 text-center">
        {/* Glow doppio strato — amplificato per impatto visivo */}
        <div className="pointer-events-none absolute inset-0 -top-20 flex items-center justify-center">
          <div className="h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />
        </div>

        <div className="relative">
          {/* Badge — animazione staggered 1 */}
          <div className="hero-animate hero-delay-1 mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Built for the DEV Weekend Challenge
          </div>

          {/* Titolo — animazione staggered 2 */}
          <h1 className="hero-animate hero-delay-2 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Triage is a{' '}
            <span className="bg-gradient-to-r from-primary to-[#ffb980] bg-clip-text text-transparent">
              team sport
            </span>
          </h1>

          {/* Paragrafo — animazione staggered 3 */}
          <p className="hero-animate hero-delay-3 mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Help open-source maintainers manage their backlog — without needing push access.
          </p>

          {/* CTA — animazione staggered 4 */}
          <div className="hero-animate hero-delay-4 mt-8 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover px-8 text-base shadow-lg shadow-primary/20">
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

      {/* Mock UI — Mostra l'interfaccia ai giudici */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 shadow-2xl shadow-black/20">
          {/* Barra titolo mock */}
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
            </div>
            <span className="ml-2 text-[10px] text-muted-foreground/50">triage-relay.vercel.app</span>
          </div>

          {/* Contenuto mock — 3 colonne */}
          <div className="grid lg:grid-cols-[200px_1fr_280px] gap-0">
            {/* Sidebar mock */}
            <div className="hidden lg:block border-r border-border/30 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                <Logo className="h-4 w-4" />
                facebook/react
              </div>
              <div className="rounded bg-primary/10 px-2.5 py-1.5 text-[10px] text-primary font-medium">Issues</div>
              <div className="rounded px-2.5 py-1.5 text-[10px] text-muted-foreground/60">Proposals <span className="ml-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary/80 px-1 text-[8px] text-primary-foreground font-bold">3</span></div>
              <div className="mt-4 border-t border-border/20 pt-3">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded bg-background/50 p-1.5 text-center">
                    <div className="text-sm font-bold text-foreground/80">47</div>
                    <div className="text-[8px] text-muted-foreground/50">Issues</div>
                  </div>
                  <div className="rounded bg-background/50 p-1.5 text-center">
                    <div className="text-sm font-bold text-primary">12</div>
                    <div className="text-[8px] text-muted-foreground/50">Applied</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues mock */}
            <div className="p-4 space-y-2 border-r border-border/30">
              <div className="text-xs font-semibold text-foreground/70 mb-3">Issue Backlog</div>
              {[
                { n: 28431, title: 'useEffect fires twice in StrictMode with async setup', labels: ['bug', 'needs-info'], comments: 23 },
                { n: 28429, title: 'Add support for CSS container queries in styled-jsx', labels: ['enhancement'], comments: 8 },
                { n: 28427, title: 'Memory leak in concurrent rendering mode', labels: ['bug', 'performance'], comments: 15 },
              ].map((issue) => (
                <div key={issue.n} className={`rounded-lg border p-3 text-left transition-all ${
                  issue.n === 28431 ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-background/30'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-primary/70">#{issue.n}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-foreground/80 line-clamp-1">{issue.title}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {issue.labels.map((l) => (
                      <span key={l} className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[8px] text-muted-foreground/60">{l}</span>
                    ))}
                    <span className="ml-auto text-[8px] text-muted-foreground/40">{issue.comments} comments</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Brief mock */}
            <div className="hidden lg:block p-4 space-y-3">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-primary">AI Brief</span>
                  <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[8px] font-bold text-primary">HIGH</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                  User reports useEffect cleanup not running correctly with async operations in StrictMode.
                  Likely related to #28401 (double invocation).
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="text-[9px] font-semibold uppercase text-muted-foreground/50">Suggested Labels</div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] text-primary font-medium">bug</span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] text-primary font-medium">needs-info</span>
                </div>
              </div>

              <div className="rounded-lg bg-background/50 border border-border/30 p-2.5">
                <div className="text-[9px] font-semibold text-muted-foreground/50 mb-1">Draft Comment</div>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                  Thanks for reporting! Could you share a minimal reproduction...
                </p>
              </div>

              <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-center">
                <span className="text-[10px] font-semibold text-primary">Submit Proposal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signal — numeri di social proof */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">500+</div>
            <div className="text-xs text-muted-foreground">Issues per repo</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">&lt;2s</div>
            <div className="text-xs text-muted-foreground">AI brief generation</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">100%</div>
            <div className="text-xs text-muted-foreground">Maintainer control</div>
          </div>
        </div>
      </div>

      {/* Pannello principale — Features + How it works con angoli invertiti */}
      <div className="inv-section">
        <div className="inv-inner py-16">
          {/* Features */}
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border/50 bg-background/30 p-6 transition-all hover:border-primary/30 hover:bg-background/50"
                >
                  {/* Eyebrow label sopra la card */}
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary/60">{f.eyebrow}</p>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {f.icon}
                  </div>
                  <h2 className="mb-2 font-semibold">{f.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Separatore */}
          <div className="mx-auto my-14 max-w-5xl px-6">
            <div className="border-t border-border/30" />
          </div>

          {/* How it works */}
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-12 text-center text-2xl font-bold">How it works</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.num} className="relative text-center">
                  {/* Linea connettrice */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-6 left-[calc(50%+28px)] hidden h-px w-[calc(100%-56px)] bg-gradient-to-r from-primary/30 to-primary/10 sm:block" />
                  )}
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                    {step.num}
                  </div>
                  <h3 className="mb-1 font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                  {/* Badge ruolo sotto ogni step */}
                  <span className="mt-2 inline-block rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                    {step.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Built with</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground/60">
            <span>Next.js 16</span>
            <span className="text-border">·</span>
            <span>Supabase</span>
            <span className="text-border">·</span>
            <span>Groq AI</span>
            <span className="text-border">·</span>
            <span>Tailwind CSS 4</span>
            <span className="text-border">·</span>
            <span>shadcn/ui</span>
            <span className="text-border">·</span>
            <span>TypeScript</span>
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="pt-4 pb-20 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-bold">Ready to lighten the load?</h2>
          <p className="mt-3 text-muted-foreground">
            Your community wants to help. Give them a safe way to do it.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary-hover px-8 shadow-lg shadow-primary/20">
              Get started — it&apos;s free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer migliorato con navigazione e logo */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Logo e nome nel footer */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <Logo className="h-5 w-5" />
              Triage Relay
            </div>
            {/* Link al DEV Weekend Challenge e GitHub — mantenuti */}
            <div className="text-xs text-muted-foreground">
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
          </div>
        </div>
      </footer>
    </div>
  )
}
