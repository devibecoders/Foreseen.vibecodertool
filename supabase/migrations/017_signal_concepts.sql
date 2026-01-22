-- Migration 017: Signal Concepts Extension
-- Adds signals JSONB column to analyses table for 3-layer signal model

-- 1. Add signals column to analyses table
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS signals JSONB DEFAULT '{}'::jsonb;

-- 2. Index for efficient GIN lookups on signals
CREATE INDEX IF NOT EXISTS idx_analyses_signals ON analyses USING GIN (signals);

-- 3. Comment explaining the signals structure
COMMENT ON COLUMN analyses.signals IS 'Extracted signals for 3-layer model: { categories: [], entities: [], tools: [], concepts: [] }';
