import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const supabase = supabaseAdmin()
        const { slug } = params

        const { data, error } = await supabase
            .from('vibecode_stack_guides')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
            }
            console.error('Error fetching guide:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ guide: data })
    } catch (error) {
        console.error('Error in stack-guide API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
