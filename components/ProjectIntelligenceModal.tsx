'use client'

import { useState } from 'react'
import { 
  X, Sparkles, Loader2, AlertCircle, CheckCircle, HelpCircle,
  ChevronDown, ChevronUp, FileText, Target, Clock, DollarSign,
  Users, Briefcase, ArrowRight, Copy, Check
} from 'lucide-react'
import type { BriefingSummary, PainPoint, MustHave, ClarificationQuestion } from '@/lib/briefingSummarizer'

interface ProjectIntelligenceModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: any) => void
}

const PROJECT_TYPES = [
  { value: 'Application', label: '📱 Applicatie' },
  { value: 'Website + Backend', label: '🌐 Website + Backend' },
  { value: 'Problem Solving', label: '🧩 Problem Solving' },
  { value: 'AI Integration', label: '🧠 AI Integration' },
]

export default function ProjectIntelligenceModal({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}: ProjectIntelligenceModalProps) {
  // Step management
  const [step, setStep] = useState<'input' | 'analysis' | 'create'>('input')
  
  // Briefing input
  const [briefingText, setBriefingText] = useState('')
  const [clientName, setClientName] = useState('')
  
  // Analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<BriefingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Project creation
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState<string>('Application')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [creating, setCreating] = useState(false)
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['painPoints', 'mustHaves']))
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleAnalyze = async () => {
    if (briefingText.trim().length < 50) {
      setError('Voer minimaal 50 tekens in')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/briefing/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          briefingText, 
          projectContext: clientName ? `Client: ${clientName}` : undefined 
        })
      })

      const data = await response.json()

      if (data.success) {
        setAnalysis(data.summary)
        setProjectName(data.summary.projectName || '')
        setStep('analysis')
      } else {
        setError(data.error || 'Analyse mislukt')
      }
    } catch (err) {
      setError('Netwerk error - probeer opnieuw')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Projectnaam is verplicht')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          client_name: clientName,
          description: analysis?.oneLiner || '',
          type: projectType,
          status: 'Prospect',
          quote_amount: quoteAmount ? parseFloat(quoteAmount) : null,
          // Store intelligence data
          intelligence: analysis ? {
            painPoints: analysis.painPoints,
            mustHaves: analysis.mustHaves,
            questions: analysis.questions,
            assumptions: analysis.assumptions,
            outOfScope: analysis.outOfScope,
            successCriteria: analysis.successCriteria,
            analyzedAt: new Date().toISOString()
          } : null
        })
      })

      const data = await response.json()

      if (data.project) {
        onProjectCreated(data.project)
        handleClose()
      } else {
        setError(data.error || 'Project aanmaken mislukt')
      }
    } catch (err) {
      setError('Netwerk error')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setStep('input')
    setBriefingText('')
    setClientName('')
    setAnalysis(null)
    setProjectName('')
    setQuoteAmount('')
    setError(null)
    onClose()
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

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default: return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {step === 'input' && 'Nieuw Project'}
                {step === 'analysis' && 'Project Intelligence'}
                {step === 'create' && 'Project Aanmaken'}
              </h2>
              <p className="text-sm text-slate-500">
                {step === 'input' && 'Plak een briefing voor AI analyse'}
                {step === 'analysis' && 'Review de AI analyse'}
                {step === 'create' && 'Bevestig projectdetails'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* STEP 1: Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Klantnaam (optioneel)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Bijv. Acme B.V."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Briefing / Projectomschrijving *
                </label>
                <textarea
                  value={briefingText}
                  onChange={(e) => setBriefingText(e.target.value)}
                  placeholder="Plak hier de briefing van de klant, e-mail, of projectomschrijving...

De AI analyseert dit en haalt eruit:
• Pijnpunten
• Must-haves
• Vragen om te stellen
• Aannames
• Risico's"
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {briefingText.length} tekens • minimaal 50 nodig
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Analysis */}
          {step === 'analysis' && analysis && (
            <div className="space-y-4">
              {/* Project summary */}
              <div className="p-4 bg-violet-50 rounded-xl">
                <h3 className="font-semibold text-violet-900">{analysis.projectName}</h3>
                <p className="text-sm text-violet-700 mt-1">{analysis.oneLiner}</p>
                {(analysis.timeline || analysis.budget) && (
                  <div className="flex gap-4 mt-3 text-xs text-violet-600">
                    {analysis.timeline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {analysis.timeline}
                      </span>
                    )}
                    {analysis.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> {analysis.budget}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pain Points */}
              <CollapsibleSection
                title="Pijnpunten"
                icon={<AlertCircle className="w-4 h-4 text-red-500" />}
                count={analysis.painPoints.length}
                expanded={expandedSections.has('painPoints')}
                onToggle={() => toggleSection('painPoints')}
              >
                <div className="space-y-2">
                  {analysis.painPoints.map((pain, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${severityColor(pain.severity)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{pain.title}</span>
                        <span className="text-xs uppercase">{pain.severity}</span>
                      </div>
                      <p className="text-sm opacity-80">{pain.description}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Must-Haves */}
              <CollapsibleSection
                title="Must-Haves"
                icon={<CheckCircle className="w-4 h-4 text-green-500" />}
                count={analysis.mustHaves.length}
                expanded={expandedSections.has('mustHaves')}
                onToggle={() => toggleSection('mustHaves')}
              >
                <div className="space-y-2">
                  {analysis.mustHaves.map((must, i) => (
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

              {/* Questions */}
              <CollapsibleSection
                title="Vragen om te stellen"
                icon={<HelpCircle className="w-4 h-4 text-blue-500" />}
                count={analysis.questions.length}
                expanded={expandedSections.has('questions')}
                onToggle={() => toggleSection('questions')}
              >
                <div className="space-y-2">
                  {analysis.questions.map((q, i) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium text-sm text-blue-900">{q.question}</p>
                      <p className="text-xs text-blue-600 mt-1">{q.context}</p>
                      {q.suggestedDefault && (
                        <p className="text-xs text-blue-500 mt-1 italic">
                          Default: {q.suggestedDefault}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Assumptions */}
              {analysis.assumptions.length > 0 && (
                <CollapsibleSection
                  title="Aannames"
                  icon={<Target className="w-4 h-4 text-amber-500" />}
                  count={analysis.assumptions.length}
                  expanded={expandedSections.has('assumptions')}
                  onToggle={() => toggleSection('assumptions')}
                >
                  <ul className="space-y-1">
                    {analysis.assumptions.map((a, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* Out of Scope */}
              {analysis.outOfScope.length > 0 && (
                <CollapsibleSection
                  title="Buiten Scope"
                  icon={<X className="w-4 h-4 text-slate-500" />}
                  count={analysis.outOfScope.length}
                  expanded={expandedSections.has('outOfScope')}
                  onToggle={() => toggleSection('outOfScope')}
                >
                  <ul className="space-y-1">
                    {analysis.outOfScope.map((item, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}
            </div>
          )}

          {/* STEP 3: Create (now embedded in step 2) */}
          {step === 'analysis' && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">Project Aanmaken</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Projectnaam *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Klantnaam
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Offertebedrag (€)
                  </label>
                  <input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          {step === 'input' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Annuleren
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || briefingText.length < 50}
                className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg 
                         hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyseren...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyseer Briefing
                  </>
                )}
              </button>
            </>
          )}

          {step === 'analysis' && (
            <>
              <button
                onClick={() => setStep('input')}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Terug
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !projectName.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aanmaken...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Project Aanmaken
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Collapsible section component
function CollapsibleSection({ 
  title, 
  icon, 
  count, 
  expanded, 
  onToggle, 
  children 
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
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="px-4 py-3">
          {children}
        </div>
      )}
    </div>
  )
}
