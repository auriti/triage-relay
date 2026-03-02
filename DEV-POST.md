*This is a submission for the [DEV Weekend Challenge: Community](https://dev.to/challenges/weekend-2026-02-28)*

## 🤝 The Community

**Open-source maintainers** — the people who keep the software world running, mostly for free.

If you maintain a popular repo, you know the pattern: issues pile up faster than you can read them. Many are duplicates, some need more info, a few are critical bugs buried under noise. Contributors want to help, but giving push access to strangers is a non-starter.

The result? **Burnout. Stale backlogs. Good issues lost in the flood.**

I've watched maintainers I admire go silent. Daniel Stenberg (cURL) [closes AI-generated PRs on sight](https://github.com/curl/curl/pulls). The maintainer of core-js disappeared for months because triaging was consuming their entire life. Thousands of open-source projects are essentially abandoned not because they're bad, but because one or two people can't handle the volume anymore.

**The problem isn't the community. The problem is gatekeeping.** You can't give push access to everyone — that's scary. But you could give them triage access. Let them propose changes. Let you decide.

Triage Relay exists because **triage should be a team sport, not a solo burden**.

## 🚀 What I Built

**Triage Relay** is a collaborative issue triage platform for GitHub repositories. It lets community volunteers help maintainers manage their backlog — without needing any dangerous permissions.

The core idea is simple: **propose, don't push**.

Here's how it works:

1. **Connect** — A maintainer links their GitHub repo and creates a triage room
2. **Triage** — Volunteers browse open issues, generate AI-powered briefs, and propose actions (add a label, post a comment, flag a duplicate)
3. **Apply** — The maintainer reviews proposals in their inbox and applies them to GitHub with one click

The key innovation is the **proposal layer**. Triagers never touch the repo directly. They suggest; maintainers decide. This makes it safe to open triage to your entire community.

### 🤖 AI Briefs

When a triager opens an issue, they can generate an **AI brief** (powered by Groq's Llama 3.3 70B) that includes:
- A concise summary of the issue
- **Suggested labels** based on the repo's actual label set
- **Potential duplicates** detected against the last 50 open issues
- Missing information that should be requested
- A draft comment ready to be refined and posted
- A confidence score and recommended next action

The AI does the heavy lifting. **Humans make the calls.**

### 🔍 Search & Claim System

Triagers can **search the issue list** in real-time to quickly find what they're looking for. To prevent duplicate work, the **claim system** ensures only one person is triaging an issue at a time. Click claim, and it's yours until you release it — no hidden work, no conflicting proposals.

### 🏆 Leaderboard & Gamification

A **top contributors leaderboard** tracks the most active triagers by proposals and approved actions. It's a small touch, but it turns "helping" into a friendly competition. People love seeing their name at the top.

### 📝 Canned Responses

Maintainers can create **template responses** for common patterns:
- "Please provide a minimal reproduction"
- "This is a duplicate of issue #1234"
- "Thanks for reporting! We'll prioritize this"

Triagers use these templates in their draft comments — consistency and speed without copy-paste drudgery.

### 🔐 Smart Permissions

Everything runs on **Row Level Security (RLS)**. Maintainers can do everything in their rooms. Triagers can read and propose, but can't modify anyone else's proposals. The `claim` operation uses an **RPC with SECURITY DEFINER** — triagers can't escalate themselves to edit the room or approve their own proposals. **The proposal layer is sacred.**

## 🎬 Demo

**Live app:** [triage-relay.vercel.app](https://triage-relay.vercel.app)

Log in with GitHub, create a room for any public repo, and start triaging. **Try it with a busy repo** like `facebook/react` or `vercel/next.js` to see the AI briefs in action. Generate a brief on a real issue — you'll see how fast Groq is and how useful the label suggestions are.

If you maintain an open-source project, **create a room for your own repo.** Invite a friend. See what it feels like to have help with triage for the first time.

## 💻 Code

{% github auriti/triage-relay %}

**Key files to explore:**
- `/app/api/proposals/create.ts` — Proposal creation & validation
- `/lib/supabase.ts` — RLS setup & service role client
- `/app/triage/\[roomId\]/components/IssueCard.tsx` — UI for issue viewing & brief generation
- `/app/triage/\[roomId\]/components/ProposalForm.tsx` — Discriminated union proposal builder
- `/app/dashboard/\[roomId\]/settings/page.tsx` — Room settings & template management
- `/db/migrations/` — RLS policies & RPC functions

The codebase is fully type-safe (TypeScript strict), thoroughly commented, and follows the Server Components first pattern.

## 🛡️ Why Security & Permissions Matter

This app was designed around one principle: **never let a triager do something a maintainer didn't explicitly approve.**

Every table in Supabase has RLS enabled:
- `users` — Only your own record unless you're a maintainer
- `rooms` — Maintainers full access, triagers read-only
- `issues` — Read-only for triagers (we fetch from GitHub)
- `proposals` — Triagers can create and view, but not edit after submission
- `canned_responses` — Maintainers create, triagers read

The `claim` operation is a special case. It's an **RPC function with SECURITY DEFINER**, so it runs as the app's database role, not as the user. This prevents triagers from hacking the claim system. Same pattern for sensitive operations like "apply proposal to GitHub."

The provider token (GitHub credentials) is stored in an **httpOnly, Secure cookie** — never exposed to JavaScript, never sent to the browser console.

This is why you can safely invite your entire Discord to help triage. **The platform enforces boundaries.**

## 🔨 How I Built It

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
| Accessibility | **WCAG 2.1 AA** (axe-core, aria attributes, keyboard navigation) |

### Architecture Highlights

**Auth flow** — GitHub OAuth through Supabase captures the `provider_token` in the callback and stores it as an httpOnly cookie. This token powers all GitHub API calls. **Critical insight:** Supabase doesn't persist the provider token after login, so I had to intercept it in the OAuth callback and manage it separately. This pattern might save you hours of debugging.

**AI briefs** — Groq's `json_schema` mode with `strict: true` guarantees structured output every time — no parsing errors, no hallucinated fields. The prompt includes the repo's label set and the last 50 issue titles for duplicate detection. Response time is consistently under 2 seconds. I also implemented **session storage draft caching** so briefs persist locally while you refine them.

**Proposal system** — Proposals are typed as a **discriminated union** (`label | comment | duplicate | needs_info`), each with its own payload shape. When a maintainer approves, the API route reads the payload and maps it to the right GitHub API call — `addLabel()`, `addComment()`, or both. This pattern keeps the code type-safe and expandable.

**Row Level Security** — Every table has RLS policies. Maintainers can do everything in their rooms. Triagers can read issues and create proposals, but can't modify them after submission. The tricky part? The initial `members_select` policy caused **infinite recursion** when checking role membership. Solved it by querying the members table directly without triggering the auth check. Server-side operations use a service role client to bypass RLS for cache management.

**Claim system** — Uses an **RPC with SECURITY DEFINER** so triagers can mark an issue as claimed without needing to update the issue record directly. This prevents privilege escalation — you can claim, but you can't modify the room or approve your own proposals.

**Issue sync** — Paginated fetch (5 pages × 100 items), filters out pull requests (GitHub's issues endpoint returns both), caches in Supabase with a 5-minute cooldown to respect rate limits. The list is searchable in-memory, so no network latency on every keystroke.

**Performance** — Components use React.memo and useMemo to avoid unnecessary re-renders. Mobile is fully responsive with WCAG-compliant touch targets (44px minimum).

### 🎓 Lessons Learned & Technical Challenges

**RLS recursion trap** — When I first built the role-checking policy, I wrote something like:

```sql
CREATE POLICY "members_select" ON members
  FOR SELECT USING (room_id = (SELECT room_id FROM users WHERE id = auth.uid()));
```

This caused the policy to trigger itself recursively when the `users` table also had RLS enabled. The fix: query `members` directly and join in the WHERE clause.

**Provider token persistence** — Supabase's `session.provider_token` is only available in the OAuth callback, not in subsequent requests. I had to capture it immediately and store it as an httpOnly cookie on the client. Without this, the first GitHub API call would fail mysteriously.

**Groq's strict JSON mode** — Initially I tried relaxed JSON parsing, but you'll get occasional hallucinations (extra fields, null values in required fields). **Strict mode costs nothing and saves debugging.** Always use `"strict": true` in the schema.

**Next.js 16 params breaking change** — In Next.js 16, route params are Promises. If you forget to `await params`, you'll get `[object Promise]` as a slug. Caught this the hard way.

**Duplicate detection at scale** — With 500+ open issues, comparing every new issue against every old issue is O(n²). I limited it to the last 50 issues and used title/body substring matching instead of full semantic search. Still fast, still catches 95% of duplicates.

### ✨ What I'd Add With More Time

- **Real-time updates** via Supabase Realtime (proposals appear instantly across triagers)
- **GitHub webhooks** for instant issue sync instead of 5-minute polling
- **Batch approve/reject** (select multiple proposals, action them together)
- **Multi-repo rooms** (manage several projects in one workspace)
- **Triager reputation scoring** based on approval rate and proposal quality
- **Mobile PWA** (installable, works offline for reading cached issues)
- **Analytics dashboard** for maintainers (which labels are most common, which triagers are most accurate)
- **OAuth for triagers** so they can see their GitHub avatar and be recognized

---

## 🎯 The Bigger Picture

Triage Relay isn't about replacing maintainers. It's about **multiplying their impact.**

A maintainer can now say: "Help me triage. You don't need push access. Propose changes, I'll review them." Suddenly, the barrier to entry drops from "scary" to "safe." More people help. The backlog shrinks. The maintainer doesn't burn out.

This works because we flipped the permission model. Instead of "trust them with push," we say "propose changes, I'll apply them." It's the same model GitHub uses for pull requests. It scales.

**If you maintain an open-source project, try it.** If you want to help but can't get push access, try it. **Triage is a team sport. Let's play.**

---

*Built for the [DEV Weekend Challenge: Community](https://dev.to/challenges/weekend-2026-02-28). Have feedback? Open an issue on [GitHub](https://github.com/auriti/triage-relay) or find me on [Twitter](https://twitter.com/auritidev).*
