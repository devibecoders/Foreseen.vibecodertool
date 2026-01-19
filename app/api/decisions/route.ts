/**
 * Decisions API Route
 * 
 * POST /api/decisions - Save a decision assessment
 * GET  /api/decisions - Get decisions, optionally filtered by scan_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Signal weights for personalization
const PREFERENCE_WEIGHTS: Record<string, number> = {
    ignore: -2,
    monitor: 0.5,
    experiment: 1.5,
    integrate: 3
}

export async function POST(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const body = await request.json()

        const {
            article_id,
            analysis_id,
            scan_id,
            brief_id,
            action_required,
            impact_horizon,
            confidence,
            risk_if_ignored,
            advantage_if_early,
            is_override
        } = body

        if (!article_id || !action_required) {
            return NextResponse.json(
                { error: 'article_id and action_required are required' },
                { status: 400 }
            )
        }

        // Insert or update decision
        const { data: decision, error } = await supabase
            .from('decision_assessments')
            .upsert({
                article_id,
                analysis_id,
                scan_id: scan_id || null,
                brief_id: brief_id || null,
                action_required,
                impact_horizon: impact_horizon || 'mid',
                confidence: confidence || 3,
                risk_if_ignored: risk_if_ignored || null,
                advantage_if_early: advantage_if_early || null,
                is_override: is_override || false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'article_id',
                ignoreDuplicates: false
            })
            .select()
            .single()

        if (error) throw error

        // Update preference weights based on decision
        try {
            // Get article categories for preference update
            const { data: article } = await supabase
                .from('articles')
                .select('id, title, analyses(id, categories)')
                .eq('id', article_id)
                .single()

            if (article?.analyses?.[0]?.categories) {
                const categories = article.analyses[0].categories.split(',').map((c: string) => c.trim())
                const weight = PREFERENCE_WEIGHTS[action_required] || 0

                for (const category of categories) {
                    if (category) {
                        await supabase.rpc('upsert_topic_preference', {
                            p_user_id: 'default-user',
                            p_key_type: 'category',
                            p_key_value: category,
                            p_weight_delta: weight
                        })
                    }
                }
            }
        } catch (prefError) {
            console.error('Error updating preferences:', prefError)
            // Don't fail the main request if preferences fail
        }

        return NextResponse.json({ success: true, decision })
    } catch (error) {
        console.error('Decision save error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to save decision' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const { searchParams } = new URL(request.url)
        const scanId = searchParams.get('scan_id')

        let query = supabase
            .from('decision_assessments')
            .select(`
        *,
        article:articles(
          id, title, url, source, published_at,
          analyses(summary, categories, impact_score)
        )
      `)
            .order('created_at', { ascending: false })

        if (scanId) {
            query = query.eq('scan_id', scanId)
        }

        const { data: decisions, error } = await query.limit(100)

        if (error) throw error

        // Get scan stats for grouping
        const { data: scanStats } = await supabase
            .from('scans')
            .select(`
        id, started_at, status, items_analyzed,
        decision_assessments(count)
      `)
            .order('started_at', { ascending: false })
            .limit(10)

        return NextResponse.json({
            decisions: decisions || [],
            scanStats: scanStats || []
        })
    } catch (error) {
        console.error('Decisions fetch error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch decisions' },
            { status: 500 }
        )
    }
}
