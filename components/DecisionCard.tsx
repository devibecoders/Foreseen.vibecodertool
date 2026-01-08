'use client'

import { useState, useEffect } from 'react'
import { Zap, Eye, Ban, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { generateDecisionAssessment, getActionBadgeStyle, getAlignmentColor, type DecisionAssessment } from '@/lib/decision-engine'

interface DecisionCardProps {
  article: any
  boundaries?: any[]
}

export default function DecisionCard({ article, boundaries = [] }: DecisionCardProps) {
  const [assessment, setAssessment] = useState<DecisionAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (article && article.analysis) {
      loadAssessment()
    }
  }, [article])

  const loadAssessment = async () => {
    setLoading(true)
    try {
      const result = await generateDecisionAssessment(article, boundaries)
      setAssessment(result)
    } catch (error) {
      console.error('Error generating decision assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-xl p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-gray-600">Analyzing decision intelligence...</p>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  const badgeStyle = getActionBadgeStyle(assessment.action)
  const alignmentColor = getAlignmentColor(assessment.vibecodeAlignment)

  const ActionIcon = assessment.action === 'EXPERIMENT' ? Zap : assessment.action === 'MONITOR' ? Eye : Ban

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-900 rounded-r-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Decision Intelligence</h3>
      </div>

      {/* Action Badge - Large and Prominent */}
      <div className="flex items-center justify-center">
        <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-2xl border-2 ${badgeStyle.border} ${badgeStyle.bg} shadow-lg`}>
          <span className="text-4xl">{assessment.actionEmoji}</span>
          <div>
            <p className={`text-2xl font-bold ${badgeStyle.text}`}>{assessment.actionLabel.toUpperCase()}</p>
            <p className="text-xs text-gray-600 mt-0.5">Recommended Action</p>
          </div>
        </div>
      </div>

      {/* Vibecode Alignment Meter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Vibecode Alignment</p>
          <p className={`text-lg font-bold ${
            assessment.vibecodeAlignment >= 70 ? 'text-success-600' :
            assessment.vibecodeAlignment >= 50 ? 'text-warning-600' :
            'text-danger-600'
          }`}>
            {assessment.vibecodeAlignment}%
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${alignmentColor}`}
            style={{ width: `${assessment.vibecodeAlignment}%` }}
          />
        </div>
      </div>

      {/* Rationale */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" />
          Why This Action?
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{assessment.rationale}</p>
      </div>

      {/* Horizon Timeline */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Impact Horizon
        </p>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            assessment.horizon === 'immediate' ? 'bg-success-500' :
            assessment.horizon === 'short-term' ? 'bg-warning-500' :
            assessment.horizon === 'medium-term' ? 'bg-brand-500' :
            'bg-slate-400'
          }`} />
          <p className="text-sm font-semibold text-gray-900">{assessment.horizonLabel}</p>
        </div>
      </div>

      {/* Conflicting Boundaries */}
      {assessment.conflictingBoundaries.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-danger-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Boundary Conflicts
          </p>
          <ul className="space-y-1">
            {assessment.conflictingBoundaries.map((boundary, idx) => (
              <li key={idx} className="text-sm text-danger-700 flex items-start gap-2">
                <span className="text-danger-500 mt-0.5">•</span>
                <span>{boundary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aligned Principles */}
      {assessment.alignedPrinciples.length > 0 && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-success-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Aligned Principles
          </p>
          <div className="flex flex-wrap gap-2">
            {assessment.alignedPrinciples.map((principle, idx) => (
              <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-success-100 text-success-700 border border-success-200">
                {principle}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
