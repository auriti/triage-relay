// Tipi per GitHub API

export interface GitHubIssue {
  number: number
  title: string
  body: string | null
  html_url: string
  user: {
    login: string
    avatar_url: string
  } | null
  labels: GitHubLabel[]
  state: string
  comments: number
  created_at: string
  updated_at: string
  pull_request?: unknown // Presente solo per PR (da filtrare)
}

export interface GitHubLabel {
  name: string
  color: string
  description: string | null
}

export interface IssuesFetchResponse {
  issues: GitHubIssue[]
  cached: boolean
  synced_at: string
}

export interface ApplyResponse {
  success: boolean
  applied: ('label' | 'comment')[]
  error?: string
}
