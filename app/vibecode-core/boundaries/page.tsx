'use client'

import { useState, useEffect } from 'react'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { Plus, Trash2, X, AlertTriangle, Ban } from 'lucide-react'

interface Boundary {
  id: string
  title: string
  severity: 'hard' | 'soft'
  rationale: string
  alternative_approach: string
}

interface VibecodeCore {
  id: string
}

export default function VibecodeBoundariesPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [boundaries, setBoundaries] = useState<Boundary[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBoundary, setNewBoundary] = useState({
    title: '',
    severity: 'soft' as Boundary['severity'],
    rationale: '',
    alternative_approach: ''
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

        const boundariesResponse = await fetch(`/api/vibecode/boundaries?coreId=${coreData.core.id}`)
        const boundariesData = await boundariesResponse.json()
        setBoundaries(boundariesData.boundaries || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBoundary = async () => {
    if (!core || !newBoundary.title) return

    try {
      const response = await fetch('/api/vibecode/boundaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBoundary, core_id: core.id })
      })
      const data = await response.json()

      if (data.success) {
        setBoundaries([...boundaries, data.boundary])
        setShowAddModal(false)
        setNewBoundary({
          title: '',
          severity: 'soft',
          rationale: '',
          alternative_approach: ''
        })
      }
    } catch (error) {
      console.error('Error adding boundary:', error)
      alert('Error adding boundary')
    }
  }

  const deleteBoundary = async (id: string) => {
    if (!confirm('Delete this boundary?')) return

    try {
      await fetch(`/api/vibecode/boundaries?id=${id}`, { method: 'DELETE' })
      setBoundaries(boundaries.filter(b => b.id !== id))
    } catch (error) {
      console.error('Error deleting boundary:', error)
    }
  }

  const hardBoundaries = boundaries.filter(b => b.severity === 'hard')
  const softBoundaries = boundaries.filter(b => b.severity === 'soft')

  return (
    <VibecodeLayoutNotion>
      <div className="px-12 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
          </div>
        ) : !core ? (
          <div className="text-center py-24">
            <p className="text-gray-600">Initialiseer eerst je Vibecode Core.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-tight mb-2">
                  Grenzen
                </h1>
                <p className="text-gray-600">De expliciete &quot;NEE&quot; lijst</p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Grens Toevoegen
              </button>
            </div>

            {/* Hard Boundaries */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ban className="w-5 h-5 text-red-600" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">Harde Grenzen</h2>
                <span className="text-sm text-gray-500">— Doe dit nooit</span>
              </div>

              {hardBoundaries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-sm">Nog geen harde grenzen gedefinieerd.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {hardBoundaries.map(boundary => (
                    <div
                      key={boundary.id}
                      className="bg-red-50 border-l-4 border-red-600 rounded-r-lg p-6 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Ban className="w-5 h-5 text-red-700" />
                            <h3 className="text-lg font-semibold text-gray-900">{boundary.title}</h3>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                            HARDE GRENS
                          </span>
                        </div>
                        <button
                          onClick={() => deleteBoundary(boundary.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div>
                          <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1.5">Reden</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{boundary.rationale}</p>
                        </div>
                        {boundary.alternative_approach && (
                          <div>
                            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1.5">Alternatief</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{boundary.alternative_approach}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Soft Boundaries */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h2 className="text-2xl font-serif font-bold text-gray-900">Zachte Grenzen</h2>
                <span className="text-sm text-gray-500">— Vereist goedkeuring</span>
              </div>

              {softBoundaries.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-sm">Nog geen zachte grenzen gedefinieerd.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {softBoundaries.map(boundary => (
                    <div
                      key={boundary.id}
                      className="bg-orange-50 border-l-4 border-orange-500 rounded-r-lg p-6 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-700" />
                            <h3 className="text-lg font-semibold text-gray-900">{boundary.title}</h3>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
                            ZACHTE GRENS
                          </span>
                        </div>
                        <button
                          onClick={() => deleteBoundary(boundary.id)}
                          className="opacity-0 group-hover:opacity-100 text-orange-600 hover:text-orange-700 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3 mt-4">
                        <div>
                          <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1.5">Reden</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{boundary.rationale}</p>
                        </div>
                        {boundary.alternative_approach && (
                          <div>
                            <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1.5">Aanbevolen Aanpak</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{boundary.alternative_approach}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Boundary Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Boundary</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Boundary Title *</label>
                  <input
                    type="text"
                    value={newBoundary.title}
                    onChange={(e) => setNewBoundary({ ...newBoundary, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g., No premature optimization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity *</label>
                  <select
                    value={newBoundary.severity}
                    onChange={(e) => setNewBoundary({ ...newBoundary, severity: e.target.value as Boundary['severity'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="soft">Soft (Requires approval)</option>
                    <option value="hard">Hard (Never do this)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rationale *</label>
                  <textarea
                    value={newBoundary.rationale}
                    onChange={(e) => setNewBoundary({ ...newBoundary, rationale: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="Why is this a boundary? What problems does it prevent?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Alternative Approach</label>
                  <textarea
                    value={newBoundary.alternative_approach}
                    onChange={(e) => setNewBoundary({ ...newBoundary, alternative_approach: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    placeholder="What should be done instead?"
                  />
                </div>

                <button
                  onClick={addBoundary}
                  disabled={!newBoundary.title || !newBoundary.rationale}
                  className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  Add Boundary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VibecodeLayoutNotion>
  )
}
