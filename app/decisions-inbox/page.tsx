'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Navigation from '@/components/Navigation'
import { Inbox, Filter, TrendingUp, Clock, Target, ChevronRight, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'

interface Article {
  id: string
  title: string
  url: string
  source: string
  published_at: string
  analyses?: Array<{
    summary: string
    categories: string
    impact_score: number
  }>
}

interface Decision {
  id: string
  article_id: string
  scan_id?: string
  action_required: 'ignore' | 'monitor' | 'experiment' | 'integrate'
  impact_horizon: 'direct' | 'mid' | 'long'
  confidence: number
  created_at: string
  article?: Article
}

interface ScanStats {
  id: string
  started_at: string
  status: string
  items_analyzed: number
  decision_assessments: Array<{ count: number }>
}

export default function DecisionsInboxPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [scanStats, setScanStats] = useState<ScanStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterHorizon, setFilterHorizon] = useState<string>('all')
  const [filterScan, setFilterScan] = useState<string>('all')
  const [expandedScans, setExpandedScans] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/decisions')
      const data = await response.json()

      setDecisions(data.decisions || [])
      setScanStats(data.scanStats || [])

      // Auto-expand first scan with decisions
      if (data.scanStats && data.scanStats.length > 0) {
        const firstWithDecisions = data.scanStats.find((s: ScanStats) =>
          s.decision_assessments?.[0]?.count > 0
        )
        if (firstWithDecisions) {
          setExpandedScans(new Set([firstWithDecisions.id]))
        }
      }
    } catch (error) {
      console.error('Error fetching decisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDecisions = decisions.filter(decision => {
    if (filterAction !== 'all' && decision.action_required !== filterAction) return false
    if (filterHorizon !== 'all' && decision.impact_horizon !== filterHorizon) return false
    if (filterScan !== 'all' && decision.scan_id !== filterScan) return false
    return true
  })

  // Group decisions by scan_id
  const decisionsByScan = filteredDecisions.reduce((acc, decision) => {
    const scanId = decision.scan_id || 'no-scan'
    if (!acc[scanId]) acc[scanId] = []
    acc[scanId].push(decision)
    return acc
  }, {} as Record<string, Decision[]>)

  const toggleScanExpand = (scanId: string) => {
    setExpandedScans(prev => {
      const next = new Set(prev)
      if (next.has(scanId)) {
        next.delete(scanId)
      } else {
        next.add(scanId)
      }
      return next
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ignore': return 'bg-gray-100 text-gray-700 border-gray-300'
      case 'monitor': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'experiment': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'integrate': return 'bg-green-100 text-green-700 border-green-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getHorizonColor = (horizon: string) => {
    switch (horizon) {
      case 'direct': return 'bg-red-500'
      case 'mid': return 'bg-yellow-500'
      case 'long': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getScanLabel = (scanId: string) => {
    const scan = scanStats.find(s => s.id === scanId)
    if (scan) {
      return `Scan ${format(new Date(scan.started_at), 'MMM d, HH:mm')}`
    }
    return scanId === 'no-scan' ? 'Unlinked Decisions' : scanId
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Decisions Inbox</h1>
              <p className="text-sm text-gray-600 mt-0.5">Decisions grouped by scan</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{filteredDecisions.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Scan</label>
              <select
                value={filterScan}
                onChange={(e) => setFilterScan(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Scans</option>
                {scanStats.map(scan => (
                  <option key={scan.id} value={scan.id}>
                    {format(new Date(scan.started_at), 'MMM d, HH:mm')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Actions</option>
                <option value="ignore">Ignore</option>
                <option value="monitor">Monitor</option>
                <option value="experiment">Experiment</option>
                <option value="integrate">Integrate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Horizon</label>
              <select
                value={filterHorizon}
                onChange={(e) => setFilterHorizon(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Horizons</option>
                <option value="direct">Direct (0-2 weeks)</option>
                <option value="mid">Mid-term (1-3 months)</option>
                <option value="long">Long-term (6+ months)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Decision List Grouped by Scan */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900 mb-4"></div>
              <p className="text-sm text-gray-600">Loading decisions...</p>
            </div>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No decisions yet.</p>
            <p className="text-xs text-gray-400 mt-1">Make decisions on articles from the Dashboard.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(decisionsByScan).map(([scanId, scanDecisions]) => (
              <div key={scanId} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Scan Header */}
                <button
                  onClick={() => toggleScanExpand(scanId)}
                  className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                    <span className="font-semibold text-gray-900">{getScanLabel(scanId)}</span>
                    <span className="text-xs text-gray-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      {scanDecisions.length} decisions
                    </span>
                  </div>
                  {expandedScans.has(scanId) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Decisions List */}
                {expandedScans.has(scanId) && (
                  <div className="divide-y divide-slate-200">
                    {scanDecisions.map(decision => {
                      const article = decision.article
                      if (!article) return null

                      return (
                        <div
                          key={decision.id}
                          className="p-5 hover:bg-slate-50 transition-all cursor-pointer group"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 group-hover:text-slate-800 mb-2">
                                {article.title}
                              </h3>

                              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                <span className="font-medium">{article.source}</span>
                                <span>·</span>
                                <span>{format(new Date(article.published_at), 'MMM d, yyyy')}</span>
                                {article.analyses?.[0] && (
                                  <>
                                    <span>·</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${article.analyses[0].impact_score >= 70 ? 'bg-green-100 text-green-700' :
                                        article.analyses[0].impact_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                      }`}>
                                      Impact: {article.analyses[0].impact_score}
                                    </span>
                                  </>
                                )}
                              </div>

                              {article.analyses?.[0]?.summary && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                  {article.analyses[0].summary}
                                </p>
                              )}

                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${getActionColor(decision.action_required)}`}>
                                  {decision.action_required.toUpperCase()}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">{decision.impact_horizon}</span>
                                  <div className={`w-2 h-2 rounded-full ${getHorizonColor(decision.impact_horizon)}`} />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <Target className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">Confidence: {decision.confidence}/5</span>
                                </div>
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
