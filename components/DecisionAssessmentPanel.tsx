'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, TrendingUp, Save, Radar as RadarIcon, Shield, Loader2, VolumeX, Info, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { extractSignals, type ExtractedSignals } from '@/lib/signals/extractSignals'

interface DecisionAssessmentPanelProps {
  article: any
  scanId?: string
  analysisId?: string
  boundaries?: any[]
  onSave?: (decision: DecisionAssessment) => void
}

interface DecisionAssessment {
  action_required: 'ignore' | 'monitor' | 'experiment' | 'integrate'
  impact_horizon: 'direct' | 'mid' | 'long'
  confidence_score: number
  risk_if_ignored: string
  advantage_if_early: string
  boundary_conflict_detected: boolean
  conflict_notes: string
}

const ACTION_OPTIONS = [
  { value: 'ignore', label: 'Ignore', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: '🚫' },
  { value: 'monitor', label: 'Monitor', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '👁' },
  { value: 'experiment', label: 'Experiment', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '⚡' },
  { value: 'integrate', label: 'Integrate', color: 'bg-green-100 text-green-700 border-green-300', icon: '✅' },
]

const HORIZON_OPTIONS = [
  { value: 'direct', label: 'Direct', description: '0-2 weeks', color: 'bg-red-500' },
  { value: 'mid', label: 'Mid-term', description: '1-3 months', color: 'bg-yellow-500' },
  { value: 'long', label: 'Long-term', description: '6+ months', color: 'bg-blue-500' },
]

export default function DecisionAssessmentPanel({ article, scanId, analysisId, boundaries = [], onSave }: DecisionAssessmentPanelProps) {
  const [decision, setDecision] = useState<DecisionAssessment>({
    action_required: 'monitor',
    impact_horizon: 'mid',
    confidence_score: 3,
    risk_if_ignored: '',
    advantage_if_early: '',
    boundary_conflict_detected: false,
    conflict_notes: ''
  })

  const [conflictingBoundaries, setConflictingBoundaries] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [signals, setSignals] = useState<ExtractedSignals | null>(null)

  // Extract signals on mount or article change
  useEffect(() => {
    const extracted = extractSignals({
      title: article.title,
      summary: article.analysis?.summary,
      categories: article.analysis?.categories,
      content: article.raw_content
    })
    setSignals(extracted)
  }, [article])

  useEffect(() => {
    checkBoundaryConflicts()
  }, [decision.action_required, boundaries])

  const checkBoundaryConflicts = () => {
    if (decision.action_required !== 'integrate' && decision.action_required !== 'experiment') {
      setConflictingBoundaries([])
      setDecision(prev => ({ ...prev, boundary_conflict_detected: false, conflict_notes: '' }))
      return
    }

    // Mock boundary checking logic
    const articleText = `${article.title} ${article.analysis?.summary || ''}`.toLowerCase()
    const conflicts: any[] = []

    boundaries.forEach(boundary => {
      // Simple keyword matching (in production, use LLM)
      const boundaryKeywords = boundary.title.toLowerCase().split(' ')
      const hasConflict = boundaryKeywords.some((keyword: string) =>
        keyword.length > 3 && articleText.includes(keyword)
      )

      if (hasConflict && boundary.severity === 'hard') {
        conflicts.push(boundary)
      }
    })

    setConflictingBoundaries(conflicts)

    if (conflicts.length > 0) {
      setDecision(prev => ({
        ...prev,
        boundary_conflict_detected: true,
        conflict_notes: `Conflicts with boundary: ${conflicts.map(c => c.title).join(', ')}`
      }))
    } else {
      setDecision(prev => ({
        ...prev,
        boundary_conflict_detected: false,
        conflict_notes: ''
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article.id,
          analysis_id: analysisId || article.analysis?.id,
          scan_id: scanId,
          action_required: decision.action_required,
          impact_horizon: decision.impact_horizon,
          confidence: decision.confidence_score,
          risk_if_ignored: decision.risk_if_ignored,
          advantage_if_early: decision.advantage_if_early
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Decision saved!', {
          description: `Marked as ${decision.action_required}`
        })
        if (onSave) {
          onSave(decision)
        }
      } else {
        toast.error('Failed to save', { description: data.error })
      }
    } catch (error) {
      console.error('Error saving decision:', error)
      toast.error('Failed to save decision', { description: 'Check console for details' })
    } finally {
      setSaving(false)
    }
  }

  const handleMuteTopic = async () => {
    const categoriesStr = article.analysis?.categories || ''
    const categories = categoriesStr.split(',').map((c: string) => c.trim()).filter(Boolean)

    if (categories.length === 0) {
      toast.error('No topics found to mute')
      return
    }

    const primaryTopic = categories[0]

    setSaving(true)
    try {
      const response = await fetch('/api/preferences/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_type: 'CATEGORY',
          key_value: primaryTopic,
          muted: true
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Topic muted', {
          description: `${primaryTopic} will be suppressed in future scans.`
        })
        if (onSave) {
          onSave(decision)
        }
      } else {
        toast.error('Failed to mute', { description: data.error })
      }
    } catch (error) {
      console.error('Error muting topic:', error)
      toast.error('Failed to mute topic')
    } finally {
      setSaving(false)
    }
  }

  const handleAddToRadar = () => {
    const status = decision.action_required === 'monitor' ? 'assess' : 'trial'
    toast.info('Tech Radar', {
      description: `Adding "${article.title}" to Radar as ${status}.`
    })
    // TODO: Implement actual API call
  }

  const handleCreateBoundary = () => {
    toast.info('Boundary Created', {
      description: `Standard boundary added for "${article.title}".`
    })
    // TODO: Implement actual API call
  }

  // Format context label prettily
  const formatContext = (key: string) => {
    // "context:entity:grok|concept:undress" -> "Grok · Undress"
    return key.replace('context:', '')
      .replace('entity:', '')
      .replace('tool:', '')
      .replace('concept:', '')
      .split('|').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')
  }

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Strategic Decision</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Impact & Commitment</p>
        </div>
      </div>

      {/* Decision Context UI (New Section) */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Quick Summary Header */}
        <div className="bg-slate-50/50 p-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-2">Decision Context</h4>
              <p className="text-sm font-bold text-slate-700 leading-tight line-clamp-2">
                {article.analysis?.summary || article.summary}
              </p>
            </div>
            {(article.adjusted_score || article.analysis?.impactScore) && (
              <div className="text-right flex-shrink-0">
                <div className={`text-xl font-black ${(article.adjusted_score ?? article.analysis.impactScore) >= 70 ? 'text-green-600' : 'text-slate-400'}`}>
                  {Math.round(article.adjusted_score ?? article.analysis.impactScore)}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Key Facts */}
          {article.analysis?.keyTakeaways && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Facts</span>
              </div>
              <ul className="space-y-1.5 ml-1">
                {article.analysis.keyTakeaways.split('|||').slice(0, 3).map((fact: string, i: number) => (
                  <li key={i} className="text-xs font-medium text-slate-600 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Explainability (Why Surfaced) */}
          {article.reasons && (article.reasons.boosted.length > 0 || article.reasons.suppressed.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Why Surfaced</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                {article.reasons.boosted.slice(0, 2).map((r: any) => (
                  <span key={r.key} className="text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 flex items-center gap-1">
                    ↑ Boosted by {r.key} (+{r.weight.toFixed(1)})
                  </span>
                ))}
                {article.reasons.suppressed.slice(0, 2).map((r: any) => (
                  <span key={r.key} className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                    ↓ Suppressed by {r.key} ({r.weight.toFixed(1)})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Signals */}
          {signals && signals.allKeys.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Training Signals (Will Update)
              </span>

              {/* Contexts (Dominant) */}
              {signals.contexts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {signals.contexts.map(c => (
                    <span key={c} className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-wider border border-teal-200 shadow-sm" title="Context Signal (High Priority)">
                      ✨ {formatContext(c)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 opacity-80">
                {/* Concepts */}
                {signals.concepts.map(c => (
                  <span key={c} className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-100">
                    {c.replace('concept:', '')}
                  </span>
                ))}
                {/* Entities */}
                {signals.entities.map(c => (
                  <span key={c} className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider border border-purple-100">
                    {c.replace('entity:', '')}
                  </span>
                ))}
                {/* Tools */}
                {signals.tools.map(c => (
                  <span key={c} className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                    {c.replace('tool:', '')}
                  </span>
                ))}
                {/* Categories */}
                {signals.categories.map(c => (
                  <span key={c} className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-100">
                    {c.replace('category:', '')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Selector - Large Buttons */}
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          Required Action
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ACTION_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setDecision({ ...decision, action_required: option.value as any })}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${decision.action_required === option.value
                ? `bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]`
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 shadow-sm'
                }`}
            >
              <div className="text-3xl">{option.icon}</div>
              <div className="text-xs font-black uppercase tracking-widest">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Boundary Conflict Warning */}
      {conflictingBoundaries.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-inner">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Boundary Violation</p>
              <p className="text-sm font-bold text-red-900 leading-tight">This action conflicts with current operational boundaries.</p>
              <div className="mt-3 space-y-2">
                {conflictingBoundaries.map(boundary => (
                  <div key={boundary.id} className="p-3 bg-white/50 rounded-xl border border-red-100">
                    <p className="text-xs font-black text-red-800 uppercase tracking-tight">{boundary.title}</p>
                    <p className="text-[10px] text-red-700 mt-1 font-medium leading-relaxed">{boundary.rationale || boundary.why_not}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impact Horizon - Large Vertical Buttons for Mobile */}
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          Impact Horizon
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {HORIZON_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setDecision({ ...decision, impact_horizon: option.value as any })}
              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${decision.impact_horizon === option.value
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
            >
              <div className={`w-3 h-3 rounded-full shadow-inner ${option.color}`} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{option.label}</p>
                <p className={`text-[10px] font-bold ${decision.impact_horizon === option.value ? 'text-slate-400' : 'text-slate-400'}`}>{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="space-y-4">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
          Confidence Level
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => setDecision({ ...decision, confidence_score: score })}
              className={`flex-1 h-14 rounded-2xl border-2 transition-all font-black text-lg active:scale-90 shadow-sm ${decision.confidence_score >= score
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-200 border-slate-100 hover:border-slate-200'
                }`}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Risk Mitigation
          </label>
          <textarea
            value={decision.risk_if_ignored}
            onChange={(e) => setDecision({ ...decision, risk_if_ignored: e.target.value })}
            rows={3}
            className="w-full px-5 py-4 text-sm font-bold bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300 placeholder:font-medium resize-none"
            placeholder="Potential downsides..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Competitive Gain
          </label>
          <textarea
            value={decision.advantage_if_early}
            onChange={(e) => setDecision({ ...decision, advantage_if_early: e.target.value })}
            rows={3}
            className="w-full px-5 py-4 text-sm font-bold bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300 placeholder:font-medium resize-none"
            placeholder="Strategic upside..."
          />
        </div>
      </div>

      {/* Action Buttons - Large & Spaced */}
      <div className="flex flex-col gap-3 pt-6 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={saving || (conflictingBoundaries.length > 0 && decision.action_required === 'integrate')}
          className="w-full h-16 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl text-base font-black uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 border-2 border-slate-900 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Commit Decision
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          {(decision.action_required === 'monitor' || decision.action_required === 'experiment') && (
            <button
              onClick={handleAddToRadar}
              className="h-14 flex items-center justify-center gap-2 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95"
            >
              <RadarIcon className="w-4 h-4" />
              Add to Radar
            </button>
          )}

          {decision.action_required === 'ignore' && (
            <button
              onClick={handleCreateBoundary}
              className="h-14 flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
            >
              <Shield className="w-4 h-4" />
              Add Boundary
            </button>
          )}

          <button
            className="h-14 flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 col-span-1"
            onClick={() => toast.info('Full Editor coming soon', { description: 'Advanced decision mapping is in beta.' })}
          >
            Full Details
          </button>
        </div>

        {/* Mute Section */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={handleMuteTopic}
            disabled={saving}
            className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            <VolumeX className="w-4 h-4" />
            Mute this topic (hard suppress)
          </button>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            Muting will ensure you see far less of this topic across all research.
          </p>
        </div>
      </div>
    </div>
  )
}
