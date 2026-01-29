# Foreseen Enhancement Plan — MoltBOT

## Status: 🏗️ In Progress
**Branch:** `feature/moltbot-enhancements`
**Started:** 2026-01-29

---

## Executive Summary

Dit plan transformeert Foreseen van een research aggregator naar een volledig intern OS voor Vibecoders dat:
- 80% van researchwerk automatiseert
- 50% van voorbereidend denkwerk elimineert
- Beslissingen beter maakt dan handmatig mogelijk is

---

## Huidige Staat (Analyse)

### Wat werkt
- ✅ Article ingestion via RSS
- ✅ LLM-based analysis (summary, categories, impact score)
- ✅ Signal extraction (entities, concepts, categories, contexts)
- ✅ V2 scoring met type multipliers
- ✅ Weekly synthesis generation
- ✅ Basic decision workflow (EXPERIMENT/MONITOR/IGNORE)
- ✅ Vibecode Core kennisbank

### Wat mist
- ❌ Decision confidence tracking
- ❌ Second-order relevance (wat leidt tot actie?)
- ❌ Counter-bias injection
- ❌ Proper dedup/clustering
- ❌ Signals cockpit / explainability UI
- ❌ Weight decay over time
- ❌ Workload reducers (LinkedIn, proposals, meeting prep)
- ❌ Project intelligence (risk, estimates, scope creep)
- ❌ Lead discovery engine

---

## Gefaseerd Plan

### Phase 1: Algorithm Fundamentals 🧠
**Goal:** Stabiel, explainable algoritme dat écht werkt
**Priority:** HIGH — dit is de kern

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 1.1 Decision Confidence Memory | Track confidence per decision, faster decay for low confidence | M | High |
| 1.2 Weight Decay | Weights langzaam terug naar 0 na X weken inactiviteit | S | Med |
| 1.3 Dedup/Clustering | 1 story, 1 cluster, best source pick | L | High |
| 1.4 Counter-bias Injection | 10-20% serendipity, detect blind spots | M | Med |
| 1.5 Signals Cockpit UI | Per-artikel "Why you're seeing this" + weight overview | M | High |
| 1.6 Intent Labels | Artikel intent: release, controversy, how-to, benchmark, opinion | S | Med |

**Acceptance tests:**
- [ ] Grok-undress scenario: suppress context, niet category:security
- [ ] 3x ignore op concept → zichtbare daling in ranking
- [ ] 3x integrate op "Supabase RLS" → zichtbare stijging
- [ ] Dedup werkt (1 story, 1 cluster)

---

### Phase 2: Decision → Action Bridge 🎯
**Goal:** Decisions leiden direct tot output
**Priority:** HIGH — dit is workload reduction

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 2.1 One-click Outcome Generator | INTEGRATE → checklist, MONITOR → reminder, EXPERIMENT → spike plan | M | High |
| 2.2 Ignore Reason Chips | Bij ignore: selecteer/type waarom (noise, irrelevant, duplicate) | S | High |
| 2.3 Decision Assessment Persist | Sla assessments op met rationale, link aan user weights | S | Med |

---

### Phase 3: Output Formats 📊
**Goal:** Wekelijkse outputs die tijd besparen
**Priority:** MEDIUM

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 3.1 Enhanced Weekly Memo | Max 5 pages, actionable, met priority ranking | M | High |
| 3.2 Must-Read Top 10 | Dedicated view met "wat moet ik doen?" per item | S | High |
| 3.3 Implement Backlog | Tactisch: dingen om NU te bouwen | S | Med |
| 3.4 Client-Ready Highlights | Auto-generate pitch-ready summaries | M | High |

---

### Phase 4: Workload Reducers 🚀
**Goal:** Concrete tijdwinst op dagelijkse taken
**Priority:** MEDIUM-HIGH

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 4.1 LinkedIn Generator | 3 posts per week (short, medium, spicy) | M | High |
| 4.2 Client Proposal Drafts | Scope, risks, timeline, deliverables, pricing | L | High |
| 4.3 Meeting Prep Pack | What to say, what to ask, pitfalls | M | Med |
| 4.4 Briefing Summarizer | Drop briefing → painpoints, must-have, questions | M | High |

---

### Phase 5: Project Intelligence 📁
**Goal:** Slimmere projectplanning en -bewaking
**Priority:** MEDIUM

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 5.1 Project Board View | Kanban met kleur per risico/prioriteit | M | Med |
| 5.2 AI Project Analyzer | Kernprobleem, pijnpunten, risico's, timeline | L | High |
| 5.3 Next Actions Generator | Today, This Week, Blockers per project | M | High |
| 5.4 Scope Creep Detector | Flag notities die afwijken van scope | M | High |
| 5.5 Risk Early Warning | "72% kans op uitloop" met redenen | L | High |
| 5.6 Time & Effort Estimator | Build + thinking + coordination + buffer | M | High |

---

### Phase 6: Lead Discovery Engine 🎯
**Goal:** Structureel nieuwe opdrachten genereren
**Priority:** LOWER (later phase)

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 6.1 Lead Discovery | Vind bedrijven met ondermaatse digitale presence | L | High |
| 6.2 Lead Qualification | Score: business potentie, urgentie, quick wins | M | High |
| 6.3 Lead Insight Generator | Per-lead analyse: wat gaat mis, wat kan beter | M | High |
| 6.4 Outreach Preparation | Email + LinkedIn DM templates, geen spam | M | Med |
| 6.5 Outreach Control | Jij selecteert, één klik verstuurt | M | Med |

---

### Phase 7: Long-term Moat 🏰
**Goal:** Features die Foreseen uniek maken
**Priority:** LOW (visie)

| Feature | Beschrijving | Effort | Impact |
|---------|-------------|--------|--------|
| 7.1 Memory of Taste | Leer jouw smaak: diepte, technisch, pragmatisch | L | High |
| 7.2 Strategy Simulator | "Wat als ik 3 maanden focus op X?" | XL | High |
| 7.3 Second-order Relevance | Track wat leidt tot projecten/playbooks/deals | L | High |
| 7.4 Auto-playbook Creation | 3-5x zelfde actie → "Zal ik playbook maken?" | M | Med |

---

## Implementatie Volgorde

### Sprint 1 (Nu): Algorithm Core
1. ✅ Analyse codebase
2. 🔄 Weight decay implementeren
3. 🔄 Decision confidence memory
4. 🔄 Ignore reason chips
5. 🔄 Signals cockpit UI basis

### Sprint 2: Decision → Action
1. One-click outcome generator
2. Enhanced decision persist
3. Counter-bias injection

### Sprint 3: Output & Workload
1. Must-read top 10 view
2. LinkedIn generator
3. Briefing summarizer

### Sprint 4: Project Intelligence
1. Project board view
2. AI Project Analyzer
3. Scope creep detector

---

## Database Changes Required

### New Tables
```sql
-- Decision confidence tracking
ALTER TABLE decision_assessments 
ADD COLUMN confidence TEXT DEFAULT 'medium',
ADD COLUMN revisable BOOLEAN DEFAULT true;

-- Ignore reasons
CREATE TABLE ignore_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES decision_assessments(id),
    reason_type TEXT NOT NULL, -- 'noise', 'irrelevant', 'duplicate', 'custom'
    reason_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Weight decay tracking
ALTER TABLE user_signal_weights
ADD COLUMN last_decision_at TIMESTAMPTZ,
ADD COLUMN decay_applied_at TIMESTAMPTZ;

-- Lead discovery (Phase 6)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    website_url TEXT,
    quality_score INTEGER, -- 0-100
    signals JSONB, -- extracted signals
    analysis JSONB, -- LLM analysis
    status TEXT DEFAULT 'new', -- new, qualified, contacted, converted, rejected
    outreach_draft JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Kosten Bewaking

**BELANGRIJK:** Elke LLM-call moet via button, niet automatisch.

- [ ] LinkedIn generator: "Generate" button
- [ ] Proposal drafts: "Generate" button
- [ ] Lead insights: "Generate" button
- [ ] Meeting prep: "Generate" button

Geen background LLM calls zonder expliciete user actie.

---

## Risico's & Mitigaties

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Scope creep | High | Strikte fase-grenzen, één feature tegelijk |
| API kosten | Med | Alle LLM achter buttons, usage tracking |
| Complexiteit | High | Eenvoud > features, refactor indien nodig |
| Context verlies | Med | Documentatie, decision logs |

---

## Success Metrics

Na Phase 1-4:
- [ ] 80% van "must-read" artikelen in top 10
- [ ] <10% ruis in top 10
- [ ] Decision-to-rank effect zichtbaar binnen 1-2 scans
- [ ] Wekelijks 3 LinkedIn posts met <5 min effort
- [ ] Proposal drafts in <10 min ipv 1 uur

---

## Notes

- Alle code naar `feature/moltbot-enhancements` branch
- Geen merge naar main zonder Sem's "go"
- Elke feature heeft acceptance tests
- UI moet mobile-friendly blijven
