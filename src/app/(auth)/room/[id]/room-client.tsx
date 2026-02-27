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
  currentUserId: string
}

export function RoomClient({
  roomId,
  initialIssues,
  roomLabels,
  pendingProposalIssues,
  currentUserId,
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
      />
    </div>
  )
}
