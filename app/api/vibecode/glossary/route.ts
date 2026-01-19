import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const supabase = supabaseAdmin()
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.toLowerCase() || ''

        const { data, error } = await supabase
            .from('vibecode_glossary')
            .select('id, term, definition, technical_context, related_guide_id, created_at')
            .order('term', { ascending: true })

        if (error) {
            console.error('Error fetching glossary:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        let filteredData = data || []
        if (search) {
            filteredData = filteredData.filter(
                (item) =>
                    item.term.toLowerCase().includes(search) ||
                    item.definition.toLowerCase().includes(search)
            )
        }

        return NextResponse.json({ terms: filteredData })
    } catch (error) {
        console.error('Error in glossary API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
