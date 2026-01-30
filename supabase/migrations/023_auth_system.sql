-- ============================================
-- Migration 023: Authentication & User Profiles
-- ============================================
-- 
-- PURPOSE: Enable multi-user support with Supabase Auth
-- AUTHOR: MoltBOT
-- DATE: 2026-01-30
--
-- This migration:
-- 1. Creates user_profiles table linked to auth.users
-- 2. Updates all tables to use auth.uid() instead of 'default-user'
-- 3. Adds proper RLS policies for multi-tenant access
-- 4. Creates subscription tiers for future monetization
--
-- ROLLBACK:
--   See bottom of file for rollback instructions
-- ============================================

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Subscription & Billing
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
    trial_ends_at TIMESTAMPTZ,
    
    -- Usage Tracking
    articles_scanned_this_month INTEGER DEFAULT 0,
    llm_calls_this_month INTEGER DEFAULT 0,
    last_scan_at TIMESTAMPTZ,
    
    -- Preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON public.user_profiles(subscription_tier);

-- ============================================
-- 2. RLS FOR USER PROFILES
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. UPDATE EXISTING TABLES FOR MULTI-USER
-- ============================================

-- Add user_id to tables that don't have it properly
-- Note: We keep 'default-user' data for migration, will be cleaned up

-- Update RLS policies to use auth.uid()

-- user_signal_weights
DROP POLICY IF EXISTS "Users can manage their own signal weights" ON public.user_signal_weights;
CREATE POLICY "Users can manage their own signal weights"
    ON public.user_signal_weights FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text);

-- decision_assessments
DROP POLICY IF EXISTS "Users can manage own decisions" ON public.decision_assessments;
CREATE POLICY "Users can manage own decisions"
    ON public.decision_assessments FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text);

-- projects
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects"
    ON public.projects FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text);

-- story_clusters
DROP POLICY IF EXISTS "Users can manage their clusters" ON public.story_clusters;
CREATE POLICY "Users can manage their clusters"
    ON public.story_clusters FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text);

-- generated_outcomes
DROP POLICY IF EXISTS "Users can manage their outcomes" ON public.generated_outcomes;
CREATE POLICY "Users can manage their outcomes"
    ON public.generated_outcomes FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text);

-- ignore_reasons
DROP POLICY IF EXISTS "Users can manage their own ignore reasons" ON public.ignore_reasons;
CREATE POLICY "Users can manage their own ignore reasons"
    ON public.ignore_reasons FOR ALL
    USING (user_id = auth.uid()::text OR user_id = 'default-user')
    WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- 5. SUBSCRIPTION TIER LIMITS
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_limits (
    tier TEXT PRIMARY KEY,
    max_articles_per_month INTEGER,
    max_llm_calls_per_month INTEGER,
    max_projects INTEGER,
    features JSONB DEFAULT '{}'::jsonb
);

INSERT INTO public.subscription_limits (tier, max_articles_per_month, max_llm_calls_per_month, max_projects, features)
VALUES 
    ('free', 100, 50, 3, '{"weekly_synthesis": false, "linkedin_generator": false, "lead_discovery": false}'::jsonb),
    ('pro', 1000, 500, 20, '{"weekly_synthesis": true, "linkedin_generator": true, "lead_discovery": false}'::jsonb),
    ('team', 5000, 2000, 100, '{"weekly_synthesis": true, "linkedin_generator": true, "lead_discovery": true}'::jsonb),
    ('enterprise', -1, -1, -1, '{"weekly_synthesis": true, "linkedin_generator": true, "lead_discovery": true, "custom_sources": true}'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
    max_articles_per_month = EXCLUDED.max_articles_per_month,
    max_llm_calls_per_month = EXCLUDED.max_llm_calls_per_month,
    max_projects = EXCLUDED.max_projects,
    features = EXCLUDED.features;

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Get current user ID (falls back to default-user for backwards compat)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(auth.uid()::text, 'default-user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can perform action based on subscription
CREATE OR REPLACE FUNCTION public.check_subscription_limit(
    p_user_id UUID,
    p_limit_type TEXT -- 'articles', 'llm_calls', 'projects'
) RETURNS BOOLEAN AS $$
DECLARE
    v_tier TEXT;
    v_current INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get user tier
    SELECT subscription_tier INTO v_tier
    FROM public.user_profiles
    WHERE id = p_user_id;
    
    IF v_tier IS NULL THEN
        RETURN true; -- Allow if no profile (backwards compat)
    END IF;
    
    -- Get limit for tier
    IF p_limit_type = 'articles' THEN
        SELECT max_articles_per_month INTO v_limit FROM public.subscription_limits WHERE tier = v_tier;
        SELECT articles_scanned_this_month INTO v_current FROM public.user_profiles WHERE id = p_user_id;
    ELSIF p_limit_type = 'llm_calls' THEN
        SELECT max_llm_calls_per_month INTO v_limit FROM public.subscription_limits WHERE tier = v_tier;
        SELECT llm_calls_this_month INTO v_current FROM public.user_profiles WHERE id = p_user_id;
    ELSIF p_limit_type = 'projects' THEN
        SELECT max_projects INTO v_limit FROM public.subscription_limits WHERE tier = v_tier;
        SELECT COUNT(*) INTO v_current FROM public.projects WHERE user_id = p_user_id::text AND NOT is_archived;
    ELSE
        RETURN true;
    END IF;
    
    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN true;
    END IF;
    
    RETURN v_current < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly usage (to be called by cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        articles_scanned_this_month = 0,
        llm_calls_this_month = 0,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- To rollback this migration:
--
-- DROP FUNCTION IF EXISTS public.reset_monthly_usage();
-- DROP FUNCTION IF EXISTS public.check_subscription_limit(UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.current_user_id();
-- DROP TABLE IF EXISTS public.subscription_limits;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.user_profiles;
--
-- Then restore original RLS policies from migrations 016-022
