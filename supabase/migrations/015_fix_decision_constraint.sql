-- =====================================================
-- Migration 015: Fix decision_assessments unique constraint + muted preferences
-- =====================================================

-- 1. Add unique constraint to decision_assessments for proper upsert
-- One decision per (user_id, article_id) - if user decides on same article again, update it
ALTER TABLE decision_assessments 
DROP CONSTRAINT IF EXISTS decision_assessments_user_article_unique;

ALTER TABLE decision_assessments 
ADD CONSTRAINT decision_assessments_user_article_unique 
UNIQUE (user_id, article_id);

-- 2. Add muted column to user_topic_preferences for hard suppress
ALTER TABLE user_topic_preferences 
ADD COLUMN IF NOT EXISTS muted BOOLEAN DEFAULT false;

-- 3. Create index on muted for filtering
CREATE INDEX IF NOT EXISTS idx_user_topic_preferences_muted 
ON user_topic_preferences(user_id, muted) WHERE muted = true;

-- 4. Update upsert function to handle mute
CREATE OR REPLACE FUNCTION upsert_topic_preference(
  p_user_id TEXT,
  p_key_type TEXT,
  p_key_value TEXT,
  p_weight_delta NUMERIC,
  p_muted BOOLEAN DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_topic_preferences (user_id, key_type, key_value, weight, signal_count, last_signal_at, muted)
  VALUES (p_user_id, p_key_type, p_key_value, p_weight_delta, 1, NOW(), COALESCE(p_muted, false))
  ON CONFLICT (user_id, key_type, key_value)
  DO UPDATE SET
    weight = CASE 
      WHEN p_muted = true THEN -10 
      ELSE user_topic_preferences.weight + p_weight_delta 
    END,
    signal_count = user_topic_preferences.signal_count + 1,
    last_signal_at = NOW(),
    muted = COALESCE(p_muted, user_topic_preferences.muted),
    updated_at = NOW();
END;
$$;
