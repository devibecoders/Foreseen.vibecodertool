-- Migration 021: Intent Labels
-- Categorizes articles by intent: release, controversy, how-to, benchmark, opinion

-- ============================================
-- 1. ADD INTENT FIELDS TO ANALYSES
-- ============================================

ALTER TABLE public.analyses
ADD COLUMN IF NOT EXISTS intent_label TEXT,
ADD COLUMN IF NOT EXISTS intent_confidence DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS intent_signals JSONB DEFAULT '[]'::jsonb;

-- Constraint for valid intent labels
ALTER TABLE public.analyses DROP CONSTRAINT IF EXISTS valid_intent_label;
ALTER TABLE public.analyses ADD CONSTRAINT valid_intent_label 
    CHECK (intent_label IS NULL OR intent_label IN ('release', 'controversy', 'how-to', 'benchmark', 'opinion', 'news', 'research'));

COMMENT ON COLUMN public.analyses.intent_label IS 'Primary intent: release|controversy|how-to|benchmark|opinion|news|research';
COMMENT ON COLUMN public.analyses.intent_confidence IS 'Confidence in intent detection (0.0-1.0)';
COMMENT ON COLUMN public.analyses.intent_signals IS 'Keywords/patterns that triggered this intent';

-- ============================================
-- 2. INDEX FOR FILTERING
-- ============================================

CREATE INDEX IF NOT EXISTS idx_analyses_intent ON public.analyses(intent_label) WHERE intent_label IS NOT NULL;

-- ============================================
-- 3. INTENT STATISTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW public.intent_distribution AS
SELECT 
    intent_label,
    COUNT(*) as count,
    ROUND(AVG(impact_score), 1) as avg_impact,
    ROUND(AVG(intent_confidence::numeric), 2) as avg_confidence
FROM public.analyses
WHERE intent_label IS NOT NULL
GROUP BY intent_label
ORDER BY count DESC;

COMMENT ON VIEW public.intent_distribution IS 'Shows distribution of articles by intent type';
