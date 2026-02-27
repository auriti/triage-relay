// API Route — Applica proposta su GitHub (solo maintainer)
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { addLabel, addComment, validateToken } from '@/lib/github'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { proposalId } = await request.json()
    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch proposal
    const { data: proposal } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Verifica ruolo maintainer
    const { data: member } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', proposal.room_id)
      .eq('user_id', user.id)
      .single()

    if (!member || member.role !== 'maintainer') {
      return NextResponse.json({ error: 'Only maintainers can apply proposals' }, { status: 403 })
    }

    // Fetch room info
    const { data: room } = await supabase
      .from('rooms')
      .select('repo_owner, repo_name')
      .eq('id', proposal.room_id)
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Leggi GitHub token
    const cookieStore = await cookies()
    const ghToken = cookieStore.get('gh_token')?.value
    if (!ghToken) {
      return NextResponse.json(
        { error: 'GitHub token expired. Please re-login.' },
        { status: 401 }
      )
    }

    const { valid } = await validateToken(ghToken)
    if (!valid) {
      return NextResponse.json(
        { error: 'GitHub token invalid. Please re-login.' },
        { status: 401 }
      )
    }

    const { repo_owner, repo_name } = room
    const issueNumber = proposal.github_issue_number
    const payload = proposal.payload as Record<string, unknown>
    const applied: string[] = []

    // Applica in base al tipo di proposta
    switch (proposal.kind) {
      case 'label': {
        const labels = payload.labels as string[]
        if (labels && labels.length > 0) {
          await addLabel(ghToken, repo_owner, repo_name, issueNumber, labels)
          applied.push('label')
        }
        break
      }
      case 'comment': {
        const comment = payload.comment as string
        if (comment) {
          await addComment(ghToken, repo_owner, repo_name, issueNumber, comment)
          applied.push('comment')
        }
        break
      }
      case 'needs_info': {
        const promises: Promise<void>[] = []
        const labels = payload.labels as string[]
        const comment = payload.comment as string

        if (labels && labels.length > 0) {
          promises.push(addLabel(ghToken, repo_owner, repo_name, issueNumber, labels))
          applied.push('label')
        }
        if (comment) {
          promises.push(addComment(ghToken, repo_owner, repo_name, issueNumber, comment))
          applied.push('comment')
        }
        await Promise.all(promises)
        break
      }
      case 'duplicate': {
        const dupOf = payload.duplicate_of as number
        const reason = payload.reason as string || ''
        const body = `Duplicate of #${dupOf}${reason ? `: ${reason}` : ''}`
        await addComment(ghToken, repo_owner, repo_name, issueNumber, body)
        applied.push('comment')
        break
      }
      default:
        return NextResponse.json(
          { error: `Unknown proposal kind: ${proposal.kind}` },
          { status: 400 }
        )
    }

    // Aggiorna stato proposta con service client (bypassa RLS)
    const serviceClient = createServiceClient()
    const { error: updateError } = await serviceClient
      .from('proposals')
      .update({
        status: 'applied',
        decided_at: new Date().toISOString(),
        decided_by: user.id,
      })
      .eq('id', proposalId)

    if (updateError) {
      console.error('[GITHUB_APPLY] Update proposal failed:', updateError.message)
      // Azioni GitHub applicate ma stato DB non aggiornato
      return NextResponse.json(
        { success: true, applied, warning: 'Applied on GitHub but database update failed. Refresh to check status.' },
        { status: 207 }
      )
    }

    return NextResponse.json({ success: true, applied })
  } catch (error) {
    console.error('[GITHUB_APPLY] Unhandled error:', error)
    const message = error instanceof Error ? error.message : 'Failed to apply on GitHub'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
