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

    const { data: tools, error } = await supabase
      .from('vibecode_tools')
      .select('*')
      .eq('core_id', coreId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tools:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tools: tools || [] })
  } catch (error: any) {
    console.error('Error in tools GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()

    const { data, error } = await supabase
      .from('vibecode_tools')
      .insert([body])
      .select()
      .single()

    if (error) {
      console.error('Error creating tool:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tool: data })
  } catch (error: any) {
    console.error('Error in tools POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Tool ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('vibecode_tools')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting tool:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in tools DELETE:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
