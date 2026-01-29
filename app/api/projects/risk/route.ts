/**
 * API: Project Risk Assessment
 * GET: Returns all projects with risk assessments
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { assessProjectRisk, getPortfolioRiskStats } from '@/lib/projectRisk'

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    
    // Fetch all active projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
    
    if (error) throw new Error(`Failed to fetch projects: ${error.message}`)
    
    // Calculate risk for each project
    const projectsWithRisk = (projects || []).map(project => ({
      ...project,
      risk: assessProjectRisk(project)
    }))
    
    // Sort by risk score (highest risk first)
    projectsWithRisk.sort((a, b) => b.risk.score - a.risk.score)
    
    // Get portfolio stats
    const stats = getPortfolioRiskStats(projects || [])
    
    return NextResponse.json({
      projects: projectsWithRisk,
      stats,
      assessedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Project risk assessment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Assessment failed' },
      { status: 500 }
    )
  }
}
