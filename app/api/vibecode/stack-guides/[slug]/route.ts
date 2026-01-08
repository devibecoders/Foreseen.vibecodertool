import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
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
