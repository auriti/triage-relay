*This is a submission for the [DEV Weekend Challenge: Community](https://dev.to/challenges/weekend-2026-02-28)*

## The Community

**Open-source maintainers** — the people who keep the software world running, mostly for free.

If you maintain a popular repo, you know the pattern: issues pile up faster than you can read them. Many are duplicates, some need more info, a few are critical bugs buried under noise. Contributors want to help, but giving push access to strangers is a non-starter.

The result? Burnout. Stale backlogs. Good issues lost in the flood.

Triage Relay exists because **triage should be a team sport, not a solo burden**.

## What I Built

**Triage Relay** is a collaborative issue triage platform for GitHub repositories. It lets community volunteers help maintainers manage their backlog — without needing any dangerous permissions.

The core idea is simple: **propose, don't push**.

Here's how it works:

1. **Connect** — A maintainer links their GitHub repo and creates a triage room
2. **Triage** — Volunteers browse open issues, generate AI-powered briefs, and propose actions (add a label, post a comment, flag a duplicate)
3. **Apply** — The maintainer reviews proposals in their inbox and applies them to GitHub with one click

The key innovation is the **proposal layer**. Triagers never touch the repo directly. They suggest; maintainers decide. This makes it safe to open triage to your entire community.

### AI Briefs

When a triager opens an issue, they can generate an **AI brief** that includes:
- A concise summary of the issue
- Suggested labels based on the repo's label set
- Potential duplicates detected against existing issues
- Missing information that should be requested
- A draft comment ready to be refined
- A confidence score and recommended action

The AI does the heavy lifting. Humans make the calls.

## Demo

**Live app:** [triage-relay.vercel.app](https://triage-relay.vercel.app)

Log in with GitHub, create a room for any public repo, and start triaging. Try it with a busy repo like `facebook/react` or `vercel/next.js` to see the AI briefs in action.

## Code

{% github auriti/triage-relay %}

## How I Built It

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router, React 19, Turbopack) |
| Language | **TypeScript** (strict mode) |
| Styling | **Tailwind CSS v4** + **shadcn/ui** |
| Database & Auth | **Supabase** (Postgres + GitHub OAuth) |
| AI | **Groq** (Llama 3.3 70B with strict JSON schema) |
| GitHub API | **Octokit REST** |
| Deploy | **Vercel** (free tier) |

### Architecture highlights

**Auth flow** — GitHub OAuth through Supabase captures the `provider_token` in the callback and stores it as an httpOnly cookie. This token powers all GitHub API calls. Supabase doesn't persist it after login, so catching it at the right moment was critical.

**AI briefs** — Groq's `json_schema` mode with `strict: true` guarantees structured output every time. The prompt includes the repo's label set and the last 50 issue titles for duplicate detection. Response time is consistently under 2 seconds.

**Proposal system** — Proposals are typed as a discriminated union (`label | comment | duplicate | needs_info`), each with its own payload shape. When a maintainer approves, the API route reads the payload and maps it to the right GitHub API call — `addLabel()`, `addComment()`, or both.

**Row Level Security** — Every table has RLS policies. Maintainers can do everything in their rooms. Triagers can read issues and create proposals, but can't modify them after submission. Server-side operations use a service role client to bypass RLS for cache management.

**Issue sync** — Paginated fetch (5 pages × 100 items), filters out pull requests (GitHub's issues endpoint returns both), caches in Supabase with a 5-minute cooldown to respect rate limits.

### What I'd add with more time

- Real-time updates via Supabase Realtime
- Batch proposal review (approve/reject multiple at once)
- Activity feed showing recent triage actions
- GitHub webhook integration for instant sync
- Triager reputation system based on approval rate
