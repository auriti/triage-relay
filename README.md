# Triage Relay

**Collaborative issue triage for open-source maintainers.**

Triage Relay turns your GitHub backlog into a decision queue. Community volunteers analyze issues, generate AI-powered briefs, and propose actions — maintainers review and apply with one click. No push access required.

**[Live Demo](https://triage-relay.vercel.app)** &middot; **[DEV Challenge Submission](https://dev.to/challenges/weekend-2026-02-28)**

---

## How It Works

```
Volunteer opens issue → Generates AI brief → Proposes action
                                                    ↓
Maintainer reviews proposal → One click → Applied on GitHub
```

1. **Connect** — Link any GitHub repository and create a triage room
2. **Triage** — Volunteers browse issues, generate AI briefs, and submit proposals (label, comment, flag duplicate, request info)
3. **Apply** — Maintainers review proposals and push them to GitHub instantly

The core principle: **propose, don't push**. Triagers never touch the repo directly.

## AI Briefs

Each issue can be analyzed by AI to produce a structured brief:

- Concise summary of the issue
- Suggested labels from the repo's label set
- Potential duplicates detected against existing issues
- Missing information checklist
- Draft comment ready to refine
- Confidence score and recommended action

Powered by Groq (Llama 4 Scout) with strict JSON schema for guaranteed structured output.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19, Turbopack) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Database & Auth | [Supabase](https://supabase.com) (Postgres, RLS, GitHub OAuth) |
| AI | [Groq](https://groq.com) (Llama 4 Scout, structured outputs) |
| GitHub API | [Octokit](https://github.com/octokit/rest.js) |
| Deploy | [Vercel](https://vercel.com) |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project with GitHub OAuth enabled
- A [Groq](https://console.groq.com) API key
- A GitHub OAuth App (scope: `repo`)

### Setup

```bash
git clone https://github.com/auriti/triage-relay.git
cd triage-relay
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
```

Run the database migration in Supabase SQL Editor:

```bash
# Copy the contents of supabase/migrations/001_initial_schema.sql
# and execute in your Supabase project's SQL Editor
```

Configure Supabase Authentication:

1. Enable GitHub provider in Authentication &rarr; Providers
2. Add your GitHub OAuth App credentials (Client ID + Secret)
3. Set redirect URL: `http://localhost:3000/auth/callback`

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Add the 4 environment variables
3. Update Supabase redirect URLs to your Vercel domain
4. Update GitHub OAuth App homepage URL

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── login/page.tsx            # GitHub OAuth login
│   ├── auth/callback/route.ts    # OAuth callback (captures provider_token)
│   ├── (auth)/
│   │   ├── dashboard/page.tsx    # Room list
│   │   └── room/[id]/
│   │       ├── page.tsx          # Issue backlog + triage panel
│   │       └── proposals/page.tsx # Maintainer inbox
│   ├── api/
│   │   ├── github/issues/        # Fetch & cache issues from GitHub
│   │   ├── github/apply/         # Apply proposals to GitHub
│   │   └── triage-brief/         # Generate AI brief via Groq
│   └── actions/                  # Server actions (rooms, proposals)
├── components/
│   ├── issues/                   # IssueList, IssueCard
│   ├── triage/                   # TriagePanel, AIBriefCard, ProposalForm
│   ├── proposals/                # ProposalCard, ProposalActions
│   └── rooms/                    # RoomCard, CreateRoomDialog, JoinRoomDialog
├── lib/
│   ├── supabase/                 # Client, server, middleware helpers
│   ├── github.ts                 # Octokit helpers
│   └── groq.ts                   # AI brief generation
└── types/                        # TypeScript types (database, github, triage)
```

## Architecture Decisions

- **Provider token as httpOnly cookie** — Supabase doesn't persist the GitHub `provider_token` after login. We capture it in the OAuth callback and store it in a secure cookie for subsequent API calls.
- **Service role client for cache** — Issue sync uses a service role client to bypass RLS, since cache writes aren't user-scoped.
- **Paginated issue fetch** — 5 pages of 100 items with PR filtering and 5-minute cache cooldown.
- **Strict JSON schema** — Groq structured outputs guarantee the AI brief always matches the expected TypeScript interface.
- **Discriminated union proposals** — Proposal payloads are typed by kind (`label | comment | duplicate | needs_info`), each mapping to specific GitHub API calls on approval.

## License

MIT

---

Built by [@auriti](https://github.com/auriti) for the [DEV Weekend Challenge](https://dev.to/challenges/weekend-2026-02-28).
