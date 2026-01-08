-- Enable Vector extension for future RAG features
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Vibecode Core (The Singularity)
CREATE TABLE vibecode_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  version INT DEFAULT 1,
  title TEXT DEFAULT 'Vibecode Knowledge Core',
  philosophy TEXT, -- Markdown content
  principles JSONB, -- Array of { "id": "p1", "title": "Speed over Perfect", "description": "..." }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Vibecode Tools (The Tech Stack Decision Matrix)
CREATE TABLE vibecode_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- e.g., 'Backend', 'Frontend', 'AI'
  status TEXT CHECK (status IN ('adopt', 'trial', 'assess', 'hold', 'deprecate')),
  when_to_use TEXT,
  when_not_to_use TEXT,
  tradeoffs TEXT, -- Crucial for decision making
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Vibecode Flows (The Playbooks)
CREATE TABLE vibecode_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB, -- Array of { "step": 1, "action": "...", "tool_id": "..." }
  anti_patterns TEXT, -- "What strictly NOT to do"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Vibecode Boundaries (The "NO" List)
CREATE TABLE vibecode_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('hard', 'soft')), -- Hard = never, Soft = requires approval
  rationale TEXT,
  alternative_approach TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vibecode_tools_core_id ON vibecode_tools(core_id);
CREATE INDEX idx_vibecode_flows_core_id ON vibecode_flows(core_id);
CREATE INDEX idx_vibecode_boundaries_core_id ON vibecode_boundaries(core_id);
CREATE INDEX idx_vibecode_core_user_id ON vibecode_core(user_id);
CREATE INDEX idx_vibecode_core_active ON vibecode_core(is_active) WHERE is_active = true;

-- RLS Policies (permissive for now, similar to weekly_synthesis tables)
ALTER TABLE vibecode_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_boundaries ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (no auth.users dependency)
CREATE POLICY "Allow all operations on vibecode_core" ON vibecode_core
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vibecode_tools" ON vibecode_tools
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vibecode_flows" ON vibecode_flows
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vibecode_boundaries" ON vibecode_boundaries
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vibecode_core_updated_at
  BEFORE UPDATE ON vibecode_core
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
