// API Route — Genera AI brief via Groq
import { createClient } from '@/lib/supabase/server'
import { generateTriageBrief } from '@/lib/groq'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { issueTitle, issueBody, roomId } = await request.json()

    if (!issueTitle || !roomId) {
      return NextResponse.json(
        { error: 'issueTitle and roomId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verifica membership
    const { data: member } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Fetch room labels
    const { data: room } = await supabase
      .from('rooms')
      .select('labels')
      .eq('id', roomId)
      .single()

    const availableLabels = (room?.labels as string[]) || []

    // Fetch ultimi 50 titoli issue dalla cache (per rilevamento duplicati)
    const { data: cachedIssues } = await supabase
      .from('issues_cache')
      .select('github_issue_number, title')
      .eq('room_id', roomId)
      .order('github_issue_number', { ascending: false })
      .limit(50)

    const existingIssues = (cachedIssues || []).map((i) => ({
      number: i.github_issue_number,
      title: i.title,
    }))

    // Sanitizza e tronca input — protezione prompt injection e lunghezza
    const MAX_TITLE_LEN = 256
    const MAX_BODY_LEN = 4000
    const safeTitle = typeof issueTitle === 'string' ? issueTitle.slice(0, MAX_TITLE_LEN) : ''
    const safeBody = typeof issueBody === 'string' ? issueBody.slice(0, MAX_BODY_LEN) : ''

    // Genera brief AI
    const brief = await generateTriageBrief({
      issueTitle: safeTitle,
      issueBody: safeBody,
      availableLabels,
      existingIssues,
    })

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('[TRIAGE_BRIEF]', error)

    const msg = error instanceof Error ? error.message : ''

    // Rate limit Groq → 429
    if (msg.includes('rate') || msg.includes('429')) {
      return NextResponse.json(
        { error: 'AI rate limit reached. Try again in a minute.' },
        { status: 429 }
      )
    }

    // Auth Groq non valida → 503
    if (msg.includes('401') || msg.includes('auth') || msg.includes('key')) {
      return NextResponse.json(
        { error: 'AI service misconfigured. Contact the maintainer.' },
        { status: 503 }
      )
    }

    // JSON parse error → 502
    if (msg.includes('JSON') || msg.includes('parse')) {
      return NextResponse.json(
        { error: 'AI returned invalid response. Try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'AI service unavailable. You can triage manually.' },
      { status: 503 }
    )
  }
}
