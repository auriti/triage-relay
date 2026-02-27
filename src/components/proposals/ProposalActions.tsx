'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
      // Chiama l'API per applicare su GitHub
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

  function handleCopy() {
    const payload = proposal.payload as Record<string, unknown>
    const text = (payload.comment as string) || JSON.stringify(payload, null, 2)
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex gap-2 pt-2">
      <Button
        onClick={handleApply}
        disabled={!!loading}
        className="bg-primary text-primary-foreground hover:bg-orange-600"
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
      <Button
        variant="destructive"
        size="sm"
        onClick={handleReject}
        disabled={!!loading}
      >
        {loading === 'reject' ? 'Rejecting...' : 'Reject'}
      </Button>
    </div>
  )
}
