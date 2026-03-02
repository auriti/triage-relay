'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import remarkGfm from 'remark-gfm'

// Lazy-load react-markdown (~180KB) per ridurre il bundle iniziale
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <Skeleton className="h-40 w-full rounded-lg" />,
  ssr: false,
})
import { AIBriefCard } from './AIBriefCard'
import { ProposalForm } from './ProposalForm'
import { toast } from 'sonner'
import type { IssueCache, CannedResponse } from '@/types/database'
import type { TriageBrief } from '@/types/triage'

interface TriagePanelProps {
  issue: IssueCache | null
  roomId: string
  roomLabels: string[]
  cannedResponses: CannedResponse[]
  /** Chiamata solo per chiusura manuale del panel (senza submit) */
  onClose: () => void
  /** Chiamata solo dopo un submit riuscito — aggiorna le pending issues */
  onProposalSubmitted: () => void
  hasExistingProposal?: boolean
}

export function TriagePanel({ issue, roomId, roomLabels, cannedResponses, onClose, onProposalSubmitted, hasExistingProposal = false }: TriagePanelProps) {
  const [brief, setBrief] = useState<TriageBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset stato quando cambia l'issue — ripristina dal cache se disponibile
  useEffect(() => {
    setError(null)
    setLoading(false)
    if (issue) {
      const key = `triage-draft-${roomId}-${issue.github_issue_number}`
      const saved = sessionStorage.getItem(key)
      if (saved) {
        try {
          setBrief(JSON.parse(saved))
        } catch {
          setBrief(null)
        }
      } else {
        setBrief(null)
      }
    } else {
      setBrief(null)
    }
  }, [issue?.github_issue_number, roomId])

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
      // Salva brief in sessionStorage per ripristino rapido
      sessionStorage.setItem(
        `triage-draft-${roomId}-${issue.github_issue_number}`,
        JSON.stringify(data.brief)
      )
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
      {/* Fix responsive: larghezza Sheet limitata su tablet, full su mobile */}
      <SheetContent className="w-full sm:max-w-[540px] lg:max-w-[60vw] overflow-hidden p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <span className="text-muted-foreground">#{issue.github_issue_number}</span>
            <span className="line-clamp-1">{issue.title}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Triage panel for issue #{issue.github_issue_number}. Generate an AI brief and submit a proposal.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-5rem)]">
          {/*
            Fix responsive: su mobile usa flex-col-reverse per mostrare il brief AI
            sopra il body dell'issue — riduce lo scroll necessario. Su desktop
            torna al layout a 2 colonne (brief a destra).
          */}
          <div className="flex flex-col-reverse gap-6 p-6 lg:grid lg:grid-cols-2">
            {/* Colonna sinistra (sotto su mobile, sinistra su desktop): contenuto issue */}
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

            {/* Colonna destra (sopra su mobile, destra su desktop): brief AI + form proposta */}
            <div className="space-y-4">
              {/* Avviso proposta duplicata */}
              {hasExistingProposal && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-500">Proposal already pending</p>
                    <p className="mt-0.5 text-xs text-amber-500/80">
                      You already have a pending proposal for this issue. Wait for maintainer review before submitting another.
                    </p>
                  </div>
                </div>
              )}

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

              {/* Mostra il form solo se non c'è già una proposta pending */}
              {brief && !hasExistingProposal && (
                <ProposalForm
                  key={`${issue.github_issue_number}-${brief.confidence}`}
                  roomId={roomId}
                  issueNumber={issue.github_issue_number}
                  roomLabels={roomLabels}
                  cannedResponses={cannedResponses}
                  brief={brief}
                  onSubmitted={() => {
                    // Pulisci cache del brief dopo submit riuscito
                    if (issue) {
                      sessionStorage.removeItem(`triage-draft-${roomId}-${issue.github_issue_number}`)
                    }
                    // Notifica il parent che la proposta è stata inviata (aggiorna pending)
                    onProposalSubmitted()
                  }}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
