/**
 * Decisions API Route
 * 
 * POST /api/decisions - Save a decision assessment
 * GET  /api/decisions - Get decisions, optionally filtered by scan_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { updateWeightsFromDecision } from '@/lib/signals/updateWeights'
import { extractSignals, signalsToJson } from '@/lib/signals/extractSignals'

export const dynamic = 'force-dynamic'

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

        // 1. Fetch analysis to check if we have signals
        const { data: analysis } = await supabase
            .from('analyses')
            .select('*')
            .eq('id', analysis_id)
            .single()

        // 2. Extract signals if missing in DB
        let currentAnalysis = analysis
        const { data: article } = await supabase
            .from('articles')
            .select('id, title, raw_content')
            .eq('id', article_id)
            .single()

        if (currentAnalysis && !currentAnalysis.signals && article) {
            const extracted = extractSignals({
                title: article.title,
                summary: currentAnalysis.summary,
                categories: currentAnalysis.categories,
                content: article.raw_content
            })

            // Persist the extracted signals
            const { data: updatedAnalysis, error: updateError } = await supabase
                .from('analyses')
                .update({
                    signals: signalsToJson(extracted),
                    updated_at: new Date().toISOString()
                })
                .eq('id', analysis_id)
                .select()
                .single()

            if (!updateError) {
                currentAnalysis = updatedAnalysis
            }
        }

        // 3. Insert or update decision - use user_id + article_id as unique key
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

        // 4. Update signal weights based on decision
        // Now using the 3-layer model with toxic concept protection
        try {
            const articleForSignals = {
                title: article?.title,
                analyses: [currentAnalysis]
            }

            console.log(`[Decision] Updating weights for article: "${article?.title}"`)
            console.log(`[Decision] Analysis data:`, {
                hasSignals: !!currentAnalysis?.signals,
                signalsLength: currentAnalysis?.signals ? Object.keys(currentAnalysis.signals).length : 0,
                categories: currentAnalysis?.categories
            })

            const updates = await updateWeightsFromDecision(user_id, articleForSignals, action_required)

            console.log(`[Decision] Signal updates returned: ${updates.length}`)
            updates.forEach(u => console.log(`  - ${u.type}:${u.value} = ${u.effectiveDelta.toFixed(2)}`))

            // Return updates in response for client-side feedback if needed
            // @ts-ignore
            decision.signal_updates = updates
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
          analyses(summary, categories, impact_score, signals)
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
