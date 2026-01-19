/**
 * Dashboard Summary API
 * 
 * GET /api/dashboard/summary
 * Returns all data needed for the dashboard homepage
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { format, startOfWeek, getWeek, getYear } from 'date-fns'

export const dynamic = 'force-dynamic'

function getCurrentWeekLabel(): string {
    const now = new Date()
    const week = getWeek(now, { weekStartsOn: 1 })
    const year = getYear(now)
    return `${year}-W${week.toString().padStart(2, '0')}`
}

export async function GET() {
    try {
        const supabase = supabaseAdmin()
        const userId = 'default-user'
        const weekLabel = getCurrentWeekLabel()

        // 1. Latest absolute scan (to show running/failed status on dashboard)
        const { data: allScans } = await supabase
            .from('scans')
            .select('id, started_at, completed_at, items_fetched, items_analyzed, status')
            .order('started_at', { ascending: false })
            .limit(1)

        const latestScan = allScans?.[0] || null

        // 1b. Latest COMPLETED scan (for accurate unreviewed counts in step 2)
        const { data: completedScans } = await supabase
            .from('scans')
            .select('id')
            .eq('status', 'completed')
            .order('started_at', { ascending: false })
            .limit(1)

        const latestCompletedScan = completedScans?.[0] || null
        console.log(`[Dashboard] Latest completed scan: ${latestCompletedScan?.id || 'None'}`)


        // 2. Unreviewed articles (articles without decisions in latest scan)
        let unreviewedCount = 0
        let unreviewedTop: any[] = []

        if (latestCompletedScan) {
            console.log(`[Dashboard] Found latest completed scan for unreviewed counts: ${latestCompletedScan.id}`)
            // Get articles from latest completed scan
            const { data: articles } = await supabase
                .from('articles')
                .select(`
          id, title, url, source, published_at,
          analyses(id, summary, categories, impact_score)
        `)
                .eq('scan_id', latestCompletedScan.id)
                .order('published_at', { ascending: false })

            console.log(`[Dashboard] Total articles in completed scan ${latestCompletedScan.id}: ${articles?.length || 0}`)

            // Get decisions for this scan
            const { data: decisions } = await supabase
                .from('decision_assessments')
                .select('article_id')
                .eq('scan_id', latestCompletedScan.id)

            console.log(`[Dashboard] Decisions found for scan ${latestCompletedScan.id}: ${decisions?.length || 0}`)

            const decidedArticleIds = new Set((decisions || []).map(d => d.article_id))

            // Filter unreviewed
            const unreviewed = (articles || []).filter(a => !decidedArticleIds.has(a.id))
            unreviewedCount = unreviewed.length
            unreviewedTop = unreviewed.slice(0, 5).map(a => ({
                id: a.id,
                title: a.title,
                url: a.url,
                source: a.source,
                score: a.analyses?.[0]?.impact_score || 0,
                category: a.analyses?.[0]?.categories?.split(',')[0] || 'OTHER'
            }))
        } else {
            console.log('[Dashboard] No completed scans found for unreviewed counts')
        }
        // 3. Latest brief
        const { data: briefs } = await supabase
            .from('weekly_briefs')
            .select('id, title, week_label, start_date, end_date, executive_summary, created_at')
            .order('created_at', { ascending: false })
            .limit(1)

        const latestBrief = briefs?.[0] || null

        // 4. Decisions inbox open count
        const { count: decisionsInboxOpen } = await supabase
            .from('decision_assessments')
            .select('id', { count: 'exact', head: true })
            .neq('action_required', 'ignore')
            .gte('confidence', 3)

        // 5. Vibecode Core status
        const { data: vibecodeItems } = await supabase
            .from('vibecode_core')
            .select('id, name, description, status, updated_at')
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(3)

        const vibecodeCore = {
            lastUpdated: vibecodeItems?.[0]?.updated_at || null,
            principlesPreview: (vibecodeItems || []).slice(0, 2).map(p => ({
                id: p.id,
                name: p.name,
                description: p.description?.substring(0, 100) + '...'
            }))
        }

        // 6. Projects (exclude archived, matching Projects page API)
        // Project status values: 'Prospect', 'Offer Sent', 'Setup', 'In Progress', 'Review', 'Done'
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, status, created_at')
            .eq('is_archived', false)
            .order('created_at', { ascending: false })
            .limit(20)

        console.log('[Dashboard] Projects query result:', {
            count: projects?.length,
            error: projectsError?.message,
            statuses: projects?.map(p => p.status)
        })

        // Active = Setup, In Progress, Review (actively being worked on)
        const ACTIVE_STATUSES = ['Setup', 'In Progress', 'Review']
        const activeCount = (projects || []).filter(p => ACTIVE_STATUSES.includes(p.status)).length

        // Completed = Done
        const completedCount = (projects || []).filter(p => p.status === 'Done').length

        // 7. Current week note
        const { data: notes } = await supabase
            .from('dashboard_notes')
            .select('*')
            .eq('user_id', userId)
            .eq('week_label', weekLabel)
            .limit(1)

        const note = notes?.[0] || { week_label: weekLabel, content: '', pinned: false }

        // 8. Tasks
        const { data: tasks } = await supabase
            .from('dashboard_tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)

        return NextResponse.json({
            latestScan: latestScan ? {
                id: latestScan.id,
                status: latestScan.status,
                startedAt: latestScan.started_at,
                completedAt: latestScan.completed_at,
                itemsFetched: latestScan.items_fetched,
                itemsAnalyzed: latestScan.items_analyzed
            } : null,
            unreviewedCount,
            unreviewedTop,
            latestBrief: latestBrief ? {
                id: latestBrief.id,
                title: latestBrief.title,
                weekLabel: latestBrief.week_label,
                startDate: latestBrief.start_date,
                endDate: latestBrief.end_date,
                executiveSummary: latestBrief.executive_summary
            } : null,
            decisionsInboxOpen: decisionsInboxOpen || 0,
            vibecodeCore,
            projects: {
                activeCount,
                completedCount,
                recent: (projects || []).slice(0, 3).map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status
                }))
            },
            note,
            tasks: tasks || [],
            weekLabel
        }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        })
    } catch (error) {
        console.error('Dashboard summary error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
            { status: 500 }
        )
    }
}
