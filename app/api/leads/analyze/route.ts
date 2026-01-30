/**
 * Lead Analysis API
 * 
 * POST /api/leads/analyze - Analyze a lead with ForeseenBrain
 * Called on button click (cost control)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ForeseenBrain } from '@/lib/brain'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()
    
    const { lead_id } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      )
    }

    // Fetch lead
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Run analysis using ForeseenBrain
    const brain = new ForeseenBrain()
    const analysis = await brain.analyzeLead({
      company_name: lead.company_name,
      website_url: lead.website_url,
      industry: lead.industry,
      company_size: lead.company_size,
      notes: lead.notes,
    })

    // Update lead with analysis results
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        quality_score: analysis.quality_score,
        fit_score: analysis.fit_score,
        website_issues: analysis.website_issues,
        opportunities: analysis.opportunities,
        fit_reasons: analysis.fit_reasons,
        pain_points: analysis.pain_points,
        outreach_email_draft: analysis.outreach_email,
        outreach_linkedin_draft: analysis.outreach_linkedin,
        suggested_approach: analysis.recommended_approach,
        estimated_value: analysis.estimated_project_value,
        status: lead.status === 'new' ? 'researching' : lead.status,
      })
      .eq('id', lead_id)
      .select()
      .single()

    if (updateError) throw updateError

    // Log activity
    await supabase
      .from('lead_activities')
      .insert({
        lead_id,
        activity_type: 'note_added',
        description: 'Deep AI analysis completed',
        metadata: { 
          quality_score: analysis.quality_score,
          fit_score: analysis.fit_score 
        }
      })

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      analysis,
    })
  } catch (error) {
    console.error('Lead analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
