-- Vibecode Core Refactor: Knowledge Hub Migration
-- Merges Academy into Vibecode Core as a Reference Library

-- ============================================================================
-- PHASE 1: SCHEMA UPDATES
-- ============================================================================

-- 1. Add new columns to vibecode_stack_guides if they don't exist
DO $$ 
BEGIN
  -- Add slug column for nice URLs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vibecode_stack_guides' AND column_name = 'slug') THEN
    ALTER TABLE vibecode_stack_guides ADD COLUMN slug TEXT UNIQUE;
  END IF;

  -- Add category column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vibecode_stack_guides' AND column_name = 'category') THEN
    ALTER TABLE vibecode_stack_guides ADD COLUMN category TEXT;
  END IF;

  -- Rename best_practices to golden_rules if needed (or add golden_rules)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vibecode_stack_guides' AND column_name = 'golden_rules') THEN
    -- Check if best_practices exists and rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vibecode_stack_guides' AND column_name = 'best_practices') THEN
      ALTER TABLE vibecode_stack_guides RENAME COLUMN best_practices TO golden_rules;
    ELSE
      ALTER TABLE vibecode_stack_guides ADD COLUMN golden_rules JSONB;
    END IF;
  END IF;
END $$;

-- 2. Create vibecode_glossary table
CREATE TABLE IF NOT EXISTS vibecode_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  technical_context TEXT,
  related_guide_id UUID REFERENCES vibecode_stack_guides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on term for faster searches
CREATE INDEX IF NOT EXISTS idx_vibecode_glossary_term ON vibecode_glossary(term);

-- 3. Enable RLS on glossary
ALTER TABLE vibecode_glossary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for glossary (read-only for everyone)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vibecode_glossary' AND policyname = 'Read access'
  ) THEN
    CREATE POLICY "Read access" ON vibecode_glossary FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: SEED GLOSSARY TERMS
-- ============================================================================

-- Clear existing glossary entries to avoid duplicates on re-run
DELETE FROM vibecode_glossary;

INSERT INTO vibecode_glossary (term, definition, technical_context) VALUES
(
  'Edge Functions',
  'Server-side code that runs closer to the user. Use this for secrets (Stripe keys) or heavy AI logic that shouldn''t be in the frontend.',
  'In Supabase, Edge Functions are Deno-based serverless functions deployed globally. They''re ideal for webhook handlers, API integrations, and any logic requiring environment secrets.'
),
(
  'API (Application Programming Interface)',
  'The bridge between two systems. In our stack, Supabase auto-generated APIs are the default.',
  'Supabase automatically generates REST and GraphQL APIs from your database schema. Use these for standard CRUD operations. For complex logic, use Edge Functions or RPC calls.'
),
(
  'RLS (Row Level Security)',
  'The firewall of the database. It ensures users only see their own data. NEVER turn this off.',
  'RLS policies are PostgreSQL rules that filter data at the database level. Always enable RLS on every table and define explicit policies. Default is deny-all.'
),
(
  'Webhook',
  'A signal sent from one app to another. E.g., Typeform sends a webhook to Supabase when a form is filled.',
  'Webhooks are HTTP POST requests triggered by events. Always verify webhook signatures to prevent spoofing. Handle webhooks in Edge Functions, not client-side code.'
),
(
  'UUID (Universally Unique Identifier)',
  'A 128-bit identifier that''s practically guaranteed to be unique. We use UUIDs for all primary keys.',
  'UUIDs prevent enumeration attacks (guessing IDs like /user/1, /user/2) and work better in distributed systems. Use gen_random_uuid() in PostgreSQL.'
),
(
  'Cascade (Windsurf)',
  'Windsurf''s context-aware AI mode that can read your entire codebase and make multi-file edits.',
  'Cascade maintains conversation history and understands file relationships. Use it for complex features, refactoring, and debugging. Always review diffs before accepting.'
),
(
  'shadcn/ui',
  'A collection of re-usable React components built with Radix UI and Tailwind CSS. Not a library—you own the code.',
  'Unlike traditional component libraries, shadcn/ui components are copied into your project. This gives full customization control without package dependencies.'
),
(
  'Realtime',
  'Supabase feature that enables live updates via WebSocket subscriptions.',
  'Use Supabase Realtime to subscribe to database changes (INSERT, UPDATE, DELETE). Great for collaborative features, live dashboards, and chat applications.'
);

-- ============================================================================
-- PHASE 3: UPDATE/SEED STACK GUIDES
-- ============================================================================

-- Update existing guides with slugs and categories, or insert new ones
-- First, update existing entries to add slugs

UPDATE vibecode_stack_guides 
SET slug = 'windsurf', category = 'AI'
WHERE tool_name ILIKE '%Windsurf%' OR tool_name ILIKE '%Brain%';

UPDATE vibecode_stack_guides 
SET slug = 'supabase', category = 'Backend'
WHERE tool_name ILIKE '%Supabase%' OR tool_name ILIKE '%Skeleton%';

UPDATE vibecode_stack_guides 
SET slug = 'lovable', category = 'Frontend'
WHERE tool_name ILIKE '%Lovable%' OR tool_name ILIKE '%Face%' OR tool_name ILIKE '%UI%';

UPDATE vibecode_stack_guides 
SET slug = 'github-vercel', category = 'Workflow'
WHERE tool_name ILIKE '%Ship%' OR tool_name ILIKE '%GitHub%' OR tool_name ILIKE '%Vercel%';

-- Insert Typeform guide if it doesn't exist
INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order)
SELECT 
  'Typeform & Gravity: Forms 📝',
  'FileText',
  'typeform',
  'Workflow',
  'Connect Typeform to Supabase via Webhooks. Don''t build custom forms if Typeform suffices.',
  '# Typeform & Gravity: Forms 📝

## Why Typeform?

At Vibecode, we don''t build custom forms from scratch unless absolutely necessary. **Typeform** provides:
- Beautiful, conversational form experiences
- Built-in validation and logic jumps
- Analytics and integrations out of the box

---

## The Gravity Pattern

**Gravity** is our standard webhook handler pattern for processing Typeform submissions:

```
Typeform → Webhook → Supabase Edge Function → Database
```

### How It Works

1. User fills out Typeform
2. Typeform sends a webhook POST to our Edge Function
3. Edge Function validates the signature
4. Edge Function extracts and maps fields
5. Data is inserted into Supabase

---

## Setting Up the Integration

### Step 1: Create the Edge Function

```typescript
// supabase/functions/typeform-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TYPEFORM_SECRET = Deno.env.get(''TYPEFORM_WEBHOOK_SECRET'')!

serve(async (req) => {
  // 1. Verify signature
  const signature = req.headers.get(''typeform-signature'')
  const body = await req.text()
  
  if (!verifySignature(body, signature, TYPEFORM_SECRET)) {
    return new Response(''Invalid signature'', { status: 401 })
  }

  // 2. Parse and map fields
  const payload = JSON.parse(body)
  const answers = payload.form_response.answers
  
  const data = {
    name: getAnswer(answers, ''name_field_ref''),
    email: getAnswer(answers, ''email_field_ref''),
    message: getAnswer(answers, ''message_field_ref''),
  }

  // 3. Insert into database
  const supabase = createClient(
    Deno.env.get(''SUPABASE_URL'')!,
    Deno.env.get(''SUPABASE_SERVICE_ROLE_KEY'')!
  )

  await supabase.from(''form_submissions'').insert(data)

  return new Response(JSON.stringify({ success: true }))
})
```

### Step 2: Configure Typeform Webhook

1. Go to Typeform → Connect → Webhooks
2. Add your Edge Function URL
3. Copy the secret to your Supabase secrets

---

## Field Mapping Best Practices

❌ **Wrong: Dumping raw JSON**
```typescript
await supabase.from(''submissions'').insert({ raw: payload })
```

✅ **Right: Explicit field mapping**
```typescript
const data = {
  customer_name: getAnswer(answers, ''name''),
  customer_email: getAnswer(answers, ''email''),
  project_type: getAnswer(answers, ''project_type''),
  budget: parseFloat(getAnswer(answers, ''budget'')),
}
```

---

## When NOT to Use Typeform

Use custom forms when you need:
- Real-time validation against your database
- Complex multi-step wizards with state
- Integration with other page elements
- Custom styling that Typeform can''t achieve

For everything else? **Just use Typeform.**
',
  '[
    "Always verify the webhook signature before processing",
    "Map fields explicitly—never dump raw JSON into the database",
    "Use Edge Functions to receive webhooks (never client-side)",
    "Store Typeform secrets in Supabase environment variables",
    "Use field references (not labels) for reliable field mapping"
  ]'::jsonb,
  5
WHERE NOT EXISTS (
  SELECT 1 FROM vibecode_stack_guides WHERE slug = 'typeform'
);

-- ============================================================================
-- PHASE 4: VERIFICATION
-- ============================================================================

-- Verify data was inserted correctly
DO $$
DECLARE
  glossary_count INT;
  guides_count INT;
BEGIN
  SELECT COUNT(*) INTO glossary_count FROM vibecode_glossary;
  SELECT COUNT(*) INTO guides_count FROM vibecode_stack_guides WHERE slug IS NOT NULL;
  
  RAISE NOTICE 'Migration complete: % glossary terms, % guides with slugs', 
    glossary_count, guides_count;
END $$;
