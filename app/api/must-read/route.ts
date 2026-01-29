/**
 * API: Must-Read Top 10
 * Returns the top 10 articles with action suggestions
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
      .order('published_at', { ascending: false })
      .limit(100) // Fetch more, filter to top 10 after scoring

    if (scanId) {
      query = query.eq('scan_id', scanId)
    }

    const { data: articles, error: articlesError } = await query

    if (articlesError) throw new Error(`Failed to fetch articles: ${articlesError.message}`)

    // Fetch user weights for scoring
    const { data: weights, error: weightsError } = await supabase
      .from('user_signal_weights')
      .select('feature_key, weight, state, feature_type')
      .eq('user_id', 'default-user')
      .eq('state', 'active')

    if (weightsError) {
      console.warn('Failed to fetch weights:', weightsError.message)
    }

    // Transform articles for scoring
    const articlesForScoring = (articles || [])
      .filter(a => a.analyses && a.analyses.length > 0)
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

    // Add action suggestions based on score and intent
    const articlesWithActions = topArticles.map(article => {
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

      return {
        ...article,
        suggestedAction,
        actionRationale,
      }
    })

    return NextResponse.json({
      articles: articlesWithActions,
      total: articlesWithActions.length,
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
