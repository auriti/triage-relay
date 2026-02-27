-- ============================================
-- Triage Relay — Schema iniziale
-- Eseguire nel SQL Editor di Supabase
-- ============================================

-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROOMS: una room = una repo GitHub da triagare
-- ============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  display_name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  labels JSONB DEFAULT '["bug","enhancement","question","needs-info","duplicate","wontfix"]'::jsonb,
  canned_responses JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repo_owner, repo_name)
);

-- ============================================
-- ROOM MEMBERS: chi può accedere a una room
-- ============================================
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('maintainer', 'triager')),
  github_username TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- ============================================
-- ISSUES CACHE: cache locale delle issue GitHub
-- ============================================
CREATE TABLE issues_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  github_issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT NOT NULL,
  author_login TEXT,
  labels JSONB DEFAULT '[]'::jsonb,
  state TEXT DEFAULT 'open',
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, github_issue_number)
);

-- ============================================
-- PROPOSALS: proposte di triage dei volontari
-- ============================================
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  github_issue_number INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  kind TEXT NOT NULL CHECK (kind IN ('label', 'comment', 'duplicate', 'needs_info')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_brief JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- ROOMS
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (
  is_public = true
  OR id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- ROOM MEMBERS
CREATE POLICY "members_select" ON room_members FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_insert" ON room_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- ISSUES CACHE — select per tutti i membri, insert/update solo per maintainer
CREATE POLICY "issues_select" ON issues_cache FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "issues_insert" ON issues_cache FOR INSERT WITH CHECK (
  room_id IN (
    SELECT room_id FROM room_members
    WHERE user_id = auth.uid() AND role = 'maintainer'
  )
);
CREATE POLICY "issues_update" ON issues_cache FOR UPDATE USING (
  room_id IN (
    SELECT room_id FROM room_members
    WHERE user_id = auth.uid() AND role = 'maintainer'
  )
);

-- PROPOSALS
CREATE POLICY "proposals_select" ON proposals FOR SELECT USING (
  room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "proposals_insert" ON proposals FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND room_id IN (SELECT room_id FROM room_members WHERE user_id = auth.uid())
);
CREATE POLICY "proposals_update" ON proposals FOR UPDATE USING (
  room_id IN (
    SELECT room_id FROM room_members
    WHERE user_id = auth.uid() AND role = 'maintainer'
  )
);
