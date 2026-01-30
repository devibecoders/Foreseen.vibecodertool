/**
 * API: Must-Read Top 10
 * 
 * Automatically generates the top 10 must-read articles using:
 * - Signal weights (personalization)
 * - Decision history (feedback loop)
 * - Intent labels (actionability)
 * 
 * V2: Full provenance tracking and project conversion support
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { scoreArticlesV2 } from '@/lib/signals/scoreArticles'

// Action thresholds
const INTEGRATE_THRESHOLD = 75  // High-scoring, release or how-to intent
const EXPERIMENT_THRESHOLD = 60  // Medium-high, experiment-worthy
const TOP_N = 10

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(req.url)
    const scanId = searchParams.get('scanId')
    const daysBack = parseInt(searchParams.get('days') || '7')

    // Calculate date range
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    // Fetch articles with clustering and analysis
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        url,
        source,
        published_at,
        raw_content,
        cluster_id,
        is_cluster_primary,
        scan_id,
        analyses (
          id,
          summary,
          categories,
          impact_score,
          relevance_reason,
          customer_angle,
          vibecoders_angle,
          key_takeaways,
          signals,
          intent_label,
          intent_confidence
        ),
        story_clusters (
          id,
          canonical_title,
          source_count,
          source_names,
          max_impact_score
        )
      `)
      // Only get primary articles or unclustered
      .or('cluster_id.is.null,is_cluster_primary.eq.true')
      .gte('published_at', cutoffDate.toISOString())
      .order('published_at', { ascending: false })
      .limit(100) // Fetch more, filter to top 10 after scoring

    if (scanId) {
      query = query.eq('scan_id', scanId)
    }

    const { data: articles, error: articlesError } = await query

    if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`)

    // Fetch user weights for scoring
    const { data: weights, error: weightsError } = await supabase
      .from('signal_weights')
      .select('feature_key, weight, state, feature_type')

    if (weightsError) {
      console.warn('Failed to fetch weights:', weightsError.message)
    }

    // Fetch recent decisions for context
    const { data: recentDecisions } = await supabase
      .from('decisions')
      .select('article_id, action')
      .gte('created_at', cutoffDate.toISOString())
      .limit(50)

    const decisionMap = new Map(
      (recentDecisions || []).map(d => [d.article_id, d.action])
    )

    // Transform articles for scoring
    const articlesForScoring = (articles || [])
      .filter(a => a.analyses && a.analyses.length > 0)
      .filter(a => !decisionMap.has(a.id) || decisionMap.get(a.id) !== 'reject') // Exclude rejected
      .map(article => {
        const cluster = article.story_clusters?.[0]
        return {
          ...article,
          analysis: article.analyses?.[0],
          displayTitle: cluster?.canonical_title || article.title,
          sourceCount: cluster?.source_count || 1,
          allSources: cluster?.source_names || [article.source],
          clusterId: article.cluster_id,
        }
      })

    // Score articles
    const scoredArticles = scoreArticlesV2(articlesForScoring, weights || [])

    // Sort by adjusted score descending
    scoredArticles.sort((a, b) => b.adjusted_score - a.adjusted_score)

    // Take top N
    const topArticles = scoredArticles.slice(0, TOP_N)

    // Add action suggestions, provenance, and project conversion data
    const articlesWithActions = topArticles.map((article, index) => {
      const intent = article.analysis?.intent_label
      const score = article.adjusted_score

      let suggestedAction: 'integrate' | 'experiment' | 'monitor'
      let actionRationale: string

      // Determine action based on score and intent
      if (score >= INTEGRATE_THRESHOLD && ['release', 'how-to'].includes(intent || '')) {
        suggestedAction = 'integrate'
        actionRationale = intent === 'release' 
          ? 'New release with high relevance — consider adopting immediately.'
          : 'High-value how-to guide — follow the steps and integrate into your workflow.'
      } else if (score >= INTEGRATE_THRESHOLD && intent === 'benchmark') {
        suggestedAction = 'experiment'
        actionRationale = 'Strong benchmark results — run your own test to validate.'
      } else if (score >= EXPERIMENT_THRESHOLD) {
        suggestedAction = 'experiment'
        if (intent === 'controversy') {
          actionRationale = 'Significant controversy — understand the risks before deciding.'
        } else if (intent === 'research') {
          actionRationale = 'Promising research — spike to test applicability to your use case.'
        } else {
          actionRationale = 'Worth exploring — schedule a time-boxed spike this week.'
        }
      } else {
        suggestedAction = 'monitor'
        if (intent === 'opinion') {
          actionRationale = 'Interesting perspective — save for future reference.'
        } else {
          actionRationale = 'Not actionable yet — keep watching for developments.'
        }
      }

      // Special case: controversies with high scores need attention
      if (intent === 'controversy' && score >= 70) {
        suggestedAction = 'experiment'
        actionRationale = 'High-impact controversy — assess risk to your projects immediately.'
      }

      // Add provenance - link back to source scan/article
      const provenance = {
        scan_id: article.scan_id,
        scan_url: article.scan_id ? `/research/scan/${article.scan_id}` : null,
        original_url: article.url,
        source: article.source,
        published_at: article.published_at,
      }

      // Suggest project conversion for high-scoring actionable items
      const canConvertToProject = 
        suggestedAction === 'integrate' || 
        (suggestedAction === 'experiment' && score >= 70)

      const projectSuggestion = canConvertToProject ? {
        suggested_name: `Research: ${article.displayTitle || article.title}`.substring(0, 100),
        suggested_description: article.analysis?.summary || '',
        suggested_tasks: [
          `Review article: ${article.url}`,
          suggestedAction === 'integrate' 
            ? 'Implement findings into workflow'
            : 'Run time-boxed experiment (2-4 hours)',
          'Document learnings'
        ]
      } : null

      return {
        ...article,
        rank: index + 1,
        suggestedAction,
        actionRationale,
        provenance,
        canConvertToProject,
        projectSuggestion,
      }
    })

    return NextResponse.json({
      articles: articlesWithActions,
      total: articlesWithActions.length,
      generated_at: new Date().toISOString(),
      date_range: {
        from: cutoffDate.toISOString(),
        to: new Date().toISOString(),
        days: daysBack,
      },
      thresholds: {
        integrate: INTEGRATE_THRESHOLD,
        experiment: EXPERIMENT_THRESHOLD,
      }
    })
  } catch (error) {
    console.error('Must-read fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch must-read articles' },
      { status: 500 }
    )
  }
}
