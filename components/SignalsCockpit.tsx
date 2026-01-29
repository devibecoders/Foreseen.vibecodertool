'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

interface SignalWeight {
  feature_key: string
  feature_type: string
  feature_value: string
  weight: number
  state: string
  last_decision_at: string | null
  decision_count: number
  updated_at: string
}

interface WeightHealth {
  feature_type: string
  total_weights: number
  never_used: number
  stale_4w: number
  stale_8w: number
  avg_weight: number
  avg_decisions: number
}

export default function SignalsCockpit() {
  const [weights, setWeights] = useState<SignalWeight[]>([])
  const [health, setHealth] = useState<WeightHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedType, setExpandedType] = useState<string | null>('context')
  const [showMuted, setShowMuted] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/preferences')
      const data = await res.json()
      setWeights(data.weights || [])
      setHealth(data.health || [])
    } catch (err) {
      console.error('Failed to fetch signals:', err)
    }
    setLoading(false)
  }

  async function handleReset(featureKey: string) {
    if (!confirm(`Reset weight for "${featureKey}"?`)) return
    
    try {
      await fetch('/api/preferences/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey })
      })
      fetchData()
    } catch (err) {
      console.error('Failed to reset:', err)
    }
  }

  async function handleMute(featureKey: string, currentState: string) {
    const newState = currentState === 'muted' ? 'active' : 'muted'
    
    try {
      await fetch('/api/preferences/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_key: featureKey, state: newState })
      })
      fetchData()
    } catch (err) {
      console.error('Failed to mute/unmute:', err)
    }
  }

  // Group weights by type
  const groupedWeights = weights.reduce((acc, w) => {
    const type = w.feature_type
    if (!acc[type]) acc[type] = []
    acc[type].push(w)
    return acc
  }, {} as Record<string, SignalWeight[]>)

  // Sort each group by absolute weight
  Object.keys(groupedWeights).forEach(type => {
    groupedWeights[type].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  })

  const typeOrder = ['context', 'concept', 'entity', 'tool', 'category', 'tag']
  const sortedTypes = typeOrder.filter(t => groupedWeights[t]?.length > 0)

  function getWeightColor(weight: number, state: string) {
    if (state === 'muted') return 'text-gray-400'
    if (weight > 2) return 'text-green-600'
    if (weight > 0) return 'text-green-500'
    if (weight < -2) return 'text-red-600'
    if (weight < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  function getWeightBg(weight: number, state: string) {
    if (state === 'muted') return 'bg-gray-100'
    if (weight > 2) return 'bg-green-50'
    if (weight > 0) return 'bg-green-50/50'
    if (weight < -2) return 'bg-red-50'
    if (weight < 0) return 'bg-red-50/50'
    return 'bg-gray-50'
  }

  function formatAge(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1d ago'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'context': return <Zap className="w-4 h-4" />
      case 'concept': return <Activity className="w-4 h-4" />
      case 'entity': return <TrendingUp className="w-4 h-4" />
      case 'tool': return <TrendingUp className="w-4 h-4" />
      case 'category': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  function getTypeMultiplier(type: string) {
    switch (type) {
      case 'context': return '0.70×'
      case 'concept': return '0.40×'
      case 'entity': return '0.15×'
      case 'tool': return '0.15×'
      case 'category': return '0.05×'
      default: return '0.05×'
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Signals Cockpit
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your personalization weights by signal type
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMuted(!showMuted)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showMuted 
                ? 'bg-gray-200 text-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showMuted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showMuted ? 'Showing Muted' : 'Muted Hidden'}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Health Overview */}
      {health.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health.map(h => (
            <div key={h.feature_type} className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(h.feature_type)}
                <span className="font-medium capitalize">{h.feature_type}s</span>
                <span className="text-xs text-gray-400 ml-auto">{getTypeMultiplier(h.feature_type)}</span>
              </div>
              <div className="text-2xl font-semibold">{h.total_weights}</div>
              <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                <div className="flex justify-between">
                  <span>Avg weight:</span>
                  <span className={h.avg_weight > 0 ? 'text-green-600' : h.avg_weight < 0 ? 'text-red-600' : ''}>
                    {h.avg_weight > 0 ? '+' : ''}{h.avg_weight}
                  </span>
                </div>
                {h.stale_4w > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Stale (4w+):</span>
                    <span>{h.stale_4w}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signal Groups */}
      <div className="space-y-4">
        {sortedTypes.map(type => {
          const typeWeights = groupedWeights[type].filter(w => 
            showMuted || w.state !== 'muted'
          )
          if (typeWeights.length === 0) return null

          const isExpanded = expandedType === type
          const topWeights = isExpanded ? typeWeights : typeWeights.slice(0, 5)
          const hasMore = typeWeights.length > 5

          return (
            <div key={type} className="bg-white rounded-lg border overflow-hidden">
              {/* Type Header */}
              <button
                onClick={() => setExpandedType(isExpanded ? null : type)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTypeIcon(type)}
                  <span className="font-medium capitalize">{type}s</span>
                  <span className="text-sm text-gray-400">({typeWeights.length})</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                    {getTypeMultiplier(type)} impact
                  </span>
                </div>
                {hasMore && (
                  isExpanded 
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Weights List */}
              <div className="border-t divide-y">
                {topWeights.map(w => (
                  <div 
                    key={w.feature_key}
                    className={`flex items-center justify-between px-4 py-3 ${getWeightBg(w.weight, w.state)}`}
                  >
                    <div className="flex items-center gap-3">
                      {w.state === 'muted' && (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`font-medium ${w.state === 'muted' ? 'text-gray-400 line-through' : ''}`}>
                        {w.feature_value}
                      </span>
                      {w.decision_count > 0 && (
                        <span className="text-xs text-gray-400">
                          {w.decision_count} decisions
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatAge(w.last_decision_at)}
                      </span>
                      <span className={`font-mono font-medium ${getWeightColor(w.weight, w.state)}`}>
                        {w.weight > 0 ? '+' : ''}{w.weight.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMute(w.feature_key, w.state)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={w.state === 'muted' ? 'Unmute' : 'Mute'}
                        >
                          {w.state === 'muted' 
                            ? <Eye className="w-4 h-4 text-gray-400" />
                            : <EyeOff className="w-4 h-4 text-gray-400" />
                          }
                        </button>
                        <button
                          onClick={() => handleReset(w.feature_key)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Reset weight"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {!isExpanded && hasMore && (
                  <button
                    onClick={() => setExpandedType(type)}
                    className="w-full py-2 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Show {typeWeights.length - 5} more...
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {weights.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No signal weights yet.</p>
          <p className="text-sm">Make some decisions to start building your preferences.</p>
        </div>
      )}
    </div>
  )
}
