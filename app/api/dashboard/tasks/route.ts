/**
 * Dashboard Tasks API
 * 
 * GET    /api/dashboard/tasks - List tasks
 * POST   /api/dashboard/tasks - Create task
 * PATCH  /api/dashboard/tasks - Update task
 * DELETE /api/dashboard/tasks?id=... - Delete task
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        let query = supabase
            .from('dashboard_tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data: tasks, error } = await query.limit(50)

        if (error) throw error

        return NextResponse.json({ tasks: tasks || [] })
    } catch (error) {
        console.error('Tasks fetch error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const body = await request.json()

        const { assignee_name, title, details, status, due_date } = body

        if (!assignee_name || !title) {
            return NextResponse.json(
                { error: 'assignee_name and title are required' },
                { status: 400 }
            )
        }

        const { data: task, error } = await supabase
            .from('dashboard_tasks')
            .insert({
                user_id: userId,
                assignee_name,
                title,
                details: details || null,
                status: status || 'todo',
                due_date: due_date || null
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, task })
    } catch (error) {
        console.error('Task create error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create task' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const body = await request.json()

        const { id, assignee_name, title, details, status, due_date } = body

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            )
        }

        const updateData: any = { updated_at: new Date().toISOString() }
        if (assignee_name !== undefined) updateData.assignee_name = assignee_name
        if (title !== undefined) updateData.title = title
        if (details !== undefined) updateData.details = details
        if (status !== undefined) updateData.status = status
        if (due_date !== undefined) updateData.due_date = due_date

        const { data: task, error } = await supabase
            .from('dashboard_tasks')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, task })
    } catch (error) {
        console.error('Task update error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update task' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            )
        }

        const { error } = await supabase
            .from('dashboard_tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Task delete error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete task' },
            { status: 500 }
        )
    }
}
