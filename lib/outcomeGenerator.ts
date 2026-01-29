/**
 * Outcome Generator Module
 * 
 * Generates actionable outputs from articles:
 * - INTEGRATE → Implementation checklist
 * - MONITOR → Follow-up reminder
 * - EXPERIMENT → Spike plan
 * 
 * Uses LLM for generation (behind button click)
 */

import { llmService } from './llm'

export type OutcomeType = 'checklist' | 'reminder' | 'spike'

export interface ChecklistItem {
  step: number
  title: string
  description: string
  estimated_time?: string
  priority: 'high' | 'medium' | 'low'
}

export interface ChecklistOutcome {
  type: 'checklist'
  title: string
  objective: string
  items: ChecklistItem[]
  prerequisites: string[]
  estimated_total_time: string
  success_criteria: string
}

export interface ReminderOutcome {
  type: 'reminder'
  title: string
  check_date: string  // ISO date or "in X weeks" format
  what_to_check: string[]
  trigger_signals: string[]  // What changes would make this actionable
  current_status: string
}

export interface SpikeOutcome {
  type: 'spike'
  title: string
  hypothesis: string
  timebox: string  // e.g., "4 hours", "1 day"
  steps: string[]
  success_metrics: string[]
  abort_criteria: string[]
  resources_needed: string[]
}

export type GeneratedOutcome = ChecklistOutcome | ReminderOutcome | SpikeOutcome

// System prompts for each outcome type
const PROMPTS = {
  checklist: `You are an expert at turning tech news into actionable implementation plans.

Given an article about a new tool, release, or technique, generate a practical implementation checklist.

Output JSON with this exact structure:
{
  "type": "checklist",
  "title": "Short action title",
  "objective": "What we're trying to achieve",
  "items": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed instructions",
      "estimated_time": "30 mins",
      "priority": "high|medium|low"
    }
  ],
  "prerequisites": ["List of things needed before starting"],
  "estimated_total_time": "2-4 hours",
  "success_criteria": "How to know when done successfully"
}

Keep it practical, specific, and actionable. Maximum 6 steps.`,

  reminder: `You are an expert at identifying when tech trends need follow-up monitoring.

Given an article about something not yet ready for adoption, generate a monitoring reminder.

Output JSON with this exact structure:
{
  "type": "reminder",
  "title": "Short reminder title",
  "check_date": "in 4 weeks",
  "what_to_check": ["Specific things to verify on the check date"],
  "trigger_signals": ["What changes would make this actionable now"],
  "current_status": "Brief summary of current state and why we're waiting"
}

Focus on specific, measurable triggers. Maximum 4 items per list.`,

  spike: `You are an expert at designing technical spikes and experiments.

Given an article about something worth testing, generate a time-boxed spike plan.

Output JSON with this exact structure:
{
  "type": "spike",
  "title": "Short spike title",
  "hypothesis": "What we're trying to learn/validate",
  "timebox": "4 hours",
  "steps": ["Step 1", "Step 2", ...],
  "success_metrics": ["How to measure if the spike succeeded"],
  "abort_criteria": ["When to stop early if it's not working"],
  "resources_needed": ["Tools, accounts, data needed"]
}

Keep the timebox realistic (2-8 hours). Maximum 5 steps. Focus on learning, not building.`
}

/**
 * Generate an outcome from an article
 */
export async function generateOutcome(
  outcomeType: OutcomeType,
  article: {
    title: string
    summary: string
    url: string
    vibecoders_angle?: string
    key_takeaways?: string
  }
): Promise<GeneratedOutcome> {
  const systemPrompt = PROMPTS[outcomeType]
  
  const userPrompt = `Generate a ${outcomeType} for this article:

Title: ${article.title}

Summary: ${article.summary}

${article.vibecoders_angle ? `Vibecoders Angle: ${article.vibecoders_angle}` : ''}

${article.key_takeaways ? `Key Takeaways: ${article.key_takeaways}` : ''}

URL: ${article.url}

Generate the JSON output:`

  try {
    const response = await llmService.chat(systemPrompt, userPrompt, { json: true })
    
    // Parse the JSON response
    const parsed = JSON.parse(response)
    
    // Validate structure
    if (parsed.type !== outcomeType) {
      parsed.type = outcomeType
    }
    
    return parsed as GeneratedOutcome
  } catch (error) {
    console.error('Outcome generation error:', error)
    
    // Return a fallback structure
    if (outcomeType === 'checklist') {
      return {
        type: 'checklist',
        title: `Implement: ${article.title.substring(0, 50)}`,
        objective: 'Follow up on this article',
        items: [
          {
            step: 1,
            title: 'Read the full article',
            description: `Visit ${article.url} and take notes`,
            estimated_time: '15 mins',
            priority: 'high'
          },
          {
            step: 2,
            title: 'Identify key actions',
            description: 'List specific steps relevant to your project',
            estimated_time: '10 mins',
            priority: 'high'
          }
        ],
        prerequisites: [],
        estimated_total_time: '30 mins',
        success_criteria: 'Have a clear understanding of how to apply this'
      }
    } else if (outcomeType === 'reminder') {
      return {
        type: 'reminder',
        title: `Monitor: ${article.title.substring(0, 50)}`,
        check_date: 'in 2 weeks',
        what_to_check: ['Check for updates on this topic', 'Look for user feedback and experiences'],
        trigger_signals: ['GA release announced', 'Major adoption by similar companies'],
        current_status: 'Monitoring for further developments'
      }
    } else {
      return {
        type: 'spike',
        title: `Spike: ${article.title.substring(0, 50)}`,
        hypothesis: 'Determine if this approach works for our use case',
        timebox: '4 hours',
        steps: ['Read documentation', 'Set up minimal test', 'Document findings'],
        success_metrics: ['Successfully completed a basic implementation'],
        abort_criteria: ['Requires dependencies we cannot add'],
        resources_needed: ['Development environment', 'Test data']
      }
    }
  }
}

/**
 * Format outcome for display as markdown
 */
export function formatOutcomeMarkdown(outcome: GeneratedOutcome): string {
  if (outcome.type === 'checklist') {
    let md = `# ${outcome.title}\n\n`
    md += `**Objective:** ${outcome.objective}\n\n`
    
    if (outcome.prerequisites.length > 0) {
      md += `## Prerequisites\n`
      outcome.prerequisites.forEach(p => { md += `- ${p}\n` })
      md += '\n'
    }
    
    md += `## Steps\n\n`
    outcome.items.forEach(item => {
      const priorityEmoji = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'
      md += `### ${item.step}. ${item.title} ${priorityEmoji}\n`
      md += `${item.description}\n`
      if (item.estimated_time) md += `*Estimated: ${item.estimated_time}*\n`
      md += '\n'
    })
    
    md += `---\n`
    md += `**Total time:** ${outcome.estimated_total_time}\n`
    md += `**Done when:** ${outcome.success_criteria}\n`
    
    return md
  }
  
  if (outcome.type === 'reminder') {
    let md = `# ${outcome.title}\n\n`
    md += `**Check:** ${outcome.check_date}\n\n`
    md += `**Current Status:** ${outcome.current_status}\n\n`
    
    md += `## What to Check\n`
    outcome.what_to_check.forEach(item => { md += `- [ ] ${item}\n` })
    
    md += `\n## Trigger Signals\n`
    md += `When any of these happen, it's time to act:\n`
    outcome.trigger_signals.forEach(item => { md += `- ${item}\n` })
    
    return md
  }
  
  if (outcome.type === 'spike') {
    let md = `# ${outcome.title}\n\n`
    md += `**Hypothesis:** ${outcome.hypothesis}\n\n`
    md += `**Timebox:** ${outcome.timebox}\n\n`
    
    md += `## Steps\n`
    outcome.steps.forEach((step, i) => { md += `${i + 1}. ${step}\n` })
    
    md += `\n## Success Metrics\n`
    outcome.success_metrics.forEach(item => { md += `- ${item}\n` })
    
    md += `\n## Abort Criteria\n`
    md += `Stop early if:\n`
    outcome.abort_criteria.forEach(item => { md += `- ${item}\n` })
    
    if (outcome.resources_needed.length > 0) {
      md += `\n## Resources Needed\n`
      outcome.resources_needed.forEach(item => { md += `- ${item}\n` })
    }
    
    return md
  }
  
  return ''
}
