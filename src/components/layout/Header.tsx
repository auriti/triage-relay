'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@supabase/supabase-js'

export function Header({ user }: { user: User }) {
  const router = useRouter()
  const meta = user.user_metadata
  const username = meta?.user_name || meta?.preferred_username || 'User'
  const avatarUrl = meta?.avatar_url

  async function handleLogout() {
    // Logout via server route — cancella cookie httpOnly gh_token
    await fetch('/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-foreground">
            <span className="text-primary text-lg">&#9670;</span>
            Triage Relay
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger suppressHydrationWarning className="flex items-center gap-2.5 rounded-full border border-transparent px-1.5 py-1 transition-colors hover:border-border hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="pr-1 text-sm text-muted-foreground">{username}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium">{username}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
