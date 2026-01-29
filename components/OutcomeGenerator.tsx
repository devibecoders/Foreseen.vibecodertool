'use client'

import { useState } from 'react'
import { 
  CheckSquare, 
  Bell, 
  Zap, 
  X, 
  Loader2, 
  Copy, 
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import type { 
  GeneratedOutcome, 
  ChecklistOutcome, 
  ReminderOutcome, 
  SpikeOutcome 
} from '@/lib/outcomeGenerator'

type OutcomeType = 'checklist' | 'reminder' | 'spike'

interface OutcomeGeneratorProps {
  articleId: string
  articleTitle: string
  suggestedAction?: 'integrate' | 'experiment' | 'monitor'
  className?: string
}

/**
 * One-click outcome generator buttons
 * Generates checklist/reminder/spike on demand (LLM behind button)
 */
export function OutcomeGenerator({
  articleId,
  articleTitle,
  suggestedAction,
  className = ''
}: OutcomeGeneratorProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [outcome, setOutcome] = useState<GeneratedOutcome | null>(null)
  const [markdown, setMarkdown] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [activeType, setActiveType] = useState<OutcomeType | null>(null)

  const handleGenerate = async (type: OutcomeType) => {
    setActiveType(type)
    setLoading(true)
    setShowModal(true)
    setOutcome(null)
    setMarkdown('')

    try {
      const response = await fetch('/api/outcomes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, outcomeType: type })
      })

      const data = await response.json()

      if (data.success) {
        setOutcome(data.outcome)
        setMarkdown(data.markdown)
      } else {
        throw new Error(data.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Generate error:', error)
      // Set a fallback error outcome
      setOutcome(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine which button to highlight based on suggested action
  const getButtonVariant = (type: OutcomeType) => {
    if (suggestedAction === 'integrate' && type === 'checklist') return 'primary'
    if (suggestedAction === 'experiment' && type === 'spike') return 'primary'
    if (suggestedAction === 'monitor' && type === 'reminder') return 'primary'
    return 'secondary'
  }

  return (
    <>
      {/* Button Group */}
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-slate-500 mr-1">Generate:</span>
        
        <OutcomeButton
          icon={<CheckSquare className="w-3.5 h-3.5" />}
          label="Checklist"
          variant={getButtonVariant('checklist')}
          onClick={() => handleGenerate('checklist')}
        />
        
        <OutcomeButton
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Spike"
          variant={getButtonVariant('spike')}
          onClick={() => handleGenerate('spike')}
        />
        
        <OutcomeButton
          icon={<Bell className="w-3.5 h-3.5" />}
          label="Reminder"
          variant={getButtonVariant('reminder')}
          onClick={() => handleGenerate('reminder')}
        />
      </div>

      {/* Result Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {activeType === 'checklist' && <CheckSquare className="w-5 h-5 text-green-600" />}
                {activeType === 'spike' && <Zap className="w-5 h-5 text-blue-600" />}
                {activeType === 'reminder' && <Bell className="w-5 h-5 text-amber-600" />}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {activeType === 'checklist' && 'Implementation Checklist'}
                    {activeType === 'spike' && 'Spike Plan'}
                    {activeType === 'reminder' && 'Monitoring Reminder'}
                  </h3>
                  <p className="text-sm text-slate-500 truncate max-w-md">
                    {articleTitle}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
                  <p className="text-sm text-slate-600">
                    Generating your {activeType}...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    This uses AI and may take a few seconds
                  </p>
                </div>
              ) : outcome ? (
                <div>
                  {outcome.type === 'checklist' && (
                    <ChecklistDisplay outcome={outcome as ChecklistOutcome} />
                  )}
                  {outcome.type === 'spike' && (
                    <SpikeDisplay outcome={outcome as SpikeOutcome} />
                  )}
                  {outcome.type === 'reminder' && (
                    <ReminderDisplay outcome={outcome as ReminderOutcome} />
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500">
                  <p>Failed to generate outcome.</p>
                  <button
                    onClick={() => activeType && handleGenerate(activeType)}
                    className="mt-4 text-sm text-blue-600 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {outcome && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium 
                             text-slate-700 hover:bg-white rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy as Markdown
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white 
                             bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function OutcomeButton({
  icon,
  label,
  variant,
  onClick
}: {
  icon: React.ReactNode
  label: string
  variant: 'primary' | 'secondary'
  onClick: () => void
}) {
  const isPrimary = variant === 'primary'
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                  transition-colors ${
                    isPrimary 
                      ? 'bg-slate-900 text-white hover:bg-slate-800' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ChecklistDisplay({ outcome }: { outcome: ChecklistOutcome }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-semibold text-slate-900 mb-2">{outcome.title}</h4>
        <p className="text-slate-600">{outcome.objective}</p>
      </div>

      {outcome.prerequisites.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h5 className="text-sm font-semibold text-amber-800 mb-2">Prerequisites</h5>
          <ul className="space-y-1">
            {outcome.prerequisites.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                <ChevronRight className="w-3 h-3" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {outcome.items.map((item) => (
          <div 
            key={item.step}
            className="flex gap-4 p-4 bg-white border border-slate-200 rounded-lg"
          >
            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center
                            ${item.priority === 'high' ? 'bg-red-100 text-red-700' :
                              item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'}`}>
              {item.step}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h6 className="font-medium text-slate-900">{item.title}</h6>
                {item.estimated_time && (
                  <span className="text-xs text-slate-500">{item.estimated_time}</span>
                )}
              </div>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
        <div>
          <p className="text-sm text-green-800">
            <strong>Total time:</strong> {outcome.estimated_total_time}
          </p>
          <p className="text-sm text-green-700 mt-1">
            <strong>Success:</strong> {outcome.success_criteria}
          </p>
        </div>
      </div>
    </div>
  )
}

function SpikeDisplay({ outcome }: { outcome: SpikeOutcome }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-semibold text-slate-900 mb-2">{outcome.title}</h4>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            ⏱️ {outcome.timebox}
          </span>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="text-sm font-semibold text-blue-800 mb-1">Hypothesis</h5>
        <p className="text-blue-700">{outcome.hypothesis}</p>
      </div>

      <div>
        <h5 className="text-sm font-semibold text-slate-700 mb-3">Steps</h5>
        <ol className="space-y-2">
          {outcome.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 bg-slate-100 rounded-full 
                              flex items-center justify-center text-xs font-medium text-slate-600">
                {i + 1}
              </span>
              <span className="text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-sm font-semibold text-green-800 mb-2">✓ Success Metrics</h5>
          <ul className="space-y-1">
            {outcome.success_metrics.map((item, i) => (
              <li key={i} className="text-sm text-green-700">• {item}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="text-sm font-semibold text-red-800 mb-2">✕ Abort When</h5>
          <ul className="space-y-1">
            {outcome.abort_criteria.map((item, i) => (
              <li key={i} className="text-sm text-red-700">• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {outcome.resources_needed.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-slate-700 mb-2">Resources Needed</h5>
          <div className="flex flex-wrap gap-2">
            {outcome.resources_needed.map((item, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReminderDisplay({ outcome }: { outcome: ReminderOutcome }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xl font-semibold text-slate-900 mb-2">{outcome.title}</h4>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            🗓️ Check {outcome.check_date}
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h5 className="text-sm font-semibold text-slate-700 mb-1">Current Status</h5>
        <p className="text-slate-600">{outcome.current_status}</p>
      </div>

      <div>
        <h5 className="text-sm font-semibold text-slate-700 mb-3">What to Check</h5>
        <ul className="space-y-2">
          {outcome.what_to_check.map((item, i) => (
            <li key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h5 className="text-sm font-semibold text-green-800 mb-2">🎯 Trigger Signals</h5>
        <p className="text-sm text-green-700 mb-2">When any of these happen, it's time to act:</p>
        <ul className="space-y-1">
          {outcome.trigger_signals.map((item, i) => (
            <li key={i} className="text-sm text-green-700">→ {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
