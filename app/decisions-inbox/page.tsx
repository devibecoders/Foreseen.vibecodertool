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

        <div className="bg-white/50 backdrop-blur-sm border-2 border-slate-100 rounded-3xl p-5 md:p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-md">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Filter Archive</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Scan Session</label>
              <select
                value={filterScan}
                onChange={(e) => setFilterScan(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold bg-white border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-slate-900 transition-all appearance-none"
              >
                <option value="all">All Sessions</option>
                {scanStats.map(scan => (
                  <option key={scan.id} value={scan.id}>
                    {format(new Date(scan.started_at), 'MMM d, HH:mm')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold bg-white border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-slate-900 transition-all appearance-none"
              >
                <option value="all">All Actions</option>
                <option value="ignore">Ignore</option>
                <option value="monitor">Monitor</option>
                <option value="experiment">Experiment</option>
                <option value="integrate">Integrate</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Impact Horizon</label>
              <select
                value={filterHorizon}
                onChange={(e) => setFilterHorizon(e.target.value)}
                className="w-full px-4 py-3 text-sm font-bold bg-white border-2 border-slate-50 rounded-2xl focus:outline-none focus:border-slate-900 transition-all appearance-none"
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
                className="w-full h-12 flex items-center justify-center gap-2 px-6 py-2 text-xs font-black text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
              >
                Update Result
              </button>
            </div>
          </div>
        </div>

        {/* Decision List Grouped by Scan */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-900 mb-6"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Retrieving intelligence...</p>
            </div>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="text-center py-32 bg-white border-2 border-slate-100 rounded-3xl shadow-inner">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Inbox className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No decisions recorded</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">Run a weekly scan to begin strategic assessment of incoming articles.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(decisionsByScan).map(([scanId, scanDecisions]) => (
              <div key={scanId} className="bg-white border-2 border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                {/* Scan Header */}
                <button
                  onClick={() => toggleScanExpand(scanId)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-slate-50 hover:bg-slate-100/50 transition-all active:bg-slate-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <BarChart3 className="w-5 h-5 text-slate-900" />
                    </div>
                    <div className="text-left">
                      <span className="block text-xs font-black text-gray-900 uppercase tracking-widest">{getScanLabel(scanId)}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {scanDecisions.length} Decisions Logged
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {expandedScans.has(scanId) ? (
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <ChevronUp className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Decisions List */}
                {expandedScans.has(scanId) && (
                  <div className="p-4 md:p-6 space-y-4 bg-white">
                    {scanDecisions.map(decision => {
                      const article = decision.article
                      if (!article) return null

                      return (
                        <div
                          key={decision.id}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group active:scale-[0.99]"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{article.source}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getActionColor(decision.action_required)}`}>
                                    {decision.action_required}
                                  </span>
                                </div>
                              </div>
                              <h3 className="text-sm md:text-base font-black text-gray-900 mb-3 uppercase tracking-tight leading-tight group-hover:text-slate-800">
                                {article.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{decision.impact_horizon}</span>
                                  <div className={`w-1.5 h-1.5 rounded-full ${getHorizonColor(decision.impact_horizon)}`} />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Target className="w-3 h-3 text-slate-400" />
                                  <span>Conf {decision.confidence}/5</span>
                                </div>
                                {article.analyses?.[0] && (
                                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded-md">
                                    <span>Impact: {article.analyses[0].impact_score}</span>
                                  </div>
                                )}
                              </div>

                              {article.analyses?.[0]?.summary && (
                                <p className="text-xs font-medium text-gray-500 line-clamp-2 md:line-clamp-none bg-white p-4 rounded-xl border border-slate-100 shadow-inner italic">
                                  &quot;{article.analyses[0].summary}&quot;
                                </p>
                              )}
                            </div>

                            <div className="flex md:flex-col items-center justify-between md:justify-start gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                              <button className="flex-1 md:w-24 h-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-lg">
                                Open Source
                              </button>
                              <button className="flex-1 md:w-24 h-10 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95">
                                Edit
                              </button>
                            </div>
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
