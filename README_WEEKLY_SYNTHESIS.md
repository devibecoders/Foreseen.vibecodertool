# Weekly Synthesis Feature - Setup Guide

## Overview
De Weekly Synthesis feature genereert geconsolideerde AI trend rapporten (3-5 pagina's) die trends, implicaties en actiepunten samenvatten.

## Setup

### 1. Environment Variables
Voeg de volgende variabelen toe aan je `.env` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://sqxbnlkwrzudotgiiusx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# LLM Configuration (already exists)
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### 2. Supabase Setup

#### A. Run Migration
Voer de SQL migration uit in Supabase SQL Editor:

```bash
# File: supabase/migrations/001_weekly_synthesis_tables.sql
```

Dit creëert:
- `weekly_runs` - tracks synthesis generation jobs
- `weekly_briefs` - stores generated synthesis documents
- `weekly_brief_sources` - maps articles to briefs
- RLS policies voor user-scoped access

#### B. Get Supabase Keys
1. Ga naar [Supabase Dashboard](https://supabase.com/dashboard/project/sqxbnlkwrzudotgiiusx)
2. Settings → API
3. Kopieer:
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 4. Run Application
```bash
npm run dev
```

## Usage

### Generate Weekly Synthesis
1. Ga naar http://localhost:3000/weekly-briefs
2. Kies mode:
   - **Weekly**: Laatste 7 dagen (custom date range)
   - **Backfill**: Laatste 30 dagen
3. Klik "Generate Weekly Synthesis"
4. Wacht 1-2 minuten voor LLM processing
5. Bekijk het gegenereerde rapport

### View Synthesis
- Klik op een brief in de lijst
- Zie KPI's: trends, actions, artikelen gebruikt
- Lees full markdown rapport
- Download als `.md` file

## API Endpoints

### POST /api/weekly/run
Generate nieuwe synthesis.

**Body:**
```json
{
  "start_date": "2026-01-01",
  "end_date": "2026-01-07",
  "mode": "weekly",
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "run_id": "uuid",
  "brief_id": "uuid",
  "items_considered": 39,
  "items_used": 35,
  "week_label": "2026-W01"
}
```

### GET /api/weekly/latest
Haal laatste brief op.

**Response:**
```json
{
  "brief": {
    "id": "uuid",
    "week_label": "2026-W01",
    "title": "Foreseen Weekly Synthesis — 2026 W01",
    "full_markdown": "...",
    "macro_trends": [...],
    "implications_vibecoding": [...],
    "client_opportunities": [...],
    "reading_list": [...]
  }
}
```

### GET /api/weekly/list
Haal lijst van briefs op (laatste 8).

**Query params:**
- `limit` (default: 8)

## Output Structure

Elke synthesis bevat:

1. **Executive Summary** (5-8 bullets)
2. **Macro Trends** (3-5 trends met evidence)
3. **Implications for Vibecoding** (5-8 acties met effort/impact)
4. **Client Opportunities** (3-6 kansen met pitch angles)
5. **Ignore List** (5-10 hype/ruis items)
6. **Top Reading List** (top 10 artikelen)

## Data Model

### weekly_runs
- Tracks synthesis generation jobs
- Status: queued → running → done/failed
- Stores items_considered, items_used

### weekly_briefs
- Stores generated synthesis
- JSONB fields voor structured data
- full_markdown voor complete rapport
- Unique constraint op (user_id, week_label)

### weekly_brief_sources
- Maps artikelen naar briefs
- Tracks waarom artikel is gebruikt

## Security

- ✅ RLS enabled op alle tabellen
- ✅ User-scoped access (auth.uid())
- ✅ Service role key alleen server-side
- ✅ Anon key voor client-side (met RLS)
- ⚠️ Auth nog niet geïmplementeerd (TODO)

## TODO: Auth Integration

Momenteel gebruikt de feature een `default-user` ID. Voor productie:

1. Implementeer Supabase Auth (magic link of email/password)
2. Vervang `default-user` met `auth.uid()` in API routes
3. Add auth middleware voor protected routes
4. Update UI met login/logout

## Performance

- Max 40 artikelen per synthesis (context limit)
- LLM call duurt ~30-60 seconden
- Concurrent limit: 2 LLM calls (via queue)
- Idempotent: zelfde week_label returnt bestaande brief

## Troubleshooting

### "No articles found"
- Check of er artikelen zijn in de date range
- Zorg dat artikelen analyses hebben (run scan eerst)

### "Failed to generate synthesis"
- Check LLM API key in .env
- Check Supabase connection
- Check server logs voor details

### RLS errors
- Verify Supabase keys zijn correct
- Check of migration is uitgevoerd
- Verify user_id in requests

## Testing

1. Run een scan eerst: http://localhost:3000
2. Klik "Nieuwe Scan" en wacht tot compleet
3. Ga naar /weekly-briefs
4. Generate synthesis voor laatste 7 dagen
5. Verify output bevat alle secties
6. Test download markdown functie
