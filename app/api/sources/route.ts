/**
 * Sources API Route
 * 
 * GET    /api/sources - List all sources
 * POST   /api/sources - Create a new source
 * PUT    /api/sources - Update an existing source
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .order('name')

    if (error) throw error
    return NextResponse.json(sources)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sources' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()

    const { data: source, error } = await supabase
      .from('sources')
      .insert({
        name: body.name,
        type: body.type || 'rss',
        url: body.url,
        query: body.query,
        enabled: body.enabled ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(source)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create source' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()

    const { data: source, error } = await supabase
      .from('sources')
      .update({
        name: body.name,
        type: body.type,
        url: body.url,
        query: body.query,
        enabled: body.enabled,
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(source)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update source' },
      { status: 500 }
    )
  }
}
