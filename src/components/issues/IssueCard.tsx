'use client'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { IssueCache } from '@/types/database'

interface IssueCardProps {
  issue: IssueCache
  isSelected: boolean
  onClick: () => void
  hasPendingProposal?: boolean
}

export function IssueCard({ issue, isSelected, onClick, hasPendingProposal }: IssueCardProps) {
  const labels = (issue.labels as string[]) || []

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-lg border p-4 text-left transition-all duration-150 ${
        isSelected
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/20 hover:bg-card-hover'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Header: numero + badge */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-primary/70">
              #{issue.github_issue_number}
            </span>
            {hasPendingProposal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                <span className="h-1 w-1 rounded-full bg-warning" />
                Pending
              </span>
            )}
          </div>

          {/* Titolo */}
          <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug group-hover:text-foreground">
            {issue.title}
          </h3>

          {/* Meta: autore, data, commenti */}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {issue.author_login && (
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground/70">@</span>
                {issue.author_login}
              </span>
            )}
            {issue.created_at && <span>{formatDate(issue.created_at)}</span>}
            {issue.comments_count > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                {issue.comments_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label}
              className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
