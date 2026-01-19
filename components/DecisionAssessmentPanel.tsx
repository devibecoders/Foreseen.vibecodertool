'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Save, Radar as RadarIcon, Shield, Loader2 } from 'lucide-react'

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
        if (onSave) {
          onSave(decision)
        }
        alert('Decision saved!')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving decision:', error)
      alert('Failed to save decision')
    } finally {
      setSaving(false)
    }
  }

  const handleAddToRadar = () => {
    const status = decision.action_required === 'monitor' ? 'assess' : 'trial'
    alert(`Adding "${article.title}" to Tech Radar (${status})`)
    // TODO: Implement actual API call
  }

  const handleCreateBoundary = () => {
    alert(`Creating boundary rule based on: "${article.title}"`)
    // TODO: Implement actual API call
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-900 rounded-r-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Decision Assessment</h3>
      </div>

      {/* Action Selector - Large Buttons */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Required Action
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ACTION_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setDecision({ ...decision, action_required: option.value as any })}
              className={`p-4 rounded-lg border-2 transition-all ${decision.action_required === option.value
                ? `${option.color} ring-2 ring-offset-2 ring-slate-900`
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className="text-sm font-semibold">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Boundary Conflict Warning */}
      {conflictingBoundaries.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900 mb-2">⚠️ BOUNDARY CONFLICT DETECTED</p>
              {conflictingBoundaries.map(boundary => (
                <div key={boundary.id} className="mb-2">
                  <p className="text-sm text-red-800 font-semibold">{boundary.title}</p>
                  <p className="text-xs text-red-700 mt-1">{boundary.rationale || boundary.why_not}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Impact Horizon - Timeline Visual */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
          <Clock className="w-3 h-3 inline mr-1" />
          Impact Horizon
        </label>
        <div className="space-y-2">
          {HORIZON_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setDecision({ ...decision, impact_horizon: option.value as any })}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${decision.impact_horizon === option.value
                ? 'bg-white border-slate-900 ring-2 ring-slate-900'
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className={`w-3 h-3 rounded-full ${option.color}`} />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Confidence Score - 1-5 Meter */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Confidence Level
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(score => (
            <button
              key={score}
              onClick={() => setDecision({ ...decision, confidence_score: score })}
              className={`flex-1 h-12 rounded-lg border-2 transition-all font-bold ${decision.confidence_score >= score
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      {/* Analysis Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            Risk if Ignored
          </label>
          <textarea
            value={decision.risk_if_ignored}
            onChange={(e) => setDecision({ ...decision, risk_if_ignored: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            placeholder="What happens if we don't act on this?"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            Advantage if Early
          </label>
          <textarea
            value={decision.advantage_if_early}
            onChange={(e) => setDecision({ ...decision, advantage_if_early: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            placeholder="What do we gain by acting now?"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving || (conflictingBoundaries.length > 0 && decision.action_required === 'integrate')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Decision
            </>
          )}
        </button>

        {(decision.action_required === 'monitor' || decision.action_required === 'experiment') && (
          <button
            onClick={handleAddToRadar}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            <RadarIcon className="w-4 h-4" />
            Add to Tech Radar ({decision.action_required === 'monitor' ? 'Assess' : 'Trial'})
          </button>
        )}

        {decision.action_required === 'ignore' && (
          <button
            onClick={handleCreateBoundary}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
          >
            <Shield className="w-4 h-4" />
            Create Boundary Rule
          </button>
        )}
      </div>
    </div>
  )
}
