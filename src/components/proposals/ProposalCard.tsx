'use client'

import { memo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ProposalActions } from './ProposalActions'
import { AIBriefCard } from '@/components/triage/AIBriefCard'
import { formatDate } from '@/lib/utils'
import type { Proposal, ProposalWithTriager } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  applied: 'bg-primary/20 text-primary',
  rejected: 'bg-destructive/20 text-destructive',
}

const KIND_LABELS: Record<string, string> = {
  label: 'Add Labels',
  comment: 'Post Comment',
  duplicate: 'Duplicate',
  needs_info: 'Needs Info',
}

interface ProposalCardProps {
  proposal: (Proposal | ProposalWithTriager) & { issue_title?: string }
  roomId: string
  isMaintainer: boolean
}

// Componente interno separato per permettere a React.memo di fare un
// confronto shallow delle props ed evitare re-render non necessari.
function ProposalCardComponent({ proposal, roomId, isMaintainer }: ProposalCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const payload = proposal.payload as Record<string, unknown>
  const triagerUsername = 'triager_username' in proposal ? proposal.triager_username : null
  const issueTitle = 'issue_title' in proposal ? (proposal.issue_title as string) : null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border bg-card">
        <CollapsibleTrigger
          className="w-full text-left"
          aria-label={`Expand proposal for issue #${proposal.github_issue_number}`}
        >
          {/*
            Fix responsive: flex-wrap permette agli elementi dell'header di
            andare a capo su mobile invece di andare fuori dallo schermo.
            Il trigger occupa tutta la larghezza disponibile (w-full).
          */}
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 w-full">
              {/* Gruppo sinistro: numero issue, titolo e badge tipo/stato */}
              <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                <span className="text-sm font-medium text-primary shrink-0">
                  #{proposal.github_issue_number}
                </span>
                {issueTitle && (
                  <span className="truncate text-sm text-foreground/80 min-w-0">
                    {issueTitle}
                  </span>
                )}
                <Badge variant="outline" className="text-xs shrink-0">
                  {KIND_LABELS[proposal.kind] || proposal.kind}
                </Badge>
                <Badge className={`text-xs shrink-0 ${STATUS_COLORS[proposal.status]}`}>
                  {proposal.status}
                </Badge>
              </div>
              {/* Gruppo destro: triager, data e chevron — si sposta sotto su mobile */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto shrink-0">
                {triagerUsername && (
                  <span className="flex items-center gap-1.5 text-foreground font-medium">
                    {/* Avatar GitHub del triager */}
                    <img
                      src={`https://github.com/${triagerUsername}.png?size=40`}
                      alt={`Avatar di ${triagerUsername}`}
                      className="h-5 w-5 rounded-full"
                    />
                    @{triagerUsername}
                  </span>
                )}
                <span suppressHydrationWarning>{formatDate(proposal.created_at)}</span>
                {/* Indicatore espandibile */}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-2 text-sm text-muted-foreground">
              {Array.isArray(payload.labels) && (
                <div className="flex flex-wrap gap-1">
                  {(payload.labels as string[]).map((label: string) => (
                    <Badge key={label} variant="secondary" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
              {typeof payload.comment === 'string' && (
                <p className="line-clamp-1 text-xs">
                  {String(payload.comment)}
                </p>
              )}
              {typeof payload.duplicate_of === 'number' && (
                <p className="text-xs">
                  Duplicate of #{String(payload.duplicate_of)}
                </p>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* AI Brief completo */}
            {proposal.ai_brief && (
              <AIBriefCard brief={proposal.ai_brief as import('@/types/triage').TriageBrief} />
            )}

            {/* Commento proposto */}
            {typeof payload.comment === 'string' && (
              <div>
                <h5 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Proposed Comment
                </h5>
                <div className="rounded-lg bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {String(payload.comment)}
                </div>
              </div>
            )}

            {/* Azioni maintainer */}
            {isMaintainer && proposal.status === 'pending' && (
              <ProposalActions proposal={proposal} roomId={roomId} />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// Esporta il componente wrappato con memo: React salterà il re-render
// se proposal, roomId e isMaintainer non sono cambiati (confronto shallow).
export const ProposalCard = memo(ProposalCardComponent)
