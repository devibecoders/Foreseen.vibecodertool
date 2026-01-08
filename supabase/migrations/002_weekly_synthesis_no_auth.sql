-- Drop existing tables and recreate without auth.users dependency
-- This allows us to use the feature without Supabase Auth for now

DROP TABLE IF EXISTS weekly_brief_sources CASCADE;
DROP TABLE IF EXISTS weekly_briefs CASCADE;
DROP TABLE IF EXISTS weekly_runs CASCADE;

-- 1) weekly_runs: tracks each synthesis generation job
CREATE TABLE weekly_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  mode TEXT NOT NULL CHECK (mode IN ('backfill', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  items_considered INTEGER DEFAULT 0,
  items_used INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- 2) weekly_briefs: stores the generated synthesis documents
CREATE TABLE weekly_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  run_id UUID NOT NULL REFERENCES weekly_runs(id) ON DELETE CASCADE,
  week_label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  title TEXT NOT NULL,
  executive_summary TEXT,
  macro_trends JSONB DEFAULT '[]'::jsonb,
  implications_vibecoding JSONB DEFAULT '[]'::jsonb,
  client_opportunities JSONB DEFAULT '[]'::jsonb,
  ignore_list JSONB DEFAULT '[]'::jsonb,
  reading_list JSONB DEFAULT '[]'::jsonb,
  full_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_label)
);

-- 3) weekly_brief_sources: maps which articles were used in each brief
CREATE TABLE weekly_brief_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES weekly_briefs(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  used_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_weekly_runs_user_id ON weekly_runs(user_id);
CREATE INDEX idx_weekly_runs_status ON weekly_runs(status);
CREATE INDEX idx_weekly_briefs_user_id ON weekly_briefs(user_id);
CREATE INDEX idx_weekly_briefs_run_id ON weekly_briefs(run_id);
CREATE INDEX idx_weekly_briefs_week_label ON weekly_briefs(week_label);
CREATE INDEX idx_weekly_brief_sources_brief_id ON weekly_brief_sources(brief_id);

-- Enable RLS (but allow all for now since we don't have auth)
ALTER TABLE weekly_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_brief_sources ENABLE ROW LEVEL SECURITY;

-- Permissive policies for now (allow all operations)
CREATE POLICY "Allow all on weekly_runs" ON weekly_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weekly_briefs" ON weekly_briefs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on weekly_brief_sources" ON weekly_brief_sources FOR ALL USING (true) WITH CHECK (true);
