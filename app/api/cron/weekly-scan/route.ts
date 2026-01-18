/**
 * Vercel Cron Job: Weekly Scan
 * 
 * Endpoint for Vercel Cron to trigger weekly article scan.
 * Secured with CRON_SECRET header validation.
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/weekly-scan",
 *       "schedule": "0 9 * * 1"
 *     }
 *   ]
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ingestFromSources, deduplicateArticles } from '@/lib/ingest'
import { llmService } from '@/lib/llm'
import { AsyncQueue } from '@/lib/queue'

export async function GET(request: NextRequest) {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`[Cron] Weekly scan triggered at ${new Date().toISOString()}`)

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
        const daysBack = parseInt(process.env.WEEKLY_DAYS || '7')

        // Step 1: Ingest
        console.log('[Cron] Ingesting articles...')
        const ingestResult = await ingestFromSources(daysBack)

        // Step 2: Link articles to scan
        const { data: newArticles } = await supabaseAdmin
            .from('articles')
            .select('id')
            .is('scan_id', null)
            .gte('created_at', scan.started_at)

        if (newArticles && newArticles.length > 0) {
            await supabaseAdmin
                .from('articles')
                .update({ scan_id: scan.id })
                .in('id', newArticles.map(a => a.id))
        }

        // Step 3: Deduplicate
        const duplicatesRemoved = await deduplicateArticles()

        // Step 4: Analyze (limited to avoid timeout)
        const { data: articlesToAnalyze } = await supabaseAdmin
            .from('articles')
            .select('id, title, url, raw_content')
            .eq('scan_id', scan.id)
            .order('published_at', { ascending: false })
            .limit(25) // Limit for Vercel timeout

        const articleIds = (articlesToAnalyze || []).map(a => a.id)
        const { data: existingAnalyses } = await supabaseAdmin
            .from('analyses')
            .select('article_id')
            .in('article_id', articleIds)

        const analyzedIds = new Set((existingAnalyses || []).map(a => a.article_id))
        const articlesWithoutAnalysis = (articlesToAnalyze || []).filter(a => !analyzedIds.has(a.id))

        let analyzed = 0
        const maxParallel = parseInt(process.env.MAX_PARALLEL_LLM_CALLS || '2')
        const queue = new AsyncQueue(maxParallel)

        const analysisPromises = articlesWithoutAnalysis.map((article) =>
            queue.add(async () => {
                try {
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
                } catch (error) {
                    console.error(`Failed to analyze "${article.title}"`)
                }
            })
        )

        await Promise.all(analysisPromises)
        await queue.waitForAll()

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

        console.log(`[Cron] Complete: ${ingestResult.itemsNew} new, ${analyzed} analyzed`)

        return NextResponse.json({
            success: true,
            scanId: scan.id,
            itemsFetched: ingestResult.itemsFetched,
            itemsNew: ingestResult.itemsNew,
            duplicatesRemoved,
            itemsAnalyzed: analyzed,
        })
    } catch (error) {
        console.error('[Cron] Error:', error)

        await supabaseAdmin
            .from('scans')
            .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', scan.id)

        return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 })
    }
}
