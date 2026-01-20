import { normalizeFeatureKey } from './featureKey'

export interface ScoredArticleV2 {
    [key: string]: any
    base_score: number
    preference_delta: number
    adjusted_score: number
    reasons: {
        boosted: Array<{ key: string, weight: number }>
        suppressed: Array<{ key: string, weight: number }>
    }
    isPersonalized: boolean
}

/**
 * Advanced scoring engine v1.
 * adjusted_score = base_score + (sum(weights) * factor)
 */
export function scoreArticlesV2(
    articles: any[],
    weights: any[]
): ScoredArticleV2[] {
    const FACTOR = 0.3
    const MUTE_PENALTY = -10

    // Create lookup: feature_key -> { weight, state }
    const weightLookup = new Map<string, { weight: number, state: string }>()
    for (const w of weights || []) {
        weightLookup.set(w.feature_key, { weight: w.weight, state: w.state })
    }

    return articles.map(article => {
        let deltaRaw = 0
        const matchedWeights: Array<{ key: string, weight: number, type: string }> = []

        // Extract features for matching
        const analysis = article.analysis || article.analyses?.[0]
        const categories = analysis?.categories?.split(',').map((c: string) => c.trim()) || []
        const tags = analysis?.tags || []

        // 1. Match Categories
        for (const cat of categories) {
            const norm = normalizeFeatureKey('category', cat)
            const signal = weightLookup.get(norm.key)
            if (signal) {
                if (signal.state === 'muted') {
                    deltaRaw += MUTE_PENALTY
                } else {
                    deltaRaw += signal.weight
                }
                matchedWeights.push({ key: cat, weight: signal.state === 'muted' ? MUTE_PENALTY : signal.weight, type: 'category' })
            }
        }

        // 2. Match Tags (if any)
        for (const tag of tags) {
            const norm = normalizeFeatureKey('tag', tag)
            const signal = weightLookup.get(norm.key)
            if (signal) {
                if (signal.state === 'muted') {
                    deltaRaw += MUTE_PENALTY
                } else {
                    deltaRaw += signal.weight
                }
                matchedWeights.push({ key: tag, weight: signal.state === 'muted' ? MUTE_PENALTY : signal.weight, type: 'tag' })
            }
        }

        // 3. Final calculation
        const base_score = analysis?.impact_score || analysis?.impactScore || 50
        const preference_delta = deltaRaw * FACTOR
        const adjusted_score = Math.max(0, Math.min(100, base_score + preference_delta))

        // 4. Explainability (top 2 boosted, top 2 suppressed)
        const boosted = matchedWeights
            .filter(w => w.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 2)
            .map(w => ({ key: w.key, weight: w.weight }))

        const suppressed = matchedWeights
            .filter(w => w.weight < 0)
            .sort((a, b) => a.weight - b.weight)
            .slice(0, 2)
            .map(w => ({ key: w.key, weight: w.weight }))

        return {
            ...article,
            base_score,
            preference_delta,
            adjusted_score,
            reasons: { boosted, suppressed },
            isPersonalized: boosted.length > 0 || suppressed.length > 0
        }
    })
}
