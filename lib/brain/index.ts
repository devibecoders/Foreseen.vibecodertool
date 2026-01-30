/**
 * Foreseen Brain
 * 
 * Unified AI intelligence layer for Foreseen.
 * All AI operations flow through this single class,
 * sharing the same context, signals, and decision history.
 */

import { LLMService } from '../llm'
import { loadUserContext, clearContextCache } from './context'
import * as prompts from './prompts'
import type {
  UserContext,
  ArticleInput,
  ArticleAnalysis,
  LeadInput,
  LeadAnalysis,
  ProjectInput,
  ProjectIntelligence,
  ContentInput,
  GeneratedContent,
  SynthesisInput,
  WeeklySynthesis,
  PrioritizedItem,
  MustReadItem,
  BatchType,
  BatchRequest,
  BatchResult,
  GeneratedProspect
} from './types'

export class ForeseenBrain {
  private llm: LLMService
  private context: UserContext | null = null
  private userId: string

  constructor(userId: string = 'default') {
    this.llm = new LLMService()
    this.userId = userId
  }

  /**
   * Load or refresh user context
   */
  async loadContext(): Promise<UserContext> {
    this.context = await loadUserContext(this.userId)
    return this.context
  }

  /**
   * Get current context (load if needed)
   */
  private async getContext(): Promise<UserContext> {
    if (!this.context) {
      await this.loadContext()
    }
    return this.context!
  }

  /**
   * Clear cached context
   */
  clearCache(): void {
    clearContextCache(this.userId)
    this.context = null
  }

  // ============================================================
  // ARTICLE ANALYSIS
  // ============================================================

  /**
   * Analyze an article for relevance and categorization
   */
  async analyzeArticle(article: ArticleInput): Promise<ArticleAnalysis> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.ARTICLE_ANALYSIS_PROMPT

    const userPrompt = `Analyseer dit artikel:

Titel: ${article.title}
URL: ${article.url}
${article.source ? `Bron: ${article.source}` : ''}
${article.content ? `Content: ${article.content.substring(0, 2000)}` : ''}

Geef je analyse in JSON format.`

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { json: true, temperature: 0.3 })
      const parsed = JSON.parse(response)

      return {
        summary: parsed.summary || '',
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        impactScore: typeof parsed.impactScore === 'number' ? parsed.impactScore : 50,
        relevanceReason: parsed.relevanceReason || '',
        customerAngle: parsed.customerAngle || '',
        vibecodersAngle: parsed.vibecodersAngle || '',
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : []
      }
    } catch (error) {
      console.error('Article analysis error:', error)
      return {
        summary: 'Error analyzing article',
        categories: ['OTHER'],
        impactScore: 0,
        relevanceReason: 'Analysis failed',
        customerAngle: '',
        vibecodersAngle: '',
        keyTakeaways: []
      }
    }
  }

  // ============================================================
  // LEAD ANALYSIS
  // ============================================================

  /**
   * Analyze a potential lead
   */
  async analyzeLead(lead: LeadInput): Promise<LeadAnalysis> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.LEAD_ANALYSIS_PROMPT

    const userPrompt = `Analyseer deze potentiële klant:

Bedrijf: ${lead.company_name}
Website: ${lead.website_url || 'Niet opgegeven'}
Industrie: ${lead.industry || 'Onbekend'}
Grootte: ${lead.company_size || 'Onbekend'}
Notities: ${lead.notes || 'Geen'}

Geef je analyse in JSON format.`

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { json: true, temperature: 0.5 })
      const parsed = JSON.parse(response)

      return {
        quality_score: Math.min(100, Math.max(0, parsed.quality_score || 50)),
        fit_score: Math.min(100, Math.max(0, parsed.fit_score || 50)),
        website_issues: parsed.website_issues || [],
        opportunities: parsed.opportunities || [],
        fit_reasons: parsed.fit_reasons || [],
        pain_points: parsed.pain_points || [],
        outreach_email: parsed.outreach_email || '',
        outreach_linkedin: parsed.outreach_linkedin || '',
        recommended_approach: parsed.recommended_approach || '',
        estimated_project_value: parsed.estimated_project_value || 'Onbekend'
      }
    } catch (error) {
      console.error('Lead analysis error:', error)
      return {
        quality_score: 50,
        fit_score: 50,
        website_issues: [],
        opportunities: [],
        fit_reasons: ['Analysis failed'],
        pain_points: [],
        outreach_email: '',
        outreach_linkedin: '',
        recommended_approach: 'Manual review needed',
        estimated_project_value: 'Unknown'
      }
    }
  }

  /**
   * Generate a batch of AI-sourced leads
   */
  async generateLeadBatch(request: BatchRequest): Promise<BatchResult> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context)
    const userPrompt = prompts.buildLeadBatchPrompt(request.type, request.count, request.industry)

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { 
        json: true, 
        temperature: 0.8,
        maxTokens: 4000
      })
      const parsed = JSON.parse(response)

      const prospects: GeneratedProspect[] = (parsed.prospects || []).map((p: any) => ({
        company_name: p.company_name || 'Unknown',
        website_url: p.website_url,
        industry: p.industry || 'Unknown',
        company_size: p.company_size || request.type,
        description: p.description || '',
        why_target: p.why_target || '',
        estimated_project_value: p.estimated_project_value || '',
        suggested_approach: p.suggested_approach || '',
        confidence_score: p.confidence_score || 50
      }))

      return {
        batch_id: `batch-${Date.now()}`,
        type: request.type,
        prospects,
        generated_at: new Date(),
        total_requested: request.count,
        total_generated: prospects.length
      }
    } catch (error) {
      console.error('Lead batch generation error:', error)
      return {
        batch_id: `batch-${Date.now()}-failed`,
        type: request.type,
        prospects: [],
        generated_at: new Date(),
        total_requested: request.count,
        total_generated: 0
      }
    }
  }

  // ============================================================
  // PROJECT INTELLIGENCE
  // ============================================================

  /**
   * Analyze a project briefing and generate intelligence
   */
  async analyzeProject(project: ProjectInput): Promise<ProjectIntelligence> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.PROJECT_INTELLIGENCE_PROMPT

    const userPrompt = `Analyseer deze project briefing:

PROJECT: ${project.name}
${project.client_name ? `KLANT: ${project.client_name}` : ''}
${project.budget ? `BUDGET: ${project.budget}` : ''}
${project.deadline ? `DEADLINE: ${project.deadline}` : ''}

BESCHRIJVING:
${project.description || 'Geen beschrijving'}

BRIEFING:
${project.briefing_text || 'Geen briefing tekst'}

Genereer de JSON analyse.`

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { 
        json: true, 
        temperature: 0.3,
        maxTokens: 3000
      })
      const parsed = JSON.parse(response)

      // Add IDs to items
      return {
        oneLiner: parsed.oneLiner || '',
        painPoints: (parsed.painPoints || []).map((p: any, i: number) => ({
          ...p,
          id: `pain-${i}`
        })),
        mustHaves: (parsed.mustHaves || []).map((m: any, i: number) => ({
          ...m,
          id: `must-${i}`
        })),
        questions: (parsed.questions || []).map((q: any, i: number) => ({
          ...q,
          id: `q-${i}`
        })),
        assumptions: parsed.assumptions || [],
        outOfScope: parsed.outOfScope || [],
        risks: (parsed.risks || []).map((r: any, i: number) => ({
          ...r,
          id: `risk-${i}`
        })),
        suggestedTasks: parsed.suggestedTasks || [],
        timeline: parsed.timeline,
        budget: parsed.budget,
        stakeholders: parsed.stakeholders || [],
        successCriteria: parsed.successCriteria || []
      }
    } catch (error) {
      console.error('Project analysis error:', error)
      throw new Error('Failed to analyze project')
    }
  }

  // ============================================================
  // CONTENT GENERATION
  // ============================================================

  /**
   * Generate content (LinkedIn posts, etc.)
   */
  async generateContent(input: ContentInput): Promise<GeneratedContent[]> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.LINKEDIN_CONTENT_PROMPT

    const userPrompt = `Genereer ${input.type} content gebaseerd op:

${input.topic ? `ONDERWERP: ${input.topic}` : ''}

${input.trends && input.trends.length > 0 ? `TRENDS:
${input.trends.map((t, i) => `${i + 1}. ${t.topic} (${t.count} artikelen, impact: ${t.avgImpact})`).join('\n')}` : ''}

${input.articles && input.articles.length > 0 ? `ARTIKELEN:
${input.articles.slice(0, 5).map((a, i) => `${i + 1}. "${a.title}"
   ${a.summary}`).join('\n\n')}` : ''}

Toon: ${input.tone || 'professional'}

Genereer 3 unieke posts.`

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { 
        json: true, 
        temperature: 0.7,
        maxTokens: 3000
      })
      const parsed = JSON.parse(response)

      if (!parsed.posts || !Array.isArray(parsed.posts)) {
        throw new Error('Invalid response structure')
      }

      return parsed.posts.map((post: any, index: number) => ({
        id: `post-${Date.now()}-${index}`,
        content: `${post.hook}\n\n${post.body}\n\n${post.callToAction}`,
        hook: post.hook || '',
        body: post.body || '',
        callToAction: post.callToAction || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        contentType: post.postType || 'insight',
        basedOn: input.articles?.slice(0, 3).map(a => a.title) || [],
        characterCount: (post.hook + post.body + post.callToAction).length,
        engagementScore: this.estimateEngagement(post)
      }))
    } catch (error) {
      console.error('Content generation error:', error)
      return [{
        id: `post-${Date.now()}-fallback`,
        content: '🤖 Content generation failed. Please try again.',
        hook: '🤖 Content generation failed.',
        body: 'Please try again with different input.',
        callToAction: '',
        hashtags: ['AI'],
        contentType: 'insight',
        basedOn: [],
        characterCount: 50
      }]
    }
  }

  private estimateEngagement(post: any): number {
    let score = 50
    if (post.hook?.length > 10 && post.hook?.length < 100) score += 10
    if (post.hook?.includes('?')) score += 5
    if (/[\u{1F300}-\u{1F9FF}]/u.test(post.hook || '')) score += 5
    const totalLength = (post.hook || '').length + (post.body || '').length + (post.callToAction || '').length
    if (totalLength >= 1200 && totalLength <= 2000) score += 15
    if (post.callToAction?.includes('?') || post.callToAction?.includes('👇')) score += 10
    return Math.min(100, score)
  }

  // ============================================================
  // SYNTHESIS
  // ============================================================

  /**
   * Generate weekly synthesis from articles
   */
  async synthesize(input: SynthesisInput): Promise<WeeklySynthesis> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.SYNTHESIS_PROMPT

    const weekLabel = this.getWeekLabel(input.startDate)
    
    let articleContext = `Week: ${weekLabel}\n`
    articleContext += `Periode: ${input.startDate.toISOString().split('T')[0]} tot ${input.endDate.toISOString().split('T')[0]}\n`
    articleContext += `Totaal artikelen: ${input.articles.length}\n\n`
    articleContext += `ARTIKELEN OM TE ANALYSEREN:\n\n`

    input.articles.forEach((article, idx) => {
      articleContext += `[${idx + 1}] ${article.title}\n`
      articleContext += `Bron: ${article.source}\n`
      articleContext += `URL: ${article.url}\n`
      articleContext += `Impact Score: ${article.impact_score}/100\n`
      articleContext += `Categorieën: ${article.categories}\n`
      articleContext += `Samenvatting: ${article.summary}\n`
      if (article.vibecoders_angle) articleContext += `Voor Vibecoders: ${article.vibecoders_angle}\n`
      if (article.customer_angle) articleContext += `Voor Klanten: ${article.customer_angle}\n`
      articleContext += `\n`
    })

    try {
      const response = await this.llm.chat(systemPrompt, articleContext, { 
        json: true, 
        temperature: 0.7,
        maxTokens: 4000
      })
      const parsed = JSON.parse(response)

      return {
        weekLabel: parsed.weekLabel || weekLabel,
        title: parsed.title || `Foreseen Weekly Synthesis — ${weekLabel}`,
        executiveSummary: parsed.executiveSummary || [],
        macroTrends: parsed.macroTrends || [],
        implications: parsed.implications || [],
        clientOpportunities: parsed.clientOpportunities || [],
        ignoreList: parsed.ignoreList || [],
        readingList: parsed.readingList || []
      }
    } catch (error) {
      console.error('Synthesis error:', error)
      throw new Error('Failed to generate synthesis')
    }
  }

  private getWeekLabel(date: Date): string {
    const year = date.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }

  // ============================================================
  // PRIORITIZATION
  // ============================================================

  /**
   * Prioritize a list of items
   */
  async prioritize(items: Array<{
    id: string
    title: string
    type: 'article' | 'lead' | 'project' | 'task'
    description?: string
    score?: number
    deadline?: string
  }>): Promise<PrioritizedItem[]> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.PRIORITIZATION_PROMPT

    const userPrompt = `Prioriteer deze items:

${items.map((item, i) => `${i + 1}. [${item.type.toUpperCase()}] ${item.title}
   ${item.description || ''}
   ${item.score ? `Score: ${item.score}` : ''}
   ${item.deadline ? `Deadline: ${item.deadline}` : ''}`).join('\n\n')}

Geef je prioritering in JSON format.`

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { json: true, temperature: 0.3 })
      const parsed = JSON.parse(response)

      return (parsed.prioritized || []).map((p: any) => ({
        id: p.id || '',
        title: p.title || '',
        type: p.type || 'task',
        score: p.score || 50,
        urgency: p.urgency || 'medium',
        reason: p.reason || '',
        suggestedAction: p.suggestedAction,
        relatedItems: p.relatedItems
      }))
    } catch (error) {
      console.error('Prioritization error:', error)
      return items.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        score: item.score || 50,
        urgency: 'medium' as const,
        reason: 'Prioritization failed'
      }))
    }
  }

  // ============================================================
  // MUST-READ TOP 10
  // ============================================================

  /**
   * Generate automatic must-read top 10
   */
  async generateMustRead(articles: Array<{
    id: string
    title: string
    url: string
    source: string
    summary: string
    impact_score: number
    categories: string
    scan_id?: string
    published_at?: string
  }>): Promise<MustReadItem[]> {
    const context = await this.getContext()
    const systemPrompt = prompts.buildSystemPrompt(context) + '\n\n' + prompts.MUST_READ_PROMPT

    const userPrompt = `Selecteer de top 10 must-read artikelen uit deze ${articles.length} artikelen:

${articles.map((a, i) => `[${i + 1}] ID: ${a.id}
Titel: ${a.title}
URL: ${a.url}
Bron: ${a.source}
Impact: ${a.impact_score}/100
Categorieën: ${a.categories}
Samenvatting: ${a.summary}`).join('\n\n')}

Geef je selectie in JSON format.`

    try {
      const response = await this.llm.chat(systemPrompt, userPrompt, { 
        json: true, 
        temperature: 0.3,
        maxTokens: 2000
      })
      const parsed = JSON.parse(response)

      // Map back to full article data
      return (parsed.top10 || []).map((selection: any, index: number) => {
        const article = articles.find(a => a.id === selection.article_id)
        if (!article) return null

        return {
          id: `must-read-${Date.now()}-${index}`,
          article_id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          summary: article.summary,
          score: article.impact_score,
          rank: selection.rank || index + 1,
          provenance: {
            scan_id: article.scan_id,
            original_article_url: article.url
          },
          whyMustRead: selection.whyMustRead || '',
          suggestedActions: selection.suggestedActions || []
        }
      }).filter(Boolean) as MustReadItem[]
    } catch (error) {
      console.error('Must-read generation error:', error)
      // Fallback to top 10 by score
      return articles
        .sort((a, b) => b.impact_score - a.impact_score)
        .slice(0, 10)
        .map((article, index) => ({
          id: `must-read-${Date.now()}-${index}`,
          article_id: article.id,
          title: article.title,
          url: article.url,
          source: article.source,
          summary: article.summary,
          score: article.impact_score,
          rank: index + 1,
          provenance: {
            scan_id: article.scan_id,
            original_article_url: article.url
          },
          whyMustRead: 'Top by impact score',
          suggestedActions: []
        }))
    }
  }
}

// Export singleton for convenience
let _brain: ForeseenBrain | null = null

export function getForeseenBrain(userId: string = 'default'): ForeseenBrain {
  if (!_brain || _brain['userId'] !== userId) {
    _brain = new ForeseenBrain(userId)
  }
  return _brain
}

// Re-export types
export * from './types'
export { loadUserContext, clearContextCache } from './context'
