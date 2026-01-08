import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const DEFAULT_CORE = {
  user_id: 'default-user',
  version: 1,
  title: 'Vibecode Knowledge Core',
  philosophy: `# Development Philosophy

## Speed Over Perfection
We prioritize rapid iteration and learning over achieving perfection on the first try.

## Clarity Over Cleverness
Code should be obvious and maintainable, not a showcase of advanced techniques.

## User Value First
Every decision should trace back to delivering tangible value to users.`,
  principles: [
    {
      id: 'p1',
      title: 'Ship Fast, Learn Faster',
      description: 'Get working software in front of users quickly to validate assumptions.'
    },
    {
      id: 'p2',
      title: 'Boring Technology',
      description: 'Choose proven, stable technologies over exciting new ones unless there is clear benefit.'
    },
    {
      id: 'p3',
      title: 'Delete More Than You Add',
      description: 'Complexity is the enemy. Always look for what can be removed.'
    }
  ],
  is_active: true
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: cores, error } = await supabase
      .from('vibecode_core')
      .select('*')
      .eq('user_id', 'default-user')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching vibecode core:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      core: cores && cores.length > 0 ? cores[0] : null 
    })
  } catch (error: any) {
    console.error('Error in vibecode core GET:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // If initializing, use default values
    const coreData = body.initialize ? DEFAULT_CORE : {
      user_id: 'default-user',
      ...body
    }

    const { data, error } = await supabase
      .from('vibecode_core')
      .insert([coreData])
      .select()
      .single()

    if (error) {
      console.error('Error creating vibecode core:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, core: data })
  } catch (error: any) {
    console.error('Error in vibecode core POST:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Core ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vibecode_core')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vibecode core:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, core: data })
  } catch (error: any) {
    console.error('Error in vibecode core PATCH:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
