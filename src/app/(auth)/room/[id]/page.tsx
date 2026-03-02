// Room page — backlog issue + pannello triage
import { createClient } from '@/lib/supabase/server'
import { RoomClient } from './room-client'
import type { CannedResponse } from '@/types/database'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Auth già verificata dal parent layout
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch issue, room, proposte pending, ruolo, proposte utente e dati leaderboard in parallelo
  const [{ data: issues }, { data: room }, { data: pendingProposals }, { data: member }, { data: userPendingProposals }, { data: leaderboardRaw }] = await Promise.all([
    supabase
      .from('issues_cache')
      .select('*')
      .eq('room_id', id)
      .eq('state', 'open')
      .order('github_issue_number', { ascending: false }),
    supabase
      .from('rooms')
      .select('labels, canned_responses')
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
    // Tutte le proposte della room con autore e stato — necessarie per la leaderboard
    supabase
      .from('proposals')
      .select('created_by, status')
      .eq('room_id', id),
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

  // Aggrega le proposte per autore e calcola totale + applicate
  const leaderMap = new Map<string, { total: number; applied: number }>()
  leaderboardRaw?.forEach((p) => {
    const entry = leaderMap.get(p.created_by) || { total: 0, applied: 0 }
    entry.total++
    if (p.status === 'applied') entry.applied++
    leaderMap.set(p.created_by, entry)
  })

  // Costruisce la lista ordinata per numero totale di proposte decrescente,
  // arricchita con il github_username del triager tramite la memberMap già costruita
  const leaderboard = [...leaderMap.entries()]
    .map(([userId, stats]) => ({
      github_username: memberMap.get(userId) || null,
      total: stats.total,
      applied: stats.applied,
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <RoomClient
      roomId={id}
      initialIssues={issuesWithClaims}
      roomLabels={(room?.labels as string[]) || []}
      cannedResponses={(room?.canned_responses as CannedResponse[]) || []}
      pendingProposalIssues={pendingIssueNumbers}
      userPendingIssues={userPendingIssueNumbers}
      currentUserId={user!.id}
      role={member?.role || 'triager'}
      leaderboard={leaderboard}
    />
  )
}
