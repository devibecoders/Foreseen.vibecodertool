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

        const { data: preferences, error } = await supabase
            .from('user_topic_preferences')
            .select('*')
            .eq('user_id', userId)
            .order('weight', { ascending: false })

        if (error) throw error

        // Group by type
        const grouped = (preferences || []).reduce((acc: Record<string, Preference[]>, pref: Preference) => {
            if (!acc[pref.key_type]) acc[pref.key_type] = []
            acc[pref.key_type].push(pref)
            return acc
        }, {})

        // Calculate top boosts and suppressions
        const boosts = (preferences || [])
            .filter((p: Preference) => p.weight > 0)
            .slice(0, 10)

        const suppressions = (preferences || [])
            .filter((p: Preference) => p.weight < 0)
            .slice(0, 10)

        return NextResponse.json({
            preferences: grouped,
            boosts,
            suppressions,
            total: preferences?.length || 0
        })
    } catch (error) {
        console.error('Preferences fetch error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch preferences' },
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
                { error: 'articles array is required' },
                { status: 400 }
            )
        }

        // Get user preferences
        const { data: preferences } = await supabase
            .from('user_topic_preferences')
            .select('key_type, key_value, weight')
            .eq('user_id', userId)

        // Create preference lookup
        const prefLookup = new Map<string, number>()
        for (const pref of preferences || []) {
            prefLookup.set(`${pref.key_type}:${pref.key_value}`, pref.weight)
        }

        // Score each article
        const scoredArticles = articles.map((article: any) => {
            let personalScore = 0
            const boostReasons: string[] = []
            const suppressReasons: string[] = []

            // Check categories
            const categories = article.analysis?.categories?.split(',').map((c: string) => c.trim()) || []
            for (const cat of categories) {
                const weight = prefLookup.get(`category:${cat}`)
                if (weight !== undefined) {
                    personalScore += weight
                    if (weight > 0) {
                        boostReasons.push(`+${weight.toFixed(1)} ${cat}`)
                    } else if (weight < 0) {
                        suppressReasons.push(`${weight.toFixed(1)} ${cat}`)
                    }
                }
            }

            // Calculate final score (base impact + personalization)
            const baseScore = article.analysis?.impactScore || article.analysis?.impact_score || 50
            const finalScore = Math.max(0, Math.min(100, baseScore + personalScore * 5))

            return {
                ...article,
                personalScore,
                finalScore,
                boostReasons,
                suppressReasons,
                isPersonalized: boostReasons.length > 0 || suppressReasons.length > 0
            }
        })

        // Sort by final score
        scoredArticles.sort((a: any, b: any) => b.finalScore - a.finalScore)

        return NextResponse.json({
            articles: scoredArticles,
            hasPreferences: (preferences?.length || 0) > 0
        })
    } catch (error) {
        console.error('Scoring error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to score articles' },
            { status: 500 }
        )
    }
}
