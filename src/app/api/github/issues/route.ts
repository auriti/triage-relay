// API Route — Fetch e cache issue da GitHub
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchIssues, validateToken } from '@/lib/github'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { roomId } = await request.json()
    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
    }

    // Client autenticato per verificare utente e membership
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verifica membership
    const { data: member, error: memberError } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !member) {
      console.error('[GITHUB_ISSUES] Membership check failed:', memberError?.message)
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Fetch room info
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('repo_owner, repo_name')
      .eq('id', roomId)
      .single()

    if (roomError || !room) {
      console.error('[GITHUB_ISSUES] Room fetch failed:', roomError?.message)
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Client service_role per operazioni cache (bypassa RLS)
    const serviceClient = createServiceClient()

    // Step 1 — Query leggera: recupera solo last_synced_at per verificare
    // la freschezza della cache senza trasferire tutti i dati delle issue.
    const { data: timestampRow } = await serviceClient
      .from('issues_cache')
      .select('last_synced_at')
      .eq('room_id', roomId)
      .order('github_issue_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const latestSync = timestampRow?.last_synced_at
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    if (latestSync && latestSync > fiveMinAgo) {
      // Step 2 — Cache fresca: carica tutti i dati solo adesso che sappiamo
      // che la risposta sarà servita dalla cache e non da GitHub.
      const { data: cachedIssues } = await serviceClient
        .from('issues_cache')
        .select('*')
        .eq('room_id', roomId)
        .eq('state', 'open')
        .order('github_issue_number', { ascending: false })

      return NextResponse.json({
        issues: cachedIssues || [],
        cached: true,
        synced_at: latestSync,
      })
    }

    // Leggi il token GitHub dal cookie
    const cookieStore = await cookies()
    const ghToken = cookieStore.get('gh_token')?.value
    if (!ghToken) {
      return NextResponse.json(
        { error: 'GitHub token expired. Please re-login.' },
        { status: 401 }
      )
    }

    // Valida il token prima di chiamare GitHub
    const { valid } = await validateToken(ghToken)
    if (!valid) {
      return NextResponse.json(
        { error: 'GitHub token invalid. Please re-login.' },
        { status: 401 }
      )
    }

    // Fetch da GitHub
    console.log(`[GITHUB_ISSUES] Fetching ${room.repo_owner}/${room.repo_name}...`)
    const issues = await fetchIssues(ghToken, room.repo_owner, room.repo_name)
    console.log(`[GITHUB_ISSUES] Fetched ${issues.length} issues from GitHub`)
    const now = new Date().toISOString()

    // Upsert nella cache con service client (bypassa RLS)
    if (issues.length > 0) {
      const rows = issues.map((issue) => ({
        room_id: roomId,
        github_issue_number: issue.number,
        title: issue.title,
        body: issue.body,
        url: issue.html_url,
        author_login: issue.user?.login || null,
        labels: issue.labels.map((l) => l.name),
        state: issue.state,
        comments_count: issue.comments,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        last_synced_at: now,
      }))

      const { error: upsertError } = await serviceClient
        .from('issues_cache')
        .upsert(rows, { onConflict: 'room_id,github_issue_number' })

      if (upsertError) {
        console.error('[GITHUB_ISSUES] Upsert failed:', upsertError.message, upsertError.details)
        return NextResponse.json(
          { error: 'Failed to cache issues: ' + upsertError.message },
          { status: 500 }
        )
      }
    }

    // Ritorna le issue aggiornate dalla cache (solo open)
    const { data: updatedIssues } = await serviceClient
      .from('issues_cache')
      .select('*')
      .eq('room_id', roomId)
      .eq('state', 'open')
      .order('github_issue_number', { ascending: false })

    return NextResponse.json({
      issues: updatedIssues || [],
      cached: false,
      synced_at: now,
    })
  } catch (error) {
    console.error('[GITHUB_ISSUES] Unhandled error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
