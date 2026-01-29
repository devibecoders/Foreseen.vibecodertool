'use client'

import { useState } from 'react'
import { 
  Info, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  AlertCircle
} from 'lucide-react'

interface ArticleSignals {
  categories: string[]
  entities: string[]
  tools: string[]
  concepts: string[]
  contexts: string[]
}

interface ScoringReason {
  key: string
  weight: number
  type: string
}

interface ArticleExplainabilityProps {
  articleId: string
  baseScore: number
  adjustedScore: number
  preferenceDelta: number
  boosted: ScoringReason[]
  suppressed: ScoringReason[]
  signals?: ArticleSignals
  isPersonalized: boolean
  compact?: boolean
}

export default function ArticleExplainability({
  articleId,
  baseScore,
  adjustedScore,
  preferenceDelta,
  boosted,
  suppressed,
  signals,
  isPersonalized,
  compact = false,
}: ArticleExplainabilityProps) {
  const [expanded, setExpanded] = useState(false)

  const hasExplanation = boosted.length > 0 || suppressed.length > 0

  function getTypeColor(type: string) {
    switch (type) {
      case 'context': return 'text-purple-600 bg-purple-50'
      case 'concept': return 'text-blue-600 bg-blue-50'
      case 'entity': return 'text-green-600 bg-green-50'
      case 'tool': return 'text-green-600 bg-green-50'
      case 'category': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  function formatKey(key: string) {
    // Clean up display: "Grok · Undress" or just "agents"
    return key.split(':').pop() || key
  }

  if (compact && !hasExplanation) {
    return null
  }

  if (compact) {
    // Inline compact view
    return (
      <div className="flex items-center gap-2 text-xs">
        {isPersonalized && (
          <span className="flex items-center gap-1 text-purple-600">
            <Sparkles className="w-3 h-3" />
            Personalized
          </span>
        )}
        {boosted.length > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <TrendingUp className="w-3 h-3" />
            {boosted.map(b => formatKey(b.key)).join(', ')}
          </span>
        )}
        {suppressed.length > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <TrendingDown className="w-3 h-3" />
            {suppressed.map(s => formatKey(s.key)).join(', ')}
          </span>
        )}
      </div>
    )
  }

  // Full explainability panel
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Why you're seeing this</span>
          {isPersonalized && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              <Sparkles className="w-3 h-3" />
              Personalized
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Score:</span>
            <span className="font-mono">{baseScore}</span>
            {preferenceDelta !== 0 && (
              <>
                <span className={preferenceDelta > 0 ? 'text-green-600' : 'text-red-500'}>
                  {preferenceDelta > 0 ? '+' : ''}{preferenceDelta.toFixed(1)}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`font-mono font-semibold ${
                  adjustedScore >= 70 ? 'text-green-600' : 
                  adjustedScore >= 50 ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {adjustedScore.toFixed(1)}
                </span>
              </>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Boosted signals */}
          {boosted.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Boosting your score
              </h4>
              <div className="space-y-1">
                {boosted.map((b, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-green-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(b.type)}`}>
                        {b.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatKey(b.key)}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-green-600">
                      +{b.weight.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppressed signals */}
          {suppressed.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                Suppressing your score
              </h4>
              <div className="space-y-1">
                {suppressed.map((s, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-red-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(s.type)}`}>
                        {s.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatKey(s.key)}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-red-500">
                      {s.weight.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All detected signals */}
          {signals && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Detected Signals
              </h4>
              <div className="flex flex-wrap gap-1">
                {signals.contexts?.map(ctx => (
                  <span key={ctx} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    {ctx.replace('context:', '').replace('|', ' · ')}
                  </span>
                ))}
                {signals.concepts?.map(con => (
                  <span key={con} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {con.replace('concept:', '')}
                  </span>
                ))}
                {signals.entities?.map(ent => (
                  <span key={ent} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    {ent.replace('entity:', '')}
                  </span>
                ))}
                {signals.tools?.map(tool => (
                  <span key={tool} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    {tool.replace('tool:', '')}
                  </span>
                ))}
                {signals.categories?.map(cat => (
                  <span key={cat} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {cat.replace('category:', '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No explanation */}
          {!hasExplanation && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <AlertCircle className="w-4 h-4" />
              <span>No personalization applied yet. Make decisions to train your preferences.</span>
            </div>
          )}

          {/* Scoring formula reference */}
          <div className="text-xs text-gray-400 pt-2 border-t">
            Formula: base_score + (contexts×0.70 + concepts×0.40 + entities×0.15 + categories×0.05)
          </div>
        </div>
      )}
    </div>
  )
}
