// Helper per Groq API — generazione brief AI
import Groq from 'groq-sdk'
import type { TriageBrief } from '@/types/triage'
import { TRIAGE_BRIEF_SCHEMA } from '@/types/triage'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert open-source triage assistant. Analyze the GitHub issue provided and return a structured JSON response. Be concise and actionable.

Rules:
- suggestedLabels MUST only include labels from the provided available labels list
- potentialDuplicates should only include issues from the provided existing issues list
- draftComment should be written as if posted by a helpful community member, NOT a bot
- If the issue is well-written and clear, say so
- If the issue might be AI-generated spam, flag it in the summary
- Keep draftComment warm but efficient, max 3 paragraphs`

// Brief AI vuoto per fallback
const EMPTY_BRIEF: TriageBrief = {
  summary: 'AI brief unavailable. Please triage manually.',
  missingInfo: [],
  suggestedLabels: [],
  potentialDuplicates: [],
  draftComment: '',
  confidence: 'low',
  triageRecommendation: 'needs_info',
}

export async function generateTriageBrief(params: {
  issueTitle: string
  issueBody: string
  availableLabels: string[]
  existingIssues: { number: number; title: string }[]
}): Promise<TriageBrief> {
  try {
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(params) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: TRIAGE_BRIEF_SCHEMA,
      },
      temperature: 0.3,
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return EMPTY_BRIEF

    const brief = JSON.parse(content) as TriageBrief
    return brief
  } catch (error) {
    console.error('[GROQ]', error)
    return EMPTY_BRIEF
  }
}
