'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProposalCard } from './ProposalCard'
import type { Proposal, ProposalWithTriager, ProposalStatus } from '@/types/database'

type FilterTab = 'pending' | 'applied' | 'rejected' | 'all'

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
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          {filter === 'pending' ? (
            <>
              <svg className="mb-3 h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
              </svg>
              <p className="text-sm font-medium text-muted-foreground">Inbox empty</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
                No pending proposals. Your triage volunteers are probably sleeping.
              </p>
            </>
          ) : filter === 'applied' ? (
            <>
              <svg className="mb-3 h-10 w-10 text-primary/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-medium text-muted-foreground">No applied proposals yet</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
                Approved proposals that have been applied to GitHub will appear here.
              </p>
            </>
          ) : filter === 'rejected' ? (
            <>
              <svg className="mb-3 h-10 w-10 text-destructive/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-medium text-muted-foreground">No rejected proposals</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
                Rejected proposals will appear here for reference.
              </p>
            </>
          ) : (
            <>
              <svg className="mb-3 h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-sm font-medium text-muted-foreground">No proposals found</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
                Proposals from triage volunteers will appear here.
              </p>
            </>
          )}
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
