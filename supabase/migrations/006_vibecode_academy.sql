-- Vibecode Academy: Learning & Onboarding Module
-- This creates a documentation hub for teaching the Vibecode tech stack and standards

-- 1. Academy Modules (The 4 Pillars)
CREATE TABLE academy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., "The Brain: Windsurf & Prompting"
  description TEXT,
  icon TEXT, -- Lucide icon name (e.g., 'Brain', 'Database', 'Palette', 'GitBranch')
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Academy Chapters (Individual Lessons/Guides)
CREATE TABLE academy_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES academy_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g., "Writing the Perfect Prompt"
  content TEXT NOT NULL, -- Longform Markdown
  video_url TEXT, -- Optional Loom/YouTube embed
  estimated_read_time INT, -- in minutes
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read, admins can write
CREATE POLICY "Public read access for modules" 
  ON academy_modules FOR SELECT 
  USING (true);

CREATE POLICY "Public read access for chapters" 
  ON academy_chapters FOR SELECT 
  USING (true);

-- For now, allow all authenticated users to manage (refine later with admin roles)
CREATE POLICY "Authenticated users can manage modules" 
  ON academy_modules FOR ALL 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage chapters" 
  ON academy_chapters FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_academy_modules_sort ON academy_modules(sort_order);
CREATE INDEX idx_academy_chapters_module ON academy_chapters(module_id, sort_order);

-- Updated_at trigger for modules
CREATE TRIGGER update_academy_modules_updated_at
  BEFORE UPDATE ON academy_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for chapters
CREATE TRIGGER update_academy_chapters_updated_at
  BEFORE UPDATE ON academy_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Data: The 4 Pillars of Vibecode Academy
INSERT INTO academy_modules (title, description, icon, sort_order) VALUES
(
  'The Brain: Windsurf & Prompting 🧠',
  'Master AI-assisted development. Learn to direct, not code. Understand the golden prompt formula and Cascade mode.',
  'Brain',
  1
),
(
  'The Skeleton: Supabase & Data 🦴',
  'Backend mastery with Supabase. RLS policies, multi-tenancy, Edge Functions, and database design principles.',
  'Database',
  2
),
(
  'The Face: Lovable & UI Design 🎨',
  'Create stunning interfaces. Learn shadcn/ui, Tailwind best practices, and the Vibecode aesthetic principles.',
  'Palette',
  3
),
(
  'The Flow: GitHub & Deployment 🚀',
  'Ship code safely. Master feature branches, pull requests, code reviews, and environment management.',
  'GitBranch',
  4
);

-- Seed First Chapter: The Golden Prompting Guide
INSERT INTO academy_chapters (
  module_id,
  title,
  content,
  estimated_read_time,
  sort_order
) VALUES (
  (SELECT id FROM academy_modules WHERE title LIKE '%Brain%' LIMIT 1),
  'The Vibecode Prompting Standard',
  '# The Vibecode Prompting Standard

## Why This Matters

At Vibecode, we don''t write code from scratch—we **direct AI** to build it for us. But AI is only as good as your instructions. A vague prompt gets vague code. A precise prompt gets production-ready components.

This guide teaches you **The Golden Prompt Formula** that every Vibecode developer must follow.

---

## The Golden Prompt Formula

Every prompt you write to Windsurf Cascade must contain these 4 elements:

### 1. **Role** (Who is the AI?)
Start by defining the expertise level:

```
Act as a Senior Frontend Engineer specializing in React and TypeScript.
```

**Why?** This primes the AI to think at the right level of abstraction.

### 2. **Goal** (What do you want?)
Be specific about the outcome:

```
Build a reusable modal component that can display project details with edit and archive actions.
```

**Why?** Vague goals like "make a modal" lead to generic solutions.

### 3. **Context** (What''s the tech stack?)
Always specify your exact setup:

```
We use Next.js 14 App Router, Tailwind CSS, shadcn/ui components, and Lucide icons.
```

**Why?** Without this, AI might use CSS modules, Material-UI, or other tools we don''t use.

### 4. **Constraints** (What are the rules?)
Define what NOT to do:

```
- Use Tailwind classes only, no custom CSS
- Make it mobile-responsive
- Add backdrop click to close
- Include proper TypeScript types
```

**Why?** Constraints prevent the AI from making decisions that violate our standards.

---

## The 3 Hard Rules

These are **non-negotiable** at Vibecode:

### Rule 1: Always Ask for a Plan First
❌ **Wrong:**
```
Build me a user dashboard with charts and filters.
```

✅ **Right:**
```
I need a user dashboard. First, create a plan outlining:
1. Component structure
2. Data fetching strategy
3. State management approach
4. UI layout

Then we''ll implement it step by step.
```

**Why?** Planning prevents rework. AI that jumps straight to code often misses edge cases.

---

### Rule 2: Use React Query, Not useEffect
❌ **Wrong:**
```
Use useEffect to fetch user data when the component mounts.
```

✅ **Right:**
```
Use @tanstack/react-query to fetch user data. Set up proper caching and error handling.
```

**Why?** `useEffect` for data fetching is an anti-pattern. React Query handles caching, refetching, and loading states automatically.

---

### Rule 3: Never Delete Code You Don''t Understand
❌ **Wrong:**
```
Remove all the commented code and clean this up.
```

✅ **Right:**
```
Explain what each commented section does before we decide to remove it.
```

**Why?** That "useless" code might be handling an edge case you haven''t encountered yet.

---

## Example: A Perfect Vibecode Prompt

Here''s a real prompt that follows all the rules:

```
Act as a Senior Full-Stack Engineer with expertise in Next.js and Supabase.

Goal: Build a project pipeline Kanban board with drag-and-drop functionality.

Context:
- Next.js 14 App Router
- Supabase for backend
- dnd-kit for drag-and-drop
- Tailwind CSS + shadcn/ui
- Lucide icons

Requirements:
1. 6 columns: Prospect, Offer Sent, Setup, In Progress, Review, Done
2. Each project card shows: name, client, type badge, quote amount
3. Drag cards between columns to update status
4. Show confetti when a project reaches "Done"
5. Add modal for project details with edit/archive actions

Constraints:
- Use proper TypeScript types
- Make columns droppable zones with useDroppable
- Add visual feedback (ring) when dragging over a column
- Ensure modals are scrollable and closeable via backdrop click
- Store files (briefing, step plan) as File objects with download capability

First, create a plan. Then implement.
```

**Result:** Production-ready code in one shot.

---

## Practice Exercise

Rewrite this bad prompt using the Golden Formula:

**Bad Prompt:**
```
Make a login page.
```

**Your Turn:** *(Try it before looking at the answer below)*

---

**Good Prompt:**
```
Act as a Senior Frontend Engineer.

Goal: Build a login page with email/password authentication.

Context:
- Next.js 14 App Router
- Supabase Auth
- Tailwind CSS + shadcn/ui form components
- React Hook Form for validation

Requirements:
1. Email and password inputs with proper validation
2. "Remember me" checkbox
3. "Forgot password?" link
4. Error handling for invalid credentials
5. Redirect to /dashboard on success

Constraints:
- Use shadcn/ui Input and Button components
- Add loading state during authentication
- Show error messages below the form
- Mobile-responsive design

First, outline the component structure and form validation logic.
```

---

## Next Steps

Now that you understand the Vibecode Prompting Standard, practice it on every task. Your next chapter will cover **Cascade Mode** and how to use context-aware conversations effectively.

**Remember:** Good prompts = Good code. Master this, and you''ll 10x your productivity.
',
  15,
  1
);

-- Add more seed chapters for the Brain module
INSERT INTO academy_chapters (
  module_id,
  title,
  content,
  estimated_read_time,
  sort_order
) VALUES (
  (SELECT id FROM academy_modules WHERE title LIKE '%Brain%' LIMIT 1),
  'Cascade Mode: Context-Aware Development',
  '# Cascade Mode: Context-Aware Development

## What is Cascade?

Cascade is Windsurf''s context-aware chat mode. Unlike regular AI chat, Cascade can:
- Read your entire codebase
- Understand file relationships
- Make multi-file edits
- Remember previous conversations

Think of it as having a senior developer who has read every line of your code.

---

## When to Use Cascade

✅ **Use Cascade for:**
- Building new features across multiple files
- Refactoring existing code
- Debugging complex issues
- Understanding how systems connect

❌ **Don''t use Cascade for:**
- Simple one-line fixes (use inline edit)
- Questions about external libraries (use web search)
- Generating boilerplate (use snippets)

---

## Best Practices

### 1. Start with Context
Before asking Cascade to build something, let it read the relevant files:

```
Read the project structure in /app/projects and explain how the Kanban board works.
```

### 2. Be Explicit About Scope
```
We need to add PDF upload to projects. This will affect:
- The Project interface in page.tsx
- The database migration in 005_projects_pipeline.sql
- The ProjectFormModal component

Start by updating the database schema.
```

### 3. Review Before Accepting
Cascade can make mistakes. Always:
- Read the diff before accepting changes
- Test the functionality
- Check for unintended side effects

---

## Next Chapter

Learn about the **3 Hard Rules** that prevent common mistakes in Vibecode projects.
',
  10,
  2
);
