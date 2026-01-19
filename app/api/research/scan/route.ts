/**
 * Scans API Route
 * 
 * GET /api/scans - List all scans or get a specific scan
 */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ScanRow {
  id: string
  started_at: string
  completed_at: string | null
  items_fetched: number
  items_analyzed: number
  status: string
  error_message: string | null
  articles: { count: number }[]
}

export async function GET(request: NextRequest) {
  try {
    headers() // Force dynamic
    const supabase = supabaseAdmin()

    // List all scans
    const { data: scans, error } = await supabase
      .from('scans')
      .select(`
        *,
        articles (count)
      `)
      .order('started_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[Scans List] Error fetching:', error)
      throw error
    }

    console.log(`[Scans List] Fetched. Count: ${scans?.length || 0}`)
    console.log(`[Scans List] Fetched. Count: ${scans?.length || 0}`)

    // Transform to frontend format
    const transformedScans = (scans || []).map((scan: ScanRow) => ({
      id: scan.id,
      startedAt: scan.started_at,
      completedAt: scan.completed_at,
      itemsFetched: scan.items_fetched,
      itemsAnalyzed: scan.items_analyzed,
      status: scan.status,
      _count: {
        articles: scan.articles?.[0]?.count || 0
      }
    }))

    return NextResponse.json(
      { scans: transformedScans },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('Scans List API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch scans' },
      { status: 500 }
    )
  }
}
