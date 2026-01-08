'use client'

import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { Sparkles, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function PromptEngineeringPage() {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const promptTemplates = [
        {
            title: 'Feature Verzoek',
            description: 'Voor het bouwen van nieuwe features met volledige context',
            template: `Act as a Senior Full-Stack Engineer with expertise in Next.js and Supabase.

Goal: [SPECIFIC OUTCOME]

Context:
- Next.js 14 App Router
- Supabase for backend (with RLS)
- Tailwind CSS + shadcn/ui
- TypeScript (strict mode)
- Lucide icons

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

Then implement step by step.`,
        },
        {
            title: 'UI Component',
            description: 'Voor het ontwerpen en bouwen van UI elementen',
            template: `Act as a Senior UI/UX Designer and Frontend Engineer.

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
- Use Tailwind's gray/slate palette
- Subtle shadows, no hard borders
- Generous whitespace`,
        },
        {
            title: 'Database Migratie',
            description: 'Voor het maken of wijzigen van database schema',
            template: `Act as a Senior Backend Engineer with expertise in PostgreSQL and Supabase.

Goal: [DESCRIBE WHAT THE MIGRATION DOES]

Requirements:
- Enable RLS on all new tables
- Use UUIDs for primary keys
- Add created_at and updated_at timestamps
- Use proper foreign key constraints with ON DELETE CASCADE
- Create appropriate indexes

Tables/Changes:
1. [TABLE 1]: [DESCRIPTION]
2. [TABLE 2]: [DESCRIPTION]

RLS Policies:
- [WHO CAN READ]
- [WHO CAN WRITE]

Please generate the SQL migration.`,
        },
        {
            title: 'Refactoring',
            description: 'Voor het verbeteren van bestaande code',
            template: `We need to refactor [COMPONENT/FEATURE].

Current Issues:
1. [ISSUE 1]
2. [ISSUE 2]

Goals:
1. [IMPROVEMENT 1]
2. [IMPROVEMENT 2]

Files Affected:
- [FILE 1]
- [FILE 2]

Constraints:
- Don't break existing functionality
- Maintain backwards compatibility
- Keep the same public API

First, analyze the current implementation. Then propose a step-by-step refactoring plan.`,
        },
    ]

    const goldenRules = [
        {
            number: 1,
            rule: 'Vraag Altijd Eerst om een Plan',
            description:
                'Spring nooit direct naar code. Vraag een plan met structuur, dataflow en edge cases.',
        },
        {
            number: 2,
            rule: 'Gebruik de 4-Delige Prompt Formule',
            description: 'Elke prompt moet hebben: Rol, Doel, Context, Beperkingen.',
        },
        {
            number: 3,
            rule: 'Laat Cascade Eerst Lezen',
            description:
                'Voor complexe features, laat Cascade eerst relevante bestanden lezen.',
        },
        {
            number: 4,
            rule: 'Review Alle Diffs',
            description:
                'Accepteer nooit wijzigingen blindelings. Lees de diff, test lokaal, check op side effects.',
        },
        {
            number: 5,
            rule: 'Wees Specifiek Over Bestanden',
            description:
                'Verwijs naar exacte bestandspaden en functienamen. Vage verwijzingen leiden tot vage oplossingen.',
        },
    ]

    return (
        <VibecodeLayoutNotion>
            <div className="px-8 lg:px-16 py-12">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold font-serif text-gray-900">
                                Prompt Technieken
                            </h1>
                            <p className="text-gray-500 mt-1">Regels & recepten voor AI</p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
                        At Vibecode, we don&apos;t write code from scratch—we{' '}
                        <strong className="text-gray-900">direct AI</strong> to build it. A precise
                        prompt gets production-ready code. A vague prompt gets vague results.
                    </p>
                </div>

                {/* Golden Rules */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-10">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-amber-600" />
                        The 5 Golden Rules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {goldenRules.map((rule) => (
                            <div
                                key={rule.number}
                                className="bg-white/80 rounded-lg p-4 border border-amber-200/50"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                                        {rule.number}
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm mb-1">
                                            {rule.rule}
                                        </h3>
                                        <p className="text-gray-600 text-xs leading-relaxed">
                                            {rule.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prompt Templates */}
                <h2 className="text-2xl font-bold font-serif text-gray-900 mb-6">
                    Ready-to-Use Templates
                </h2>
                <div className="space-y-6">
                    {promptTemplates.map((prompt, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{prompt.title}</h3>
                                    <p className="text-sm text-gray-500">{prompt.description}</p>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(prompt.template, index)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                                >
                                    {copiedIndex === index ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Template */}
                            <pre className="p-6 bg-slate-900 text-slate-100 text-sm font-mono overflow-x-auto">
                                <code>{prompt.template}</code>
                            </pre>
                        </div>
                    ))}
                </div>

                {/* Tips Section */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-bold font-serif text-gray-900 mb-4">
                        Quick Tips
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-bold text-green-900 text-sm mb-2">✅ Do This</h3>
                            <ul className="text-sm text-green-800 space-y-1">
                                <li>• Be specific about file paths and function names</li>
                                <li>• Paste reference code when available</li>
                                <li>• Define clear constraints and requirements</li>
                                <li>• Ask for a plan before implementation</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-bold text-red-900 text-sm mb-2">❌ Avoid This</h3>
                            <ul className="text-sm text-red-800 space-y-1">
                                <li>• Vague prompts like &quot;make a dashboard&quot;</li>
                                <li>• Accepting changes without reviewing diffs</li>
                                <li>• Assuming AI knows your tech stack</li>
                                <li>• Skipping the context section</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </VibecodeLayoutNotion>
    )
}
