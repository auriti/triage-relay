'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateProposalStatus } from '@/app/actions/proposals'
import { toast } from 'sonner'
import type { Proposal } from '@/types/database'

interface ProposalActionsProps {
  proposal: Proposal
  roomId: string
}

export function ProposalActions({ proposal, roomId }: ProposalActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleApply() {
    setLoading('apply')
    try {
      const res = await fetch('/api/github/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to apply')
        return
      }

      // Fix 4: status 207 indica successo parziale (GitHub OK, DB fallito)
      if (res.status === 207) {
        toast.warning(data.warning || 'Applied on GitHub but database update failed')
        router.refresh()
        return
      }

      toast.success(`Applied: ${data.applied.join(', ')}`)
      router.refresh()
    } catch {
      toast.error('Failed to apply on GitHub')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    setLoading('reject')
    try {
      await updateProposalStatus(proposal.id, 'rejected', roomId)
      toast.success('Proposal rejected')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject')
    } finally {
      setLoading(null)
    }
  }

  // Fix 3: clipboard.writeText è asincrono e può fallire (es. permessi negati)
  async function handleCopy() {
    const payload = proposal.payload as Record<string, unknown>
    const text = (payload.comment as string) || JSON.stringify(payload, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copia negli appunti non riuscita')
    }
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button
        onClick={handleApply}
        disabled={!!loading}
        className="bg-primary text-primary-foreground hover:bg-primary-hover"
        size="sm"
      >
        {loading === 'apply' ? 'Applying...' : 'Approve & Apply'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
      >
        Copy
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={!!loading}
          >
            {loading === 'reject' ? 'Rejecting...' : 'Reject'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the triage proposal for issue #{proposal.github_issue_number}. The triager will see the rejected status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
