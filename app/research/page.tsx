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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Weekly Scan Block */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600 font-medium">
                                            {format(new Date(lastScan.startedAt), 'MMM d, HH:mm')}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Articles</p>
                                            <p className="text-lg font-black text-gray-900">{lastScan._count?.articles || lastScan.itemsFetched || 0}</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Analyzed</p>
                                            <p className="text-lg font-black text-green-700">{lastScan.itemsAnalyzed || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">No scans yet</p>
                                </div>
                            )}
                        </div>
                        <div className="px-5 pb-5 pt-0 space-y-3">
                            <button
                                onClick={handleRunScan}
                                disabled={runningAction === 'scan'}
                                className="w-full h-12 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                            >
                                {runningAction === 'scan' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Run New Scan
                                    </>
                                )}
                            </button>
                            <Link
                                href="/research/scan"
                                className="w-full h-12 text-sm font-bold text-gray-700 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                View Past Results
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Weekly Synthesis Block */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{lastBrief.title}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                        <div className="px-2 py-1 bg-slate-100 rounded-md">{lastBrief.week_label}</div>
                                        <span>{format(new Date(lastBrief.created_at), 'MMM d')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">No briefs generated</p>
                                </div>
                            )}
                        </div>
                        <div className="px-5 pb-5 pt-0 space-y-3">
                            <Link
                                href="/weekly-briefs"
                                className="w-full h-12 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                            >
                                <Sparkles className="w-4 h-4" />
                                Generate Brief
                            </Link>
                            <Link
                                href="/weekly-briefs"
                                className="w-full h-12 text-sm font-bold text-gray-700 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                Browse Library
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Decisions Block */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden border-b-4 border-b-orange-200">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
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
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                                            <p className="text-lg font-black text-gray-900">{decisionStats.total}</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-3">
                                            <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1">Open</p>
                                            <p className="text-lg font-black text-orange-700">{decisionStats.open}</p>
                                        </div>
                                    </div>
                                    {decisionStats.open > 0 && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 rounded-lg px-3 py-2 border border-orange-100">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>Immediate Action Required</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="px-5 pb-5 pt-0 space-y-3">
                            <Link
                                href="/decisions-inbox"
                                className="w-full h-12 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Inbox Review
                            </Link>
                            <Link
                                href="/decisions"
                                className="w-full h-12 text-sm font-bold text-gray-700 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                History
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
