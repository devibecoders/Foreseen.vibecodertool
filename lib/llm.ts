import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export type LLMProvider = 'openai' | 'anthropic'

export interface LLMAnalysis {
  summary: string
  categories: string[]
  impactScore: number
  relevanceReason: string
  customerAngle: string
  vibecodersAngle: string
  keyTakeaways: string[]
}

const SYSTEM_PROMPT = `Je bent een AI-analist die nieuws evalueert voor Vibecoders, een team dat AI-gedreven ontwikkeltools bouwt en gebruikt.

Categorieën (kies 1-3):
- DEV_TOOLS: Ontwikkeltools, IDEs, code assistenten
- MODELS: Nieuwe AI modellen, capabilities, benchmarks
- AGENTS: Autonome agents, workflows, orchestratie
- PRODUCT: Product launches, features, platforms
- SECURITY: Security, privacy, safety
- PRICING: Pricing changes, costs, economics
- POLICY: Regelgeving, beleid, ethiek
- RESEARCH: Onderzoek, papers, technieken
- OTHER: Overig

ImpactScore rubric (0-100):
- 90-100: Game-changing voor vibecoding workflow
- 70-89: Significante impact op tools/proces
- 50-69: Relevant, interessant om te volgen
- 30-49: Marginaal relevant
- 0-29: Weinig relevant voor vibecoding

Geef antwoord in JSON format:
{
  "summary": "1-2 zinnen samenvatting",
  "categories": ["CATEGORY1", "CATEGORY2"],
  "impactScore": 75,
  "relevanceReason": "Waarom dit relevant is",
  "customerAngle": "Wat betekent dit voor klanten (use-cases/waarde)?",
  "vibecodersAngle": "Wat betekent dit voor Vibecoders (build & delivery)?",
  "keyTakeaways": ["Kernpunt 1", "Kernpunt 2", "Kernpunt 3", "Kernpunt 4", "Kernpunt 5"]
}

BELANGRIJK: keyTakeaways moet 5 concrete, actionable punten bevatten die je direct moet weten.`

export class LLMService {
  private provider: LLMProvider
  private openai?: OpenAI
  private anthropic?: Anthropic
  private model: string

  constructor() {
    this.provider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai'
    
    if (this.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    } else {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
      this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
    }
  }

  async analyzeArticle(title: string, url: string, content?: string): Promise<LLMAnalysis> {
    const userPrompt = `Analyseer dit AI-nieuws artikel:

Titel: ${title}
URL: ${url}
${content ? `Content: ${content.substring(0, 1000)}` : ''}

Geef je analyse in JSON format.`

    try {
      let response: string

      if (this.provider === 'openai' && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })
        response = completion.choices[0].message.content || '{}'
      } else if (this.provider === 'anthropic' && this.anthropic) {
        const completion = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 1024,
          messages: [
            { role: 'user', content: `${SYSTEM_PROMPT}\n\n${userPrompt}` }
          ],
          temperature: 0.3,
        })
        const content = completion.content[0]
        response = content.type === 'text' ? content.text : '{}'
      } else {
        throw new Error('No LLM provider configured')
      }

      const parsed = JSON.parse(response)
      
      return {
        summary: parsed.summary || '',
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        impactScore: typeof parsed.impactScore === 'number' ? parsed.impactScore : 50,
        relevanceReason: parsed.relevanceReason || '',
        customerAngle: parsed.customerAngle || '',
        vibecodersAngle: parsed.vibecodersAngle || '',
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      }
    } catch (error) {
      console.error('LLM analysis error:', error)
      return {
        summary: 'Error analyzing article',
        categories: ['OTHER'],
        impactScore: 0,
        relevanceReason: 'Analysis failed',
        customerAngle: 'Unknown',
        vibecodersAngle: 'Unknown',
        keyTakeaways: [],
      }
    }
  }
}

  /**
   * Generic chat method for flexible LLM interactions
   */
  async chat(
    systemPrompt: string, 
    userPrompt: string, 
    options?: { json?: boolean; temperature?: number }
  ): Promise<string> {
    const temperature = options?.temperature ?? 0.3

    try {
      let response: string

      if (this.provider === 'openai' && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          ...(options?.json ? { response_format: { type: 'json_object' as const } } : {}),
          temperature,
        })
        response = completion.choices[0].message.content || ''
      } else if (this.provider === 'anthropic' && this.anthropic) {
        const completion = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 2048,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
          ],
          temperature,
        })
        const content = completion.content[0]
        response = content.type === 'text' ? content.text : ''
      } else {
        throw new Error('No LLM provider configured')
      }

      // If JSON expected, try to extract it
      if (options?.json && response) {
        // Find JSON object in response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          response = jsonMatch[0]
        }
      }

      return response
    } catch (error) {
      console.error('LLM chat error:', error)
      throw error
    }
  }
}

export const llmService = new LLMService()
