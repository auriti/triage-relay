-- Indici per query frequenti — miglioramento performance

-- Issue aperte per room (query più frequente)
CREATE INDEX IF NOT EXISTS idx_issues_cache_room_state
  ON issues_cache(room_id, state) WHERE state = 'open';

-- Proposte per room e status (filtro tab pending/applied/rejected)
CREATE INDEX IF NOT EXISTS idx_proposals_room_status
  ON proposals(room_id, status);

-- Proposte per utente (pagina "my proposals")
CREATE INDEX IF NOT EXISTS idx_proposals_created_by
  ON proposals(created_by, room_id);

-- Issue per room ordinate per numero (sync GitHub)
CREATE INDEX IF NOT EXISTS idx_issues_cache_room_number
  ON issues_cache(room_id, github_issue_number DESC);
