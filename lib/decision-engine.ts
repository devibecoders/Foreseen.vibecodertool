/**
 * Signal → Decision Engine
 * Transforms passive news consumption into active decision-making
 */

export type DecisionAction = 'EXPERIMENT' | 'MONITOR' | 'IGNORE'

export interface DecisionAssessment {
  action: DecisionAction
  actionLabel: string
  actionEmoji: string
  vibecodeAlignment: number // 0-100
  rationale: string
  horizon: 'immediate' | 'short-term' | 'medium-term' | 'long-term'
  horizonLabel: string
  conflictingBoundaries: string[]
  alignedPrinciples: string[]
}

interface Article {
  title: string
  analysis: {
    summary: string
    categories: string
    impactScore: number
    relevanceReason: string
    customerAngle: string
    vibecodersAngle: string
  }
}

interface Boundary {
  title: string
  severity: 'hard' | 'soft'
  rationale: string
}

/**
 * Mock LLM decision assessment
 * In production, this would call an Edge Function with GPT-4
 */
export async function generateDecisionAssessment(
  article: Article,
  boundaries: Boundary[] = []
): Promise<DecisionAssessment> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Check for boundary conflicts
  const conflictingBoundaries: string[] = []
  const articleText = `${article.title} ${article.analysis.summary}`.toLowerCase()

  // Mock boundary checking logic
  boundaries.forEach(boundary => {
    const boundaryKeywords = extractKeywords(boundary.title)
    const hasConflict = boundaryKeywords.some(keyword => 
      articleText.includes(keyword.toLowerCase())
    )
    
    if (hasConflict) {
      conflictingBoundaries.push(boundary.title)
    }
  })

  // If hard boundary conflict, auto-IGNORE
  const hasHardBoundaryConflict = boundaries.some(b => 
    b.severity === 'hard' && conflictingBoundaries.includes(b.title)
  )

  if (hasHardBoundaryConflict) {
    return {
      action: 'IGNORE',
      actionLabel: 'Ignore',
      actionEmoji: '🚫',
      vibecodeAlignment: 10,
      rationale: `Conflicts with hard boundary: ${conflictingBoundaries[0]}. This violates core principles.`,
      horizon: 'immediate',
      horizonLabel: 'Not Applicable',
      conflictingBoundaries,
      alignedPrinciples: []
    }
  }

  // Calculate Vibecode alignment based on impact score and relevance
  const impactScore = article.analysis.impactScore
  const hasVibecodersAngle = article.analysis.vibecodersAngle.length > 20
  const hasCustomerAngle = article.analysis.customerAngle.length > 20
  
  let alignment = impactScore
  if (hasVibecodersAngle) alignment += 10
  if (hasCustomerAngle) alignment += 10
  if (conflictingBoundaries.length > 0) alignment -= 30
  
  alignment = Math.max(0, Math.min(100, alignment))

  // Determine action based on alignment and impact
  let action: DecisionAction
  let rationale: string
  let horizon: DecisionAssessment['horizon']

  if (alignment >= 70 && impactScore >= 70) {
    action = 'EXPERIMENT'
    rationale = `High impact (${impactScore}/100) and strong Vibecode alignment (${alignment}%). This presents a clear opportunity to experiment and learn.`
    horizon = 'immediate'
  } else if (alignment >= 50 || impactScore >= 60) {
    action = 'MONITOR'
    rationale = `Moderate alignment (${alignment}%) with potential impact (${impactScore}/100). Worth monitoring for future opportunities.`
    horizon = impactScore >= 70 ? 'short-term' : 'medium-term'
  } else {
    action = 'IGNORE'
    rationale = `Low alignment (${alignment}%) and limited immediate impact (${impactScore}/100). Not a priority given current focus areas.`
    horizon = 'long-term'
  }

  // Mock aligned principles
  const alignedPrinciples = []
  if (impactScore >= 70) alignedPrinciples.push('Ship Fast, Learn Faster')
  if (hasVibecodersAngle) alignedPrinciples.push('User Value First')

  return {
    action,
    actionLabel: action === 'EXPERIMENT' ? 'Experiment' : action === 'MONITOR' ? 'Monitor' : 'Ignore',
    actionEmoji: action === 'EXPERIMENT' ? '⚡' : action === 'MONITOR' ? '👁' : '🚫',
    vibecodeAlignment: alignment,
    rationale,
    horizon,
    horizonLabel: getHorizonLabel(horizon),
    conflictingBoundaries,
    alignedPrinciples
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production, use NLP
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
}

function getHorizonLabel(horizon: DecisionAssessment['horizon']): string {
  switch (horizon) {
    case 'immediate': return '0-2 weeks'
    case 'short-term': return '1-3 months'
    case 'medium-term': return '3-6 months'
    case 'long-term': return '6+ months'
  }
}

/**
 * Get action badge styling
 */
export function getActionBadgeStyle(action: DecisionAction) {
  switch (action) {
    case 'EXPERIMENT':
      return {
        bg: 'bg-success-100',
        text: 'text-success-700',
        border: 'border-success-200',
        ring: 'ring-success-500'
      }
    case 'MONITOR':
      return {
        bg: 'bg-warning-100',
        text: 'text-warning-700',
        border: 'border-warning-200',
        ring: 'ring-warning-500'
      }
    case 'IGNORE':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        ring: 'ring-slate-500'
      }
  }
}

/**
 * Get alignment color
 */
export function getAlignmentColor(alignment: number) {
  if (alignment >= 70) return 'bg-success-500'
  if (alignment >= 50) return 'bg-warning-500'
  return 'bg-danger-500'
}
