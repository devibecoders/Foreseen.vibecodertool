# Foresee - AI Trends & Knowledge Platform

Private AI news aggregator en knowledge hub voor Vibecoders. Verzamelt wekelijks AI-updates, analyseert op relevantie, en biedt een uitgebreide kennisbank voor het team.

## Modules

| Module | Route | Beschrijving |
|--------|-------|--------------|
| **Dashboard** | `/` | AI nieuws aggregator met filters en impact scores |
| **Weekly Synthesis** | `/weekly-briefs` | Wekelijkse samenvattingen en briefings |
| **Vibecode Core** | `/vibecode-core` | Kennisbank: Stack guides, glossary, checklists |
| **Decisions** | `/decisions-inbox` | Decision inbox voor team beslissingen |
| **Projects** | `/projects` | Project management en tracking |

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL + RLS)
- **Styling**: TailwindCSS
- **LLM**: OpenAI / Anthropic (configureerbaar)
- **Auth**: Supabase Auth

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Vul je Supabase en LLM keys in

# 3. Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
foresee/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── vibecode/         # Vibecode Core endpoints
│   │   ├── weekly/           # Weekly briefing endpoints
│   │   └── ...
│   ├── vibecode-core/        # Knowledge hub pages
│   ├── weekly-briefs/        # Weekly synthesis pages
│   ├── projects/             # Project management
│   └── page.tsx              # Dashboard
├── components/               # Reusable UI components
│   ├── Navigation.tsx        # Main nav bar
│   ├── VibecodeLayoutNotion.tsx  # Vibecode sidebar layout
│   └── ...
├── lib/                      # Utilities & configuration
│   ├── supabase.ts           # Supabase client
│   ├── markdown.ts           # Markdown rendering
│   ├── llm.ts                # LLM abstraction
│   └── ...
├── supabase/
│   └── migrations/           # Database migrations
└── README.md
```

## Vibecode Core

De kennisbank bevat:

- **The Stack** - Guides voor Windsurf, Supabase, Lovable, etc.
- **Glossary** - Technische termen uitgelegd
- **Checklists** - Project, code review, deployment checklists
- **Troubleshooting** - Veelvoorkomende errors en oplossingen
- **Architecture** - Code patterns en conventions

Zie `/vibecode-core` voor de volledige kennisbank.

## Development

### Running Migrations

```bash
# Via Supabase SQL Editor
# 1. Open Supabase Dashboard > SQL Editor
# 2. Kopieer migratie bestand inhoud
# 3. Run
```

### Lint & Type Check

```bash
npm run lint
npm run build  # Includes type checking
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only

# LLM (kies één)
OPENAI_API_KEY=sk-...
# of
ANTHROPIC_API_KEY=sk-ant-...
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [Vibecode Core](/vibecode-core) - Team knowledge base

## Vercel Deployment

### Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables for **Production** and **Preview**:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for LLM analysis | ✅* |
| `ANTHROPIC_API_KEY` | Anthropic API key (alternative to OpenAI) | ✅* |
| `CRON_SECRET` | Secret for Vercel Cron job authentication | Optional |

*One of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is required.

### Build Commands

The default Vercel settings work:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Cron Jobs

Weekly article scan runs every Monday at 9:00 AM (configured in `vercel.json`).

## License

Private use only. Not for public distribution.
