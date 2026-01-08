-- Weekly Synthesis Tables for Foreseen

-- 1) weekly_runs: tracks each synthesis generation job
CREATE TABLE IF NOT EXISTS weekly_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS weekly_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS weekly_brief_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES weekly_briefs(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  used_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_runs_user_id ON weekly_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_runs_status ON weekly_runs(status);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_user_id ON weekly_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_run_id ON weekly_briefs(run_id);
CREATE INDEX IF NOT EXISTS idx_weekly_briefs_week_label ON weekly_briefs(week_label);
CREATE INDEX IF NOT EXISTS idx_weekly_brief_sources_brief_id ON weekly_brief_sources(brief_id);

-- RLS Policies: Everything is user-scoped

-- Enable RLS
ALTER TABLE weekly_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_brief_sources ENABLE ROW LEVEL SECURITY;

-- weekly_runs policies
CREATE POLICY "Users can view their own runs"
  ON weekly_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own runs"
  ON weekly_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs"
  ON weekly_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own runs"
  ON weekly_runs FOR DELETE
  USING (auth.uid() = user_id);

-- weekly_briefs policies
CREATE POLICY "Users can view their own briefs"
  ON weekly_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own briefs"
  ON weekly_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefs"
  ON weekly_briefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefs"
  ON weekly_briefs FOR DELETE
  USING (auth.uid() = user_id);

-- weekly_brief_sources policies
CREATE POLICY "Users can view sources for their briefs"
  ON weekly_brief_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_briefs
      WHERE weekly_briefs.id = weekly_brief_sources.brief_id
      AND weekly_briefs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sources for their briefs"
  ON weekly_brief_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_briefs
      WHERE weekly_briefs.id = weekly_brief_sources.brief_id
      AND weekly_briefs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sources for their briefs"
  ON weekly_brief_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_briefs
      WHERE weekly_briefs.id = weekly_brief_sources.brief_id
      AND weekly_briefs.user_id = auth.uid()
    )
  );
