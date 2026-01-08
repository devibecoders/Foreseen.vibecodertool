-- ============================================================================
-- VIBECODE CORE: CONTENT UITBREIDINGEN
-- Checklists, Troubleshooting, Snippets, Architecture, en Onboarding
-- Run dit NA de basis seed (009)
-- ============================================================================


-- ============================================================================
-- NIEUWE GLOSSARY TERMEN
-- ============================================================================

INSERT INTO vibecode_glossary (term, definition, technical_context) VALUES

-- Development Terms
('PR (Pull Request)',
 'Een verzoek om jouw code-wijzigingen samen te voegen met de hoofdcode. Andere teamleden kunnen je code reviewen voordat het live gaat.',
 'In GitHub maak je een PR aan nadat je klaar bent met een feature branch. De PR toont alle wijzigingen (diff) zodat reviewers kunnen zien wat er verandert. Na goedkeuring wordt de code "gemerged" naar main.'),

('Merge',
 'Het samenvoegen van code uit één branch naar een andere. Meestal merge je een feature branch naar main nadat je PR is goedgekeurd.',
 'Git probeert automatisch de code samen te voegen. Als twee mensen dezelfde regels hebben aangepast, krijg je een "merge conflict" dat je handmatig moet oplossen.'),

('Diff',
 'Het verschil tussen twee versies van code. Groene regels zijn toegevoegd, rode regels zijn verwijderd.',
 'Altijd de diff lezen voordat je code accepteert! Dit is hoe je fouten opmerkt die AI of jijzelf hebt gemaakt. In Windsurf zie je de diff in de Accept/Reject view.'),

('Branch',
 'Een aparte "tak" van je code waar je veilig kunt experimenteren zonder de hoofdcode (main) te beïnvloeden.',
 'Gebruik branches voor elke feature of bugfix. Naamconventie: feature/add-login, fix/button-color, refactor/auth-flow. Na merge kun je de branch verwijderen.'),

('Commit',
 'Een "snapshot" van je code op een bepaald moment. Zoals een savepoint in een game.',
 'Commit vaak met duidelijke berichten: "feat: add login button" of "fix: resolve auth error". Kleine, frequente commits zijn beter dan één grote commit.'),

('Build',
 'Het proces waarbij je broncode wordt omgezet naar een draaibare applicatie. Bij ons: Next.js compileert je React code.',
 'npm run build maakt een productie-versie van je app. Als de build faalt, is er een fout in je code (TypeScript error, missing import, etc). Fix dit voordat je deployed.'),

('Linting',
 'Automatische controle van je code op veelvoorkomende fouten en stijlproblemen.',
 'ESLint controleert JavaScript/TypeScript code. Het waarschuwt voor dingen als: unused variables, missing dependencies in useEffect, accessibility issues. Behandel lint warnings serieus!'),

('Refactoring',
 'Je code verbeteren zonder het gedrag te veranderen. Schonere code, betere structuur, maar exact dezelfde functionaliteit.',
 'Refactor regelmatig om "tech debt" te voorkomen. Voorbeelden: hernoemen voor duidelijkheid, duplicatie verwijderen, grote functies opsplitsen. Test altijd na refactoring!'),

('Tech Debt (Technische Schuld)',
 'Snelle, "vuile" oplossingen die later tijd kosten om op te ruimen. Zoals een lening: je betaalt later met rente.',
 'Soms is tech debt acceptabel (deadline halen), maar documenteer het! Voeg een // TODO: comment toe. Plan tijd in om tech debt af te lossen.'),

('Dependency',
 'Een externe package/library waar je project van afhankelijk is. Bijvoorbeeld: React, Tailwind, Supabase.',
 'Dependencies worden beheerd in package.json. npm install voegt ze toe. Update regelmatig voor security fixes, maar test na elke update. Minder dependencies = minder risico.'),

('Runtime',
 'Het moment dat je code daadwerkelijk draait (in de browser of op de server). Tegenover "compile time" (wanneer code wordt gebouwd).',
 'Runtime errors zijn fouten die pas verschijnen als de code draait. TypeScript vangt veel fouten op bij compile time, maar sommige (zoals null values van APIs) gebeuren runtime.'),

('Caching',
 'Het tijdelijk opslaan van data zodat je het niet opnieuw hoeft op te halen. Maakt apps sneller.',
 'React Query cachet automatisch API responses. Supabase cachet ook data. Let op: na een mutatie (create/update/delete) moet je de cache invalideren zodat je verse data ziet.'),

('Mutation',
 'Een operatie die data verandert (create, update, delete). Tegenover een "query" die alleen data ophaalt.',
 'In React Query: useQuery voor ophalen, useMutation voor wijzigen. Na een mutation moet je vaak de cache refreshen met queryClient.invalidateQueries().'),

('SSR (Server-Side Rendering)',
 'De server maakt de HTML klaar voordat het naar de browser wordt gestuurd. Sneller voor de eerste pageload.',
 'Next.js doet SSR standaard met Server Components. De gebruiker ziet sneller content, en SEO is beter. Client Components worden later "gehydrated" voor interactiviteit.'),

('CSR (Client-Side Rendering)',
 'De browser maakt de HTML nadat JavaScript is geladen. Flexibeler voor interactiviteit, maar langzamere eerste load.',
 'Pure React apps zijn CSR. In Next.js gebruik je Client Components ("use client") voor CSR delen — alleen waar je interactiviteit nodig hebt.'),

('Hot Reload',
 'Je wijzigingen verschijnen direct in de browser zonder dat je de hele app hoeft te herstarten.',
 'Next.js dev server heeft Hot Reload ingebouwd. Soms werkt het niet goed (na package install of grote changes) — dan even de server herstarten: Ctrl+C en npm run dev.'),

('Environment (Environment)',
 'De omgeving waarin je code draait: development (je laptop), staging (test server), production (live voor gebruikers).',
 'Elke environment heeft eigen ENV variables. NOOIT production database aanpassen vanuit development! Altijd dubbel checken welke environment je gebruikt.');


-- ============================================================================
-- STACK GUIDES: CHECKLISTS & TEMPLATES
-- ============================================================================

INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Checklists & Templates 📋',
  'CheckSquare',
  'checklists',
  'Workflow',
  'Herbruikbare checklists voor projecten, code reviews, en deployments. Zorg dat je niets vergeet.',
  '# Checklists & Templates 📋

Consistentie is key. Gebruik deze checklists om ervoor te zorgen dat je niets belangrijks vergeet.

---

## 🚀 Project Kickoff Checklist

Wanneer je begint aan een nieuw project of feature:

### Stap 1: Repository & Tooling
- [ ] Repository gecloned en lokaal werkend (`npm install` + `npm run dev`)
- [ ] Juiste branch gemaakt (`feature/naam-van-feature`)
- [ ] Windsurf geopend in de project folder
- [ ] `.env.local` bestand aanwezig met alle variabelen

### Stap 2: Supabase Setup (als nieuw project)
- [ ] Supabase project aangemaakt
- [ ] Database tabellen gemaakt via migraties (niet via UI!)
- [ ] RLS enabled op ALLE tabellen
- [ ] TypeScript types gegenereerd (`npx supabase gen types typescript`)

### Stap 3: Begrijp de Context
- [ ] README.md gelezen
- [ ] Bestaande code structuur begrepen
- [ ] De specifieke requirements duidelijk
- [ ] Vragen gesteld als iets onduidelijk is

### Stap 4: Plan Maken
- [ ] Cascade gevraagd om een plan te maken
- [ ] Plan gereviewed en goedgekeurd
- [ ] Grote taken opgesplitst in kleine stappen

---

## 🔍 Code Review Checklist

Voordat je een PR (Pull Request) maakt, controleer:

### Functionaliteit
- [ ] Feature werkt zoals beschreven
- [ ] Edge cases getest (lege inputs, errors, etc.)
- [ ] Geen console.log statements vergeten
- [ ] Error handling aanwezig waar nodig

### Code Kwaliteit
- [ ] TypeScript types correct (geen `any`)
- [ ] Geen duplicate code (DRY — Don''t Repeat Yourself)
- [ ] Functies en variabelen hebben duidelijke namen
- [ ] Comments toegevoegd waar de code niet vanzelfsprekend is

### Security
- [ ] Geen secrets/API keys hardcoded
- [ ] RLS policies toegevoegd voor nieuwe tabellen
- [ ] Input validatie voor user-generated content
- [ ] Geen SQL in frontend code

### Styling & UX
- [ ] Mobile responsive (getest op 375px)
- [ ] Tailwind classes gebruikt (geen custom CSS)
- [ ] Consistente spacing (p-4, p-6, gap-4)
- [ ] Loading states waar nodig
- [ ] Error states met duidelijke feedback

### Final Check
- [ ] `npm run build` succesvol (geen errors)
- [ ] Diff gelezen — alle wijzigingen begrepen
- [ ] Ongewenste wijzigingen teruggedraaid

---

## 🚢 Deployment Checklist

Voordat je naar production gaat:

### Pre-Deploy
- [ ] Alle tests passing
- [ ] Build succesvol (`npm run build`)
- [ ] Code gereviewed en gemerged naar main
- [ ] Environment variables correct in Vercel/production

### Database
- [ ] Migraties draaien in production Supabase
- [ ] RLS policies getest met echte accounts
- [ ] Backup gemaakt van productie database (als grote wijziging)

### Post-Deploy
- [ ] Site bezocht en getest op production URL
- [ ] Core flows getest (login, main features)
- [ ] Console gecheckt op errors
- [ ] Team op de hoogte gebracht van de release

---

## 📝 Feature Request Template

Gebruik dit format wanneer je een feature start:

```
## Feature: [Naam van de Feature]

### Doel
Wat moet deze feature doen? Waarom is het nodig?

### Acceptatiecriteria
- [ ] Criterium 1
- [ ] Criterium 2
- [ ] Criterium 3

### Technische Notities
- Welke bestanden worden geraakt?
- Zijn er database wijzigingen nodig?
- Dependencies of externe APIs?

### Design
[Link naar design of beschrijving van UI]

### Vragen
- Vraag 1?
- Vraag 2?
```

---

## 🐛 Bug Report Template

```
## Bug: [Korte beschrijving]

### Stappen om te reproduceren
1. Ga naar...
2. Klik op...
3. Zie error

### Verwacht gedrag
Wat zou er moeten gebeuren?

### Werkelijk gedrag
Wat gebeurt er nu?

### Screenshots/Logs
[Plak screenshots of console errors]

### Environment
- Browser: Chrome/Safari/Firefox
- URL: production/staging/localhost
- User: logged in / logged out
```',
  '[
    "Gebruik altijd de Project Kickoff checklist bij een nieuw project",
    "NOOIT code pushen zonder de Code Review checklist doorlopen te hebben",
    "Bij elke deployment: de Deployment checklist is verplicht",
    "Documenteer features en bugs met de templates — consistentie helpt iedereen"
  ]'::jsonb,
  10
);


-- ============================================================================
-- STACK GUIDES: TROUBLESHOOTING
-- ============================================================================

INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Troubleshooting Guide 🔧',
  'Wrench',
  'troubleshooting',
  'Skill',
  'Veelvoorkomende errors en hoe je ze oplost. Bespaar uren debuggen.',
  '# Troubleshooting Guide 🔧

Errors zijn onvermijdelijk. Deze guide helpt je de meest voorkomende problemen snel op te lossen.

---

## 🔴 Hydration Errors

### De Error
```
Text content does not match server-rendered HTML.
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

### Wat Betekent Dit?
De server heeft andere HTML gemaakt dan de browser verwacht. React raakt in de war en crasht.

### Oorzaken & Oplossingen

**1. Datum/Tijd rendering**
```tsx
// ❌ FOUT: new Date() geeft andere waarde op server vs client
<p>Vandaag is het {new Date().toLocaleDateString()}</p>

// ✅ GOED: Render alleen op client
const [date, setDate] = useState<string>()
useEffect(() => {
  setDate(new Date().toLocaleDateString())
}, [])
```

**2. window/document gebruik in Server Components**
```tsx
// ❌ FOUT: window bestaat niet op server
const width = window.innerWidth

// ✅ GOED: Check of we in browser zijn
const [width, setWidth] = useState(0)
useEffect(() => {
  setWidth(window.innerWidth)
}, [])
```

**3. Extensions die HTML aanpassen**
Browser extensions (Grammarly, etc.) kunnen HTML manipuleren. Test in incognito mode.

---

## 🔴 RLS Policy Errors

### De Error
```
new row violates row-level security policy for table "projects"
```

### Wat Betekent Dit?
Je probeert data te lezen/schrijven waar je geen toegang toe hebt volgens de RLS regels.

### Checklist
1. **Is RLS enabled?** → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. **Bestaat er een policy?** → Check Supabase dashboard > Authentication > Policies
3. **Is de user ingelogd?** → `auth.uid()` returnt NULL voor niet-ingelogde users
4. **Klopt de policy conditie?** → Test met SQL: `SELECT auth.uid()`

### Voorbeeld Fix
```sql
-- Zorg dat users alleen eigen data zien
CREATE POLICY "Users manage own data"
  ON projects FOR ALL
  USING (auth.uid() = user_id);
```

---

## 🔴 "Module not found" Errors

### De Error
```
Module not found: Can''t resolve ''@/components/Button''
```

### Checklist
1. **Klopt de path?** → Check of het bestand bestaat op die locatie
2. **Klopt de case?** → Mac is case-insensitive, Linux niet! `Button.tsx` ≠ `button.tsx`
3. **Is het bestand opgeslagen?** → Soms vergeet je op te slaan
4. **Restart de dev server** → `Ctrl+C` en `npm run dev`

---

## 🔴 TypeScript Errors

### "Property does not exist on type"
```tsx
// ❌ Error: Property ''name'' does not exist on type ''unknown''
const data = await response.json()
console.log(data.name)

// ✅ GOED: Type expliciet definiëren
interface User {
  name: string
  email: string
}
const data: User = await response.json()
console.log(data.name)
```

### "Argument of type X is not assignable to type Y"
Je geeft het verkeerde type mee. Check wat de functie verwacht:
```tsx
// De functie verwacht een string, maar krijgt number
setCount("5")  // ❌ Error als count een number is
setCount(5)    // ✅ Correct
```

---

## 🔴 Supabase Connection Errors

### "Invalid API key"
- Check `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Geen quotes om de values heen
- Restart dev server na .env wijzigingen

### "relation does not exist"
De tabel bestaat niet (of in een ander schema):
```sql
-- Check welke tabellen bestaan
SELECT table_name FROM information_schema.tables 
WHERE table_schema = ''public'';
```

### Queries geven lege arrays terug
1. **Is er data?** → Check in Supabase Table Editor
2. **Is RLS het probleem?** → Tijdelijk uitschakelen om te testen (ZET TERUG AAN!)
3. **Klopt je filter?** → Print de query om te debuggen

---

## 🔴 Build Errors

### "npm run build" faalt

**Stap 1: Lees de error message**
De eerste error is meestal de belangrijkste. Scroll omhoog.

**Stap 2: Veelvoorkomende oorzaken**
- TypeScript error → Fix de type error
- Missing import → Voeg de import toe
- Unused variable → Verwijder of gebruik het
- ESLint error → Fix volgens de melding

**Stap 3: Clean rebuild**
```bash
rm -rf .next
npm run build
```

---

## 🔴 Infinite Re-render Loop

### Symptomen
- Browser wordt traag/crasht
- Console vol met dezelfde logs
- "Maximum update depth exceeded" error

### Oorzaken

**1. useEffect zonder dependency array**
```tsx
// ❌ FOUT: Draait elke render, wat weer een render veroorzaakt
useEffect(() => {
  setCount(count + 1)
})

// ✅ GOED: Draait alleen eenmaal
useEffect(() => {
  setCount(count + 1)
}, []) // Lege array = alleen bij mount
```

**2. Object/Array in dependency array**
```tsx
// ❌ FOUT: Nieuw object elke render = oneindige loop
useEffect(() => {
  doSomething()
}, [{ name: "John" }]) // Object is elke keer "nieuw"

// ✅ GOED: Primitives of useMemo
const config = useMemo(() => ({ name: "John" }), [])
useEffect(() => {
  doSomething()
}, [config])
```

---

## 💡 Algemene Debug Tips

1. **Console.log strategisch** → Log voor en na problematische code
2. **Lees de hele error** → Scroll naar de eerste error, niet de laatste
3. **Google de error** → Iemand anders heeft dit ook gehad
4. **Vraag Cascade** → Plak de error + relevante code
5. **Neem een pauze** → Frisse ogen zien meer
6. **Rubber Duck Debugging** → Leg het probleem hardop uit

---

## 🆘 Als Niets Werkt

1. `rm -rf node_modules && npm install`
2. `rm -rf .next && npm run dev`
3. Check of je op de juiste branch zit
4. Vraag een collega om mee te kijken
5. Sleep er een nachtje over — echt!',
  '[
    "Lees ALTIJD de volledige error message — de eerste error is het belangrijkst",
    "Hydration errors: check op Date, window, en browser extensions",
    "RLS errors: check policies EN of de user is ingelogd",
    "Bij twijfel: rm -rf .next && npm run dev"
  ]'::jsonb,
  11
);


-- ============================================================================
-- STACK GUIDES: CODE SNIPPETS
-- ============================================================================

INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Code Snippets Library 📦',
  'Code',
  'snippets',
  'Skill',
  'Copy-paste ready code patterns voor veelvoorkomende taken. Tijd besparen, fouten voorkomen.',
  '# Code Snippets Library 📦

Dit zijn geteste, productie-klare code snippets die je direct kunt gebruiken.

---

## 🔐 Supabase Client Setup

### In een Next.js project (App Router)

```typescript
// lib/supabase.ts
import { createClient } from ''@supabase/supabase-js''

// Voor client-side gebruik
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Server-side met Service Role (Edge Functions)
```typescript
// Voor server-side met admin rechten
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Geheim! Alleen server-side
)
```

---

## 📊 Data Fetching met React Query

### Query (data ophalen)
```typescript
import { useQuery } from ''@tanstack/react-query''
import { supabase } from ''@/lib/supabase''

function useProjects() {
  return useQuery({
    queryKey: [''projects''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(''projects'')
        .select(''*'')
        .order(''created_at'', { ascending: false })
      
      if (error) throw error
      return data
    }
  })
}

// Gebruik in component
function ProjectList() {
  const { data: projects, isLoading, error } = useProjects()
  
  if (isLoading) return <div>Laden...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <ul>
      {projects?.map(project => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}
```

### Mutation (data wijzigen)
```typescript
import { useMutation, useQueryClient } from ''@tanstack/react-query''

function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newProject: { name: string }) => {
      const { data, error } = await supabase
        .from(''projects'')
        .insert(newProject)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Ververs de project lijst
      queryClient.invalidateQueries({ queryKey: [''projects''] })
    }
  })
}

// Gebruik in component
function CreateProjectForm() {
  const mutation = useCreateProject()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ name: ''Nieuw Project'' })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <button disabled={mutation.isPending}>
        {mutation.isPending ? ''Bezig...'' : ''Aanmaken''}
      </button>
    </form>
  )
}
```

---

## 📝 Form met React Hook Form

```typescript
import { useForm } from ''react-hook-form''

interface FormData {
  name: string
  email: string
  message: string
}

function ContactForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset 
  } = useForm<FormData>()
  
  const onSubmit = async (data: FormData) => {
    try {
      await submitToAPI(data)
      reset() // Form leegmaken na success
    } catch (error) {
      console.error(''Submit failed:'', error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Naam *</label>
        <input 
          {...register(''name'', { required: ''Naam is verplicht'' })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <label>Email *</label>
        <input 
          type="email"
          {...register(''email'', { 
            required: ''Email is verplicht'',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: ''Ongeldig email adres''
            }
          })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {isSubmitting ? ''Verzenden...'' : ''Verstuur''}
      </button>
    </form>
  )
}
```

---

## 🎨 Modal/Dialog Pattern

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from ''@/components/ui/dialog''
import { Button } from ''@/components/ui/button''
import { useState } from ''react''

function ConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleConfirm = () => {
    // Actie uitvoeren
    console.log(''Bevestigd!'')
    setIsOpen(false)
  }
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Verwijderen
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weet je het zeker?</DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600">
            Dit kan niet ongedaan worden gemaakt.
          </p>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## ⏳ Loading & Error States

```typescript
interface AsyncStateProps {
  isLoading: boolean
  error: Error | null
  children: React.ReactNode
}

function AsyncState({ isLoading, error, children }: AsyncStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Er ging iets mis</p>
        <p className="text-red-600 text-sm">{error.message}</p>
      </div>
    )
  }
  
  return <>{children}</>
}

// Gebruik
<AsyncState isLoading={isLoading} error={error}>
  <ProjectList projects={data} />
</AsyncState>
```

---

## 🔄 Debounce Hook (voor zoeken)

```typescript
import { useState, useEffect } from ''react''

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

// Gebruik in zoekfunctie
function SearchInput() {
  const [query, setQuery] = useState('''')
  const debouncedQuery = useDebounce(query, 300) // Wacht 300ms
  
  // Zoek alleen als debouncedQuery verandert
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery)
    }
  }, [debouncedQuery])
  
  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Zoeken..."
    />
  )
}
```

---

## 📱 Responsive Container

```typescript
function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  )
}
```

---

## 🎯 Type-safe Event Handlers

```typescript
// Button click
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault()
  // ...
}

// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
}

// Form submit
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  // ...
}
```',
  '[
    "Kopieer snippets, maar BEGRIJP wat ze doen voordat je ze gebruikt",
    "Pas types aan naar jouw data structuur",
    "Test altijd na het implementeren",
    "Vraag Cascade om uitleg als iets onduidelijk is"
  ]'::jsonb,
  12
);


-- ============================================================================
-- STACK GUIDES: ARCHITECTURE PATTERNS
-- ============================================================================

INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Architecture Patterns 🏗️',
  'Building',
  'architecture',
  'Skill',
  'Hoe we onze code organiseren. Folder structuur, naming conventions, en best practices.',
  '# Architecture Patterns 🏗️

Goede architectuur maakt je code begrijpelijk, onderhoudbaar, en schaalbaar.

---

## 📁 Folder Structuur

Dit is onze standaard Next.js App Router structuur:

```
project/
├── app/                    # Routes en pagina''s
│   ├── api/               # API routes
│   │   └── users/
│   │       └── route.ts   # /api/users endpoint
│   ├── dashboard/
│   │   └── page.tsx       # /dashboard pagina
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home pagina (/)
│
├── components/            # Herbruikbare UI componenten
│   ├── ui/               # Basis componenten (Button, Input, Card)
│   └── features/         # Feature-specifieke componenten
│       ├── ProjectCard.tsx
│       └── UserAvatar.tsx
│
├── lib/                   # Utilities en configuratie
│   ├── supabase.ts       # Supabase client
│   ├── utils.ts          # Helper functies
│   └── constants.ts      # Constanten
│
├── hooks/                 # Custom React hooks
│   ├── useProjects.ts
│   └── useAuth.ts
│
├── types/                 # TypeScript type definities
│   └── index.ts
│
└── supabase/
    └── migrations/       # Database migraties
```

---

## 📛 Naming Conventions

### Bestanden & Folders

| Wat | Convention | Voorbeeld |
|-----|------------|-----------|
| Componenten | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase met "use" prefix | `useProjects.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `types/User.ts` |
| API routes | lowercase | `api/users/route.ts` |

### Variabelen & Functies

| Wat | Convention | Voorbeeld |
|-----|------------|-----------|
| Variabelen | camelCase | `const userName = "..."` |
| Functies | camelCase, actief werkwoord | `getUserById()`, `createProject()` |
| Constanten | SCREAMING_SNAKE_CASE | `const MAX_ITEMS = 10` |
| Types/Interfaces | PascalCase | `interface User { }` |
| Event handlers | "handle" prefix | `handleClick`, `handleSubmit` |
| Booleans | "is/has/can" prefix | `isLoading`, `hasError`, `canEdit` |

---

## 🧩 Component Structuur

Elk component volgt dit patroon:

```tsx
''use client'' // Alleen als je hooks/interactiviteit nodig hebt

// 1. Imports (gegroepeerd)
import { useState } from ''react''                    // React
import { Button } from ''@/components/ui/button''     // Interne components
import { formatDate } from ''@/lib/utils''            // Utilities
import type { Project } from ''@/types''              // Types

// 2. Types voor dit component
interface ProjectCardProps {
  project: Project
  onEdit: (id: string) => void
  isEditable?: boolean  // Optional props met ?
}

// 3. Component definitie
export function ProjectCard({ 
  project, 
  onEdit,
  isEditable = false  // Default values
}: ProjectCardProps) {
  // 4. Hooks eerst
  const [isHovered, setIsHovered] = useState(false)
  
  // 5. Derived state / computed values
  const formattedDate = formatDate(project.createdAt)
  
  // 6. Event handlers
  const handleClick = () => {
    onEdit(project.id)
  }
  
  // 7. Early returns voor edge cases
  if (!project) return null
  
  // 8. Render
  return (
    <div 
      className="p-4 bg-white rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3>{project.name}</h3>
      <p>{formattedDate}</p>
      {isEditable && (
        <Button onClick={handleClick}>Edit</Button>
      )}
    </div>
  )
}
```

---

## 🔄 Data Fetching Patterns

### Server Components (Default)
```tsx
// app/projects/page.tsx
// Geen ''use client'' = Server Component
import { supabase } from ''@/lib/supabase''

async function ProjectsPage() {
  // Direct data fetchen op de server
  const { data: projects } = await supabase
    .from(''projects'')
    .select(''*'')
  
  return <ProjectList projects={projects} />
}
```

### Client Components (met React Query)
```tsx
''use client''

import { useQuery } from ''@tanstack/react-query''

function ProjectsClient() {
  const { data, isLoading } = useQuery({
    queryKey: [''projects''],
    queryFn: fetchProjects
  })
  
  // Client-side rendering met loading state
}
```

### Wanneer Welke?

| Server Component | Client Component |
|-----------------|------------------|
| SEO-gevoelige content | Interactieve UI |
| Statische data | Real-time updates |
| Geen JavaScript nodig | useState/useEffect nodig |
| Snelle eerste load | Animaties |

---

## 🏭 State Management Keuzes

### Local State (useState)
Voor state binnen één component:
```tsx
const [isOpen, setIsOpen] = useState(false)
```

### Lifted State
Voor state gedeeld tussen parent/children:
```tsx
// Parent beheert state, geeft door als props
function Parent() {
  const [selected, setSelected] = useState(null)
  return <Child selected={selected} onSelect={setSelected} />
}
```

### Server State (React Query)
Voor data van de API:
```tsx
const { data } = useQuery({ queryKey: [''users''], queryFn: fetchUsers })
```

### Global State (Context / Zustand)
Alleen als écht nodig (auth state, theme):
```tsx
// Gebruik sparingly! Veroorzaakt re-renders
const { user } = useAuth()
```

---

## 📦 Feature-Based Organization

Bij grotere features, groepeer gerelateerde code:

```
components/
└── features/
    └── projects/
        ├── ProjectCard.tsx
        ├── ProjectList.tsx
        ├── ProjectModal.tsx
        ├── useProjects.ts      # Feature-specifieke hook
        └── types.ts            # Feature-specifieke types
```

---

## ⚡ Performance Patterns

### Lazy Loading
```tsx
import dynamic from ''next/dynamic''

// Component laden wanneer nodig
const HeavyComponent = dynamic(() => import(''./HeavyComponent''), {
  loading: () => <p>Laden...</p>
})
```

### Memoization
```tsx
import { useMemo, useCallback } from ''react''

// Expensive berekening cachen
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name))
}, [items])

// Functie referentie stabiel houden
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```',
  '[
    "Volg de folder structuur — consistentie helpt het hele team",
    "Naming conventions zijn niet optioneel — iedereen volgt ze",
    "Houd componenten klein (max 200 regels)",
    "Server Components eerst, Client Components alleen waar nodig",
    "State zo lokaal mogelijk — global state is laatste optie"
  ]'::jsonb,
  13
);


-- ============================================================================
-- STACK GUIDES: ONBOARDING PAD
-- ============================================================================

INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Onboarding: Je Eerste Maand 🚀',
  'GraduationCap',
  'onboarding',
  'Skill',
  'Een gestructureerd pad voor nieuwe Vibecoders. Van setup tot je eerste feature shippen.',
  '# Onboarding: Je Eerste Maand 🚀

Welkom bij Vibecode! Dit pad helpt je in 4 weken van "nieuw" naar "productief".

---

## 🎯 Het Doel

Na dit onboarding pad kun je:
- Zelfstandig features bouwen in onze stack
- AI effectief inzetten zonder afhankelijk te zijn
- Code reviewen en gereviewed worden
- Problemen debuggen en oplossen

Laten we beginnen! 

---

## Week 1: Setup & Oriëntatie

### Dag 1-2: Tooling

**Installeren:**
- [ ] VS Code of Windsurf geïnstalleerd
- [ ] Node.js (versie 18+)
- [ ] Git geconfigureerd
- [ ] Supabase account aangemaakt
- [ ] Vercel account (optioneel voor nu)

**Accounts:**
- [ ] Toegang tot team GitHub
- [ ] Toegang tot Supabase project(en)
- [ ] Slack/Discord toegang

### Dag 3-4: Eerste Project Draaien

```bash
# Stappen om een project lokaal te draaien
git clone [repository-url]
cd project-naam
npm install
# Kopieer .env.example naar .env.local en vul de waarden in
npm run dev
# Open http://localhost:3000
```

**Verificatie:**
- [ ] Project draait lokaal
- [ ] Je kunt inloggen/uitloggen
- [ ] Je ziet data uit de database

### Dag 5: Lezen & Begrijpen

- [ ] Lees de README.md van het project
- [ ] Bekijk de folder structuur
- [ ] Open 3-4 componenten en probeer te begrijpen wat ze doen
- [ ] Lees de Vibecode Filosofie (in deze Knowledge Hub)

**Vragen om te stellen:**
- Hoe is de app gestructureerd?
- Waar staan de componenten?
- Hoe wordt data opgehaald?

---

## Week 2: Eerste Wijzigingen

### Dag 6-7: Je Eerste Branch

**Maak een kleine wijziging:**
1. Maak een branch: `git checkout -b feature/mijn-eerste-change`
2. Wijzig iets kleins (tekst aanpassen, kleur veranderen)
3. Test je wijziging lokaal
4. Commit: `git add . && git commit -m "feat: update button text"`
5. Push: `git push origin feature/mijn-eerste-change`

Nog geen PR! Eerst oefenen met het proces.

### Dag 8-9: Supabase Verkennen

**In het Supabase Dashboard:**
- [ ] Bekijk de Table Editor — welke tabellen zijn er?
- [ ] Bekijk Authentication — hoe werkt login?
- [ ] Bekijk de SQL Editor — voer een simpele query uit
- [ ] Bekijk RLS Policies — begrijp wie wat mag zien

**Oefening:**
```sql
-- Voer dit uit in de SQL Editor
SELECT * FROM [een-tabel-naam] LIMIT 10;
```

### Dag 10: AI-Assisted Codering

**Probeer Cascade/AI:**
1. Open een bestaand component
2. Vraag: "Leg uit wat dit component doet"
3. Vraag: "Hoe zou ik een loading state toevoegen?"
4. **REVIEW** de suggestie — accepteer niet blind!

---

## Week 3: Bouwen met Begeleiding

### Dag 11-12: Kleine Feature Bouwen

**Met je mentor, bouw iets kleins:**
- Nieuwe pagina toevoegen
- Simpel formulier maken
- Data uit database tonen

**Volg het proces:**
1. Vraag om requirements
2. Maak een plan (use Cascade)
3. Bouw in kleine stappen
4. Test elke stap
5. Vraag om review

### Dag 13-14: Je Eerste Echte PR

**Stappen:**
1. Zorg dat je code werkt en getest is
2. Doorloop de Code Review Checklist
3. Push je branch naar GitHub
4. Maak een Pull Request aan
5. Vraag iemand om te reviewen
6. Verwerk feedback
7. Merge!

🎉 **Milestone: Je eerste code in production!**

### Dag 15: Database Wijziging

**Met begeleiding:**
1. Maak een SQL migratie bestand
2. Voeg een kolom toe aan een tabel
3. Update RLS policies indien nodig
4. Test lokaal
5. Pas de code aan om de nieuwe kolom te gebruiken

---

## Week 4: Zelfstandigheid

### Dag 16-17: Solo Feature

**Bouw iets zelfstandig:**
- Kies een kleine feature of improvement
- Plan het zelf (met AI hulp)
- Bouw het
- Vraag om review

Dit is je "graduation" moment — kun je het hele proces alleen?

### Dag 18-19: Troubleshooting Oefenen

**Simuleer problemen:**
- Breek expres iets en fix het
- Doe een `git reset` om changes terug te draaien
- Gebruik de Troubleshooting Guide bij een echte bug

### Dag 20: Reflectie & Volgende Stappen

**Met je mentor:**
- Wat ging goed?
- Waar worstel je nog mee?
- Welke onderwerpen wil je verdiepen?
- Wat zijn je volgende doelen?

---

## 📚 Aanbevolen Leesvolgorde in Vibecode Core

1. **Week 1:** Philosophy, Glossary (alle termen)
2. **Week 2:** Supabase Guide, Prompt Engineering
3. **Week 3:** Architecture Patterns, Code Snippets
4. **Week 4:** Troubleshooting, Checklists

---

## 💡 Tips voor Succes

### DO ✅
- **Vraag veel** — er zijn geen domme vragen
- **Commit vaak** — kleine stappen zijn veiliger
- **Test alles** — voordat je push
- **Lees errors** — ze vertellen je wat mis is
- **Neem pauzes** — frisse ogen zien meer

### DON''T ❌
- **Niet urenlang alleen worstelen** — vraag na 30 minuten om hulp
- **Niet blind AI accepteren** — altijd reviewen
- **Niet direct naar production pushen** — altijd via PR
- **Niet bang zijn om fouten te maken** — zo leer je

---

## 🆘 Hulp Nodig?

- **Code vraag:** Vraag in Slack/Discord
- **Stuck op een bug:** Gebruik de Troubleshooting Guide, dan vragen
- **Conceptueel onduidelijk:** Vraag je mentor, of kijk in de Glossary
- **Alles kapot:** Git reset, en opnieuw beginnen is OK!

---

Succes! Je bent onderdeel van het team. 🎉',
  '[
    "Volg het pad in volgorde — sla geen weken over",
    "Vraag om hulp na 30 minuten vastzitten — niet urenlang alleen worstelen",
    "Focus op begrijpen, niet alleen op werkend krijgen",
    "Je eerste code shippen is een milestone — vier het!"
  ]'::jsonb,
  14
);


-- ============================================================================
-- UPDATE ICON MAP in frontend nodig voor nieuwe icons:
-- CheckSquare, Wrench, Code, Building, GraduationCap
-- ============================================================================

SELECT 
  'Nieuwe content toegevoegd!' as status,
  (SELECT COUNT(*) FROM vibecode_glossary) as total_glossary_terms,
  (SELECT COUNT(*) FROM vibecode_stack_guides) as total_guides,
  (SELECT COUNT(*) FROM vibecode_boundaries) as total_boundaries;
