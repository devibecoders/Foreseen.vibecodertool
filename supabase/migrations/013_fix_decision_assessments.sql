-- =====================================================
-- Migration 013: Complete articles/scans/analyses schema
-- Creates all required tables from scratch
-- =====================================================

-- 1. Sources table (RSS feeds and other content sources)
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rss',
  url TEXT,
  query TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Scans table (scan job tracking)
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_fetched INTEGER DEFAULT 0,
  items_analyzed INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Articles table (ingested articles)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  raw_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- 4. Analyses table (LLM analysis results)
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  categories TEXT NOT NULL,
  impact_score INTEGER NOT NULL CHECK (impact_score >= 0 AND impact_score <= 100),
  relevance_reason TEXT,
  customer_angle TEXT,
  vibecoders_angle TEXT,
  key_takeaways TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id)
);

-- 5. Decision Assessments table
DROP TABLE IF EXISTS decision_assessments CASCADE;
CREATE TABLE decision_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  action_required TEXT NOT NULL DEFAULT 'monitor' CHECK (action_required IN ('ignore', 'monitor', 'experiment', 'integrate')),
  impact_horizon TEXT NOT NULL DEFAULT 'mid' CHECK (impact_horizon IN ('direct', 'mid', 'long')),
  risk_if_ignored TEXT,
  advantage_if_early TEXT,
  confidence INTEGER DEFAULT 3 CHECK (confidence >= 1 AND confidence <= 5),
  is_override BOOLEAN DEFAULT false,
  destination TEXT CHECK (destination IN ('tech_radar_assess', 'tech_radar_trial', 'tech_radar_adopt', 'playbook_draft', 'playbook_step')),
  destination_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_enabled ON sources(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_started_at ON scans(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_scan_id ON articles(scan_id);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_impact_score ON analyses(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_article_id ON analyses(article_id);

CREATE INDEX IF NOT EXISTS idx_decision_assessments_user_id ON decision_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_assessments_action ON decision_assessments(action_required);
CREATE INDEX IF NOT EXISTS idx_decision_assessments_article_id ON decision_assessments(article_id);

-- =====================================================
-- Enable RLS with permissive policies
-- =====================================================

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on sources" ON sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scans" ON scans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on articles" ON articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on analyses" ON analyses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on decision_assessments" ON decision_assessments FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Seed default sources
-- =====================================================

INSERT INTO sources (name, type, url, enabled) VALUES
  ('AI News', 'rss', 'https://www.artificialintelligence-news.com/feed/', true),
  ('MIT Technology Review AI', 'rss', 'https://www.technologyreview.com/topic/artificial-intelligence/feed', true),
  ('VentureBeat AI', 'rss', 'https://venturebeat.com/category/ai/feed/', true),
  ('The Verge AI', 'rss', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', true),
  ('Hacker News', 'rss', 'https://hnrss.org/newest?q=AI+OR+LLM+OR+GPT', true)
ON CONFLICT DO NOTHING;
