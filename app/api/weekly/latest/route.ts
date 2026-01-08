import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // For now, use a default user_id since we don't have auth yet
    // TODO: Replace with actual auth.uid() when Supabase Auth is integrated
    const user_id = 'default-user'

    const { data: brief, error } = await supabaseAdmin
      .from('weekly_briefs')
      .select(`
        *,
        run:weekly_runs(*)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ brief: null })
      }
      console.error('Error fetching latest brief:', error)
      return NextResponse.json(
        { error: 'Failed to fetch latest brief', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ brief })

  } catch (error) {
    console.error('Latest brief error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
