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
        *,
        articles (
          *,
          analyses (*)
        )
      `)
      .eq('id', scanId)
      .single()

    if (error) {
      console.error(`[Scan Detail ${scanId}] Error fetching:`, error)
      throw error
    }

    console.log(`[Scan Detail ${scanId}] Fetched. Articles: ${scan.articles?.length || 0}`)

    // Transform article data for frontend
    const transformedScan = {
      ...scan,
      startedAt: scan.started_at,
      completedAt: scan.completed_at,
      itemsFetched: scan.items_fetched,
      itemsAnalyzed: scan.items_analyzed,
      articles: (scan.articles || []).map((article: any) => ({
        id: article.id,
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.published_at,
        scanId: article.scan_id,
        analysis: article.analyses?.[0] ? {
          summary: article.analyses[0].summary,
          categories: article.analyses[0].categories,
          impactScore: article.analyses[0].impact_score,
          relevanceReason: article.analyses[0].relevance_reason,
          customerAngle: article.analyses[0].customer_angle,
          vibecodersAngle: article.analyses[0].vibecoders_angle,
          keyTakeaways: article.analyses[0].key_takeaways
        } : null
      }))
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
