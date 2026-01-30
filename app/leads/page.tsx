'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { 
  Target, Plus, Search, Filter, MoreHorizontal, ExternalLink,
  Mail, Linkedin, Phone, Building, MapPin, Users, Star,
  Loader2, Sparkles, ChevronRight, AlertCircle, Check,
  Copy, Send, RefreshCw, Archive, Edit2, X, Zap, Bot,
  TrendingUp, BadgeCheck, Briefcase
} from 'lucide-react'

interface Lead {
  id: string
  company_name: string
  website_url?: string
  industry?: string
  location?: string
  company_size?: string
  contact_name?: string
  contact_email?: string
  contact_linkedin?: string
  contact_role?: string
  quality_score: number
  fit_score?: number
  confidence_score?: number
  status: string
  priority: string
  website_issues: any[]
  opportunities: any[]
  fit_reasons: string[]
  pain_points?: string[]
  outreach_email_draft?: string
  outreach_linkedin_draft?: string
  why_target?: string
  estimated_value?: string
  suggested_approach?: string
  notes?: string
  tags: string[]
  source_type?: 'manual' | 'ai_generated'
  batch_id?: string
  batch_type?: string
  created_at: string
  updated_at: string
}

interface PipelineStats {
  status: string
  count: number
  avg_quality: number
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-slate-100 text-slate-700' },
  researching: { label: 'Researching', color: 'bg-blue-100 text-blue-700' },
  qualified: { label: 'Qualified', color: 'bg-green-100 text-green-700' },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  replied: { label: 'Replied', color: 'bg-purple-100 text-purple-700' },
  meeting: { label: 'Meeting', color: 'bg-indigo-100 text-indigo-700' },
  proposal: { label: 'Proposal', color: 'bg-pink-100 text-pink-700' },
  won: { label: 'Won', color: 'bg-emerald-100 text-emerald-700' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-700' },
}

const BATCH_TYPES = {
  small: { 
    label: 'Small Business', 
    description: 'Bedrijven die een website update nodig hebben',
    budget: '€1-3K',
    icon: Building,
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400'
  },
  medium: { 
    label: 'Medium Enterprise', 
    description: 'Digitale transformatie & web apps',
    budget: '€3-10K',
    icon: Briefcase,
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400'
  },
  startup: { 
    label: 'Tech Startup', 
    description: 'Snel bouwen & schalen, recurring potential',
    budget: '€5-15K',
    icon: TrendingUp,
    color: 'bg-green-50 border-green-200 hover:border-green-400'
  },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<PipelineStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [filterStatus, filterSource])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      
      const response = await fetch(`/api/leads?${params}`)
      const data = await response.json()
      
      let filteredLeads = data.leads || []
      if (filterSource !== 'all') {
        filteredLeads = filteredLeads.filter((l: Lead) => l.source_type === filterSource)
      }
      
      setLeads(filteredLeads)
      setStats(data.stats || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBatch = async (type: string, count: number) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/leads/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, count }),
      })
      
      const data = await response.json()
      
      if (data.leads) {
        setLeads([...data.leads, ...leads])
      }
      
      setShowGenerateModal(false)
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleAnalyze = async (leadId: string) => {
    setAnalyzing(leadId)
    try {
      const response = await fetch('/api/leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId }),
      })
      
      const data = await response.json()
      
      if (data.lead) {
        setLeads(leads.map(l => l.id === leadId ? data.lead : l))
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead)
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(null)
    }
  }

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status }),
      })
      
      const data = await response.json()
      if (data.lead) {
        setLeads(leads.map(l => l.id === leadId ? data.lead : l))
        if (selectedLead?.id === leadId) {
          setSelectedLead(data.lead)
        }
      }
    } catch (error) {
      console.error('Update error:', error)
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        lead.company_name.toLowerCase().includes(query) ||
        lead.contact_name?.toLowerCase().includes(query) ||
        lead.industry?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const aiGeneratedCount = leads.filter(l => l.source_type === 'ai_generated').length
  const manualCount = leads.filter(l => l.source_type === 'manual' || !l.source_type).length

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-slate-600 bg-slate-50'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Lead Discovery</h1>
              <p className="text-sm text-slate-600">AI-powered prospect sourcing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg 
                       hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Manually
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                       text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all
                       shadow-lg shadow-purple-500/25"
            >
              <Bot className="w-4 h-4" />
              Generate with AI
            </button>
          </div>
        </div>

        {/* AI Generation CTA - Show prominently when few leads */}
        {leads.length < 5 && (
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Start met AI-Sourced Leads</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Laat AI relevante prospects vinden voor Vibecoders. Kies een type bedrijf en genereer 
                  automatisch gekwalificeerde leads met pijnpunten, kansen, en outreach suggesties.
                </p>
                <div className="flex gap-3">
                  {Object.entries(BATCH_TYPES).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setShowGenerateModal(true)
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${config.color}`}
                    >
                      <config.icon className="w-4 h-4" />
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs opacity-75">{config.budget}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setFilterSource('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterSource === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({leads.length})
            </button>
            <button
              onClick={() => setFilterSource('ai_generated')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterSource === 'ai_generated' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Generated ({aiGeneratedCount})
            </button>
            <button
              onClick={() => setFilterSource('manual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filterSource === 'manual' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Manual ({manualCount})
            </button>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4" />
            Quick Generate
          </button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-6">
          {Object.entries(STATUS_CONFIG).slice(0, 8).map(([status, config]) => {
            const stat = stats.find(s => s.status === status)
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={`p-3 rounded-lg border transition-all ${
                  filterStatus === status 
                    ? 'border-slate-900 bg-slate-900 text-white' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="text-2xl font-bold">{stat?.count || 0}</p>
                <p className="text-xs truncate">{config.label}</p>
              </button>
            )
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchLeads}
            className="px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-slate-200">
            <Bot className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No leads found</p>
            <p className="text-sm text-slate-400 mb-4">Generate your first batch with AI</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Generate Leads with AI
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          lead.source_type === 'ai_generated' ? 'bg-purple-100' : 'bg-slate-100'
                        }`}>
                          {lead.source_type === 'ai_generated' ? (
                            <Bot className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Building className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.company_name}</p>
                          <p className="text-sm text-slate-500">{lead.industry || 'Unknown industry'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {lead.source_type === 'ai_generated' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Bot className="w-3 h-3" />
                          AI
                          {lead.batch_type && <span className="opacity-75">• {lead.batch_type}</span>}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <Users className="w-3 h-3" />
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getScoreColor(lead.quality_score)}`}>
                          {lead.quality_score}
                        </span>
                        {lead.confidence_score && (
                          <span className="text-xs text-slate-400" title="AI Confidence">
                            ({lead.confidence_score}%)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.color || 'bg-slate-100'}`}>
                        {STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleAnalyze(lead.id)}
                          disabled={analyzing === lead.id}
                          className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                          title="Analyze with AI"
                        >
                          {analyzing === lead.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          )}
                        </button>
                        {lead.website_url && (
                          <a
                            href={lead.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lead Detail Modal */}
        {selectedLead && (
          <LeadDetailModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onAnalyze={() => handleAnalyze(selectedLead.id)}
            onUpdateStatus={(status) => handleUpdateStatus(selectedLead.id, status)}
            analyzing={analyzing === selectedLead.id}
          />
        )}

        {/* Add Lead Modal */}
        {showAddModal && (
          <AddLeadModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (lead) => {
              try {
                const response = await fetch('/api/leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...lead, source_type: 'manual' }),
                })
                const data = await response.json()
                if (data.lead) {
                  setLeads([data.lead, ...leads])
                }
                setShowAddModal(false)
              } catch (error) {
                console.error('Error adding lead:', error)
              }
            }}
          />
        )}

        {/* Generate Modal */}
        {showGenerateModal && (
          <GenerateModal
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleGenerateBatch}
            generating={generating}
          />
        )}
      </main>
    </div>
  )
}

function GenerateModal({ 
  onClose, 
  onGenerate, 
  generating 
}: { 
  onClose: () => void
  onGenerate: (type: string, count: number) => void
  generating: boolean
}) {
  const [selectedType, setSelectedType] = useState<string>('small')
  const [count, setCount] = useState(10)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-xl w-full" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Generate AI Leads</h2>
              <p className="text-sm text-slate-500">Selecteer een type en aantal prospects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Prospect Type</label>
            <div className="space-y-3">
              {Object.entries(BATCH_TYPES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedType === key 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedType === key ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <config.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{config.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {config.budget}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{config.description}</p>
                    </div>
                    {selectedType === key && (
                      <BadgeCheck className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Count Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Aantal Prospects: <span className="font-bold text-purple-600">{count}</span>
            </label>
            <input
              type="range"
              min="5"
              max="25"
              step="5"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4" />
              Geschatte tijd: ~{Math.ceil(count / 5) * 15} seconden
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={generating}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(selectedType, count)}
            disabled={generating}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                     disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate {count} Leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function LeadDetailModal({ 
  lead, 
  onClose, 
  onAnalyze, 
  onUpdateStatus,
  analyzing 
}: { 
  lead: Lead
  onClose: () => void
  onAnalyze: () => void
  onUpdateStatus: (status: string) => void
  analyzing: boolean
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            {lead.source_type === 'ai_generated' && (
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{lead.company_name}</h2>
              <p className="text-sm text-slate-500">{lead.industry} • {lead.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Context (if AI-generated) */}
          {lead.source_type === 'ai_generated' && lead.why_target && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900 mb-1">Why this prospect?</p>
                  <p className="text-sm text-purple-800">{lead.why_target}</p>
                  {lead.suggested_approach && (
                    <p className="text-sm text-purple-600 mt-2">
                      <strong>Suggested approach:</strong> {lead.suggested_approach}
                    </p>
                  )}
                  {lead.estimated_value && (
                    <p className="text-sm text-purple-600 mt-1">
                      <strong>Estimated value:</strong> {lead.estimated_value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score & Status */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl ${lead.quality_score >= 70 ? 'bg-green-50' : lead.quality_score >= 50 ? 'bg-yellow-50' : 'bg-slate-50'}`}>
              <p className="text-sm text-slate-500">Quality Score</p>
              <p className="text-3xl font-bold">{lead.quality_score}</p>
            </div>
            
            {lead.fit_score && (
              <div className="px-4 py-2 rounded-xl bg-blue-50">
                <p className="text-sm text-slate-500">Fit Score</p>
                <p className="text-3xl font-bold">{lead.fit_score}</p>
              </div>
            )}
            
            <select
              value={lead.status}
              onChange={(e) => onUpdateStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg"
            >
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            <button
              onClick={onAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg 
                       hover:bg-purple-700 disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? 'Analyzing...' : 'Deep Analyze'}
            </button>
          </div>

          {/* Pain Points */}
          {lead.pain_points && lead.pain_points.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Pain Points</h3>
              <div className="flex flex-wrap gap-2">
                {lead.pain_points.map((point, i) => (
                  <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Website Issues */}
          {lead.website_issues?.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Website Issues</h3>
              <div className="space-y-2">
                {lead.website_issues.map((issue: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-900">{issue.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        issue.severity === 'high' ? 'bg-red-200' : 
                        issue.severity === 'medium' ? 'bg-yellow-200' : 'bg-slate-200'
                      }`}>{issue.severity}</span>
                    </div>
                    <p className="text-sm text-red-800">{issue.description}</p>
                    <p className="text-sm text-red-600 mt-1">💡 {issue.fix_suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {lead.opportunities?.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Opportunities</h3>
              <div className="space-y-2">
                {lead.opportunities.map((opp: any, i: number) => (
                  <div key={i} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">{opp.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        opp.potential_value === 'high' ? 'bg-green-200' : 
                        opp.potential_value === 'medium' ? 'bg-yellow-200' : 'bg-slate-200'
                      }`}>{opp.potential_value} value</span>
                    </div>
                    <p className="text-sm text-green-800">{opp.description}</p>
                    <p className="text-sm text-green-600 mt-1">🎯 {opp.pitch_angle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outreach Drafts */}
          {(lead.outreach_email_draft || lead.outreach_linkedin_draft) && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Outreach Drafts</h3>
              
              {lead.outreach_email_draft && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Mail className="w-4 h-4" /> Email
                    </span>
                    <button
                      onClick={() => copyToClipboard(lead.outreach_email_draft!, 'email')}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'email' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap font-mono">
                    {lead.outreach_email_draft}
                  </pre>
                </div>
              )}

              {lead.outreach_linkedin_draft && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </span>
                    <button
                      onClick={() => copyToClipboard(lead.outreach_linkedin_draft!, 'linkedin')}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {copiedField === 'linkedin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'linkedin' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap font-mono">
                    {lead.outreach_linkedin_draft}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void, onAdd: (lead: any) => void }) {
  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    industry: '',
    location: '',
    contact_name: '',
    contact_email: '',
    contact_linkedin: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.company_name) return
    onAdd(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add Lead Manually</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={e => setFormData({...formData, company_name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={e => setFormData({...formData, website_url: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={e => setFormData({...formData, industry: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={e => setFormData({...formData, contact_name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={e => setFormData({...formData, contact_email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
