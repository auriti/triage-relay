'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Dati aggregati per singolo triager nella leaderboard
interface LeaderboardEntry {
  github_username: string | null
  total: number
  applied: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
}

export function Leaderboard({ entries }: LeaderboardProps) {
  // Stato vuoto — nessuna attività nella room
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">Nessuna attività ancora</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <div
          key={entry.github_username || i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          {/* Posizione in classifica */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {i + 1}
          </span>

          {/* Avatar con iniziale del nome utente */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {(entry.github_username || '?')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Nome utente GitHub */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {entry.github_username || 'Anonimo'}
            </p>
          </div>

          {/* Contatori: proposte totali e applicate */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{entry.total} proposte</span>
            <span className="text-emerald-500">{entry.applied} applicate</span>
          </div>
        </div>
      ))}
    </div>
  )
}
