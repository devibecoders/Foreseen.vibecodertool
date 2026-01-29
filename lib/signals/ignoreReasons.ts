/**
 * Ignore Reasons System
 * 
 * When users ignore articles, capture WHY to improve the algorithm.
 * This is critical feedback that helps distinguish between:
 * - Content that's genuinely irrelevant
 * - Content that's duplicate/noise
 * - Content that's mistimed (not now)
 * - Content that's too shallow/deep
 */

export type IgnoreReasonType = 
  | 'irrelevant'      // Not relevant to Vibecoders at all
  | 'noise'           // Hype, marketing fluff, clickbait
  | 'duplicate'       // Already seen this elsewhere
  | 'too_shallow'     // Not enough depth/substance
  | 'too_technical'   // Too deep for current needs
  | 'bad_timing'      // Interesting but not now
  | 'off_topic'       // Wrong category/focus
  | 'known'           // Already know this
  | 'custom'          // Custom reason

export interface IgnoreReason {
  type: IgnoreReasonType
  label: string
  emoji: string
  description: string
  weight_impact: number  // How much this affects future scoring
  affects_signals: ('category' | 'entity' | 'concept' | 'context')[]
}

export const IGNORE_REASONS: Record<IgnoreReasonType, IgnoreReason> = {
  irrelevant: {
    type: 'irrelevant',
    label: 'Irrelevant',
    emoji: '🚫',
    description: 'Not relevant to Vibecoders work',
    weight_impact: -1.5,
    affects_signals: ['category', 'concept'],
  },
  noise: {
    type: 'noise',
    label: 'Noise/Hype',
    emoji: '📢',
    description: 'Marketing fluff, clickbait, no substance',
    weight_impact: -0.5,
    affects_signals: [], // Don't penalize signals, just the source/quality
  },
  duplicate: {
    type: 'duplicate',
    label: 'Duplicate',
    emoji: '♻️',
    description: 'Already seen this story',
    weight_impact: 0,
    affects_signals: [], // No signal impact, just dedup
  },
  too_shallow: {
    type: 'too_shallow',
    label: 'Too Shallow',
    emoji: '🏊‍♂️',
    description: 'Not enough depth or detail',
    weight_impact: -0.3,
    affects_signals: [],
  },
  too_technical: {
    type: 'too_technical',
    label: 'Too Technical',
    emoji: '🔬',
    description: 'Too deep for current needs',
    weight_impact: -0.3,
    affects_signals: ['concept'],
  },
  bad_timing: {
    type: 'bad_timing',
    label: 'Not Now',
    emoji: '⏰',
    description: 'Interesting but not relevant right now',
    weight_impact: 0,
    affects_signals: [], // No penalty, just timing
  },
  off_topic: {
    type: 'off_topic',
    label: 'Off Topic',
    emoji: '🎯',
    description: 'Wrong category or focus area',
    weight_impact: -1.0,
    affects_signals: ['category'],
  },
  known: {
    type: 'known',
    label: 'Already Know',
    emoji: '✅',
    description: 'Already familiar with this',
    weight_impact: 0,
    affects_signals: [],
  },
  custom: {
    type: 'custom',
    label: 'Other',
    emoji: '💬',
    description: 'Custom reason',
    weight_impact: -0.5,
    affects_signals: ['concept'],
  },
}

/**
 * Get all reason options for UI
 */
export function getIgnoreReasonOptions(): Array<{
  value: IgnoreReasonType
  label: string
  emoji: string
}> {
  return Object.values(IGNORE_REASONS).map(r => ({
    value: r.type,
    label: r.label,
    emoji: r.emoji,
  }))
}

/**
 * Calculate weight adjustments based on ignore reason
 */
export function calculateIgnoreWeightAdjustments(
  reason: IgnoreReasonType,
  articleSignals: {
    categories: string[]
    entities: string[]
    concepts: string[]
    contexts: string[]
  },
  customReason?: string
): Array<{ feature_key: string; delta: number }> {
  const reasonConfig = IGNORE_REASONS[reason]
  const adjustments: Array<{ feature_key: string; delta: number }> = []

  if (reasonConfig.weight_impact === 0) {
    return adjustments // No weight changes for this reason type
  }

  const delta = reasonConfig.weight_impact

  for (const signalType of reasonConfig.affects_signals) {
    switch (signalType) {
      case 'category':
        for (const cat of articleSignals.categories) {
          adjustments.push({ feature_key: cat, delta })
        }
        break
      case 'entity':
        for (const ent of articleSignals.entities) {
          adjustments.push({ feature_key: ent, delta })
        }
        break
      case 'concept':
        for (const con of articleSignals.concepts) {
          adjustments.push({ feature_key: con, delta })
        }
        break
      case 'context':
        for (const ctx of articleSignals.contexts) {
          adjustments.push({ feature_key: ctx, delta })
        }
        break
    }
  }

  return adjustments
}

/**
 * SQL migration for ignore reasons table
 */
export const IGNORE_REASONS_MIGRATION_SQL = `
-- Create ignore_reasons table
CREATE TABLE IF NOT EXISTS public.ignore_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL DEFAULT 'default-user',
    decision_id UUID REFERENCES public.decision_assessments(id) ON DELETE CASCADE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    reason_type TEXT NOT NULL,
    reason_text TEXT, -- For custom reasons
    signals_at_time JSONB, -- Snapshot of article signals
    weight_adjustments JSONB, -- Record of adjustments made
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ignore_reasons_user ON public.ignore_reasons(user_id);
CREATE INDEX IF NOT EXISTS idx_ignore_reasons_type ON public.ignore_reasons(reason_type);
CREATE INDEX IF NOT EXISTS idx_ignore_reasons_article ON public.ignore_reasons(article_id);

-- RLS
ALTER TABLE public.ignore_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own ignore reasons" ON public.ignore_reasons;
CREATE POLICY "Users can manage their own ignore reasons"
    ON public.ignore_reasons
    FOR ALL
    USING (user_id = 'default-user')
    WITH CHECK (user_id = 'default-user');

-- Analytics view: most ignored reasons
CREATE OR REPLACE VIEW public.ignore_reason_stats AS
SELECT 
    reason_type,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM public.ignore_reasons
GROUP BY reason_type
ORDER BY count DESC;
`;
