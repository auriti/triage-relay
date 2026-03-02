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

      {proposalsWithTitle.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <svg className="mb-3 h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">No proposals yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
            Go to the Issues tab, select an issue, generate an AI brief, and submit your first triage proposal.
          </p>
        </div>
      ) : (
        <ProposalList
          proposals={proposalsWithTitle}
          roomId={id}
          isMaintainer={false}
        />
      )}
    </div>
  )
}
