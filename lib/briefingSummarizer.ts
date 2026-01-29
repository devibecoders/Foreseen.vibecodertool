/**
 * Briefing Summarizer Module
 * 
 * Extracts structured insights from project briefings:
 * - Pain points (problems to solve)
 * - Must-haves (non-negotiable requirements)
 * - Questions to ask (clarifications needed)
 */

import { llmService } from './llm'

export interface PainPoint {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  affectedArea: string  // e.g., "User Experience", "Performance", "Business"
}

export interface MustHave {
  id: string
  requirement: string
  rationale: string
  category: 'functional' | 'technical' | 'business' | 'design'
  priority: number  // 1-5, 1 being highest
}

export interface ClarificationQuestion {
  id: string
  question: string
  context: string
  importance: 'blocking' | 'important' | 'nice-to-know'
  suggestedDefault?: string
}

export interface BriefingSummary {
  projectName: string
  oneLiner: string
  painPoints: PainPoint[]
  mustHaves: MustHave[]
  questions: ClarificationQuestion[]
  assumptions: string[]
  outOfScope: string[]
  timeline?: string
  budget?: string
  stakeholders: string[]
  successCriteria: string[]
}

const BRIEFING_SYSTEM_PROMPT = `You are an expert project analyst who extracts structured insights from project briefings.

Analyze the briefing and output JSON with this exact structure:
{
  "projectName": "Short project name",
  "oneLiner": "One sentence describing the project",
  "painPoints": [
    {
      "title": "Short pain point title",
      "description": "Detailed description",
      "severity": "critical|high|medium|low",
      "affectedArea": "User Experience|Performance|Business|Technical|Security|etc"
    }
  ],
  "mustHaves": [
    {
      "requirement": "What must be delivered",
      "rationale": "Why this is non-negotiable",
      "category": "functional|technical|business|design",
      "priority": 1
    }
  ],
  "questions": [
    {
      "question": "What needs clarification?",
      "context": "Why this matters",
      "importance": "blocking|important|nice-to-know",
      "suggestedDefault": "What to assume if not answered"
    }
  ],
  "assumptions": ["Things assumed to be true"],
  "outOfScope": ["Things explicitly not included"],
  "timeline": "Mentioned timeline or null",
  "budget": "Mentioned budget or null",
  "stakeholders": ["Key people/roles mentioned"],
  "successCriteria": ["How success will be measured"]
}

Guidelines:
- Extract 3-7 pain points, prioritized by severity
- Extract 5-10 must-haves, numbered by priority (1 = highest)
- Generate 3-5 clarifying questions that could unblock work
- Be specific and actionable
- If something is vague in the briefing, add it as a question
- Include reasonable assumptions when info is missing`

/**
 * Summarize a project briefing
 */
export async function summarizeBriefing(
  briefingText: string,
  projectContext?: string
): Promise<BriefingSummary> {
  const userPrompt = `Analyze this project briefing and extract structured insights:

${projectContext ? `CONTEXT: ${projectContext}\n\n` : ''}BRIEFING:
${briefingText}

Generate the JSON analysis:`

  try {
    const response = await llmService.chat(BRIEFING_SYSTEM_PROMPT, userPrompt, {
      json: true,
      temperature: 0.3
    })
    
    const parsed = JSON.parse(response)
    
    // Add IDs to items
    const summary: BriefingSummary = {
      projectName: parsed.projectName || 'Untitled Project',
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
      timeline: parsed.timeline || undefined,
      budget: parsed.budget || undefined,
      stakeholders: parsed.stakeholders || [],
      successCriteria: parsed.successCriteria || []
    }
    
    return summary
  } catch (error) {
    console.error('Briefing summarization error:', error)
    throw new Error('Failed to summarize briefing')
  }
}

/**
 * Format summary as markdown for export
 */
export function formatSummaryAsMarkdown(summary: BriefingSummary): string {
  let md = `# ${summary.projectName}\n\n`
  md += `> ${summary.oneLiner}\n\n`
  
  // Pain Points
  md += `## 🔥 Pain Points\n\n`
  for (const pain of summary.painPoints) {
    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    }[pain.severity]
    md += `### ${severityEmoji} ${pain.title}\n`
    md += `${pain.description}\n`
    md += `*Area: ${pain.affectedArea}*\n\n`
  }
  
  // Must-Haves
  md += `## ✅ Must-Haves\n\n`
  for (const must of summary.mustHaves) {
    md += `${must.priority}. **${must.requirement}**\n`
    md += `   *${must.rationale}*\n`
    md += `   Category: ${must.category}\n\n`
  }
  
  // Questions
  md += `## ❓ Questions to Clarify\n\n`
  for (const q of summary.questions) {
    const importanceIcon = {
      blocking: '🚫',
      important: '⚠️',
      'nice-to-know': '💡'
    }[q.importance]
    md += `### ${importanceIcon} ${q.question}\n`
    md += `${q.context}\n`
    if (q.suggestedDefault) {
      md += `*Default assumption: ${q.suggestedDefault}*\n`
    }
    md += '\n'
  }
  
  // Assumptions
  if (summary.assumptions.length > 0) {
    md += `## 📋 Assumptions\n\n`
    summary.assumptions.forEach(a => { md += `- ${a}\n` })
    md += '\n'
  }
  
  // Out of Scope
  if (summary.outOfScope.length > 0) {
    md += `## 🚫 Out of Scope\n\n`
    summary.outOfScope.forEach(o => { md += `- ${o}\n` })
    md += '\n'
  }
  
  // Meta
  md += `---\n\n`
  if (summary.timeline) md += `**Timeline:** ${summary.timeline}\n`
  if (summary.budget) md += `**Budget:** ${summary.budget}\n`
  if (summary.stakeholders.length > 0) {
    md += `**Stakeholders:** ${summary.stakeholders.join(', ')}\n`
  }
  
  // Success Criteria
  if (summary.successCriteria.length > 0) {
    md += `\n## 🎯 Success Criteria\n\n`
    summary.successCriteria.forEach(s => { md += `- ${s}\n` })
  }
  
  return md
}

/**
 * Extract quick stats from a summary
 */
export function getSummaryStats(summary: BriefingSummary): {
  criticalPainPoints: number
  totalMustHaves: number
  blockingQuestions: number
  hasTimeline: boolean
  hasBudget: boolean
} {
  return {
    criticalPainPoints: summary.painPoints.filter(p => p.severity === 'critical').length,
    totalMustHaves: summary.mustHaves.length,
    blockingQuestions: summary.questions.filter(q => q.importance === 'blocking').length,
    hasTimeline: !!summary.timeline,
    hasBudget: !!summary.budget
  }
}
