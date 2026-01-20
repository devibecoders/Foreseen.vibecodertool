/**
 * User Preferences API Route
 * 
 * GET /api/preferences - Get user's topic preferences
 * POST /api/preferences/score - Score articles based on preferences
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface Preference {
    key_type: string
    key_value: string
    weight: number
    signal_count: number
}

export async function GET() {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'

        const { data: weights, error } = await supabase
            .from('user_signal_weights')
            .select('*')
            .eq('user_id', userId)
            .order('weight', { ascending: false })

        if (error) throw error

        // Group by type
        const grouped = (weights || []).reduce((acc: Record<string, any[]>, w) => {
            if (!acc[w.feature_type]) acc[w.feature_type] = []
            acc[w.feature_type].push(w)
            return acc
        }, {})

        // Calculate top groups (matching /research/signals requirement)
        const boosted = (weights || [])
            .filter(w => w.weight > 0 && w.state === 'active')
            .slice(0, 5)

        const suppressed = (weights || [])
            .filter(w => (w.weight < 0 || w.state === 'muted'))
            .sort((a, b) => {
                if (a.state === 'muted' && b.state !== 'muted') return -1
                if (b.state === 'muted' && a.state !== 'muted') return 1
                return a.weight - b.weight
            })
            .slice(0, 5)

        const muted = (weights || [])
            .filter(w => w.state === 'muted')

        return NextResponse.json({
            ok: true,
            data: {
                preferences: grouped,
                boosted,
                suppressed,
                muted,
                total: weights?.length || 0
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
