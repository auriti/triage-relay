-- Fix: permetti ai triager di aggiornare i campi claim sulle issue
-- La policy issues_update originale (002) permette UPDATE solo ai maintainer.
-- I triager devono poter aggiornare claimed_by e claimed_at per il sistema di claim.

-- Aggiungi policy specifica per il claim (qualsiasi membro della room)
CREATE POLICY "issues_claim_by_member" ON issues_cache FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = issues_cache.room_id
    AND room_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = issues_cache.room_id
    AND room_members.user_id = auth.uid()
  )
);
