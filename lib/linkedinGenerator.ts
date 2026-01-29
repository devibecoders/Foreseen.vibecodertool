/**
 * LinkedIn Post Generator
 * 
 * Generates 3 LinkedIn posts from weekly trends
 * Uses LLM to create engaging, professional content
 */

import { llmService } from './llm'

export interface LinkedInPost {
  id: string
  hook: string           // Opening line (the "hook")
  body: string           // Main content
  callToAction: string   // Ending CTA
  hashtags: string[]     // Relevant hashtags
  postType: 'insight' | 'question' | 'story'
  basedOn: string[]      // Article titles this is based on
  characterCount: number
}

export interface TrendSummary {
  topic: string
  articles: Array<{
    title: string
    summary: string
    impact_score: number
  }>
  totalArticles: number
  avgImpact: number
}

const LINKEDIN_SYSTEM_PROMPT = `You are a LinkedIn content expert for a tech professional who shares insights about AI and developer tools.

Your posts should be:
- Authentic and conversational, not salesy
- Educational with a clear takeaway
- Formatted for LinkedIn (short paragraphs, emojis for visual breaks)
- Under 3000 characters (sweet spot is 1200-1800)
- Include a hook that stops the scroll

Post types to create:
1. INSIGHT: Share a non-obvious observation about a trend
2. QUESTION: Pose a thought-provoking question to spark discussion
3. STORY: Tell a mini-story or share an experience/prediction

Output JSON with this exact structure:
{
  "posts": [
    {
      "hook": "First line that grabs attention",
      "body": "Main content with paragraphs separated by \\n\\n",
      "callToAction": "Ending that invites engagement",
      "hashtags": ["AI", "DevTools", "TechTrends"],
      "postType": "insight|question|story"
    }
  ]
}

Make each post unique in style and approach. No corporate jargon.
Use Dutch where appropriate for a Dutch audience, but mix in English tech terms naturally.`

/**
 * Identify top trends from articles
 */
export function identifyTrends(articles: Array<{
  title: string
  summary: string
  categories: string
  impact_score: number
}>): TrendSummary[] {
  // Group by category
  const byCategory: Record<string, typeof articles> = {}
  
  for (const article of articles) {
    const categories = article.categories.split(',').map(c => c.trim())
    for (const cat of categories) {
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(article)
    }
  }
  
  // Calculate trend scores
  const trends: TrendSummary[] = Object.entries(byCategory)
    .map(([topic, arts]) => ({
      topic,
      articles: arts.slice(0, 3).map(a => ({
        title: a.title,
        summary: a.summary,
        impact_score: a.impact_score
      })),
      totalArticles: arts.length,
      avgImpact: arts.reduce((sum, a) => sum + a.impact_score, 0) / arts.length
    }))
    .sort((a, b) => {
      // Sort by combination of count and impact
      const scoreA = a.totalArticles * 0.3 + a.avgImpact * 0.7
      const scoreB = b.totalArticles * 0.3 + b.avgImpact * 0.7
      return scoreB - scoreA
    })
  
  return trends.slice(0, 5) // Top 5 trends
}

/**
 * Generate LinkedIn posts from trends
 */
export async function generateLinkedInPosts(
  trends: TrendSummary[],
  topArticles: Array<{ title: string; summary: string }>
): Promise<LinkedInPost[]> {
  const userPrompt = `Generate 3 LinkedIn posts based on these AI/tech trends from this week:

TOP TRENDS:
${trends.map((t, i) => `${i + 1}. ${t.topic} (${t.totalArticles} articles, avg impact: ${Math.round(t.avgImpact)})
   - ${t.articles.map(a => a.title).join('\n   - ')}`).join('\n\n')}

KEY ARTICLES:
${topArticles.slice(0, 5).map((a, i) => `${i + 1}. "${a.title}"
   ${a.summary}`).join('\n\n')}

Create 3 posts:
1. An INSIGHT post about the most impactful trend
2. A QUESTION post that sparks discussion
3. A STORY post with a prediction or observation

Each post should be unique and engaging. Include relevant hashtags.`

  try {
    const response = await llmService.chat(LINKEDIN_SYSTEM_PROMPT, userPrompt, { 
      json: true,
      temperature: 0.7 // More creative for social content
    })
    
    const parsed = JSON.parse(response)
    
    if (!parsed.posts || !Array.isArray(parsed.posts)) {
      throw new Error('Invalid response structure')
    }
    
    return parsed.posts.map((post: any, index: number) => ({
      id: `post-${Date.now()}-${index}`,
      hook: post.hook || '',
      body: post.body || '',
      callToAction: post.callToAction || '',
      hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
      postType: post.postType || 'insight',
      basedOn: topArticles.slice(0, 3).map(a => a.title),
      characterCount: (post.hook + '\n\n' + post.body + '\n\n' + post.callToAction).length
    }))
  } catch (error) {
    console.error('LinkedIn generation error:', error)
    
    // Return fallback posts
    return [
      {
        id: `post-${Date.now()}-0`,
        hook: '🤖 This week in AI was interesting...',
        body: `Key trends I noticed:\n\n${trends.slice(0, 3).map(t => `• ${t.topic}`).join('\n')}\n\nWhat caught your attention?`,
        callToAction: 'Drop a comment with your take 👇',
        hashtags: ['AI', 'TechTrends', 'Innovation'],
        postType: 'insight' as const,
        basedOn: topArticles.slice(0, 2).map(a => a.title),
        characterCount: 200
      }
    ]
  }
}

/**
 * Format post for copying
 */
export function formatPostForCopy(post: LinkedInPost): string {
  const hashtagString = post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
  
  return `${post.hook}

${post.body}

${post.callToAction}

${hashtagString}`
}

/**
 * Estimate engagement potential
 */
export function estimateEngagement(post: LinkedInPost): {
  score: number
  reasons: string[]
} {
  const reasons: string[] = []
  let score = 50 // Base score
  
  // Hook quality
  if (post.hook.length > 10 && post.hook.length < 100) {
    score += 10
    reasons.push('Good hook length')
  }
  if (post.hook.includes('?')) {
    score += 5
    reasons.push('Hook asks a question')
  }
  if (/[\u{1F300}-\u{1F9FF}]/u.test(post.hook)) {
    score += 5
    reasons.push('Uses emoji in hook')
  }
  
  // Length
  if (post.characterCount >= 1200 && post.characterCount <= 2000) {
    score += 15
    reasons.push('Optimal length')
  } else if (post.characterCount > 3000) {
    score -= 10
    reasons.push('May be too long')
  }
  
  // CTA
  if (post.callToAction.includes('?') || post.callToAction.includes('👇')) {
    score += 10
    reasons.push('Strong call to action')
  }
  
  // Hashtags
  if (post.hashtags.length >= 3 && post.hashtags.length <= 5) {
    score += 5
    reasons.push('Good hashtag count')
  }
  
  return { score: Math.min(100, score), reasons }
}
