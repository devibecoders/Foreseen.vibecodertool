'use client'

import { useState } from 'react'
import { Layers, ChevronDown, ChevronUp, ExternalLink, Star } from 'lucide-react'

interface ClusterArticle {
  id: string
  title: string
  url: string
  source: string
  is_cluster_primary?: boolean
  analyses?: Array<{ impact_score: number }>
}

interface ClusterBadgeProps {
  sourceCount: number
  allSources: string[]
  clusterId?: string
  className?: string
}

/**
 * Badge showing how many sources covered this story
 * Click to expand and see all sources
 */
export function ClusterBadge({ 
  sourceCount, 
  allSources, 
  clusterId,
  className = '' 
}: ClusterBadgeProps) {
  const [expanded, setExpanded] = useState(false)
  const [clusterArticles, setClusterArticles] = useState<ClusterArticle[]>([])
  const [loading, setLoading] = useState(false)

  if (sourceCount <= 1) return null

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }

    if (clusterId && clusterArticles.length === 0) {
      setLoading(true)
      try {
        const response = await fetch(`/api/clustering/${clusterId}`)
        const data = await response.json()
        setClusterArticles(data.articles || [])
      } catch (error) {
        console.error('Failed to fetch cluster articles:', error)
      } finally {
        setLoading(false)
      }
    }

    setExpanded(true)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Badge */}
      <button
        onClick={handleExpand}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full 
                   bg-blue-50 text-blue-700 text-xs font-medium
                   hover:bg-blue-100 transition-colors cursor-pointer"
        title={`${sourceCount} sources covered this story`}
      >
        <Layers className="w-3 h-3" />
        <span>{sourceCount} sources</span>
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Expanded dropdown */}
      {expanded && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72
                        bg-white border border-slate-200 rounded-lg shadow-lg
                        animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Layers className="w-4 h-4" />
              <span>Sources covering this story</span>
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 
                              border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : clusterArticles.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {clusterArticles.map((article, index) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-3 p-3 hover:bg-slate-50 transition-colors
                             ${index > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">
                        {article.source}
                      </span>
                      {article.is_cluster_primary && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 
                                         bg-amber-50 text-amber-700 rounded text-[10px] font-semibold">
                          <Star className="w-2.5 h-2.5" />
                          Best
                        </span>
                      )}
                      {article.analyses?.[0]?.impact_score && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {article.analyses[0].impact_score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2">
                      {article.title}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          ) : (
            // Fallback to just source names
            <div className="p-3 space-y-2">
              {allSources.map((source, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{source}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Inline cluster indicator for compact displays
 */
export function ClusterIndicator({ 
  sourceCount, 
  allSources 
}: { 
  sourceCount: number
  allSources: string[] 
}) {
  if (sourceCount <= 1) return null

  return (
    <span 
      className="inline-flex items-center gap-1 text-xs text-blue-600"
      title={`Covered by: ${allSources.join(', ')}`}
    >
      <Layers className="w-3 h-3" />
      +{sourceCount - 1}
    </span>
  )
}
