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

  // Verifica se l'issue è già claimata da qualcun altro (e non scaduta)
  const { data: issue } = await supabase
    .from('issues_cache')
    .select('claimed_by, claimed_at')
    .eq('room_id', roomId)
    .eq('github_issue_number', issueNumber)
    .single()

  if (!issue) throw new Error('Issue not found')

  if (issue.claimed_by && issue.claimed_by !== user.id) {
    const claimedAt = new Date(issue.claimed_at!).getTime()
    const now = Date.now()
    if (now - claimedAt < CLAIM_EXPIRY_MS) {
      throw new Error('Issue already claimed by another triager')
    }
    // Claim scaduto — lo sovrascriviamo
  }

  const { error } = await supabase
    .from('issues_cache')
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
    })
    .eq('room_id', roomId)
    .eq('github_issue_number', issueNumber)

  if (error) throw new Error(error.message)

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
