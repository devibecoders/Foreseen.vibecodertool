'use client'

import { useState, useEffect } from 'react'
import VibecodeLayout from '@/components/VibecodeLayout'
import { Wrench, Plus, Trash2, X } from 'lucide-react'

interface Tool {
  id: string
  name: string
  category: string
  status: 'adopt' | 'trial' | 'assess' | 'hold' | 'deprecate'
  when_to_use: string
  when_not_to_use: string
  tradeoffs: string
}

interface VibecodeCore {
  id: string
}

const STATUS_CONFIG = {
  adopt: { label: 'Adopt', color: 'bg-success-100 text-success-700 border-success-200', description: 'Use by default' },
  trial: { label: 'Trial', color: 'bg-warning-100 text-warning-700 border-warning-200', description: 'Experiment with caution' },
  assess: { label: 'Assess', color: 'bg-brand-100 text-brand-700 border-brand-200', description: 'Research and evaluate' },
  hold: { label: 'Hold', color: 'bg-slate-100 text-slate-700 border-slate-200', description: 'Pause adoption' },
  deprecate: { label: 'Deprecate', color: 'bg-danger-100 text-danger-700 border-danger-200', description: 'Phase out' },
}

export default function VibecodeToolsPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTool, setNewTool] = useState({
    name: '',
    category: '',
    status: 'assess' as Tool['status'],
    when_to_use: '',
    when_not_to_use: '',
    tradeoffs: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const coreResponse = await fetch('/api/vibecode/core')
      const coreData = await coreResponse.json()
      
      if (coreData.core) {
        setCore(coreData.core)
        
        const toolsResponse = await fetch(`/api/vibecode/tools?coreId=${coreData.core.id}`)
        const toolsData = await toolsResponse.json()
        setTools(toolsData.tools || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTool = async () => {
    if (!core || !newTool.name) return

    try {
      const response = await fetch('/api/vibecode/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTool, core_id: core.id })
      })
      const data = await response.json()
      
      if (data.success) {
        setTools([...tools, data.tool])
        setShowAddModal(false)
        setNewTool({
          name: '',
          category: '',
          status: 'assess',
          when_to_use: '',
          when_not_to_use: '',
          tradeoffs: ''
        })
      }
    } catch (error) {
      console.error('Error adding tool:', error)
      alert('Error adding tool')
    }
  }

  const deleteTool = async (id: string) => {
    if (!confirm('Delete this tool?')) return

    try {
      await fetch(`/api/vibecode/tools?id=${id}`, { method: 'DELETE' })
      setTools(tools.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting tool:', error)
    }
  }

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.status]) acc[tool.status] = []
    acc[tool.status].push(tool)
    return acc
  }, {} as Record<string, Tool[]>)

  return (
    <VibecodeLayout>
      <div className="max-w-6xl mx-auto px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
          </div>
        ) : !core ? (
          <div className="text-center py-24">
            <p className="text-gray-600">Please initialize your Vibecode Core first.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-serif text-gray-900">Tech Radar</h1>
                  <p className="text-sm text-gray-500 mt-1">Your technology adoption framework</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Tool
              </button>
            </div>

            {/* Status Groups */}
            <div className="space-y-8">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const statusTools = groupedTools[status] || []
                
                return (
                  <div key={status} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500">{config.description}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">{statusTools.length} tools</span>
                    </div>
                    
                    {statusTools.length === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500">
                        No tools in this category yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {statusTools.map(tool => (
                          <div key={tool.id} className="p-6 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">{tool.name}</h3>
                                  {tool.category && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                      {tool.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteTool(tool.id)}
                                className="opacity-0 group-hover:opacity-100 text-danger-600 hover:text-danger-700 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-xs font-semibold text-success-700 uppercase tracking-wide mb-1">✓ When to use</p>
                                <p className="text-gray-700">{tool.when_to_use || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-danger-700 uppercase tracking-wide mb-1">✗ When NOT to use</p>
                                <p className="text-gray-700">{tool.when_not_to_use || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">⚖ Tradeoffs</p>
                                <p className="text-gray-700">{tool.tradeoffs || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add Tool Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Tool</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name *</label>
                  <input
                    type="text"
                    value={newTool.name}
                    onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g., Next.js, PostgreSQL"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <input
                      type="text"
                      value={newTool.category}
                      onChange={(e) => setNewTool({ ...newTool, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g., Frontend, Backend"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
                    <select
                      value={newTool.status}
                      onChange={(e) => setNewTool({ ...newTool, status: e.target.value as Tool['status'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">When to use</label>
                  <textarea
                    value={newTool.when_to_use}
                    onChange={(e) => setNewTool({ ...newTool, when_to_use: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Describe ideal use cases..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">When NOT to use</label>
                  <textarea
                    value={newTool.when_not_to_use}
                    onChange={(e) => setNewTool({ ...newTool, when_not_to_use: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Describe when to avoid..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tradeoffs</label>
                  <textarea
                    value={newTool.tradeoffs}
                    onChange={(e) => setNewTool({ ...newTool, tradeoffs: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="What are the pros and cons?"
                  />
                </div>
                
                <button
                  onClick={addTool}
                  disabled={!newTool.name}
                  className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  Add Tool
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VibecodeLayout>
  )
}
