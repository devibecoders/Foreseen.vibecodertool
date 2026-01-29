/**
 * API: LinkedIn Post Generator
 * POST: Generate 3 LinkedIn posts from weekly trends
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { 
  identifyTrends, 
  generateLinkedInPosts,
  type LinkedInPost 
} from '@/lib/linkedinGenerator'
import { subDays } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const daysBack = body.daysBack || 7
    
    const supabase = supabaseAdmin()
    
    // Fetch recent high-impact articles
    const cutoffDate = subDays(new Date(), daysBack).toISOString()
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        analyses (
          summary,
          categories,
          impact_score
        )
      `)
      .gte('published_at', cutoffDate)
      .order('published_at', { ascending: false })
      .limit(50)
    
    if (error) throw new Error(`Failed to fetch articles: ${error.message}`)
    
    // Filter to articles with analysis
    const articlesWithAnalysis = (articles || [])
      .filter(a => a.analyses && a.analyses.length > 0)
      .map(a => ({
        title: a.title,
        summary: a.analyses![0].summary,
        categories: a.analyses![0].categories,
        impact_score: a.analyses![0].impact_score
      }))
      // Sort by impact
      .sort((a, b) => b.impact_score - a.impact_score)
    
    if (articlesWithAnalysis.length < 3) {
      return NextResponse.json(
        { error: 'Not enough articles to generate posts. Run a scan first.' },
        { status: 400 }
      )
    }
    
    // Identify trends
    const trends = identifyTrends(articlesWithAnalysis)
    
    // Generate posts
    const posts = await generateLinkedInPosts(
      trends,
      articlesWithAnalysis.slice(0, 10)
    )
    
    return NextResponse.json({
      success: true,
      posts,
      trends: trends.slice(0, 3).map(t => ({
        topic: t.topic,
        articleCount: t.totalArticles,
        avgImpact: Math.round(t.avgImpact)
      })),
      articlesAnalyzed: articlesWithAnalysis.length,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('LinkedIn generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
