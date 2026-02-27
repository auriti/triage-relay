// Helper per GitHub API via Octokit
import { Octokit } from '@octokit/rest'
import type { GitHubIssue } from '@/types/github'

export function createOctokit(token: string) {
  return new Octokit({ auth: token })
}

// Verifica che il token GitHub sia ancora valido
export async function validateToken(token: string): Promise<{ valid: boolean; login?: string }> {
  try {
    const octokit = createOctokit(token)
    const { data } = await octokit.users.getAuthenticated()
    return { valid: true, login: data.login }
  } catch {
    return { valid: false }
  }
}

// Fetch issue aperte da un repo (filtra via PR)
// Pagina fino a MAX_PAGES per avere abbastanza issue reali (GitHub mescola issue e PR)
const MAX_PAGES = 5
const PER_PAGE = 100

export async function fetchIssues(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubIssue[]> {
  const octokit = createOctokit(token)
  const allIssues: GitHubIssue[] = []

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data } = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: PER_PAGE,
        sort: 'created',
        direction: 'desc',
        page,
      })

      // Nessun risultato → fine della paginazione
      if (data.length === 0) break

      // Filtra PR e mappa a GitHubIssue
      const issues = data
        .filter((issue) => !issue.pull_request)
        .map((issue) => ({
          number: issue.number,
          title: issue.title,
          body: issue.body ?? null,
          html_url: issue.html_url,
          user: issue.user
            ? { login: issue.user.login, avatar_url: issue.user.avatar_url }
            : null,
          labels: (issue.labels || [])
            .filter((l): l is { name: string; color: string; description: string | null } =>
              typeof l === 'object' && l !== null && 'name' in l
            )
            .map((l) => ({
              name: l.name ?? '',
              color: l.color ?? '',
              description: l.description ?? null,
            })),
          state: issue.state ?? 'open',
          comments: issue.comments,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
        }))

      allIssues.push(...issues)

      // Se la pagina non è piena, non ci sono altre pagine
      if (data.length < PER_PAGE) break
    }
  } catch (err: unknown) {
    // Gestisci errori specifici di GitHub
    const status = (err as { status?: number }).status
    if (status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or you don't have access`)
    }
    if (status === 403) {
      throw new Error('GitHub API rate limit exceeded. Try again later.')
    }
    throw err
  }

  return allIssues
}

// Aggiungi label a una issue
export async function addLabel(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  labels: string[]
) {
  const octokit = createOctokit(token)
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels,
  })
}

// Chiudi una issue (usato per duplicati)
export async function closeIssue(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  reason: 'completed' | 'not_planned' = 'not_planned'
) {
  const octokit = createOctokit(token)
  await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: 'closed',
    state_reason: reason,
  })
}

// Posta un commento su una issue
export async function addComment(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  const octokit = createOctokit(token)
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  })
}
