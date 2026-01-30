-- ============================================
-- Migration 026: Project Intelligence
-- ============================================
-- 
-- PURPOSE: Merge Briefing into Projects as "Project Intelligence"
-- AUTHOR: MoltBOT (Foreseen V2)
-- DATE: 2026-01-30
--
-- The standalone Briefing feature is now integrated into Projects.
-- Each project can have AI-generated intelligence attached.
-- ============================================

-- ============================================
-- 1. ADD INTELLIGENCE JSONB COLUMN
-- ============================================

-- Main intelligence data (what was briefing summary)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'intelligence') THEN
        ALTER TABLE public.projects ADD COLUMN intelligence JSONB DEFAULT NULL;
    END IF;
END $$;

-- Source article (if created from Top 10)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'source_article_id') THEN
        ALTER TABLE public.projects ADD COLUMN source_article_id UUID;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'source_article_url') THEN
        ALTER TABLE public.projects ADD COLUMN source_article_url TEXT;
    END IF;
END $$;

-- Intelligence status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'intelligence_status') THEN
        ALTER TABLE public.projects 
        ADD COLUMN intelligence_status TEXT DEFAULT 'none'
        CHECK (intelligence_status IN ('none', 'generating', 'ready', 'error'));
    END IF;
END $$;

-- Intelligence generated at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'intelligence_generated_at') THEN
        ALTER TABLE public.projects ADD COLUMN intelligence_generated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Risk score (calculated from intelligence)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'risk_score') THEN
        ALTER TABLE public.projects 
        ADD COLUMN risk_score INTEGER DEFAULT 0
        CHECK (risk_score >= 0 AND risk_score <= 100);
    END IF;
END $$;

-- Estimated hours (from intelligence)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'projects' AND column_name = 'estimated_hours') THEN
        ALTER TABLE public.projects ADD COLUMN estimated_hours INTEGER;
    END IF;
END $$;

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_intelligence_status 
    ON public.projects(intelligence_status) 
    WHERE intelligence_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_risk_score 
    ON public.projects(risk_score DESC) 
    WHERE risk_score > 0;

CREATE INDEX IF NOT EXISTS idx_projects_source_article 
    ON public.projects(source_article_id) 
    WHERE source_article_id IS NOT NULL;

-- ============================================
-- 3. COMMENTS
-- ============================================

COMMENT ON COLUMN public.projects.intelligence IS 
'AI-generated project intelligence (was: Briefing). Contains:
- oneLiner: string
- painPoints: array of {id, title, description, severity, affectedArea}
- mustHaves: array of {id, requirement, rationale, category, priority}
- questions: array of {id, question, context, importance, suggestedDefault}
- assumptions: string[]
- outOfScope: string[]
- risks: array of {id, risk, impact, likelihood, mitigation}
- suggestedTasks: array of {title, description, estimate, priority}
- timeline: string | null
- budget: string | null
- stakeholders: string[]
- successCriteria: string[]';

COMMENT ON COLUMN public.projects.source_article_id IS 
'If project was created from Top 10, links to the source article';

COMMENT ON COLUMN public.projects.risk_score IS 
'Calculated risk score based on intelligence analysis (0-100)';
