'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Navigation from '@/components/Navigation'
import { Inbox, Filter, TrendingUp, Clock, Target, ExternalLink, ChevronRight } from 'lucide-react'

interface Article {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string
  analysis: {
    summary: string
    categories: string
    impactScore: number
    relevanceReason: string
    customerAngle: string
    vibecodersAngle: string
  }
}

interface DecisionAssessment {
  id: string
  article_id: string
  action_required: 'ignore' | 'monitor' | 'experiment' | 'integrate'
  impact_horizon: 'direct' | 'mid' | 'long'
  confidence_score: number
  status: 'pending' | 'processed'
  created_at: string
}

export default function DecisionsInboxPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [decisions, setDecisions] = useState<DecisionAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [filterHorizon, setFilterHorizon] = useState<string>('all')
  const [filterConfidence, setFilterConfidence] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch recent articles from latest scan
      const scansResponse = await fetch('/api/scans')
      const scansData = await scansResponse.json()
      
      if (scansData.scans && scansData.scans.length > 0) {
        const latestScan = scansData.scans[0]
        const scanResponse = await fetch(`/api/scans?scanId=${latestScan.id}`)
        const scanData = await scanResponse.json()
        
        const articlesWithAnalysis = (scanData.scan.articles || []).filter((a: Article) => a.analysis)
        setArticles(articlesWithAnalysis)

        // TODO: Fetch actual decisions from decision_assessments table
        // For now, mock pending decisions
        const mockDecisions: DecisionAssessment[] = articlesWithAnalysis.slice(0, 10).map((article: Article) => ({
          id: `dec-${article.id}`,
          article_id: article.id,
          action_required: 'monitor',
          impact_horizon: 'mid',
          confidence_score: 3,
          status: 'pending',
          created_at: article.publishedAt
        }))
        setDecisions(mockDecisions)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDecisions = decisions.filter(decision => {
    if (filterAction !== 'all' && decision.action_required !== filterAction) return false
    if (filterHorizon !== 'all' && decision.impact_horizon !== filterHorizon) return false
    if (filterConfidence > 0 && decision.confidence_score < filterConfidence) return false
    return true
  })

  const getArticleForDecision = (decision: DecisionAssessment) => {
    return articles.find(a => a.id === decision.article_id)
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
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Decision Inbox</h1>
              <p className="text-sm text-gray-600 mt-0.5">Articles awaiting human decision</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{filteredDecisions.length}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Min Confidence</label>
              <select
                value={filterConfidence}
                onChange={(e) => setFilterConfidence(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="0">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>
        </div>

        {/* Decision List */}
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
            <p className="text-sm text-gray-500">No pending decisions.</p>
            <p className="text-xs text-gray-400 mt-1">All articles have been processed.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-200">
              {filteredDecisions.map(decision => {
                const article = getArticleForDecision(decision)
                if (!article) return null

                return (
                  <div
                    key={decision.id}
                    className="p-5 hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => window.location.href = '/'}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-slate-800">
                            {article.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="font-medium">{article.source}</span>
                          <span>·</span>
                          <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                          <span>·</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                            article.analysis.impactScore >= 70 ? 'bg-success-100 text-success-700' :
                            article.analysis.impactScore >= 50 ? 'bg-warning-100 text-warning-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            Impact: {article.analysis.impactScore}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {article.analysis.summary}
                        </p>

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
                            <span className="text-xs text-gray-600">Confidence: {decision.confidence_score}/5</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
