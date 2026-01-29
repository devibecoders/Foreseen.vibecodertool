'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Clock,
  FileText,
  DollarSign,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { 
  type RiskAssessment, 
  type RiskLevel,
  getRiskStyles 
} from '@/lib/projectRisk'
import { differenceInDays, format } from 'date-fns'

interface ProjectWithRisk {
  id: string
  name: string
  client_name: string
  status: string
  quote_amount?: number
  briefing_url?: string
  step_plan_url?: string
  updated_at: string
  created_at: string
  risk: RiskAssessment
}

interface PortfolioStats {
  critical: number
  high: number
  medium: number
  low: number
  healthy: number
  avgScore: number
  topRecommendations: string[]
}

export default function ProjectRiskPage() {
  const [projects, setProjects] = useState<ProjectWithRisk[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all')

  useEffect(() => {
    fetchRiskData()
  }, [])

  const fetchRiskData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await fetch('/api/projects/risk')
      const data = await response.json()

      if (data.projects) {
        setProjects(data.projects)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching risk data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredProjects = filterLevel === 'all'
    ? projects
    : projects.filter(p => p.risk.level === filterLevel)

  const getRiskCount = (level: RiskLevel) => {
    return projects.filter(p => p.risk.level === level).length
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/projects"
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 
                                flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Project Risk Board
                  </h1>
                  <p className="text-slate-600">
                    Monitor project health and identify risks early
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchRiskData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 
                         rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 
                         transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Risk Distribution Cards */}
          {stats && (
            <div className="grid grid-cols-5 gap-3 mb-6">
              <RiskStatCard 
                level="critical" 
                count={stats.critical} 
                total={projects.length}
                onClick={() => setFilterLevel(filterLevel === 'critical' ? 'all' : 'critical')}
                isActive={filterLevel === 'critical'}
              />
              <RiskStatCard 
                level="high" 
                count={stats.high} 
                total={projects.length}
                onClick={() => setFilterLevel(filterLevel === 'high' ? 'all' : 'high')}
                isActive={filterLevel === 'high'}
              />
              <RiskStatCard 
                level="medium" 
                count={stats.medium} 
                total={projects.length}
                onClick={() => setFilterLevel(filterLevel === 'medium' ? 'all' : 'medium')}
                isActive={filterLevel === 'medium'}
              />
              <RiskStatCard 
                level="low" 
                count={stats.low} 
                total={projects.length}
                onClick={() => setFilterLevel(filterLevel === 'low' ? 'all' : 'low')}
                isActive={filterLevel === 'low'}
              />
              <RiskStatCard 
                level="healthy" 
                count={stats.healthy} 
                total={projects.length}
                onClick={() => setFilterLevel(filterLevel === 'healthy' ? 'all' : 'healthy')}
                isActive={filterLevel === 'healthy'}
              />
            </div>
          )}

          {/* Top Recommendations */}
          {stats && stats.topRecommendations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Priority Actions</h3>
              </div>
              <ul className="space-y-2">
                {stats.topRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 
                              border-2 border-slate-200 border-t-slate-900 mb-4" />
              <p className="text-sm text-slate-600">Analyzing project risks...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">
              {filterLevel === 'all' 
                ? 'No projects found.' 
                : `No ${filterLevel} risk projects.`}
            </p>
            {filterLevel !== 'all' && (
              <button 
                onClick={() => setFilterLevel('all')}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Show all projects
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter indicator */}
            {filterLevel !== 'all' && (
              <div className="flex items-center justify-between bg-white border border-slate-200 
                              rounded-lg px-4 py-2">
                <span className="text-sm text-slate-600">
                  Showing {filterLevel} risk projects ({filteredProjects.length})
                </span>
                <button 
                  onClick={() => setFilterLevel('all')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}

            {filteredProjects.map(project => (
              <ProjectRiskCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function RiskStatCard({ 
  level, 
  count, 
  total,
  onClick,
  isActive 
}: { 
  level: RiskLevel
  count: number
  total: number
  onClick: () => void
  isActive: boolean
}) {
  const styles = getRiskStyles(level)
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all ${styles.bgColor} ${styles.borderColor}
                  ${isActive ? 'ring-2 ring-offset-2 ring-slate-900' : 'hover:shadow-md'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${styles.indicatorColor}`} />
        <span className={`text-xs font-medium ${styles.textColor}`}>
          {styles.label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${styles.textColor}`}>{count}</p>
      <p className="text-xs text-slate-500">{percentage}%</p>
    </button>
  )
}

function ProjectRiskCard({ project }: { project: ProjectWithRisk }) {
  const [expanded, setExpanded] = useState(false)
  const styles = getRiskStyles(project.risk.level)
  const daysInStatus = differenceInDays(new Date(), new Date(project.updated_at))

  return (
    <div 
      className={`bg-white border-2 rounded-xl overflow-hidden cursor-pointer
                  transition-all hover:shadow-md ${styles.borderColor}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4">
        {/* Risk Indicator */}
        <div className={`w-12 h-12 rounded-xl ${styles.bgColor} flex items-center 
                         justify-center flex-shrink-0`}>
          <span className={`text-lg font-bold ${styles.textColor}`}>
            {project.risk.score}
          </span>
        </div>

        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {project.name}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                             ${styles.bgColor} ${styles.textColor}`}>
              {styles.label}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            {project.client_name && (
              <span>{project.client_name}</span>
            )}
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
              {project.status}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-1.5" title="Days since last update">
            <Clock className="w-4 h-4" />
            <span>{daysInStatus}d</span>
          </div>

          {project.quote_amount && (
            <div className="flex items-center gap-1.5" title="Quote amount">
              <DollarSign className="w-4 h-4" />
              <span>€{(project.quote_amount / 1000).toFixed(0)}k</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {project.briefing_url ? (
              <CheckCircle className="w-4 h-4 text-green-500" title="Briefing uploaded" />
            ) : (
              <FileText className="w-4 h-4 text-slate-300" title="No briefing" />
            )}
            {project.step_plan_url ? (
              <CheckCircle className="w-4 h-4 text-green-500" title="Step plan uploaded" />
            ) : (
              <FileText className="w-4 h-4 text-slate-300" title="No step plan" />
            )}
          </div>
        </div>

        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform
                                  ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Risk Factors */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Risk Factors</h4>
              <div className="space-y-2">
                {project.risk.factors.map((factor, i) => (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm
                                ${factor.type === 'danger' ? 'bg-red-50 text-red-700' :
                                  factor.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                                  'bg-blue-50 text-blue-700'}`}
                  >
                    <span>{factor.name}</span>
                    <span className="font-mono text-xs">
                      {factor.impact > 0 ? '+' : ''}{factor.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {project.risk.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Recommended Actions</h4>
                <ul className="space-y-2">
                  {project.risk.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/projects"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-center px-4 py-2 bg-slate-900 text-white rounded-lg 
                         text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Open in Pipeline
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
