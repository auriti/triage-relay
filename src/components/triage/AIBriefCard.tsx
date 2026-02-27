'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { TriageBrief } from '@/types/triage'

const CONFIDENCE_COLORS = {
  low: 'bg-destructive/20 text-destructive',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-primary/20 text-primary',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  needs_info: 'Needs More Info',
  label_and_close: 'Label & Close',
  label_and_keep: 'Label & Keep Open',
  duplicate: 'Duplicate',
  escalate: 'Escalate',
}

export function AIBriefCard({ brief }: { brief: TriageBrief }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      {/* Summary */}
      <div className="animate-in" style={{ animationDelay: '0ms' }}>
        <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Summary</h4>
        <p className="text-sm">{brief.summary}</p>
      </div>

      <Separator />

      {/* Confidence + Recommendation */}
      <div className="animate-in flex items-center gap-2" style={{ animationDelay: '50ms' }}>
        <Badge className={CONFIDENCE_COLORS[brief.confidence]}>
          {brief.confidence} confidence
        </Badge>
        <Badge variant="outline">
          {RECOMMENDATION_LABELS[brief.triageRecommendation] || brief.triageRecommendation}
        </Badge>
      </div>

      {/* Missing Info */}
      {brief.missingInfo.length > 0 && (
        <div className="animate-in" style={{ animationDelay: '100ms' }}>
          <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Missing Info
          </h4>
          <ul className="space-y-1">
            {brief.missingInfo.map((info, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-warning">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                {info}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Labels */}
      {brief.suggestedLabels.length > 0 && (
        <div className="animate-in" style={{ animationDelay: '150ms' }}>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Suggested Labels
          </h4>
          <div className="flex flex-wrap gap-1">
            {brief.suggestedLabels.map((label) => (
              <Badge key={label} className="bg-primary/20 text-primary">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Potential Duplicates */}
      {brief.potentialDuplicates.length > 0 && (
        <div className="animate-in" style={{ animationDelay: '200ms' }}>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Potential Duplicates
          </h4>
          <div className="space-y-2">
            {brief.potentialDuplicates.map((dup) => (
              <div key={dup.number} className="rounded border border-border p-2 text-sm">
                <span className="font-medium text-primary">#{dup.number}</span>{' '}
                {dup.title}
                <p className="mt-1 text-xs text-muted-foreground">{dup.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft Comment */}
      {brief.draftComment && (
        <div className="animate-in" style={{ animationDelay: '250ms' }}>
          <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
            Draft Comment
          </h4>
          <div className="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed">
            {brief.draftComment}
          </div>
        </div>
      )}
    </div>
  )
}
