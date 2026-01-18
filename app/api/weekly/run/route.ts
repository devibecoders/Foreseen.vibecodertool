import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { weeklySynthesisService } from '@/lib/weekly-synthesis'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start_date, end_date, mode = 'weekly', force = false } = body

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    // For now, use a default user_id since we don't have auth yet
    // TODO: Replace with actual auth.uid() when Supabase Auth is integrated
    const user_id = 'default-user'

    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

    // Generate week label
    const weekLabel = getWeekLabel(startDate)

    // Check if brief already exists for this week
    if (!force) {
      const { data: existing } = await supabaseAdmin
        .from('weekly_briefs')
        .select('id, title, created_at')
        .eq('user_id', user_id)
        .eq('week_label', weekLabel)
        .single()

      if (existing) {
        return NextResponse.json({
          success: true,
          message: 'Brief already exists for this week',
          brief_id: existing.id,
          existing: true
        })
      }
    }

    // Create weekly_run record
    const { data: run, error: runError } = await supabaseAdmin
      .from('weekly_runs')
      .insert({
        user_id,
        mode,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'running'
      })
      .select()
      .single()

    if (runError || !run) {
      console.error('Error creating run:', runError)
      return NextResponse.json(
        { error: 'Failed to create run', details: runError },
        { status: 500 }
      )
    }

    try {
      // Get articles for the date range
      const articles = await prisma.article.findMany({
        where: {
          publishedAt: {
            gte: startDate,
            lte: endDate
          },
          analysis: {
            isNot: null
          }
        },
        include: {
          analysis: true
        }
      })

      const itemsConsidered = articles.length

      // Update run with items_considered
      await supabaseAdmin
        .from('weekly_runs')
        .update({ items_considered: itemsConsidered })
        .eq('id', run.id)

      if (itemsConsidered === 0) {
        await supabaseAdmin
          .from('weekly_runs')
          .update({
            status: 'failed',
            error_message: 'No articles found for the specified date range',
            finished_at: new Date().toISOString()
          })
          .eq('id', run.id)

        return NextResponse.json(
          { error: 'No articles found for the specified date range' },
          { status: 400 }
        )
      }

      // Generate synthesis
      const synthesis = await weeklySynthesisService.generateSynthesis(
        startDate,
        endDate,
        40
      )

      // Create weekly_brief record
      const { data: brief, error: briefError } = await supabaseAdmin
        .from('weekly_briefs')
        .insert({
          user_id,
          run_id: run.id,
          week_label: weekLabel,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          title: synthesis.title,
          executive_summary: synthesis.executive_summary.join('\n'),
          macro_trends: synthesis.macro_trends,
          implications_vibecoding: synthesis.implications_vibecoding,
          client_opportunities: synthesis.client_opportunities,
          ignore_list: synthesis.ignore_list,
          reading_list: synthesis.reading_list,
          full_markdown: synthesis.full_markdown
        })
        .select()
        .single()

      if (briefError || !brief) {
        console.error('Error creating brief:', briefError)
        throw new Error('Failed to create brief')
      }

      // Link articles to brief
      const articleLinks = articles.slice(0, 40).map((article: { id: string; analysis: { impactScore: number } | null }) => ({
        brief_id: brief.id,
        article_id: article.id,
        used_reason: `Impact: ${article.analysis?.impactScore || 0}`
      }))

      await supabaseAdmin
        .from('weekly_brief_sources')
        .insert(articleLinks)

      // Update run status
      await supabaseAdmin
        .from('weekly_runs')
        .update({
          status: 'done',
          items_used: articleLinks.length,
          finished_at: new Date().toISOString()
        })
        .eq('id', run.id)

      return NextResponse.json({
        success: true,
        run_id: run.id,
        brief_id: brief.id,
        items_considered: itemsConsidered,
        items_used: articleLinks.length,
        week_label: weekLabel
      })

    } catch (error) {
      console.error('Synthesis generation error:', error)
      
      // Update run status to failed
      await supabaseAdmin
        .from('weekly_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          finished_at: new Date().toISOString()
        })
        .eq('id', run.id)

      return NextResponse.json(
        { 
          error: 'Failed to generate synthesis',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Weekly run error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getWeekLabel(date: Date): string {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`
}
