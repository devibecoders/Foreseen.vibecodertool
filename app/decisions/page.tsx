'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Navigation from '@/components/Navigation'
import { TrendingUp, Zap, Eye, Ban, ExternalLink, Filter, BarChart3 } from 'lucide-react'
import { generateDecisionAssessment, type DecisionAction, type DecisionAssessment } from '@/lib/decision-engine'

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

interface ArticleWithDecision extends Article {
  decision?: DecisionAssessment
}

export default function DecisionsPage() {
  const [articles, setArticles] = useState<ArticleWithDecision[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | DecisionAction>('all')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
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
        
        // Process decisions for all articles
        setProcessing(true)
        const articlesWithDecisions = await Promise.all(
          articlesWithAnalysis.map(async (article: Article) => {
            const decision = await generateDecisionAssessment(article, [])
            return { ...article, decision }
          })
        )
        
        setArticles(articlesWithDecisions)
        setProcessing(false)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      setProcessing(false)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = filter === 'all' 
    ? articles 
    : articles.filter(a => a.decision?.action === filter)

  const experimentArticles = articles.filter(a => a.decision?.action === 'EXPERIMENT')
  const monitorArticles = articles.filter(a => a.decision?.action === 'MONITOR')
  const ignoreArticles = articles.filter(a => a.decision?.action === 'IGNORE')

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Decision Dashboard</h1>
              <p className="text-sm text-gray-600 mt-0.5">Transform signals into actionable decisions</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{experimentArticles.length}</p>
              <p className="text-xs text-gray-500">To Experiment</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-600">{monitorArticles.length}</p>
              <p className="text-xs text-gray-500">To Monitor</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">{ignoreArticles.length}</p>
              <p className="text-xs text-gray-500">Ignored</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900 mb-4"></div>
              <p className="text-sm text-gray-600">Loading articles...</p>
            </div>
          </div>
        ) : processing ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900 mb-4"></div>
              <p className="text-sm text-gray-600">Processing decision intelligence...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No articles to process yet.</p>
            <p className="text-xs text-gray-400 mt-1">Run a scan first to generate decisions.</p>
          </div>
        ) : (
          <div>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-gray-500" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-gray-700 hover:bg-slate-50'
                }`}
              >
                All ({articles.length})
              </button>
              <button
                onClick={() => setFilter('EXPERIMENT')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'EXPERIMENT' ? 'bg-success-600 text-white' : 'bg-white border border-slate-200 text-gray-700 hover:bg-slate-50'
                }`}
              >
                ⚡ Experiment ({experimentArticles.length})
              </button>
              <button
                onClick={() => setFilter('MONITOR')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'MONITOR' ? 'bg-warning-600 text-white' : 'bg-white border border-slate-200 text-gray-700 hover:bg-slate-50'
                }`}
              >
                👁 Monitor ({monitorArticles.length})
              </button>
              <button
                onClick={() => setFilter('IGNORE')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'IGNORE' ? 'bg-slate-600 text-white' : 'bg-white border border-slate-200 text-gray-700 hover:bg-slate-50'
                }`}
              >
                🚫 Ignore ({ignoreArticles.length})
              </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Experiment Column */}
              <div className="bg-white border-2 border-success-200 rounded-xl overflow-hidden">
                <div className="bg-success-50 border-b-2 border-success-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-success-700" />
                    <h2 className="text-sm font-bold text-success-900 uppercase tracking-wide">To Experiment</h2>
                    <span className="ml-auto text-xs font-bold text-success-700 bg-success-100 px-2 py-1 rounded-full">
                      {experimentArticles.length}
                    </span>
                  </div>
                  <p className="text-xs text-success-700 mt-1">High priority, aligned opportunities</p>
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {experimentArticles.map(article => (
                    <DecisionArticleCard key={article.id} article={article} />
                  ))}
                  {experimentArticles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No articles to experiment with yet.</p>
                  )}
                </div>
              </div>

              {/* Monitor Column */}
              <div className="bg-white border-2 border-warning-200 rounded-xl overflow-hidden">
                <div className="bg-warning-50 border-b-2 border-warning-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-warning-700" />
                    <h2 className="text-sm font-bold text-warning-900 uppercase tracking-wide">To Monitor</h2>
                    <span className="ml-auto text-xs font-bold text-warning-700 bg-warning-100 px-2 py-1 rounded-full">
                      {monitorArticles.length}
                    </span>
                  </div>
                  <p className="text-xs text-warning-700 mt-1">Interesting, but not for now</p>
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {monitorArticles.map(article => (
                    <DecisionArticleCard key={article.id} article={article} />
                  ))}
                  {monitorArticles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No articles to monitor yet.</p>
                  )}
                </div>
              </div>

              {/* Ignore Column */}
              <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 border-b-2 border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Ignored</h2>
                    <span className="ml-auto text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                      {ignoreArticles.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">Filtered by boundaries</p>
                </div>
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {ignoreArticles.map(article => (
                    <DecisionArticleCard key={article.id} article={article} />
                  ))}
                  {ignoreArticles.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No ignored articles yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function DecisionArticleCard({ article }: { article: ArticleWithDecision }) {
  if (!article.decision) return null

  const actionColors = {
    EXPERIMENT: 'border-success-200 bg-success-50',
    MONITOR: 'border-warning-200 bg-warning-50',
    IGNORE: 'border-slate-200 bg-slate-50'
  }

  return (
    <div className={`border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${actionColors[article.decision.action]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{article.source}</span>
        <span className="text-lg">{article.decision.actionEmoji}</span>
      </div>
      
      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
        {article.title}
      </h3>
      
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
          article.analysis.impactScore >= 70 ? 'bg-success-100 text-success-700' :
          article.analysis.impactScore >= 50 ? 'bg-warning-100 text-warning-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {article.analysis.impactScore}/100
        </span>
        <span className="text-xs text-gray-500">
          {format(new Date(article.publishedAt), 'MMM d')}
        </span>
      </div>

      {/* Alignment Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Alignment</span>
          <span className="text-xs font-bold text-gray-900">{article.decision.vibecodeAlignment}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              article.decision.vibecodeAlignment >= 70 ? 'bg-success-500' :
              article.decision.vibecodeAlignment >= 50 ? 'bg-warning-500' :
              'bg-danger-500'
            }`}
            style={{ width: `${article.decision.vibecodeAlignment}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
        {article.decision.rationale}
      </p>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="w-3 h-3" />
        Read article
      </a>
    </div>
  )
}
