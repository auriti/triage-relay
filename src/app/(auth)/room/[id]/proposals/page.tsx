// Proposals page — inbox proposte (solo maintainer)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProposalList } from '@/components/proposals/ProposalList'
import type { Proposal } from '@/types/database'

export default async function ProposalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica ruolo maintainer
  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', id)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'maintainer') {
    redirect(`/room/${id}`)
  }

  // Fetch proposte
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Proposal Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Review and apply triage proposals from your volunteers
        </p>
      </div>

      <ProposalList
        proposals={(proposals || []) as Proposal[]}
        roomId={id}
        isMaintainer={true}
      />
    </div>
  )
}
