# Architecture Overview

Technical architecture voor het Foresee platform.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Dashboard  │  │   Vibecode  │  │   Projects  │   ...       │
│  │   (React)   │  │    Core     │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                   ┌──────┴──────┐                               │
│                   │  API Routes │                               │
│                   │  (Next.js)  │                               │
│                   └──────┬──────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                      BACKEND                                    │
│                          │                                      │
│    ┌─────────────────────┼─────────────────────┐               │
│    │                     │                     │               │
│    ▼                     ▼                     ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Supabase   │  │   OpenAI/   │  │    RSS      │             │
│  │  (Postgres) │  │  Anthropic  │  │   Feeds     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Key Patterns

### 1. Data Fetching

**Server Components (default)**
```tsx
// Direct database access
const { data } = await supabase.from('table').select()
```

**Client Components (interactivity needed)**
```tsx
// Via API routes + React Query
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData })
```

### 2. API Routes

Located in `app/api/`. Each route exports HTTP method handlers:

```typescript
// app/api/resource/route.ts
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

### 3. Database Access

All database access uses Supabase client:

```typescript
import { supabase } from '@/lib/supabase'

// With RLS (client/anon key)
const { data } = await supabase.from('table').select()

// Without RLS (service role - server only)
const { data } = await supabaseAdmin.from('table').select()
```

### 4. Authentication

Supabase Auth handles:
- Email/password login
- Session management
- RLS policy enforcement

### 5. Styling

Tailwind CSS only. No custom CSS files.

```tsx
// ✅ Correct
<div className="p-4 bg-white rounded-lg shadow-sm">

// ❌ Avoid
<div style={{ padding: 16 }}>
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `vibecode_core` | Philosophy content |
| `vibecode_stack_guides` | Stack tool guides |
| `vibecode_glossary` | Technical terms |
| `vibecode_boundaries` | Anti-patterns/rules |
| `articles` | AI news articles |
| `sources` | RSS feed sources |

### RLS Policies

All tables have RLS enabled. Default policy: read-only for anon, write for authenticated.

## File Conventions

| Pattern | Convention |
|---------|------------|
| Components | PascalCase (`UserCard.tsx`) |
| Hooks | camelCase with `use` prefix (`useProjects.ts`) |
| Utils | camelCase (`formatDate.ts`) |
| API routes | lowercase (`route.ts`) |

## Environment Variables

| Variable | Purpose | Visibility |
|----------|---------|------------|
| `NEXT_PUBLIC_*` | Client-side safe | Browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access | Server only |
| `OPENAI_API_KEY` | LLM access | Server only |

## Deployment

1. **Vercel** for frontend/API routes
2. **Supabase** for database/auth
3. **Edge Functions** for webhooks/heavy processing
