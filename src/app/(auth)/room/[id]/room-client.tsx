'use client'

import { useState } from 'react'
import { IssueList } from '@/components/issues/IssueList'
import { TriagePanel } from '@/components/triage/TriagePanel'
import type { IssueCache } from '@/types/database'

interface RoomClientProps {
  roomId: string
  initialIssues: IssueCache[]
  roomLabels: string[]
  pendingProposalIssues: number[]
}

export function RoomClient({
  roomId,
  initialIssues,
  roomLabels,
  pendingProposalIssues,
}: RoomClientProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueCache | null>(null)

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
        onSelectIssue={setSelectedIssue}
        selectedIssueNumber={selectedIssue?.github_issue_number ?? null}
      />

      {/* Pannello triage — Sheet laterale */}
      <TriagePanel
        issue={selectedIssue}
        roomId={roomId}
        roomLabels={roomLabels}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  )
}
