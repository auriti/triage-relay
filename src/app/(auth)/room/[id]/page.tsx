// Room page — backlog issue + pannello triage
import { createClient } from '@/lib/supabase/server'
import { RoomClient } from './room-client'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Auth già verificata dal parent layout
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch issue, room, proposte pending, ruolo e proposte utente in parallelo
  const [{ data: issues }, { data: room }, { data: pendingProposals }, { data: member }, { data: userPendingProposals }] = await Promise.all([
    supabase
      .from('issues_cache')
      .select('*')
      .eq('room_id', id)
      .eq('state', 'open')
      .order('github_issue_number', { ascending: false }),
    supabase
      .from('rooms')
      .select('labels')
      .eq('id', id)
      .single(),
    supabase
      .from('proposals')
      .select('github_issue_number')
      .eq('room_id', id)
      .eq('status', 'pending'),
    supabase
      .from('room_members')
      .select('role')
      .eq('room_id', id)
      .eq('user_id', user!.id)
      .single(),
    // Proposte pending dell'utente corrente — per bloccare doppia proposta
    supabase
      .from('proposals')
      .select('github_issue_number')
      .eq('room_id', id)
      .eq('created_by', user!.id)
      .eq('status', 'pending'),
  ])

  // Popola claimed_by_username — join manuale con room_members
  const { data: members } = await supabase
    .from('room_members')
    .select('user_id, github_username')
    .eq('room_id', id)

  const memberMap = new Map(
    (members || []).map((m) => [m.user_id, m.github_username])
  )

  const issuesWithClaims = (issues || []).map((issue) => ({
    ...issue,
    claimed_by_username: issue.claimed_by ? memberMap.get(issue.claimed_by) || null : null,
  }))

  const pendingIssueNumbers = [...new Set(pendingProposals?.map((p) => p.github_issue_number) || [])]
  const userPendingIssueNumbers = [...new Set(userPendingProposals?.map((p) => p.github_issue_number) || [])]

  return (
    <RoomClient
      roomId={id}
      initialIssues={issuesWithClaims}
      roomLabels={(room?.labels as string[]) || []}
      pendingProposalIssues={pendingIssueNumbers}
      userPendingIssues={userPendingIssueNumbers}
      currentUserId={user!.id}
      role={member?.role || 'triager'}
    />
  )
}
