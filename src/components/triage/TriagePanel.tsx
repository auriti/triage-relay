'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

  // Reset stato quando cambia l'issue (evita setState durante render)
  useEffect(() => {
    setBrief(null)
    setError(null)
    setLoading(false)
  }, [issue?.github_issue_number])

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

  if (!issue) return null

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
              <div className="rounded-lg border border-border bg-muted/30 p-4 prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-a:text-primary prose-code:text-orange-500 prose-pre:bg-background/50 prose-pre:border prose-pre:border-border prose-img:rounded-lg">
                {issue.body ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {issue.body}
                  </ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">No description provided.</p>
                )}
              </div>
            </div>

            {/* Colonna destra: brief AI + form proposta */}
            <div className="space-y-4">
              <Button
                onClick={generateBrief}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
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
                  key={`${issue.github_issue_number}-${brief.confidence}`}
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
