'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Room, RoomWithMembership } from '@/types/database'

// Crea una nuova room e auto-join come maintainer
export async function createRoom(repoFullName: string, labels: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const [repo_owner, repo_name] = repoFullName.trim().split('/').map(s => s.trim())
  if (!repo_owner || !repo_name) throw new Error('Invalid repo format. Use owner/repo')

  // Crea la room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      repo_owner,
      repo_name,
      display_name: repoFullName,
      created_by: user.id,
      labels: labels.length > 0 ? labels : [
        'bug', 'enhancement', 'feature', 'question', 'needs-info', 'duplicate',
        'wontfix', 'good first issue', 'help wanted', 'documentation', 'performance',
        'security', 'breaking change', 'regression', 'stale',
      ],
    })
    .select()
    .single()

  if (roomError) throw new Error(roomError.message)

  // Auto-join come maintainer
  const { error: memberError } = await supabase
    .from('room_members')
    .insert({
      room_id: room.id,
      user_id: user.id,
      role: 'maintainer',
      github_username: user.user_metadata?.user_name || null,
    })

  if (memberError) throw new Error(memberError.message)

  revalidatePath('/dashboard')
  return room as Room
}

// Join a una room pubblica come triager
export async function joinRoom(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verifica che la room esista e sia pubblica
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, is_public')
    .eq('id', roomId)
    .single()

  if (roomError || !room) throw new Error('Room not found')
  if (!room.is_public) throw new Error('Room is private')

  const { error } = await supabase
    .from('room_members')
    .insert({
      room_id: roomId,
      user_id: user.id,
      role: 'triager',
      github_username: user.user_metadata?.user_name || null,
    })

  if (error) {
    if (error.code === '23505') throw new Error('Already a member of this room')
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}

// Recupera le room dell'utente con ruolo e stats
export async function getUserRooms(): Promise<RoomWithMembership[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch membership
  const { data: memberships } = await supabase
    .from('room_members')
    .select('room_id, role')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return []

  const roomIds = memberships.map((m) => m.room_id)

  // Fetch rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .in('id', roomIds)

  if (!rooms) return []

  // Fetch conteggio proposte pending per room
  const { data: proposals } = await supabase
    .from('proposals')
    .select('room_id')
    .in('room_id', roomIds)
    .eq('status', 'pending')

  const pendingCount: Record<string, number> = {}
  proposals?.forEach((p) => {
    pendingCount[p.room_id] = (pendingCount[p.room_id] || 0) + 1
  })

  return rooms.map((room) => {
    const membership = memberships.find((m) => m.room_id === room.id)
    return {
      ...room,
      role: membership?.role || 'triager',
      pending_proposals: pendingCount[room.id] || 0,
    } as RoomWithMembership
  })
}
