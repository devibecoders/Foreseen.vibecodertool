/**
 * Dashboard Note API
 * 
 * GET  /api/dashboard/note?week_label=2026-W03
 * PUT  /api/dashboard/note - Upsert note
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getWeek, getYear } from 'date-fns'

export const dynamic = 'force-dynamic'

function getCurrentWeekLabel(): string {
    const now = new Date()
    const week = getWeek(now, { weekStartsOn: 1 })
    const year = getYear(now)
    return `${year}-W${week.toString().padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const { searchParams } = new URL(request.url)
        const weekLabel = searchParams.get('week_label') || getCurrentWeekLabel()

        const { data: notes, error } = await supabase
            .from('dashboard_notes')
            .select('*')
            .eq('user_id', userId)
            .eq('week_label', weekLabel)
            .limit(1)

        if (error) throw error

        return NextResponse.json({
            note: notes?.[0] || { week_label: weekLabel, content: '', pinned: false }
        })
    } catch (error) {
        console.error('Note fetch error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch note' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const body = await request.json()

        const { week_label, content, pinned } = body
        const weekLabel = week_label || getCurrentWeekLabel()

        const { data: note, error } = await supabase
            .from('dashboard_notes')
            .upsert({
                user_id: userId,
                week_label: weekLabel,
                content: content || '',
                pinned: pinned || false,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,week_label'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, note })
    } catch (error) {
        console.error('Note save error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to save note' },
            { status: 500 }
        )
    }
}
