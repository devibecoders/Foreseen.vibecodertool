-- ============================================================================
-- VIBECODE PROJECT PIPELINE
-- Client Project Management / CRM Module
-- ============================================================================

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default-user', -- Using TEXT for consistency with other tables
  
  -- Project Details
  name TEXT NOT NULL, -- e.g., "Mamalo", "Vivly"
  client_name TEXT,
  description TEXT,
  
  -- Metadata
  type TEXT CHECK (type IN ('Application', 'Website + Backend', 'Problem Solving', 'AI Integration')),
  status TEXT CHECK (status IN ('Prospect', 'Offer Sent', 'Setup', 'In Progress', 'Review', 'Done')),
  
  -- Visuals
  color_theme TEXT, -- e.g., 'purple', 'blue', 'green', 'orange'
  
  -- Financial
  quote_amount DECIMAL(10, 2), -- Offerte bedrag in euros
  
  -- Hand Over Document
  briefing TEXT, -- Project briefing, requirements, goals
  step_plan TEXT, -- Step-by-step execution plan
  
  -- Link to Knowledge Core (Optional but powerful)
  active_playbook_id UUID REFERENCES vibecode_playbooks(id) ON DELETE SET NULL,
  
  -- Archive
  is_archived BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_archived ON projects(is_archived) WHERE is_archived = false;
CREATE INDEX idx_projects_type ON projects(type);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Permissive policy for development (no auth.users dependency)
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA - Immediate Value for User
-- ============================================================================

-- Insert 3 mock projects so user sees immediate value
INSERT INTO projects (name, client_name, description, type, status, color_theme, is_archived) VALUES
  (
    'Mamalo',
    'Mamalo B.V.',
    'Mobile application for restaurant ordering and delivery management',
    'Application',
    'In Progress',
    'purple',
    false
  ),
  (
    'Vivly',
    'Vivly Health',
    'Healthcare platform with patient portal and backend API',
    'Website + Backend',
    'Offer Sent',
    'blue',
    false
  ),
  (
    'RetailTwin',
    'RetailTwin AI',
    'AI-powered retail analytics and inventory prediction system',
    'AI Integration',
    'Prospect',
    'orange',
    false
  );
