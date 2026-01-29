/**
 * User Preferences API Route (V2)
 * 
 * GET /api/preferences - Get user's signal preferences (all feature types)
 * POST /api/preferences/score - Score articles based on preferences
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// All feature types in the system
const FEATURE_TYPES = ['category', 'entity', 'tool', 'concept', 'context'] as const

interface SignalWeight {
    id: string
    user_id: string
    feature_key: string
    feature_type: string
    feature_value: string
    weight: number
    state: string
    updated_at: string
    created_at: string
}

/**
 * Format context keys for display
 * "entity:grok|concept:undress" -> "Grok · Undress"
 */
function formatContextValue(value: string): string {
    return value
        .replace('entity:', '')
        .replace('tool:', '')
        .replace('concept:', '')
        .split('|')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' · ')
}

export async function GET(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const { searchParams } = new URL(request.url)
        const showAll = searchParams.get('showAll') === 'true'

        // Fetch ALL signal weights for this user
        let query = supabase
            .from('user_signal_weights')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })

        // By default, only show items with weight != 0 OR muted
        // Unless showAll is true
        if (!showAll) {
            query = query.or('weight.neq.0,state.eq.muted')
        }

        const { data: weights, error } = await query

        if (error) throw error

        const allWeights = weights || []

        // Group by type
        const byType: Record<string, SignalWeight[]> = {}
        FEATURE_TYPES.forEach(type => { byType[type] = [] })

        allWeights.forEach(w => {
            const type = w.feature_type
            if (!byType[type]) byType[type] = []

            // Add formatted display value for contexts
            const displayValue = type === 'context'
                ? formatContextValue(w.feature_value)
                : w.feature_value

            byType[type].push({
                ...w,
                displayValue
            })
        })

        // Calculate totals
        const totals = {
            categories: byType.category.length,
            entities: byType.entity.length,
            tools: byType.tool.length,
            concepts: byType.concept.length,
            contexts: byType.context.length,
            muted: allWeights.filter(w => w.state === 'muted').length,
            total: allWeights.length
        }

        // Calculate top boosted and suppressed for summary
        const boosted = allWeights
            .filter(w => w.weight > 0 && w.state === 'active')
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 8)

        const suppressed = allWeights
            .filter(w => w.weight < 0 || w.state === 'muted')
            .sort((a, b) => {
                if (a.state === 'muted' && b.state !== 'muted') return -1
                if (b.state === 'muted' && a.state !== 'muted') return 1
                return a.weight - b.weight
            })
            .slice(0, 8)

        const muted = allWeights.filter(w => w.state === 'muted')

        // Try to get health stats (may not exist if migration not run yet)
        let health: any[] = []
        try {
            const { data: healthData } = await supabase
                .from('signal_weight_health')
                .select('*')
            health = healthData || []
        } catch (e) {
            // View may not exist yet
            console.log('signal_weight_health view not available yet')
        }

        return NextResponse.json({
            ok: true,
            // Flat response for SignalsCockpit component
            weights: allWeights,
            health,
            // Nested data for other consumers
            data: {
                totals,
                byType,
                all: allWeights,
                boosted,
                suppressed,
                muted,
                health,
                // Legacy compatibility
                preferences: byType
            }
        })
    } catch (error) {
        console.error('Preferences fetch error:', error)
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch preferences' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const body = await request.json()
        const { articles } = body
        const userId = 'default-user'

        if (!articles || !Array.isArray(articles)) {
            return NextResponse.json(
                { ok: false, error: 'articles array is required' },
                { status: 400 }
            )
        }

        // Get user signal weights
        const { data: weights } = await supabase
            .from('user_signal_weights')
            .select('*')
            .eq('user_id', userId)

        // Score each article using the v2 engine
        const { scoreArticlesV2 } = await import('@/lib/signals/scoreArticles')
        const scoredArticles = scoreArticlesV2(articles, weights || [])

        // Sort by adjusted score
        scoredArticles.sort((a, b) => b.adjusted_score - a.adjusted_score)

        return NextResponse.json({
            ok: true,
            data: {
                articles: scoredArticles,
                hasPreferences: (weights?.length || 0) > 0
            }
        })
    } catch (error) {
        console.error('Scoring error:', error)
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to score articles' },
            { status: 500 }
        )
    }
}
