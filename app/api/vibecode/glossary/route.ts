import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')?.toLowerCase() || ''

        let query = supabase
            .from('vibecode_glossary')
            .select('id, term, definition, technical_context, related_guide_id, created_at')
            .order('term', { ascending: true })

        // Client-side filtering for search (Supabase ilike is case-insensitive)
        const { data, error } = await query

        if (error) {
            console.error('Error fetching glossary:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Filter results if search term provided
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
