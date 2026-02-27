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

    // Genera brief AI
    const brief = await generateTriageBrief({
      issueTitle,
      issueBody: issueBody || '',
      availableLabels,
      existingIssues,
    })

    return NextResponse.json({ brief })
  } catch (error) {
    console.error('[TRIAGE_BRIEF]', error)

    // Se Groq è down → 503
    if (error instanceof Error && error.message.includes('rate')) {
      return NextResponse.json(
        { error: 'AI rate limit reached. Try again in a minute.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'AI service unavailable. You can triage manually.' },
      { status: 503 }
    )
  }
}
