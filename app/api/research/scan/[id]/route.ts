/**
 * Single Scan API Route
 * 
 * DELETE /api/scans/[id] - Delete a scan
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id
  try {
    const supabase = supabaseAdmin()
    const { data: scan, error } = await supabase
      .from('scans')
      .select(`
        id, started_at, completed_at, items_fetched, items_analyzed, status,
        articles (
          id, title, url, source, published_at, scan_id,
          analyses (id, summary, categories, impact_score, relevance_reason, customer_angle, vibecoders_angle, key_takeaways, signals)
        )
      `)
      .eq('id', scanId)
      .single()

    if (error) {
      console.error(`[Scan Detail ${scanId}] Error fetching:`, error)
      throw error
    }

    console.log(`[Scan Detail ${scanId}] Fetched. Articles: ${scan.articles?.length || 0}`)

    // Fetch signal weights (Signals v1)
    const { data: weights } = await supabase
      .from('user_signal_weights')
      .select('*')
      .eq('user_id', 'default-user')

    const { scoreArticlesV2 } = await import('@/lib/signals/scoreArticles')

    // Fetch decisions for this scan
    const { data: decisions } = await supabase
      .from('decision_assessments')
      .select('*')
      .eq('scan_id', scanId)
      .eq('user_id', 'default-user') // TODO: use auth.uid()

    const decisionMap = new Map()
    decisions?.forEach((d: any) => decisionMap.set(d.article_id, d))

    // Transform article data for frontend
    const articles = (scan.articles || []).map((article: any) => {
      // Handle both array and object responses from Supabase for the 1-to-1 analyses relation
      const analyses = article.analyses
      const analysisData = Array.isArray(analyses) ? analyses[0] : analyses

      const userDecision = decisionMap.get(article.id)

      return {
        id: article.id,
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.published_at,
        scanId: article.scan_id,
        decision: userDecision ? {
          id: userDecision.id,
          action: userDecision.action_required,
          createdAt: userDecision.created_at
        } : null,
        analysis: analysisData ? {
          summary: analysisData.summary,
          categories: analysisData.categories,
          impactScore: analysisData.impact_score,
          relevanceReason: analysisData.relevance_reason,
          customerAngle: analysisData.customer_angle,
          vibecodersAngle: analysisData.vibecoders_angle,
          keyTakeaways: analysisData.key_takeaways,
          signals: analysisData.signals // Pass through signals for transparency
        } : null
      }
    })

    // Score and rank articles
    const scoredArticles = scoreArticlesV2(articles, weights || [])
    scoredArticles.sort((a, b) => b.adjusted_score - a.adjusted_score)

    const transformedScan = {
      ...scan,
      startedAt: scan.started_at,
      completedAt: scan.completed_at,
      itemsFetched: scan.items_fetched,
      itemsAnalyzed: scan.items_analyzed,
      articles: scoredArticles
    }

    return NextResponse.json(
      { scan: transformedScan },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error(`[Scan Detail ${scanId}] API error:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch scan detail' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id
  const userId = 'default-user' // Auth logic simplified for now
  console.log(`[Scan ${scanId}] DELETE request received from user: ${userId}`)

  try {
    const supabase = supabaseAdmin()

    // 1. Delete articles linked to this scan
    const { count: articlesDeleted, error: articlesError } = await supabase
      .from('articles')
      .delete({ count: 'exact' })
      .eq('scan_id', scanId)

    if (articlesError) {
      console.error(`[Scan ${scanId}] Error deleting articles:`, articlesError)
      throw articlesError
    }
    console.log(`[Scan ${scanId}] Row count - articles: ${articlesDeleted}`)

    // 2. Delete decision_assessments linked to this scan
    const { count: decisionsDeleted, error: decisionsError } = await supabase
      .from('decision_assessments')
      .delete({ count: 'exact' })
      .eq('scan_id', scanId)

    if (decisionsError) {
      console.error(`[Scan ${scanId}] Error deleting decisions:`, decisionsError)
      throw decisionsError
    }
    console.log(`[Scan ${scanId}] Row count - decisions: ${decisionsDeleted}`)

    // 3. Delete weekly_briefs linked to this scan
    const { count: briefsDeleted, error: briefsError } = await supabase
      .from('weekly_briefs')
      .delete({ count: 'exact' })
      .eq('scan_id', scanId)

    if (briefsError) {
      console.error(`[Scan ${scanId}] Error deleting briefs:`, briefsError)
      throw briefsError
    }
    console.log(`[Scan ${scanId}] Row count - briefs: ${briefsDeleted}`)

    // 4. Finally delete the scan run itself
    const { count: scansDeleted, error: scanError } = await supabase
      .from('scans')
      .delete({ count: 'exact' })
      .filter('id', 'eq', scanId)

    if (scanError) {
      console.error(`[Scan ${scanId}] Error deleting scan record:`, scanError)
      throw scanError
    }
    console.log(`[Scan ${scanId}] Row count - scans: ${scansDeleted}`)

    // STEP 1 - POSTCHECK
    const { data: checkScan, error: postCheckError } = await supabase
      .from('scans')
      .select('id')
      .eq('id', scanId)

    const scanExistsAfterDelete = checkScan && checkScan.length > 0

    const { count: remainingArticles } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('scan_id', scanId)

    return NextResponse.json({
      ok: true,
      scan_id: scanId,
      deleted: {
        scan_runs: scansDeleted || 0,
        scan_run_articles: articlesDeleted || 0,
        decision_assessments: decisionsDeleted || 0,
        weekly_briefs: briefsDeleted || 0
      },
      postcheck: {
        scan_run_exists: scanExistsAfterDelete,
        remaining_join_rows: remainingArticles || 0
      }
    })
  } catch (error) {
    console.error(`[Scan ${scanId}] Delete failed:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scan' },
      { status: 500 }
    )
  }
}
