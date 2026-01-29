/**
 * Scan Pipeline API Route
 * 
 * POST /api/run - Triggers article ingestion and LLM analysis
 * GET  /api/run - Returns last scan info
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ingestFromSources, deduplicateArticles } from '@/lib/ingest'
import { clusterScanArticles } from '@/lib/clustering'
import { detectIntent } from '@/lib/signals/intentLabels'
import { llmService } from '@/lib/llm'
import { AsyncQueue } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = supabaseAdmin()

  // Create scan record
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .insert({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (scanError || !scan) {
    console.error('[Scan] Insertion failed:', scanError)
    return NextResponse.json({ success: false, error: 'Failed to create scan' }, { status: 500 })
  }

  console.log(`[Scan ${scan.id}] Created record. Status: running`)

  try {
    const body = await request.json().catch(() => ({}))
    const daysBack = body.daysBack || parseInt(process.env.WEEKLY_DAYS || '7')

    console.log(`[Scan ${scan.id}] Starting scan at ${new Date().toISOString()}`)

    // Step 1: Ingest articles
    console.log('[1/4] Ingesting articles...')
    const ingestResult = await ingestFromSources(daysBack)
    console.log(`Fetched: ${ingestResult.itemsFetched}, New: ${ingestResult.itemsNew}`)

    // Step 2: Link new articles to this scan
    console.log('[2/4] Linking new articles to scan...')
    const { data: newArticles } = await supabase
      .from('articles')
      .select('id')
      .is('scan_id', null)
      .gte('created_at', scan.started_at)

    if (newArticles && newArticles.length > 0) {
      const ids = newArticles.map((a: { id: string }) => a.id)
      await supabase
        .from('articles')
        .update({ scan_id: scan.id })
        .in('id', ids)
      console.log(`Linked ${newArticles.length} articles to scan ${scan.id}`)
    }

    // Step 3: Deduplicate
    console.log('[3/4] Deduplicating...')
    const duplicatesRemoved = await deduplicateArticles()
    console.log(`Removed ${duplicatesRemoved} duplicates`)

    // Step 4: Analyze articles without analysis
    console.log('[4/4] Analyzing articles...')
    const { data: articlesToAnalyze } = await supabase
      .from('articles')
      .select('id, title, url, raw_content')
      .eq('scan_id', scan.id)
      .order('published_at', { ascending: false })
      .limit(50)

    // Check which articles already have analysis
    const articleIds = (articlesToAnalyze || []).map((a: { id: string }) => a.id)
    const { data: existingAnalyses } = await supabase
      .from('analyses')
      .select('article_id')
      .in('article_id', articleIds)

    const analyzedIds = new Set((existingAnalyses || []).map((a: { article_id: string }) => a.article_id))
    const articlesWithoutAnalysis = (articlesToAnalyze || []).filter((a: { id: string }) => !analyzedIds.has(a.id))

    console.log(`Found ${articlesWithoutAnalysis.length} articles to analyze`)

    const maxParallel = parseInt(process.env.MAX_PARALLEL_LLM_CALLS || '3')
    const queue = new AsyncQueue(maxParallel)
    let analyzed = 0
    const errors: string[] = []

    const analysisPromises = articlesWithoutAnalysis.map((article: { id: string; title: string; url: string; raw_content: string | null }) =>
      queue.add(async () => {
        try {
          console.log(`Analyzing: ${article.title.substring(0, 50)}...`)
          const analysis = await llmService.analyzeArticle(
            article.title,
            article.url,
            article.raw_content || undefined
          )

          // Detect intent from title + summary
          const intentResult = detectIntent({
            title: article.title,
            summary: analysis.summary,
            content: article.raw_content || undefined
          })

          await supabase.from('analyses').insert({
            article_id: article.id,
            summary: analysis.summary,
            categories: analysis.categories.join(','),
            impact_score: analysis.impactScore,
            relevance_reason: analysis.relevanceReason,
            customer_angle: analysis.customerAngle,
            vibecoders_angle: analysis.vibecodersAngle,
            key_takeaways: analysis.keyTakeaways.join('|||'),
            intent_label: intentResult.label,
            intent_confidence: intentResult.confidence,
            intent_signals: intentResult.signals,
          })

          analyzed++
          console.log(`✓ Analyzed ${analyzed}/${articlesWithoutAnalysis.length}`)
        } catch (error) {
          const errorMsg = `Failed to analyze "${article.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      })
    )

    await Promise.all(analysisPromises)
    await queue.waitForAll()

    // Step 5: Cluster similar articles
    console.log('[5/6] Clustering similar articles...')
    let clusterStats = { clustersCreated: 0, articlesInClusters: 0, standaloneArticles: 0 }
    try {
      clusterStats = await clusterScanArticles(scan.id)
      console.log(`Created ${clusterStats.clustersCreated} clusters from ${clusterStats.articlesInClusters} articles`)
    } catch (clusterError) {
      console.error('Clustering error:', clusterError)
      // Non-fatal - continue with scan completion
    }

    console.log('[6/6] Complete!')

    // Update scan as completed
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        items_fetched: ingestResult.itemsFetched,
        items_analyzed: analyzed,
      })
      .eq('id', scan.id)

    if (updateError) {
      console.error(`[Scan ${scan.id}] Failed to mark as completed:`, updateError)
    } else {
      console.log(`[Scan ${scan.id}] Status transition: running -> completed. Items: ${ingestResult.itemsFetched} fetched, ${analyzed} analyzed`)
    }

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      scanDate: scan.started_at,
      itemsFetched: ingestResult.itemsFetched,
      itemsNew: ingestResult.itemsNew,
      duplicatesRemoved,
      itemsAnalyzed: analyzed,
      clustering: clusterStats,
      errors: [...ingestResult.errors, ...errors],
    })
  } catch (error) {
    console.error('Scan error:', error)

    await supabase
      .from('scans')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', scan.id)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabase = supabaseAdmin()
  const { data: lastScan } = await supabase
    .from('scans')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    message: 'Use POST to trigger weekly scan',
    lastScan
  })
}
