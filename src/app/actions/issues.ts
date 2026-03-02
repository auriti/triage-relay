'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Durata massima di un claim (30 minuti)
const CLAIM_EXPIRY_MS = 30 * 60 * 1000

// Claim un'issue per la triage — evita lavoro duplicato
export async function claimIssue(roomId: string, issueNumber: number) {
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

  // Update atomico — claim solo se unclaimed, già nostro, o scaduto (evita race condition TOCTOU)
  const expiryTs = new Date(Date.now() - CLAIM_EXPIRY_MS).toISOString()

  const { data: updated, error } = await supabase
    .from('issues_cache')
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('github_issue_number', issueNumber)
    .or(`claimed_by.is.null,claimed_by.eq.${user.id},claimed_at.lt.${expiryTs}`)
    .select('id')

  if (error) throw new Error(error.message)

  // Se nessuna riga aggiornata → qualcun altro tiene il claim valido
  if (!updated || updated.length === 0) {
    throw new Error('Issue already claimed by another triager')
  }

  revalidatePath(`/room/${roomId}`)
}

// Rilascia il claim su un'issue
export async function releaseIssueClaim(roomId: string, issueNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('issues_cache')
    .update({
      claimed_by: null,
      claimed_at: null,
    })
    .eq('room_id', roomId)
    .eq('github_issue_number', issueNumber)
    .eq('claimed_by', user.id) // Solo il proprietario può rilasciare

  if (error) throw new Error(error.message)

  revalidatePath(`/room/${roomId}`)
}
