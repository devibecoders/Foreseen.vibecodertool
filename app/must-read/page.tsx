'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Navigation from '@/components/Navigation'
import { ClusterBadge } from '@/components/ClusterBadge'
import { OutcomeGenerator } from '@/components/OutcomeGenerator'
import { IntentChip } from '@/components/IntentChip'
import ArticleExplainability from '@/components/ArticleExplainability'
import { 
  Star, 
  ExternalLink, 
  Zap, 
  Eye, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

interface MustReadArticle {
  id: string
  title: string
  displayTitle?: string
  url: string
  source: string
  published_at: string
  sourceCount?: number
  allSources?: string[]
  clusterId?: string
  analysis: {
    id: string
    summary: string
    categories: string
    impact_score: number
    relevance_reason: string
    customer_angle: string
    vibecoders_angle: string
    key_takeaways: string
    intent_label?: string
    intent_confidence?: number
  } | null
  // Scoring data
  adjusted_score: number
  base_score: number
  preference_delta: number
  reasons: {
    boosted: Array<{ key: string; weight: number; type: string }>
    suppressed: Array<{ key: string; weight: number; type: string }>
  }
  isPersonalized: boolean
  // Decision suggestion
  suggestedAction?: 'integrate' | 'experiment' | 'monitor'
  actionRationale?: string
}

export default function MustReadPage() {
  const [articles, setArticles] = useState<MustReadArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMustReadArticles()
  }, [])

  const fetchMustReadArticles = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Fetch scored articles with clustering
      const response = await fetch('/api/must-read')
      const data = await response.json()
      
      if (data.articles) {
        setArticles(data.articles)
      }
    } catch (error) {
      console.error('Error fetching must-read articles:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Group by suggested action
  const integrateNow = articles.filter(a => a.suggestedAction === 'integrate')
  const experimentWith = articles.filter(a => a.suggestedAction === 'experiment')
  const keepWatching = articles.filter(a => a.suggestedAction === 'monitor')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 
                              flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Must-Read Top 10
                </h1>
                <p className="text-slate-600">
                  Wat moet ik doen? — Your personalized action list
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchMustReadArticles(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 
                         rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 
                         transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Integrate Now</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{integrateNow.length}</p>
              <p className="text-xs text-green-700">Ready to use immediately</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Experiment With</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{experimentWith.length}</p>
              <p className="text-xs text-blue-700">Worth a quick spike</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Keep Watching</span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{keepWatching.length}</p>
              <p className="text-xs text-amber-700">Not yet, but soon</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 
                              border-2 border-slate-200 border-t-slate-900 mb-4" />
              <p className="text-sm text-slate-600">Loading your must-reads...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No must-read articles yet.</p>
            <p className="text-sm text-slate-400 mt-1">Run a scan to populate your reading list.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Integrate Now Section */}
            {integrateNow.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Integrate Now
                  </h2>
                  <span className="text-sm text-slate-500">
                    — Start using these today
                  </span>
                </div>
                <div className="space-y-4">
                  {integrateNow.map((article, index) => (
                    <MustReadCard 
                      key={article.id} 
                      article={article} 
                      rank={index + 1}
                      variant="integrate"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Experiment With Section */}
            {experimentWith.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Experiment With
                  </h2>
                  <span className="text-sm text-slate-500">
                    — Schedule a spike this week
                  </span>
                </div>
                <div className="space-y-4">
                  {experimentWith.map((article, index) => (
                    <MustReadCard 
                      key={article.id} 
                      article={article} 
                      rank={integrateNow.length + index + 1}
                      variant="experiment"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Keep Watching Section */}
            {keepWatching.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Keep Watching
                  </h2>
                  <span className="text-sm text-slate-500">
                    — Monitor for when it matures
                  </span>
                </div>
                <div className="space-y-4">
                  {keepWatching.map((article, index) => (
                    <MustReadCard 
                      key={article.id} 
                      article={article} 
                      rank={integrateNow.length + experimentWith.length + index + 1}
                      variant="monitor"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function MustReadCard({ 
  article, 
  rank,
  variant 
}: { 
  article: MustReadArticle
  rank: number
  variant: 'integrate' | 'experiment' | 'monitor'
}) {
  const [expanded, setExpanded] = useState(false)

  const variantStyles = {
    integrate: 'border-green-200 bg-white hover:border-green-300',
    experiment: 'border-blue-200 bg-white hover:border-blue-300',
    monitor: 'border-amber-200 bg-white hover:border-amber-300',
  }

  const variantIcon = {
    integrate: <CheckCircle className="w-4 h-4 text-green-600" />,
    experiment: <Zap className="w-4 h-4 text-blue-600" />,
    monitor: <Clock className="w-4 h-4 text-amber-600" />,
  }

  const takeaways = article.analysis?.key_takeaways?.split('|||').filter(Boolean) || []

  return (
    <div 
      className={`border-2 rounded-xl p-5 transition-all cursor-pointer ${variantStyles[variant]}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header Row */}
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 
                        flex items-center justify-center">
          <span className="text-white text-sm font-bold">#{rank}</span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium text-slate-500">{article.source}</span>
            {article.sourceCount && article.sourceCount > 1 && (
              <ClusterBadge 
                sourceCount={article.sourceCount}
                allSources={article.allSources || []}
                clusterId={article.clusterId}
              />
            )}
            {article.analysis?.intent_label && (
              <IntentChip 
                intent={article.analysis.intent_label as any}
                confidence={article.analysis.intent_confidence}
              />
            )}
            <span className="text-xs text-slate-400">
              {article.published_at && format(new Date(article.published_at), 'MMM d')}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
            {article.displayTitle || article.title}
          </h3>

          {/* Score Bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 max-w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Score</span>
                <span className="text-xs font-bold text-slate-900">
                  {Math.round(article.adjusted_score)}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    article.adjusted_score >= 70 ? 'bg-green-500' :
                    article.adjusted_score >= 50 ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`}
                  style={{ width: `${article.adjusted_score}%` }}
                />
              </div>
            </div>

            {article.isPersonalized && (
              <span className="text-xs text-purple-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Personalized
              </span>
            )}
          </div>

          {/* Summary */}
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {article.analysis?.summary}
          </p>

          {/* Action Rationale */}
          {article.actionRationale && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              variant === 'integrate' ? 'bg-green-50' :
              variant === 'experiment' ? 'bg-blue-50' :
              'bg-amber-50'
            }`}>
              {variantIcon[variant]}
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Wat moet ik doen?
                </p>
                <p className="text-sm text-slate-600">
                  {article.actionRationale}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white 
                       rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Read
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Outcome Generator - always visible */}
      <div className="mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        <OutcomeGenerator
          articleId={article.id}
          articleTitle={article.displayTitle || article.title}
          suggestedAction={article.suggestedAction}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          {/* Key Takeaways */}
          {takeaways.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Key Takeaways
              </h4>
              <ul className="space-y-1">
                {takeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Vibecoders Angle */}
          {article.analysis?.vibecoders_angle && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                💡 Voor Vibecoders
              </h4>
              <p className="text-sm text-slate-600">
                {article.analysis.vibecoders_angle}
              </p>
            </div>
          )}

          {/* Explainability */}
          {(article.reasons.boosted.length > 0 || article.reasons.suppressed.length > 0) && (
            <ArticleExplainability
              baseScore={article.base_score}
              adjustedScore={article.adjusted_score}
              reasons={article.reasons}
              isPersonalized={article.isPersonalized}
            />
          )}
        </div>
      )}
    </div>
  )
}
