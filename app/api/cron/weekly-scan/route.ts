/**
 * Vercel Cron Job: Weekly Scan
 * 
 * Endpoint for Vercel Cron to trigger weekly article scan.
 * Secured with CRON_SECRET header validation.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ingestFromSources, deduplicateArticles } from '@/lib/ingest'
import { llmService } from '@/lib/llm'
import { AsyncQueue } from '@/lib/queue'

// Force dynamic rendering - never pre-render this route
export const dynamic = 'force-dynamic'

// Create Supabase client lazily (only when route is called)
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    return createClient(url, key)
}

export async function GET(request: NextRequest) {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    console.log(`[Cron] Weekly scan triggered at ${new Date().toISOString()}`)

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
        return NextResponse.json({ success: false, error: 'Failed to create scan' }, { status: 500 })
    }

    try {
        const daysBack = parseInt(process.env.WEEKLY_DAYS || '7')

        // Step 1: Ingest
        console.log('[Cron] Ingesting articles...')
        const ingestResult = await ingestFromSources(daysBack)

        // Step 2: Link articles to scan
        const { data: newArticles } = await supabase
            .from('articles')
            .select('id')
            .is('scan_id', null)
            .gte('created_at', scan.started_at)

        if (newArticles && newArticles.length > 0) {
            await supabase
                .from('articles')
                .update({ scan_id: scan.id })
                .in('id', newArticles.map((a: { id: string }) => a.id))
        }

        // Step 3: Deduplicate
        const duplicatesRemoved = await deduplicateArticles()

        // Step 4: Analyze (limited to avoid timeout)
        const { data: articlesToAnalyze } = await supabase
            .from('articles')
            .select('id, title, url, raw_content')
            .eq('scan_id', scan.id)
            .order('published_at', { ascending: false })
            .limit(25) // Limit for Vercel timeout

        const articleIds = (articlesToAnalyze || []).map((a: { id: string }) => a.id)
        const { data: existingAnalyses } = await supabase
            .from('analyses')
            .select('article_id')
            .in('article_id', articleIds)

        const analyzedIds = new Set((existingAnalyses || []).map((a: { article_id: string }) => a.article_id))
        const articlesWithoutAnalysis = (articlesToAnalyze || []).filter((a: { id: string }) => !analyzedIds.has(a.id))

        let analyzed = 0
        const maxParallel = parseInt(process.env.MAX_PARALLEL_LLM_CALLS || '2')
        const queue = new AsyncQueue(maxParallel)

        const analysisPromises = articlesWithoutAnalysis.map((article: { id: string; title: string; url: string; raw_content: string | null }) =>
            queue.add(async () => {
                try {
                    const analysis = await llmService.analyzeArticle(
                        article.title,
                        article.url,
                        article.raw_content || undefined
                    )

                    await supabase.from('analyses').insert({
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
        await supabase
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

        await supabase
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
