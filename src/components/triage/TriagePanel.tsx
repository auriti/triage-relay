'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AIBriefCard } from './AIBriefCard'
import { ProposalForm } from './ProposalForm'
import { toast } from 'sonner'
import type { IssueCache } from '@/types/database'
import type { TriageBrief } from '@/types/triage'

interface TriagePanelProps {
  issue: IssueCache | null
  roomId: string
  roomLabels: string[]
  onClose: () => void
}

export function TriagePanel({ issue, roomId, roomLabels, onClose }: TriagePanelProps) {
  const [brief, setBrief] = useState<TriageBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateBrief() {
    if (!issue) return
    setLoading(true)
    setError(null)
    setBrief(null)

    try {
      const res = await fetch('/api/triage-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueTitle: issue.title,
          issueBody: issue.body || '',
          roomId,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate brief')
        toast.error(data.error || 'AI brief generation failed')
        return
      }

      setBrief(data.brief)
    } catch {
      setError('AI service unavailable. You can still triage manually.')
      toast.error('AI service unavailable')
    } finally {
      setLoading(false)
    }
  }

  // Reset quando si cambia issue
  if (!issue) {
    if (brief) setBrief(null)
    return null
  }

  return (
    <Sheet open={!!issue} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[60vw] overflow-hidden p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-muted-foreground">#{issue.github_issue_number}</span>
            <span className="line-clamp-1">{issue.title}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            {/* Colonna sinistra: contenuto issue */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {issue.author_login && <span>@{issue.author_login}</span>}
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {issue.body || 'No description provided.'}
                </pre>
              </div>
            </div>

            {/* Colonna destra: brief AI + form proposta */}
            <div className="space-y-4">
              <Button
                onClick={generateBrief}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-orange-600"
                size="lg"
              >
                {loading ? 'Generating...' : 'Generate AI Brief'}
              </Button>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {brief && <AIBriefCard brief={brief} />}

              {brief && (
                <ProposalForm
                  roomId={roomId}
                  issueNumber={issue.github_issue_number}
                  roomLabels={roomLabels}
                  brief={brief}
                  onSubmitted={onClose}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
