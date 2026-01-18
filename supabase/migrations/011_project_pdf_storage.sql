-- ============================================================================
-- PDF STORAGE FOR PROJECTS
-- Adds Supabase Storage bucket and URL columns for project PDFs
-- ============================================================================

-- Add URL columns for storing Supabase Storage file paths
ALTER TABLE projects ADD COLUMN IF NOT EXISTS briefing_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step_plan_url TEXT;

-- Note: The storage bucket 'project-documents' needs to be created via Supabase Dashboard
-- or using the Supabase CLI with the following settings:
-- - Bucket name: project-documents
-- - Public: false (private bucket for authenticated access)
-- - File size limit: 10MB
-- - Allowed MIME types: application/pdf
