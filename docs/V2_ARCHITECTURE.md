# Foreseen V2 Architecture

> "Foreseen moet denken vóór jou, verbinden vóórdat jij dat doet, voorwerk doen voordat jij het ziet."

## Core Principle

Foreseen is geen dashboard, geen CRM, geen losse tool.
Het is een **intelligent werk- en beslissingssysteem** voor Vibecoders.

---

## 1. Één Gesloten Feedbackloop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   SCAN → ANALYSE → DECISION → ALGORITHM → OUTPUT → PROJECT     │
│     ↑                                                    │      │
│     └────────────────── FEEDBACK ←───────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Alles praat met elkaar:
- Scans voeden Top 10, Signals, Synthesis
- Decisions beïnvloeden ranking
- Top 10 voedt LinkedIn, Projects
- Projects genereren nieuwe research needs

---

## 2. Één AI-Brein

**Niet:** Losse AI per feature
**Wel:** Één intelligence layer die overal wordt toegepast

```typescript
// Eén unified AI service
class ForeseenBrain {
  // Dezelfde context, signals, en denklogica
  private context: UserContext
  private signals: SignalWeights
  private history: DecisionHistory
  
  // Verschillende toepassingen
  analyzeArticle(article)      // Research
  analyzeLead(company)         // Lead Discovery  
  analyzeProject(briefing)     // Project Intelligence
  generateContent(topic)       // LinkedIn/Output
  assessRisk(project)          // Risk Detection
  synthesize(articles)         // Weekly Summary
  prioritize(items)            // Prioriteiten Coach
}
```

---

## 3. Lead Discovery = AI Sourcing Engine

**Oud:** Handmatig CRM met optionele AI analyse
**Nieuw:** AI zoekt, jij selecteert

### Flow
```
[Generate Batch] → AI zoekt 10-25 prospects
                      ↓
              Voor elke prospect:
              - Website analyse
              - Pijnpunten detectie
              - Vibecoders fit score
              - Opportunity sizing
                      ↓
              [Review Queue] → Accept / Reject / Save for later
                      ↓
              [Outreach Ready] → Gegenereerde berichten
```

### Batch Types
- 10 kleine bedrijven (€1-3K projecten)
- 10 middelgrote bedrijven (€3-10K projecten)
- 5 startups (potentieel recurring)

### Handmatig = Secundair
- Mag bestaan
- Maar gaat altijd door AI pipeline
- Geen "dode" leads zonder analyse

---

## 4. Top 10 = Automatisch Gegenereerd

**Niet:** Handmatige selectie
**Wel:** Algoritmisch bepaald op basis van:
- Laatste scans (recency)
- Signal weights (personalisatie)
- Decisions (feedback)
- Intent labels (actionability)

### Definitie
> "De 10 inzichten die NU het meest relevant zijn voor Vibecoders"

### Verplichte Links
Elk item toont:
- Bron scan/artikel
- Waarom deze score
- Gerelateerde decisions
- Mogelijke acties

### Feeds Into
- LinkedIn Generator (content ideeën)
- Weekly Summary (highlights)
- Project ideeën (opportunities)

---

## 5. Briefing → Project Intelligence

**Oud:** Losse "Briefing" module
**Nieuw:** Onderdeel van project creation flow

### Naam
`Project Intelligence` of `Project Context`

### Binnen een Project
```
Project
├── Project Intelligence (was: Briefing)
│   ├── Samenvatting vraag
│   ├── Gedetecteerde risico's
│   ├── Pijnpunten
│   ├── Aannames
│   ├── Onzekerheden
│   └── AI-analyse: wat is écht belangrijk
├── Tasks
├── Documents
└── Timeline
```

### Flow
1. Nieuw project → Start met Intelligence input
2. AI analyseert → Genereert structured insights
3. Project verschijnt in:
   - Project slider
   - Active projects count
   - Risk board

---

## 6. Research = Één Systeem

**Niet:** Losse schermen (Scan, Decisions, Synthesis, Top 10)
**Wel:** Één verbonden interface

### Unified Research View
```
┌─────────────────────────────────────────────────────────────┐
│ RESEARCH                                           [+ Scan] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│ │ TOP 10      │ │ SIGNALS     │ │ RECENT DECISIONS        │ │
│ │ (live)      │ │ (weights)   │ │ (feedback loop)         │ │
│ └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ WEEKLY SYNTHESIS                                        │ │
│ │ Auto-generated from scans + decisions                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SCAN HISTORY                                            │ │
│ │ [Scan 1] [Scan 2] [Scan 3] ...                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Nieuwe Features (V2)

### 7.1 Research → Project Converter
Vanuit Top 10 of Research item:
- "Maak project hiervan"
- AI genereert: context, risico's, taken, tijdsinschatting

### 7.2 Opportunity Radar
- Trends die vaak terugkomen
- Nog niet in projecten omgezet
- Foreseen vraagt: "Waarom doen we hier niets mee?"

### 7.3 AI Prioriteiten Coach
Proactieve suggesties:
- "Dit lijkt belangrijker dan waar je nu mee bezig bent"
- "Dit kan wachten"
- "Hier zit onderschat risico"

---

## 8. Technical Changes Required

### Database
- [ ] Leads table: add `source_type = 'ai_generated' | 'manual'`
- [ ] Leads table: add `batch_id` for grouping AI generations
- [ ] Projects table: add `intelligence` JSONB field
- [ ] Remove standalone briefings concept

### API Changes
- [ ] `/api/leads/generate-batch` - AI sourcing endpoint
- [ ] `/api/research/top10` - Automatic generation (no manual)
- [ ] `/api/projects` - Include intelligence in creation
- [ ] Unified `/api/brain/*` endpoints for AI operations

### UI Changes
- [ ] Fix LinkedIn Generator persistence bug
- [ ] Lead Discovery: AI-first interface
- [ ] Top 10: Remove manual controls, show provenance
- [ ] Briefing: Integrate into Project creation
- [ ] Research: Unified dashboard view

### AI Service
- [ ] Create unified `ForeseenBrain` class
- [ ] Single context/signals injection point
- [ ] Consistent prompt patterns across features

---

## 9. Migration Path

### Phase 1: Fix Bugs
1. LinkedIn Generator close bug
2. Top 10 data connections

### Phase 2: Unify AI
1. Create ForeseenBrain service
2. Migrate all AI calls to use it
3. Share context across features

### Phase 3: Lead Discovery V2
1. AI batch generation
2. Review queue interface
3. Demote manual entry

### Phase 4: Project Intelligence
1. Merge Briefing into Projects
2. Auto-generate project structure
3. Research → Project converter

### Phase 5: Research Unification
1. Single Research dashboard
2. Automatic Top 10
3. Opportunity Radar

---

## Guiding Questions

Before building anything:
1. Does this connect to other parts of the system?
2. Does this use the unified AI brain?
3. Can the user trace where this came from?
4. Does this reduce manual work or create it?
