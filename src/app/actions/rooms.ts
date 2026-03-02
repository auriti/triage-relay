'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_LABELS } from '@/lib/constants'
import type { Room, RoomWithMembership } from '@/types/database'

// Crea una nuova room e auto-join come maintainer
export async function createRoom(repoFullName: string, labels: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Pulisci input — accetta sia "owner/repo" che URL GitHub
  let cleanInput = repoFullName.trim()
  if (cleanInput.startsWith('http')) {
    const match = cleanInput.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
    if (match) cleanInput = `${match[1]}/${match[2]}`
  }

  const [repo_owner, repo_name] = cleanInput.split('/').map(s => s.trim())
  if (!repo_owner || !repo_name || repo_name.includes(' ')) {
    throw new Error('Invalid format. Use owner/repo (e.g. facebook/react)')
  }

  // Crea la room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      repo_owner,
      repo_name,
      display_name: `${repo_owner}/${repo_name}`,
      created_by: user.id,
      labels: labels.length > 0 ? labels : DEFAULT_LABELS,
    })
    .select()
    .single()

  if (roomError) {
    if (roomError.code === '23505') throw new Error('A room for this repository already exists')
    throw new Error('Failed to create room. Please try again.')
  }

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

// Aggiorna le label di una room (solo maintainer/creatore)
export async function updateRoomLabels(roomId: string, labels: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verifica che l'utente sia il creatore della room
  const { data: room } = await supabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .single()

  if (!room || room.created_by !== user.id) {
    throw new Error('Only the room creator can update settings')
  }

  const { error } = await supabase
    .from('rooms')
    .update({ labels })
    .eq('id', roomId)

  if (error) throw new Error(error.message)

  revalidatePath(`/room/${roomId}`)
}

// Lista membri di una room (solo maintainer)
export async function getRoomMembers(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'maintainer') {
    throw new Error('Only maintainers can view members')
  }

  const { data: members } = await supabase
    .from('room_members')
    .select('user_id, role, github_username, joined_at')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  return members || []
}

// Rimuovi un membro dalla room (solo creatore)
export async function removeMember(roomId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: room } = await supabase
    .from('rooms')
    .select('created_by')
    .eq('id', roomId)
    .single()

  if (!room || room.created_by !== user.id) {
    throw new Error('Only the room creator can remove members')
  }

  if (userId === user.id) {
    throw new Error('Cannot remove yourself')
  }

  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath(`/room/${roomId}`)
  revalidatePath(`/room/${roomId}/settings`)
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

  // Fetch conteggio proposte pending e issue cachate per room
  const [{ data: proposals }, { data: issuesCount }] = await Promise.all([
    supabase
      .from('proposals')
      .select('room_id')
      .in('room_id', roomIds)
      .eq('status', 'pending'),
    supabase
      .from('issues_cache')
      .select('room_id')
      .in('room_id', roomIds)
      .eq('state', 'open'),
  ])

  const pendingCount: Record<string, number> = {}
  proposals?.forEach((p) => {
    pendingCount[p.room_id] = (pendingCount[p.room_id] || 0) + 1
  })

  const issueCountMap: Record<string, number> = {}
  issuesCount?.forEach((i) => {
    issueCountMap[i.room_id] = (issueCountMap[i.room_id] || 0) + 1
  })

  return rooms.map((room) => {
    const membership = memberships.find((m) => m.room_id === room.id)
    return {
      ...room,
      role: membership?.role || 'triager',
      pending_proposals: pendingCount[room.id] || 0,
      issue_count: issueCountMap[room.id] || 0,
    } as RoomWithMembership
  })
}
