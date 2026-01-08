'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Navigation from '@/components/Navigation'
import { BarChart3, TrendingUp, AlertCircle, Calendar, Trash2, ExternalLink, X, Sparkles, Target, Zap } from 'lucide-react'
import DecisionAssessmentPanel from '@/components/DecisionAssessmentPanel'

interface Analysis {
  summary: string
  categories: string
  impactScore: number
  relevanceReason: string
  customerAngle: string
  vibecodersAngle: string
  keyTakeaways: string
}

interface Article {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  scanId: string | null
  analysis: Analysis | null
}

interface Scan {
  id: string
  startedAt: string
  completedAt: string | null
  itemsFetched: number
  itemsAnalyzed: number
  status: string
  _count: { articles: number }
  articles?: Article[]
}

const CATEGORIES = [
  'ALL', 'DEV_TOOLS', 'MODELS', 'AGENTS', 'PRODUCT',
  'SECURITY', 'PRICING', 'POLICY', 'RESEARCH', 'OTHER'
]

export default function Home() {
  const [scans, setScans] = useState<Scan[]>([])
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [view, setView] = useState<'scans' | 'dashboard'>('scans')
  const [category, setCategory] = useState('ALL')
  const [minImpactScore, setMinImpactScore] = useState(0)

  const fetchScans = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/scans')
      const data = await response.json()
      setScans(data.scans || [])
    } catch (error) {
      console.error('Error fetching scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScanArticles = async (scanId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/scans?scanId=${scanId}`)
      const data = await response.json()
      setSelectedScan(data.scan)
      setArticles(data.scan.articles || [])
      setView('dashboard')
    } catch (error) {
      console.error('Error fetching scan articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteScan = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this scan?')) return
    
    try {
      await fetch(`/api/scans/${scanId}`, { method: 'DELETE' })
      fetchScans()
      if (selectedScan?.id === scanId) {
        setView('scans')
        setSelectedScan(null)
        setArticles([])
      }
    } catch (error) {
      console.error('Error deleting scan:', error)
    }
  }

  useEffect(() => {
    fetchScans()
  }, [])

  const runWeeklyScan = async () => {
    if (!confirm('Start new scan? This may take a few minutes.')) return
    
    setRunning(true)
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 7 })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Scan complete!\n\nFetched: ${data.itemsFetched}\nNew: ${data.itemsNew}\nAnalyzed: ${data.itemsAnalyzed}`)
        fetchScans()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error running scan:', error)
      alert('Error running scan')
    } finally {
      setRunning(false)
    }
  }

  const filteredArticles = articles.filter(article => {
    if (!article.analysis) return false
    if (category !== 'ALL' && !article.analysis.categories.includes(category)) return false
    if (article.analysis.impactScore < minImpactScore) return false
    return true
  })

  const topArticles = [...filteredArticles]
    .sort((a, b) => (b.analysis?.impactScore || 0) - (a.analysis?.impactScore || 0))
    .slice(0, 5)

  const categoryDistribution = filteredArticles.reduce((acc, article) => {
    if (!article.analysis) return acc
    article.analysis.categories.split(',').forEach(cat => {
      acc[cat] = (acc[cat] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const avgImpactScore = filteredArticles.length > 0
    ? Math.round(filteredArticles.reduce((sum, a) => sum + (a.analysis?.impactScore || 0), 0) / filteredArticles.length)
    : 0

  const highImpactCount = filteredArticles.filter(a => a.analysis && a.analysis.impactScore >= 70).length

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'scans' ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Scans</h1>
                  <p className="text-sm text-gray-600 mt-0.5">View and manage your article scans</p>
                </div>
              </div>
              <button
                onClick={runWeeklyScan}
                disabled={running}
                className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                {running ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    New Scan
                  </>
                )}
              </button>
            </div>

            {/* Scans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
                </div>
              ) : scans.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No scans yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first scan to get started.</p>
                </div>
              ) : (
                scans.map(scan => (
                  <div
                    key={scan.id}
                    onClick={() => fetchScanArticles(scan.id)}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(scan.startedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        scan.status === 'completed' ? 'bg-success-100 text-success-700 border border-success-200' :
                        scan.status === 'running' ? 'bg-warning-100 text-warning-700 border border-warning-200' :
                        'bg-danger-100 text-danger-700 border border-danger-200'
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Articles</span>
                        <span className="text-lg font-bold text-gray-900">{scan._count.articles}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Analyzed</span>
                        <span className="text-sm font-semibold text-success-600">{scan.itemsAnalyzed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Fetched</span>
                        <span className="text-sm font-medium text-gray-600">{scan.itemsFetched}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={(e) => deleteScan(scan.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-danger-600 hover:text-danger-700 font-medium flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                      <span className="text-xs text-gray-400 group-hover:text-slate-600 transition-colors">
                        View details →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => {
                setView('scans')
                setSelectedScan(null)
                setArticles([])
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to scans
            </button>

            {/* Stats Grid - Rich Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{filteredArticles.length}</p>
                <p className="text-xs text-gray-500 mt-1">Articles</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-warning-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Impact</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{avgImpactScore}</p>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-warning-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${avgImpactScore}%` }}
                  />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-success-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">High Impact</p>
                </div>
                <p className="text-3xl font-bold text-success-600">{highImpactCount}</p>
                <p className="text-xs text-gray-500 mt-1">Score ≥ 70</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scan Date</p>
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {selectedScan && format(new Date(selectedScan.startedAt), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-500 mt-1">{selectedScan && format(new Date(selectedScan.startedAt), 'HH:mm')}</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top 5 Articles */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-700" />
                    <h2 className="text-sm font-semibold text-gray-900">Top Recommended</h2>
                  </div>
                </div>
                <div className="divide-y divide-slate-200">
                  {topArticles.map((article, idx) => (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="p-4 hover:bg-slate-50 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-slate-800">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="font-medium">{article.source}</span>
                            <span>·</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                              article.analysis!.impactScore >= 70
                                ? 'bg-success-100 text-success-700'
                                : article.analysis!.impactScore >= 50
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {article.analysis?.impactScore}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-700" />
                    <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {Object.entries(categoryDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([cat, count]) => {
                      const percentage = Math.round((count / filteredArticles.length) * 100)
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold text-gray-700">{cat}</span>
                            <span className="text-gray-500">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" />
                    Category Filter
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    Min Impact Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={minImpactScore}
                    onChange={(e) => setMinImpactScore(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No articles match your filters.</p>
                </div>
              ) : (
                filteredArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500">{article.source}</span>
                      {article.analysis && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          article.analysis.impactScore >= 70
                            ? 'bg-success-100 text-success-700 border border-success-200'
                            : article.analysis.impactScore >= 50
                            ? 'bg-warning-100 text-warning-700 border border-warning-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {article.analysis.impactScore}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-slate-800">
                      {article.title}
                    </h3>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                    </p>

                    {article.analysis && (
                      <>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {article.analysis.categories.split(',').slice(0, 2).map(cat => (
                            <span
                              key={cat}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {article.analysis.summary}
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Article Detail Modal - Rich Design */}
      {selectedArticle && selectedArticle.analysis && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-start justify-between z-10">
              <div className="flex-1 pr-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-medium">{selectedArticle.source}</span>
                  <span>·</span>
                  <span>{format(new Date(selectedArticle.publishedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Read full article
              </a>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Impact Score</h3>
                  </div>
                  <p className={`text-4xl font-bold ${
                    selectedArticle.analysis.impactScore >= 70
                      ? 'text-success-600'
                      : selectedArticle.analysis.impactScore >= 50
                      ? 'text-warning-600'
                      : 'text-gray-600'
                  }`}>
                    {selectedArticle.analysis.impactScore}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArticle.analysis.categories.split(',').map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-l-4 border-slate-900 rounded-r-xl p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedArticle.analysis.summary}</p>
              </div>

              {selectedArticle.analysis.keyTakeaways && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {selectedArticle.analysis.keyTakeaways.split('|||').filter(Boolean).map((takeaway, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-gray-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Decision Assessment Panel */}
              <DecisionAssessmentPanel 
                article={selectedArticle}
                onSave={(decision) => {
                  console.log('Decision saved:', decision)
                  // TODO: Save to decision_assessments table
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Target className="w-3 h-3" />
                    For Customers
                  </h3>
                  <p className="text-sm text-gray-700">{selectedArticle.analysis.customerAngle}</p>
                </div>
                <div className="bg-success-50 border border-success-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-success-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    For Vibecoders
                  </h3>
                  <p className="text-sm text-gray-700">{selectedArticle.analysis.vibecodersAngle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
