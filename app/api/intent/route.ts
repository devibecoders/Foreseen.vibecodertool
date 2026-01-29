/**
 * API: Intent Label Detection
 * POST: Detect and store intent labels for articles
 * GET: Get intent distribution stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { detectIntent, type IntentLabel } from '@/lib/signals/intentLabels'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scanId, articleIds } = body
    
    const supabase = supabaseAdmin()
    
    // Build query for articles to process
    let query = supabase
      .from('articles')
      .select(`
        id,
        title,
        raw_content,
        analyses (
          id,
          summary,
          intent_label
        )
      `)
    
    if (scanId) {
      query = query.eq('scan_id', scanId)
    } else if (articleIds && articleIds.length > 0) {
      query = query.in('id', articleIds)
    } else {
      return NextResponse.json(
        { error: 'Either scanId or articleIds is required' },
        { status: 400 }
      )
    }
    
    const { data: articles, error: fetchError } = await query
    
    if (fetchError) throw new Error(`Failed to fetch articles: ${fetchError.message}`)
    
    let processed = 0
    let skipped = 0
    const results: Array<{ articleId: string, intent: IntentLabel, confidence: number }> = []
    
    for (const article of articles || []) {
      const analysis = article.analyses?.[0]
      
      // Skip if no analysis
      if (!analysis) {
        skipped++
        continue
      }
      
      // Skip if already has intent (unless force)
      if (analysis.intent_label && !body.force) {
        skipped++
        continue
      }
      
      // Detect intent
      const intentResult = detectIntent({
        title: article.title,
        summary: analysis.summary,
        content: article.raw_content || undefined
      })
      
      // Update analysis with intent
      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          intent_label: intentResult.label,
          intent_confidence: intentResult.confidence,
          intent_signals: intentResult.signals
        })
        .eq('id', analysis.id)
      
      if (updateError) {
        console.error(`Failed to update intent for analysis ${analysis.id}:`, updateError)
        continue
      }
      
      processed++
      results.push({
        articleId: article.id,
        intent: intentResult.label,
        confidence: intentResult.confidence
      })
    }
    
    return NextResponse.json({
      success: true,
      processed,
      skipped,
      results
    })
  } catch (error) {
    console.error('Intent detection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Intent detection failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    
    // Get intent distribution
    const { data: distribution, error } = await supabase
      .from('analyses')
      .select('intent_label')
      .not('intent_label', 'is', null)
    
    if (error) throw new Error(`Failed to fetch distribution: ${error.message}`)
    
    // Count by intent
    const counts: Record<string, number> = {}
    for (const row of distribution || []) {
      const label = row.intent_label as string
      counts[label] = (counts[label] || 0) + 1
    }
    
    return NextResponse.json({
      distribution: counts,
      total: distribution?.length || 0
    })
  } catch (error) {
    console.error('Intent stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
