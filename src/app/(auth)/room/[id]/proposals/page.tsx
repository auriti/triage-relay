// Proposals page — inbox proposte (solo maintainer)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProposalList } from '@/components/proposals/ProposalList'
import type { Proposal, ProposalWithTriager } from '@/types/database'

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

  // Fetch proposte con username triager
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: false })

  // Recupera username dei triager dalla tabella room_members
  const triagerIds = [...new Set((proposals || []).map((p) => p.created_by))]
  const { data: members } = await supabase
    .from('room_members')
    .select('user_id, github_username')
    .eq('room_id', id)
    .in('user_id', triagerIds.length > 0 ? triagerIds : ['_none_'])

  const usernameMap = new Map(
    (members || []).map((m) => [m.user_id, m.github_username])
  )

  const proposalsWithTriager: ProposalWithTriager[] = (proposals || []).map((p) => ({
    ...p,
    triager_username: usernameMap.get(p.created_by) || null,
  })) as ProposalWithTriager[]

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
