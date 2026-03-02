// Settings page — gestione room (solo maintainer)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoomSettings } from '@/components/rooms/RoomSettings'
import { getRoomMembers } from '@/app/actions/rooms'

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Auth e membership già verificate dal parent layout
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verifica ruolo maintainer
  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', id)
    .eq('user_id', user!.id)
    .single()

  if (!member || member.role !== 'maintainer') {
    redirect(`/room/${id}`)
  }

  // Fetch room e membri in parallelo
  const [{ data: room }, members] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', id).single(),
    getRoomMembers(id),
  ])

  if (!room) redirect(`/room/${id}`)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Room Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage labels, members, and room configuration
        </p>
      </div>

      <RoomSettings
        room={room}
        members={members}
        currentUserId={user!.id}
      />
    </div>
  )
}
