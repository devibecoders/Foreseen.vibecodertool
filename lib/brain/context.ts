/**
 * Foreseen Brain Context
 * 
 * Loads and manages user context for AI operations.
 * Context includes signals, decision history, and preferences.
 */

import { supabaseAdmin } from '../supabase/server'
import type { UserContext, UserSignal, Decision } from './types'

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// In-memory cache for context
const contextCache = new Map<string, { context: UserContext; timestamp: number }>()

/**
 * Load user context from database
 * Includes signals, recent decisions, and preferences
 */
export async function loadUserContext(userId: string = 'default'): Promise<UserContext> {
  // Check cache first
  const cached = contextCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.context
  }

  const supabase = supabaseAdmin()

  // Load signals
  const signals = await loadSignals(supabase)

  // Load recent decisions (last 30 days, max 100)
  const recentDecisions = await loadRecentDecisions(supabase, 30, 100)

  // Load preferences (if any)
  const preferences = await loadPreferences(supabase, userId)

  const context: UserContext = {
    userId,
    signals,
    recentDecisions,
    preferences,
    loadedAt: new Date()
  }

  // Cache the context
  contextCache.set(userId, { context, timestamp: Date.now() })

  return context
}

/**
 * Load signal weights from database
 */
async function loadSignals(supabase: ReturnType<typeof supabaseAdmin>): Promise<UserSignal[]> {
  const { data, error } = await supabase
    .from('signal_weights')
    .select('feature_key, weight, state, feature_type, updated_at')
    .order('weight', { ascending: false })

  if (error) {
    console.error('Failed to load signals:', error)
    return []
  }

  return (data || []).map(row => ({
    feature_key: row.feature_key,
    weight: row.weight,
    state: row.state || 'active',
    feature_type: row.feature_type || inferFeatureType(row.feature_key),
    updated_at: row.updated_at
  }))
}

/**
 * Load recent decisions for feedback loop
 */
async function loadRecentDecisions(
  supabase: ReturnType<typeof supabaseAdmin>,
  days: number,
  limit: number
): Promise<Decision[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const { data, error } = await supabase
    .from('decisions')
    .select(`
      id,
      article_id,
      action,
      reason,
      created_at,
      articles (title)
    `)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to load decisions:', error)
    return []
  }

  return (data || []).map(row => ({
    id: row.id,
    article_id: row.article_id,
    article_title: (row.articles as any)?.title,
    action: row.action,
    reason: row.reason,
    created_at: row.created_at
  }))
}

/**
 * Load user preferences
 */
async function loadPreferences(
  supabase: ReturnType<typeof supabaseAdmin>,
  userId: string
): Promise<Record<string, any>> {
  // For now, return default preferences
  // Can be extended to load from user_preferences table
  return {
    language: 'nl',
    contentTone: 'professional',
    focusAreas: ['AI', 'DevTools', 'Automation']
  }
}

/**
 * Infer feature type from key
 */
function inferFeatureType(key: string): UserSignal['feature_type'] {
  if (key.startsWith('context:')) return 'context'
  if (key.startsWith('concept:')) return 'concept'
  if (key.startsWith('entity:')) return 'entity'
  if (key.startsWith('tool:')) return 'tool'
  if (key.startsWith('category:')) return 'category'
  return 'concept'
}

/**
 * Clear context cache (useful after preference updates)
 */
export function clearContextCache(userId?: string): void {
  if (userId) {
    contextCache.delete(userId)
  } else {
    contextCache.clear()
  }
}

/**
 * Get context summary for prompts
 * Returns a formatted string describing user context
 */
export function formatContextForPrompt(context: UserContext): string {
  const lines: string[] = []

  // Top interests (highest weighted signals)
  const topInterests = context.signals
    .filter(s => s.weight > 0 && s.state !== 'muted')
    .slice(0, 10)
    .map(s => s.feature_key.split(':').pop() || s.feature_key)

  if (topInterests.length > 0) {
    lines.push(`TOP INTERESTS: ${topInterests.join(', ')}`)
  }

  // Muted topics
  const muted = context.signals
    .filter(s => s.state === 'muted')
    .slice(0, 5)
    .map(s => s.feature_key.split(':').pop() || s.feature_key)

  if (muted.length > 0) {
    lines.push(`MUTED TOPICS: ${muted.join(', ')}`)
  }

  // Decision patterns
  const acceptedCount = context.recentDecisions.filter(d => d.action === 'accept').length
  const rejectedCount = context.recentDecisions.filter(d => d.action === 'reject').length
  
  if (context.recentDecisions.length > 0) {
    lines.push(`DECISION HISTORY: ${acceptedCount} accepted, ${rejectedCount} rejected (last 30 days)`)
  }

  // Recent accepted topics for context
  const recentAccepted = context.recentDecisions
    .filter(d => d.action === 'accept' && d.article_title)
    .slice(0, 5)
    .map(d => d.article_title!)

  if (recentAccepted.length > 0) {
    lines.push(`RECENTLY INTERESTED IN: ${recentAccepted.join(' | ')}`)
  }

  return lines.join('\n')
}

/**
 * Calculate decision-based score modifier
 * Positive for patterns matching accepted decisions
 * Negative for patterns matching rejected decisions
 */
export function calculateDecisionModifier(
  articleSignals: string[],
  decisions: Decision[]
): number {
  // This is a simplified version - can be made more sophisticated
  // by analyzing actual signal overlap with accepted/rejected articles
  return 0 // Placeholder for now
}
