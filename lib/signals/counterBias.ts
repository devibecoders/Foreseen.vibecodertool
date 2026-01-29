/**
 * Counter-Bias Injection System
 * 
 * Prevents filter bubbles by:
 * 1. Detecting prolonged avoidance of certain topics
 * 2. Injecting "opposing signals" to challenge blind spots
 * 3. Adding serendipity to maintain exploration
 * 
 * Philosophy: A good decision system challenges you, not just confirms you.
 */

import { supabaseAdmin } from '@/lib/supabase/server'

export interface BlindSpotAlert {
  feature_key: string
  feature_type: string
  feature_value: string
  weeks_ignored: number
  last_seen: Date | null
  ignore_count: number
  message: string
}

export interface SerendipityConfig {
  enabled: boolean
  percentage: number  // 10-20% of results
  min_base_score: number  // Minimum quality threshold
  exclude_muted: boolean
}

export const DEFAULT_SERENDIPITY_CONFIG: SerendipityConfig = {
  enabled: true,
  percentage: 15,  // 15% serendipity
  min_base_score: 40,  // Don't show garbage
  exclude_muted: true,
}

export const BLIND_SPOT_CONFIG = {
  MIN_WEEKS_TO_ALERT: 6,  // Alert after 6 weeks of ignoring
  MIN_IGNORE_COUNT: 3,    // Need at least 3 ignores to flag
  MAX_ALERTS_PER_SCAN: 2, // Don't overwhelm
}

/**
 * Detect topics that have been consistently ignored
 */
export async function detectBlindSpots(
  userId: string = 'default-user'
): Promise<BlindSpotAlert[]> {
  const supabase = supabaseAdmin()
  
  // Find signals with significant negative weight that haven't been engaged with positively
  const { data: weights, error } = await supabase
    .from('user_signal_weights')
    .select('*')
    .eq('user_id', userId)
    .eq('state', 'active')
    .lt('weight', -1)  // Significantly negative
    .order('weight', { ascending: true })
    .limit(20)

  if (error || !weights) {
    console.error('Failed to fetch weights for blind spot detection:', error)
    return []
  }

  const now = new Date()
  const alerts: BlindSpotAlert[] = []

  for (const w of weights) {
    // Calculate weeks since last decision
    const lastDecision = w.last_decision_at ? new Date(w.last_decision_at) : null
    let weeksSinceDecision = 0
    
    if (lastDecision) {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      weeksSinceDecision = Math.floor((now.getTime() - lastDecision.getTime()) / msPerWeek)
    }

    // Check if this qualifies as a blind spot
    if (
      weeksSinceDecision >= BLIND_SPOT_CONFIG.MIN_WEEKS_TO_ALERT &&
      (w.decision_count || 0) >= BLIND_SPOT_CONFIG.MIN_IGNORE_COUNT
    ) {
      alerts.push({
        feature_key: w.feature_key,
        feature_type: w.feature_type,
        feature_value: w.feature_value,
        weeks_ignored: weeksSinceDecision,
        last_seen: lastDecision,
        ignore_count: w.decision_count || 0,
        message: generateBlindSpotMessage(w.feature_value, weeksSinceDecision),
      })
    }
  }

  // Limit alerts
  return alerts.slice(0, BLIND_SPOT_CONFIG.MAX_ALERTS_PER_SCAN)
}

/**
 * Generate human-friendly blind spot message
 */
function generateBlindSpotMessage(topic: string, weeks: number): string {
  const messages = [
    `You've been ignoring "${topic}" for ${weeks} weeks. Showing this to challenge potential blind spots.`,
    `Opposing signal: "${topic}" has been filtered out for ${weeks}+ weeks. Worth a second look?`,
    `Blind spot check: You haven't engaged with "${topic}" in ${weeks} weeks.`,
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Apply serendipity to scored articles
 * Randomly promotes some lower-ranked articles to maintain exploration
 */
export function applySerendipity<T extends { adjusted_score: number; base_score: number }>(
  articles: T[],
  config: SerendipityConfig = DEFAULT_SERENDIPITY_CONFIG
): T[] {
  if (!config.enabled || articles.length < 10) {
    return articles
  }

  const sorted = [...articles].sort((a, b) => b.adjusted_score - a.adjusted_score)
  const topCount = Math.floor(articles.length * 0.3)  // Top 30%
  const serendipityCount = Math.floor(articles.length * (config.percentage / 100))

  // Get candidates: articles not in top 30% but with decent base score
  const candidates = sorted
    .slice(topCount)
    .filter(a => a.base_score >= config.min_base_score)

  if (candidates.length === 0) {
    return sorted
  }

  // Randomly select serendipity articles
  const serendipityArticles: T[] = []
  const candidatesCopy = [...candidates]
  
  for (let i = 0; i < Math.min(serendipityCount, candidatesCopy.length); i++) {
    const randomIndex = Math.floor(Math.random() * candidatesCopy.length)
    const article = candidatesCopy.splice(randomIndex, 1)[0]
    // Mark as serendipity (add property)
    ;(article as any).isSerendipity = true
    ;(article as any).serendipityReason = 'Exploration pick to broaden your view'
    serendipityArticles.push(article)
  }

  // Insert serendipity articles into positions 5-15 (not too high, not buried)
  const result = sorted.filter(a => !(a as any).isSerendipity)
  
  serendipityArticles.forEach((article, idx) => {
    const insertPosition = Math.min(5 + idx * 3, result.length)
    result.splice(insertPosition, 0, article)
  })

  return result
}

/**
 * Get articles that should be shown despite negative weights (blind spot injection)
 */
export async function getBlindSpotArticles(
  articles: any[],
  userId: string = 'default-user'
): Promise<{ articles: any[]; blindSpotAlerts: BlindSpotAlert[] }> {
  const alerts = await detectBlindSpots(userId)
  
  if (alerts.length === 0) {
    return { articles, blindSpotAlerts: [] }
  }

  // Find articles matching blind spot topics
  const blindSpotKeys = new Set(alerts.map(a => a.feature_key))
  
  const blindSpotArticles = articles.filter(article => {
    const signals = article.signals || {}
    const allKeys = [
      ...(signals.categories || []),
      ...(signals.concepts || []),
      ...(signals.entities || []),
      ...(signals.contexts || []),
    ]
    return allKeys.some(key => blindSpotKeys.has(key))
  })

  // Mark these articles
  blindSpotArticles.forEach(article => {
    const matchingAlert = alerts.find(alert => {
      const signals = article.signals || {}
      const allKeys = [
        ...(signals.categories || []),
        ...(signals.concepts || []),
        ...(signals.entities || []),
        ...(signals.contexts || []),
      ]
      return allKeys.includes(alert.feature_key)
    })
    
    if (matchingAlert) {
      article.isBlindSpotInjection = true
      article.blindSpotMessage = matchingAlert.message
    }
  })

  return {
    articles,
    blindSpotAlerts: alerts,
  }
}

/**
 * SQL migration for blind spot tracking
 */
export const COUNTER_BIAS_MIGRATION_SQL = `
-- Add blind spot tracking columns
ALTER TABLE public.user_signal_weights
ADD COLUMN IF NOT EXISTS consecutive_ignores INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_positive_decision_at TIMESTAMPTZ;

-- View for blind spot candidates
CREATE OR REPLACE VIEW public.blind_spot_candidates AS
SELECT 
    feature_key,
    feature_type,
    feature_value,
    weight,
    decision_count,
    last_decision_at,
    EXTRACT(EPOCH FROM (now() - last_decision_at)) / 604800.0 as weeks_since_decision
FROM public.user_signal_weights
WHERE user_id = 'default-user'
    AND state = 'active'
    AND weight < -1
    AND (last_decision_at IS NULL OR last_decision_at < now() - interval '6 weeks')
ORDER BY weight ASC;

-- Grant access
GRANT SELECT ON public.blind_spot_candidates TO anon, authenticated;
`;
