import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const user_id = 'default-user'

    const { data: brief, error } = await supabase
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
