'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import {
  Lightbulb, Layers, BookText, Sparkles, Shield, ArrowRight,
  Edit3, Save, X, ChevronDown, ChevronUp, Archive, Wrench,
  CheckCircle2, Copy, Info, AlertTriangle, Ban, Terminal,
  FileCode, Zap, Library
} from 'lucide-react'

interface VibecodeCore {
  id: string
  title: string
  philosophy: string
  principles: any[]
  version: number
  created_at: string
  updated_at: string
}

interface StackGuide {
  id: string
  tool_name: string
  category: string
  summary: string
  slug: string
  icon: string
}

interface GlossaryTerm {
  id: string
  term: string
  definition: string
}

interface Boundary {
  id: string
  title: string
  severity: 'hard' | 'soft'
  rationale: string
  alternative_approach: string
}

const quickLinks = [
  {
    title: 'The Stack',
    description: 'Supabase, Lovable, Windsurf, Typeform',
    icon: Layers,
    href: '/vibecode-core/stack',
    section: 'stack',
    color: 'from-slate-800 to-slate-900',
  },
  {
    title: 'Glossary',
    description: 'Technical terms explained',
    icon: BookText,
    href: '/vibecode-core/glossary',
    section: 'glossary',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Prompt Engineering',
    description: 'Rules & recipes for AI',
    icon: Sparkles,
    href: '/vibecode-core/prompting',
    section: 'prompting',
    color: 'from-purple-500 to-violet-600',
  },
  {
    title: 'Boundaries',
    description: 'Constraints & guardrails',
    icon: Shield,
    href: '/vibecode-core/boundaries',
    section: 'boundaries',
    color: 'from-rose-500 to-red-600',
  },
]

export default function VibecodePhilosophyPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [stackGuides, setStackGuides] = useState<StackGuide[]>([])
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [boundaries, setBoundaries] = useState<Boundary[]>([])

  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedPhilosophy, setEditedPhilosophy] = useState('')
  const [saving, setSaving] = useState(false)

  // Mobile Accordion State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    philosophy: true,
    stack: false,
    glossary: false,
    prompting: false,
    boundaries: false
  })

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [coreRes, stackRes, glossaryRes] = await Promise.all([
        fetch('/api/vibecode/core'),
        fetch('/api/vibecode/stack-guides'),
        fetch('/api/vibecode/glossary')
      ])

      const coreData = await coreRes.json()
      const stackData = await stackRes.json()
      const glossaryData = await glossaryRes.json()

      setCore(coreData.core)
      if (coreData.core) {
        setEditedPhilosophy(coreData.core.philosophy || '')
        // Fetch boundaries if core exists
        const boundariesRes = await fetch(`/api/vibecode/boundaries?coreId=${coreData.core.id}`)
        const boundariesData = await boundariesRes.json()
        setBoundaries(boundariesData.boundaries || [])
      }

      setStackGuides(stackData.guides || [])
      setGlossaryTerms(glossaryData.terms || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePhilosophy = async () => {
    if (!core) return
    setSaving(true)
    try {
      const response = await fetch('/api/vibecode/core', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: core.id, philosophy: editedPhilosophy })
      })
      const data = await response.json()
      if (data.success) {
        setCore(data.core)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error saving philosophy:', error)
    } finally {
      setSaving(false)
    }
  }

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const promptTemplates = [
    {
      title: 'Feature Verzoek',
      template: `Act as a Senior Full-Stack Engineer... [PROMPT TEMPLATE]`
    },
    {
      title: 'UI Component',
      template: `Act as a Senior UI/UX Designer... [PROMPT TEMPLATE]`
    }
  ]

  return (
    <VibecodeLayoutNotion>
      <div className="px-4 md:px-16 py-8 md:py-12">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-gray-900">Vibecode Core</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">Knowledge Hub</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm md:text-lg max-w-2xl leading-relaxed">
            The central knowledge base for Vibecode development standards.
          </p>
        </div>

        {/* DESKTOP View: Quick Links Grid */}
        <div className="hidden md:grid grid-cols-2 gap-4 mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-md`}>
                  <link.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{link.title}</h3>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-slate-600 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* MOBILE View: Accordion */}
        <div className="md:hidden space-y-3 mb-12">
          {/* 1. Philosophy Section (Open by Default) */}
          <AccordionSection
            id="philosophy"
            title="Philosophy"
            icon={Lightbulb}
            isOpen={openSections.philosophy}
            toggle={() => toggleSection('philosophy')}
          >
            <div className="prose prose-slate prose-sm max-w-none px-2 pb-4">
              {!core ? (
                <p className="text-gray-500 italic">No philosophy content yet.</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(core.philosophy || '') }} />
              )}
            </div>
          </AccordionSection>

          {/* 2. Stack Section */}
          <AccordionSection
            id="stack"
            title="The Stack"
            icon={Layers}
            isOpen={openSections.stack}
            toggle={() => toggleSection('stack')}
          >
            <div className="grid grid-cols-1 gap-2 px-2 pb-4">
              {stackGuides.map(guide => (
                <Link key={guide.id} href={`/vibecode-core/stack/${guide.slug}`} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{guide.tool_name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{guide.summary}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </AccordionSection>

          {/* 3. Glossary Section */}
          <AccordionSection
            id="glossary"
            title="Glossary"
            icon={BookText}
            isOpen={openSections.glossary}
            toggle={() => toggleSection('glossary')}
          >
            <div className="space-y-2 px-2 pb-4">
              {glossaryTerms.slice(0, 10).map(term => (
                <div key={term.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <p className="font-bold text-sm text-gray-900">{term.term}</p>
                  <p className="text-xs text-gray-600 mt-1">{term.definition}</p>
                </div>
              ))}
              <Link href="/vibecode-core/glossary" className="block text-center text-xs font-medium text-slate-600 mt-2 hover:underline">
                View Full Glossary →
              </Link>
            </div>
          </AccordionSection>

          {/* 4. Prompting Section */}
          <AccordionSection
            id="prompting"
            title="Prompting"
            icon={Sparkles}
            isOpen={openSections.prompting}
            toggle={() => toggleSection('prompting')}
          >
            <div className="space-y-3 px-2 pb-4">
              {promptTemplates.map((prompt, idx) => (
                <div key={idx} className="bg-slate-900 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{prompt.title}</p>
                    <button onClick={() => copyToClipboard(prompt.template, idx)} className="text-[10px] text-slate-400 hover:text-white">
                      {copiedIndex === idx ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 text-[10px] text-slate-400 font-mono overflow-x-auto">
                    <code>{prompt.template.substring(0, 100)}...</code>
                  </pre>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* 5. Boundaries Section */}
          <AccordionSection
            id="boundaries"
            title="Boundaries"
            icon={Shield}
            isOpen={openSections.boundaries}
            toggle={() => toggleSection('boundaries')}
          >
            <div className="space-y-2 px-2 pb-4">
              {boundaries.map(b => (
                <div key={b.id} className={`p-3 rounded-lg border ${b.severity === 'hard' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {b.severity === 'hard' ? <Ban className="w-3 h-3 text-red-600" /> : <AlertTriangle className="w-3 h-3 text-orange-600" />}
                    <p className="font-bold text-sm text-gray-900">{b.title}</p>
                  </div>
                  <p className="text-[10px] text-gray-700">{b.rationale}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        </div>

        {/* DESKTOP Style Body (For Philosophy) */}
        <div className="hidden md:block border-t border-gray-200 pt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-gray-900">Philosophy</h2>
              <p className="text-sm text-gray-500 mt-1">The mindset behind our approach</p>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {editing ? (
              <div className="p-6 space-y-4">
                <textarea
                  value={editedPhilosophy}
                  onChange={(e) => setEditedPhilosophy(e.target.value)}
                  rows={20}
                  className="w-full px-4 py-3 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
                <div className="flex items-center gap-3">
                  <button onClick={savePhilosophy} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-400 transition-all">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-5 py-2.5 text-gray-700 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="prose prose-slate lg:prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(core?.philosophy || '') }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </VibecodeLayoutNotion>
  )
}

function AccordionSection({ id, title, icon: Icon, isOpen, toggle, children }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-3 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

function renderMarkdown(markdown: string): string {
  if (!markdown) return ''
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')

  html = html.replace(/(<li[\s\S]*?<\/li>)+/g, '<ul>$1</ul>')
  return `<div><p>${html}</p></div>`
}
