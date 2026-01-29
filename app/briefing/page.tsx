'use client'

import { useState, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { 
  FileText, 
  Upload, 
  Sparkles, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Clock,
  DollarSign,
  Users,
  Target,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react'
import type { BriefingSummary, PainPoint, MustHave, ClarificationQuestion } from '@/lib/briefingSummarizer'

export default function BriefingPage() {
  const [briefingText, setBriefingText] = useState('')
  const [projectContext, setProjectContext] = useState('')
  const [summary, setSummary] = useState<BriefingSummary | null>(null)
  const [markdown, setMarkdown] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAnalyze = async () => {
    if (briefingText.trim().length < 50) {
      setError('Please enter at least 50 characters of briefing text')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/briefing/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefingText, projectContext })
      })

      const data = await response.json()

      if (data.success) {
        setSummary(data.summary)
        setMarkdown(data.markdown)
        setStats(data.stats)
      } else {
        setError(data.error || 'Failed to analyze briefing')
      }
    } catch (err) {
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBriefingText(event.target?.result as string || '')
      }
      reader.readAsText(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 
                            flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Briefing Summarizer
              </h1>
              <p className="text-slate-600">
                Drop a briefing → get painpoints, must-haves, and questions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            {/* Context Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project Context (optional)
              </label>
              <input
                type="text"
                value={projectContext}
                onChange={(e) => setProjectContext(e.target.value)}
                placeholder="e.g., E-commerce platform for small businesses"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg 
                           focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Briefing Text Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Briefing Text
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative"
              >
                <textarea
                  value={briefingText}
                  onChange={(e) => setBriefingText(e.target.value)}
                  placeholder="Paste your project briefing here, or drag & drop a .txt file...

Example content:
- Project goals and objectives
- Target audience
- Technical requirements
- Design preferences
- Timeline and budget
- Success criteria"
                  rows={16}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg 
                             focus:ring-2 focus:ring-violet-500 focus:border-transparent
                             resize-none font-mono text-sm"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {briefingText.length} chars
                  </span>
                  <Upload className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || briefingText.trim().length < 50}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 
                         bg-violet-600 text-white rounded-lg font-semibold 
                         hover:bg-violet-700 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Briefing
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg 
                              text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div>
            {summary ? (
              <div className="space-y-4">
                {/* Project Header */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {summary.projectName}
                      </h2>
                      <p className="text-slate-600 mt-1">{summary.oneLiner}</p>
                    </div>
                    <button
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm 
                                 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Export
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats?.criticalPainPoints || 0}</p>
                      <p className="text-xs text-slate-500">Critical Issues</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats?.totalMustHaves || 0}</p>
                      <p className="text-xs text-slate-500">Must-Haves</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{stats?.blockingQuestions || 0}</p>
                      <p className="text-xs text-slate-500">Blockers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-600">
                        {summary.stakeholders.length}
                      </p>
                      <p className="text-xs text-slate-500">Stakeholders</p>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {summary.timeline && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 
                                       text-blue-700 rounded-full text-xs">
                        <Clock className="w-3 h-3" />
                        {summary.timeline}
                      </span>
                    )}
                    {summary.budget && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-50 
                                       text-green-700 rounded-full text-xs">
                        <DollarSign className="w-3 h-3" />
                        {summary.budget}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pain Points */}
                <CollapsibleSection 
                  title="Pain Points" 
                  icon={<AlertCircle className="w-4 h-4" />}
                  count={summary.painPoints.length}
                  defaultOpen
                >
                  <div className="space-y-3">
                    {summary.painPoints.map(pain => (
                      <PainPointCard key={pain.id} painPoint={pain} />
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Must-Haves */}
                <CollapsibleSection 
                  title="Must-Haves" 
                  icon={<CheckCircle className="w-4 h-4" />}
                  count={summary.mustHaves.length}
                  defaultOpen
                >
                  <div className="space-y-2">
                    {summary.mustHaves.map(must => (
                      <MustHaveCard key={must.id} mustHave={must} />
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Questions */}
                <CollapsibleSection 
                  title="Questions to Clarify" 
                  icon={<HelpCircle className="w-4 h-4" />}
                  count={summary.questions.length}
                >
                  <div className="space-y-3">
                    {summary.questions.map(q => (
                      <QuestionCard key={q.id} question={q} />
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Success Criteria */}
                {summary.successCriteria.length > 0 && (
                  <CollapsibleSection 
                    title="Success Criteria" 
                    icon={<Target className="w-4 h-4" />}
                    count={summary.successCriteria.length}
                  >
                    <ul className="space-y-2">
                      {summary.successCriteria.map((criteria, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <Target className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}

                {/* Out of Scope */}
                {summary.outOfScope.length > 0 && (
                  <CollapsibleSection 
                    title="Out of Scope" 
                    icon={<XCircle className="w-4 h-4" />}
                    count={summary.outOfScope.length}
                  >
                    <ul className="space-y-2">
                      {summary.outOfScope.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                          <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No briefing analyzed yet
                </h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto">
                  Paste your project briefing on the left and click "Analyze" to extract 
                  structured insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function CollapsibleSection({ 
  title, 
  icon, 
  count, 
  children, 
  defaultOpen = false 
}: {
  title: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 
                   hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-slate-900">{title}</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 
                          rounded-full text-xs font-medium">
            {count}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  )
}

function PainPointCard({ painPoint }: { painPoint: PainPoint }) {
  const severityStyles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  }
  
  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-slate-900">{painPoint.title}</h4>
        <span className={`px-2 py-0.5 rounded text-xs font-medium 
                         border ${severityStyles[painPoint.severity]}`}>
          {painPoint.severity}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-2">{painPoint.description}</p>
      <span className="text-xs text-slate-500">Area: {painPoint.affectedArea}</span>
    </div>
  )
}

function MustHaveCard({ mustHave }: { mustHave: MustHave }) {
  const categoryColors = {
    functional: 'bg-blue-50 text-blue-700',
    technical: 'bg-purple-50 text-purple-700',
    business: 'bg-green-50 text-green-700',
    design: 'bg-pink-50 text-pink-700'
  }
  
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
      <span className="w-6 h-6 bg-slate-900 text-white rounded-full 
                      flex items-center justify-center text-xs font-bold flex-shrink-0">
        {mustHave.priority}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{mustHave.requirement}</p>
        <p className="text-sm text-slate-600 mt-1">{mustHave.rationale}</p>
        <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium 
                         ${categoryColors[mustHave.category]}`}>
          {mustHave.category}
        </span>
      </div>
    </div>
  )
}

function QuestionCard({ question }: { question: ClarificationQuestion }) {
  const importanceStyles = {
    blocking: 'bg-red-50 border-red-200 text-red-700',
    important: 'bg-amber-50 border-amber-200 text-amber-700',
    'nice-to-know': 'bg-blue-50 border-blue-200 text-blue-700'
  }
  
  return (
    <div className={`p-4 rounded-lg border ${importanceStyles[question.importance]}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{question.question}</h4>
        <span className="text-xs font-medium uppercase">{question.importance}</span>
      </div>
      <p className="text-sm opacity-80 mb-2">{question.context}</p>
      {question.suggestedDefault && (
        <p className="text-xs opacity-60">
          💡 Default: {question.suggestedDefault}
        </p>
      )}
    </div>
  )
}
