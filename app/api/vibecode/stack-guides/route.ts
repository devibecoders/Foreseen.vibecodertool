import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('vibecode_stack_guides')
            .select('id, tool_name, icon, slug, category, summary, sort_order, created_at')
            .not('slug', 'is', null)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Error fetching stack guides:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ guides: data || [] })
    } catch (error) {
        console.error('Error in stack-guides API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
