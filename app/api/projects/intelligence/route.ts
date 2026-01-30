/**
 * Project Intelligence API
 * 
 * POST /api/projects/intelligence - Generate AI intelligence for a project
 * 
 * Uses ForeseenBrain to analyze project briefing and generate:
 * - Pain points
 * - Must-haves
 * - Questions
 * - Risks
 * - Suggested tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ForeseenBrain } from '@/lib/brain'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/projects/intelligence
 * 
 * Generate intelligence for a project
 * 
 * Body:
 * - project_id: UUID (optional - if provided, updates existing project)
 * - name: string
 * - description?: string
 * - briefing_text?: string
 * - client_name?: string
 * - budget?: string
 * - deadline?: string
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()
    
    const { 
      project_id, 
      name, 
      description, 
      briefing_text, 
      client_name, 
      budget, 
      deadline 
    } = body

    if (!name && !project_id) {
      return NextResponse.json(
        { error: 'Either project_id or name is required' },
        { status: 400 }
      )
    }

    // If project_id provided, fetch existing project
    let project = null
    if (project_id) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }
      project = data
    }

    // Update status to generating
    if (project_id) {
      await supabase
        .from('projects')
        .update({ intelligence_status: 'generating' })
        .eq('id', project_id)
    }

    // Generate intelligence using ForeseenBrain
    const brain = new ForeseenBrain()
    
    const intelligence = await brain.analyzeProject({
      name: name || project?.name,
      description: description || project?.description,
      briefing_text: briefing_text || project?.briefing,
      client_name: client_name || project?.client_name,
      budget: budget || project?.quote_amount?.toString(),
      deadline
    })

    // Calculate risk score from intelligence
    const riskScore = calculateRiskScore(intelligence)

    // Calculate estimated hours from suggested tasks
    const estimatedHours = calculateEstimatedHours(intelligence)

    // Save or update project
    let savedProject
    
    if (project_id) {
      // Update existing project
      const { data, error } = await supabase
        .from('projects')
        .update({
          intelligence,
          intelligence_status: 'ready',
          intelligence_generated_at: new Date().toISOString(),
          risk_score: riskScore,
          estimated_hours: estimatedHours
        })
        .eq('id', project_id)
        .select()
        .single()

      if (error) {
        await supabase
          .from('projects')
          .update({ intelligence_status: 'error' })
          .eq('id', project_id)
        throw error
      }
      savedProject = data
    } else {
      // Create new project with intelligence
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          description: description || intelligence.oneLiner,
          client_name,
          briefing: briefing_text,
          intelligence,
          intelligence_status: 'ready',
          intelligence_generated_at: new Date().toISOString(),
          risk_score: riskScore,
          estimated_hours: estimatedHours,
          status: 'Prospect'
        })
        .select()
        .single()

      if (error) throw error
      savedProject = data
    }

    return NextResponse.json({
      success: true,
      project: savedProject,
      intelligence,
      risk_score: riskScore,
      estimated_hours: estimatedHours
    })
  } catch (error) {
    console.error('Project intelligence error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate intelligence' },
      { status: 500 }
    )
  }
}

/**
 * Calculate risk score from intelligence analysis
 */
function calculateRiskScore(intelligence: any): number {
  let score = 0
  
  // Risk from pain points severity
  const criticalPainPoints = (intelligence.painPoints || [])
    .filter((p: any) => p.severity === 'critical').length
  const highPainPoints = (intelligence.painPoints || [])
    .filter((p: any) => p.severity === 'high').length
  
  score += criticalPainPoints * 15
  score += highPainPoints * 8

  // Risk from blocking questions
  const blockingQuestions = (intelligence.questions || [])
    .filter((q: any) => q.importance === 'blocking').length
  
  score += blockingQuestions * 12

  // Risk from identified risks
  const highRisks = (intelligence.risks || [])
    .filter((r: any) => r.impact === 'high' || r.likelihood === 'high').length
  
  score += highRisks * 10

  // Risk from many assumptions (uncertainty)
  const assumptionCount = (intelligence.assumptions || []).length
  if (assumptionCount > 5) score += 10
  if (assumptionCount > 10) score += 10

  // Risk from missing timeline/budget
  if (!intelligence.timeline) score += 5
  if (!intelligence.budget) score += 5

  return Math.min(100, score)
}

/**
 * Calculate estimated hours from suggested tasks
 */
function calculateEstimatedHours(intelligence: any): number {
  const tasks = intelligence.suggestedTasks || []
  let totalHours = 0

  for (const task of tasks) {
    const estimate = task.estimate || ''
    // Parse estimates like "2-4 hours", "1 dag", "4-8 uur"
    const hourMatch = estimate.match(/(\d+)[-–]?(\d+)?\s*(uur|hour|h)/i)
    const dayMatch = estimate.match(/(\d+)[-–]?(\d+)?\s*(dag|day|d)/i)
    
    if (hourMatch) {
      const min = parseInt(hourMatch[1])
      const max = hourMatch[2] ? parseInt(hourMatch[2]) : min
      totalHours += (min + max) / 2
    } else if (dayMatch) {
      const min = parseInt(dayMatch[1]) * 8
      const max = dayMatch[2] ? parseInt(dayMatch[2]) * 8 : min
      totalHours += (min + max) / 2
    }
  }

  return Math.round(totalHours)
}
