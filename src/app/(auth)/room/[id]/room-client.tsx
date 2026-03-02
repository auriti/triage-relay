'use client'

import { useState } from 'react'
import { IssueList } from '@/components/issues/IssueList'
import { TriagePanel } from '@/components/triage/TriagePanel'
import { Leaderboard } from '@/components/rooms/Leaderboard'
import { claimIssue, releaseIssueClaim } from '@/app/actions/issues'
import { toast } from 'sonner'
import type { IssueCache, CannedResponse } from '@/types/database'

// Struttura dati per ogni riga della leaderboard
interface LeaderboardEntry {
  github_username: string | null
  total: number
  applied: number
}

interface RoomClientProps {
  roomId: string
  initialIssues: IssueCache[]
  roomLabels: string[]
  cannedResponses: CannedResponse[]
  pendingProposalIssues: number[]
  userPendingIssues: number[]
  currentUserId: string
  role: string
  leaderboard: LeaderboardEntry[]
}

export function RoomClient({
  roomId,
  initialIssues,
  roomLabels,
  cannedResponses,
  pendingProposalIssues,
  userPendingIssues,
  currentUserId,
  role,
  leaderboard,
}: RoomClientProps) {
  const [selectedIssue, setSelectedIssue] = useState<IssueCache | null>(null)
  const [localPendingIssues, setLocalPendingIssues] = useState(pendingProposalIssues)
  const [localUserPending, setLocalUserPending] = useState(userPendingIssues)

  function handleSelectIssue(issue: IssueCache | null) {
    // Rilascia claim sull'issue precedente (fire-and-forget, non blocca UI)
    if (selectedIssue && (!issue || issue.github_issue_number !== selectedIssue.github_issue_number)) {
      releaseIssueClaim(roomId, selectedIssue.github_issue_number).catch(() => {})
    }

    // Mostra immediatamente il panel senza attendere il claim
    setSelectedIssue(issue)

    // Claim in background (fire-and-forget) — non blocca l'apertura del panel
    if (issue) {
      claimIssue(roomId, issue.github_issue_number).catch((err) => {
        if (err instanceof Error && err.message.includes('already claimed')) {
          toast.warning('This issue is being triaged by another volunteer')
        }
      })
    }
  }

  function handleClose() {
    if (selectedIssue) {
      releaseIssueClaim(roomId, selectedIssue.github_issue_number).catch(() => {})
    }
    setSelectedIssue(null)
  }

  function handleProposalSubmitted() {
    if (selectedIssue) {
      const num = selectedIssue.github_issue_number
      setLocalPendingIssues(prev => [...new Set([...prev, num])])
      setLocalUserPending(prev => [...new Set([...prev, num])])
    }
    handleClose()
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
        pendingProposalIssues={localPendingIssues}
        onSelectIssue={handleSelectIssue}
        selectedIssueNumber={selectedIssue?.github_issue_number ?? null}
        currentUserId={currentUserId}
      />

      {/* Pannello leaderboard — visibile solo se ci sono proposte nella room */}
      {leaderboard.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Top Contributors</h2>
          <Leaderboard entries={leaderboard} />
        </div>
      )}

      {/* Pannello triage — Sheet laterale */}
      <TriagePanel
        issue={selectedIssue}
        roomId={roomId}
        roomLabels={roomLabels}
        cannedResponses={cannedResponses}
        onClose={handleClose}
        onProposalSubmitted={handleProposalSubmitted}
        hasExistingProposal={selectedIssue ? localUserPending.includes(selectedIssue.github_issue_number) : false}
      />
    </div>
  )
}
