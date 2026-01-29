/**
 * Project Risk Assessment Module
 * 
 * Calculates risk level for projects based on:
 * - Time in current status (stale = higher risk)
 * - Missing documentation
 * - Quote amount (high value = higher attention)
 * - Status stage (early stages with no movement = risk)
 */

import { differenceInDays } from 'date-fns'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'healthy'

export interface RiskAssessment {
  level: RiskLevel
  score: number  // 0-100, higher = more risky
  factors: RiskFactor[]
  recommendations: string[]
}

export interface RiskFactor {
  name: string
  impact: number  // -20 to +30
  description: string
  type: 'warning' | 'danger' | 'info'
}

export interface Project {
  id: string
  name: string
  status: string
  updated_at: string
  created_at: string
  quote_amount?: number | null
  briefing_url?: string | null
  step_plan_url?: string | null
  client_name?: string | null
  description?: string | null
}

// Status risk weights (how concerning is being stuck at each status)
const STATUS_STALE_THRESHOLDS: Record<string, { warning: number; danger: number }> = {
  'Prospect': { warning: 14, danger: 30 },     // 2 weeks warning, 1 month danger
  'Offer Sent': { warning: 7, danger: 21 },    // 1 week warning, 3 weeks danger (waiting for response)
  'Setup': { warning: 5, danger: 14 },         // Should move fast
  'In Progress': { warning: 30, danger: 60 },  // Long projects are fine, but > 2 months is risky
  'Review': { warning: 7, danger: 21 },        // Client review shouldn't take too long
  'Done': { warning: 999, danger: 999 },       // Done is done
}

/**
 * Assess risk for a single project
 */
export function assessProjectRisk(project: Project): RiskAssessment {
  const factors: RiskFactor[] = []
  let baseScore = 30 // Start at moderate risk
  
  // 1. Time in current status
  const daysInStatus = differenceInDays(new Date(), new Date(project.updated_at))
  const thresholds = STATUS_STALE_THRESHOLDS[project.status] || { warning: 14, danger: 30 }
  
  if (project.status !== 'Done') {
    if (daysInStatus >= thresholds.danger) {
      factors.push({
        name: 'Stale Project',
        impact: 25,
        description: `No movement in ${daysInStatus} days - needs attention`,
        type: 'danger'
      })
    } else if (daysInStatus >= thresholds.warning) {
      factors.push({
        name: 'Slowing Down',
        impact: 12,
        description: `${daysInStatus} days since last update`,
        type: 'warning'
      })
    } else if (daysInStatus < 3) {
      factors.push({
        name: 'Active',
        impact: -10,
        description: 'Recently updated',
        type: 'info'
      })
    }
  }
  
  // 2. Missing documentation
  if (project.status !== 'Prospect' && project.status !== 'Done') {
    if (!project.briefing_url && !project.step_plan_url) {
      factors.push({
        name: 'No Documentation',
        impact: 15,
        description: 'Missing both briefing and step plan',
        type: 'warning'
      })
    } else if (!project.briefing_url) {
      factors.push({
        name: 'Missing Briefing',
        impact: 8,
        description: 'No briefing document uploaded',
        type: 'warning'
      })
    } else if (!project.step_plan_url) {
      factors.push({
        name: 'Missing Step Plan',
        impact: 5,
        description: 'No step plan document',
        type: 'info'
      })
    }
    
    if (project.briefing_url && project.step_plan_url) {
      factors.push({
        name: 'Well Documented',
        impact: -8,
        description: 'All documents in place',
        type: 'info'
      })
    }
  }
  
  // 3. High-value projects need extra attention
  if (project.quote_amount) {
    if (project.quote_amount >= 50000) {
      factors.push({
        name: 'High Value',
        impact: 10,
        description: `€${project.quote_amount.toLocaleString()} project - high stakes`,
        type: 'warning'
      })
    } else if (project.quote_amount >= 20000) {
      factors.push({
        name: 'Significant Value',
        impact: 5,
        description: `€${project.quote_amount.toLocaleString()} at stake`,
        type: 'info'
      })
    }
  } else if (project.status !== 'Prospect' && project.status !== 'Done') {
    factors.push({
      name: 'No Quote',
      impact: 5,
      description: 'Quote amount not specified',
      type: 'warning'
    })
  }
  
  // 4. Status-specific risks
  if (project.status === 'Offer Sent' && daysInStatus > 3) {
    factors.push({
      name: 'Awaiting Response',
      impact: 5,
      description: 'Client hasn\'t responded to offer',
      type: 'info'
    })
  }
  
  if (project.status === 'Review' && daysInStatus > 14) {
    factors.push({
      name: 'Stuck in Review',
      impact: 15,
      description: 'Review phase taking too long',
      type: 'danger'
    })
  }
  
  // 5. Missing client info
  if (!project.client_name && project.status !== 'Prospect') {
    factors.push({
      name: 'Unknown Client',
      impact: 3,
      description: 'Client name not specified',
      type: 'info'
    })
  }
  
  // Calculate final score
  const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0)
  const score = Math.max(0, Math.min(100, baseScore + totalImpact))
  
  // Determine risk level
  let level: RiskLevel
  if (score >= 70) level = 'critical'
  else if (score >= 55) level = 'high'
  else if (score >= 40) level = 'medium'
  else if (score >= 25) level = 'low'
  else level = 'healthy'
  
  // Done projects are always healthy
  if (project.status === 'Done') {
    level = 'healthy'
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(factors, project)
  
  return { level, score, factors, recommendations }
}

/**
 * Generate actionable recommendations based on risk factors
 */
function generateRecommendations(factors: RiskFactor[], project: Project): string[] {
  const recommendations: string[] = []
  
  for (const factor of factors) {
    if (factor.type === 'danger' || factor.type === 'warning') {
      switch (factor.name) {
        case 'Stale Project':
          recommendations.push(`Reach out about ${project.name} - no updates in over ${Math.floor(differenceInDays(new Date(), new Date(project.updated_at)))} days`)
          break
        case 'Slowing Down':
          recommendations.push(`Check on ${project.name} progress this week`)
          break
        case 'No Documentation':
          recommendations.push(`Upload briefing and step plan for ${project.name}`)
          break
        case 'Missing Briefing':
          recommendations.push(`Add briefing document for ${project.name}`)
          break
        case 'Stuck in Review':
          recommendations.push(`Follow up with client on ${project.name} review`)
          break
        case 'High Value':
          recommendations.push(`Schedule weekly check-in for high-value project ${project.name}`)
          break
        case 'No Quote':
          recommendations.push(`Add quote amount for ${project.name}`)
          break
      }
    }
  }
  
  return recommendations.slice(0, 3)
}

/**
 * Get risk level styling
 */
export function getRiskStyles(level: RiskLevel): {
  bgColor: string
  textColor: string
  borderColor: string
  indicatorColor: string
  label: string
} {
  const styles = {
    critical: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      indicatorColor: 'bg-red-500',
      label: 'Critical Risk'
    },
    high: {
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
      indicatorColor: 'bg-orange-500',
      label: 'High Risk'
    },
    medium: {
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      indicatorColor: 'bg-amber-500',
      label: 'Medium Risk'
    },
    low: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      indicatorColor: 'bg-blue-500',
      label: 'Low Risk'
    },
    healthy: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      indicatorColor: 'bg-green-500',
      label: 'Healthy'
    }
  }
  
  return styles[level]
}

/**
 * Get aggregate risk stats for all projects
 */
export function getPortfolioRiskStats(projects: Project[]): {
  critical: number
  high: number
  medium: number
  low: number
  healthy: number
  avgScore: number
  topRecommendations: string[]
} {
  const assessments = projects.map(p => ({ project: p, assessment: assessProjectRisk(p) }))
  
  const counts = {
    critical: assessments.filter(a => a.assessment.level === 'critical').length,
    high: assessments.filter(a => a.assessment.level === 'high').length,
    medium: assessments.filter(a => a.assessment.level === 'medium').length,
    low: assessments.filter(a => a.assessment.level === 'low').length,
    healthy: assessments.filter(a => a.assessment.level === 'healthy').length,
  }
  
  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.assessment.score, 0) / assessments.length)
    : 0
  
  // Collect top recommendations from high-risk projects
  const topRecommendations = assessments
    .filter(a => a.assessment.level === 'critical' || a.assessment.level === 'high')
    .flatMap(a => a.assessment.recommendations)
    .slice(0, 5)
  
  return { ...counts, avgScore, topRecommendations }
}
