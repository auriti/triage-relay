'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ProposalKind, ProposalStatus, Proposal } from '@/types/database'
import type { TriageBrief } from '@/types/triage'

// Crea una nuova proposta
export async function createProposal(
  roomId: string,
  issueNumber: number,
  kind: ProposalKind,
  payload: Record<string, unknown>,
  aiBrief: TriageBrief | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verifica membership
  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Not a member of this room')

  // Verifica proposta duplicata — impedisci doppia proposta pending per la stessa issue
  const { data: existing } = await supabase
    .from('proposals')
    .select('id')
    .eq('room_id', roomId)
    .eq('github_issue_number', issueNumber)
    .eq('created_by', user.id)
    .eq('status', 'pending')
    .limit(1)

  if (existing && existing.length > 0) {
    throw new Error('You already have a pending proposal for this issue. Wait for maintainer review before submitting another.')
  }

  const { error } = await supabase.from('proposals').insert({
    room_id: roomId,
    github_issue_number: issueNumber,
    created_by: user.id,
    kind,
    payload,
    ai_brief: aiBrief,
    status: 'pending',
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/room/${roomId}`)
  revalidatePath(`/room/${roomId}/proposals`)
  revalidatePath(`/room/${roomId}/my-proposals`)
}

// Recupera proposte per una room
export async function getProposals(
  roomId: string,
  status?: ProposalStatus
): Promise<Proposal[]> {
  const supabase = await createClient()

  let query = supabase
    .from('proposals')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as Proposal[]
}

// Aggiorna lo stato di una proposta (solo maintainer)
export async function updateProposalStatus(
  proposalId: string,
  status: ProposalStatus,
  roomId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verifica ruolo maintainer
  const { data: proposal } = await supabase
    .from('proposals')
    .select('room_id')
    .eq('id', proposalId)
    .single()

  if (!proposal) throw new Error('Proposal not found')

  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', proposal.room_id)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'maintainer') {
    throw new Error('Only maintainers can update proposals')
  }

  const { error } = await supabase
    .from('proposals')
    .update({
      status,
      decided_at: new Date().toISOString(),
      decided_by: user.id,
    })
    .eq('id', proposalId)

  if (error) throw new Error(error.message)

  revalidatePath(`/room/${roomId}`)
  revalidatePath(`/room/${roomId}/proposals`)
}
