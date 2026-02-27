import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CopyJoinLink } from '@/components/rooms/CopyJoinLink'
import type { Room } from '@/types/database'

interface SidebarProps {
  room: Room
  role: string
  pendingCount: number
  stats?: {
    issues: number
    applied: number
    rejected: number
  }
}

export function Sidebar({ room, role, pendingCount, stats }: SidebarProps) {
  const labels = (room.labels as string[]) || []

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-border bg-background p-5 lg:block">
      <div className="flex h-full flex-col">
        {/* Info room */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            <h2 className="truncate text-sm font-semibold">
              {room.repo_owner}/{room.repo_name}
            </h2>
          </div>
          <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            role === 'maintainer'
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-muted-foreground'
          }`}>
            {role}
          </span>
        </div>

        {/* Navigazione */}
        <nav className="mb-5 space-y-0.5">
          <Link
            href={`/room/${room.id}`}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Issues
          </Link>
          {role === 'maintainer' && (
            <Link
              href={`/room/${room.id}/proposals`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
                </svg>
                Proposals
              </span>
              {pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Divider */}
        <div className="mb-4 border-t border-border" />

        {/* Statistiche triage */}
        {stats && (
          <div className="mb-5">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Stats
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md bg-card p-2 text-center">
                <p className="text-lg font-bold text-foreground">{stats.issues}</p>
                <p className="text-[10px] text-muted-foreground">Issues</p>
              </div>
              <div className="rounded-md bg-card p-2 text-center">
                <p className="text-lg font-bold text-warning">{pendingCount}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-md bg-card p-2 text-center">
                <p className="text-lg font-bold text-primary">{stats.applied}</p>
                <p className="text-[10px] text-muted-foreground">Applied</p>
              </div>
              <div className="rounded-md bg-card p-2 text-center">
                <p className="text-lg font-bold text-destructive">{stats.rejected}</p>
                <p className="text-[10px] text-muted-foreground">Rejected</p>
              </div>
            </div>
          </div>
        )}

        {/* Labels */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Labels ({labels.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <Badge key={label} variant="outline" className="text-[10px] font-normal">
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Invita + Room ID — in fondo */}
        <div className="mt-auto">
          <div className="border-t border-border pt-4">
            {role === 'maintainer' && (
              <CopyJoinLink roomId={room.id} />
            )}
            <p className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Room ID
            </p>
            <code className="block rounded-md bg-card px-2 py-1.5 text-[10px] text-muted-foreground break-all leading-relaxed">
              {room.id}
            </code>
          </div>
        </div>
      </div>
    </aside>
  )
}
