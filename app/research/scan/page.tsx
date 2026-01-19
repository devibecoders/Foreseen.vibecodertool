'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import {
  BarChart3, Calendar, Trash2, Sparkles, AlertCircle, ChevronRight
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

interface Scan {
  id: string
  startedAt: string
  completedAt: string | null
  itemsFetched: number
  itemsAnalyzed: number
  status: string
  _count: { articles: number }
}

export default function ScansListPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [showScanConfirmModal, setShowScanConfirmModal] = useState(false)
  const [scanToDelete, setScanToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchScans = async () => {
    setLoading(true)
    console.log('[Scans] Fetching scan list from /api/research/scan...')
    try {
      const response = await fetch(`/api/research/scan?t=${Date.now()}`)
      const data = await response.json()
      console.log('[Scans] Fetched scans:', data.scans?.length || 0)
      setScans(data.scans || [])
    } catch (error) {
      console.error('[Scans] Error fetching scans:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScans()
  }, [])

  const deleteScan = async () => {
    if (!scanToDelete) return
    setIsDeleting(true)
    console.log(`[Scans] Deleting scan ${scanToDelete}...`)
    try {
      const res = await fetch(`/api/research/scan/${scanToDelete}`, { method: 'DELETE' })
      const result = await res.json()

      if (res.ok && result.ok) {
        // Optimistic update
        setScans(prev => prev.filter(s => s.id !== scanToDelete))
        console.log(`[Scans] Successfully deleted ${scanToDelete}`)
      } else {
        console.error('[Scans] Delete failed:', result.error)
        alert('Error deleting scan: ' + (result.error || 'Unknown error'))
        fetchScans() // Re-fetch to sync state
      }
    } catch (error) {
      console.error('[Scans] Error deleting scan:', error)
      alert('Error deleting scan')
      fetchScans()
    } finally {
      setIsDeleting(false)
      setScanToDelete(null)
    }
  }

  const startScan = async () => {
    setShowScanConfirmModal(false)
    setRunning(true)
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 7 })
      })

      const data = await response.json()
      if (data.success) {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
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
              onClick={() => setShowScanConfirmModal(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {loading ? (
              <div className="col-span-full p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
              </div>
            ) : scans.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-900">No scans yet.</p>
                <p className="text-xs text-gray-400 mt-1">Start your first scan to begin researching.</p>
              </div>
            ) : (
              scans.map(scan => (
                <div
                  key={scan.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group relative active:scale-[0.99]"
                >
                  <Link href={`/research/scan/${scan.id}`} className="block p-5 md:p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-slate-600" />
                        </div>
                        <p className="text-sm font-black text-gray-900 tracking-tight">
                          {format(new Date(scan.startedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${scan.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                        scan.status === 'running' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                        {scan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Articles</p>
                        <p className="text-xl font-black text-gray-900 leading-none">{scan._count.articles}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">Analyzed</p>
                        <p className="text-xl font-black text-green-700 leading-none">{scan.itemsAnalyzed}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {scan.itemsFetched} fetched
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Open <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setScanToDelete(scan.id)
                    }}
                    className="absolute top-4 right-4 p-2 md:opacity-0 md:group-hover:opacity-100 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all z-10"
                    title="Delete Scan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* New Scan Confirmation */}
      <ConfirmModal
        isOpen={showScanConfirmModal}
        title="Start New Scan?"
        message="This will fetch the latest articles from all sources and analyze them. This typically takes 2-5 minutes."
        confirmText="Start Scan"
        onConfirm={startScan}
        onCancel={() => setShowScanConfirmModal(false)}
        variant="info"
      />

      {/* Delete Scan Confirmation */}
      <ConfirmModal
        isOpen={!!scanToDelete}
        title="Delete Scan?"
        message="This will permanently remove this scan result and all linked data. This cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
        onConfirm={deleteScan}
        onCancel={() => setScanToDelete(null)}
        variant="danger"
      />
    </div>
  )
}
