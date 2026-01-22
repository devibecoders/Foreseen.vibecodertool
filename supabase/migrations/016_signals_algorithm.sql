-- Migration 016: Signals Algorithm v1
-- Creates user_signal_weights table and updates decision_assessments

-- 1. Create user_signal_weights table
CREATE TABLE IF NOT EXISTS public.user_signal_weights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL, -- Keep as text for now to match 'default-user' pattern
    feature_key text NOT NULL,                         -- e.g. "category:agents"
    feature_type text NOT NULL,                        -- e.g. "category"
    feature_value text NOT NULL,                       -- e.g. "agents"
    weight double precision NOT NULL DEFAULT 0,
    state text NOT NULL DEFAULT 'active',              -- 'active' | 'muted'
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, feature_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_signal_weights_user_type ON public.user_signal_weights(user_id, feature_type);
CREATE INDEX IF NOT EXISTS idx_user_signal_weights_updated ON public.user_signal_weights(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.user_signal_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using text user_id for now as per current project pattern)
-- RLS Policies (using text user_id for now as per current project pattern)
DROP POLICY IF EXISTS "Users can manage their own signal weights" ON public.user_signal_weights;
CREATE POLICY "Users can manage their own signal weights"
    ON public.user_signal_weights
    FOR ALL
    USING (user_id = 'default-user') -- TODO: Change to auth.uid() when auth is fully wired
    WITH CHECK (user_id = 'default-user');

-- 2. Ensure decision_assessments has all required fields
-- (These already exist in 013/014/015 but we ensure consistency)
-- Added scan_id, article_id, action_required in previous migrations.

-- 3. Extend Articles table to cache personalization scores (Optional but recommended)
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS personalization_cache jsonb;
-- This can store { base_score, preference_delta, adjusted_score, reasons } for a specific user

-- 4. Function for atomic upsert of signal weights
CREATE OR REPLACE FUNCTION public.upsert_signal_weight(
    p_user_id text,
    p_feature_key text,
    p_feature_type text,
    p_feature_value text,
    p_weight_delta double precision
) RETURNS void AS $$
BEGIN
    INSERT INTO public.user_signal_weights (
        user_id, feature_key, feature_type, feature_value, weight, state
    ) VALUES (
        p_user_id, p_feature_key, p_feature_type, p_feature_value, p_weight_delta, 'active'
    )
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET
        weight = user_signal_weights.weight + p_weight_delta,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
