/**
 * Foreseen Brain Prompts
 * 
 * Unified prompt templates for all AI operations.
 * All prompts share the same base context and personality.
 */

import type { UserContext } from './types'
import { formatContextForPrompt } from './context'

// ============================================================
// BASE CONTEXT
// ============================================================

const VIBECODERS_CONTEXT = `Je bent een AI-analist voor Vibecoders, een Nederlands team dat AI-gedreven webontwikkeling doet.

OVER VIBECODERS:
- Specialisatie: AI-first development, snelle prototypes, moderne web apps
- Stack: Next.js, React, TypeScript, Supabase, AI integrations
- Klanten: MKB, startups, scale-ups die snel willen innoveren
- Waardepropositie: "Vibecoding" - ontwikkeling door samenwerking met AI

DOEL VAN FORESEEN:
Foreseen is het intelligence platform dat Vibecoders helpt om:
1. Relevante AI/tech trends te identificeren
2. Business kansen te ontdekken
3. Risico's te detecteren
4. Content te genereren
5. Prioriteiten te bepalen`

/**
 * Build base system prompt with user context
 */
export function buildSystemPrompt(context?: UserContext): string {
  let prompt = VIBECODERS_CONTEXT

  if (context) {
    const contextSummary = formatContextForPrompt(context)
    if (contextSummary) {
      prompt += `\n\nUSER CONTEXT:\n${contextSummary}`
    }
  }

  return prompt
}

// ============================================================
// ARTICLE ANALYSIS
// ============================================================

export const ARTICLE_ANALYSIS_PROMPT = `Analyseer dit artikel voor relevantie en impact.

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

Output JSON:
{
  "summary": "1-2 zinnen samenvatting",
  "categories": ["CATEGORY1", "CATEGORY2"],
  "impactScore": 75,
  "relevanceReason": "Waarom dit relevant is",
  "customerAngle": "Wat betekent dit voor klanten?",
  "vibecodersAngle": "Wat betekent dit voor Vibecoders?",
  "keyTakeaways": ["Kernpunt 1", "Kernpunt 2", "Kernpunt 3", "Kernpunt 4", "Kernpunt 5"]
}`

// ============================================================
// LEAD ANALYSIS
// ============================================================

export const LEAD_ANALYSIS_PROMPT = `Analyseer deze potentiële klant voor Vibecoders.

Evalueer:
1. Website kwaliteit en issues (design, performance, mobile, SEO)
2. Business fit met Vibecoders services
3. Kansen en pijnpunten
4. Geschatte projectwaarde

Genereer:
1. Koude email (kort, specifiek, geen spam)
2. LinkedIn DM (conversationeel, waarde-eerst)
3. Aanbevolen aanpak

Output JSON:
{
  "quality_score": 75,
  "fit_score": 80,
  "website_issues": [
    {
      "type": "design|performance|mobile|content|seo|conversion",
      "severity": "low|medium|high",
      "description": "Wat is er mis",
      "fix_suggestion": "Hoe op te lossen"
    }
  ],
  "opportunities": [
    {
      "type": "Website Redesign|Performance|Mobile|AI Integration|etc",
      "potential_value": "low|medium|high",
      "description": "De kans",
      "pitch_angle": "Hoe te positioneren"
    }
  ],
  "pain_points": ["Pijnpunt 1", "Pijnpunt 2"],
  "fit_reasons": ["Reden 1", "Reden 2"],
  "outreach_email": "Subject: ...\\n\\nHi [Name],\\n\\n...",
  "outreach_linkedin": "Hey [Name], ...",
  "recommended_approach": "Beste aanpak voor deze lead",
  "estimated_project_value": "€X-Y"
}

Wees specifiek. Refereer naar echte issues. Maak outreach persoonlijk.`

// ============================================================
// LEAD BATCH GENERATION (AI SOURCING)
// ============================================================

export function buildLeadBatchPrompt(type: string, count: number, industry?: string): string {
  const typeDescriptions: Record<string, string> = {
    small: 'Kleine bedrijven (5-20 medewerkers) die een website update nodig hebben. Budget: €1-3K',
    medium: 'Middelgrote bedrijven (20-100 medewerkers) die digitale transformatie nodig hebben. Budget: €3-10K',
    startup: 'Tech startups die snel moeten bouwen en schalen. Potentieel recurring werk. Budget: €5-15K'
  }

  return `Genereer ${count} realistische prospect bedrijven voor Vibecoders.

TYPE: ${type.toUpperCase()}
${typeDescriptions[type] || typeDescriptions.small}
${industry ? `INDUSTRIE FOCUS: ${industry}` : ''}

BELANGRIJKE REGELS:
1. Genereer REALISTISCHE Nederlandse bedrijven (of Belgische/Duitse)
2. Website URLs moeten plausibel zijn (hoeven niet te bestaan)
3. Elke prospect moet een duidelijke reden hebben waarom ze target zijn
4. Varieer in industrie tenzij specifiek gefocust
5. Geef een confidence score (hoe zeker je bent dat dit een goede match is)

Output JSON:
{
  "prospects": [
    {
      "company_name": "Bedrijfsnaam BV",
      "website_url": "https://bedrijfsnaam.nl",
      "industry": "E-commerce|SaaS|Healthcare|etc",
      "company_size": "small|medium|large|startup",
      "description": "Korte beschrijving van het bedrijf",
      "why_target": "Waarom is dit een goede target voor Vibecoders",
      "estimated_project_value": "€X-Y",
      "suggested_approach": "Beste manier om te benaderen",
      "confidence_score": 75
    }
  ]
}`
}

// ============================================================
// PROJECT INTELLIGENCE (MERGED BRIEFING)
// ============================================================

export const PROJECT_INTELLIGENCE_PROMPT = `Analyseer deze project briefing en genereer gestructureerde intelligence.

Extracteer:
1. Kernproblemen (pain points) met ernst
2. Must-haves (niet-onderhandelbaar)
3. Vragen die beantwoord moeten worden
4. Aannames die gemaakt worden
5. Risico's met impact en likelihood
6. Voorgestelde taken met schatting

Output JSON:
{
  "oneLiner": "Eén zin project beschrijving",
  "painPoints": [
    {
      "title": "Korte titel",
      "description": "Gedetailleerde beschrijving",
      "severity": "critical|high|medium|low",
      "affectedArea": "User Experience|Performance|Business|Technical|Security"
    }
  ],
  "mustHaves": [
    {
      "requirement": "Wat moet geleverd worden",
      "rationale": "Waarom niet-onderhandelbaar",
      "category": "functional|technical|business|design",
      "priority": 1
    }
  ],
  "questions": [
    {
      "question": "Wat moet verduidelijkt worden?",
      "context": "Waarom dit belangrijk is",
      "importance": "blocking|important|nice-to-know",
      "suggestedDefault": "Wat aan te nemen als niet beantwoord"
    }
  ],
  "assumptions": ["Aanname 1", "Aanname 2"],
  "outOfScope": ["Niet inbegrepen 1", "Niet inbegrepen 2"],
  "risks": [
    {
      "risk": "Risico beschrijving",
      "impact": "low|medium|high",
      "likelihood": "low|medium|high",
      "mitigation": "Hoe te mitigeren"
    }
  ],
  "suggestedTasks": [
    {
      "title": "Taak titel",
      "description": "Wat te doen",
      "estimate": "2-4 uur",
      "priority": 1
    }
  ],
  "timeline": "Genoemd tijdlijn of null",
  "budget": "Genoemd budget of null",
  "stakeholders": ["Persoon/rol 1", "Persoon/rol 2"],
  "successCriteria": ["Hoe succes te meten"]
}

Wees specifiek en actionable. Als iets vaag is in de briefing, voeg het toe als vraag.`

// ============================================================
// CONTENT GENERATION (LINKEDIN)
// ============================================================

export const LINKEDIN_CONTENT_PROMPT = `Genereer LinkedIn posts voor een tech professional die inzichten deelt over AI en developer tools.

Posts moeten zijn:
- Authentiek en conversationeel, niet salesy
- Educatief met een duidelijke takeaway
- Geformatteerd voor LinkedIn (korte paragrafen, emoji's)
- Onder 3000 karakters (sweet spot: 1200-1800)
- Een hook die de scroll stopt

Post types:
1. INSIGHT: Niet-voor-de-hand-liggende observatie over een trend
2. QUESTION: Thought-provoking vraag voor discussie
3. STORY: Mini-verhaal of voorspelling

Output JSON:
{
  "posts": [
    {
      "hook": "Eerste zin die aandacht grijpt",
      "body": "Hoofdcontent met paragrafen gescheiden door \\n\\n",
      "callToAction": "Einde dat engagement uitnodigt",
      "hashtags": ["AI", "DevTools", "TechTrends"],
      "postType": "insight|question|story"
    }
  ]
}

Maak elke post uniek. Geen corporate jargon.
Mix Nederlands met Engelse tech termen natuurlijk.`

// ============================================================
// WEEKLY SYNTHESIS
// ============================================================

export const SYNTHESIS_PROMPT = `Genereer een wekelijkse synthese rapport van AI nieuws voor Vibecoders.

REGELS:
1. COMPACT - max 3-5 pagina's, 1200-2200 woorden
2. Identificeer 3-5 MACRO TRENDS (niet 20 kleine dingen)
3. CONCRETE acties met effort (S/M/L) en impact (Low/Med/High)
4. Onderscheid:
   - Implications for Vibecoding (build & delivery)
   - Client Opportunities (sales/use-cases)
   - Ignore list (hype/ruis)
5. Refereer naar bronnen met [Article Title](url)
6. Wees kritisch: niet alles is belangrijk

Output JSON:
{
  "weekLabel": "2026-W01",
  "title": "Foreseen Weekly Synthesis — 2026 W01",
  "executiveSummary": ["bullet 1", "bullet 2"],
  "macroTrends": [
    {
      "trend": "Trend naam",
      "whatHappened": "Wat er gebeurde",
      "whyItMatters": "Waarom belangrijk",
      "evidence": [{"title": "...", "url": "...", "source": "..."}]
    }
  ],
  "implications": [
    {
      "action": "Concrete actie",
      "effort": "S|M|L",
      "impact": "Low|Med|High",
      "rationale": "Waarom dit doen",
      "nextStep": "Eerste stap"
    }
  ],
  "clientOpportunities": [
    {
      "opportunity": "Kans beschrijving",
      "targetClients": "Wie",
      "pitchAngle": "Hoe pitchen",
      "suggestedDeliverable": "MVP voorstel",
      "expectedValue": "Verwachte waarde"
    }
  ],
  "ignoreList": [{"topic": "Onderwerp", "whyIgnore": "Waarom negeren"}],
  "readingList": [
    {
      "title": "Article title",
      "url": "https://...",
      "source": "Source name",
      "score": 85,
      "why": "Waarom lezen"
    }
  ]
}`

// ============================================================
// PRIORITIZATION
// ============================================================

export const PRIORITIZATION_PROMPT = `Prioriteer deze items op basis van urgentie en impact voor Vibecoders.

Evalueer elk item op:
1. Urgentie (tijd-gevoelig?)
2. Impact (business waarde)
3. Effort (hoeveel werk)
4. Dependencies (blokkeert andere zaken?)

Output JSON:
{
  "prioritized": [
    {
      "id": "item_id",
      "title": "Item titel",
      "type": "article|lead|project|task",
      "score": 85,
      "urgency": "low|medium|high|critical",
      "reason": "Waarom deze prioriteit",
      "suggestedAction": "Wat nu te doen",
      "relatedItems": ["related_id_1"]
    }
  ],
  "insights": [
    "Algemene observatie over prioriteiten"
  ]
}`

// ============================================================
// MUST-READ TOP 10
// ============================================================

export const MUST_READ_PROMPT = `Selecteer de 10 meest relevante artikelen uit deze lijst.

SELECTIE CRITERIA:
1. Recency - Nieuwer is beter (maar niet altijd)
2. Impact - Hoog effect op Vibecoders of klanten
3. Actionability - Kan je er iets mee doen?
4. Uniekheid - Nieuwe inzichten, niet herhaling

Voor elk artikel, leg uit:
- WAAROM moet-lezen
- WAT te doen met dit inzicht
- LINK naar gerelateerde context (scan, beslissing)

Output JSON:
{
  "top10": [
    {
      "article_id": "id",
      "rank": 1,
      "whyMustRead": "Korte uitleg waarom essentieel",
      "suggestedActions": ["Actie 1", "Actie 2"]
    }
  ],
  "honorableMentions": ["article_id_1", "article_id_2"],
  "reasoning": "Algemene uitleg van selectie logica"
}`
