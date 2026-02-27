'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { createProposal } from '@/app/actions/proposals'
import { toast } from 'sonner'
import type { ProposalKind } from '@/types/database'
import type { TriageBrief } from '@/types/triage'

interface ProposalFormProps {
  roomId: string
  issueNumber: number
  roomLabels: string[]
  brief: TriageBrief
  onSubmitted: () => void
}

export function ProposalForm({
  roomId,
  issueNumber,
  roomLabels,
  brief,
  onSubmitted,
}: ProposalFormProps) {
  const [kind, setKind] = useState<ProposalKind>(() => {
    // Pre-seleziona il tipo in base alla raccomandazione AI
    switch (brief.triageRecommendation) {
      case 'duplicate':
        return 'duplicate'
      case 'needs_info':
        return 'needs_info'
      default:
        return brief.suggestedLabels.length > 0 ? 'label' : 'comment'
    }
  })

  const [selectedLabels, setSelectedLabels] = useState<string[]>(brief.suggestedLabels)
  const [comment, setComment] = useState(brief.draftComment)
  const [duplicateOf, setDuplicateOf] = useState<string>(
    brief.potentialDuplicates[0]?.number.toString() || ''
  )
  const [duplicateReason, setDuplicateReason] = useState(
    brief.potentialDuplicates[0]?.reason || ''
  )
  const [isPending, startTransition] = useTransition()

  function toggleLabel(label: string) {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        let payload: Record<string, unknown>

        switch (kind) {
          case 'label':
            if (selectedLabels.length === 0) {
              toast.error('Select at least one label')
              return
            }
            payload = { kind: 'label', labels: selectedLabels }
            break
          case 'comment':
            if (!comment.trim()) {
              toast.error('Enter a comment')
              return
            }
            payload = { kind: 'comment', comment }
            break
          case 'duplicate':
            if (!duplicateOf) {
              toast.error('Enter the duplicate issue number')
              return
            }
            payload = {
              kind: 'duplicate',
              duplicate_of: parseInt(duplicateOf),
              reason: duplicateReason,
            }
            break
          case 'needs_info':
            payload = {
              kind: 'needs_info',
              labels: selectedLabels.length > 0 ? selectedLabels : ['needs-info'],
              comment: comment || brief.draftComment,
            }
            break
          default:
            return
        }

        await createProposal(roomId, issueNumber, kind, payload, brief)
        toast.success('Proposal submitted!')
        onSubmitted()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit proposal')
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-semibold">Submit Proposal</h4>

      {/* Tipo proposta */}
      <Select value={kind} onValueChange={(v) => setKind(v as ProposalKind)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="label">Add Labels</SelectItem>
          <SelectItem value="comment">Post Comment</SelectItem>
          <SelectItem value="duplicate">Mark as Duplicate</SelectItem>
          <SelectItem value="needs_info">Request More Info</SelectItem>
        </SelectContent>
      </Select>

      {/* Labels (per label e needs_info) */}
      {(kind === 'label' || kind === 'needs_info') && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Labels</label>
          <div className="mt-1 flex flex-wrap gap-1">
            {roomLabels.map((label) => (
              <Badge
                key={label}
                variant={selectedLabels.includes(label) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleLabel(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Comment (per comment e needs_info) */}
      {(kind === 'comment' || kind === 'needs_info') && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Comment</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            className="mt-1"
            placeholder="Draft comment to post on the issue..."
          />
        </div>
      )}

      {/* Duplicate fields */}
      {kind === 'duplicate' && (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Duplicate of issue #
            </label>
            <Input
              type="number"
              value={duplicateOf}
              onChange={(e) => setDuplicateOf(e.target.value)}
              className="mt-1"
              placeholder="Issue number"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <Textarea
              value={duplicateReason}
              onChange={(e) => setDuplicateReason(e.target.value)}
              rows={2}
              className="mt-1"
              placeholder="Why is this a duplicate?"
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        {isPending ? 'Submitting...' : 'Submit Proposal'}
      </Button>
    </div>
  )
}
