'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CopyJoinLink } from '@/components/rooms/CopyJoinLink'
import type { Room } from '@/types/database'

interface MobileNavProps {
  room: Room
  role: string
  pendingCount: number
  stats?: {
    issues: number
    applied: number
    rejected: number
  }
}

export function MobileNav({ room, role, pendingCount, stats }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const labels = (room.labels as string[]) || []

  return (
    <div className="lg:hidden">
      {/* Barra mobile fissa in basso */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="flex items-center justify-around py-2">
          <Link
            href={`/room/${room.id}`}
            className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-[10px] font-medium">Issues</span>
          </Link>

          {role === 'maintainer' ? (
            <Link
              href={`/room/${room.id}/proposals`}
              className="relative flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
              </svg>
              <span className="text-[10px] font-medium">Proposals</span>
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href={`/room/${room.id}/my-proposals`}
              className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
              </svg>
              <span className="text-[10px] font-medium">My Proposals</span>
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-0.5 px-4 py-1 text-muted-foreground transition-colors hover:text-foreground">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span className="text-[10px] font-medium">Info</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <span className="text-primary">&#9670;</span>
                  {room.repo_owner}/{room.repo_name}
                </SheetTitle>
              </SheetHeader>

              <div className="flex h-[calc(100%-4rem)] flex-col p-5">
                {/* Badge ruolo */}
                <span className={`mb-5 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  role === 'maintainer'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {role}
                </span>

                {/* Stats */}
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

                {/* Footer */}
                <div className="mt-auto border-t border-border pt-4">
                  {role === 'maintainer' && (
                    <CopyJoinLink roomId={room.id} />
                  )}
                  <p className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Room ID
                  </p>
                  <code className="block rounded-md bg-card px-2 py-1.5 text-[10px] text-muted-foreground break-all leading-relaxed">
                    {room.id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full text-xs"
                    asChild
                  >
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer per evitare che il contenuto finisca sotto la bottom bar */}
      <div className="h-16 lg:hidden" />
    </div>
  )
}
