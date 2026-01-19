'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { BarChart3, FileText, CheckSquare, Play, Sparkles, ChevronRight, Clock, AlertCircle } from 'lucide-react'

interface LastScan {
    id: string
    startedAt: string
    status: string
    itemsFetched: number
    itemsAnalyzed: number
    _count?: { articles: number }
}

interface LastBrief {
    id: string
    title: string
    week_label: string
    created_at: string
}

interface DecisionStats {
    total: number
    open: number
}

export default function ResearchPage() {
    const [loading, setLoading] = useState(true)
    const [lastScan, setLastScan] = useState<LastScan | null>(null)
    const [lastBrief, setLastBrief] = useState<LastBrief | null>(null)
    const [decisionStats, setDecisionStats] = useState<DecisionStats>({ total: 0, open: 0 })
    const [runningAction, setRunningAction] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch last scan
            const scansRes = await fetch('/api/scans')
            const scansData = await scansRes.json()
            if (scansData.scans && scansData.scans.length > 0) {
                setLastScan(scansData.scans[0])
            }

            // Fetch last brief
            const briefRes = await fetch('/api/weekly/latest')
            const briefData = await briefRes.json()
            if (briefData.brief) {
                setLastBrief(briefData.brief)
            }

            // TODO: Fetch decision stats when endpoint is ready
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRunScan = async () => {
        setRunningAction('scan')
        try {
            const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daysBack: 7 })
            })
            const data = await res.json()
            if (data.success) {
                alert(`Scan complete! ${data.itemsNew} new articles, ${data.itemsAnalyzed} analyzed.`)
                fetchData()
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            alert('Scan failed')
        } finally {
            setRunningAction(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Research Hub</h1>
                            <p className="text-sm text-gray-500">Scan → Synthesize → Decide</p>
                        </div>
                    </div>
                </div>

                {/* Three Blocks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Weekly Scan Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-gray-900">Weekly Scan</h2>
                            </div>
                        </div>
                        <div className="p-5">
                            {loading ? (
                                <div className="h-24 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                                </div>
                            ) : lastScan ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            {format(new Date(lastScan.startedAt), 'MMM d, yyyy HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Articles</span>
                                        <span className="font-semibold text-gray-900">{lastScan._count?.articles || lastScan.itemsFetched || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Analyzed</span>
                                        <span className="font-semibold text-green-600">{lastScan.itemsAnalyzed || 0}</span>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lastScan.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        lastScan.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {lastScan.status}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No scans yet</p>
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/30 space-y-2">
                            <button
                                onClick={handleRunScan}
                                disabled={runningAction === 'scan'}
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2"
                            >
                                {runningAction === 'scan' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Run Scan
                                    </>
                                )}
                            </button>
                            <Link
                                href="/scans"
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                View Results
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Weekly Synthesis Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-gray-900">Weekly Synthesis</h2>
                            </div>
                        </div>
                        <div className="p-5">
                            {loading ? (
                                <div className="h-24 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                                </div>
                            ) : lastBrief ? (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{lastBrief.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{lastBrief.week_label}</span>
                                        <span>·</span>
                                        <span>{format(new Date(lastBrief.created_at), 'MMM d')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No briefs yet</p>
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/30 space-y-2">
                            <Link
                                href="/weekly-briefs"
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate from Scan
                            </Link>
                            <Link
                                href="/weekly-briefs"
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                View Briefs
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Decisions Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-gray-900">Decisions</h2>
                            </div>
                        </div>
                        <div className="p-5">
                            {loading ? (
                                <div className="h-24 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Total decisions</span>
                                        <span className="font-semibold text-gray-900">{decisionStats.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Open items</span>
                                        <span className="font-semibold text-orange-600">{decisionStats.open}</span>
                                    </div>
                                    {decisionStats.open > 0 && (
                                        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{decisionStats.open} items need review</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/30 space-y-2">
                            <Link
                                href="/decisions-inbox"
                                className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Review Decisions
                            </Link>
                            <Link
                                href="/decisions"
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                View All
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="mt-8 bg-slate-100 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Research Flow</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <span>Scan</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <span>Synthesize</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <span>Decide</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
