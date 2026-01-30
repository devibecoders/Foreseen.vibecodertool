/**
 * Lead Analyzer Module
 * 
 * Analyzes potential leads and generates:
 * - Website quality assessment
 * - Business fit score
 * - Personalized outreach drafts
 * 
 * All LLM calls are behind buttons (cost control)
 */

import { llmService } from './llm'

export interface WebsiteIssue {
  type: 'design' | 'performance' | 'mobile' | 'content' | 'seo' | 'conversion'
  severity: 'low' | 'medium' | 'high'
  description: string
  fix_suggestion: string
}

export interface LeadOpportunity {
  type: string
  potential_value: 'low' | 'medium' | 'high'
  description: string
  pitch_angle: string
}

export interface LeadAnalysis {
  quality_score: number
  website_issues: WebsiteIssue[]
  opportunities: LeadOpportunity[]
  fit_reasons: string[]
  outreach_email: string
  outreach_linkedin: string
}

const ANALYSIS_PROMPT = `You are a business development expert analyzing potential clients for a web development agency (Vibecoders).

Analyze this company and website for sales opportunities:

Company: {company_name}
Website: {website_url}
Industry: {industry}
Notes: {notes}

Evaluate:
1. Website quality issues (design, performance, mobile, content, SEO, conversion)
2. Business opportunities for Vibecoders
3. Fit as a potential client
4. Quality score (0-100)

Generate personalized outreach:
1. Cold email (short, specific, no spam)
2. LinkedIn DM (conversational, value-first)

Output JSON:
{
  "quality_score": 75,
  "website_issues": [
    {
      "type": "design|performance|mobile|content|seo|conversion",
      "severity": "low|medium|high",
      "description": "What's wrong",
      "fix_suggestion": "How to fix it"
    }
  ],
  "opportunities": [
    {
      "type": "Website Redesign|Performance Optimization|Mobile Optimization|etc",
      "potential_value": "low|medium|high",
      "description": "The opportunity",
      "pitch_angle": "How to position this"
    }
  ],
  "fit_reasons": ["Reason 1", "Reason 2"],
  "outreach_email": "Subject: ...\n\nHi [Name],\n\n...",
  "outreach_linkedin": "Hey [Name], ..."
}

Be specific. Reference actual issues you'd find. Make outreach personal, not generic.`

/**
 * Analyze a lead using LLM
 */
export async function analyzeLead(lead: {
  company_name: string
  website_url?: string
  industry?: string
  notes?: string
}): Promise<LeadAnalysis> {
  const prompt = ANALYSIS_PROMPT
    .replace('{company_name}', lead.company_name)
    .replace('{website_url}', lead.website_url || 'Not provided')
    .replace('{industry}', lead.industry || 'Unknown')
    .replace('{notes}', lead.notes || 'None')

  try {
    const response = await llmService.chat(
      'You are a business development expert. Output only valid JSON.',
      prompt,
      { json: true, temperature: 0.7 }
    )

    const parsed = JSON.parse(response)
    
    return {
      quality_score: Math.min(100, Math.max(0, parsed.quality_score || 50)),
      website_issues: parsed.website_issues || [],
      opportunities: parsed.opportunities || [],
      fit_reasons: parsed.fit_reasons || [],
      outreach_email: parsed.outreach_email || '',
      outreach_linkedin: parsed.outreach_linkedin || '',
    }
  } catch (error) {
    console.error('Lead analysis error:', error)
    
    // Return fallback
    return {
      quality_score: 50,
      website_issues: [],
      opportunities: [{
        type: 'General Consultation',
        potential_value: 'medium',
        description: 'Discuss potential improvements',
        pitch_angle: 'Offer a free website audit'
      }],
      fit_reasons: ['Unknown - analysis failed'],
      outreach_email: `Subject: Quick question about ${lead.company_name}\n\nHi,\n\nI came across ${lead.company_name} and had a quick question about your website.\n\nWould you be open to a brief chat?\n\nBest,\nSem`,
      outreach_linkedin: `Hey! I noticed ${lead.company_name} and wanted to reach out. Do you have a moment to chat about your website?`,
    }
  }
}

/**
 * Calculate quality score from manual inputs
 */
export function calculateQualityScore(factors: {
  hasWebsite: boolean
  websiteAge?: 'new' | 'old' | 'very-old'
  companySize?: 'small' | 'medium' | 'large'
  hasContactInfo: boolean
  industry?: string
  recentActivity?: boolean
}): number {
  let score = 50 // Base score

  // Website factors
  if (!factors.hasWebsite) score -= 20
  if (factors.websiteAge === 'very-old') score += 20
  if (factors.websiteAge === 'old') score += 10
  if (factors.websiteAge === 'new') score -= 10

  // Company factors
  if (factors.companySize === 'medium') score += 10
  if (factors.companySize === 'large') score += 5
  if (factors.companySize === 'small') score += 5

  // Contact factors
  if (factors.hasContactInfo) score += 15

  // Activity factors
  if (factors.recentActivity) score += 10

  return Math.min(100, Math.max(0, score))
}

/**
 * Generate quick outreach without full LLM analysis
 */
export function generateQuickOutreach(lead: {
  company_name: string
  contact_name?: string
  issue?: string
}): { email: string; linkedin: string } {
  const name = lead.contact_name || 'there'
  const issue = lead.issue || 'your website'

  return {
    email: `Subject: Quick observation about ${lead.company_name}

Hi ${name},

I was looking at ${lead.company_name} and noticed ${issue} could use some attention.

We specialize in helping companies like yours improve their digital presence — usually within 2-3 weeks.

Would it help if I showed you what an improvement could look like?

Best,
Sem
Vibecoders`,

    linkedin: `Hey ${name}! I came across ${lead.company_name} and noticed ${issue}. Curious — is that something you're looking to improve this quarter? Happy to share some quick ideas if helpful.`
  }
}

/**
 * Get priority based on score and status
 */
export function calculatePriority(
  score: number,
  status: string,
  followUpDate?: Date
): 'low' | 'medium' | 'high' | 'urgent' {
  // Urgent if follow-up is overdue
  if (followUpDate && new Date(followUpDate) < new Date()) {
    return 'urgent'
  }

  // High priority statuses
  if (['replied', 'meeting', 'proposal'].includes(status)) {
    return 'high'
  }

  // Score-based priority
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  return 'low'
}
