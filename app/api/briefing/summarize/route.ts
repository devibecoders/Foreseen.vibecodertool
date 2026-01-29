/**
 * API: Briefing Summarizer
 * POST: Analyze a briefing and extract structured insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  summarizeBriefing, 
  formatSummaryAsMarkdown,
  getSummaryStats 
} from '@/lib/briefingSummarizer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { briefingText, projectContext } = body
    
    if (!briefingText || briefingText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Briefing text must be at least 50 characters' },
        { status: 400 }
      )
    }
    
    // Summarize the briefing
    const summary = await summarizeBriefing(briefingText, projectContext)
    
    // Generate markdown export
    const markdown = formatSummaryAsMarkdown(summary)
    
    // Get quick stats
    const stats = getSummaryStats(summary)
    
    return NextResponse.json({
      success: true,
      summary,
      markdown,
      stats,
      analyzedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Briefing summarization error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Summarization failed' },
      { status: 500 }
    )
  }
}
