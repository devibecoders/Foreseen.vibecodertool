-- Migration 019: Enhanced Decisions System
-- Adds: confidence tracking, ignore reasons, weight decay

-- ============================================
-- 1. DECISION CONFIDENCE TRACKING
-- ============================================

-- Add confidence columns to decision_assessments
ALTER TABLE public.decision_assessments
ADD COLUMN IF NOT EXISTS confidence_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS revisable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS decision_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS revised_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revised_from TEXT;

-- Add comment
COMMENT ON COLUMN public.decision_assessments.confidence_level IS 'low|medium|high - affects weight impact and decay';
COMMENT ON COLUMN public.decision_assessments.revisable IS 'Whether this decision can be changed later';
COMMENT ON COLUMN public.decision_assessments.decision_time_seconds IS 'Time spent making the decision';

-- ============================================
-- 2. IGNORE REASONS
-- ============================================

-- Create ignore_reasons table
CREATE TABLE IF NOT EXISTS public.ignore_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default-user',
    decision_id UUID REFERENCES public.decision_assessments(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    reason_type TEXT NOT NULL,
    reason_text TEXT,
    signals_at_time JSONB,
    weight_adjustments JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ignore_reasons_user ON public.ignore_reasons(user_id);
CREATE INDEX IF NOT EXISTS idx_ignore_reasons_type ON public.ignore_reasons(reason_type);
CREATE INDEX IF NOT EXISTS idx_ignore_reasons_article ON public.ignore_reasons(article_id);

-- RLS
ALTER TABLE public.ignore_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own ignore reasons" ON public.ignore_reasons;
CREATE POLICY "Users can manage their own ignore reasons"
    ON public.ignore_reasons
    FOR ALL
    USING (user_id = 'default-user')
    WITH CHECK (user_id = 'default-user');

-- ============================================
-- 3. WEIGHT DECAY TRACKING
-- ============================================

-- Add decay columns to user_signal_weights
ALTER TABLE public.user_signal_weights
ADD COLUMN IF NOT EXISTS last_decision_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decay_applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS avg_confidence TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS decision_count INTEGER DEFAULT 0;

-- Index for efficient decay queries
CREATE INDEX IF NOT EXISTS idx_user_signal_weights_last_decision 
ON public.user_signal_weights(user_id, last_decision_at);

-- ============================================
-- 4. ANALYTICS VIEWS
-- ============================================

-- Ignore reason statistics
CREATE OR REPLACE VIEW public.ignore_reason_stats AS
SELECT 
    reason_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as percentage
FROM public.ignore_reasons
GROUP BY reason_type
ORDER BY count DESC;

-- Signal weight health (detect stale weights)
CREATE OR REPLACE VIEW public.signal_weight_health AS
SELECT 
    feature_type,
    COUNT(*) as total_weights,
    COUNT(*) FILTER (WHERE last_decision_at IS NULL) as never_used,
    COUNT(*) FILTER (WHERE last_decision_at < now() - interval '4 weeks') as stale_4w,
    COUNT(*) FILTER (WHERE last_decision_at < now() - interval '8 weeks') as stale_8w,
    ROUND(AVG(ABS(weight)), 2) as avg_weight,
    ROUND(AVG(decision_count), 1) as avg_decisions
FROM public.user_signal_weights
WHERE user_id = 'default-user'
GROUP BY feature_type
ORDER BY total_weights DESC;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to apply weight decay
CREATE OR REPLACE FUNCTION public.apply_weight_decay(
    p_user_id TEXT,
    p_decay_factor DOUBLE PRECISION DEFAULT 0.9,
    p_min_weight DOUBLE PRECISION DEFAULT 0.1,
    p_grace_weeks INTEGER DEFAULT 2
) RETURNS TABLE (
    feature_key TEXT,
    old_weight DOUBLE PRECISION,
    new_weight DOUBLE PRECISION,
    weeks_since_decision DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    WITH decayed AS (
        SELECT 
            usw.id,
            usw.feature_key,
            usw.weight as old_weight,
            EXTRACT(EPOCH FROM (now() - usw.last_decision_at)) / 604800.0 as weeks,
            CASE 
                WHEN usw.last_decision_at IS NULL THEN usw.weight
                WHEN EXTRACT(EPOCH FROM (now() - usw.last_decision_at)) / 604800 < p_grace_weeks THEN usw.weight
                ELSE 
                    CASE 
                        WHEN usw.weight > 0 THEN
                            GREATEST(
                                p_min_weight,
                                usw.weight * POWER(p_decay_factor, 
                                    EXTRACT(EPOCH FROM (now() - usw.last_decision_at)) / 604800 - p_grace_weeks
                                )
                            )
                        WHEN usw.weight < 0 THEN
                            LEAST(
                                -p_min_weight,
                                usw.weight * POWER(p_decay_factor, 
                                    EXTRACT(EPOCH FROM (now() - usw.last_decision_at)) / 604800 - p_grace_weeks
                                )
                            )
                        ELSE 0
                    END
            END as new_weight
        FROM public.user_signal_weights usw
        WHERE usw.user_id = p_user_id
            AND usw.state = 'active'
            AND usw.weight != 0
    )
    UPDATE public.user_signal_weights w
    SET 
        weight = d.new_weight,
        decay_applied_at = now()
    FROM decayed d
    WHERE w.id = d.id
        AND w.weight != d.new_weight
    RETURNING d.feature_key, d.old_weight, d.new_weight, d.weeks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update weight with confidence
CREATE OR REPLACE FUNCTION public.update_weight_with_confidence(
    p_user_id TEXT,
    p_feature_key TEXT,
    p_feature_type TEXT,
    p_feature_value TEXT,
    p_weight_delta DOUBLE PRECISION,
    p_confidence TEXT DEFAULT 'medium'
) RETURNS void AS $$
DECLARE
    confidence_multiplier DOUBLE PRECISION;
BEGIN
    confidence_multiplier := CASE p_confidence
        WHEN 'high' THEN 1.5
        WHEN 'medium' THEN 1.0
        WHEN 'low' THEN 0.5
        ELSE 1.0
    END;

    INSERT INTO public.user_signal_weights (
        user_id, feature_key, feature_type, feature_value, 
        weight, state, last_decision_at, decision_count, avg_confidence
    ) VALUES (
        p_user_id, p_feature_key, p_feature_type, p_feature_value,
        p_weight_delta * confidence_multiplier, 'active', now(), 1, p_confidence
    )
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET
        weight = user_signal_weights.weight + (p_weight_delta * confidence_multiplier),
        last_decision_at = now(),
        decision_count = user_signal_weights.decision_count + 1,
        avg_confidence = p_confidence,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. GRANTS
-- ============================================

GRANT SELECT ON public.ignore_reason_stats TO anon, authenticated;
GRANT SELECT ON public.signal_weight_health TO anon, authenticated;
