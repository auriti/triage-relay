'use client'

import { useState, useEffect, useCallback } from 'react'
import { IssueCard } from './IssueCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { IssueCache } from '@/types/database'

type FilterTab = 'all' | 'unlabeled' | 'most_commented'

interface IssueListProps {
  roomId: string
  initialIssues: IssueCache[]
  pendingProposalIssues: number[]
  onSelectIssue: (issue: IssueCache | null) => void
  selectedIssueNumber: number | null
  currentUserId?: string
}

export function IssueList({
  roomId,
  initialIssues,
  pendingProposalIssues,
  onSelectIssue,
  selectedIssueNumber,
  currentUserId,
}: IssueListProps) {
  const [issues, setIssues] = useState<IssueCache[]>(initialIssues)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  const syncIssues = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/github/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to sync issues')
        return
      }

      setIssues(data.issues)
      setLastSynced(data.synced_at)

      if (data.cached) {
        toast.info(`${data.issues.length} issues from cache`)
      } else {
        toast.success(`Synced ${data.issues.length} issues from GitHub`)
      }
    } catch {
      toast.error('Failed to sync issues')
    } finally {
      setSyncing(false)
    }
  }, [roomId])

  // Sync all'apertura se non ci sono issue iniziali
  useEffect(() => {
    if (initialIssues.length === 0) {
      syncIssues()
    }
  }, [initialIssues.length, syncIssues])

  // Filtri
  const filteredIssues = issues.filter((issue) => {
    const labels = (issue.labels as string[]) || []
    if (filter === 'unlabeled') return labels.length === 0
    return true
  })

  // Ordina per commenti se filtro "most_commented"
  const sortedIssues =
    filter === 'most_commented'
      ? [...filteredIssues].sort((a, b) => b.comments_count - a.comments_count)
      : filteredIssues

  // Conteggi per i tab
  const unlabeledCount = issues.filter((i) => ((i.labels as string[]) || []).length === 0).length

  if (syncing && issues.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header: filtri + sync */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList className="bg-card">
            <TabsTrigger value="all" className="text-xs">
              All{issues.length > 0 ? ` (${issues.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="unlabeled" className="text-xs">
              Unlabeled{unlabeledCount > 0 ? ` (${unlabeledCount})` : ''}
            </TabsTrigger>
            <TabsTrigger value="most_commented" className="text-xs">
              Hot
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {lastSynced && (
            <span className="text-[10px] text-muted-foreground">
              synced {new Date(lastSynced).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={syncIssues}
            disabled={syncing}
            className="h-8 gap-1.5 text-xs"
          >
            <svg
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      </div>

      {/* Lista issue */}
      {sortedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <svg aria-hidden="true" className="mb-3 h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
          <p className="text-sm text-muted-foreground">
            {issues.length === 0
              ? 'No issues cached yet'
              : 'No issues match this filter'}
          </p>
          {issues.length === 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={syncIssues}>
              Sync from GitHub
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isSelected={selectedIssueNumber === issue.github_issue_number}
              onClick={() =>
                onSelectIssue(
                  selectedIssueNumber === issue.github_issue_number ? null : issue
                )
              }
              hasPendingProposal={pendingProposalIssues.includes(issue.github_issue_number)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
