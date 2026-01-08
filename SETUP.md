# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

## 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Create database
npx prisma db push

# Seed sources
npx tsx scripts/seed-sources.ts
```

## 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 5. First Run

1. Click "Run Weekly Scan" button
2. Wait for articles to be fetched and analyzed
3. Browse results with filters
4. Export as Markdown

## Troubleshooting

**TypeScript errors before install**: Normal - run `npm install` first

**Database locked**: Stop all processes, remove `prisma/dev.db-journal`, restart

**LLM API errors**: Check your API key in `.env`

**No articles found**: Check console logs during scan for RSS feed errors
