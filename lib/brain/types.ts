/**
 * Foreseen Brain Types
 * 
 * Shared types for the unified AI intelligence layer.
 * All AI operations share these common types.
 */

// ============================================================
// USER CONTEXT
// ============================================================

export interface UserSignal {
  feature_key: string
  weight: number
  state: 'active' | 'muted' | 'default'
  feature_type: 'context' | 'concept' | 'entity' | 'tool' | 'category'
  updated_at?: string
}

export interface Decision {
  id: string
  article_id: string
  article_title?: string
  action: 'accept' | 'reject' | 'skip' | 'save'
  reason?: string
  created_at: string
}

export interface UserContext {
  userId: string
  signals: UserSignal[]
  recentDecisions: Decision[]
  preferences: Record<string, any>
  loadedAt: Date
}

// ============================================================
// ARTICLE ANALYSIS
// ============================================================

export interface ArticleInput {
  title: string
  url: string
  content?: string
  source?: string
  published_at?: string
}

export interface ArticleAnalysis {
  summary: string
  categories: string[]
  impactScore: number
  relevanceReason: string
  customerAngle: string
  vibecodersAngle: string
  keyTakeaways: string[]
  signals?: ExtractedSignals
}

export interface ExtractedSignals {
  entities: string[]
  concepts: string[]
  tools: string[]
  contexts: string[]
  categories: string[]
  allKeys: string[]
}

// ============================================================
// LEAD ANALYSIS  
// ============================================================

export interface LeadInput {
  company_name: string
  website_url?: string
  industry?: string
  company_size?: 'small' | 'medium' | 'large' | 'startup'
  notes?: string
  source_type?: 'manual' | 'ai_generated'
}

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
  fit_score: number
  website_issues: WebsiteIssue[]
  opportunities: LeadOpportunity[]
  fit_reasons: string[]
  pain_points: string[]
  outreach_email: string
  outreach_linkedin: string
  recommended_approach: string
  estimated_project_value: string
}

// ============================================================
// PROJECT INTELLIGENCE (merged from Briefing)
// ============================================================

export interface ProjectInput {
  name: string
  description?: string
  briefing_text?: string
  client_name?: string
  budget?: string
  deadline?: string
}

export interface ProjectIntelligence {
  oneLiner: string
  painPoints: Array<{
    id: string
    title: string
    description: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    affectedArea: string
  }>
  mustHaves: Array<{
    id: string
    requirement: string
    rationale: string
    category: 'functional' | 'technical' | 'business' | 'design'
    priority: number
  }>
  questions: Array<{
    id: string
    question: string
    context: string
    importance: 'blocking' | 'important' | 'nice-to-know'
    suggestedDefault?: string
  }>
  assumptions: string[]
  outOfScope: string[]
  risks: Array<{
    id: string
    risk: string
    impact: 'low' | 'medium' | 'high'
    likelihood: 'low' | 'medium' | 'high'
    mitigation: string
  }>
  suggestedTasks: Array<{
    title: string
    description: string
    estimate: string
    priority: number
  }>
  timeline?: string
  budget?: string
  stakeholders: string[]
  successCriteria: string[]
}

// ============================================================
// CONTENT GENERATION
// ============================================================

export interface ContentInput {
  type: 'linkedin' | 'twitter' | 'blog'
  topic?: string
  articles?: Array<{ title: string; summary: string }>
  trends?: Array<{ topic: string; count: number; avgImpact: number }>
  tone?: 'professional' | 'casual' | 'provocative'
}

export interface GeneratedContent {
  id: string
  content: string
  hook?: string
  body?: string
  callToAction?: string
  hashtags: string[]
  contentType: string
  basedOn: string[]
  characterCount: number
  engagementScore?: number
}

// ============================================================
// SYNTHESIS & PRIORITIZATION
// ============================================================

export interface SynthesisInput {
  articles: Array<{
    title: string
    url: string
    source: string
    summary: string
    impact_score: number
    categories: string
    customer_angle?: string
    vibecoders_angle?: string
    key_takeaways?: string[]
  }>
  startDate: Date
  endDate: Date
}

export interface WeeklySynthesis {
  weekLabel: string
  title: string
  executiveSummary: string[]
  macroTrends: Array<{
    trend: string
    whatHappened: string
    whyItMatters: string
    evidence: Array<{ title: string; url: string; source: string }>
  }>
  implications: Array<{
    action: string
    effort: 'S' | 'M' | 'L'
    impact: 'Low' | 'Med' | 'High'
    rationale: string
    nextStep: string
  }>
  clientOpportunities: Array<{
    opportunity: string
    targetClients: string
    pitchAngle: string
    suggestedDeliverable: string
    expectedValue: string
  }>
  ignoreList: Array<{ topic: string; whyIgnore: string }>
  readingList: Array<{
    title: string
    url: string
    source: string
    score: number
    why: string
  }>
}

export interface PrioritizedItem {
  id: string
  title: string
  type: 'article' | 'lead' | 'project' | 'task'
  score: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  reason: string
  suggestedAction?: string
  relatedItems?: string[]
}

// ============================================================
// TOP 10 (MUST-READ)
// ============================================================

export interface MustReadItem {
  id: string
  article_id: string
  title: string
  url: string
  source: string
  summary: string
  score: number
  rank: number
  provenance: {
    scan_id?: string
    scan_date?: string
    original_article_url: string
  }
  whyMustRead: string
  suggestedActions: string[]
  relatedDecisions?: Decision[]
}

// ============================================================
// BATCH GENERATION (AI Sourcing)
// ============================================================

export type BatchType = 'small' | 'medium' | 'startup'

export interface BatchRequest {
  type: BatchType
  count: number
  industry?: string
  region?: string
}

export interface GeneratedProspect {
  company_name: string
  website_url?: string
  industry: string
  company_size: 'small' | 'medium' | 'large' | 'startup'
  description: string
  why_target: string
  estimated_project_value: string
  suggested_approach: string
  confidence_score: number
}

export interface BatchResult {
  batch_id: string
  type: BatchType
  prospects: GeneratedProspect[]
  generated_at: Date
  total_requested: number
  total_generated: number
}
