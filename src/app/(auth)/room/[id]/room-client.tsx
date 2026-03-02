'use client'

import { useState } from 'react'
import { IssueList } from '@/components/issues/IssueList'
import { TriagePanel } from '@/components/triage/TriagePanel'
import { claimIssue, releaseIssueClaim } from '@/app/actions/issues'
import { toast } from 'sonner'
import type { IssueCache } from '@/types/database'

interface RoomClientProps {
  roomId: string
  initialIssues: IssueCache[]
  roomLabels: string[]
  pendingProposalIssues: number[]
  userPendingIssues: number[]
  currentUserId: string
  role: string
}

export function RoomClient({
  roomId,
  initialIssues,
  roomLabels,
  pendingProposalIssues,
  userPendingIssues,
  currentUserId,
  role,
}: RoomClientProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueCache | null>(null)

  async function handleSelectIssue(issue: IssueCache | null) {
    // Rilascia claim sull'issue precedente
    if (selectedIssue && (!issue || issue.github_issue_number !== selectedIssue.github_issue_number)) {
      releaseIssueClaim(roomId, selectedIssue.github_issue_number).catch(() => {
        // Rilascio silenzioso — non bloccare il flusso
      })
    }

    setSelectedIssue(issue)

    // Claim la nuova issue
    if (issue) {
      try {
        await claimIssue(roomId, issue.github_issue_number)
      } catch (err) {
        if (err instanceof Error && err.message.includes('already claimed')) {
          toast.warning('This issue is being triaged by another volunteer')
        }
      }
    }
  }

  function handleClose() {
    if (selectedIssue) {
      releaseIssueClaim(roomId, selectedIssue.github_issue_number).catch(() => {})
    }
    setSelectedIssue(null)
  }

  return (
    <div className="p-6">
      {/* Banner ruolo per triager */}
      {role === 'triager' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">You are a triager.</span>{' '}
            Select an issue, generate an AI brief, and submit proposals for maintainer review.
          </p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold">Issue Backlog</h1>
        <p className="text-sm text-muted-foreground">
          Select an issue to start triaging
        </p>
      </div>

      <IssueList
        roomId={roomId}
        initialIssues={initialIssues}
        pendingProposalIssues={pendingProposalIssues}
        onSelectIssue={handleSelectIssue}
        selectedIssueNumber={selectedIssue?.github_issue_number ?? null}
        currentUserId={currentUserId}
      />

      {/* Pannello triage — Sheet laterale */}
      <TriagePanel
        issue={selectedIssue}
        roomId={roomId}
        roomLabels={roomLabels}
        onClose={handleClose}
        hasExistingProposal={selectedIssue ? userPendingIssues.includes(selectedIssue.github_issue_number) : false}
      />
    </div>
  )
}
