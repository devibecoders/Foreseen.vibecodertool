/**
 * Signal Extraction Module
 * 
 * Extracts 3-layer signals from articles:
 * - Categories (broad topics)
 * - Entities (AI companies/products)
 * - Tools (developer tools)
 * - Concepts (narrow patterns like nsfw, deepfake, etc.)
 * - Contexts (combinations of entity+concept)
 */

import { normalizeFeatureKey } from './featureKey'
import {
    CONCEPT_DICTIONARY,
    KNOWN_ENTITIES,
    KNOWN_TOOLS,
} from './conceptDictionary'

export interface ExtractedSignals {
    categories: string[]  // ["category:security"]
    entities: string[]    // ["entity:grok"]
    tools: string[]       // ["tool:cursor"]
    concepts: string[]    // ["concept:nsfw", "concept:undress"]
    contexts: string[]    // ["context:entity:grok|concept:undress"]
    allKeys: string[]     // Combined for easy iteration
}

export interface ArticleInput {
    title: string
    summary?: string
    categories?: string  // comma-separated from LLM analysis
    content?: string
}

/**
 * Extract signals from article content using deterministic keyword matching.
 * 
 * @param article - Article with title, summary, and optional categories
 * @returns Extracted signals organized by type
 */
export function extractSignals(article: ArticleInput): ExtractedSignals {
    const result: ExtractedSignals = {
        categories: [],
        entities: [],
        tools: [],
        concepts: [],
        contexts: [],
        allKeys: [],
    }

    // Combine text for searching (lowercase for matching)
    const searchText = [
        article.title || '',
        article.summary || '',
        article.content?.substring(0, 2000) || '',
    ].join(' ').toLowerCase()

    // 1. Extract categories from comma-separated string
    if (article.categories) {
        const cats = article.categories.split(',').map(c => c.trim()).filter(Boolean)
        for (const cat of cats) {
            const norm = normalizeFeatureKey('category', cat)
            if (!result.categories.includes(norm.key)) {
                result.categories.push(norm.key)
            }
        }
    }

    // 2. Extract concepts using keyword dictionary
    for (const [concept, keywords] of Object.entries(CONCEPT_DICTIONARY)) {
        for (const keyword of keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                const norm = normalizeFeatureKey('concept', concept)
                if (!result.concepts.includes(norm.key)) {
                    result.concepts.push(norm.key)
                }
                break // Found match for this concept, move to next
            }
        }
    }

    // 3. Extract entities using known entity dictionary
    for (const [entity, keywords] of Object.entries(KNOWN_ENTITIES)) {
        for (const keyword of keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                const norm = normalizeFeatureKey('entity', entity)
                if (!result.entities.includes(norm.key)) {
                    result.entities.push(norm.key)
                }
                break
            }
        }
    }

    // 4. Extract tools using known tool dictionary
    for (const [tool, keywords] of Object.entries(KNOWN_TOOLS)) {
        for (const keyword of keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                const norm = normalizeFeatureKey('tool', tool)
                if (!result.tools.includes(norm.key)) {
                    result.tools.push(norm.key)
                }
                break
            }
        }
    }

    // 5. Generate Context Signals (Entity/Tool + Concept)
    // Constraint: Max 2 contexts to avoid explosion
    // Priority: Toxic concepts first, then generic
    const potentialContexts: string[] = []
    const subjects = [...result.entities, ...result.tools]

    if (subjects.length > 0 && result.concepts.length > 0) {
        // We prioritize explicit concepts (like toxic ones)
        // Sort concepts by priority (toxic/specific first) if possible
        // For now, we rely on the order in CONCEPT_DICTIONARY or array order

        // Let's create logical contexts
        for (const subjectKey of subjects) {
            for (const conceptKey of result.concepts) {
                // subjectKey is like "entity:grok"
                // conceptKey is like "concept:undress"
                // Context key format: "context:entity:grok|concept:undress"
                // We strip the prefixes for the value part if we want, but keeping full keys is explicit
                // Let's use a clear format: "context:<subject_value>|<concept_value>" 
                // Wait, featureKey logic expects "type:value". 
                // So type="context", value="entity:grok|concept:undress"

                // Let's clean the values for readability:
                // subject: "entity:grok" -> "grok" (if we want short)
                // BUT we might want to know if it was an entity or tool.
                // Let's stick to full keys in the value part for uniqueness and reconstructing.
                const contextValue = `${subjectKey}|${conceptKey}`
                const contextKey = `context:${contextValue}`
                potentialContexts.push(contextKey)
            }
        }
    }

    // Cap to Max 2
    // Todo: Smarter ranking if we have many. 
    // Right now, first found match.
    // Ideally we want "undress" (toxic) context over "ai" (generic) context.
    // The concept dictionary is somewhat ordered.
    result.contexts = potentialContexts.slice(0, 2)


    // 6. Combine all keys for easy iteration
    result.allKeys = [
        ...result.categories,
        ...result.entities,
        ...result.tools,
        ...result.concepts,
        ...result.contexts,
    ]

    return result
}

/**
 * Convert ExtractedSignals to JSON format for database storage
 */
export function signalsToJson(signals: ExtractedSignals): Record<string, string[]> {
    return {
        categories: signals.categories,
        entities: signals.entities,
        tools: signals.tools,
        concepts: signals.concepts,
        contexts: signals.contexts,
    }
}

/**
 * Parse signals JSON from database back to ExtractedSignals
 */
export function parseSignalsJson(json: Record<string, string[]> | null): ExtractedSignals {
    if (!json) {
        return { categories: [], entities: [], tools: [], concepts: [], contexts: [], allKeys: [] }
    }

    const signals: ExtractedSignals = {
        categories: json.categories || [],
        entities: json.entities || [],
        tools: json.tools || [],
        concepts: json.concepts || [],
        contexts: json.contexts || [],
        allKeys: [],
    }

    signals.allKeys = [
        ...signals.categories,
        ...signals.entities,
        ...signals.tools,
        ...signals.concepts,
        ...signals.contexts,
    ]

    return signals
}
