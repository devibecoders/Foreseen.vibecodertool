# Cross-Functionality Notes

**Created:** 2026-01-30
**Purpose:** Document data consistency checks and findings

---

## Findings

### ✅ Projects: Consistent

**Pages checked:**
- `/projects` (main kanban)
- `/projects/risk` (risk board)

**API endpoints:**
- `GET /api/projects` - fetches from `projects` table
- `GET /api/projects/risk` - fetches from same table, adds risk assessment

**Result:** Same project data shown on both pages. Risk board just adds `risk` object on top.

---

### ⚠️ Articles: Partial Inconsistency

**Pages checked:**
- Dashboard (`/`) - shows `unreviewedTop`
- Must-Read (`/must-read`) - shows top 10

**API endpoints:**
- `GET /api/dashboard/summary` - uses raw `impact_score`
- `GET /api/must-read` - uses personalized `adjusted_score`

**Issue:** Dashboard shows articles sorted by raw impact score, while Must-Read uses personalized scores. This means an article could be #1 on dashboard but #5 on Must-Read.

**Impact:** Minor - dashboard is just a preview. Users who want personalized ranking go to Must-Read.

**Recommendation:** Consider using personalized scoring on dashboard too, OR clearly label dashboard as "raw scores".

---

### ✅ Signals: Consistent

**Components checked:**
- `SignalsCockpit.tsx` - shows all weights
- `ArticleExplainability.tsx` - shows per-article reasons
- `IgnoreReasonPicker.tsx` - updates weights

**API endpoints:**
- All use `user_signal_weights` table
- All use same `scoreArticlesV2` function

**Result:** Signal weights are consistent across all views.

---

### ✅ Clustering: Consistent

**Checked:** Articles with `cluster_id` show correctly as clustered on:
- Dashboard
- Must-Read
- Research scan view

**Components:** `ClusterBadge.tsx` used consistently.

---

## Data Flow Diagram

```
Raw Articles (RSS)
       ↓
   Ingestion → articles table
       ↓
   Analysis (LLM) → analyses table
       ↓
   Signal Extraction → analyses.signals
       ↓
   Clustering → story_clusters + articles.cluster_id
       ↓
   Scoring (user weights) → adjusted_score (computed)
       ↓
   Display (dashboard, must-read, research)
```

---

## Shared Components

| Component | Used In | Data Source |
|-----------|---------|-------------|
| `Navigation.tsx` | All pages | Static |
| `ClusterBadge.tsx` | Must-Read, Research | story_clusters |
| `IntentChip.tsx` | Must-Read, Research | analyses.intent_label |
| `ArticleExplainability.tsx` | Must-Read | scoreArticlesV2 output |
| `OutcomeGenerator.tsx` | Must-Read | articles + LLM |
| `SignalsCockpit.tsx` | /research/signals | user_signal_weights |

---

## Type Consistency

All pages use consistent TypeScript interfaces:
- `Project` type matches DB schema
- `Article` type includes analysis relation
- `SignalWeight` type matches DB schema

---

## Recommendations

1. **Low priority:** Add personalized scoring to dashboard unreviewed preview
2. **Consider:** Create shared article-fetching hook to ensure consistency
3. **Document:** Add JSDoc to key API routes explaining scoring method used
