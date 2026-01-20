/**
 * Personalization Engine
 * Handles scoring and ranking of articles based on user topic preferences.
 */

export interface PreferenceLookup {
    [key: string]: number
}

export interface ScoredArticle {
    [key: string]: any
    base_score: number
    preference_delta: number
    adjusted_score: number
    reasons: string[]
    isPersonalized: boolean
}

/**
 * Normalizes and scores a list of articles based on user preferences.
 */
export function scoreArticles(articles: any[], preferences: any[]): ScoredArticle[] {
    const FACTOR = 0.3

    // Create preference lookup
    const prefLookup = new Map<string, number>()
    const mutedLookup = new Set<string>()

    for (const pref of preferences || []) {
        const key = pref.key_type && pref.key_value
            ? `${pref.key_type.toLowerCase()}:${pref.key_value}`
            : pref.key

        prefLookup.set(key, pref.weight)
        if (pref.muted) {
            mutedLookup.add(key)
        }
    }

    return articles.map((article: any) => {
        let sumWeights = 0
        const reasons: string[] = []

        // Extract categories from article analysis
        const analysis = article.analysis || article.analyses?.[0] || article.analyses
        const categories = analysis?.categories?.split(',').map((c: string) => c.trim()) || []

        for (const cat of categories) {
            const key = `category:${cat.toLowerCase()}`
            const weight = prefLookup.get(key)
            if (weight !== undefined) {
                sumWeights += weight

                if (Math.abs(weight) >= 0.5) {
                    reasons.push(cat)
                }
            }
        }

        // Calculate scores according to user formula:
        // adjusted_score = base_score + (sum(topic_weights) * factor)
        const base_score = analysis?.impact_score || analysis?.impactScore || 50
        const preference_delta = sumWeights * FACTOR
        const adjusted_score = Math.max(0, Math.min(100, base_score + preference_delta))

        return {
            ...article,
            base_score,
            preference_delta,
            adjusted_score,
            reasons: Array.from(new Set(reasons)).slice(0, 2), // top 1-2 keys that impacted score
            isPersonalized: reasons.length > 0
        }
    })
}
