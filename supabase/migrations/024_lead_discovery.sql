-- ============================================
-- Migration 024: Lead Discovery Engine
-- ============================================
-- 
-- PURPOSE: Track and manage sales leads with qualification
-- AUTHOR: MoltBOT
-- DATE: 2026-01-30
--
-- This migration creates:
-- 1. Leads table for storing discovered companies
-- 2. Lead analyses for AI-generated insights
-- 3. Outreach tracking
-- ============================================

-- ============================================
-- 1. LEADS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default-user',
    
    -- Company Info
    company_name TEXT NOT NULL,
    website_url TEXT,
    industry TEXT,
    location TEXT,
    company_size TEXT, -- 'small', 'medium', 'large'
    
    -- Contact Info
    contact_name TEXT,
    contact_email TEXT,
    contact_linkedin TEXT,
    contact_role TEXT,
    
    -- Qualification
    quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'researching', 'qualified', 'contacted', 
        'replied', 'meeting', 'proposal', 'won', 'lost', 'archived'
    )),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Analysis (from AI or manual)
    website_issues JSONB DEFAULT '[]'::jsonb,
    opportunities JSONB DEFAULT '[]'::jsonb,
    fit_reasons JSONB DEFAULT '[]'::jsonb,
    
    -- Outreach
    outreach_email_draft TEXT,
    outreach_linkedin_draft TEXT,
    last_contacted_at TIMESTAMPTZ,
    follow_up_date DATE,
    
    -- Notes
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Source tracking
    source TEXT DEFAULT 'manual', -- 'manual', 'linkedin', 'google', 'referral', 'import'
    source_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_user ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_quality ON public.leads(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON public.leads(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- ============================================
-- 2. LEAD ACTIVITIES (Timeline)
-- ============================================

CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'default-user',
    
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'created', 'status_change', 'email_sent', 'email_opened', 
        'linkedin_sent', 'called', 'meeting', 'note_added', 
        'proposal_sent', 'won', 'lost'
    )),
    
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON public.lead_activities(activity_type);

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own leads"
    ON public.leads FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text OR user_id = 'default-user');

CREATE POLICY "Users can manage own activities"
    ON public.lead_activities FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text OR user_id = 'default-user');

-- ============================================
-- 4. ANALYTICS VIEWS
-- ============================================

CREATE OR REPLACE VIEW public.lead_pipeline_stats AS
SELECT 
    user_id,
    status,
    COUNT(*) as count,
    AVG(quality_score) as avg_quality,
    COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'urgent') as high_priority_count
FROM public.leads
WHERE status != 'archived'
GROUP BY user_id, status;

CREATE OR REPLACE VIEW public.lead_conversion_funnel AS
SELECT 
    user_id,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
    COUNT(*) FILTER (WHERE status = 'replied') as replied,
    COUNT(*) FILTER (WHERE status = 'meeting') as meetings,
    COUNT(*) FILTER (WHERE status = 'proposal') as proposals,
    COUNT(*) FILTER (WHERE status = 'won') as won,
    COUNT(*) FILTER (WHERE status = 'lost') as lost
FROM public.leads
GROUP BY user_id;

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Log activity when lead status changes
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.lead_activities (lead_id, user_id, activity_type, description, metadata)
        VALUES (
            NEW.id,
            NEW.user_id,
            'status_change',
            'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
            jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_status_change ON public.leads;
CREATE TRIGGER trigger_lead_status_change
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.log_lead_status_change();

-- Log activity on lead creation
CREATE OR REPLACE FUNCTION public.log_lead_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.lead_activities (lead_id, user_id, activity_type, description)
    VALUES (NEW.id, NEW.user_id, 'created', 'Lead created');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lead_created ON public.leads;
CREATE TRIGGER trigger_lead_created
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.log_lead_created();

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON public.lead_pipeline_stats TO anon, authenticated;
GRANT SELECT ON public.lead_conversion_funnel TO anon, authenticated;
