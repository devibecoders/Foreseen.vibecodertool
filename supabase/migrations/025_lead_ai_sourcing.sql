-- ============================================
-- Migration 025: Lead AI Sourcing
-- ============================================
-- 
-- PURPOSE: Enable AI-generated lead batches
-- AUTHOR: MoltBOT (Foreseen V2)
-- DATE: 2026-01-30
--
-- Changes:
-- 1. Add source_type column for distinguishing AI vs manual leads
-- 2. Add batch_id for grouping AI generations
-- 3. Add AI analysis fields
-- ============================================

-- ============================================
-- 1. ADD NEW COLUMNS
-- ============================================

-- Source type: distinguish between manual and AI-generated leads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'source_type') THEN
        ALTER TABLE public.leads 
        ADD COLUMN source_type TEXT DEFAULT 'manual' 
        CHECK (source_type IN ('manual', 'ai_generated'));
    END IF;
END $$;

-- Batch ID: group AI-generated leads together
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'batch_id') THEN
        ALTER TABLE public.leads ADD COLUMN batch_id TEXT;
    END IF;
END $$;

-- Batch type: what kind of batch was this (small, medium, startup)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'batch_type') THEN
        ALTER TABLE public.leads 
        ADD COLUMN batch_type TEXT 
        CHECK (batch_type IN ('small', 'medium', 'startup'));
    END IF;
END $$;

-- Why this lead was targeted (AI reasoning)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'why_target') THEN
        ALTER TABLE public.leads ADD COLUMN why_target TEXT;
    END IF;
END $$;

-- AI confidence score for this lead
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'confidence_score') THEN
        ALTER TABLE public.leads 
        ADD COLUMN confidence_score INTEGER 
        CHECK (confidence_score >= 0 AND confidence_score <= 100);
    END IF;
END $$;

-- Estimated project value from AI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'estimated_value') THEN
        ALTER TABLE public.leads ADD COLUMN estimated_value TEXT;
    END IF;
END $$;

-- Suggested approach from AI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'suggested_approach') THEN
        ALTER TABLE public.leads ADD COLUMN suggested_approach TEXT;
    END IF;
END $$;

-- Pain points detected by AI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'pain_points') THEN
        ALTER TABLE public.leads ADD COLUMN pain_points JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Fit score (how well this matches Vibecoders services)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'fit_score') THEN
        ALTER TABLE public.leads 
        ADD COLUMN fit_score INTEGER 
        CHECK (fit_score >= 0 AND fit_score <= 100);
    END IF;
END $$;

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_source_type ON public.leads(source_type);
CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON public.leads(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_confidence ON public.leads(confidence_score DESC) WHERE confidence_score IS NOT NULL;

-- ============================================
-- 3. LEAD BATCHES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.lead_batches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default-user',
    
    batch_type TEXT NOT NULL CHECK (batch_type IN ('small', 'medium', 'startup')),
    industry_focus TEXT,
    region_focus TEXT,
    
    requested_count INTEGER NOT NULL,
    generated_count INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_batches_user ON public.lead_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_batches_status ON public.lead_batches(status);

-- RLS
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batches"
    ON public.lead_batches FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text OR user_id = 'default-user');

-- ============================================
-- 4. UPDATED VIEWS
-- ============================================

-- View for AI-generated leads stats
CREATE OR REPLACE VIEW public.lead_sourcing_stats AS
SELECT 
    user_id,
    source_type,
    batch_type,
    COUNT(*) as count,
    AVG(quality_score) as avg_quality,
    AVG(confidence_score) as avg_confidence,
    AVG(fit_score) as avg_fit
FROM public.leads
WHERE status != 'archived'
GROUP BY user_id, source_type, batch_type;

GRANT SELECT ON public.lead_sourcing_stats TO anon, authenticated;

-- ============================================
-- 5. MIGRATE EXISTING DATA
-- ============================================

-- Set existing leads to 'manual' source type if not set
UPDATE public.leads SET source_type = 'manual' WHERE source_type IS NULL;
