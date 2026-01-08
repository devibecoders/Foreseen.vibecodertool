-- ============================================================================
-- VIBECODE CORE: COMPLETE SETUP + DUTCH SEED DATA
-- Run this SINGLE script to set up everything
-- ============================================================================

-- ============================================================================
-- PHASE 1: CREATE TABLES (if they don't exist)
-- ============================================================================

-- 1. Create vibecode_core table if not exists
CREATE TABLE IF NOT EXISTS vibecode_core (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Vibecode Core',
  philosophy TEXT,
  principles JSONB DEFAULT '[]'::jsonb,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create vibecode_stack_guides table if not exists
CREATE TABLE IF NOT EXISTS vibecode_stack_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  icon TEXT,
  slug TEXT UNIQUE,
  category TEXT,
  summary TEXT,
  content TEXT NOT NULL,
  golden_rules JSONB,
  best_practices JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create vibecode_glossary table if not exists
CREATE TABLE IF NOT EXISTS vibecode_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  technical_context TEXT,
  related_guide_id UUID REFERENCES vibecode_stack_guides(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create vibecode_boundaries table if not exists
CREATE TABLE IF NOT EXISTS vibecode_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  core_id UUID REFERENCES vibecode_core(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('hard', 'soft')),
  rationale TEXT NOT NULL,
  alternative_approach TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable RLS on all tables
ALTER TABLE vibecode_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_stack_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibecode_boundaries ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (drop first if exists to avoid errors)
DO $$
BEGIN
  -- vibecode_core policies
  DROP POLICY IF EXISTS "Public read access for core" ON vibecode_core;
  CREATE POLICY "Public read access for core" ON vibecode_core FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Authenticated write for core" ON vibecode_core;
  CREATE POLICY "Authenticated write for core" ON vibecode_core FOR ALL USING (true);
  
  -- vibecode_stack_guides policies
  DROP POLICY IF EXISTS "Public read access for stack guides" ON vibecode_stack_guides;
  CREATE POLICY "Public read access for stack guides" ON vibecode_stack_guides FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Authenticated write for stack guides" ON vibecode_stack_guides;
  CREATE POLICY "Authenticated write for stack guides" ON vibecode_stack_guides FOR ALL USING (true);
  
  -- vibecode_glossary policies
  DROP POLICY IF EXISTS "Read access" ON vibecode_glossary;
  CREATE POLICY "Read access" ON vibecode_glossary FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Authenticated write for glossary" ON vibecode_glossary;
  CREATE POLICY "Authenticated write for glossary" ON vibecode_glossary FOR ALL USING (true);
  
  -- vibecode_boundaries policies
  DROP POLICY IF EXISTS "Public read access for boundaries" ON vibecode_boundaries;
  CREATE POLICY "Public read access for boundaries" ON vibecode_boundaries FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Authenticated write for boundaries" ON vibecode_boundaries;
  CREATE POLICY "Authenticated write for boundaries" ON vibecode_boundaries FOR ALL USING (true);
END $$;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_vibecode_glossary_term ON vibecode_glossary(term);
CREATE INDEX IF NOT EXISTS idx_vibecode_stack_guides_slug ON vibecode_stack_guides(slug);
CREATE INDEX IF NOT EXISTS idx_vibecode_stack_guides_sort ON vibecode_stack_guides(sort_order);


-- ============================================================================
-- PHASE 2: SEED PHILOSOPHY (vibecode_core)
-- ============================================================================

-- Insert or update vibecode_core
INSERT INTO vibecode_core (id, title, philosophy, principles, version)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Vibecode Core',
  '# De Vibecode Filosofie 🧠

## Snelheid door Slimheid

Bij Vibecode bouwen we niet langzamer om "het goed te doen" — we bouwen **slimmer** door de juiste tools te gebruiken. AI is geen bedreiging, het is een **versneller**. Een Vibecoder die AI effectief inzet, bouwt in uren wat anderen in dagen bouwen.

> "De beste code is code die je niet hoeft te schrijven."

---

## AI is de Co-piloot, Jij de Piloot

Windsurf, ChatGPT, Claude — het zijn allemaal krachtige hulpmiddelen. Maar **jij** bepaalt de richting. AI genereert, jij valideert. AI suggereert, jij beslist. Accepteer nooit blindelings gegenereerde code zonder deze te begrijpen.

**De Gouden Regel:** Als je niet kunt uitleggen wat de code doet, heb je hem niet begrepen. En code die je niet begrijpt, mag niet naar productie.

---

## Shippen is Leren

Perfectie is de vijand van vooruitgang. Wij geloven in het MVP-principe (Minimum Viable Product — het kleinste werkende product dat waarde levert):

1. **Bouw** iets dat werkt
2. **Ship** het naar echte gebruikers
3. **Leer** van feedback
4. **Verbeter** in de volgende iteratie

Een "imperfecte" feature die live staat, leert je meer dan een "perfecte" feature die nooit wordt geshipt.

---

## De Vibecoder Mentaliteit

### Eigenaarschap
Als Vibecoder ben je geen "uitvoerder" — je bent **eigenaar** van je werk. Dit betekent:
- Je vraagt door tot je het probleem écht begrijpt
- Je denkt mee over de beste oplossing, niet alleen de gevraagde oplossing
- Je bent verantwoordelijk voor de kwaliteit van wat je oplevert

### Clean Code is Caring Code
Code schrijven die alleen jij begrijpt is geen kracht — het is een probleem. Goede code is leesbaar, zelfs voor iemand die het project niet kent:
- Duidelijke naamgeving (`getUserProfile` in plaats van `getData`)
- Geen "magic numbers" (`const MAX_RETRIES = 3` in plaats van gewoon `3`)
- Comments alleen waar de code zelf niet duidelijk genoeg is

### Vragen Stellen is Professioneel
De snelste weg naar een bug is aannames maken. Vibecoders:
- Vragen om context als iets onduidelijk is
- Valideren hun begrip voordat ze beginnen
- Delen hun twijfels in plaats van ze te verbergen

---

## Onze Tech Stack Mantra

```
Windsurf denkt mee → Supabase slaat op → Lovable maakt mooi → Ship het!
```

Elke tool heeft zijn plek. Gebruik ze samen, niet tegen elkaar.',
  '[]'::jsonb,
  1
)
ON CONFLICT (id) DO UPDATE SET
  philosophy = EXCLUDED.philosophy,
  version = vibecode_core.version + 1,
  updated_at = NOW();


-- ============================================================================
-- PHASE 3: SEED GLOSSARY (vibecode_glossary)
-- ============================================================================

-- Clear existing glossary entries
DELETE FROM vibecode_glossary;

INSERT INTO vibecode_glossary (term, definition, technical_context) VALUES

-- Required Terms
('API (Application Programming Interface)',
 'Een "brug" waarmee twee systemen met elkaar kunnen praten. Bijvoorbeeld: jouw frontend vraagt data op bij Supabase via een API.',
 'In onze stack gebruiken we vooral de automatisch gegenereerde Supabase API. Je hoeft zelf geen API te bouwen — Supabase doet dit voor je op basis van je database tabellen. Voor complexe logica gebruiken we Edge Functions.'),

('Edge Function',
 'Server-side code die "dicht bij de gebruiker" draait. Gebruik dit voor geheime sleutels (zoals Stripe) of zware AI-logica die niet in de browser mag draaien.',
 'Edge Functions in Supabase zijn geschreven in TypeScript/Deno en draaien wereldwijd. Ze zijn ideaal voor: webhooks ontvangen, betalingen verwerken, of AI-calls maken. Zet hier altijd je geheime API keys — NOOIT in frontend code.'),

('RLS (Row Level Security)',
 'De "firewall" van je database. RLS zorgt ervoor dat gebruikers alleen hun eigen data kunnen zien. Dit is VERPLICHT op elke tabel.',
 'RLS policies zijn regels die je instelt in PostgreSQL. Standaard is alles geblokkeerd (deny-all). Je moet expliciet toestemming geven. Voorbeeld: "Gebruikers mogen alleen rijen zien waar user_id gelijk is aan hun eigen ID." NOOIT RLS uitzetten in productie!'),

('Webhook',
 'Een "signaal" dat de ene app naar de andere stuurt wanneer er iets gebeurt. Bijvoorbeeld: Typeform stuurt een webhook naar Supabase als iemand een formulier invult.',
 'Webhooks zijn HTTP POST requests die automatisch worden verstuurd bij een event. Ontvang ze altijd in een Edge Function (niet in frontend). Valideer ALTIJD de handtekening (signature) om spoofing te voorkomen.'),

('Prompt',
 'De instructie die je aan een AI geeft. Een goede prompt is specifiek, geeft context, en definieert constraints.',
 'In Windsurf gebruik je prompts om code te genereren. De kwaliteit van je output hangt direct af van de kwaliteit van je prompt. Vaag = vage code. Specifiek = specifieke, werkende code.'),

('Deploy',
 'Je code "live" zetten zodat echte gebruikers het kunnen gebruiken. Dit verplaatst je code van je laptop naar een server op internet.',
 'Wij deployen meestal via Vercel (voor frontend) of rechtstreeks naar Supabase (voor Edge Functions). Een deploy naar "production" betekent dat het live is voor alle gebruikers. Wees voorzichtig!'),

('Latency',
 'De vertraging (in milliseconden) tussen een actie en het resultaat. Lage latency = snelle app, hoge latency = trage app.',
 'Edge Functions draaien "aan de edge" om latency te verminderen. Data uit Amsterdam is sneller in Nederland dan data uit de VS. Optimaliseer door caching en door code dicht bij gebruikers te draaien.'),

-- Expanded Terms: React/Next.js Fundamentals
('Component',
 'Een herbruikbaar "bouwblokje" van je UI. Een Button, een Card, een Navigation — allemaal componenten. Je combineert ze om pagina''s te bouwen.',
 'In React/Next.js is alles een component. Componenten kunnen HTML bevatten, logica (JavaScript), en styling (Tailwind). Houd componenten klein en focused — één component, één verantwoordelijkheid.'),

('Props',
 'Data die je "doorgeeft" aan een component. Zoals argumenten aan een functie. Props maken componenten flexibel en herbruikbaar.',
 'Voorbeeld: <Button text="Klik hier" color="blue" />. Hier zijn text en color props. De Button component ontvangt ze en gebruikt ze om zichzelf te renderen. Props zijn read-only — je mag ze niet aanpassen binnen het component.'),

('State',
 'Data die kan veranderen tijdens het gebruik van je app. Bijvoorbeeld: of een modal open is, welke items in een winkelwagen zitten, of een formulier is verstuurd.',
 'State wordt beheerd met useState() in React. Als state verandert, rendert het component opnieuw. Verschil met props: props komen van buiten, state leeft binnen het component. Tip: houd state zo "laag" mogelijk in je component tree.'),

('Client Component',
 'Een component dat draait in de browser van de gebruiker. Kan interactief zijn: klikken, typen, animeren. Begint met "use client" bovenaan het bestand.',
 'Client Components hebben toegang tot browser APIs (window, document) en React hooks (useState, useEffect). Gebruik ze voor interactiviteit. Nadeel: de JavaScript moet gedownload worden naar de browser, wat de initiële laadtijd verhoogt.'),

('Server Component',
 'Een component dat draait op de server, niet in de browser. Sneller voor de gebruiker, maar niet interactief. Dit is de default in Next.js 14.',
 'Server Components kunnen direct data fetchen uit de database zonder API calls. Ze versturen alleen HTML naar de browser — geen JavaScript. Perfect voor pagina''s die vooral data tonen. Voor interactiviteit, gebruik Client Components.'),

('Hydration',
 'Het proces waarbij React de server-gerenderde HTML "tot leven brengt" door JavaScript toe te voegen. Maakt de pagina interactief.',
 'Eerst stuurt de server HTML (snel te tonen). Dan laadt de browser JavaScript en "verbindt" React zich aan die HTML. Hydration errors ontstaan als de server-HTML niet matcht met wat React verwacht. Vermijd dit door consistent te renderen.'),

('ENV Variables (Environment Variables)',
 'Geheime of configuratie-waarden die je BUITEN je code opslaat. Zoals API keys, database URLs, of feature flags.',
 'In Next.js zet je deze in .env.local. Variabelen die met NEXT_PUBLIC_ beginnen zijn zichtbaar in de browser — gebruik dit ALLEEN voor niet-geheime waarden. Geheime keys horen in Edge Functions of server-side code.'),

('Hook',
 'Een speciale React functie die je laat "inhaken" op React features. useState, useEffect, useCallback — allemaal hooks.',
 'Hooks beginnen altijd met "use". Regels: 1) Roep ze alleen aan op het hoogste niveau (niet in if-statements). 2) Roep ze alleen aan in React componenten of custom hooks. useEffect is voor side effects (data fetching, subscriptions).'),

('TypeScript',
 'JavaScript met types. Je vertelt expliciet wat voor soort data je verwacht ("dit is een string", "dit is een nummer"). Voorkomt bugs.',
 'TypeScript vangt errors op VOORDAT je code draait. In onze stack is TypeScript verplicht. Tip: begin met type voor objecten en interface voor componenten. Gebruik nooit "any" — dat schakelt type-checking uit.'),

('Tailwind CSS',
 'Een CSS framework waar je styling doet via class names direct in je HTML. "utility-first" — elke class doet één ding.',
 'In plaats van aparte CSS bestanden, schrijf je: <div className="bg-white p-4 rounded-lg shadow-sm">. Voordelen: geen context-switching, consistent design, kleine bundle size. Wij gebruiken ALLEEN Tailwind, geen custom CSS.'),

('Shadcn/UI',
 'Een collectie van mooie, toegankelijke React componenten gebouwd op Radix UI. Je kopieert de code naar je project — geen dependency.',
 'Shadcn is geen package die je installeert. De componenten worden letterlijk in je codebase gekopieerd. Dit geeft volledige controle en geen breaking updates. Lovable gebruikt dit standaard. Pas components aan via Tailwind classes.'),

('Slug',
 'Een URL-vriendelijke versie van een titel. Bijvoorbeeld: "Mijn Eerste Blog Post" wordt "mijn-eerste-blog-post".',
 'Slugs gebruiken we voor mooie, leesbare URLs. In de database slaan we zowel de title als de slug op. De slug is uniek en wordt gebruikt in routes: /blog/mijn-eerste-blog-post in plaats van /blog/123.'),

('UUID (Universally Unique Identifier)',
 'Een lange, willekeurige code die gegarandeerd uniek is. Wij gebruiken UUIDs als ID voor alle database rijen.',
 'UUIDs zien eruit als: 550e8400-e29b-41d4-a716-446655440000. Voordelen boven oplopende nummers (1, 2, 3): niet te raden, werken in gedistribueerde systemen, geen informatie over hoeveelheid records. ALTIJD UUIDs gebruiken.'),

('Fetch',
 'De standaard browser-functie om data op te halen van een server. "Fetchen" = data ophalen via een HTTP request.',
 'In Next.js gebruik je fetch() om data op te halen. Server Components kunnen fetch() direct gebruiken. Client Components gebruiken vaak React Query of useEffect + useState. Tip: altijd error handling toevoegen!'),

('Async/Await',
 'Een manier om te wachten op langzame operaties (zoals database calls) zonder de app te blokkeren.',
 'JavaScript is asynchroon — het wacht niet automatisch. Met async/await maak je code die "wacht" leesbaar: const data = await fetchUser(). Zonder await zou fetchUser() een Promise teruggeven, niet de data zelf. Vergeet nooit try/catch voor error handling.'),

('Middleware',
 'Code die draait TUSSEN een request en de response. Perfect voor authenticatie checks, redirects, of logging.',
 'In Next.js is middleware.ts een speciaal bestand dat bij ELKE request draait. Gebruik het om: gebruikers te redirecten als ze niet ingelogd zijn, geo-based routing, A/B testing. Houd middleware snel — het vertraagt elke pagina.');


-- ============================================================================
-- PHASE 4: SEED STACK GUIDES (vibecode_stack_guides)
-- ============================================================================

-- Clear existing guides
DELETE FROM vibecode_stack_guides;

-- Guide A: Windsurf (The Brain)
INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Windsurf: Het Brein 🧠',
  'Brain',
  'windsurf',
  'AI',
  'Onze AI-powered IDE. Leer hoe je AI effectief inzet om sneller te bouwen zonder kwaliteit te verliezen.',
  '# Windsurf: Het Brein 🧠

## Wat is Windsurf?

Windsurf is een code editor (IDE — Integrated Development Environment) met ingebouwde AI. Denk aan VS Code, maar met een senior developer die meekijkt en meedenkt.

De AI in Windsurf heet **Cascade**. Cascade kan:
- Je hele codebase lezen en begrijpen
- Code genereren op basis van instructies
- Bugs helpen opsporen en oplossen
- Refactoren en verbeteren

---

## De Gouden Prompt Formule

Elke prompt die je aan Cascade (of andere AI) geeft, moet vier elementen bevatten:

### 1. Rol (Wie is de AI?)
```
Gedraag je als een Senior Frontend Engineer met expertise in React en TypeScript.
```
Dit "primeert" de AI om op het juiste niveau te denken.

### 2. Doel (Wat wil je?)
```
Bouw een herbruikbare Button component met drie varianten: primary, secondary, en ghost.
```
Wees specifiek. "Maak een button" is te vaag.

### 3. Context (Wat is de tech stack?)
```
We gebruiken Next.js 14 App Router, Tailwind CSS, en shadcn/ui.
```
Zonder context kan de AI jQuery of Bootstrap gebruiken — dingen die wij niet doen.

### 4. Constraints (Wat zijn de regels?)
```
- Geen custom CSS, alleen Tailwind classes
- Component moet accessible zijn (correct aria labels)
- TypeScript types voor alle props
```
Constraints voorkomen dat de AI slechte patronen kiest.

---

## Cascade Effectief Gebruiken

### Start met Context Geven
Laat Cascade eerst relevante bestanden lezen voordat je vraagt om te bouwen:
```
Lees de structuur van /app/projects en leg uit hoe de Kanban board werkt.
```

### Wees Expliciet over Scope
```
We moeten PDF upload toevoegen aan projecten. Dit raakt:
- Het Project interface in types.ts
- De database migratie
- De ProjectModal component

Begin met het database schema.
```

### Vraag ALTIJD om een Plan Eerst
❌ **Fout:**
```
Bouw een dashboard met grafieken.
```

✅ **Goed:**
```
Ik wil een dashboard met grafieken. Maak eerst een plan:
1. Welke componenten zijn nodig?
2. Hoe halen we data op?
3. Welke states beheren we?

Pas daarna beginnen we met bouwen.
```

---

## Debuggen met AI

Als iets niet werkt, geef Cascade de juiste context:

```
De login werkt niet. Dit zijn de symptomen:
- De button klikt wel, maar er gebeurt niets
- Geen errors in de console
- Supabase logs tonen geen auth attempts

Hier is de relevante code: [plak code]

Wat kan er mis zijn?
```

Tip: Plak altijd de error message én de relevante code. "Het werkt niet" is niet genoeg.

---

## Veelgemaakte Fouten

❌ **Blindelings accepteren**
Nooit op "Accept All" klikken zonder te lezen wat er verandert. AI maakt fouten.

❌ **Te grote prompts**
Vraag niet om "een complete app". Splits op in kleine, gerichte taken.

❌ **Geen context geven**
AI weet niet dat je Tailwind gebruikt tenzij je het zegt.

✅ **Best Practice:** Lees elke diff, test lokaal, en verifieer dat je begrijpt wat de code doet.',
  '[
    "Vraag ALTIJD om een plan voordat Cascade begint met coderen",
    "Review elke gegenereerde wijziging — accepteer nooit blindelings",
    "Geef volledige context: tech stack, bestandslocaties, constraints",
    "Split complexe taken in kleine, gerichte prompts",
    "Als je de code niet begrijpt, vraag Cascade om uitleg VOORDAT je accepteert"
  ]'::jsonb,
  1
);

-- Guide B: Supabase (The Skeleton)
INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Supabase: Het Skelet 🦴',
  'Database',
  'supabase',
  'Backend',
  'Onze backend: database, authenticatie, en server-side logica. De fundamenten van elke app.',
  '# Supabase: Het Skelet 🦴

## Wat is Supabase?

Supabase is een "Backend-as-a-Service" — het regelt alles wat je normaal zelf zou moeten bouwen:
- **Database**: PostgreSQL, de meest betrouwbare database ter wereld
- **Auth**: Login, registratie, wachtwoord reset, OAuth (Google/GitHub login)
- **Storage**: Bestanden opslaan (images, PDFs, videos)
- **Edge Functions**: Server-side code voor complexe logica
- **Realtime**: Live updates in je app

Je hoeft geen server te beheren. Supabase doet het voor je.

---

## De Heilige Regel: RLS

**Row Level Security (RLS)** is verplicht op ELKE tabel. Geen uitzonderingen.

### Wat doet RLS?
RLS is een "firewall" die bepaalt wie welke rijen in je database mag zien of aanpassen.

### Voorbeeld
```sql
-- Stap 1: Enable RLS (standaard blokkeert dit alles)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Stap 2: Maak een policy (regel)
CREATE POLICY "Gebruikers zien alleen eigen projecten"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

Nu kan een gebruiker ALLEEN projecten zien waar hun user ID matcht. Zelfs als ze proberen andere data op te vragen, krijgen ze die niet.

### Waarom is dit zo belangrijk?
Zonder RLS kan een kwaadwillende gebruiker simpelweg `/projects?user_id=andermans-id` aanroepen en alle data stelen. RLS maakt dit onmogelijk op database niveau.

---

## Database Migraties

Wijzigingen aan je database structuur (tabellen, kolommen) doe je via **migraties**.

### Gouden Regel
NOOIT de database direct aanpassen via de Table Editor in productie. Gebruik SQL migratie bestanden.

### Waarom?
- Migraties zijn versioncontrolled (Git)
- Je kunt ze reviewen voordat ze live gaan
- Je kunt ze terugdraaien bij problemen
- Iedereen in het team heeft dezelfde structuur

### Voorbeeld Migratie
```sql
-- supabase/migrations/001_create_projects.sql

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT ''active'',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS direct erbij!
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);
```

---

## Edge Functions: Wanneer Gebruiken?

### ✅ Gebruik Edge Functions voor:
1. **Geheime API Keys** (Stripe, OpenAI, SendGrid)
2. **Webhook ontvangst** (Typeform, Stripe, externe services)
3. **Zware berekeningen** (AI processing, PDF generatie)
4. **Multi-stap transacties** (meerdere database calls die samen moeten slagen)

### ❌ NIET gebruiken voor:
1. Simpele CRUD (Create, Read, Update, Delete) — gebruik gewoon de Supabase client
2. Data die je kunt filteren met RLS
3. Realtime subscriptions

---

## Table Editor vs SQL Editor

### Table Editor (GUI)
✅ Prima voor: Snel data bekijken, handmatig records toevoegen tijdens development
❌ Niet voor: Schema wijzigingen in productie

### SQL Editor
✅ Gebruik voor: Alle schema wijzigingen, complexe queries, migraties testen
✅ Tip: Test je migratie SQL eerst in de SQL Editor voordat je een migratiebestand maakt

---

## Type Safety

Genereer TypeScript types uit je database:
```bash
npx supabase gen types typescript --project-id YOUR_ID > lib/database.types.ts
```

Nu heb je autocomplete en type checking voor al je database calls!',
  '[
    "ALTIJD RLS enablen op elke tabel — geen uitzonderingen",
    "Gebruik UUIDs voor alle primary keys, nooit oplopende nummers",
    "Geheime API keys horen in Edge Functions, NOOIT in frontend code",
    "Schema wijzigingen via SQL migraties, niet via Table Editor",
    "Genereer TypeScript types — geen ''any'' in database calls",
    "ON DELETE CASCADE op foreign keys om orphan records te voorkomen",
    "Voeg altijd created_at en updated_at timestamps toe aan elke tabel"
  ]'::jsonb,
  2
);

-- Guide C: Lovable (The Face)
INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Lovable: Het Gezicht 🎨',
  'Palette',
  'lovable',
  'Frontend',
  'Snelle, mooie UI generatie. Hoe je van prompt naar productie-waardige interfaces komt.',
  '# Lovable: Het Gezicht 🎨

## Wat is Lovable?

Lovable is een AI-tool die complete, werkende React componenten genereert. Beschrijf wat je wilt, en Lovable bouwt het — inclusief styling, responsive design, en interactiviteit.

Lovable gebruikt dezelfde stack als wij:
- **React** voor componenten
- **Tailwind CSS** voor styling
- **Shadcn/UI** voor UI primitives
- **Lucide** voor icons

---

## De Vibecode Aesthetic

Wij bouwen interfaces die **premium, snel, en afleidingsvrij** aanvoelen. Denk aan Vercel, Linear, Stripe — niet aan drukke dashboards vol clutter.

### Kernprincipes
1. **Veel witruimte** — laat elementen ademen
2. **Subtiele schaduwen** — geen harde borders
3. **Consistente kleuren** — Tailwind''s slate/gray palette
4. **Smooth transities** — hover effects met `transition-all`

---

## Mobile-First Design

Ontwerp ALTIJD eerst voor mobiel (375px breed), dan schaal je op.

### De Flow
```tsx
// ✅ Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Op mobiel: 1 kolom */}
  {/* Op tablet (md): 2 kolommen */}
  {/* Op desktop (lg): 4 kolommen */}
</div>
```

### Checklist
- ✅ Test op mobiel (375px) voordat je submitten
- ✅ Buttons full-width op mobiel
- ✅ Tekst leesbaar (niet te klein)
- ✅ Touch targets groot genoeg (min 44x44px)

---

## Tailwind Spacing Systeem

Consistente spacing is het geheim van professionele UI. Gebruik ALTIJD Tailwind''s spacing scale:

| Class | Pixels | Gebruik voor |
|-------|--------|--------------|
| p-2   | 8px    | Zeer kleine spacing |
| p-4   | 16px   | Normale padding |
| p-6   | 24px   | Ruime padding |
| p-8   | 32px   | Secties |
| gap-4 | 16px   | Grid/flex gaps |
| gap-6 | 24px   | Ruimere gaps |

### Gouden Regel: Stijg in stappen van 2
- `space-y-2` → `space-y-4` → `space-y-6` → `space-y-8`
- Geen willekeurige waarden (`mt-[13px]`)

---

## Kleurgebruik

Wij gebruiken een beperkt, consistent palet:

```tsx
// Achtergronden
bg-white        // Cards
bg-slate-50     // Pagina achtergrond
bg-slate-900    // Donkere accenten

// Tekst
text-gray-900   // Headings
text-gray-600   // Body tekst
text-gray-400   // Subtiele tekst

// Accenten
text-blue-600   // Links, highlights
bg-blue-600     // Primary buttons
border-gray-200 // Borders
```

---

## Shadcn Component Patronen

### Button Varianten
```tsx
// Primary actie
<Button>Opslaan</Button>

// Secundaire actie
<Button variant="outline">Annuleren</Button>

// Subtle actie
<Button variant="ghost">Meer opties</Button>
```

### Cards met Hover Effect
```tsx
<div className="group bg-white rounded-xl p-6 border border-gray-200 
  hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer">
  <h3 className="font-bold text-gray-900 group-hover:text-blue-600">
    Titel
  </h3>
</div>
```

---

## Veelgemaakte Fouten

❌ **Custom CSS files** — Geen `.module.css` of aparte stylesheets
❌ **Harde borders** — `border-2 border-black` voelt gedateerd
❌ **Inconsistente spacing** — Random margins en paddings
❌ **Te kleine touch targets** — Moeilijk te klikken op mobiel

✅ **De oplossing:** Volg de patterns hierboven en gebruik ALLEEN Tailwind utility classes.',
  '[
    "Mobile-first: ontwerp voor 375px, schaal dan op met md: en lg: breakpoints",
    "Gebruik ALLEEN shadcn/UI componenten — geen andere libraries",
    "Alleen Tailwind utility classes — geen custom CSS bestanden",
    "Lucide icons exclusief — geen mix van icon libraries",
    "Subtiele schaduwen (shadow-sm) in plaats van harde borders",
    "Genereuze whitespace: p-6, p-8, space-y-6 — laat content ademen",
    "Consistente spacing: stijg in stappen van 2 (p-2, p-4, p-6, p-8)"
  ]'::jsonb,
  3
);

-- Guide D: Typeform & Gravity (Forms)
INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Typeform & Gravity: Formulieren 📝',
  'FileText',
  'typeform',
  'Workflow',
  'Hoe we gebruikersinput verzamelen via mooie formulieren en webhooks verwerken.',
  '# Typeform & Gravity: Formulieren 📝

## Waarom Typeform?

Wij bouwen GEEN custom formulieren tenzij het echt niet anders kan. Typeform biedt:
- Prachtige, conversational form experience
- Ingebouwde validatie en logica
- Analytics en integraties out-of-the-box
- Veel sneller dan zelf bouwen

**De Regel:** Als Typeform het kan, gebruik Typeform.

---

## Het Gravity Patroon

"Gravity" is ons standaard patroon voor het verwerken van Typeform submissions:

```
Typeform → Webhook → Edge Function → Database
```

### Hoe het werkt:
1. Gebruiker vult Typeform in
2. Typeform stuurt een webhook (HTTP POST) naar onze Edge Function
3. Edge Function valideert de handtekening
4. Edge Function mapt velden naar database kolommen
5. Data wordt opgeslagen in Supabase

---

## Velden Mappen: Goed vs Fout

### ❌ FOUT: Raw JSON dumpen
```typescript
// Dit is NIET wat we willen
await supabase.from(''submissions'').insert({
  raw_data: payload  // Ongestructureerd, moeilijk te queryen
})
```

### ✅ GOED: Expliciet mappen
```typescript
// Dit is correct
const data = {
  customer_name: getAnswerByRef(answers, ''name''),
  customer_email: getAnswerByRef(answers, ''email''),
  project_type: getAnswerByRef(answers, ''project_type''),
  budget: parseFloat(getAnswerByRef(answers, ''budget''))
}
```

**Waarom?**
- Je database heeft een duidelijke structuur
- Je kunt queryen op specifieke velden
- Type safety (budget is een nummer, niet een string)

---

## Wanneer WEL Custom Forms?

Gebruik custom forms wanneer je:
- Real-time validatie tegen je database nodig hebt
- Complexe multi-step wizards met state bouwt
- Formulieren moet integreren met andere UI elementen
- Styling nodig hebt die Typeform niet kan

Voor al het andere: **Typeform.**',
  '[
    "ALTIJD de webhook handtekening valideren — voorkom spoofing",
    "Map velden expliciet naar database kolommen — dump geen raw JSON",
    "Ontvang webhooks in Edge Functions — nooit client-side",
    "Gebruik veld referenties (refs), niet labels — labels kunnen veranderen",
    "Als Typeform het kan, bouw geen custom form"
  ]'::jsonb,
  4
);

-- Guide E: Prompt Engineering (The Skill)
INSERT INTO vibecode_stack_guides (tool_name, icon, slug, category, summary, content, golden_rules, sort_order) VALUES (
  'Prompt Engineering: De Kunst 🎯',
  'Sparkles',
  'prompt-engineering',
  'Skill',
  'Hoe je effectieve prompts schrijft voor AI. Het verschil tussen uren debuggen en werkende code in minuten.',
  '# Prompt Engineering: De Kunst 🎯

## Waarom Dit Cruciaal Is

De kwaliteit van AI-gegenereerde code hangt 100% af van de kwaliteit van je prompt.

> Vage prompt = vage code
> Specifieke prompt = specifieke, werkende code

Dit is geen talent — het is een **vaardigheid** die je kunt leren.

---

## De Formule: R.G.C.C.

Elke effectieve prompt bevat vier elementen:

| Element | Vraag | Voorbeeld |
|---------|-------|-----------|
| **R**ol | Wie is de AI? | "Senior React Developer" |
| **G**oal | Wat wil je? | "Bouw een Button component" |
| **C**ontext | Wat is de stack? | "Next.js 14, Tailwind, TypeScript" |
| **C**onstraints | Wat zijn de regels? | "Geen custom CSS, mobile-first" |

---

## Slechte Prompt vs Goede Prompt

### Voorbeeld 1: Button Component

#### ❌ Slechte Prompt
```
Maak een button.
```

**Probleem:** Welke taal? Welke styling? Welke varianten? De AI gaat raden.

#### ✅ Goede Prompt
```
Gedraag je als Senior Frontend Engineer.

Doel: Maak een herbruikbare Button component met drie varianten.

Context:
- React met TypeScript
- Styling via Tailwind CSS
- Moet shadcn/ui patterns volgen

Varianten:
- Primary: blauwe achtergrond, witte tekst
- Secondary: witte achtergrond, grijze border
- Ghost: transparant, tekst alleen

Constraints:
- TypeScript types voor alle props
- onClick handler als prop
- disabled state styling
- Focus ring voor accessibility
```

---

### Voorbeeld 2: Database Query

#### ❌ Slechte Prompt
```
Haal alle projecten op.
```

#### ✅ Goede Prompt
```
Gedraag je als Backend Engineer met Supabase expertise.

Doel: Schrijf een functie om projecten op te halen voor de huidige gebruiker.

Context:
- Supabase database
- Tabel: projects (id, user_id, name, status, created_at)
- RLS is enabled

Requirements:
- Filter op user_id van ingelogde gebruiker
- Sorteer op created_at, nieuwste eerst
- Paginatie: 10 per pagina
- Include error handling

Constraints:
- Gebruik de Supabase client, niet raw SQL
- TypeScript, geen ''any'' types
- Return type duidelijk gedefinieerd
```

---

## Pro Tips

### 1. Vraag om een Plan Eerst
Voeg altijd toe: "Maak eerst een plan voordat je begint met coderen."

### 2. Itereer
Eerste output niet perfect? Bouw erop voort:
```
Goed begin! Kun je nu ook:
- Loading state toevoegen
- Error handling verbeteren
- TypeScript types strikter maken
```

### 3. Wees Niet Bang om Uitleg te Vragen
```
Leg uit wat dit stuk code doet, regel voor regel.
```

Dit is geen zwakte — het is hoe je leert én hoe je verifieert dat de code klopt.',
  '[
    "Gebruik ALTIJD de R.G.C.C. formule: Rol, Goal, Context, Constraints",
    "Vraag om een plan voordat AI begint met coderen",
    "Wees specifiek — noem bestandsnamen, tech stack, en exacte requirements",
    "Plak relevante code en error messages — context is alles",
    "Itereer: eerste output is een startpunt, niet het eindpunt",
    "Als je de output niet begrijpt, vraag om uitleg voordat je accepteert"
  ]'::jsonb,
  5
);


-- ============================================================================
-- PHASE 5: SEED BOUNDARIES (vibecode_boundaries)
-- ============================================================================

-- Clear existing boundaries
DELETE FROM vibecode_boundaries;

-- Insert boundaries
INSERT INTO vibecode_boundaries (core_id, title, severity, rationale, alternative_approach) VALUES

-- Required Boundaries
((SELECT id FROM vibecode_core LIMIT 1), 'Geen jQuery', 'hard',
 'jQuery is een library uit 2006 voor problemen die React allang heeft opgelost. Het mengt slecht met React''s virtual DOM en veroorzaakt bugs die moeilijk te debuggen zijn.',
 'Gebruik React''s ingebouwde oplossingen: useState voor interactiviteit, useRef voor DOM toegang, en CSS/Tailwind voor animaties.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen SQL in Frontend Code', 'hard',
 'Frontend code is zichtbaar voor iedereen. SQL queries in de browser zijn een beveiligingsrisico en omzeilen RLS.',
 'Gebruik de Supabase client voor alle data operaties. Voor complexe logica, gebruik Edge Functions aan de server kant.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen Magic Numbers', 'soft',
 'Getallen zonder context zijn onbegrijpelijk. Wat betekent "3" of "1000"? Over zes maanden weet niemand het meer.',
 'Definieer constanten met duidelijke namen: const MAX_RETRIES = 3; const TIMEOUT_MS = 1000;'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen Secrets in Code', 'hard',
 'API keys, passwords, en tokens in code belanden in Git historie en zijn dan NOOIT meer echt geheim.',
 'Gebruik environment variables (.env.local) voor secrets. NEXT_PUBLIC_ prefix alleen voor niet-geheime waarden. Geheime keys alleen in Edge Functions.'),

-- Expanded Boundaries: React/Next.js Anti-patterns
((SELECT id FROM vibecode_core LIMIT 1), 'Geen document.getElementById in React', 'hard',
 'React beheert de DOM. Direct de DOM manipuleren buiten React om veroorzaakt bugs, memory leaks, en hydration errors.',
 'Gebruik useRef() voor directe DOM toegang, of beter: los het op via state en conditional rendering.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'State Nooit Direct Muteren', 'hard',
 'React detecteert geen directe mutaties. Als je array.push() doet of object.property = x, zal je component niet re-renderen.',
 'Maak altijd een kopie: setItems([...items, newItem]) voor arrays. setUser({...user, name: "Nieuw"}) voor objecten.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen useEffect voor Data Fetching', 'soft',
 'useEffect voor data fetching veroorzaakt waterfalls, race conditions, en geen caching. Het is een anti-pattern in moderne React.',
 'Gebruik React Query (TanStack Query) voor client-side fetching, of Server Components voor server-side data.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen Inline Styles', 'soft',
 'style={{}} in JSX omzeilt Tailwind, is moeilijk te overriden, en maakt de bundle groter.',
 'Gebruik uitsluitend Tailwind classes: className="bg-blue-500 p-4". Voor dynamische styles: template literals of clsx.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen console.log in Productie', 'soft',
 'Console logs vervuilen de browser console, kunnen gevoelige data lekken, en zien er onprofessioneel uit.',
 'Verwijder alle console.logs voor je commit. Gebruik een logger die automatisch stopt in productie, of Sentry voor error tracking.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen any in TypeScript', 'soft',
 'any schakelt type checking uit — precies wat je TypeScript bescherming geeft. Het verbergt bugs die later crashen.',
 'Definieer proper types. Weet je het type niet? Gebruik unknown en check het runtime. Of vraag AI om het juiste type.'),
 
((SELECT id FROM vibecode_core LIMIT 1), 'Geen Components Groter dan 200 Regels', 'soft',
 'Grote componenten zijn moeilijk te begrijpen, testen, en hergebruiken. Ze doen te veel.',
 'Splits op: extract helper functions, maak child components, use custom hooks. Elk component heeft één verantwoordelijkheid.');


-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  (SELECT COUNT(*) FROM vibecode_glossary) as glossary_terms,
  (SELECT COUNT(*) FROM vibecode_stack_guides) as stack_guides,
  (SELECT COUNT(*) FROM vibecode_boundaries) as boundaries,
  (SELECT COUNT(*) FROM vibecode_core) as core_entries;
