/**
 * Decision Confidence System
 * 
 * Not all decisions are equally certain. Track confidence to:
 * - Weight high-confidence decisions more heavily
 * - Decay low-confidence decisions faster
 * - Allow revision of uncertain decisions
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface DecisionConfidence {
  level: ConfidenceLevel
  revisable: boolean
  decay_multiplier: number
  weight_multiplier: number
}

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, DecisionConfidence> = {
  low: {
    level: 'low',
    revisable: true,
    decay_multiplier: 2.0,    // Decays 2x faster
    weight_multiplier: 0.5,   // 50% weight impact
  },
  medium: {
    level: 'medium',
    revisable: true,
    decay_multiplier: 1.0,    // Normal decay
    weight_multiplier: 1.0,   // Full weight impact
  },
  high: {
    level: 'high',
    revisable: false,
    decay_multiplier: 0.5,    // Decays 50% slower
    weight_multiplier: 1.5,   // 150% weight impact
  },
}

/**
 * Determine confidence based on decision action and context
 */
export function inferConfidence(
  action: 'EXPERIMENT' | 'MONITOR' | 'IGNORE' | 'INTEGRATE',
  hasIgnoreReason: boolean,
  timeTaken?: number // seconds spent on decision
): ConfidenceLevel {
  // Quick decisions (< 3 seconds) are often low confidence
  if (timeTaken !== undefined && timeTaken < 3) {
    return 'low'
  }

  // INTEGRATE with clear intent is high confidence
  if (action === 'INTEGRATE' || action === 'EXPERIMENT') {
    return 'high'
  }

  // IGNORE with a reason is medium-high confidence
  if (action === 'IGNORE' && hasIgnoreReason) {
    return 'medium'
  }

  // IGNORE without reason is low confidence
  if (action === 'IGNORE' && !hasIgnoreReason) {
    return 'low'
  }

  // MONITOR is inherently uncertain
  if (action === 'MONITOR') {
    return 'medium'
  }

  return 'medium'
}

/**
 * Get confidence display info
 */
export function getConfidenceDisplay(level: ConfidenceLevel): {
  label: string
  emoji: string
  color: string
  bgColor: string
} {
  switch (level) {
    case 'high':
      return {
        label: 'High Confidence',
        emoji: '💪',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
      }
    case 'medium':
      return {
        label: 'Medium Confidence',
        emoji: '🤔',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
      }
    case 'low':
      return {
        label: 'Low Confidence',
        emoji: '❓',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      }
  }
}

/**
 * Calculate adjusted weight impact based on confidence
 */
export function applyConfidenceToWeight(
  baseWeight: number,
  confidence: ConfidenceLevel
): number {
  const config = CONFIDENCE_CONFIG[confidence]
  return baseWeight * config.weight_multiplier
}

/**
 * Calculate adjusted decay based on confidence
 */
export function getConfidenceDecayFactor(
  baseDecayFactor: number,
  confidence: ConfidenceLevel
): number {
  const config = CONFIDENCE_CONFIG[confidence]
  // Higher multiplier = faster decay = lower factor
  // e.g., 0.9 base with 2x multiplier = 0.9^2 = 0.81
  return Math.pow(baseDecayFactor, config.decay_multiplier)
}

/**
 * SQL migration for confidence tracking
 */
export const CONFIDENCE_MIGRATION_SQL = `
-- Add confidence columns to decision_assessments
ALTER TABLE public.decision_assessments
ADD COLUMN IF NOT EXISTS confidence TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS revisable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS decision_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS revised_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revised_from TEXT;

-- Add confidence to user_signal_weights for tracking
ALTER TABLE public.user_signal_weights
ADD COLUMN IF NOT EXISTS avg_confidence TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS decision_count INTEGER DEFAULT 0;

-- Function to update weight with confidence
CREATE OR REPLACE FUNCTION public.update_weight_with_confidence(
  p_user_id TEXT,
  p_feature_key TEXT,
  p_feature_type TEXT,
  p_feature_value TEXT,
  p_weight_delta DOUBLE PRECISION,
  p_confidence TEXT DEFAULT 'medium'
) RETURNS void AS $$
DECLARE
  confidence_multiplier DOUBLE PRECISION;
BEGIN
  -- Calculate confidence multiplier
  confidence_multiplier := CASE p_confidence
    WHEN 'high' THEN 1.5
    WHEN 'medium' THEN 1.0
    WHEN 'low' THEN 0.5
    ELSE 1.0
  END;

  INSERT INTO public.user_signal_weights (
    user_id, feature_key, feature_type, feature_value, 
    weight, state, last_decision_at, decision_count, avg_confidence
  ) VALUES (
    p_user_id, p_feature_key, p_feature_type, p_feature_value,
    p_weight_delta * confidence_multiplier, 'active', now(), 1, p_confidence
  )
  ON CONFLICT (user_id, feature_key)
  DO UPDATE SET
    weight = user_signal_weights.weight + (p_weight_delta * confidence_multiplier),
    last_decision_at = now(),
    decision_count = user_signal_weights.decision_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
