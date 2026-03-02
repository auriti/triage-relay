'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Claim un'issue per la triage — delega alla RPC claim_issue (SECURITY DEFINER).
// La RPC aggiorna SOLO claimed_by e claimed_at; nessun UPDATE generico via client.
export async function claimIssue(roomId: string, issueNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // La RPC gestisce internamente: verifica membership, controllo claim attivo,
  // aggiornamento atomico dei soli campi claim.
  const { error } = await supabase.rpc('claim_issue', {
    p_room_id:      roomId,
    p_issue_number: issueNumber,
  })

  if (error) {
    // Mappa il messaggio PostgreSQL in errore leggibile dal frontend
    if (error.message.includes('già in carico')) {
      throw new Error('Issue already claimed by another triager')
    }
    if (error.message.includes('membro')) {
      throw new Error('Not a member of this room')
    }
    throw new Error(error.message)
  }

  revalidatePath(`/room/${roomId}`)
}

// Rilascia il claim su un'issue — delega alla RPC release_issue_claim (SECURITY DEFINER).
// La RPC rilascia il claim SOLO se il chiamante ne è il proprietario.
export async function releaseIssueClaim(roomId: string, issueNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.rpc('release_issue_claim', {
    p_room_id:      roomId,
    p_issue_number: issueNumber,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/room/${roomId}`)
}
