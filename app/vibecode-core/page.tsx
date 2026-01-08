'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { Lightbulb, Layers, BookText, Sparkles, Shield, ArrowRight, Edit3, Save, X } from 'lucide-react'

interface VibecodeCore {
  id: string
  title: string
  philosophy: string
  principles: any[]
  version: number
  created_at: string
  updated_at: string
}

const quickLinks = [
  {
    title: 'The Stack',
    description: 'Supabase, Lovable, Windsurf, Typeform',
    icon: Layers,
    href: '/vibecode-core/stack',
    color: 'from-slate-800 to-slate-900',
  },
  {
    title: 'Glossary',
    description: 'Technical terms explained',
    icon: BookText,
    href: '/vibecode-core/glossary',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Prompt Engineering',
    description: 'Rules & recipes for AI',
    icon: Sparkles,
    href: '/vibecode-core/prompting',
    color: 'from-purple-500 to-violet-600',
  },
  {
    title: 'Boundaries',
    description: 'Constraints & guardrails',
    icon: Shield,
    href: '/vibecode-core/boundaries',
    color: 'from-rose-500 to-red-600',
  },
]

export default function VibecodePhilosophyPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedPhilosophy, setEditedPhilosophy] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCore()
  }, [])

  const fetchCore = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/vibecode/core')
      const data = await response.json()
      setCore(data.core)
      if (data.core) {
        setEditedPhilosophy(data.core.philosophy || '')
      }
    } catch (error) {
      console.error('Error fetching core:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeCore = async () => {
    try {
      const response = await fetch('/api/vibecode/core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialize: true })
      })
      const data = await response.json()
      if (data.success) {
        setCore(data.core)
        setEditedPhilosophy(data.core.philosophy || '')
      }
    } catch (error) {
      console.error('Error initializing core:', error)
      alert('Error initializing Vibecode Core')
    }
  }

  const savePhilosophy = async () => {
    if (!core) return

    setSaving(true)
    try {
      const response = await fetch('/api/vibecode/core', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: core.id,
          philosophy: editedPhilosophy
        })
      })
      const data = await response.json()
      if (data.success) {
        setCore(data.core)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error saving philosophy:', error)
      alert('Error saving philosophy')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditedPhilosophy(core?.philosophy || '')
    setEditing(false)
  }

  return (
    <VibecodeLayoutNotion>
      <div className="px-8 lg:px-16 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif text-gray-900">Vibecode Core</h1>
              <p className="text-gray-500 mt-1">Knowledge Hub</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
            The central knowledge base for Vibecode development standards, tools, and philosophy.
            Everything you need to build the right way.
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-slate-700 transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Philosophy Section */}
        <div className="border-t border-gray-200 pt-10">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
            </div>
          ) : !core ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
              <Lightbulb className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Initialize Your Philosophy</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your development philosophy document to guide the team.
              </p>
              <button
                onClick={initializeCore}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
              >
                Initialize Vibecode Core
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-serif text-gray-900">Philosophy</h2>
                  <p className="text-sm text-gray-500 mt-1">The mindset behind our approach</p>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* Philosophy Content */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {editing ? (
                  <div className="p-6 space-y-4">
                    <textarea
                      value={editedPhilosophy}
                      onChange={(e) => setEditedPhilosophy(e.target.value)}
                      rows={20}
                      className="w-full px-4 py-3 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                      placeholder="Write your development philosophy in Markdown..."
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={savePhilosophy}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-400 transition-all shadow-sm hover:shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-slate-300 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <div
                      className="prose prose-slate lg:prose-lg max-w-none
                        prose-headings:font-serif prose-headings:font-bold prose-headings:text-slate-900
                        prose-h1:text-3xl prose-h1:mb-6
                        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:font-serif
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-slate-900 prose-strong:font-bold
                        prose-ul:my-6 prose-li:my-2 prose-li:text-slate-700
                        prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(core.philosophy || '') }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </VibecodeLayoutNotion>
  )
}

function renderMarkdown(markdown: string): string {
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
