import Link from 'next/link'
import type { RoomWithMembership } from '@/types/database'

export function RoomCard({ room }: { room: RoomWithMembership }) {
  return (
    <Link href={`/room/${room.id}`}>
      <div className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:bg-card-hover cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              <h3 className="truncate text-sm font-semibold group-hover:text-foreground">
                {room.repo_owner}/{room.repo_name}
              </h3>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            room.role === 'maintainer'
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary text-muted-foreground'
          }`}>
            {room.role}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {room.pending_proposals !== undefined && room.pending_proposals > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              {room.pending_proposals} pending
            </span>
          )}
          {room.issue_count !== undefined && room.issue_count > 0 && (
            <span className="flex items-center gap-1.5">
              <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {room.issue_count} issues
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            {(room.labels as string[])?.length || 0} labels
          </span>
        </div>

        {/* Arrow hint */}
        <div className="mt-3 flex items-center text-xs text-muted-foreground/50 group-hover:text-primary transition-colors">
          Open room
          <svg aria-hidden="true" className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
