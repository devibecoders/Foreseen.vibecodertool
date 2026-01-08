-- ============================================================================
-- VIBECODE OPERATING SYSTEM FOR INNOVATION
-- Phase 1: Database Schema
-- ============================================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS decision_assessments CASCADE;
DROP TABLE IF EXISTS vibecode_radar_items CASCADE;
DROP TABLE IF EXISTS vibecode_playbooks CASCADE;
DROP TABLE IF EXISTS vibecode_principles CASCADE;

-- Keep existing: vibecode_core, vibecode_boundaries (rename vibecode_tools to vibecode_radar_items)
-- Note: We'll keep the existing structure but align with new naming

-- ============================================================================
-- 1. KNOWLEDGE CORE TABLES
-- ============================================================================

-- Vibecode Core already exists from migration 003, but let's ensure it has the right structure
-- We'll add any missing columns if needed via ALTER

-- Add missing columns to vibecode_core if they don't exist
DO $$ 
BEGIN
  -- Remove version and is_active if we want to simplify
  -- Keep: id, user_id, title, philosophy, created_at, updated_at
END $$;

-- Vibecode Principles (separate table instead of JSONB)
CREATE TABLE vibecode_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vibecode Radar Items (replaces vibecode_tools with new structure)
CREATE TABLE vibecode_radar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT, -- 'DevTools', 'Models', 'Security', 'Frontend', 'Backend', 'AI'
  status TEXT CHECK (status IN ('adopt', 'trial', 'assess', 'avoid')),
  rationale TEXT,
  linked_article_id TEXT, -- Optional link to source article (using TEXT for flexibility)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vibecode Playbooks (replaces vibecode_flows with clearer naming)
CREATE TABLE vibecode_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB, -- Array of {step_name, tool, goal, anti_pattern}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vibecode Boundaries already exists from migration 003
-- We'll keep it as is: id, core_id, title, severity, rationale, alternative_approach

-- Update boundaries to match new schema naming
ALTER TABLE vibecode_boundaries 
  RENAME COLUMN rationale TO why_not;

ALTER TABLE vibecode_boundaries 
  RENAME COLUMN alternative_approach TO alternative;

ALTER TABLE vibecode_boundaries 
  ADD COLUMN IF NOT EXISTS risk_level TEXT;

-- ============================================================================
-- 2. DECISION ENGINE TABLES
-- ============================================================================

CREATE TABLE decision_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user', -- Using TEXT for consistency with other tables
  article_id TEXT NOT NULL, -- Reference to articles table (using TEXT for flexibility)
  
  -- The Verdict
  action_required TEXT CHECK (action_required IN ('ignore', 'monitor', 'experiment', 'integrate')),
  impact_horizon TEXT CHECK (impact_horizon IN ('direct', 'mid', 'long')), -- 2 weeks vs 6 months
  confidence_score INT CHECK (confidence_score >= 1 AND confidence_score <= 5),
  
  -- Analysis
  risk_if_ignored TEXT,
  advantage_if_early TEXT,
  
  -- Logic Checks
  boundary_conflict_detected BOOLEAN DEFAULT false,
  conflict_notes TEXT, -- "Conflicts with Boundary: No Microservices"
  
  -- Metadata
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_vibecode_principles_core_id ON vibecode_principles(core_id);
CREATE INDEX idx_vibecode_principles_sort_order ON vibecode_principles(sort_order);
CREATE INDEX idx_vibecode_radar_items_core_id ON vibecode_radar_items(core_id);
CREATE INDEX idx_vibecode_radar_items_status ON vibecode_radar_items(status);
CREATE INDEX idx_vibecode_playbooks_core_id ON vibecode_playbooks(core_id);
CREATE INDEX idx_decision_assessments_user_id ON decision_assessments(user_id);
CREATE INDEX idx_decision_assessments_article_id ON decision_assessments(article_id);
CREATE INDEX idx_decision_assessments_action ON decision_assessments(action_required);
CREATE INDEX idx_decision_assessments_status ON decision_assessments(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE vibecode_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_radar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_assessments ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (no auth.users dependency)
CREATE POLICY "Allow all operations on vibecode_principles" ON vibecode_principles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vibecode_radar_items" ON vibecode_radar_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vibecode_playbooks" ON vibecode_playbooks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on decision_assessments" ON decision_assessments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Reuse existing update_updated_at_column function from migration 003

CREATE TRIGGER update_decision_assessments_updated_at
  BEFORE UPDATE ON decision_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATA MIGRATION NOTES
-- ============================================================================

-- If you have existing data in vibecode_tools, you may want to migrate it:
-- INSERT INTO vibecode_radar_items (core_id, title, category, status, rationale, created_at)
-- SELECT core_id, name as title, category, 
--        CASE 
--          WHEN status = 'hold' THEN 'avoid'
--          WHEN status = 'deprecate' THEN 'avoid'
--          ELSE status 
--        END as status,
--        COALESCE(when_to_use, '') || ' | ' || COALESCE(when_not_to_use, '') || ' | ' || COALESCE(tradeoffs, '') as rationale,
--        created_at
-- FROM vibecode_tools;

-- If you have principles stored as JSONB in vibecode_core, migrate them:
-- INSERT INTO vibecode_principles (core_id, title, description, sort_order)
-- SELECT 
--   vc.id as core_id,
--   principle->>'title' as title,
--   principle->>'description' as description,
--   (principle->>'id')::int as sort_order
-- FROM vibecode_core vc,
--      jsonb_array_elements(vc.principles) as principle
-- WHERE vc.principles IS NOT NULL;
