/**
 * Scans API Route
 * 
 * GET /api/scans - List all scans or get a specific scan
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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
  const { searchParams } = new URL(request.url)
  const scanId = searchParams.get('scanId')

  try {
    const supabase = supabaseAdmin()

    if (scanId) {
      const { data: scan, error } = await supabase
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

      // Transform article data for frontend
      const transformedScan = {
        ...scan,
        startedAt: scan.started_at,
        completedAt: scan.completed_at,
        itemsFetched: scan.items_fetched,
        itemsAnalyzed: scan.items_analyzed,
        articles: (scan.articles || []).map((article: any) => ({
          ...article,
          publishedAt: article.published_at,
          scanId: article.scan_id,
          analysis: article.analyses?.[0] ? {
            summary: article.analyses[0].summary,
            categories: article.analyses[0].categories,
            impactScore: article.analyses[0].impact_score,
            relevanceReason: article.analyses[0].relevance_reason,
            customerAngle: article.analyses[0].customer_angle,
            vibecodersAngle: article.analyses[0].vibecoders_angle,
            keyTakeaways: article.analyses[0].key_takeaways
          } : null
        }))
      }

      return NextResponse.json({ scan: transformedScan })
    }

    // List all scans
    const { data: scans, error } = await supabase
      .from('scans')
      .select(`
        *,
        articles (count)
      `)
      .order('started_at', { ascending: false })
      .limit(20)

    if (error) throw error

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

    return NextResponse.json({ scans: transformedScans })
  } catch (error) {
    console.error('Scans API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch scans' },
      { status: 500 }
    )
  }
}
