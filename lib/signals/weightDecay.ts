/**
 * Weight Decay System
 * 
 * Weights decay over time to prevent stale preferences from dominating.
 * This keeps the algorithm responsive to changing interests.
 * 
 * Formula: decayed_weight = weight × decay_factor^weeks_since_last_decision
 * 
 * Configuration:
 * - DECAY_FACTOR: 0.9 (10% decay per week)
 * - MIN_WEIGHT: 0.1 (floor to prevent complete zeroing)
 * - DECAY_START_WEEKS: 2 (grace period before decay starts)
 */

export const DECAY_CONFIG = {
  DECAY_FACTOR: 0.9,        // 10% decay per week
  MIN_WEIGHT: 0.1,          // Minimum weight (prevents complete zeroing)
  MAX_WEIGHT: 10,           // Maximum weight cap
  DECAY_START_WEEKS: 2,     // Grace period before decay starts
  BATCH_SIZE: 100,          // Process weights in batches
}

export interface WeightWithDecay {
  feature_key: string
  weight: number
  last_decision_at: Date | null
  decay_applied_at: Date | null
  decayed_weight: number
  weeks_inactive: number
}

/**
 * Calculate decayed weight based on time since last decision
 */
export function calculateDecayedWeight(
  currentWeight: number,
  lastDecisionAt: Date | null,
  now: Date = new Date()
): { decayedWeight: number; weeksInactive: number } {
  if (!lastDecisionAt) {
    // No decision history, use current weight
    return { decayedWeight: currentWeight, weeksInactive: 0 }
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const msSinceDecision = now.getTime() - lastDecisionAt.getTime()
  const weeksSinceDecision = msSinceDecision / msPerWeek

  // Grace period
  if (weeksSinceDecision < DECAY_CONFIG.DECAY_START_WEEKS) {
    return { decayedWeight: currentWeight, weeksInactive: 0 }
  }

  // Calculate weeks of actual decay (after grace period)
  const weeksOfDecay = weeksSinceDecision - DECAY_CONFIG.DECAY_START_WEEKS
  
  // Apply exponential decay
  const decayFactor = Math.pow(DECAY_CONFIG.DECAY_FACTOR, weeksOfDecay)
  let decayedWeight = currentWeight * decayFactor

  // Apply floor for positive weights, ceiling for negative
  if (currentWeight > 0) {
    decayedWeight = Math.max(DECAY_CONFIG.MIN_WEIGHT, decayedWeight)
  } else if (currentWeight < 0) {
    decayedWeight = Math.min(-DECAY_CONFIG.MIN_WEIGHT, decayedWeight)
  }

  return {
    decayedWeight: Math.round(decayedWeight * 100) / 100,
    weeksInactive: Math.floor(weeksSinceDecision)
  }
}

/**
 * Apply decay to a list of weights
 */
export function applyDecayToWeights(
  weights: Array<{
    feature_key: string
    weight: number
    last_decision_at: string | null
  }>,
  now: Date = new Date()
): WeightWithDecay[] {
  return weights.map(w => {
    const lastDecision = w.last_decision_at ? new Date(w.last_decision_at) : null
    const { decayedWeight, weeksInactive } = calculateDecayedWeight(
      w.weight,
      lastDecision,
      now
    )

    return {
      feature_key: w.feature_key,
      weight: w.weight,
      last_decision_at: lastDecision,
      decay_applied_at: now,
      decayed_weight: decayedWeight,
      weeks_inactive: weeksInactive,
    }
  })
}

/**
 * SQL to add decay columns to user_signal_weights
 * Run this migration manually or via Supabase
 */
export const DECAY_MIGRATION_SQL = `
-- Add decay tracking columns
ALTER TABLE public.user_signal_weights
ADD COLUMN IF NOT EXISTS last_decision_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS decay_applied_at TIMESTAMPTZ;

-- Index for efficient decay queries
CREATE INDEX IF NOT EXISTS idx_user_signal_weights_last_decision 
ON public.user_signal_weights(user_id, last_decision_at);

-- Function to apply decay (can be called via cron or on-demand)
CREATE OR REPLACE FUNCTION public.apply_weight_decay(
  p_user_id TEXT,
  p_decay_factor DOUBLE PRECISION DEFAULT 0.9,
  p_min_weight DOUBLE PRECISION DEFAULT 0.1,
  p_grace_weeks INTEGER DEFAULT 2
) RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  WITH decayed AS (
    SELECT 
      id,
      weight,
      CASE 
        WHEN last_decision_at IS NULL THEN weight
        WHEN EXTRACT(EPOCH FROM (now() - last_decision_at)) / 604800 < p_grace_weeks THEN weight
        ELSE GREATEST(
          p_min_weight * SIGN(weight),
          weight * POWER(p_decay_factor, 
            EXTRACT(EPOCH FROM (now() - last_decision_at)) / 604800 - p_grace_weeks
          )
        )
      END as new_weight
    FROM public.user_signal_weights
    WHERE user_id = p_user_id
      AND state = 'active'
      AND weight != 0
  )
  UPDATE public.user_signal_weights w
  SET 
    weight = d.new_weight,
    decay_applied_at = now()
  FROM decayed d
  WHERE w.id = d.id
    AND w.weight != d.new_weight;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

/**
 * Get weights with decay info for display in cockpit
 */
export function formatWeightForDisplay(w: WeightWithDecay): string {
  if (w.weeks_inactive === 0) {
    return `${w.weight > 0 ? '+' : ''}${w.weight.toFixed(1)}`
  }
  
  const decayIndicator = w.decayed_weight < w.weight ? '↓' : ''
  return `${w.decayed_weight > 0 ? '+' : ''}${w.decayed_weight.toFixed(1)} ${decayIndicator}(${w.weeks_inactive}w)`
}
