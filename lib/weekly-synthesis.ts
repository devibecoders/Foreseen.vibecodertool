import { llmService } from './llm'
import { supabaseAdmin } from './supabase/server'

export interface MacroTrend {
  trend: string
  what_happened: string
  why_it_matters: string
  evidence: Array<{ title: string; url: string; source: string }>
}

export interface ImplicationAction {
  action: string
  effort: 'S' | 'M' | 'L'
  impact: 'Low' | 'Med' | 'High'
  rationale: string
  next_step: string
}

export interface ClientOpportunity {
  opportunity: string
  target_clients: string
  pitch_angle: string
  suggested_deliverable: string
  expected_value: string
}

export interface IgnoreItem {
  topic: string
  why_ignore: string
}

export interface ReadingItem {
  title: string
  url: string
  source: string
  score: number
  why: string
}

export interface WeeklySynthesis {
  week_label: string
  title: string
  executive_summary: string[]
  macro_trends: MacroTrend[]
  implications_vibecoding: ImplicationAction[]
  client_opportunities: ClientOpportunity[]
  ignore_list: IgnoreItem[]
  reading_list: ReadingItem[]
  full_markdown: string
}

const SYNTHESIS_SYSTEM_PROMPT = `Je bent een senior AI strategist die wekelijkse synthese rapporten maakt voor Vibecoders, een team dat AI-gedreven ontwikkeltools bouwt en gebruikt.

Je taak is om 25-40 AI nieuws artikelen te analyseren en te consolideren in een compact, actionable rapport van 3-5 pagina's (1200-2200 woorden).

CRUCIALE REGELS:
1. Wees COMPACT - max 3-5 pagina's, geen uitweidingen
2. Identificeer 3-5 MACRO TRENDS (niet 20 kleine dingen)
3. Geef CONCRETE acties met effort (S/M/L) en impact (Low/Med/High)
4. Onderscheid tussen:
   - Implications for Vibecoding (build & delivery)
   - Client Opportunities (sales/use-cases)
   - Ignore list (hype/ruis)
5. Refereer naar bronnen met [Article Title](url)
6. Wees kritisch: niet alles is belangrijk

OUTPUT FORMAT (exact deze structuur):
{
  "week_label": "2026-W01",
  "title": "Foreseen Weekly Synthesis — 2026 W01",
  "executive_summary": ["bullet 1", "bullet 2", ...], // 5-8 bullets
  "macro_trends": [
    {
      "trend": "Trend naam",
      "what_happened": "Wat er gebeurde",
      "why_it_matters": "Waarom belangrijk",
      "evidence": [{"title": "...", "url": "...", "source": "..."}]
    }
  ], // 3-5 trends
  "implications_vibecoding": [
    {
      "action": "Concrete actie",
      "effort": "S|M|L",
      "impact": "Low|Med|High",
      "rationale": "Waarom dit doen",
      "next_step": "Eerste stap"
    }
  ], // 5-8 acties
  "client_opportunities": [
    {
      "opportunity": "Kans beschrijving",
      "target_clients": "Wie",
      "pitch_angle": "Hoe pitchen",
      "suggested_deliverable": "MVP voorstel",
      "expected_value": "Verwachte waarde"
    }
  ], // 3-6 kansen
  "ignore_list": [
    {
      "topic": "Onderwerp",
      "why_ignore": "Waarom negeren"
    }
  ], // 5-10 items
  "reading_list": [
    {
      "title": "Article title",
      "url": "https://...",
      "source": "Source name",
      "score": 85,
      "why": "Waarom lezen"
    }
  ] // top 10
}

Geef ALLEEN valid JSON terug, geen extra tekst.`

export class WeeklySynthesisService {
  async generateSynthesis(
    startDate: Date,
    endDate: Date,
    maxArticles: number = 40,
    scanId?: string
  ): Promise<WeeklySynthesis> {
    // 1. Select articles (by scan_id if provided, otherwise by date range)
    const articles = await this.selectArticles(startDate, endDate, maxArticles, scanId)

    if (articles.length === 0) {
      throw new Error('No articles found for the specified date range')
    }

    // 2. Prepare context for LLM
    const context = this.prepareContext(articles, startDate, endDate)

    // 3. Call LLM for synthesis
    const synthesis = await this.callLLMForSynthesis(context)

    // 4. Generate full markdown
    const fullMarkdown = this.generateMarkdown(synthesis)

    return {
      ...synthesis,
      full_markdown: fullMarkdown
    }
  }

  private async selectArticles(startDate: Date, endDate: Date, maxArticles: number, scanId?: string) {
    const supabase = supabaseAdmin()

    // Build query - use scan_id if provided, otherwise fall back to date range
    let query = supabase
      .from('articles')
      .select(`
        *,
        analyses (*)
      `)

    if (scanId) {
      // Mode: From Scan - get articles linked to this specific scan
      console.log(`[WeeklySynthesis] Selecting articles from scan: ${scanId}`)
      query = query.eq('scan_id', scanId)
    } else {
      // Mode: Date range - get articles by published_at
      console.log(`[WeeklySynthesis] Selecting articles by date range: ${startDate.toISOString()} - ${endDate.toISOString()}`)
      query = query
        .gte('published_at', startDate.toISOString())
        .lte('published_at', endDate.toISOString())
    }

    const { data: articles, error } = await query
      .order('published_at', { ascending: false })
      .limit(maxArticles)

    if (error) throw new Error(`Failed to fetch articles: ${error.message}`)

    // Filter to only articles with analysis and sort by impact score
    const filtered = (articles || [])
      .filter((a: any) => a.analyses && a.analyses.length > 0)
      .sort((a: any, b: any) => (b.analyses[0]?.impact_score || 0) - (a.analyses[0]?.impact_score || 0))

    console.log(`[WeeklySynthesis] Found ${articles?.length || 0} articles, ${filtered.length} with analyses`)
    return filtered
  }

  private prepareContext(articles: any[], startDate: Date, endDate: Date): string {
    const weekLabel = this.getWeekLabel(startDate)

    let context = `Week: ${weekLabel}\n`
    context += `Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}\n`
    context += `Total articles: ${articles.length}\n\n`
    context += `ARTICLES TO ANALYZE:\n\n`

    articles.forEach((article, idx) => {
      const analysis = article.analyses[0]
      context += `[${idx + 1}] ${article.title}\n`
      context += `Source: ${article.source}\n`
      context += `URL: ${article.url}\n`
      context += `Impact Score: ${analysis.impact_score}/100\n`
      context += `Categories: ${analysis.categories}\n`
      context += `Summary: ${analysis.summary}\n`
      context += `For Vibecoders: ${analysis.vibecoders_angle}\n`
      context += `For Clients: ${analysis.customer_angle}\n`

      if (analysis.key_takeaways) {
        const takeaways = analysis.key_takeaways.split('|||').filter(Boolean)
        if (takeaways.length > 0) {
          context += `Key Points:\n`
          takeaways.forEach((t: string) => context += `  - ${t}\n`)
        }
      }
      context += `\n`
    })

    return context
  }

  private async callLLMForSynthesis(context: string): Promise<Omit<WeeklySynthesis, 'full_markdown'>> {
    const provider = process.env.LLM_PROVIDER || 'openai'
    const model = provider === 'openai'
      ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
      : (process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022')

    let response: string

    if (provider === 'openai') {
      const OpenAI = (await import('openai')).default
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYNTHESIS_SYSTEM_PROMPT },
          { role: 'user', content: context }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })

      response = completion.choices[0].message.content || ''
    } else {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const message = await client.messages.create({
        model,
        max_tokens: 4000,
        temperature: 0.7,
        system: SYNTHESIS_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: context }
        ]
      })

      response = message.content[0].type === 'text' ? message.content[0].text : ''
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from LLM response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed
  }

  private generateMarkdown(synthesis: Omit<WeeklySynthesis, 'full_markdown'>): string {
    let md = `# ${synthesis.title}\n\n`

    // Executive Summary
    md += `## Executive Summary\n\n`
    synthesis.executive_summary.forEach(bullet => {
      md += `- ${bullet}\n`
    })
    md += `\n`

    // Macro Trends
    md += `## Macro Trends\n\n`
    synthesis.macro_trends.forEach((trend, idx) => {
      md += `### ${idx + 1}. ${trend.trend}\n\n`
      md += `**What Happened:** ${trend.what_happened}\n\n`
      md += `**Why It Matters:** ${trend.why_it_matters}\n\n`
      md += `**Evidence:**\n`
      trend.evidence.forEach(ev => {
        md += `- [${ev.title}](${ev.url}) (${ev.source})\n`
      })
      md += `\n`
    })

    // Implications for Vibecoding
    md += `## Implications for Vibecoding (Build & Delivery)\n\n`
    md += `| Action | Effort | Impact | Rationale | Next Step |\n`
    md += `|--------|--------|--------|-----------|----------|\n`
    synthesis.implications_vibecoding.forEach(impl => {
      md += `| ${impl.action} | ${impl.effort} | ${impl.impact} | ${impl.rationale} | ${impl.next_step} |\n`
    })
    md += `\n`

    // Client Opportunities
    md += `## Client Opportunities\n\n`
    synthesis.client_opportunities.forEach((opp, idx) => {
      md += `### ${idx + 1}. ${opp.opportunity}\n\n`
      md += `**Target Clients:** ${opp.target_clients}\n\n`
      md += `**Pitch Angle:** ${opp.pitch_angle}\n\n`
      md += `**Suggested Deliverable:** ${opp.suggested_deliverable}\n\n`
      md += `**Expected Value:** ${opp.expected_value}\n\n`
    })

    // Ignore List
    md += `## Ignore List\n\n`
    synthesis.ignore_list.forEach(item => {
      md += `- **${item.topic}**: ${item.why_ignore}\n`
    })
    md += `\n`

    // Top Reading List
    md += `## Top Reading List\n\n`
    synthesis.reading_list.forEach((item, idx) => {
      md += `${idx + 1}. [${item.title}](${item.url}) (${item.source}) - Score: ${item.score}/100\n`
      md += `   *${item.why}*\n\n`
    })

    return md
  }

  private getWeekLabel(date: Date): string {
    const year = date.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }
}

export const weeklySynthesisService = new WeeklySynthesisService()
