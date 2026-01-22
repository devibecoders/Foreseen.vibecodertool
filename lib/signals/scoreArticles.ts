import { normalizeFeatureKey } from './featureKey'
import { parseSignalsJson, extractSignals, type ExtractedSignals } from './extractSignals'

export interface ScoredArticleV2 {
    [key: string]: any
    base_score: number
    preference_delta: number
    adjusted_score: number
    reasons: {
        boosted: Array<{ key: string, weight: number, type: string }>
        suppressed: Array<{ key: string, weight: number, type: string }>
    }
    isPersonalized: boolean
    signals?: ExtractedSignals
}

interface WeightEntry {
    feature_key: string
    weight: number
    state: string
    feature_type?: string
}

/**
 * Scoring multipliers for different signal types (V2)
 * Contexts dominate ranking.
 */
const SCORING_MULTIPLIERS = {
    context: 0.70,
    concept: 0.40,
    entity: 0.15,
    tool: 0.15,
    category: 0.05,
    tag: 0.05,
}

/**
 * Advanced scoring engine v2 with Context-Aware Signals.
 * 
 * Formula:
 * adjusted_score = base_score + FACTOR × (
 *   sum_contexts × 0.70 +
 *   sum_concepts × 0.40 + 
 *   sum_entities × 0.15 + 
 *   sum_category × 0.05
 * ) + mute_penalty
 * 
 * @param articles - Array of articles with analysis data
 * @param weights - User's signal weights from database
 * @returns Scored articles with explainability
 */
export function scoreArticlesV2(
    articles: any[],
    weights: WeightEntry[]
): ScoredArticleV2[] {
    const FACTOR = 0.5 // Overall scaling factor
    const MUTE_PENALTY = -10
    const MAX_MUTE_PENALTY = -20

    // Create lookup: feature_key -> { weight, state, type }
    const weightLookup = new Map<string, { weight: number, state: string, type: string }>()
    for (const w of weights || []) {
        weightLookup.set(w.feature_key, {
            weight: w.weight,
            state: w.state,
            type: w.feature_type || w.feature_key.split(':')[0]
        })
    }

    return articles.map(article => {
        const matchedWeights: Array<{ key: string, weight: number, type: string, displayKey: string }> = []
        let mutePenaltyTotal = 0

        // Extract signals for this article
        const analysis = article.analysis || article.analyses?.[0]
        let signals: ExtractedSignals

        // Try pre-extracted signals first, fall back to extraction
        if (analysis?.signals) {
            signals = parseSignalsJson(analysis.signals)
            // If contexts missing (legacy), re-extract
            if (!signals.contexts) {
                const fresh = extractSignals({
                    title: article.title || '',
                    summary: analysis?.summary || '',
                    categories: analysis?.categories || '',
                })
                signals.contexts = fresh.contexts
                signals.allKeys.push(...fresh.contexts)
            }
        } else {
            signals = extractSignals({
                title: article.title || '',
                summary: analysis?.summary || '',
                categories: analysis?.categories || '',
            })
        }

        // Match all signal keys against user weights
        for (const signalKey of signals.allKeys) {
            const signal = weightLookup.get(signalKey)
            if (signal) {
                // Formatting display key: context:entity:grok|concept:undress -> Grok · Undress
                let displayKey = signalKey.split(':').slice(1).join(':')
                if (signal.type === 'context') {
                    // Cleanup context key for nice display
                    // "entity:grok|concept:undress" -> "Grok · Undress"
                    displayKey = displayKey
                        .replace('entity:', '')
                        .replace('tool:', '')
                        .replace('concept:', '')
                        .replace('|', ' · ')
                        // capitalize
                        .split(' · ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')
                }

                const type = signal.type

                if (signal.state === 'muted') {
                    mutePenaltyTotal += MUTE_PENALTY
                    matchedWeights.push({
                        key: signalKey,
                        weight: MUTE_PENALTY,
                        type,
                        displayKey
                    })
                } else {
                    matchedWeights.push({
                        key: signalKey,
                        weight: signal.weight,
                        type,
                        displayKey
                    })
                }
            }
        }

        // Cap mute penalty
        mutePenaltyTotal = Math.max(mutePenaltyTotal, MAX_MUTE_PENALTY)

        // Calculate weighted sums by type
        let sumByContext = 0
        let sumByConcept = 0
        let sumByEntity = 0
        let sumByCategory = 0

        for (const match of matchedWeights) {
            if (match.weight === MUTE_PENALTY) continue // Mutes handled separately

            switch (match.type) {
                case 'context':
                    sumByContext += match.weight
                    break
                case 'concept':
                    sumByConcept += match.weight
                    break
                case 'entity':
                case 'tool':
                    sumByEntity += match.weight
                    break
                case 'category':
                case 'tag':
                    sumByCategory += match.weight
                    break
            }
        }

        // Apply scoring formula with type multipliers (V2)
        const base_score = analysis?.impact_score || analysis?.impactScore || 50
        const weightedSum = (
            sumByContext * SCORING_MULTIPLIERS.context +
            sumByConcept * SCORING_MULTIPLIERS.concept +
            sumByEntity * SCORING_MULTIPLIERS.entity +
            sumByCategory * SCORING_MULTIPLIERS.category
        )
        const preference_delta = (weightedSum * FACTOR) + mutePenaltyTotal
        const adjusted_score = Math.max(0, Math.min(100, base_score + preference_delta))

        // Build explainability: top 2 boosted, top 2 suppressed
        const boosted = matchedWeights
            .filter(w => w.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 2)
            .map(w => ({ key: w.displayKey, weight: w.weight, type: w.type }))

        const suppressed = matchedWeights
            .filter(w => w.weight < 0)
            .sort((a, b) => a.weight - b.weight)
            .slice(0, 2)
            .map(w => ({ key: w.displayKey, weight: w.weight, type: w.type }))

        return {
            ...article,
            base_score,
            preference_delta: Math.round(preference_delta * 100) / 100,
            adjusted_score: Math.round(adjusted_score * 10) / 10,
            reasons: { boosted, suppressed },
            isPersonalized: boosted.length > 0 || suppressed.length > 0,
            signals, // Include extracted signals for debugging/display
        }
    })
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use scoreArticlesV2 directly
 */
export function scoreArticles(articles: any[], weights: any[]) {
    return scoreArticlesV2(articles, weights)
}
