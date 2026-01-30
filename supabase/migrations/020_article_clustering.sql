-- ============================================
-- Migration 020: Article Clustering / Deduplication
-- ============================================
-- 
-- PURPOSE: Groups similar articles into story clusters, picks best source
-- AUTHOR: MoltBOT
-- DATE: 2026-01-30
-- DEPENDS ON: 012_articles_scans_supabase.sql (articles table)
--
-- FEATURES:
--   - Story clusters table for grouping similar articles
--   - Automatic title slug generation for matching
--   - Best source selection based on impact score
--   - View for deduplicated article list
--
-- ROLLBACK:
--   DROP VIEW IF EXISTS public.clustered_articles_view;
--   DROP TRIGGER IF EXISTS trigger_update_cluster_timestamp ON public.story_clusters;
--   DROP TRIGGER IF EXISTS trigger_set_article_title_slug ON public.articles;
--   DROP FUNCTION IF EXISTS public.update_cluster_timestamp();
--   DROP FUNCTION IF EXISTS public.set_article_title_slug();
--   DROP FUNCTION IF EXISTS public.normalize_title_slug(TEXT);
--   ALTER TABLE public.articles DROP COLUMN IF EXISTS cluster_id, 
--     DROP COLUMN IF EXISTS is_cluster_primary, DROP COLUMN IF EXISTS title_slug;
--   DROP TABLE IF EXISTS public.story_clusters;
-- ============================================

-- ============================================
-- 1. STORY CLUSTERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.story_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default-user',
    
    -- Cluster metadata
    canonical_title TEXT NOT NULL,
    slug TEXT NOT NULL,  -- normalized slug for matching
    
    -- Best source tracking
    primary_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
    source_count INTEGER DEFAULT 1,
    
    -- Aggregated data
    max_impact_score INTEGER DEFAULT 50,
    earliest_published_at TIMESTAMPTZ,
    latest_published_at TIMESTAMPTZ,
    
    -- Sources list (for UI display)
    source_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add cluster reference to articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS cluster_id UUID REFERENCES public.story_clusters(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_cluster_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS title_slug TEXT;

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_story_clusters_user ON public.story_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_story_clusters_slug ON public.story_clusters(slug);
CREATE INDEX IF NOT EXISTS idx_story_clusters_updated ON public.story_clusters(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_cluster ON public.articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_title_slug ON public.articles(title_slug);

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE public.story_clusters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their clusters" ON public.story_clusters;
CREATE POLICY "Users can manage their clusters"
    ON public.story_clusters
    FOR ALL
    USING (user_id = 'default-user')
    WITH CHECK (user_id = 'default-user');

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to normalize title into slug for matching
CREATE OR REPLACE FUNCTION public.normalize_title_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(title, '[^\w\s]', '', 'g'),  -- Remove punctuation
                '\s+', ' ', 'g'                              -- Normalize whitespace
            ),
            '^\s+|\s+$', '', 'g'                             -- Trim
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-set title_slug on articles
CREATE OR REPLACE FUNCTION public.set_article_title_slug()
RETURNS TRIGGER AS $$
BEGIN
    NEW.title_slug := public.normalize_title_slug(NEW.title);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_article_title_slug ON public.articles;
CREATE TRIGGER trigger_set_article_title_slug
    BEFORE INSERT OR UPDATE OF title ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_article_title_slug();

-- ============================================
-- 5. UPDATE TRIGGER FOR TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_cluster_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cluster_timestamp ON public.story_clusters;
CREATE TRIGGER trigger_update_cluster_timestamp
    BEFORE UPDATE ON public.story_clusters
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cluster_timestamp();

-- ============================================
-- 6. BACKFILL EXISTING ARTICLES
-- ============================================

-- Set title_slug for existing articles
UPDATE public.articles 
SET title_slug = public.normalize_title_slug(title)
WHERE title_slug IS NULL;

-- ============================================
-- 7. VIEW FOR CLUSTERED ARTICLES
-- ============================================

CREATE OR REPLACE VIEW public.clustered_articles_view AS
SELECT 
    COALESCE(sc.id, a.id) as cluster_or_article_id,
    COALESCE(sc.canonical_title, a.title) as display_title,
    COALESCE(sc.source_count, 1) as source_count,
    COALESCE(sc.source_names, ARRAY[a.source]) as sources,
    COALESCE(sc.max_impact_score, an.impact_score, 50) as impact_score,
    a.id as article_id,
    a.url,
    a.source,
    a.published_at,
    a.scan_id,
    an.summary,
    an.categories,
    an.relevance_reason,
    an.customer_angle,
    an.vibecoders_angle,
    an.key_takeaways,
    sc.id as cluster_id,
    CASE 
        WHEN sc.id IS NOT NULL THEN true 
        ELSE false 
    END as is_clustered
FROM public.articles a
LEFT JOIN public.analyses an ON an.article_id = a.id
LEFT JOIN public.story_clusters sc ON sc.id = a.cluster_id AND a.is_cluster_primary = true
WHERE a.is_cluster_primary = true OR a.cluster_id IS NULL;

COMMENT ON VIEW public.clustered_articles_view IS 'Shows deduplicated articles - one row per story cluster or standalone article';
