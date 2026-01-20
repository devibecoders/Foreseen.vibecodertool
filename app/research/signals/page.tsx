'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { Brain, TrendingUp, TrendingDown, VolumeX, Plus, Minus, RotateCcw, Loader2, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Preference {
    id: string
    feature_type: string
    feature_value: string
    weight: number
    state: string
    updated_at: string
}

export default function SignalsPage() {
    const [preferences, setPreferences] = useState<Preference[]>([])
    const [boosts, setBoosts] = useState<Preference[]>([])
    const [suppressions, setSuppressions] = useState<Preference[]>([])
    const [loading, setLoading] = useState(true)
    const [adjusting, setAdjusting] = useState<string | null>(null)

    useEffect(() => {
        fetchPreferences()
    }, [])

    const fetchPreferences = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/preferences')
            const result = await res.json()

            if (result.ok) {
                const data = result.data
                // Flatten grouped preferences into single array
                const allPrefs: Preference[] = []
                if (data.preferences) {
                    Object.values(data.preferences).forEach((group: any) => {
                        allPrefs.push(...group)
                    })
                }

                setPreferences(allPrefs)
                setBoosts(data.boosted || [])
                setSuppressions(data.suppressed || [])
            }
        } catch (error) {
            console.error('Error fetching preferences:', error)
            toast.error('Failed to load signals')
        } finally {
            setLoading(false)
        }
    }

    const handleAdjust = async (pref: Preference, delta: number) => {
        setAdjusting(pref.id)
        try {
            const res = await fetch('/api/preferences/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key_type: pref.feature_type,
                    key_value: pref.feature_value,
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

    const handleMute = async (pref: Preference) => {
        setAdjusting(pref.id)
        try {
            const res = await fetch('/api/preferences/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key_type: pref.feature_type,
                    key_value: pref.feature_value,
                    muted: pref.state !== 'muted'
                })
            })

            const result = await res.json()
            if (result.ok) {
                toast.success(pref.state === 'muted' ? 'Topic unmuted' : 'Topic muted')
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

    const handleReset = async (pref: Preference) => {
        setAdjusting(pref.id)
        try {
            const res = await fetch('/api/preferences/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key_type: pref.feature_type,
                    key_value: pref.feature_value
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
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Signals</h1>
                            <p className="text-sm text-gray-500">How Foreseen ranks your news</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                            <p className="text-sm text-gray-500">Loading your signals...</p>
                        </div>
                    </div>
                ) : preferences.length === 0 ? (
                    <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-900 mb-2">No signals yet</h2>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Start making decisions on articles in your scans. Each decision teaches the algorithm what you care about.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Summary Section */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Your Algorithm Summary</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Boosted Topics */}
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Boosted Topics</span>
                                    </div>
                                    {boosts.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {boosts.slice(0, 5).map((pref: Preference) => (
                                                <span key={pref.id} className="px-2 py-1 bg-white border border-green-200 rounded-lg text-xs font-bold text-green-700">
                                                    {pref.feature_value}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-green-600">No boosted topics yet</p>
                                    )}
                                </div>

                                {/* Suppressed Topics */}
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingDown className="w-4 h-4 text-orange-600" />
                                        <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Suppressed Topics</span>
                                    </div>
                                    {suppressions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {suppressions.slice(0, 5).map((pref: Preference) => (
                                                <span key={pref.id} className="px-2 py-1 bg-white border border-orange-200 rounded-lg text-xs font-bold text-orange-700">
                                                    {pref.feature_value}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-orange-600">No suppressed topics yet</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Exploration Note */}
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <p className="text-sm text-purple-900">
                                <strong>Note:</strong> Foreseen includes 10-20% exploration in rankings to help you discover new relevant topics.
                                Your signals influence priority, but won&apos;t completely filter out content.
                            </p>
                        </div>

                        {/* All Preferences Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">All Signals ({preferences.length})</h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {preferences.map((pref) => (
                                    <div key={pref.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-900">{pref.feature_value}</span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded">
                                                    {pref.feature_type}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getWeightColor(pref.weight, pref.state)}`}>
                                                    {getStatusLabel(pref.weight, pref.state)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Weight: {pref.weight.toFixed(1)} • Last updated {new Date(pref.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {adjusting === pref.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleAdjust(pref, -0.5)}
                                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                        title="Decrease weight"
                                                    >
                                                        <Minus className="w-4 h-4 text-slate-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAdjust(pref, 0.5)}
                                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                        title="Increase weight"
                                                    >
                                                        <Plus className="w-4 h-4 text-slate-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMute(pref)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${pref.state === 'muted'
                                                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                            }`}
                                                        title={pref.state === 'muted' ? 'Unmute' : 'Mute'}
                                                    >
                                                        <VolumeX className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReset(pref)}
                                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                        title="Reset to neutral"
                                                    >
                                                        <RotateCcw className="w-4 h-4 text-slate-600" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
