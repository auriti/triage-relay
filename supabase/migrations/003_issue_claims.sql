-- Aggiungi colonne per il claim system sulle issue
ALTER TABLE issues_cache
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Indice per trovare velocemente le issue claimate
CREATE INDEX IF NOT EXISTS idx_issues_cache_claimed_by ON issues_cache(claimed_by) WHERE claimed_by IS NOT NULL;
