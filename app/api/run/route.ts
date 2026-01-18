/**
 * Scan Pipeline API Route
 * 
 * POST /api/run - Triggers article ingestion and LLM analysis
 * GET  /api/run - Returns last scan info
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ingestFromSources, deduplicateArticles } from '@/lib/ingest'
import { llmService } from '@/lib/llm'
import { AsyncQueue } from '@/lib/queue'

export async function POST(request: Request) {
  // Create scan record
  const { data: scan, error: scanError } = await supabaseAdmin
    .from('scans')
    .insert({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (scanError || !scan) {
    return NextResponse.json({ success: false, error: 'Failed to create scan' }, { status: 500 })
  }

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
    const { data: newArticles } = await supabaseAdmin
      .from('articles')
      .select('id')
      .is('scan_id', null)
      .gte('created_at', scan.started_at)

    if (newArticles && newArticles.length > 0) {
      const ids = newArticles.map(a => a.id)
      await supabaseAdmin
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
    const { data: articlesToAnalyze } = await supabaseAdmin
      .from('articles')
      .select('id, title, url, raw_content')
      .is('scan_id', scan.id)
      .order('published_at', { ascending: false })
      .limit(50)

    // Check which articles already have analysis
    const articleIds = (articlesToAnalyze || []).map(a => a.id)
    const { data: existingAnalyses } = await supabaseAdmin
      .from('analyses')
      .select('article_id')
      .in('article_id', articleIds)

    const analyzedIds = new Set((existingAnalyses || []).map(a => a.article_id))
    const articlesWithoutAnalysis = (articlesToAnalyze || []).filter(a => !analyzedIds.has(a.id))

    console.log(`Found ${articlesWithoutAnalysis.length} articles to analyze`)

    const maxParallel = parseInt(process.env.MAX_PARALLEL_LLM_CALLS || '3')
    const queue = new AsyncQueue(maxParallel)
    let analyzed = 0
    const errors: string[] = []

    const analysisPromises = articlesWithoutAnalysis.map((article) =>
      queue.add(async () => {
        try {
          console.log(`Analyzing: ${article.title.substring(0, 50)}...`)
          const analysis = await llmService.analyzeArticle(
            article.title,
            article.url,
            article.raw_content || undefined
          )

          await supabaseAdmin.from('analyses').insert({
            article_id: article.id,
            summary: analysis.summary,
            categories: analysis.categories.join(','),
            impact_score: analysis.impactScore,
            relevance_reason: analysis.relevanceReason,
            customer_angle: analysis.customerAngle,
            vibecoders_angle: analysis.vibecodersAngle,
            key_takeaways: analysis.keyTakeaways.join('|||'),
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

    console.log('[5/5] Complete!')

    // Update scan as completed
    await supabaseAdmin
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        items_fetched: ingestResult.itemsFetched,
        items_analyzed: analyzed,
      })
      .eq('id', scan.id)

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      scanDate: scan.started_at,
      itemsFetched: ingestResult.itemsFetched,
      itemsNew: ingestResult.itemsNew,
      duplicatesRemoved,
      itemsAnalyzed: analyzed,
      errors: [...ingestResult.errors, ...errors],
    })
  } catch (error) {
    console.error('Scan error:', error)

    await supabaseAdmin
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
  const { data: lastScan } = await supabaseAdmin
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
