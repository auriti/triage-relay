// Le mie proposte — vista triager delle proprie proposte inviate
import { createClient } from '@/lib/supabase/server'
import { ProposalList } from '@/components/proposals/ProposalList'

export default async function MyProposalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch solo le proposte create dall'utente corrente
  const { data: proposals } = await supabase
    .from('proposals')
    .select('*')
    .eq('room_id', id)
    .eq('created_by', user!.id)
    .order('created_at', { ascending: false })

  // Titoli issue
  const issueNumbers = [...new Set((proposals || []).map((p) => p.github_issue_number))]
  const { data: issues } = await supabase
    .from('issues_cache')
    .select('github_issue_number, title')
    .eq('room_id', id)
    .in('github_issue_number', issueNumbers.length > 0 ? issueNumbers : [-1])

  const issueTitleMap = new Map(
    (issues || []).map((i) => [i.github_issue_number, i.title])
  )

  const proposalsWithTitle = (proposals || []).map((p) => ({
    ...p,
    issue_title: issueTitleMap.get(p.github_issue_number) || null,
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">My Proposals</h1>
        <p className="text-sm text-muted-foreground">
          Track the status of your submitted triage proposals
        </p>
      </div>

      <ProposalList
        proposals={proposalsWithTitle}
        roomId={id}
        isMaintainer={false}
      />
    </div>
  )
}
