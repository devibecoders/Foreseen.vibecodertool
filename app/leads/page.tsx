'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { 
  Target, Plus, Search, Filter, MoreHorizontal, ExternalLink,
  Mail, Linkedin, Phone, Building, MapPin, Users, Star,
  Loader2, Sparkles, ChevronRight, AlertCircle, Check,
  Copy, Send, RefreshCw, Archive, Edit2, X
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
  status: string
  priority: string
  website_issues: any[]
  opportunities: any[]
  fit_reasons: string[]
  outreach_email_draft?: string
  outreach_linkedin_draft?: string
  notes?: string
  tags: string[]
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<PipelineStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [filterStatus])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      
      const response = await fetch(`/api/leads?${params}`)
      const data = await response.json()
      
      setLeads(data.leads || [])
      setStats(data.stats || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
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
              <p className="text-sm text-slate-600">Find and qualify potential clients</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg 
                     hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
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
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No leads found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first lead
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Contact</th>
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
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{lead.company_name}</p>
                          <p className="text-sm text-slate-500">{lead.industry || 'Unknown industry'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {lead.contact_name ? (
                        <div>
                          <p className="font-medium text-slate-900">{lead.contact_name}</p>
                          <p className="text-sm text-slate-500">{lead.contact_role || lead.contact_email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">No contact</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getScoreColor(lead.quality_score)}`}>
                        {lead.quality_score}
                      </span>
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
                  body: JSON.stringify(lead),
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
      </main>
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
          <div>
            <h2 className="text-xl font-bold text-slate-900">{lead.company_name}</h2>
            <p className="text-sm text-slate-500">{lead.industry} • {lead.location}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score & Status */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl ${lead.quality_score >= 70 ? 'bg-green-50' : lead.quality_score >= 50 ? 'bg-yellow-50' : 'bg-slate-50'}`}>
              <p className="text-sm text-slate-500">Quality Score</p>
              <p className="text-3xl font-bold">{lead.quality_score}</p>
            </div>
            
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
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

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
          <h2 className="text-lg font-semibold text-slate-900">Add New Lead</h2>
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
