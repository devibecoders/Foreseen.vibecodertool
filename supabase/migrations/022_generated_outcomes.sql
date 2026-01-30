-- ============================================
-- Migration 022: Generated Outcomes Storage
-- ============================================
-- 
-- PURPOSE: Stores AI-generated action items from article decisions
-- AUTHOR: MoltBOT
-- DATE: 2026-01-30
-- DEPENDS ON: 012_articles_scans_supabase.sql (articles table)
--
-- OUTCOME TYPES:
--   - checklist: Implementation steps with time estimates
--   - reminder: Future check-in with trigger conditions
--   - spike: Experimental plan with hypothesis and abort criteria
--
-- USAGE:
--   Generated via "One-click Outcome Generator" buttons in UI
--   LLM call only happens on button click (cost control)
--
-- ROLLBACK:
--   DROP VIEW IF EXISTS public.recent_outcomes;
--   DROP TABLE IF EXISTS public.generated_outcomes;
-- ============================================

CREATE TABLE IF NOT EXISTS public.generated_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default-user',
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    
    outcome_type TEXT NOT NULL CHECK (outcome_type IN ('checklist', 'reminder', 'spike')),
    outcome_data JSONB NOT NULL,
    outcome_markdown TEXT,
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outcomes_user ON public.generated_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_article ON public.generated_outcomes(article_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_type ON public.generated_outcomes(outcome_type);

-- RLS
ALTER TABLE public.generated_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their outcomes"
    ON public.generated_outcomes
    FOR ALL
    USING (user_id = 'default-user')
    WITH CHECK (user_id = 'default-user');

-- View for recent outcomes
CREATE OR REPLACE VIEW public.recent_outcomes AS
SELECT 
    go.id,
    go.outcome_type,
    go.outcome_data->>'title' as title,
    go.created_at,
    go.is_completed,
    a.title as article_title,
    a.url as article_url
FROM public.generated_outcomes go
JOIN public.articles a ON a.id = go.article_id
ORDER BY go.created_at DESC
LIMIT 50;

COMMENT ON TABLE public.generated_outcomes IS 'Stores AI-generated checklists, spikes, and reminders';
