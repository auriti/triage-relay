# TRIAGE RELAY — Specifica Completa per Claude Code

## ⚠️ ISTRUZIONI PER CLAUDE CODE

Questo documento è la specifica completa del progetto **Triage Relay**, una web app per la DEV Weekend Challenge (deadline: 2 marzo 2026, 08:59 CET). Leggilo TUTTO prima di scrivere una sola riga di codice. Ogni decisione architetturale è stata presa per massimizzare qualità in tempi ridotti. NON cambiare stack, NON aggiungere feature non elencate, NON over-engineerare. L'obiettivo è un MVP di alta qualità, deployabile su Vercel, che funzioni end-to-end.

---

## 1. PANORAMICA PROGETTO

### Cos'è Triage Relay

Una web app che trasforma la triage delle issue GitHub in un lavoro di community collaborativo e sicuro. I **volontari (triager)** analizzano le issue, generano briefing AI e propongono azioni (label, commenti, segnalazione duplicati). I **maintainer** approvano e applicano le proposte con un click. Nessun permesso pericoloso viene concesso ai volontari.

### Perché esiste

- I maintainer open-source sono sommersi da issue e PR (molte di bassa qualità / AI-generated)
- Progetti famosi stanno chiudendo le PR esterne e i bug bounty (es. cURL)
- Dare permessi push/triage a sconosciuti è rischioso e socialmente irreversibile
- Triage Relay risolve questo con un pattern "proposta → approvazione → applicazione"

### Target users

1. **Maintainer** di progetti open-source piccoli/medi (1-5 persone)
2. **Triage volunteers** che vogliono contribuire all'open source senza scrivere codice

---

## 2. STACK TECNOLOGICO (NON MODIFICARE)

| Layer | Tecnologia | Motivo |
|-------|-----------|--------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, deploy Vercel nativo |
| **Linguaggio** | TypeScript | Type safety, DX |
| **Styling** | Tailwind CSS | Velocità di sviluppo |
| **UI Components** | shadcn/ui | Componenti accessibili e professionali |
| **Database** | Supabase (Postgres + Auth) | Free tier, Auth GitHub integrata, RLS |
| **AI** | Groq API (Llama 3.3 70B) | Gratuito, velocissimo, API OpenAI-compatibile |
| **GitHub API** | Octokit (REST) | Fetch issue, apply labels/comments |
| **Deploy** | Vercel (free tier) | Zero config per Next.js |
| **Package Manager** | pnpm | Veloce e affidabile |

### Credenziali e API necessarie (da configurare in `.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Groq
GROQ_API_KEY=gsk_...

# GitHub OAuth (configurato via Supabase Auth)
# Non serve variabile separata: il token GitHub viene dal provider_token di Supabase Auth
```

---

## 3. ARCHITETTURA

```
┌─────────────────────────────────────────────────┐
│                    FRONTEND                      │
│              Next.js App Router                  │
│                                                  │
│  /              → Landing page                   │
│  /login         → GitHub OAuth (Supabase Auth)   │
│  /dashboard     → Lista rooms del user           │
│  /room/[id]     → Backlog issue + triage         │
│  /room/[id]/proposals → Inbox proposte (maint.)  │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐       ┌─────▼──────┐
    │Supabase │       │ API Routes │
    │  Auth   │       │ (Next.js)  │
    │  + DB   │       │            │
    │  + RLS  │       │ /api/triage-brief  → Groq
    └─────────┘       │ /api/github/issues → GitHub API
                      │ /api/github/apply  → GitHub API
                      └────────────┘
```

### Flusso dati principale

1. User fa login con GitHub via Supabase Auth → ottiene sessione + `provider_token`
2. Il `provider_token` GitHub viene usato nelle API routes per chiamare l'API GitHub
3. Le issue vengono fetchate e cachate in `issues_cache`
4. Il triager clicca "Genera Brief" → API route chiama Groq → risposta strutturata JSON
5. Il triager invia una proposta → salvata in Supabase (tabella `proposals`)
6. Il maintainer vede le proposte → approva → API route applica label/commento su GitHub

---

## 4. DATABASE SCHEMA (Supabase / Postgres)

### Tabelle

```sql
-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROOMS: una room = una repo GitHub da triagare
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  display_name TEXT, -- opzionale, nome friendly
  created_by UUID NOT NULL REFERENCES auth.users(id),
  labels JSONB DEFAULT '[]'::jsonb, -- ["bug","enhancement","question","needs-info","duplicate","wontfix"]
  canned_responses JSONB DEFAULT '[]'::jsonb, -- [{label: "needs-info", template: "Thanks for reporting..."}]
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repo_owner, repo_name)
);

-- ============================================
-- ROOM MEMBERS: chi può accedere a una room
-- ============================================
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('maintainer', 'triager')),
  github_username TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- ============================================
-- ISSUES CACHE: cache locale delle issue GitHub
-- ============================================
CREATE TABLE issues_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  github_issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT NOT NULL,
  author_login TEXT,
  labels JSONB DEFAULT '[]'::jsonb,
  state TEXT DEFAULT 'open',
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, github_issue_number)
);

-- ============================================
-- PROPOSALS: proposte di triage dei volontari
-- ============================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  github_issue_number INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  kind TEXT NOT NULL CHECK (kind IN ('label', 'comment', 'duplicate', 'needs_info')),
  -- Payload della proposta (label suggerita, commento proposto, issue duplicata, ecc.)
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Brief AI (output completo del modello)
  ai_brief JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id)
);
```

### Row Level Security (RLS)

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- ROOMS: visibili se public o se sei membro
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (
  is_public = true
  OR id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- ROOM MEMBERS: visibili ai membri della room
CREATE POLICY "members_select" ON room_members FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_insert" ON room_members FOR INSERT WITH CHECK (
  -- Solo il maintainer (creatore) può aggiungere membri, oppure auto-join su room pubblica
  user_id = auth.uid()
);

-- ISSUES CACHE: visibili ai membri della room
CREATE POLICY "issues_select" ON issues_cache FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "issues_all" ON issues_cache FOR ALL USING (
  room_id IN (
    SELECT room_id FROM room_members
    WHERE user_id = auth.uid() AND role = 'maintainer'
  )
);

-- PROPOSALS: visibili ai membri, creabili da triager, gestibili da maintainer
CREATE POLICY "proposals_select" ON proposals FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "proposals_insert" ON proposals FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "proposals_update" ON proposals FOR UPDATE USING (
  room_id IN (
    SELECT room_id FROM room_members
    WHERE user_id = auth.uid() AND role = 'maintainer'
  )
);
```

---

## 5. SETUP AUTH (Supabase + GitHub OAuth)

### Configurazione Supabase

1. Crea progetto su supabase.com (free tier)
2. Vai su Authentication → Providers → GitHub
3. Abilita GitHub provider
4. In GitHub → Settings → Developer Settings → OAuth Apps → crea nuova app:
   - **Homepage URL:** `http://localhost:3000` (dev) / URL Vercel (prod)
   - **Callback URL:** `https://<project-ref>.supabase.co/auth/v1/callback`
5. Copia Client ID e Client Secret in Supabase
6. **IMPORTANTE:** In Supabase Auth settings, aggiungi questi scopes: `repo` (necessario per leggere/scrivere issue e label su repo private/pubbliche)

### Login nel frontend

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Funzione login
async function loginWithGitHub() {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'repo',
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}
```

### Ottenere il provider_token GitHub

```typescript
// Il provider_token è disponibile subito dopo il login
const { data: { session } } = await supabase.auth.getSession()
const githubToken = session?.provider_token
// ATTENZIONE: Supabase NON persiste il provider_token dopo il primo login.
// Va catturato nel callback e salvato in un cookie httpOnly o passato al server.
```

### Gestione provider_token (CRITICO)

Supabase restituisce il `provider_token` solo al momento del login (nel callback). Dopo, non è più disponibile nella sessione. Soluzione:

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (data?.session?.provider_token) {
      // Salva il GitHub token in un cookie httpOnly
      const cookieStore = await cookies()
      cookieStore.set('gh_token', data.session.provider_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 ore (il token GitHub OAuth non scade velocemente)
        path: '/'
      })
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

## 6. API ROUTES

### 6.1 `POST /api/github/issues` — Fetch e cache issue

```typescript
// app/api/github/issues/route.ts
// Riceve: { roomId: string }
// 1. Legge room da Supabase (repo_owner, repo_name)
// 2. Usa il gh_token dal cookie per chiamare GitHub API
// 3. Fetcha issue aperte (paginate, max 100)
// 4. Upsert in issues_cache
// 5. Ritorna le issue

// GitHub API endpoint:
// GET /repos/{owner}/{repo}/issues?state=open&per_page=100&sort=created&direction=desc
// Headers: Authorization: Bearer {gh_token}

// RATE LIMIT: 5000 req/h con token autenticato. Più che sufficiente.
// CACHING: non ri-fetchare se last_synced_at < 5 minuti fa
```

### 6.2 `POST /api/triage-brief` — Genera AI brief (Groq)

```typescript
// app/api/triage-brief/route.ts
// Riceve: { issueTitle: string, issueBody: string, repoLabels: string[], existingIssues: {number: number, title: string}[] }
// Chiama Groq con output JSON strutturato
// Ritorna: { summary, missingInfo[], suggestedLabels[], potentialDuplicates[], draftComment }

import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// PROMPT PER GROQ (Llama 3.3 70B)
const SYSTEM_PROMPT = `You are an expert open-source triage assistant. Analyze the GitHub issue provided and return a structured JSON response. Be concise and actionable.

You MUST respond with ONLY a valid JSON object matching this exact schema:
{
  "summary": "2-3 sentence summary of the issue",
  "missingInfo": ["list of missing information needed to resolve this issue"],
  "suggestedLabels": ["from the available labels, suggest 1-3 that apply"],
  "potentialDuplicates": [{"number": 123, "title": "issue title", "reason": "why it might be a duplicate"}],
  "draftComment": "A polite, professional comment to post on the issue. If info is missing, ask for it. If it's clear, acknowledge and categorize. Keep it warm but efficient. Max 3 paragraphs.",
  "confidence": "low|medium|high",
  "triageRecommendation": "needs_info|label_and_close|label_and_keep|duplicate|escalate"
}

Rules:
- suggestedLabels MUST only include labels from the provided available labels list
- potentialDuplicates should only include issues from the provided existing issues list
- draftComment should be written as if posted by a helpful community member, NOT a bot
- If the issue is well-written and clear, say so
- If the issue might be AI-generated spam, flag it in the summary`

// Chiamata Groq
const response = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({
        issueTitle: "...",
        issueBody: "...",
        availableLabels: ["bug", "enhancement", ...],
        existingOpenIssues: [{ number: 1, title: "..." }, ...]
      })
    }
  ],
  response_format: { type: "json_object" },
  temperature: 0.3,
  max_tokens: 1500
})

// Parse e valida il JSON
const brief = JSON.parse(response.choices[0].message.content)
```

### 6.3 `POST /api/github/apply` — Applica azione su GitHub (solo maintainer)

```typescript
// app/api/github/apply/route.ts
// Riceve: { proposalId: string, action: 'label' | 'comment' | 'both' }
// 1. Verifica che l'utente sia maintainer della room
// 2. Legge la proposal da Supabase
// 3. Usa gh_token per applicare su GitHub:
//    - Label: PUT /repos/{owner}/{repo}/issues/{number}/labels
//    - Comment: POST /repos/{owner}/{repo}/issues/{number}/comments
// 4. Aggiorna proposal.status = 'applied', decided_at, decided_by
```

---

## 7. PAGINE E COMPONENTI UI

### 7.1 Landing Page (`/`)

- Hero section con titolo e value proposition
- "Triage should be a team sport, not a solo burden"
- CTA: "Get Started with GitHub" → login
- 3 feature cards: "AI-Powered Briefs", "Propose Without Risk", "Approve & Apply"
- Footer minimale

**Design:** sfondo scuro (#0a0a0a), accenti verde/teal, look professionale e sobrio. Font: Inter o system-ui. Nessun'animazione pesante. Deve sembrare un tool serio per developer, non un sito marketing.

### 7.2 Dashboard (`/dashboard`)

- Header con avatar GitHub e nome utente
- Lista rooms dell'utente (card con repo name, # issue aperte, # proposals pending)
- Pulsante "Create Room" → dialog/form:
  - Input: `owner/repo` (con autocomplete dai repo dell'utente)
  - Checkbox label preconfigurate (bug, enhancement, question, needs-info, duplicate, wontfix)
  - Submit → crea room + aggiunge utente come maintainer
- Pulsante "Join Room" → input codice/URL room pubblica

### 7.3 Room — Backlog Issues (`/room/[id]`)

- Sidebar sinistra: info room, filtri (senza label, nuove, più commentate)
- Lista issue: card per ogni issue con:
  - Titolo (link a GitHub)
  - Autore, data, # commenti
  - Label attuali (badge colorati)
  - Badge "Proposal pending" se esiste una proposta
- Click su issue → apre pannello di triage

### 7.4 Issue Triage Panel (dentro `/room/[id]`)

Layout a 2 colonne (o drawer/sheet laterale):

**Colonna sinistra:** Contenuto issue (markdown renderizzato)

**Colonna destra:**
- Bottone `🤖 Generate AI Brief`
- Box risultato brief:
  - Summary (testo)
  - Missing Info (lista con bullet)
  - Suggested Labels (badge cliccabili per selezionare)
  - Potential Duplicates (link)
  - Draft Comment (textarea editabile, pre-compilata dall'AI)
  - Confidence badge (low/medium/high)
- Form proposta:
  - Tipo: label / comment / duplicate / needs_info
  - Label selezionate (multi-select dalle label della room)
  - Commento (textarea, pre-filled dal draft AI)
  - CTA: `📤 Submit Proposal`

### 7.5 Proposal Inbox (`/room/[id]/proposals`) — Solo maintainer

- Filtri: pending / approved / rejected / all
- Lista proposte con:
  - Issue reference (#numero + titolo)
  - Triager (avatar + username)
  - Tipo proposta
  - Preview: label suggerite + prima riga commento
  - Timestamp
- Click su proposta → espande dettaglio:
  - AI Brief completo
  - Commento proposto (preview formattato)
  - Label proposte
  - 3 pulsanti:
    - ✅ **Approve & Apply** (applica su GitHub immediatamente)
    - 📋 **Approve & Copy** (copia in clipboard il Markdown)
    - ❌ **Reject** (con motivo opzionale)

---

## 8. STRUTTURA FILE DEL PROGETTO

```
triage-relay/
├── .env.local                    # Variabili ambiente (NON committare)
├── .env.example                  # Template variabili (committare)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Schema DB completo (sezione 4)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (font, metadata, providers)
│   │   ├── page.tsx               # Landing page
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts       # OAuth callback (cattura provider_token)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Dashboard rooms
│   │   ├── room/
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Backlog issues + triage panel
│   │   │       └── proposals/
│   │   │           └── page.tsx   # Proposal inbox (maintainer)
│   │   └── api/
│   │       ├── github/
│   │       │   ├── issues/
│   │       │   │   └── route.ts   # Fetch & cache issues
│   │       │   └── apply/
│   │       │       └── route.ts   # Apply label/comment on GitHub
│   │       └── triage-brief/
│   │           └── route.ts       # AI brief via Groq
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (button, card, badge, dialog, sheet, etc.)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── rooms/
│   │   │   ├── RoomCard.tsx
│   │   │   ├── CreateRoomDialog.tsx
│   │   │   └── JoinRoomDialog.tsx
│   │   ├── issues/
│   │   │   ├── IssueList.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   └── IssueFilters.tsx
│   │   ├── triage/
│   │   │   ├── TriagePanel.tsx     # Pannello principale di triage
│   │   │   ├── AIBriefCard.tsx     # Visualizzazione del brief AI
│   │   │   ├── ProposalForm.tsx    # Form per creare proposta
│   │   │   └── DuplicateList.tsx   # Lista potenziali duplicati
│   │   └── proposals/
│   │       ├── ProposalList.tsx
│   │       ├── ProposalCard.tsx
│   │       └── ProposalActions.tsx # Approve/Reject/Copy buttons
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server client (per API routes)
│   │   │   └── middleware.ts       # Middleware per refresh sessione
│   │   ├── github.ts              # Helper GitHub API (Octokit)
│   │   ├── groq.ts                # Helper Groq API
│   │   └── utils.ts               # Utility generiche
│   │
│   ├── types/
│   │   ├── database.ts            # Tipi generati da Supabase (o manuali)
│   │   ├── github.ts              # Tipi per GitHub API
│   │   └── triage.ts              # Tipi per brief AI e proposte
│   │
│   └── middleware.ts               # Next.js middleware (auth check)
│
├── public/
│   ├── og-image.png               # Open Graph image per social sharing
│   └── favicon.ico
│
└── README.md
```

---

## 9. ORDINE DI IMPLEMENTAZIONE (CRITICO — SEGUI QUESTO ORDINE)

### Fase 1: Setup e Auth (PRIMA DI TUTTO)

1. `pnpm create next-app@latest triage-relay --typescript --tailwind --app --src-dir --import-alias "@/*"`
2. `cd triage-relay`
3. Installa dipendenze:
   ```bash
   pnpm add @supabase/supabase-js @supabase/ssr groq-sdk @octokit/rest
   pnpm add -D supabase
   ```
4. Installa shadcn/ui:
   ```bash
   pnpm dlx shadcn@latest init
   pnpm dlx shadcn@latest add button card badge dialog sheet input textarea select separator avatar dropdown-menu tabs toast
   ```
5. Configura `.env.local` con le credenziali Supabase
6. Implementa `lib/supabase/client.ts` e `lib/supabase/server.ts`
7. Implementa `middleware.ts` (redirect a /login se non autenticato)
8. Implementa `/login/page.tsx` e `/auth/callback/route.ts`
9. **TESTA:** login con GitHub funziona, sessione attiva, provider_token catturato

### Fase 2: Database e Room

10. Esegui lo schema SQL in Supabase (sezione 4)
11. Abilita RLS (sezione 4)
12. Implementa `/dashboard/page.tsx` con lista rooms
13. Implementa `CreateRoomDialog.tsx` (crea room + auto-join come maintainer)
14. **TESTA:** crea una room, appare in dashboard

### Fase 3: Issue Fetch e Display

15. Implementa `/api/github/issues/route.ts`
16. Implementa `/room/[id]/page.tsx` con IssueList
17. Implementa IssueCard con info base
18. **TESTA:** le issue dal repo GitHub appaiono nella room

### Fase 4: AI Brief (il cuore del prodotto)

19. Implementa `/api/triage-brief/route.ts` con Groq
20. Implementa TriagePanel (apri issue → genera brief)
21. Implementa AIBriefCard (visualizza risultato)
22. **TESTA:** click "Generate Brief" → output strutturato corretto

### Fase 5: Proposte

23. Implementa ProposalForm (crea proposta da brief)
24. Implementa ProposalList e ProposalCard
25. Implementa `/room/[id]/proposals/page.tsx` (inbox maintainer)
26. **TESTA:** triager crea proposta, maintainer la vede

### Fase 6: Approve & Apply

27. Implementa `/api/github/apply/route.ts`
28. Implementa ProposalActions (approve & apply, approve & copy, reject)
29. **TESTA:** maintainer approva → label/commento appare su GitHub

### Fase 7: Polish e Deploy

30. Loading states (Skeleton da shadcn/ui)
31. Error handling (toast notifications)
32. Empty states ("No issues yet", "No proposals pending")
33. Responsive design (mobile-friendly minimo)
34. Meta tags e OG image
35. Deploy su Vercel
36. **TESTA:** tutto funziona su URL Vercel

---

## 10. DESIGN SYSTEM

### Colori

```typescript
// tailwind.config.ts - estendi il tema
{
  colors: {
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#141414',
    'card-hover': '#1a1a1a',
    border: '#262626',
    primary: '#10b981',       // Emerald-500 (verde triage)
    'primary-hover': '#059669',
    secondary: '#6366f1',     // Indigo-500
    destructive: '#ef4444',
    warning: '#f59e0b',
    muted: '#737373',
    'muted-foreground': '#a3a3a3'
  }
}
```

### Principi di design

- **Dark theme only** (developer audience)
- **Densità informativa alta** — mostra più dati possibili senza scroll
- **No animazioni frivole** — solo transizioni funzionali (hover, expand)
- **Accessibilità base** — focus visible, contrasto AA, label su form
- **Font:** system-ui / Inter
- **Border radius:** 8px (rounded-lg)
- **Spacing:** usa il sistema Tailwind (4, 6, 8 per componenti, 12-16 per sezioni)

---

## 11. GESTIONE ERRORI

```typescript
// Pattern standard per API routes
export async function POST(req: Request) {
  try {
    // ... logica
    return Response.json({ data: result })
  } catch (error) {
    console.error('[API_NAME]', error)

    if (error instanceof GitHubRateLimitError) {
      return Response.json(
        { error: 'GitHub rate limit exceeded. Try again in a few minutes.' },
        { status: 429 }
      )
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Errori comuni da gestire

- **GitHub token scaduto/invalido** → redirect a /login con messaggio
- **GitHub rate limit** → mostra timer "retry after"
- **Groq API error** → fallback: mostra "AI brief unavailable, triage manually"
- **Supabase RLS block** → 403 con messaggio chiaro
- **Network error** → retry con exponential backoff (max 3 tentativi)

---

## 12. GROQ — NOTE IMPORTANTI

- **Modello:** `llama-3.3-70b-versatile`
- **Rate limit free tier:** 30 req/min, 14.400 req/giorno — più che sufficiente
- **JSON mode:** supportato via `response_format: { type: "json_object" }`
- **Temperature:** 0.3 (bassa per output deterministico)
- **Max tokens:** 1500 per brief
- **Timeout:** imposta 30s — Groq è velocissimo ma meglio avere un safety net
- **Fallback:** se Groq è down, mostra messaggio "AI unavailable" e permetti triage manuale

```typescript
// lib/groq.ts
import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function generateTriageBrief(params: {
  issueTitle: string
  issueBody: string
  availableLabels: string[]
  existingIssues: { number: number; title: string }[]
}) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(params) }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 1500,
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}
```

---

## 13. GITHUB API — NOTE IMPORTANTI

```typescript
// lib/github.ts
import { Octokit } from '@octokit/rest'

export function createOctokit(token: string) {
  return new Octokit({ auth: token })
}

// Fetch issues
export async function fetchIssues(token: string, owner: string, repo: string) {
  const octokit = createOctokit(token)
  const { data } = await octokit.issues.listForRepo({
    owner, repo,
    state: 'open',
    per_page: 100,
    sort: 'created',
    direction: 'desc'
  })
  // Filtra via PR (GitHub mescola issue e PR nella stessa API)
  return data.filter(issue => !issue.pull_request)
}

// Apply label
export async function addLabel(token: string, owner: string, repo: string, issueNumber: number, labels: string[]) {
  const octokit = createOctokit(token)
  await octokit.issues.addLabels({ owner, repo, issue_number: issueNumber, labels })
}

// Post comment
export async function addComment(token: string, owner: string, repo: string, issueNumber: number, body: string) {
  const octokit = createOctokit(token)
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body })
}
```

### Scopes OAuth necessari

- `repo` — accesso completo a repo pubbliche e private (necessario per label e commenti)
- Se vuoi limitare a sole repo pubbliche: `public_repo`

---

## 14. VERCEL DEPLOY

### vercel.json (opzionale, solitamente non serve per Next.js)

```json
{
  "framework": "nextjs"
}
```

### Environment variables su Vercel

Vai su Vercel → Project Settings → Environment Variables e aggiungi:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

### Deploy

```bash
pnpm build  # Verifica che builda senza errori in locale
# Poi push su GitHub e Vercel deploya automaticamente
# OPPURE: npx vercel --prod
```

---

## 15. TESTI UI (COPY)

### Landing Page

**Hero Title:** "Triage is a team sport"
**Hero Subtitle:** "Help open-source maintainers manage their backlog — without needing push access. Propose, review, apply."
**CTA:** "Start triaging with GitHub →"

### Feature Cards

1. **🤖 AI-Powered Briefs** — "Get instant summaries, spot duplicates, and draft responses. AI does the heavy lifting, humans make the decisions."
2. **🛡️ Propose Without Risk** — "Volunteers suggest labels, comments, and duplicates. No dangerous permissions needed — maintainers stay in control."
3. **⚡ Approve & Apply** — "One click to apply a label, post a comment, or close a duplicate. The maintainer's inbox becomes a decision queue, not a task list."

### Empty States

- **No rooms:** "You haven't created or joined any triage rooms yet. Create one from your GitHub repository."
- **No issues:** "No open issues found. Either the repo is clean (congrats! 🎉) or we need to sync."
- **No proposals:** "No proposals pending. Your triage volunteers are probably sleeping. ☕"

---

## 16. COSE DA NON FARE

- ❌ NON implementare registrazione utente custom — usa SOLO GitHub OAuth
- ❌ NON implementare websocket/real-time — polling manuale è sufficiente per MVP
- ❌ NON implementare notifiche email
- ❌ NON implementare support per PR (solo issue per MVP)
- ❌ NON implementare embeddings/pgvector (tagliato per semplicità — la ricerca duplicati usa il brief AI)
- ❌ NON usare ORM (usa direttamente il Supabase client)
- ❌ NON creare un design system custom — usa shadcn/ui as-is con colori custom
- ❌ NON aggiungere i18n — tutto in inglese
- ❌ NON creare test unitari (non c'è tempo, è un hackathon weekend)
- ❌ NON fare over-engineering: se una cosa funziona, vai avanti

---

## 17. CHECKLIST FINALE PRE-SUBMIT

- [ ] Login con GitHub funziona
- [ ] Creazione room funziona
- [ ] Issue si caricano dal repo
- [ ] AI Brief si genera correttamente
- [ ] Proposta si crea e si salva
- [ ] Maintainer vede proposte nel inbox
- [ ] Approve & Apply funziona (label e/o commento su GitHub)
- [ ] Landing page è presentabile
- [ ] Deploy su Vercel funziona
- [ ] Nessun errore in console
- [ ] URL funzionante per la demo
- [ ] Screenshot/video pronti per il post DEV
