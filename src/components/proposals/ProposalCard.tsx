'use client'

import { useState } from 'react'
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
import type { Proposal } from '@/types/database'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-primary/20 text-primary',
  rejected: 'bg-destructive/20 text-destructive',
  applied: 'bg-orange-500/20 text-orange-500',
}

const KIND_LABELS: Record<string, string> = {
  label: 'Add Labels',
  comment: 'Post Comment',
  duplicate: 'Duplicate',
  needs_info: 'Needs Info',
}

interface ProposalCardProps {
  proposal: Proposal
  roomId: string
  isMaintainer: boolean
}

export function ProposalCard({ proposal, roomId, isMaintainer }: ProposalCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const payload = proposal.payload as Record<string, unknown>

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border bg-card">
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  #{proposal.github_issue_number}
                </span>
                <Badge variant="outline" className="text-xs">
                  {KIND_LABELS[proposal.kind] || proposal.kind}
                </Badge>
                <Badge className={`text-xs ${STATUS_COLORS[proposal.status]}`}>
                  {proposal.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(proposal.created_at)}
              </span>
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
