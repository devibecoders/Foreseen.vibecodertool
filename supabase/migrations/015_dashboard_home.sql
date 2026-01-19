-- =============================================
-- Migration: 015_dashboard_home.sql
-- Dashboard Homepage: Notes + Tasks tables
-- =============================================

-- =============================================
-- 1. DASHBOARD NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS dashboard_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  week_label TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_label)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_notes_user_id ON dashboard_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notes_week_label ON dashboard_notes(user_id, week_label);

-- Enable RLS
ALTER TABLE dashboard_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dashboard_notes_select_own" ON dashboard_notes
  FOR SELECT USING (user_id = COALESCE(auth.uid()::text, 'default-user'));

CREATE POLICY "dashboard_notes_insert_own" ON dashboard_notes
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.uid()::text, 'default-user'));

CREATE POLICY "dashboard_notes_update_own" ON dashboard_notes
  FOR UPDATE USING (user_id = COALESCE(auth.uid()::text, 'default-user'));

CREATE POLICY "dashboard_notes_delete_own" ON dashboard_notes
  FOR DELETE USING (user_id = COALESCE(auth.uid()::text, 'default-user'));

-- =============================================
-- 2. DASHBOARD TASKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS dashboard_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  assignee_name TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  due_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_user_id ON dashboard_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_status ON dashboard_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_due_date ON dashboard_tasks(user_id, due_date);

-- Enable RLS
ALTER TABLE dashboard_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "dashboard_tasks_select_own" ON dashboard_tasks
  FOR SELECT USING (user_id = COALESCE(auth.uid()::text, 'default-user'));

CREATE POLICY "dashboard_tasks_insert_own" ON dashboard_tasks
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.uid()::text, 'default-user'));

CREATE POLICY "dashboard_tasks_update_own" ON dashboard_tasks
  FOR UPDATE USING (user_id = COALESCE(auth.uid()::text, 'default-user'));

CREATE POLICY "dashboard_tasks_delete_own" ON dashboard_tasks
  FOR DELETE USING (user_id = COALESCE(auth.uid()::text, 'default-user'));

-- =============================================
-- 3. UPDATED_AT TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dashboard_notes_updated_at ON dashboard_notes;
CREATE TRIGGER update_dashboard_notes_updated_at
  BEFORE UPDATE ON dashboard_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboard_tasks_updated_at ON dashboard_tasks;
CREATE TRIGGER update_dashboard_tasks_updated_at
  BEFORE UPDATE ON dashboard_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE
-- =============================================
