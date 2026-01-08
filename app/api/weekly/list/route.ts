import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // For now, use a default user_id since we don't have auth yet
    // TODO: Replace with actual auth.uid() when Supabase Auth is integrated
    const user_id = 'default-user'

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '8')

    const { data: briefs, error } = await supabaseAdmin
      .from('weekly_briefs')
      .select(`
        *,
        run:weekly_runs(*),
        sources:weekly_brief_sources(count)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching briefs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch briefs', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ briefs: briefs || [] })

  } catch (error) {
    console.error('List briefs error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
