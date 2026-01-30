# Foreseen Enhancement Plan — MoltBOT

## Status: ✅ Sprint 1-2 Complete
**Branch:** `feature/moltbot-enhancements`
**Started:** 2026-01-29
**Last Updated:** 2026-01-30

---

## Executive Summary

Dit plan transformeert Foreseen van een research aggregator naar een volledig intern OS voor Vibecoders dat:
- 80% van researchwerk automatiseert
- 50% van voorbereidend denkwerk elimineert
- Beslissingen beter maakt dan handmatig mogelijk is

---

## Completed Features ✅

### Phase 1: Algorithm Fundamentals
| Feature | Status | Files |
|---------|--------|-------|
| Decision Confidence Memory | ✅ Done | `lib/signals/decisionConfidence.ts` |
| Weight Decay | ✅ Done | `lib/signals/weightDecay.ts` |
| Dedup/Clustering | ✅ Done | `lib/clustering.ts`, migration 020 |
| Counter-bias Injection | ✅ Done | `lib/signals/counterBias.ts` |
| Signals Cockpit UI | ✅ Done | `components/SignalsCockpit.tsx` |
| Intent Labels | ✅ Done | `lib/signals/intentLabels.ts`, migration 021 |
| Article Explainability | ✅ Done | `components/ArticleExplainability.tsx` |

### Phase 2: Decision → Action Bridge
| Feature | Status | Files |
|---------|--------|-------|
| One-click Outcome Generator | ✅ Done | `lib/outcomeGenerator.ts`, `components/OutcomeGenerator.tsx` |
| Ignore Reason Chips | ✅ Done | `lib/signals/ignoreReasons.ts`, `components/IgnoreReasonPicker.tsx` |

### Phase 3: Output Formats
| Feature | Status | Files |
|---------|--------|-------|
| Must-Read Top 10 | ✅ Done | `app/must-read/page.tsx` |
| LinkedIn Generator | ✅ Done | `app/linkedin/page.tsx`, `lib/linkedinGenerator.ts` |

### Phase 4: Workload Reducers
| Feature | Status | Files |
|---------|--------|-------|
| Briefing Summarizer | ✅ Done | `app/briefing/page.tsx`, `lib/briefingSummarizer.ts` |

### Phase 5: Project Intelligence
| Feature | Status | Files |
|---------|--------|-------|
| Project Risk Board | ✅ Done | `app/projects/risk/page.tsx`, `lib/projectRisk.ts` |

---

## Database Migrations

| Migration | Description | Status |
|-----------|-------------|--------|
| 019_enhanced_decisions.sql | Confidence, ignore reasons, weight decay | ✅ Ready |
| 020_article_clustering.sql | Story clusters, dedup | ✅ Ready |
| 021_intent_labels.sql | Intent detection fields | ✅ Ready |
| 022_generated_outcomes.sql | Checklists, spikes, reminders | ✅ Ready |

**To apply:**
```bash
supabase db push
# Or manually run each SQL file in Supabase Dashboard
```

---

## New Pages Added

| Route | Purpose |
|-------|---------|
| `/must-read` | Top 10 action-focused reading list |
| `/linkedin` | LinkedIn post generator |
| `/briefing` | Project briefing analyzer |
| `/projects/risk` | Project risk monitoring board |
| `/research/signals` | Signals cockpit / preferences |

---

## Remaining Features (Backlog)

### High Priority
- [ ] Client Proposal Drafts
- [ ] Meeting Prep Pack
- [ ] Tech Radar visualization
- [ ] Second-order relevance tracking

### Medium Priority
- [ ] Weekly "Sem briefing" generator
- [ ] Scope creep detector
- [ ] Time & Effort estimator
- [ ] Vibecoder Fit Score

### Lower Priority (Phase 6)
- [ ] Lead Discovery Engine
- [ ] Strategy Simulator
- [ ] Auto-playbook creation

---

## API Cost Control

All LLM features are behind buttons:
- ✅ LinkedIn Generator: "Generate Posts" button
- ✅ Briefing Summarizer: "Analyze Briefing" button
- ✅ Outcome Generator: "Generate Checklist/Spike/Reminder" buttons
- ✅ Intent Labels: Keyword-based (no LLM cost)

---

## Commits (Feature Branch)

```
fab8a83 docs: Improve migration documentation
1cdb2fa feat: Add project risk board
386ea88 feat: Add briefing summarizer
fe6d969 feat: Add LinkedIn generator
2357ccb feat: Add outcome generator
2a54176 feat: Add Must-Read Top 10
7f8e1bb feat: Add intent labels
a646cb8 feat: Add clustering/dedup
9e8c44d feat: Enhanced decisions system
```

---

## Testing Checklist

### Algorithm Tests
- [ ] Grok-undress scenario: suppress context, not category:security
- [ ] 3x ignore on concept → visible ranking drop
- [ ] 3x integrate on "Supabase RLS" → visible ranking rise
- [ ] Dedup works (1 story, 1 cluster)

### Cross-Functionality Tests
- [ ] Projects show same info on /projects and /projects/risk
- [ ] Articles show same scores on dashboard vs /must-read
- [ ] Signals consistent between cockpit and article views

---

## Architecture Notes

### Data Flow
```
RSS Feeds → Ingest → Analysis (LLM) → Signal Extraction
                                          ↓
User Decisions → Weight Updates → Personalized Scoring
                                          ↓
                                    Ranked Output
```

### Key Patterns
- All LLM calls are async, behind user-triggered buttons
- Supabase RLS for data isolation (currently single-user)
- TypeScript strict mode for type safety
- Tailwind for consistent styling

---

## Next Steps

See `docs/NEXT_LEVEL_IDEAS.md` for strategic improvements that could take Foreseen to the next level.
