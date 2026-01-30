'use client'

import { useState } from 'react'
import { 
  X, Edit3, Archive, FileText, Sparkles, AlertCircle, CheckCircle,
  HelpCircle, Target, Shield, Clock, DollarSign, ChevronDown, ChevronUp,
  Loader2, RefreshCw, ExternalLink
} from 'lucide-react'
import type { BriefingSummary } from '@/lib/briefingSummarizer'

interface Project {
  id: string
  name: string
  client_name: string
  description: string
  type: string
  status: string
  quote_amount?: number
  briefing_url?: string
  briefing_filename?: string
  step_plan_url?: string
  step_plan_filename?: string
  intelligence?: BriefingSummary | any | null
  created_at: string
  updated_at: string
  // Allow additional fields from full project
  [key: string]: any
}

interface ProjectDetailPanelProps {
  project: Project
  onClose: () => void
  onEdit: () => void
  onArchive: (projectId: string) => void
  onIntelligenceUpdate?: (projectId: string, intelligence: BriefingSummary) => void
}

type Tab = 'overview' | 'intelligence' | 'documents' | 'risk'

export default function ProjectDetailPanel({
  project,
  onClose,
  onEdit,
  onArchive,
  onIntelligenceUpdate
}: ProjectDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [analyzing, setAnalyzing] = useState(false)
  const [briefingText, setBriefingText] = useState('')
  const [showAnalyzeInput, setShowAnalyzeInput] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['painPoints', 'mustHaves'])
  )

  const intelligence = project.intelligence as BriefingSummary | null

  const handleAnalyze = async () => {
    if (briefingText.trim().length < 50) return

    setAnalyzing(true)
    try {
      const response = await fetch('/api/briefing/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          briefingText,
          projectContext: `Project: ${project.name}, Client: ${project.client_name}`
        })
      })

      const data = await response.json()

      if (data.success && onIntelligenceUpdate) {
        // Save to project
        await fetch('/api/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: project.id,
            intelligence: data.summary
          })
        })
        onIntelligenceUpdate(project.id, data.summary)
        setShowAnalyzeInput(false)
        setBriefingText('')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overzicht', icon: <FileText className="w-4 h-4" /> },
    { id: 'intelligence', label: 'Intelligence', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'documents', label: 'Documenten', icon: <FileText className="w-4 h-4" /> },
    { id: 'risk', label: 'Risico', icon: <Shield className="w-4 h-4" /> },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-sm text-gray-500">{project.client_name || 'Geen klant'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'intelligence' && intelligence && (
                <span className="w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Beschrijving</p>
                <p className="text-sm text-gray-700">{project.description || 'Geen beschrijving'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Type</p>
                  <p className="text-sm text-gray-900">{project.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                    {project.status}
                  </span>
                </div>
              </div>

              {project.quote_amount && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Offerte</p>
                  <p className="text-xl font-bold text-gray-900">
                    € {project.quote_amount.toLocaleString('nl-NL')}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Aangemaakt</p>
                  <p className="text-sm text-gray-700">
                    {new Date(project.created_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Laatst bijgewerkt</p>
                  <p className="text-sm text-gray-700">
                    {new Date(project.updated_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INTELLIGENCE TAB */}
          {activeTab === 'intelligence' && (
            <div className="space-y-4">
              {intelligence ? (
                <>
                  {/* Summary */}
                  <div className="p-4 bg-violet-50 rounded-xl">
                    <p className="font-medium text-violet-900">{intelligence.oneLiner}</p>
                    {(intelligence.timeline || intelligence.budget) && (
                      <div className="flex gap-4 mt-2 text-xs text-violet-600">
                        {intelligence.timeline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {intelligence.timeline}
                          </span>
                        )}
                        {intelligence.budget && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {intelligence.budget}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pain Points */}
                  {intelligence.painPoints?.length > 0 && (
                    <CollapsibleSection
                      title="Pijnpunten"
                      icon={<AlertCircle className="w-4 h-4 text-red-500" />}
                      count={intelligence.painPoints.length}
                      expanded={expandedSections.has('painPoints')}
                      onToggle={() => toggleSection('painPoints')}
                    >
                      <div className="space-y-2">
                        {intelligence.painPoints.map((pain, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(pain.severity)}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{pain.title}</span>
                              <span className="text-xs uppercase opacity-70">{pain.severity}</span>
                            </div>
                            <p className="text-sm opacity-80">{pain.description}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Must-Haves */}
                  {intelligence.mustHaves?.length > 0 && (
                    <CollapsibleSection
                      title="Must-Haves"
                      icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                      count={intelligence.mustHaves.length}
                      expanded={expandedSections.has('mustHaves')}
                      onToggle={() => toggleSection('mustHaves')}
                    >
                      <div className="space-y-2">
                        {intelligence.mustHaves.map((must, i) => (
                          <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-5 h-5 bg-green-600 text-white rounded-full text-xs flex items-center justify-center">
                                {must.priority}
                              </span>
                              <span className="font-medium text-sm text-green-900">{must.requirement}</span>
                            </div>
                            <p className="text-sm text-green-700">{must.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Questions */}
                  {intelligence.questions?.length > 0 && (
                    <CollapsibleSection
                      title="Vragen"
                      icon={<HelpCircle className="w-4 h-4 text-blue-500" />}
                      count={intelligence.questions.length}
                      expanded={expandedSections.has('questions')}
                      onToggle={() => toggleSection('questions')}
                    >
                      <div className="space-y-2">
                        {intelligence.questions.map((q, i) => (
                          <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="font-medium text-sm text-blue-900">{q.question}</p>
                            <p className="text-xs text-blue-600 mt-1">{q.context}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Assumptions */}
                  {intelligence.assumptions?.length > 0 && (
                    <CollapsibleSection
                      title="Aannames"
                      icon={<Target className="w-4 h-4 text-amber-500" />}
                      count={intelligence.assumptions.length}
                      expanded={expandedSections.has('assumptions')}
                      onToggle={() => toggleSection('assumptions')}
                    >
                      <ul className="space-y-1">
                        {intelligence.assumptions.map((a, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-amber-500 mt-1">•</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}

                  {/* Re-analyze button */}
                  <button
                    onClick={() => setShowAnalyzeInput(true)}
                    className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Heranalyseer met nieuwe briefing
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Geen Intelligence</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Voeg een briefing toe om AI-analyse te krijgen
                  </p>
                  <button
                    onClick={() => setShowAnalyzeInput(true)}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                  >
                    Briefing Analyseren
                  </button>
                </div>
              )}

              {/* Analyze Input */}
              {showAnalyzeInput && (
                <div className="mt-4 p-4 border border-violet-200 rounded-xl bg-violet-50">
                  <h4 className="font-medium text-violet-900 mb-2">Briefing Analyseren</h4>
                  <textarea
                    value={briefingText}
                    onChange={(e) => setBriefingText(e.target.value)}
                    placeholder="Plak hier de briefing tekst..."
                    rows={6}
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setShowAnalyzeInput(false)
                        setBriefingText('')
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || briefingText.length < 50}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyseren...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyseren
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {project.briefing_url ? (
                <a
                  href={project.briefing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{project.briefing_filename || 'Briefing'}</p>
                      <p className="text-xs text-gray-500">Briefing document</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </a>
              ) : (
                <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Geen briefing document</p>
                </div>
              )}

              {project.step_plan_url ? (
                <a
                  href={project.step_plan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{project.step_plan_filename || 'Stappenplan'}</p>
                      <p className="text-xs text-gray-500">Stappenplan document</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-green-600" />
                </a>
              ) : (
                <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Geen stappenplan</p>
                </div>
              )}
            </div>
          )}

          {/* RISK TAB */}
          {activeTab === 'risk' && (
            <div className="space-y-4">
              <RiskAssessment project={project} intelligence={intelligence} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={() => onEdit()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
          >
            <Edit3 className="w-4 h-4" />
            Bewerken
          </button>
          <button
            onClick={() => onArchive(project.id)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function CollapsibleSection({ 
  title, icon, count, expanded, onToggle, children 
}: { 
  title: string
  icon: React.ReactNode
  count: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-slate-900">{title}</span>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{count}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && <div className="px-4 py-3">{children}</div>}
    </div>
  )
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    default: return 'bg-green-100 text-green-700 border-green-200'
  }
}

function RiskAssessment({ project, intelligence }: { project: Project; intelligence: BriefingSummary | null }) {
  const risks: { level: string; label: string; description: string }[] = []

  // Check various risk factors
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceUpdate > 14) {
    risks.push({
      level: 'high',
      label: 'Inactief Project',
      description: `Geen updates in ${daysSinceUpdate} dagen`
    })
  }

  if (!project.briefing_url && !intelligence) {
    risks.push({
      level: 'medium',
      label: 'Geen Documentatie',
      description: 'Geen briefing of intelligence beschikbaar'
    })
  }

  if (intelligence?.questions && intelligence.questions.filter(q => q.importance === 'blocking').length > 0) {
    risks.push({
      level: 'high',
      label: 'Blokkerende Vragen',
      description: 'Er zijn onbeantwoorde blokkerende vragen'
    })
  }

  if (intelligence?.painPoints && intelligence.painPoints.filter(p => p.severity === 'critical').length > 0) {
    risks.push({
      level: 'high',
      label: 'Kritieke Pijnpunten',
      description: 'Er zijn onopgeloste kritieke pijnpunten'
    })
  }

  if (!project.quote_amount && project.status !== 'Prospect') {
    risks.push({
      level: 'low',
      label: 'Geen Offerte',
      description: 'Offertebedrag niet ingevuld'
    })
  }

  if (risks.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">Geen Risico's Gedetecteerd</h3>
        <p className="text-sm text-gray-500">Dit project ziet er gezond uit</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {risks.map((risk, i) => (
        <div
          key={i}
          className={`p-4 rounded-lg border ${
            risk.level === 'high' ? 'bg-red-50 border-red-200' :
            risk.level === 'medium' ? 'bg-amber-50 border-amber-200' :
            'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className={`w-4 h-4 ${
              risk.level === 'high' ? 'text-red-600' :
              risk.level === 'medium' ? 'text-amber-600' :
              'text-blue-600'
            }`} />
            <span className={`font-medium text-sm ${
              risk.level === 'high' ? 'text-red-900' :
              risk.level === 'medium' ? 'text-amber-900' :
              'text-blue-900'
            }`}>{risk.label}</span>
          </div>
          <p className={`text-sm ${
            risk.level === 'high' ? 'text-red-700' :
            risk.level === 'medium' ? 'text-amber-700' :
            'text-blue-700'
          }`}>{risk.description}</p>
        </div>
      ))}
    </div>
  )
}
