/**
 * Leads API
 * 
 * CRUD operations for lead discovery
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/leads - List leads with filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const minScore = searchParams.get('minScore')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('leads')
      .select('*')
      .neq('status', 'archived')
      .order('quality_score', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (minScore) {
      query = query.gte('quality_score', parseInt(minScore))
    }

    const { data: leads, error } = await query

    if (error) throw error

    // Get pipeline stats
    const { data: stats } = await supabase
      .from('lead_pipeline_stats')
      .select('*')

    // Get conversion funnel
    const { data: funnel } = await supabase
      .from('lead_conversion_funnel')
      .select('*')
      .single()

    return NextResponse.json({
      leads: leads || [],
      stats: stats || [],
      funnel: funnel || null,
    })
  } catch (error) {
    console.error('Leads fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leads - Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()

    const {
      company_name,
      website_url,
      industry,
      location,
      company_size,
      contact_name,
      contact_email,
      contact_linkedin,
      contact_role,
      notes,
      tags,
      source,
      source_url,
    } = body

    if (!company_name) {
      return NextResponse.json(
        { error: 'company_name is required' },
        { status: 400 }
      )
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        company_name,
        website_url,
        industry,
        location,
        company_size,
        contact_name,
        contact_email,
        contact_linkedin,
        contact_role,
        notes,
        tags: tags || [],
        source: source || 'manual',
        source_url,
        quality_score: 50, // Default, will be updated on analysis
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Lead create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create lead' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/leads - Update a lead
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Lead update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update lead' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/leads - Archive a lead
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // Archive instead of delete
    const { error } = await supabase
      .from('leads')
      .update({ status: 'archived' })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead archive error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to archive lead' },
      { status: 500 }
    )
  }
}
