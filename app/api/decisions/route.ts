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

        // TODO: Replace with actual auth when implemented
        const user_id = 'default-user'

        // Insert or update decision - use user_id + article_id as unique key
        const { data: decision, error } = await supabase
            .from('decision_assessments')
            .upsert({
                user_id,
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
                onConflict: 'user_id,article_id',
                ignoreDuplicates: false
            })
            .select()
            .single()

        if (error) throw error


        // Update signal weights based on decision (Signals v1)
        try {
            const { data: article } = await supabase
                .from('articles')
                .select('id, title, analyses(id, categories, impact_score)')
                .eq('id', article_id)
                .single()

            if (article) {
                const { updateWeightsFromDecision } = await import('@/lib/signals/updateWeights')
                await updateWeightsFromDecision(user_id, article, action_required)
            }
        } catch (signalError) {
            console.error('Error updating signal weights:', signalError)
            // Non-blocking
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
