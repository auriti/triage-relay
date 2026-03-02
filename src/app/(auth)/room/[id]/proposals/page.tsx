// Proposals page — inbox proposte (solo maintainer)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProposalList } from '@/components/proposals/ProposalList'
import type { ProposalWithTriager } from '@/types/database'

export default async function ProposalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Auth e membership già verificate dai parent layout
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verifica ruolo maintainer (il layout verifica solo membership)
  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', id)
    .eq('user_id', user!.id)
    .single()

  if (!member || member.role !== 'maintainer') {
    redirect(`/room/${id}`)
  }

  // Fetch proposte, username triager e titoli issue in parallelo
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: false })

  // Issue numbers per recuperare i titoli
  const issueNumbers = [...new Set((proposals || []).map((p) => p.github_issue_number))]

  // Recupera username triager e titoli issue in parallelo
  const triagerIds = [...new Set((proposals || []).map((p) => p.created_by))]
  const [{ data: members }, { data: issues }] = await Promise.all([
    supabase
      .from('room_members')
      .select('user_id, github_username')
      .eq('room_id', id)
      .in('user_id', triagerIds.length > 0 ? triagerIds : ['_none_']),
    supabase
      .from('issues_cache')
      .select('github_issue_number, title')
      .eq('room_id', id)
      .in('github_issue_number', issueNumbers.length > 0 ? issueNumbers : [-1]),
  ])

  const usernameMap = new Map(
    (members || []).map((m) => [m.user_id, m.github_username])
  )
  const issueTitleMap = new Map(
    (issues || []).map((i) => [i.github_issue_number, i.title])
  )

  const proposalsWithTriager = (proposals || []).map((p) => ({
    ...p,
    triager_username: usernameMap.get(p.created_by) || null,
    issue_title: issueTitleMap.get(p.github_issue_number) || null,
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Proposal Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Review and apply triage proposals from your volunteers
        </p>
      </div>

      <ProposalList
        proposals={proposalsWithTriager}
        roomId={id}
        isMaintainer={true}
      />
    </div>
  )
}
