// Layout della room — fetch dati room e verifica membership
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  // Next.js 16: params è Promise
  const { id } = await params

  // Auth già verificata dal parent (auth)/layout.tsx
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch room
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single()

  if (!room) redirect('/dashboard')

  // Fetch membership e ruolo
  const { data: member } = await supabase
    .from('room_members')
    .select('role')
    .eq('room_id', id)
    .eq('user_id', user!.id)
    .single()

  if (!member) redirect('/dashboard')

  // Conta proposte per stato e issue cachate
  const [
    { count: pendingCount },
    { count: appliedCount },
    { count: rejectedCount },
    { count: issueCount },
  ] = await Promise.all([
    supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('room_id', id).eq('status', 'pending'),
    supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('room_id', id).eq('status', 'applied'),
    supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('room_id', id).eq('status', 'rejected'),
    supabase.from('issues_cache').select('id', { count: 'exact', head: true }).eq('room_id', id).eq('state', 'open'),
  ])

  return (
    <div className="flex">
      <Sidebar
        room={room}
        role={member.role}
        pendingCount={pendingCount || 0}
        stats={{
          issues: issueCount || 0,
          applied: appliedCount || 0,
          rejected: rejectedCount || 0,
        }}
      />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
