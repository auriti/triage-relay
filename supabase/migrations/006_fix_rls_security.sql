-- ============================================
-- 006_fix_rls_security.sql
-- Fix vulnerabilità RLS identificate dall'audit di sicurezza
-- ============================================

-- ===========================================
-- FIX 1 (CRITICO): Rimuovi UPDATE generico su issues_cache per i triager
-- La policy "issues_claim_by_member" (005) permetteva a qualsiasi membro
-- di aggiornare TUTTE le colonne: title, body, labels, ecc.
-- Soluzione: sostituire con due funzioni RPC SECURITY DEFINER che
-- aggiornano SOLO claimed_by e claimed_at.
-- ===========================================

DROP POLICY IF EXISTS "issues_claim_by_member" ON issues_cache;

-- Funzione RPC per acquisire il claim su un'issue.
-- SECURITY DEFINER: bypassa RLS ma la logica interna è esplicita e ristretta.
-- Aggiorna SOLO claimed_by e claimed_at — nessun'altra colonna.
CREATE OR REPLACE FUNCTION claim_issue(
  p_room_id        UUID,
  p_issue_number   INT
) RETURNS VOID AS $$
DECLARE
  v_claimed_by  UUID;
  v_claimed_at  TIMESTAMPTZ;
BEGIN
  -- Verifica che il chiamante sia membro attivo della room
  IF NOT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = p_room_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Non sei membro di questa room';
  END IF;

  -- Legge lo stato corrente del claim
  SELECT claimed_by, claimed_at
    INTO v_claimed_by, v_claimed_at
    FROM issues_cache
   WHERE room_id = p_room_id
     AND github_issue_number = p_issue_number;

  -- Rifiuta se un altro utente ha un claim valido (< 30 minuti)
  IF v_claimed_by IS NOT NULL
     AND v_claimed_by <> auth.uid()
     AND v_claimed_at > (now() - INTERVAL '30 minutes')
  THEN
    RAISE EXCEPTION 'Issue già in carico a un altro triager';
  END IF;

  -- Aggiorna SOLO i campi di claim — nessun'altra colonna è toccata
  UPDATE issues_cache
     SET claimed_by  = auth.uid(),
         claimed_at  = now()
   WHERE room_id             = p_room_id
     AND github_issue_number = p_issue_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione RPC per rilasciare il claim su un'issue.
-- Solo il proprietario del claim può rilasciarlo.
CREATE OR REPLACE FUNCTION release_issue_claim(
  p_room_id        UUID,
  p_issue_number   INT
) RETURNS VOID AS $$
BEGIN
  -- Aggiorna SOLO se il chiamante è il proprietario del claim corrente
  UPDATE issues_cache
     SET claimed_by  = NULL,
         claimed_at  = NULL
   WHERE room_id             = p_room_id
     AND github_issue_number = p_issue_number
     AND claimed_by          = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- FIX 2 (ALTO): Limitare auto-iscrizione — impedire ruolo maintainer arbitrario
-- La policy "members_insert" originale (001) accettava user_id = auth.uid()
-- senza vincoli sul ruolo, permettendo a chiunque di dichiararsi maintainer.
-- Soluzione: i triager si auto-iscrivono solo come triager; i maintainer
-- possono iscriversi come tali SOLO se sono i creator della room.
-- ===========================================

DROP POLICY IF EXISTS "members_insert" ON room_members;

CREATE POLICY "members_insert" ON room_members FOR INSERT WITH CHECK (
  -- L'utente può iscrivere solo se stesso
  user_id = auth.uid()
  AND (
    -- Caso 1: auto-iscrizione come triager (sempre permessa se nella room)
    role = 'triager'
    OR
    -- Caso 2: ruolo maintainer solo se l'utente è il creator della room
    (
      role = 'maintainer'
      AND EXISTS (
        SELECT 1 FROM rooms
         WHERE rooms.id         = room_members.room_id
           AND rooms.created_by = auth.uid()
      )
    )
  )
);

-- ===========================================
-- FIX 3 (ALTO): Permettere ai membri di vedere altri membri della stessa room
-- La policy "members_select" (002) usava user_id = auth.uid() — visibilità
-- limitata al solo record personale. Questo rompeva claimed_by_username e
-- qualsiasi lookup sul profilo dei colleghi della stessa room.
-- Soluzione: subquery con alias esplicito per evitare la ricorsione auto-referenziale
-- che aveva causato il fix originale in 002.
-- ===========================================

DROP POLICY IF EXISTS "members_select" ON room_members;

CREATE POLICY "members_select" ON room_members FOR SELECT USING (
  -- Caso 1: il proprio record è sempre visibile
  user_id = auth.uid()
  OR
  -- Caso 2: record di altri membri della stessa room sono visibili
  -- (alias "rm" obbligatorio per evitare ricorsione sulla stessa tabella)
  room_id IN (
    SELECT rm.room_id
      FROM room_members rm
     WHERE rm.user_id = auth.uid()
  )
);

-- ===========================================
-- FIX 4: Indici aggiuntivi per le query introdotte dai fix precedenti
-- ===========================================

-- Accelera la lookup di membership usata in claim_issue e members_insert
CREATE INDEX IF NOT EXISTS idx_room_members_user_id
  ON room_members(user_id);

-- Accelera il filtro deduplicazione proposte pending per stessa issue/utente
CREATE INDEX IF NOT EXISTS idx_proposals_dedup
  ON proposals(room_id, github_issue_number, created_by, status)
  WHERE status = 'pending';
