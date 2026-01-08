# Vibecode Operating System for Innovation

## Architecture Overview

**Vibecode** transforms passive news consumption into an active innovation operating system. It consists of two interconnected modules:

### 1. Knowledge Core (The Constitution)
Defines **HOW** we build:
- **Philosophy**: North Star markdown document
- **Principles**: Core values and decision-making guidelines
- **Tech Radar**: Technology adoption framework (Adopt/Trial/Assess/Avoid)
- **Playbooks**: Step-by-step workflows for common scenarios
- **Boundaries**: Explicit "NO" list with rationale

### 2. Decision Engine (The Workflow)
Transforms **WHAT** we read into **ACTIONS**:
- **Ignore**: Low alignment or boundary conflicts
- **Monitor**: Interesting but not immediate
- **Experiment**: High impact, worth testing
- **Integrate**: Proven value, ready for adoption

---

## Database Schema

### Knowledge Core Tables

```sql
vibecode_core
├── id (uuid)
├── user_id (text)
├── title (text)
├── philosophy (text, markdown)
├── created_at (timestamptz)
└── updated_at (timestamptz)

vibecode_principles
├── id (uuid)
├── core_id (uuid → vibecode_core)
├── title (text)
├── description (text)
├── sort_order (int)
├── is_active (boolean)
└── created_at (timestamptz)

vibecode_radar_items
├── id (uuid)
├── core_id (uuid → vibecode_core)
├── title (text)
├── category (text: DevTools, Models, Security, etc.)
├── status (text: adopt, trial, assess, avoid)
├── rationale (text)
├── linked_article_id (text, optional)
└── created_at (timestamptz)

vibecode_playbooks
├── id (uuid)
├── core_id (uuid → vibecode_core)
├── title (text)
├── description (text)
├── steps (jsonb: [{step_name, tool, goal, anti_pattern}])
└── created_at (timestamptz)

vibecode_boundaries
├── id (uuid)
├── core_id (uuid → vibecode_core)
├── title (text)
├── why_not (text)
├── alternative (text)
├── risk_level (text)
└── created_at (timestamptz)
```

### Decision Engine Tables

```sql
decision_assessments
├── id (uuid)
├── user_id (text)
├── article_id (text → articles)
├── action_required (text: ignore, monitor, experiment, integrate)
├── impact_horizon (text: direct, mid, long)
├── confidence_score (int: 1-5)
├── risk_if_ignored (text)
├── advantage_if_early (text)
├── boundary_conflict_detected (boolean)
├── conflict_notes (text)
├── status (text: pending, processed)
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

---

## API Routes

### Knowledge Core
- `GET /api/vibecode/core` - Fetch active core
- `POST /api/vibecode/core` - Create/initialize core
- `PATCH /api/vibecode/core` - Update philosophy

- `GET /api/vibecode/principles?coreId=` - List principles
- `POST /api/vibecode/principles` - Add principle
- `DELETE /api/vibecode/principles?id=` - Remove principle

- `GET /api/vibecode/radar?coreId=` - List radar items
- `POST /api/vibecode/radar` - Add radar item
- `PATCH /api/vibecode/radar` - Update radar item
- `DELETE /api/vibecode/radar?id=` - Remove radar item

- `GET /api/vibecode/playbooks?coreId=` - List playbooks
- `POST /api/vibecode/playbooks` - Add playbook
- `DELETE /api/vibecode/playbooks?id=` - Remove playbook

- `GET /api/vibecode/boundaries?coreId=` - List boundaries
- `POST /api/vibecode/boundaries` - Add boundary
- `DELETE /api/vibecode/boundaries?id=` - Remove boundary

### Decision Engine
- `GET /api/decisions?articleId=` - Get decision for article
- `POST /api/decisions/assess` - Generate decision assessment
- `PATCH /api/decisions/:id` - Update decision status
- `GET /api/decisions/list` - List all decisions (with filters)

---

## UI Components

### Knowledge Core Pages
- `/vibecode-core` - Philosophy editor
- `/vibecode-core/principles` - Principles management
- `/vibecode-core/radar` - Tech Radar (Adopt/Trial/Assess/Avoid)
- `/vibecode-core/playbooks` - Workflow templates
- `/vibecode-core/boundaries` - Boundaries (Hard/Soft)

### Decision Engine Pages
- `/decisions` - Kanban board (Ignore/Monitor/Experiment/Integrate)
- Article modal - Decision Card component

---

## Decision Logic Flow

```
Article → Decision Engine
    ↓
1. Extract keywords from title + summary
2. Check against Vibecode Boundaries
    ↓
    If HARD boundary conflict → IGNORE
    ↓
3. Calculate Vibecode Alignment (0-100%)
    - Base: Impact Score
    - +10 if Vibecoders angle exists
    - +10 if Customer angle exists
    - -30 if boundary conflicts
    ↓
4. Determine Action:
    - Alignment ≥70% + Impact ≥70% → EXPERIMENT
    - Alignment ≥50% OR Impact ≥60% → MONITOR
    - Otherwise → IGNORE
    ↓
5. Calculate Impact Horizon:
    - Impact ≥70% → DIRECT (0-2 weeks)
    - Impact ≥60% → MID (1-3 months)
    - Otherwise → LONG (6+ months)
    ↓
6. Generate Rationale + Confidence Score
    ↓
7. Save to decision_assessments table
```

---

## Migration Path

### Current State (Migration 003)
- `vibecode_core` with JSONB principles
- `vibecode_tools` (old naming)
- `vibecode_flows` (old naming)
- `vibecode_boundaries` (old column names)

### New State (Migration 004)
- `vibecode_core` (unchanged)
- `vibecode_principles` (separate table)
- `vibecode_radar_items` (renamed from tools)
- `vibecode_playbooks` (renamed from flows)
- `vibecode_boundaries` (updated columns)
- `decision_assessments` (new)

### Migration Steps
1. Run migration 004 SQL
2. Migrate JSONB principles to separate table
3. Migrate tools to radar_items
4. Update API routes to use new table names
5. Update UI components to use new data structure

---

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: Supabase (PostgreSQL)
- **Interactions**: dnd-kit (for drag & drop)
- **Fonts**: Inter (UI), Merriweather (Editorial)

---

## Key Design Principles
1. **Active over Passive**: Never just "read" news, always "process" it
2. **Constitution-Driven**: All decisions trace back to Vibecode Core
3. **Visual Decision Making**: Large badges, progress bars, color coding
4. **Boundary-First**: Explicit "NO" list prevents scope creep
5. **Horizon-Aware**: Distinguish immediate vs long-term impact

---

## Next Steps
1. ✅ Database schema created (Migration 004)
2. ⏳ Update API routes for new schema
3. ⏳ Update UI components for new data model
4. ⏳ Implement drag & drop for Decision Kanban
5. ⏳ Add LLM integration for real decision assessment
6. ⏳ Build Playbooks UI
7. ⏳ Add Principles management UI
