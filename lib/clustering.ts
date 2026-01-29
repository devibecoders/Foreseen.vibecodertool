/**
 * Article Clustering / Deduplication Module
 * 
 * Groups similar articles into story clusters using:
 * - Title similarity (fuzzy matching)
 * - Entity overlap
 * - Publication time proximity
 * 
 * Picks best source based on:
 * - Impact score
 * - Source reputation tier
 * - Article completeness
 */

import { supabaseAdmin } from './supabase/server'

// Source reputation tiers (higher = more authoritative)
const SOURCE_TIERS: Record<string, number> = {
  // Tier 1: Primary tech publications
  'MIT Technology Review AI': 5,
  'The Verge AI': 5,
  'Ars Technica': 5,
  'Wired': 5,
  
  // Tier 2: Tech-focused news
  'VentureBeat AI': 4,
  'TechCrunch': 4,
  'The Information': 4,
  'Bloomberg': 4,
  
  // Tier 3: General tech aggregators
  'AI News': 3,
  'Hacker News': 3,
  'Artificial Intelligence News': 3,
  
  // Tier 4: Other sources
  'default': 2,
}

export interface ClusterResult {
  clusterId: string
  canonicalTitle: string
  primaryArticleId: string
  sourceCount: number
  sources: string[]
  maxImpactScore: number
  articleIds: string[]
}

export interface ClusteringStats {
  totalArticles: number
  clustersCreated: number
  articlesInClusters: number
  standaloneArticles: number
}

/**
 * Normalize title for comparison
 * Removes common prefixes, punctuation, and standardizes format
 */
export function normalizeForComparison(title: string): string {
  return title
    .toLowerCase()
    // Remove common news prefixes
    .replace(/^(breaking:|update:|exclusive:|report:|analysis:)\s*/i, '')
    // Remove source attribution suffixes
    .replace(/\s*[-–—|]\s*(the verge|techcrunch|wired|ars technica|mit tech.*|venturebeat).*$/i, '')
    // Remove punctuation except spaces
    .replace(/[^\w\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate similarity between two titles using Jaccard index
 * Returns value between 0 (different) and 1 (identical)
 */
export function titleSimilarity(title1: string, title2: string): number {
  const words1 = new Set(normalizeForComparison(title1).split(' ').filter(w => w.length > 2))
  const words2 = new Set(normalizeForComparison(title2).split(' ').filter(w => w.length > 2))
  
  if (words1.size === 0 || words2.size === 0) return 0
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

/**
 * Check if two articles are about the same story
 * Uses multiple signals: title similarity, time proximity
 */
export function isSameStory(
  article1: { title: string; published_at: string | null },
  article2: { title: string; published_at: string | null },
  threshold: number = 0.5
): boolean {
  // Title similarity check
  const similarity = titleSimilarity(article1.title, article2.title)
  
  if (similarity >= threshold) {
    // If titles are similar, check time proximity (within 7 days)
    if (article1.published_at && article2.published_at) {
      const time1 = new Date(article1.published_at).getTime()
      const time2 = new Date(article2.published_at).getTime()
      const daysDiff = Math.abs(time1 - time2) / (1000 * 60 * 60 * 24)
      
      // Very similar titles: allow wider time window
      if (similarity >= 0.7) return daysDiff <= 14
      // Moderately similar: narrower window
      return daysDiff <= 7
    }
    return true
  }
  
  return false
}

/**
 * Get source tier for ranking
 */
function getSourceTier(sourceName: string): number {
  return SOURCE_TIERS[sourceName] || SOURCE_TIERS['default']
}

/**
 * Pick the best article from a cluster to be the primary
 * Criteria: impact score > source tier > completeness > recency
 */
export function pickPrimaryArticle(
  articles: Array<{
    id: string
    title: string
    source: string
    published_at: string | null
    analysis?: { impact_score: number; summary?: string } | null
  }>
): string {
  if (articles.length === 0) throw new Error('Cannot pick primary from empty cluster')
  if (articles.length === 1) return articles[0].id
  
  // Score each article
  const scored = articles.map(article => {
    let score = 0
    
    // Impact score (0-100, weighted heavily)
    const impactScore = article.analysis?.impact_score || 50
    score += impactScore * 2
    
    // Source tier (1-5, multiply by 10)
    score += getSourceTier(article.source) * 10
    
    // Completeness (has summary)
    if (article.analysis?.summary && article.analysis.summary.length > 100) {
      score += 15
    }
    
    // Recency (slight preference for newer)
    if (article.published_at) {
      const age = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24)
      score += Math.max(0, 10 - age) // Up to 10 points for articles < 10 days old
    }
    
    return { article, score }
  })
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)
  
  return scored[0].article.id
}

/**
 * Generate canonical title for a cluster
 * Takes the clearest/shortest title that captures the story
 */
export function generateCanonicalTitle(titles: string[]): string {
  if (titles.length === 0) return 'Unknown'
  if (titles.length === 1) return titles[0]
  
  // Prefer shorter titles that still have substance
  const scored = titles.map(title => ({
    title,
    // Penalize very short or very long titles
    score: title.length < 30 ? title.length : 
           title.length > 100 ? 200 - title.length : 
           100
  }))
  
  scored.sort((a, b) => b.score - a.score)
  return scored[0].title
}

/**
 * Cluster articles from a specific scan
 * @param scanId - The scan to process
 * @returns Clustering statistics
 */
export async function clusterScanArticles(scanId: string): Promise<ClusteringStats> {
  const supabase = supabaseAdmin()
  
  // Fetch all articles from this scan with their analyses
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      source,
      published_at,
      cluster_id,
      analyses (
        impact_score,
        summary
      )
    `)
    .eq('scan_id', scanId)
    .order('published_at', { ascending: false })
  
  if (error) throw new Error(`Failed to fetch articles: ${error.message}`)
  if (!articles || articles.length === 0) {
    return { totalArticles: 0, clustersCreated: 0, articlesInClusters: 0, standaloneArticles: 0 }
  }
  
  // Transform articles to include analysis
  const articlesWithAnalysis = articles.map(a => ({
    ...a,
    analysis: a.analyses?.[0] || null
  }))
  
  // Build clusters using Union-Find approach
  const clusters: Map<string, string[]> = new Map() // clusterId -> articleIds
  const articleCluster: Map<string, string> = new Map() // articleId -> clusterId
  
  // Compare all pairs
  for (let i = 0; i < articlesWithAnalysis.length; i++) {
    const article1 = articlesWithAnalysis[i]
    
    // Skip if already in a cluster
    if (articleCluster.has(article1.id)) continue
    
    // Start a new potential cluster
    const clusterArticles = [article1]
    
    for (let j = i + 1; j < articlesWithAnalysis.length; j++) {
      const article2 = articlesWithAnalysis[j]
      
      // Skip if already in a different cluster
      if (articleCluster.has(article2.id)) continue
      
      if (isSameStory(article1, article2)) {
        clusterArticles.push(article2)
      }
    }
    
    // Only create cluster if we found similar articles
    if (clusterArticles.length > 1) {
      const clusterId = crypto.randomUUID()
      clusters.set(clusterId, clusterArticles.map(a => a.id))
      clusterArticles.forEach(a => articleCluster.set(a.id, clusterId))
    }
  }
  
  // Persist clusters to database
  let clustersCreated = 0
  let articlesInClusters = 0
  
  for (const [clusterId, articleIds] of clusters) {
    const clusterArticles = articlesWithAnalysis.filter(a => articleIds.includes(a.id))
    
    // Pick primary article
    const primaryId = pickPrimaryArticle(clusterArticles)
    
    // Generate canonical title
    const canonicalTitle = generateCanonicalTitle(clusterArticles.map(a => a.title))
    
    // Calculate aggregate data
    const maxImpactScore = Math.max(...clusterArticles.map(a => a.analysis?.impact_score || 50))
    const sourceNames = [...new Set(clusterArticles.map(a => a.source))]
    const publishedDates = clusterArticles
      .map(a => a.published_at)
      .filter(Boolean)
      .sort()
    
    // Create cluster record
    const { error: clusterError } = await supabase
      .from('story_clusters')
      .insert({
        id: clusterId,
        canonical_title: canonicalTitle,
        slug: normalizeForComparison(canonicalTitle),
        primary_article_id: primaryId,
        source_count: clusterArticles.length,
        max_impact_score: maxImpactScore,
        source_names: sourceNames,
        earliest_published_at: publishedDates[0] || null,
        latest_published_at: publishedDates[publishedDates.length - 1] || null,
      })
    
    if (clusterError) {
      console.error(`Failed to create cluster: ${clusterError.message}`)
      continue
    }
    
    // Update articles with cluster reference
    for (const article of clusterArticles) {
      await supabase
        .from('articles')
        .update({
          cluster_id: clusterId,
          is_cluster_primary: article.id === primaryId,
        })
        .eq('id', article.id)
    }
    
    clustersCreated++
    articlesInClusters += clusterArticles.length
  }
  
  const standaloneArticles = articlesWithAnalysis.length - articlesInClusters
  
  return {
    totalArticles: articlesWithAnalysis.length,
    clustersCreated,
    articlesInClusters,
    standaloneArticles,
  }
}

/**
 * Get deduplicated articles for display
 * Returns primary articles from clusters + standalone articles
 */
export async function getDeduplicatedArticles(scanId?: string): Promise<any[]> {
  const supabase = supabaseAdmin()
  
  let query = supabase
    .from('articles')
    .select(`
      id,
      title,
      url,
      source,
      published_at,
      cluster_id,
      is_cluster_primary,
      analyses (
        id,
        summary,
        categories,
        impact_score,
        relevance_reason,
        customer_angle,
        vibecoders_angle,
        key_takeaways,
        signals
      ),
      story_clusters (
        id,
        canonical_title,
        source_count,
        source_names,
        max_impact_score
      )
    `)
    .or('cluster_id.is.null,is_cluster_primary.eq.true')
    .order('published_at', { ascending: false })
  
  if (scanId) {
    query = query.eq('scan_id', scanId)
  }
  
  const { data, error } = await query
  
  if (error) throw new Error(`Failed to fetch deduplicated articles: ${error.message}`)
  
  // Transform to include cluster metadata
  return (data || []).map(article => {
    const cluster = article.story_clusters?.[0]
    return {
      ...article,
      // Use cluster data if available
      displayTitle: cluster?.canonical_title || article.title,
      sourceCount: cluster?.source_count || 1,
      allSources: cluster?.source_names || [article.source],
      isClusterPrimary: article.is_cluster_primary || false,
      clusterId: article.cluster_id,
      analysis: article.analyses?.[0] || null,
    }
  })
}

/**
 * Get all articles in a cluster
 */
export async function getClusterArticles(clusterId: string): Promise<any[]> {
  const supabase = supabaseAdmin()
  
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      url,
      source,
      published_at,
      is_cluster_primary,
      analyses (
        impact_score,
        summary
      )
    `)
    .eq('cluster_id', clusterId)
    .order('is_cluster_primary', { ascending: false })
  
  if (error) throw new Error(`Failed to fetch cluster articles: ${error.message}`)
  
  return data || []
}
