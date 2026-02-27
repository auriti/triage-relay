-- Fix: ricorsione infinita nelle policy RLS
-- Il problema: members_select referenziava se stessa (room_members → room_members)

-- Rimuovi le policy problematiche
DROP POLICY IF EXISTS "members_select" ON room_members;
DROP POLICY IF EXISTS "rooms_select" ON rooms;
DROP POLICY IF EXISTS "issues_select" ON issues_cache;
DROP POLICY IF EXISTS "issues_insert" ON issues_cache;
DROP POLICY IF EXISTS "issues_update" ON issues_cache;
DROP POLICY IF EXISTS "proposals_select" ON proposals;
DROP POLICY IF EXISTS "proposals_insert" ON proposals;
DROP POLICY IF EXISTS "proposals_update" ON proposals;

-- ROOM MEMBERS: l'utente vede solo le proprie membership (niente self-reference)
CREATE POLICY "members_select" ON room_members FOR SELECT USING (
  user_id = auth.uid()
);

-- ROOMS: usa EXISTS per evitare ricorsione
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (
  is_public = true
  OR EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = rooms.id
    AND room_members.user_id = auth.uid()
  )
);

-- ISSUES CACHE: usa EXISTS
CREATE POLICY "issues_select" ON issues_cache FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = issues_cache.room_id
    AND room_members.user_id = auth.uid()
  )
);
CREATE POLICY "issues_insert" ON issues_cache FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = issues_cache.room_id
    AND room_members.user_id = auth.uid()
    AND room_members.role = 'maintainer'
  )
);
CREATE POLICY "issues_update" ON issues_cache FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = issues_cache.room_id
    AND room_members.user_id = auth.uid()
    AND room_members.role = 'maintainer'
  )
);

-- PROPOSALS: usa EXISTS
CREATE POLICY "proposals_select" ON proposals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = proposals.room_id
    AND room_members.user_id = auth.uid()
  )
);
CREATE POLICY "proposals_insert" ON proposals FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = proposals.room_id
    AND room_members.user_id = auth.uid()
  )
);
CREATE POLICY "proposals_update" ON proposals FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM room_members
    WHERE room_members.room_id = proposals.room_id
    AND room_members.user_id = auth.uid()
    AND room_members.role = 'maintainer'
  )
);
