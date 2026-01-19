-- =====================================================
-- Migration 014: Research Hub Schema Updates
-- Links Scans → Synthesis → Decisions + Personalization
-- =====================================================

-- 1. Add scan_id to weekly_briefs (link synthesis to scan)
ALTER TABLE weekly_briefs 
ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES scans(id) ON DELETE SET NULL;

-- 2. Add source_mode to weekly_briefs
ALTER TABLE weekly_briefs 
ADD COLUMN IF NOT EXISTS source_mode TEXT DEFAULT 'independent' 
CHECK (source_mode IN ('from_scan', 'independent'));

-- 3. Add scan_id to decision_assessments
ALTER TABLE decision_assessments 
ADD COLUMN IF NOT EXISTS scan_id UUID REFERENCES scans(id) ON DELETE SET NULL;

-- 4. Add brief_id to decision_assessments
ALTER TABLE decision_assessments 
ADD COLUMN IF NOT EXISTS brief_id UUID REFERENCES weekly_briefs(id) ON DELETE SET NULL;

-- 5. User topic preferences for learning algorithm
CREATE TABLE IF NOT EXISTS user_topic_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  key_type TEXT NOT NULL CHECK (key_type IN ('category', 'tag', 'entity')),
  key_value TEXT NOT NULL,
  weight NUMERIC DEFAULT 0,
  signal_count INTEGER DEFAULT 0,
  last_signal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key_type, key_value)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_weekly_briefs_scan_id 
ON weekly_briefs(scan_id) WHERE scan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_decision_assessments_scan_id 
ON decision_assessments(scan_id) WHERE scan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_decision_assessments_brief_id 
ON decision_assessments(brief_id) WHERE brief_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_topic_preferences_user 
ON user_topic_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_topic_preferences_weight 
ON user_topic_preferences(user_id, weight DESC);

-- =====================================================
-- RLS for user_topic_preferences
-- =====================================================

ALTER TABLE user_topic_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on user_topic_preferences" 
ON user_topic_preferences FOR ALL 
USING (true) WITH CHECK (true);

-- =====================================================
-- Trigger for updated_at on user_topic_preferences
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_topic_preferences_updated_at') THEN
    CREATE TRIGGER update_user_topic_preferences_updated_at
      BEFORE UPDATE ON user_topic_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- =====================================================
-- RPC: Upsert topic preference with weight delta
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_topic_preference(
  p_user_id TEXT,
  p_key_type TEXT,
  p_key_value TEXT,
  p_weight_delta NUMERIC
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_topic_preferences (user_id, key_type, key_value, weight, signal_count, last_signal_at)
  VALUES (p_user_id, p_key_type, p_key_value, p_weight_delta, 1, NOW())
  ON CONFLICT (user_id, key_type, key_value)
  DO UPDATE SET
    weight = user_topic_preferences.weight + p_weight_delta,
    signal_count = user_topic_preferences.signal_count + 1,
    last_signal_at = NOW(),
    updated_at = NOW();
END;
$$;
