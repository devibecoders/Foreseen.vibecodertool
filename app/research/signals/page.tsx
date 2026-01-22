'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { Brain, TrendingUp, TrendingDown, VolumeX, Plus, Minus, RotateCcw, Loader2, AlertCircle, ChevronLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface SignalWeight {
    id: string
    feature_key: string
    feature_type: string
    feature_value: string
    displayValue?: string
    weight: number
    state: string
    updated_at: string
}

interface Totals {
    categories: number
    entities: number
    tools: number
    concepts: number
    contexts: number
    muted: number
    total: number
}

type TabType = 'all' | 'context' | 'concept' | 'entity' | 'tool' | 'category'

const TAB_CONFIG: { key: TabType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'bg-slate-100 text-slate-800' },
    { key: 'context', label: 'Contexts', color: 'bg-teal-100 text-teal-800' },
    { key: 'concept', label: 'Concepts', color: 'bg-amber-100 text-amber-800' },
    { key: 'entity', label: 'Entities', color: 'bg-purple-100 text-purple-800' },
    { key: 'tool', label: 'Tools', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'category', label: 'Categories', color: 'bg-blue-100 text-blue-800' },
]

export default function SignalsPage() {
    const [byType, setByType] = useState<Record<string, SignalWeight[]>>({})
    const [all, setAll] = useState<SignalWeight[]>([])
    const [totals, setTotals] = useState<Totals | null>(null)
    const [boosts, setBoosts] = useState<SignalWeight[]>([])
    const [suppressions, setSuppressions] = useState<SignalWeight[]>([])
    const [loading, setLoading] = useState(true)
    const [adjusting, setAdjusting] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<TabType>('all')
    const [showMutedOnly, setShowMutedOnly] = useState(false)

    const fetchPreferences = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/preferences?showAll=false')
            const result = await res.json()

            if (result.ok) {
                const data = result.data
                setByType(data.byType || {})
                setAll(data.all || [])
                setTotals(data.totals || null)
                setBoosts(data.boosted || [])
                setSuppressions(data.suppressed || [])
            }
        } catch (error) {
            console.error('Error fetching preferences:', error)
            toast.error('Failed to load signals')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPreferences()
    }, [fetchPreferences])

    const handleAdjust = async (weight: SignalWeight, delta: number) => {
        setAdjusting(weight.id)
        try {
            const res = await fetch('/api/preferences/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key_type: weight.feature_type,
                    key_value: weight.feature_value,
                    delta
                })
            })

            const result = await res.json()
            if (result.ok) {
                toast.success('Signal adjusted')
                await fetchPreferences()
            } else {
                toast.error('Failed to adjust')
            }
        } catch (error) {
            toast.error('Failed to adjust signal')
        } finally {
            setAdjusting(null)
        }
    }

    const handleMute = async (weight: SignalWeight) => {
        setAdjusting(weight.id)
        try {
            const res = await fetch('/api/preferences/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key_type: weight.feature_type,
                    key_value: weight.feature_value,
                    muted: weight.state !== 'muted'
                })
            })

            const result = await res.json()
            if (result.ok) {
                toast.success(weight.state === 'muted' ? 'Signal unmuted' : 'Signal muted')
                await fetchPreferences()
            } else {
                toast.error('Failed to toggle mute')
            }
        } catch (error) {
            toast.error('Failed to toggle mute')
        } finally {
            setAdjusting(null)
        }
    }

    const handleReset = async (weight: SignalWeight) => {
        setAdjusting(weight.id)
        try {
            const res = await fetch('/api/preferences/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key_type: weight.feature_type,
                    key_value: weight.feature_value
                })
            })

            const result = await res.json()
            if (result.ok) {
                toast.success('Signal reset')
                await fetchPreferences()
            } else {
                toast.error('Failed to reset')
            }
        } catch (error) {
            toast.error('Failed to reset signal')
        } finally {
            setAdjusting(null)
        }
    }

    // Get data for current tab
    const getTabData = (): SignalWeight[] => {
        let data: SignalWeight[] = []
        if (activeTab === 'all') {
            data = all
        } else if (activeTab === 'entity') {
            // Combine entity and tool
            data = [...(byType.entity || []), ...(byType.tool || [])]
        } else {
            data = byType[activeTab] || []
        }

        // Filter muted only if toggle is on
        if (showMutedOnly) {
            data = data.filter(w => w.state === 'muted')
        }

        // Sort: updated_at desc, then abs(weight) desc
        return data.sort((a, b) => {
            const dateA = new Date(a.updated_at).getTime()
            const dateB = new Date(b.updated_at).getTime()
            if (dateB !== dateA) return dateB - dateA
            return Math.abs(b.weight) - Math.abs(a.weight)
        })
    }

    const filteredData = getTabData()

    const getWeightColor = (weight: number, state: string) => {
        if (state === 'muted') return 'text-red-600 bg-red-50'
        if (weight > 2) return 'text-green-700 bg-green-50'
        if (weight > 0) return 'text-green-600 bg-green-50/50'
        if (weight < -2) return 'text-orange-700 bg-orange-50'
        if (weight < 0) return 'text-orange-600 bg-orange-50/50'
        return 'text-gray-600 bg-gray-50'
    }

    const getStatusLabel = (weight: number, state: string) => {
        if (state === 'muted') return 'MUTED'
        if (weight > 2) return 'STRONG BOOST'
        if (weight > 0) return 'BOOST'
        if (weight < -2) return 'SUPPRESS'
        if (weight < 0) return 'SLIGHT SUPPRESS'
        return 'NEUTRAL'
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'context': return 'Context'
            case 'category': return 'Category'
            case 'entity': return 'Entity'
            case 'tool': return 'Tool'
            case 'concept': return 'Concept'
            default: return type
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'context': return 'bg-teal-100 text-teal-800'
            case 'category': return 'bg-blue-100 text-blue-800'
            case 'entity': return 'bg-purple-100 text-purple-800'
            case 'tool': return 'bg-indigo-100 text-indigo-800'
            case 'concept': return 'bg-amber-100 text-amber-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatValue = (weight: SignalWeight) => {
        if (weight.displayValue) return weight.displayValue
        if (weight.feature_type === 'context') {
            return weight.feature_value
                .replace('entity:', '')
                .replace('tool:', '')
                .replace('concept:', '')
                .split('|')
                .map(s => s.charAt(0).toUpperCase() + s.slice(1))
                .join(' · ')
        }
        return weight.feature_value
    }

    const getTabCount = (tab: TabType): number => {
        if (!totals) return 0
        switch (tab) {
            case 'all': return totals.total
            case 'context': return totals.contexts
            case 'concept': return totals.concepts
            case 'entity': return totals.entities + totals.tools
            case 'tool': return totals.tools
            case 'category': return totals.categories
            default: return 0
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/research"
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Research Hub
                    </Link>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                                <Brain className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Signals Cockpit</h1>
                                <p className="text-sm text-gray-500">
                                    {totals ? `${totals.total} signals trained` : 'Loading...'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchPreferences()}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading && all.length === 0 ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-500">Loading your signals...</p>
                        </div>
                    </div>
                ) : all.length === 0 ? (
                    <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-900 mb-2">No signals yet</h2>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Start making decisions on articles in your scans to train your personal algorithm.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Summary Section */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Algorithm Summary</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Boosted Topics */}
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Boosted</span>
                                    </div>
                                    {boosts.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {boosts.slice(0, 8).map((w) => (
                                                <span key={w.id} className="px-2 py-1 bg-white border border-green-200 rounded-lg text-xs font-bold text-green-700 flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getTypeColor(w.feature_type).replace('text-', 'bg-').split(' ')[0]}`}></span>
                                                    {formatValue(w)}
                                                    <span className="opacity-50 ml-0.5">+{w.weight.toFixed(1)}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-green-600">No boosted signals yet</p>
                                    )}
                                </div>

                                {/* Suppressed Topics */}
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingDown className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Suppressed</span>
                                    </div>
                                    {suppressions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {suppressions.slice(0, 8).map((w) => (
                                                <span key={w.id} className="px-2 py-1 bg-white border border-orange-200 rounded-lg text-xs font-bold text-orange-700 flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getTypeColor(w.feature_type).replace('text-', 'bg-').split(' ')[0]}`}></span>
                                                    {formatValue(w)}
                                                    <span className="opacity-50 ml-0.5">{w.weight.toFixed(1)}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-orange-600">No suppressed signals yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Controls & List */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            {/* Tabs */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 p-1 bg-slate-200/50 rounded-lg overflow-x-auto">
                                    {TAB_CONFIG.map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`
                                                px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5
                                                ${activeTab === tab.key
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-slate-200/50'
                                                }
                                            `}
                                        >
                                            {tab.label}
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === tab.key ? 'bg-slate-100' : 'bg-slate-300/50'}`}>
                                                {getTabCount(tab.key)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showMutedOnly}
                                            onChange={(e) => setShowMutedOnly(e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                        Muted only
                                    </label>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {filteredData.length} signals
                                    </span>
                                </div>
                            </div>

                            {/* List */}
                            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                                <AnimatePresence>
                                    {filteredData.map((weight) => (
                                        <motion.div
                                            key={weight.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatValue(weight)}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getTypeColor(weight.feature_type)}`}>
                                                        {getTypeLabel(weight.feature_type)}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getWeightColor(weight.weight, weight.state)}`}>
                                                        {getStatusLabel(weight.weight, weight.state)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    Weight: <span className="font-mono">{weight.weight > 0 ? '+' : ''}{weight.weight.toFixed(2)}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    Updated {new Date(weight.updated_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {adjusting === weight.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAdjust(weight, -0.5)}
                                                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                            title="Decrease weight"
                                                        >
                                                            <Minus className="w-4 h-4 text-slate-600" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAdjust(weight, 0.5)}
                                                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                            title="Increase weight"
                                                        >
                                                            <Plus className="w-4 h-4 text-slate-600" />
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                        <button
                                                            onClick={() => handleMute(weight)}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${weight.state === 'muted'
                                                                ? 'bg-red-100 hover:bg-red-200 text-red-600'
                                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                                }`}
                                                            title={weight.state === 'muted' ? 'Unmute' : 'Mute (Strong Suppress)'}
                                                        >
                                                            <VolumeX className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReset(weight)}
                                                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                            title="Reset to neutral"
                                                        >
                                                            <RotateCcw className="w-4 h-4 text-slate-600" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {filteredData.length === 0 && (
                                    <div className="py-12 text-center text-gray-500 text-sm">
                                        No signals found for this filter.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Legend/Help */}
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-900">
                            <div className="flex items-start gap-3">
                                <Brain className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold mb-1">How Signals Work</p>
                                    <p className="mb-2">
                                        Foreseen uses a multi-layer signal model powered by <strong>Context Awareness</strong>:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 opacity-90 pl-1">
                                        <li><strong>Contexts</strong> (Teal) have dominant influence (70%) - e.g. "Grok · Undress" targets specific combos.</li>
                                        <li><strong>Concepts</strong> (Amber) have strong influence (40%) - e.g. "Deepfake", "NSFW".</li>
                                        <li><strong>Entities & Tools</strong> (Purple/Indigo) have medium influence (15%) - e.g. "OpenAI", "Supabase".</li>
                                        <li><strong>Categories</strong> (Blue) have light influence (5%) - e.g. "Security", "Dev Tools".</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
