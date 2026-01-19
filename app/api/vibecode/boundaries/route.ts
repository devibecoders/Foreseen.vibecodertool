import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(request.url)
    const coreId = searchParams.get('coreId')

    if (!coreId) {
      return NextResponse.json({ error: 'Core ID required' }, { status: 400 })
    }

    const { data: boundaries, error } = await supabase
      .from('vibecode_boundaries')
      .select('*')
      .eq('core_id', coreId)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching boundaries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ boundaries: boundaries || [] })
  } catch (error: any) {
    console.error('Error in boundaries GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()

    const { data, error } = await supabase
      .from('vibecode_boundaries')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Error creating boundary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, boundary: data })
  } catch (error: any) {
    console.error('Error in boundaries POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Boundary ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vibecode_boundaries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting boundary:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in boundaries DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
