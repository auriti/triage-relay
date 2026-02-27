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

  // Fetch issue cachate
  const { data: issues } = await supabase
    .from('issues_cache')
    .select('*')
    .eq('room_id', id)
    .eq('state', 'open')
    .order('github_issue_number', { ascending: false })

  // Fetch room labels
  const { data: room } = await supabase
    .from('rooms')
    .select('labels')
    .eq('id', id)
    .single()

  // Fetch issue con proposte pending
  const { data: pendingProposals } = await supabase
    .from('proposals')
    .select('github_issue_number')
    .eq('room_id', id)
    .eq('status', 'pending')

  const pendingIssueNumbers = [...new Set(pendingProposals?.map((p) => p.github_issue_number) || [])]

  return (
    <RoomClient
      roomId={id}
      initialIssues={issues || []}
      roomLabels={(room?.labels as string[]) || []}
      pendingProposalIssues={pendingIssueNumbers}
    />
  )
}
