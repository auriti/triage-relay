'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProposalCard } from './ProposalCard'
import type { Proposal, ProposalWithTriager, ProposalStatus } from '@/types/database'

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all'

interface ProposalListProps {
  proposals: (Proposal | ProposalWithTriager)[]
  roomId: string
  isMaintainer: boolean
}

export function ProposalList({ proposals, roomId, isMaintainer }: ProposalListProps) {
  const [filter, setFilter] = useState<FilterTab>('pending')

  const filtered =
    filter === 'all'
      ? proposals
      : proposals.filter((p) => p.status === filter)

  const pendingCount = proposals.filter((p) => p.status === 'pending').length

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            {filter === 'pending'
              ? 'No proposals pending. Your triage volunteers are probably sleeping.'
              : `No ${filter} proposals.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              roomId={roomId}
              isMaintainer={isMaintainer}
            />
          ))}
        </div>
      )}
    </div>
  )
}
