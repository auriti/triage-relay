// Layout della room — fetch dati room e verifica membership
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('repo_owner, repo_name')
    .eq('id', id)
    .single()

  if (!room) return { title: 'Room — Triage Relay' }

  return {
    title: `${room.repo_owner}/${room.repo_name} — Triage Relay`,
  }
}

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

  // Fetch room — select dei soli campi usati da Sidebar e MobileNav
  // per ridurre il payload trasferito da Supabase
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

  const sidebarProps = {
    room,
    role: member.role,
    pendingCount: pendingCount || 0,
    stats: {
      issues: issueCount || 0,
      applied: appliedCount || 0,
      rejected: rejectedCount || 0,
    },
  }

  return (
    <div className="flex">
      <Sidebar {...sidebarProps} />
      <div className="flex-1 overflow-auto pb-16 lg:pb-0">
        {children}
        <MobileNav {...sidebarProps} />
      </div>
    </div>
  )
}
