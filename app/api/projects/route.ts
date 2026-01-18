/**
 * Projects API
 *
 * CRUD operations for projects table.
 * Supports real-time updates for the Kanban board.
 *
 * @route GET /api/projects - List all projects
 * @route POST /api/projects - Create a new project
 * @route PATCH /api/projects - Update a project (including status changes from drag-drop)
 * @route DELETE /api/projects - Delete/archive a project
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/projects
 * Fetch all projects, optionally filtered by archived status
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const showArchived = searchParams.get('archived') === 'true'

        let query = supabase
            .from('projects')
            .select('*')
            .eq('is_archived', showArchived)
            .order('updated_at', { ascending: false })

        const { data, error } = await query

        if (error) {
            console.error('Error fetching projects:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ projects: data || [] })
    } catch (error) {
        console.error('Error in projects API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const { data, error } = await supabase
            .from('projects')
            .insert([{
                name: body.name,
                client_name: body.client_name || null,
                description: body.description || null,
                type: body.type || 'Application',
                status: body.status || 'Prospect',
                color_theme: body.color_theme || 'gray',
                quote_amount: body.quote_amount || null,
                briefing: body.briefing_filename || body.briefing || null,
                step_plan: body.step_plan_filename || body.step_plan || null,
                is_archived: false
            }])
            .select()
            .single()

        if (error) {
            console.error('Error creating project:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, project: data })
    } catch (error) {
        console.error('Error creating project:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/projects
 * Update an existing project (supports partial updates for drag-drop status changes)
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Map frontend field names to database column names
        const fieldMapping: Record<string, string> = {
            briefing_filename: 'briefing',
            step_plan_filename: 'step_plan',
            briefing_url: 'briefing_url',
            step_plan_url: 'step_plan_url'
        }

        // Remove undefined values and map field names
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates)
                .filter(([_, v]) => v !== undefined)
                .map(([key, value]) => [fieldMapping[key] || key, value])
        )

        const { data, error } = await supabase
            .from('projects')
            .update(cleanUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating project:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, project: data })
    } catch (error) {
        console.error('Error updating project:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/projects
 * Archive a project (soft delete) or permanently delete
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const permanent = searchParams.get('permanent') === 'true'

        if (!id) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        if (permanent) {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error deleting project:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        } else {
            // Soft delete (archive)
            const { error } = await supabase
                .from('projects')
                .update({ is_archived: true })
                .eq('id', id)

            if (error) {
                console.error('Error archiving project:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in delete project API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
