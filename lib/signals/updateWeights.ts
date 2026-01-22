import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeFeatureKey } from './featureKey'
import { extractSignals, parseSignalsJson, type ExtractedSignals } from './extractSignals'
import { isToxicConcept } from './conceptDictionary'

/**
 * Decision deltas - base weight changes per action
 */
const DECISION_DELTAS: Record<string, number> = {
    ignore: -2,
    monitor: 0.5,
    experiment: 1.5,
    integrate: 3
}

/**
 * Split multipliers for different signal types (V2)
 * Contexts are DOMINANT (70%) to ensure specificity.
 */
const SIGNAL_MULTIPLIERS = {
    context: 0.70,  // Dominant (Grok|Undress)
    concept: 0.40,  // Strong (Undress)
    entity: 0.15,   // Weak (Grok)
    tool: 0.15,     // Weak (Supabase)
    category: 0.05, // Background (Security)
    tag: 0.05,      // Background
}

/**
 * Reduced multipliers when toxic concepts are present (Toxic Rule V2)
 * - CONTEXT: Remains FULL (0.70) -> We want to kill this specific context.
 * - CONCEPT: Remains FULL/High -> We want to kill the general toxic concept.
 * - ENTITY/CATEGORY: Protected (0.05/0.02) -> Don't blame Grok or Security.
 */
const TOXIC_PROTECTED_MULTIPLIERS = {
    context: 0.70,  // Full impact on the specific toxic context
    concept: 0.40,  // Full impact on the general toxic concept
    entity: 0.05,   // Protected
    tool: 0.05,     // Protected
    category: 0.02, // Protected
    tag: 0.02,
}

type SignalType = keyof typeof SIGNAL_MULTIPLIERS

/**
 * Get the appropriate multiplier for a signal type
 * Uses V2 logic: Contexts are king. Toxic concepts protect entities.
 */
function getMultiplier(type: SignalType, hasToxicConcept: boolean): number {
    if (hasToxicConcept) {
        // Use protected multipliers logic
        return TOXIC_PROTECTED_MULTIPLIERS[type] || 0.02
    }
    return SIGNAL_MULTIPLIERS[type] || 0.05
}

/**
 * Determine signal type from feature key prefix
 */
function getSignalType(featureKey: string): SignalType {
    const prefix = featureKey.split(':')[0]
    if (prefix in SIGNAL_MULTIPLIERS) {
        return prefix as SignalType
    }
    return 'category' // Default fallback
}

export interface WeightUpdate {
    key: string
    type: string
    value: string
    delta: number
    multiplier: number
    effectiveDelta: number
}

/**
 * Updates signal weights based on a decision.
 * 
 * Implements Context-Aware Signal Model (v2):
 * - Contexts (Entity+Concept) get 70% influence.
 * - Toxic concepts protect broad entities/categories but punish constraints.
 * 
 * @param userId - User making the decision
 * @param article - Article with analysis data
 * @param action - Decision action
 * @returns Array of weight updates applied
 */
export async function updateWeightsFromDecision(
    userId: string,
    article: any,
    action: 'ignore' | 'monitor' | 'experiment' | 'integrate'
): Promise<WeightUpdate[]> {
    const supabase = supabaseAdmin()
    const baseDelta = DECISION_DELTAS[action] || 0

    console.log(`[Signals] Starting weight update for action: ${action}, baseDelta: ${baseDelta}`)

    // 1. Extract or parse signals from article
    const analyses = article.analyses || article.analysis
    const analysis = Array.isArray(analyses) ? analyses[0] : analyses

    console.log(`[Signals] Analysis source:`, {
        hasAnalysis: !!analysis,
        hasSignals: !!analysis?.signals,
        categories: analysis?.categories,
        summary: analysis?.summary?.substring(0, 50)
    })

    let signals: ExtractedSignals

    // Try to use pre-extracted signals from database first
    if (analysis?.signals && Object.keys(analysis.signals).length > 0) {
        signals = parseSignalsJson(analysis.signals)
        console.log(`[Signals] Parsed from DB:`, {
            categories: signals.categories.length,
            entities: signals.entities.length,
            tools: signals.tools.length,
            concepts: signals.concepts.length,
            contexts: signals.contexts?.length || 0
        })
    } else {
        // Fall back to extracting from content
        signals = extractSignals({
            title: article.title || '',
            summary: analysis?.summary || '',
            categories: analysis?.categories || '',
        })
        console.log(`[Signals] Extracted fresh:`, {
            categories: signals.categories.length,
            entities: signals.entities.length,
            tools: signals.tools.length,
            concepts: signals.concepts.length,
            contexts: signals.contexts.length,
            allKeys: signals.allKeys
        })
    }

    // Ensure we have contexts (if old extraction was used)
    if (!signals.contexts || signals.contexts.length === 0) {
        const freshSignals = extractSignals({
            title: article.title || '',
            summary: analysis?.summary || '',
            categories: analysis?.categories || '',
        })
        signals.contexts = freshSignals.contexts || []
        // Rebuild allKeys
        signals.allKeys = [
            ...signals.categories,
            ...signals.entities,
            ...signals.tools,
            ...signals.concepts,
            ...signals.contexts
        ]
        console.log(`[Signals] Re-extracted contexts:`, signals.contexts)
    }

    // 2. Check for toxic concepts (for guilt-by-association protection)
    const hasToxicConcept = signals.concepts.some(key => isToxicConcept(key))
    console.log(`[Signals] Toxic concept detected: ${hasToxicConcept}`)

    // 3. Build list of updates with appropriate multipliers
    const updates: WeightUpdate[] = []

    const processSignal = (key: string) => {
        const type = getSignalType(key) as SignalType
        const multiplier = getMultiplier(type, hasToxicConcept)
        const effectiveDelta = baseDelta * multiplier
        const value = key.split(':').slice(1).join(':')

        updates.push({
            key,
            type,
            value,
            delta: baseDelta,
            multiplier,
            effectiveDelta,
        })
    }

    // Process all extracted signals
    for (const key of signals.allKeys) {
        processSignal(key)
    }

    console.log(`[Signals] Prepared ${updates.length} weight updates:`,
        updates.map(u => `${u.type}:${u.value} = ${u.effectiveDelta.toFixed(2)}`))

    // 4. Apply updates to database
    const results: WeightUpdate[] = []

    for (const update of updates) {
        const { error } = await supabase.rpc('upsert_signal_weight', {
            p_user_id: userId,
            p_feature_key: update.key,
            p_feature_type: update.type,
            p_feature_value: update.value,
            p_weight_delta: update.effectiveDelta
        })

        if (error) {
            console.error(`[Signals] DB ERROR for ${update.key}:`, error)
        } else {
            results.push(update)
        }
    }

    console.log(`[Signals] Successfully wrote ${results.length}/${updates.length} weights to DB`)

    return results
}

/**
 * Legacy function signature for backwards compatibility
 * @deprecated Use updateWeightsFromDecision directly
 */
export async function updateWeights(
    userId: string,
    article: any,
    action: 'ignore' | 'monitor' | 'experiment' | 'integrate'
) {
    return updateWeightsFromDecision(userId, article, action)
}
