/**
 * Articles API Route
 * 
 * GET /api/articles - List articles with analyses
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = supabaseAdmin()
    const { data: articles, error, count } = await supabase
      .from('articles')
      .select(`
        *,
        analyses (*)
      `, { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      articles,
      total: count,
      limit,
      offset
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
