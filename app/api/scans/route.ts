/**
 * Scans API Route
 * 
 * GET /api/scans - List all scans or get a specific scan
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scanId = searchParams.get('scanId')

  try {
    if (scanId) {
      const { data: scan, error } = await supabaseAdmin
        .from('scans')
        .select(`
          *,
          articles (
            *,
            analyses (*)
          )
        `)
        .eq('id', scanId)
        .single()

      if (error) throw error
      return NextResponse.json(scan)
    }

    const { data: scans, error } = await supabaseAdmin
      .from('scans')
      .select(`
        *,
        articles (count)
      `)
      .order('started_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json(scans)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch scans' },
      { status: 500 }
    )
  }
}
