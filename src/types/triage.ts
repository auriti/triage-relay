// Tipi per il brief AI e il pannello di triage

export interface TriageBrief {
  summary: string
  missingInfo: string[]
  suggestedLabels: string[]
  potentialDuplicates: PotentialDuplicate[]
  draftComment: string
  confidence: 'low' | 'medium' | 'high'
  triageRecommendation: TriageRecommendation
}

export interface PotentialDuplicate {
  number: number
  title: string
  reason: string
}

export type TriageRecommendation =
  | 'needs_info'
  | 'label_and_close'
  | 'label_and_keep'
  | 'duplicate'
  | 'escalate'

// Schema JSON per Groq strict mode
export const TRIAGE_BRIEF_SCHEMA = {
  name: 'triage_brief',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: '2-3 sentence summary of the issue' },
      missingInfo: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of missing information needed to resolve this issue'
      },
      suggestedLabels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Suggested labels from the available labels list'
      },
      potentialDuplicates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            number: { type: 'number' },
            title: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['number', 'title', 'reason'],
          additionalProperties: false
        },
        description: 'Potential duplicate issues'
      },
      draftComment: { type: 'string', description: 'Draft comment to post on the issue' },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      triageRecommendation: {
        type: 'string',
        enum: ['needs_info', 'label_and_close', 'label_and_keep', 'duplicate', 'escalate']
      }
    },
    required: ['summary', 'missingInfo', 'suggestedLabels', 'potentialDuplicates', 'draftComment', 'confidence', 'triageRecommendation'],
    additionalProperties: false
  }
} as const

// Stato del form proposta
export interface ProposalFormState {
  kind: import('./database').ProposalKind
  labels: string[]
  comment: string
  duplicateOf: number | null
  duplicateReason: string
}
