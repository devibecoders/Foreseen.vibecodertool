/**
 * API: Generate Outcome
 * POST: Generate checklist/reminder/spike from article
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { 
  generateOutcome, 
  formatOutcomeMarkdown,
  type OutcomeType, 
  type GeneratedOutcome 
} from '@/lib/outcomeGenerator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { articleId, outcomeType } = body
    
    if (!articleId || !outcomeType) {
      return NextResponse.json(
        { error: 'articleId and outcomeType are required' },
        { status: 400 }
      )
    }
    
    if (!['checklist', 'reminder', 'spike'].includes(outcomeType)) {
      return NextResponse.json(
        { error: 'outcomeType must be checklist, reminder, or spike' },
        { status: 400 }
      )
    }
    
    const supabase = supabaseAdmin()
    
    // Fetch article with analysis
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        url,
        analyses (
          summary,
          vibecoders_angle,
          key_takeaways
        )
      `)
      .eq('id', articleId)
      .single()
    
    if (fetchError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }
    
    const analysis = article.analyses?.[0]
    if (!analysis) {
      return NextResponse.json(
        { error: 'Article has no analysis' },
        { status: 400 }
      )
    }
    
    // Generate the outcome
    const outcome = await generateOutcome(outcomeType as OutcomeType, {
      title: article.title,
      summary: analysis.summary,
      url: article.url,
      vibecoders_angle: analysis.vibecoders_angle || undefined,
      key_takeaways: analysis.key_takeaways || undefined,
    })
    
    // Also generate markdown version
    const markdown = formatOutcomeMarkdown(outcome)
    
    // Store the outcome (optional, for history)
    await supabase
      .from('generated_outcomes')
      .insert({
        article_id: articleId,
        outcome_type: outcomeType,
        outcome_data: outcome,
        outcome_markdown: markdown,
      })
      .catch(() => {
        // Table might not exist yet, that's okay
        console.log('Note: generated_outcomes table not available')
      })
    
    return NextResponse.json({
      success: true,
      outcome,
      markdown,
      articleTitle: article.title,
    })
  } catch (error) {
    console.error('Outcome generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
