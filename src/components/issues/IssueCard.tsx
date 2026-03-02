'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { IssueCache } from '@/types/database'

interface IssueCardProps {
  issue: IssueCache
  isSelected: boolean
  onClick: () => void
  hasPendingProposal?: boolean
  currentUserId?: string
}

// Componente interno: la funzione separata consente a React.memo di fare
// un confronto shallow delle props ed evitare re-render inutili quando
// IssueList cambia filter o avvia una sincronizzazione.
function IssueCardComponent({ issue, isSelected, onClick, hasPendingProposal, currentUserId }: IssueCardProps) {
  const labels = (issue.labels as string[]) || []

  // Verifica se il claim è ancora valido (30 min)
  const isClaimActive = issue.claimed_by && issue.claimed_at &&
    (Date.now() - new Date(issue.claimed_at).getTime()) < 30 * 60 * 1000
  const isClaimedByMe = isClaimActive && issue.claimed_by === currentUserId

  return (
    <button
      onClick={onClick}
      aria-label={`Issue #${issue.github_issue_number}: ${issue.title}`}
      className={`group w-full rounded-lg border p-4 text-left transition-all duration-150 ${
        isSelected
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:border-primary/20 hover:bg-card-hover'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar autore */}
        {issue.author_login && (
          <img
            src={`https://github.com/${issue.author_login}.png?size=40`}
            alt={issue.author_login}
            className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-muted"
            loading="lazy"
          />
        )}
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
            {isClaimActive && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isClaimedByMe
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                <span className={`h-1 w-1 rounded-full ${isClaimedByMe ? 'bg-primary' : 'bg-muted-foreground'}`} />
                {isClaimedByMe
                  ? 'You'
                  : issue.claimed_by_username
                    ? `@${issue.claimed_by_username}`
                    : 'Claimed'}
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
            {issue.created_at && (
              <span suppressHydrationWarning>{formatDate(issue.created_at)}</span>
            )}
            {issue.comments_count > 0 && (
              <span className="flex items-center gap-1">
                <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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

// Esporta il componente wrappato con memo: evita re-render quando le props
// non cambiano (confronto shallow per riferimento).
export const IssueCard = memo(IssueCardComponent)
