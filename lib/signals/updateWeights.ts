import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeFeatureKey } from './featureKey'

const DECISION_DELTAS: Record<string, number> = {
    ignore: -2,
    monitor: 0.5,
    experiment: 1.5,
    integrate: 3
}

/**
 * Updates signal weights based on a decision.
 * Extracts categories (and optionally tags) from the article and applies deltas.
 */
export async function updateWeightsFromDecision(
    userId: string,
    article: any,
    action: 'ignore' | 'monitor' | 'experiment' | 'integrate'
) {
    const supabase = supabaseAdmin()
    const delta = DECISION_DELTAS[action] || 0

    // 1. Extract categories
    const analyses = article.analyses || article.analysis
    const analysis = Array.isArray(analyses) ? analyses[0] : analyses
    const categories = analysis?.categories?.split(',').map((c: string) => c.trim()) || []

    const updates = []

    // Category updates
    for (const cat of categories) {
        if (!cat) continue
        const norm = normalizeFeatureKey('category', cat)
        updates.push(norm)
    }

    // Tag updates (limit to 2 for stability in v1)
    const tags = analysis?.tags || []
    for (const tag of tags.slice(0, 2)) {
        if (!tag) continue
        const norm = normalizeFeatureKey('tag', tag)
        updates.push(norm)
    }

    // 2. Perform atomic upserts via RPC
    const results = []
    for (const update of updates) {
        const { error } = await supabase.rpc('upsert_signal_weight', {
            p_user_id: userId,
            p_feature_key: update.key,
            p_feature_type: update.type,
            p_feature_value: update.value,
            p_weight_delta: delta
        })

        if (error) {
            console.error(`Error updating weight for ${update.key}:`, error)
        } else {
            results.push(update)
        }
    }

    return results
}
