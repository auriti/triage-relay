// Tipi per il database Supabase (Postgres)

export type UserRole = 'maintainer' | 'triager'
export type ProposalKind = 'label' | 'comment' | 'duplicate' | 'needs_info'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'applied'

// === Tabella rooms ===
export interface Room {
  id: string
  repo_owner: string
  repo_name: string
  display_name: string | null
  created_by: string
  labels: string[]
  canned_responses: CannedResponse[]
  is_public: boolean
  created_at: string
}

export interface CannedResponse {
  label: string
  template: string
}

// === Tabella room_members ===
export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  role: UserRole
  github_username: string | null
  joined_at: string
}

// === Tabella issues_cache ===
export interface IssueCache {
  id: string
  room_id: string
  github_issue_number: number
  title: string
  body: string | null
  url: string
  author_login: string | null
  labels: string[]
  state: string
  comments_count: number
  created_at: string | null
  updated_at: string | null
  last_synced_at: string
}

// === Tabella proposals ===
export interface Proposal {
  id: string
  room_id: string
  github_issue_number: number
  created_by: string
  kind: ProposalKind
  payload: ProposalPayload
  ai_brief: import('./triage').TriageBrief | null
  status: ProposalStatus
  created_at: string
  decided_at: string | null
  decided_by: string | null
}

// Payload discriminato per tipo di proposta
export type ProposalPayload =
  | { kind: 'label'; labels: string[] }
  | { kind: 'comment'; comment: string }
  | { kind: 'duplicate'; duplicate_of: number; reason: string }
  | { kind: 'needs_info'; labels: string[]; comment: string }

// === Helper per join ===
export interface RoomWithMembership extends Room {
  role: UserRole
  member_count?: number
  pending_proposals?: number
  issue_count?: number
}

// Proposta con info del triager
export interface ProposalWithTriager extends Proposal {
  triager_username: string | null
}
