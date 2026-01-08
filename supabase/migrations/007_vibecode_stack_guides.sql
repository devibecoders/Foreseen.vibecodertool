-- Vibecode Core 2.0: The Stack (Integrated Technical Documentation)
-- Merges the Academy concept directly into Vibecode Core

-- Create table for technical stack guides
CREATE TABLE vibecode_stack_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL, -- e.g., "Supabase", "Lovable", "GitHub & Vercel"
  icon TEXT, -- Lucide icon string
  summary TEXT,
  content TEXT NOT NULL, -- Longform Markdown (The actual guide)
  best_practices JSONB, -- Array of { title, rule, code_snippet }
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vibecode_stack_guides ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for stack guides" 
  ON vibecode_stack_guides FOR SELECT 
  USING (true);

-- Authenticated users can manage
CREATE POLICY "Authenticated users can manage stack guides" 
  ON vibecode_stack_guides FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX idx_vibecode_stack_guides_sort ON vibecode_stack_guides(sort_order);

-- Updated_at trigger
CREATE TRIGGER update_vibecode_stack_guides_updated_at
  BEFORE UPDATE ON vibecode_stack_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Content: The 4 Pillars of The Stack
-- Guide 1: Windsurf (The Brain)
INSERT INTO vibecode_stack_guides (tool_name, icon, summary, content, best_practices, sort_order) VALUES (
  'Windsurf: The Brain 🧠',
  'Brain',
  'Master AI-assisted development. Learn to direct, not code.',
  '# Windsurf: The Brain 🧠

## The Paradigm Shift

At Vibecode, we don''t write code—we **direct AI** to build it. Windsurf Cascade is your senior developer who has read every line of your codebase.

---

## The Golden Prompt Formula

Every prompt must contain these 4 elements:

### 1. Role
Define the expertise level:
```prompt
Act as a Senior Full-Stack Engineer with expertise in Next.js and Supabase.
```

### 2. Goal
Be specific about the outcome:
```prompt
Build a project pipeline Kanban board with drag-and-drop functionality.
```

### 3. Context
Specify your exact tech stack:
```prompt
Context:
- Next.js 14 App Router
- Supabase for backend
- dnd-kit for drag-and-drop
- Tailwind CSS + shadcn/ui
- Lucide icons
```

### 4. Constraints
Define what NOT to do:
```prompt
Constraints:
- Use proper TypeScript types
- Make columns droppable zones with useDroppable
- Add visual feedback when dragging
- Ensure modals are scrollable
```

---

## Cascade Mode Best Practices

### Start with Context
Let Cascade read relevant files first:
```prompt
Read the project structure in /app/projects and explain how the Kanban board works.
```

### Be Explicit About Scope
```prompt
We need to add PDF upload to projects. This will affect:
- The Project interface in page.tsx
- The database migration in 005_projects_pipeline.sql
- The ProjectFormModal component

Start by updating the database schema.
```

### Review Before Accepting
Always:
- Read the diff before accepting changes
- Test the functionality
- Check for unintended side effects

---

## The Perfect Feature Request Template

Use this template for complex features:

```prompt
Act as a [ROLE: Senior Frontend/Backend/Full-Stack Engineer].

Goal: [SPECIFIC OUTCOME]

Context:
- Next.js 14 App Router
- Supabase (with RLS)
- Tailwind CSS + shadcn/ui
- TypeScript (strict mode)
- [OTHER RELEVANT TECH]

Requirements:
1. [REQUIREMENT 1]
2. [REQUIREMENT 2]
3. [REQUIREMENT 3]

Constraints:
- [CONSTRAINT 1]
- [CONSTRAINT 2]
- [CONSTRAINT 3]

First, create a plan outlining:
1. Component structure
2. Data flow
3. State management
4. Edge cases

Then implement step by step.
```

---

## Common Mistakes to Avoid

❌ **Vague prompts**: "Make a dashboard"
✅ **Specific prompts**: "Build a dashboard with 4 metric cards, a line chart, and a data table"

❌ **No context**: Assumes AI knows your stack
✅ **Full context**: Lists all relevant tech and existing code

❌ **Accepting without review**: Blindly accepting all changes
✅ **Careful review**: Reading diffs and testing

---

## Next Level: Multi-File Refactoring

For large refactors, use this approach:

```prompt
We need to refactor the authentication system. This involves:

1. Update Supabase schema (add new columns)
2. Modify auth context in /contexts/AuthContext.tsx
3. Update login page to handle new flow
4. Add error handling across all auth calls

Start by analyzing the current auth flow. Then propose a migration plan.
```

This ensures Cascade understands the full scope before making changes.',
  '[
    {
      "title": "Always Ask for a Plan First",
      "rule": "Never jump straight to code. Request a plan outlining structure, data flow, and edge cases.",
      "code_snippet": "First, create a plan outlining:\n1. Component structure\n2. Data fetching strategy\n3. State management approach\n4. UI layout\n\nThen implement step by step."
    },
    {
      "title": "Use the 4-Part Prompt Formula",
      "rule": "Every prompt must have: Role, Goal, Context, Constraints",
      "code_snippet": "Act as a [ROLE].\n\nGoal: [SPECIFIC OUTCOME]\n\nContext:\n- [TECH STACK]\n\nConstraints:\n- [RULES]"
    },
    {
      "title": "Let Cascade Read First",
      "rule": "For complex features, let Cascade read relevant files before building",
      "code_snippet": "Read /app/projects/page.tsx and explain the current drag-drop implementation."
    },
    {
      "title": "Review All Diffs",
      "rule": "Never accept changes blindly. Read the diff, test locally, check for side effects.",
      "code_snippet": null
    }
  ]'::jsonb,
  1
);

-- Guide 2: Supabase (The Skeleton)
INSERT INTO vibecode_stack_guides (tool_name, icon, summary, content, best_practices, sort_order) VALUES (
  'Supabase: The Skeleton 🦴',
  'Database',
  'Backend mastery with Supabase. RLS policies, multi-tenancy, Edge Functions.',
  '# Supabase: The Skeleton 🦴

## The Foundation of Security

At Vibecode, **security is not optional**. Every table must have Row Level Security (RLS) enabled. No exceptions.

---

## RLS: The Golden Rule

### Default Deny All
```sql
-- Enable RLS on every table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Default: Nobody can access anything
-- Then explicitly grant access
CREATE POLICY "Users manage own projects" 
  ON projects FOR ALL 
  USING (auth.uid() = user_id);
```

### Common RLS Patterns

**1. User-Owned Data**
```sql
CREATE POLICY "Users see own data" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);
```

**2. Public Read, Authenticated Write**
```sql
CREATE POLICY "Public read" 
  ON articles FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated write" 
  ON articles FOR INSERT 
  USING (auth.uid() IS NOT NULL);
```

**3. Multi-Tenancy (Organization-Based)**
```sql
CREATE POLICY "Org members access" 
  ON projects FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM org_members 
      WHERE org_members.org_id = projects.org_id 
      AND org_members.user_id = auth.uid()
    )
  );
```

---

## Type Safety: No More `any`

### Generate TypeScript Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > database.types.ts
```

### Use Them Everywhere
```typescript
import { Database } from ''@/lib/database.types''

type Project = Database[''public''][''Tables''][''projects''][''Row'']

// Now you have full autocomplete and type safety
const project: Project = {
  id: ''...'',
  name: ''Mamalo'',
  // TypeScript will error if you miss a required field
}
```

---

## Edge Functions: When to Use Them

### ✅ Use Edge Functions For:
1. **Secret API Keys**: Stripe, OpenAI, SendGrid
2. **Heavy Computation**: AI processing, image manipulation
3. **Webhooks**: Handling external service callbacks
4. **Complex Business Logic**: Multi-step transactions

### ❌ Don''t Use Edge Functions For:
1. Simple CRUD operations (use Supabase client)
2. Data that can be filtered with RLS
3. Real-time subscriptions (use Supabase Realtime)

### Example: Stripe Webhook
```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@11.1.0"

const stripe = new Stripe(Deno.env.get(''STRIPE_SECRET_KEY'')!, {
  apiVersion: ''2022-11-15'',
})

serve(async (req) => {
  const signature = req.headers.get(''stripe-signature'')!
  const body = await req.text()
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get(''STRIPE_WEBHOOK_SECRET'')!
  )

  // Handle event
  if (event.type === ''checkout.session.completed'') {
    // Update database
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ''Content-Type'': ''application/json'' },
  })
})
```

---

## Storage: Files vs Database

### The Rule
- **Files (images, PDFs, videos)**: Store in Supabase Storage Buckets
- **Metadata (filename, size, URL)**: Store in database

### Example
```typescript
// Upload file to bucket
const { data, error } = await supabase.storage
  .from(''project-files'')
  .upload(`briefings/${projectId}.pdf`, file)

// Store URL in database
await supabase
  .from(''projects'')
  .update({ 
    briefing_url: data.path,
    briefing_filename: file.name 
  })
  .eq(''id'', projectId)
```

---

## Database Design Principles

### 1. Always Use UUIDs
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NOT: id SERIAL PRIMARY KEY
);
```

**Why?** UUIDs prevent enumeration attacks and work better in distributed systems.

### 2. Add Timestamps
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 3. Use Foreign Keys with CASCADE
```sql
project_id UUID REFERENCES projects(id) ON DELETE CASCADE
```

This ensures data integrity and automatic cleanup.

---

## Real-Time Subscriptions

### Subscribe to Changes
```typescript
const subscription = supabase
  .channel(''projects'')
  .on(
    ''postgres_changes'',
    { 
      event: ''*'', 
      schema: ''public'', 
      table: ''projects'' 
    },
    (payload) => {
      console.log(''Change received!'', payload)
      // Update UI
    }
  )
  .subscribe()
```

---

## Common Mistakes

❌ **No RLS**: Leaving tables without policies
✅ **Always RLS**: Enable on every table

❌ **Using `any` types**: Losing type safety
✅ **Generated types**: Full autocomplete

❌ **Storing files in database**: Bloating the DB
✅ **Storage buckets**: Files in buckets, URLs in DB

❌ **Client-side secrets**: API keys in frontend
✅ **Edge Functions**: Secrets in server-side functions',
  '[
    {
      "title": "Enable RLS on Every Table",
      "rule": "No table without Row Level Security. Default is deny all, then explicitly grant access.",
      "code_snippet": "ALTER TABLE projects ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY \"Users manage own\" \n  ON projects FOR ALL \n  USING (auth.uid() = user_id);"
    },
    {
      "title": "Generate TypeScript Types",
      "rule": "Always use generated types. No ''any'' in data calls.",
      "code_snippet": "npx supabase gen types typescript --project-id YOUR_ID > database.types.ts"
    },
    {
      "title": "Use UUIDs, Not Serial IDs",
      "rule": "UUIDs prevent enumeration attacks and work better in distributed systems.",
      "code_snippet": "id UUID PRIMARY KEY DEFAULT gen_random_uuid()"
    },
    {
      "title": "Edge Functions for Secrets",
      "rule": "Use Edge Functions for anything with API keys or heavy computation. Frontend does simple CRUD only.",
      "code_snippet": null
    },
    {
      "title": "Files in Buckets, URLs in DB",
      "rule": "Store files in Supabase Storage, only save the URL/path in the database.",
      "code_snippet": "await supabase.storage.from(''files'').upload(path, file)\nawait supabase.from(''projects'').update({ file_url: path })"
    }
  ]'::jsonb,
  2
);

-- Guide 3: Lovable & UI (The Face)
INSERT INTO vibecode_stack_guides (tool_name, icon, summary, content, best_practices, sort_order) VALUES (
  'Lovable & UI: The Face 🎨',
  'Palette',
  'Create stunning interfaces. shadcn/ui, Tailwind, and the Vibecode aesthetic.',
  '# Lovable & UI: The Face 🎨

## The Vibecode Aesthetic

We build interfaces that feel **premium, fast, and distraction-free**. Think Vercel, Linear, and Stripe—not cluttered dashboards.

---

## Prompting for Design

### The Wrong Way
❌ "Make a dashboard with a sidebar that is 200px wide and has a blue background"

### The Right Way
✅ "Create a modern SaaS dashboard with a minimal sidebar, using a bento-grid layout for metrics cards. Use Tailwind slate-50 background with white cards and subtle shadows."

**Why?** Describe the **structure and feeling**, not the pixels. Let AI handle the details.

---

## The Vibecode UI Stack

### 1. Shadcn/UI (Components)
We build on **shadcn/ui**. Always use these components:

```prompt
Use shadcn/ui components:
- Button (with variants: default, outline, ghost)
- Card (for content containers)
- Dialog (for modals)
- Input, Textarea (for forms)
- Select, Dropdown (for choices)
```

**Why shadcn?** It''s not a library—it''s copy-paste components you own. Full customization, no bloat.

### 2. Tailwind CSS (Styling)
We use **utility-first CSS**. No custom CSS files.

```tsx
// ✅ Good
<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
</div>

// ❌ Bad
<div className="custom-card">
  <h2 className="custom-title">Title</h2>
</div>
```

### 3. Lucide Icons (Icons)
We use **Lucide React** exclusively. No mixing icon libraries.

```tsx
import { Brain, Database, Palette, GitBranch } from ''lucide-react''

<Brain className="w-6 h-6 text-blue-600" />
```

---

## The Vibecode Design Principles

### 1. Mobile-First
Always design for mobile first, then scale up.

```tsx
// ✅ Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### 2. Whitespace is Your Friend
Don''t cram everything together. Use generous padding and margins.

```tsx
// ✅ Breathing room
<div className="p-8 space-y-6">
  <h1 className="text-3xl font-bold mb-4">Title</h1>
  <p className="text-gray-600 leading-relaxed">Content</p>
</div>

// ❌ Cramped
<div className="p-2">
  <h1>Title</h1>
  <p>Content</p>
</div>
```

### 3. Subtle Shadows, No Hard Borders
Use soft shadows instead of harsh borders.

```tsx
// ✅ Soft and modern
<div className="bg-white rounded-lg shadow-sm border border-gray-200">

// ❌ Harsh and dated
<div className="bg-white border-2 border-black">
```

### 4. Consistent Color Palette
Stick to Tailwind''s gray scale for neutrals, and use accent colors sparingly.

```tsx
// Primary: slate-900 (dark text, buttons)
// Secondary: gray-600 (body text)
// Accent: blue-600 (links, highlights)
// Background: slate-50 (page background)
// Cards: white
```

---

## Component Patterns

### Modal (Dialog)
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Project Details</DialogTitle>
    </DialogHeader>
    
    {/* Content */}
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Card with Hover Effect
```tsx
<div className="group bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer">
  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
    Title
  </h3>
  <p className="text-gray-600 text-sm mt-2">
    Description
  </p>
</div>
```

### Form with Validation
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div>
    <Label htmlFor="name">Project Name *</Label>
    <Input
      id="name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="e.g., Mamalo"
      required
    />
  </div>
  
  <Button type="submit" className="w-full">
    Create Project
  </Button>
</form>
```

---

## Responsive Design Checklist

✅ Test on mobile (375px width)
✅ Use `grid` with responsive columns
✅ Stack elements vertically on mobile
✅ Make buttons full-width on mobile
✅ Ensure modals are scrollable
✅ Use `text-sm` on mobile, `text-base` on desktop

---

## The Perfect UI Prompt Template

```prompt
Act as a Senior UI/UX Designer and Frontend Engineer.

Goal: [SPECIFIC UI COMPONENT/PAGE]

Design Requirements:
- Clean, modern SaaS aesthetic (like Vercel/Linear)
- Mobile-first responsive design
- Use shadcn/ui components
- Lucide icons
- Tailwind CSS utility classes

Layout:
- [DESCRIBE STRUCTURE]

Interactions:
- [HOVER STATES, ANIMATIONS, ETC]

Constraints:
- No custom CSS files
- Use Tailwind''s gray/slate palette
- Subtle shadows, no hard borders
- Generous whitespace

Example: "A card with a gradient icon, title, description, and hover effect that scales the icon and changes border color."
```

---

## Common Mistakes

❌ **Mixing icon libraries**: Using Font Awesome + Lucide
✅ **Lucide only**: Consistent icon style

❌ **Custom CSS files**: Creating `.module.css` files
✅ **Tailwind utilities**: All styling in className

❌ **Desktop-first**: Designing for 1920px screens
✅ **Mobile-first**: Start at 375px, scale up

❌ **Hard borders**: `border-2 border-black`
✅ **Soft shadows**: `shadow-sm border border-gray-200`',
  '[
    {
      "title": "Use Shadcn/UI Components",
      "rule": "Always use shadcn/ui for buttons, cards, dialogs, inputs. No other component libraries.",
      "code_snippet": "Use shadcn/ui components:\n- Button (variants: default, outline, ghost)\n- Card, Dialog, Input, Select"
    },
    {
      "title": "Mobile-First Design",
      "rule": "Design for mobile (375px) first, then scale up with md: and lg: breakpoints.",
      "code_snippet": "<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">"
    },
    {
      "title": "Lucide Icons Only",
      "rule": "Use Lucide React exclusively. No mixing icon libraries.",
      "code_snippet": "import { Brain, Database } from ''lucide-react''\n\n<Brain className=\"w-6 h-6 text-blue-600\" />"
    },
    {
      "title": "Tailwind Utilities, No Custom CSS",
      "rule": "All styling in className. No .module.css or custom stylesheets.",
      "code_snippet": "<div className=\"bg-white rounded-lg p-6 shadow-sm border border-gray-200\">"
    },
    {
      "title": "Subtle Shadows, Not Hard Borders",
      "rule": "Use soft shadows and light borders. Avoid harsh black borders.",
      "code_snippet": "shadow-sm border border-gray-200 (not border-2 border-black)"
    },
    {
      "title": "Generous Whitespace",
      "rule": "Don''t cram UI elements. Use p-6, p-8, space-y-6 for breathing room.",
      "code_snippet": "<div className=\"p-8 space-y-6\">"
    }
  ]'::jsonb,
  3
);

-- Guide 4: Ship (GitHub & Vercel)
INSERT INTO vibecode_stack_guides (tool_name, icon, summary, content, best_practices, sort_order) VALUES (
  'Ship: GitHub & Vercel 🚀',
  'GitBranch',
  'Deploy safely. Master feature branches, pull requests, and environment management.',
  '# Ship: GitHub & Vercel 🚀

## The Sacred Rule: Main is Production

At Vibecode, the `main` branch is **holy**. It represents what''s live. Never commit directly to main.

---

## The GitHub Flow

### 1. Create a Feature Branch
```bash
# Always branch from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-pdf-upload
```

**Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation updates

### 2. Make Your Changes
Work on your feature. Commit often with clear messages.

```bash
git add .
git commit -m "feat: add PDF upload to project modal"
```

**Commit Message Format:**
```
type: short description

Longer explanation if needed.

- Detail 1
- Detail 2
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructure
- `docs:` - Documentation
- `style:` - Formatting, no code change
- `test:` - Adding tests

### 3. Push and Create Pull Request
```bash
git push origin feature/add-pdf-upload
```

Then on GitHub:
1. Click "Create Pull Request"
2. Write a clear description
3. Request review (if working with team)

### 4. Review Deploy Preview
Vercel automatically creates a preview URL for every PR. **Always test this before merging.**

### 5. Merge to Main
Once approved and tested:
1. Click "Merge Pull Request"
2. Delete the feature branch
3. Vercel auto-deploys to production

---

## Environment Variables: The Security Rule

### ❌ NEVER Do This
```typescript
// ❌ NEVER hardcode secrets
const apiKey = ''sk_live_abc123''

// ❌ NEVER commit .env to Git
// .env should be in .gitignore
```

### ✅ Always Do This

**1. Local Development (.env.local)**
```bash
# .env.local (never committed)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Secret, server-side only
STRIPE_SECRET_KEY=sk_test_...
```

**2. Vercel Dashboard**
Go to Project Settings → Environment Variables:
- Add all variables
- Separate values for Production, Preview, Development
- Use `NEXT_PUBLIC_` prefix for client-side variables

**3. Access in Code**
```typescript
// Client-side (browser can see this)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Server-side only (API routes, Edge Functions)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
```

---

## Vercel Deployment Workflow

### Automatic Deployments
Vercel watches your GitHub repo:

1. **Push to `main`** → Production deployment
2. **Push to any branch** → Preview deployment
3. **Open PR** → Preview deployment with unique URL

### Deploy Previews: Your Safety Net
Every PR gets a preview URL like:
```
https://your-app-git-feature-add-pdf-upload-yourteam.vercel.app
```

**Before merging, always:**
✅ Click the preview link
✅ Test the new feature
✅ Check for visual bugs
✅ Verify mobile responsiveness

---

## The Pre-Merge Checklist

Before clicking "Merge Pull Request":

✅ **Code Review**: Read the diff, check for mistakes
✅ **Deploy Preview**: Test the preview URL thoroughly
✅ **No Console Errors**: Check browser console
✅ **Mobile Test**: View on phone or use DevTools
✅ **Breaking Changes**: Ensure no existing features broke
✅ **Environment Variables**: Verify all secrets are in Vercel, not code

---

## Common Workflows

### Hotfix (Urgent Bug in Production)
```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b fix/urgent-auth-bug

# Fix the bug
git add .
git commit -m "fix: resolve auth redirect loop"

# Push and create PR
git push origin fix/urgent-auth-bug

# Test preview, then merge immediately
```

### Feature Development
```bash
# Branch from main
git checkout -b feature/project-pipeline

# Work on feature (multiple commits)
git commit -m "feat: add project schema"
git commit -m "feat: build kanban UI"
git commit -m "feat: add drag-drop logic"

# Push when ready
git push origin feature/project-pipeline

# Create PR, test preview, get review, merge
```

### Updating Your Branch
If `main` has new commits while you''re working:
```bash
# Get latest main
git checkout main
git pull origin main

# Merge into your feature branch
git checkout feature/your-feature
git merge main

# Or rebase (cleaner history)
git rebase main
```

---

## Rollback Strategy

### If Production Breaks
1. **Immediate**: Revert the last deployment in Vercel dashboard
2. **Fix**: Create a hotfix branch
3. **Deploy**: Merge hotfix to restore production

### Vercel Rollback
In Vercel dashboard:
1. Go to Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

---

## Common Mistakes

❌ **Committing to main directly**: Bypassing the review process
✅ **Feature branches**: Always branch, PR, review, merge

❌ **Secrets in code**: Hardcoding API keys
✅ **Environment variables**: All secrets in Vercel dashboard

❌ **Skipping deploy preview**: Merging without testing
✅ **Test preview first**: Always click the preview URL

❌ **Vague commits**: "fix stuff"
✅ **Clear commits**: "fix: resolve user auth redirect bug"

❌ **Forgetting .gitignore**: Committing .env files
✅ **.gitignore**: Ensure .env* is ignored',
  '[
    {
      "title": "Main Branch is Production",
      "rule": "Never commit directly to main. Always use feature branches and pull requests.",
      "code_snippet": "git checkout -b feature/add-pdf-upload\n# Make changes\ngit push origin feature/add-pdf-upload\n# Create PR on GitHub"
    },
    {
      "title": "Clear Commit Messages",
      "rule": "Use conventional commits: feat:, fix:, refactor:, docs:. Explain WHY, not just WHAT.",
      "code_snippet": "git commit -m \"feat: add PDF upload to project modal\"\ngit commit -m \"fix: resolve auth redirect loop\""
    },
    {
      "title": "Environment Variables in Vercel",
      "rule": "Never commit secrets. All API keys go in Vercel dashboard, not in code.",
      "code_snippet": "# .env.local (gitignored)\nSTRIPE_SECRET_KEY=sk_test_...\n\n# Access in code\nprocess.env.STRIPE_SECRET_KEY"
    },
    {
      "title": "Test Deploy Previews",
      "rule": "Every PR gets a preview URL. Always test it before merging to production.",
      "code_snippet": null
    },
    {
      "title": "Use .gitignore",
      "rule": "Ensure .env, .env.local, and other secrets are in .gitignore. Never commit them.",
      "code_snippet": "# .gitignore\n.env\n.env.local\n.env*.local"
    }
  ]'::jsonb,
  4
);
