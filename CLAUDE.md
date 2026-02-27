# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Progetto

**Triage Relay** — Web app per la [DEV Weekend Challenge](https://dev.to/devteam/happening-now-dev-weekend-challenge-submissions-due-march-2-at-759am-utc-5fg8?bb=261757) (deadline: **2 marzo 2026, 07:59 UTC**). Trasforma la triage delle issue GitHub in lavoro collaborativo: i volontari (triager) analizzano issue, generano briefing AI e propongono azioni; i maintainer approvano e applicano con un click. Pattern: proposta → approvazione → applicazione.

La specifica completa è in `TRIAGE-RELAY.md` — leggila PRIMA di scrivere codice.

### Challenge DEV Weekend

- **Tema:** "Build an app that serves a community you're a part of or care about"
- **Submission:** post su DEV con template ufficiale, demo funzionante (video o link), codice sorgente, tech stack
- **Giudizio su:** Value Proposition, Creativity, Technical Execution, Writing Quality
- **Premio:** $300 USD + badge + DEV++ membership (3 vincitori)

## Stack (ULTIME VERSIONI STABILI — non modificare lo stack)

| Layer | Tecnologia | Versione |
|-------|-----------|----------|
| **Framework** | Next.js (App Router) + React | **16.x** (React 19.2) |
| **Linguaggio** | TypeScript | strict |
| **Styling** | Tailwind CSS | **v4.2** |
| **UI Components** | shadcn/ui | **shadcn@3.5.0** |
| **Database/Auth** | Supabase (Postgres + Auth GitHub OAuth) | `@supabase/supabase-js@latest` + `@supabase/ssr` |
| **AI** | Groq API (Llama 3.3 70B) | `groq-sdk@latest` |
| **GitHub API** | Octokit REST | `@octokit/rest@latest` |
| **Deploy** | Vercel (free tier) | — |
| **Package Manager** | pnpm | — |

### Breaking changes rispetto a Next.js 14 (CRITICO)

- **Route handler params sono Promise** — usare `await segmentData.params` (non accesso diretto)
- **Tailwind CSS v4 NON usa `tailwind.config.ts`** — i colori custom si definiscono con `@theme` in CSS:

```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-background: #0a0a0a;
  --color-foreground: #fafafa;
  --color-card: #141414;
  --color-card-hover: #1a1a1a;
  --color-border: #262626;
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-secondary: #6366f1;
  --color-destructive: #ef4444;
  --color-warning: #f59e0b;
  --color-muted: #737373;
  --color-muted-foreground: #a3a3a3;
}
```

- **Groq supporta `json_schema`** (più stretto di `json_object`) — usare `response_format: { type: "json_schema", json_schema: { ... } }` con `strict: true` per output garantito

## Comandi

```bash
pnpm create next-app@latest triage-relay --typescript --tailwind --app --src-dir --import-alias "@/*"
pnpm install                    # Installa dipendenze
pnpm dev                        # Dev server (localhost:3000)
pnpm build                      # Build produzione (verifica prima del deploy)
pnpm dlx shadcn@latest init     # Inizializza shadcn/ui
pnpm dlx shadcn@latest add <c>  # Aggiungi componente shadcn/ui
```

## Architettura

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Login GitHub OAuth
│   ├── auth/callback/route.ts  # OAuth callback (cattura provider_token → cookie httpOnly)
│   ├── dashboard/page.tsx      # Lista rooms dell'utente
│   ├── room/[id]/
│   │   ├── page.tsx            # Backlog issue + pannello triage
│   │   └── proposals/page.tsx  # Inbox proposte (solo maintainer)
│   └── api/
│       ├── github/issues/route.ts   # Fetch & cache issue da GitHub
│       ├── github/apply/route.ts    # Applica label/commento su GitHub (solo maintainer)
│       └── triage-brief/route.ts    # Genera AI brief via Groq
├── components/
│   ├── ui/                     # shadcn/ui (non modificare direttamente)
│   ├── rooms/                  # RoomCard, CreateRoomDialog, JoinRoomDialog
│   ├── issues/                 # IssueList, IssueCard, IssueFilters
│   ├── triage/                 # TriagePanel, AIBriefCard, ProposalForm
│   └── proposals/              # ProposalList, ProposalCard, ProposalActions
├── lib/
│   ├── supabase/client.ts      # Browser client (@supabase/ssr createBrowserClient)
│   ├── supabase/server.ts      # Server client (API routes, createServerClient)
│   ├── supabase/middleware.ts   # Refresh sessione
│   ├── github.ts               # Helper Octokit (fetchIssues, addLabel, addComment)
│   ├── groq.ts                 # Helper Groq (generateTriageBrief)
│   └── utils.ts
├── types/
│   ├── database.ts             # Tipi Supabase (rooms, room_members, issues_cache, proposals)
│   ├── github.ts               # Tipi GitHub API
│   └── triage.ts               # Tipi brief AI e proposte
└── middleware.ts                # Auth check: redirect a /login se non autenticato
```

## Flusso dati principale

1. Login GitHub via Supabase Auth → sessione + `provider_token`
2. `provider_token` catturato nel callback e salvato in cookie httpOnly `gh_token` (Supabase NON lo persiste dopo il primo login)
3. API routes leggono `gh_token` dal cookie per chiamare GitHub API
4. Issue fetchate e cachate in `issues_cache` (non ri-fetchare se `last_synced_at` < 5 min)
5. Triager genera brief AI (Groq) → crea proposta → salvata in `proposals`
6. Maintainer approva → API route applica label/commento su GitHub

## Database (Supabase Postgres)

4 tabelle con RLS attiva: `rooms`, `room_members`, `issues_cache`, `proposals`. Schema SQL completo nella sezione 4 di `TRIAGE-RELAY.md`.

- **rooms:** una room = un repo GitHub. Campo `labels` (JSONB) con le label disponibili per la triage
- **room_members:** ruoli `maintainer` | `triager`. Il creatore della room è auto-join come maintainer
- **proposals:** tipi `label` | `comment` | `duplicate` | `needs_info`, stati `pending` | `approved` | `rejected` | `applied`

## Convenzioni critiche

- **provider_token:** va catturato nel callback OAuth e salvato in cookie httpOnly — non è disponibile dopo
- **GitHub API:** filtrare via PR dall'endpoint issues (`!issue.pull_request`). Rate limit: 5000 req/h con token
- **Groq:** se down, mostrare "AI unavailable" e permettere triage manuale. Free tier: 30 req/min, 14.400 req/giorno
- **API routes pattern:** try/catch, errori strutturati `{ error: string }`, status codes appropriati (429 per rate limit)
- **Nessun ORM** — solo Supabase client diretto
- **Nessun test** — è un hackathon weekend
- **Nessun real-time/websocket** — polling manuale
- **Nessun i18n** — tutto in inglese (UI copy in `TRIAGE-RELAY.md` sezione 15)
- **Dark theme only** — palette `#EAEFEF · #BFC9D1 · #25343F · #FF9B51`, sfondo `#1b2831`, accenti orange-500 (`#FF9B51`), densità informativa alta
- **Next.js 16:** `params` nei route handlers dinamici vanno awaited (`const params = await segmentData.params`)

## Ordine di implementazione

Segui rigorosamente le 7 fasi nella sezione 9 di `TRIAGE-RELAY.md`: Setup/Auth → Database/Room → Issue Fetch → AI Brief → Proposte → Approve & Apply → Polish/Deploy. Ogni fase ha un checkpoint di test.

## Env variables

```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
```

Il token GitHub viene dal `provider_token` di Supabase Auth (scope `repo`), non da env var separate.
