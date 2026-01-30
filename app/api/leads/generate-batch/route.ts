/**
 * Lead Generation Batch API
 * 
 * AI-powered lead sourcing - generates batches of qualified prospects
 * using the ForeseenBrain.
 * 
 * POST /api/leads/generate-batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { ForeseenBrain, type BatchType } from '@/lib/brain'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow longer timeout for AI generation

/**
 * POST /api/leads/generate-batch
 * 
 * Generate a batch of AI-sourced leads
 * 
 * Body:
 * - type: 'small' | 'medium' | 'startup'
 * - count: number (default 10, max 25)
 * - industry?: string (optional industry focus)
 * - region?: string (optional region focus)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, count = 10, industry, region } = body

    // Validate type
    if (!type || !['small', 'medium', 'startup'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: small, medium, or startup' },
        { status: 400 }
      )
    }

    // Validate count
    const validCount = Math.min(Math.max(1, count), 25)

    const supabase = supabaseAdmin()

    // Create batch record
    const batchId = `batch-${type}-${Date.now()}`
    
    const { error: batchError } = await supabase
      .from('lead_batches')
      .insert({
        id: batchId,
        batch_type: type,
        industry_focus: industry,
        region_focus: region,
        requested_count: validCount,
        status: 'generating'
      })

    if (batchError) {
      console.error('Failed to create batch:', batchError)
      // Continue anyway - batch tracking is nice-to-have
    }

    // Initialize brain and generate leads
    const brain = new ForeseenBrain()
    
    const result = await brain.generateLeadBatch({
      type: type as BatchType,
      count: validCount,
      industry,
      region
    })

    // Insert generated leads into database
    const leadsToInsert = result.prospects.map(prospect => ({
      company_name: prospect.company_name,
      website_url: prospect.website_url,
      industry: prospect.industry,
      company_size: prospect.company_size,
      notes: prospect.description,
      source: 'ai',
      source_type: 'ai_generated',
      batch_id: batchId,
      batch_type: type,
      why_target: prospect.why_target,
      estimated_value: prospect.estimated_project_value,
      suggested_approach: prospect.suggested_approach,
      confidence_score: prospect.confidence_score,
      quality_score: Math.round(prospect.confidence_score * 0.8), // Initial quality based on confidence
      status: 'new',
      priority: prospect.confidence_score >= 75 ? 'high' : prospect.confidence_score >= 50 ? 'medium' : 'low'
    }))

    const { data: insertedLeads, error: insertError } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select()

    if (insertError) {
      console.error('Failed to insert leads:', insertError)
      
      // Update batch status to failed
      await supabase
        .from('lead_batches')
        .update({ status: 'failed' })
        .eq('id', batchId)

      return NextResponse.json(
        { error: 'Failed to save generated leads' },
        { status: 500 }
      )
    }

    // Update batch status
    await supabase
      .from('lead_batches')
      .update({ 
        status: 'completed',
        generated_count: insertedLeads?.length || 0,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId)

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      type,
      requested: validCount,
      generated: insertedLeads?.length || 0,
      leads: insertedLeads || []
    })
  } catch (error) {
    console.error('Lead generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate leads' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leads/generate-batch
 * 
 * Get batch generation history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const { data: batches, error } = await supabase
      .from('lead_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ batches: batches || [] })
  } catch (error) {
    console.error('Batch history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch history' },
      { status: 500 }
    )
  }
}
