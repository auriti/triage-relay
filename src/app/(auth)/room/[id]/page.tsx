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

  // Fetch issue, room, proposte pending e ruolo in parallelo
  const [{ data: issues }, { data: room }, { data: pendingProposals }, { data: member }] = await Promise.all([
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
  ])

  const pendingIssueNumbers = [...new Set(pendingProposals?.map((p) => p.github_issue_number) || [])]

  return (
    <RoomClient
      roomId={id}
      initialIssues={issues || []}
      roomLabels={(room?.labels as string[]) || []}
      pendingProposalIssues={pendingIssueNumbers}
      currentUserId={user!.id}
      role={member?.role || 'triager'}
    />
  )
}
