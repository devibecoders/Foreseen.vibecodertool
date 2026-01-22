'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import {
    BarChart3, TrendingUp, AlertCircle, Calendar, Trash2,
    ExternalLink, X, Sparkles, Target, Zap, ChevronLeft
} from 'lucide-react'
import DecisionAssessmentPanel from '@/components/DecisionAssessmentPanel'
import ConfirmModal from '@/components/ConfirmModal'
import { useRouter } from 'next/navigation'

interface Analysis {
    id?: string
    summary: string
    categories: string
    impactScore: number
    relevanceReason: string
    customerAngle: string
    vibecodersAngle: string
    keyTakeaways: string
}

interface Article {
    id: string
    title: string
    url: string
    source: string
    publishedAt: string
    scanId: string | null
    analysis: Analysis | null
    base_score?: number
    preference_delta?: number
    adjusted_score?: number
    reasons?: {
        boosted: Array<{ key: string, weight: number }>
        suppressed: Array<{ key: string, weight: number }>
    }
    isPersonalized?: boolean
    decision?: {
        id: string
        action: string
        createdAt: string
    } | null
}

interface Scan {
    id: string
    startedAt: string
    completedAt: string | null
    itemsFetched: number
    itemsAnalyzed: number
    status: string
    _count: { articles: number }
    articles?: Article[]
}

const CATEGORIES = [
    'ALL', 'DEV_TOOLS', 'MODELS', 'AGENTS', 'PRODUCT',
    'SECURITY', 'PRICING', 'POLICY', 'RESEARCH', 'OTHER'
]

export default function ScanDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [scan, setScan] = useState<Scan | null>(null)
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
    const [category, setCategory] = useState('ALL')
    const [minImpactScore, setMinImpactScore] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    useEffect(() => {
        fetchScanDetail()
    }, [params.id])

    const fetchScanDetail = async () => {
        setLoading(true)
        console.log(`[Scan Detail] Fetching scan ${params.id}...`)
        try {
            const response = await fetch(`/api/research/scan/${params.id}?t=${Date.now()}`)
            const data = await response.json()

            if (data.scan) {
                const totalArticles = data.scan.articles?.length || 0
                const analyzedArticles = data.scan.articles?.filter((a: any) => a.analysis).length || 0
                console.log(`[Scan Detail] Scan found: ${data.scan.id}`)
                console.log(`[Scan Detail] Articles: ${totalArticles}, Analyzed: ${analyzedArticles}`)

                if (totalArticles > 0 && analyzedArticles === 0) {
                    console.warn('[Scan Detail] WARNING: Articles found but none have analysis data!')
                }

                setScan(data.scan)
                setArticles(data.scan.articles || [])
            } else {
                console.error('[Scan Detail] API response missing scan data')
            }
        } catch (error) {
            console.error('[Scan Detail] Error fetching scan detail:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        console.log(`[Scan Detail] Deleting scan ${params.id}...`)
        try {
            const res = await fetch(`/api/research/scan/${params.id}`, { method: 'DELETE' })
            const result = await res.json()
            console.log(`[Scan Detail] Delete result:`, result)

            if (result.ok) {
                router.push('/research/scan')
                router.refresh()
            } else {
                alert('Delete failed: ' + (result.error || 'Unknown error'))
            }
        } catch (error) {
            console.error('[Scan Detail] Error deleting scan:', error)
            alert('Error deleting scan')
        } finally {
            setIsDeleting(false)
            setShowDeleteModal(false)
        }
    }

    const filteredArticles = articles.filter(article => {
        if (!article.analysis) return false
        const score = article.adjusted_score ?? article.analysis.impactScore
        if (category !== 'ALL' && !article.analysis.categories.includes(category)) return false
        if (score < minImpactScore) return false
        return true
    }).sort((a, b) => {
        const scoreA = a.adjusted_score ?? a.analysis?.impactScore ?? 0
        const scoreB = b.adjusted_score ?? b.analysis?.impactScore ?? 0
        return scoreB - scoreA
    })

    const topArticles = filteredArticles.slice(0, 5)

    const categoryDistribution = filteredArticles.reduce((acc, article) => {
        if (!article.analysis) return acc
        article.analysis.categories.split(',').forEach(cat => {
            const trimmedCat = cat.trim()
            if (trimmedCat) acc[trimmedCat] = (acc[trimmedCat] || 0) + 1
        })
        return acc
    }, {} as Record<string, number>)

    const avgImpactScore = filteredArticles.length > 0
        ? Math.round(filteredArticles.reduce((sum, a) => sum + (a.adjusted_score ?? a.analysis?.impactScore ?? 0), 0) / filteredArticles.length)
        : 0

    const highImpactCount = filteredArticles.filter(a => (a.adjusted_score ?? a.analysis?.impactScore ?? 0) >= 70).length

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900" />
                </div>
            </div>
        )
    }

    if (!scan) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">Scan Not Found</h1>
                    <p className="text-gray-500 mt-2 mb-8">The scan you are looking for does not exist or has been deleted.</p>
                    <Link href="/research/scan" className="text-slate-900 font-medium hover:underline">
                        Back to Scans
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {/* Back Button & Actions */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/research/scan"
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white transition-all border border-transparent hover:border-slate-200"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to scans
                        </Link>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2 border border-transparent hover:border-red-100"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Scan
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{articles.length}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Articles</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avg</p>
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-gray-900 leading-none">{avgImpactScore}</p>
                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1">
                                <div
                                    className="bg-orange-500 h-1 rounded-full transition-all"
                                    style={{ width: `${avgImpactScore}%` }}
                                />
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-green-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High</p>
                            </div>
                            <p className="text-2xl md:text-3xl font-black text-green-600 leading-none">{highImpactCount}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Impact ≥ 70</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-slate-600" />
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                            </div>
                            <p className="text-sm md:text-base font-black text-gray-900 leading-none">
                                {format(new Date(scan.startedAt), 'MMM d, yy')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{format(new Date(scan.startedAt), 'HH:mm')}</p>
                        </div>
                    </div>

                    {/* Filters & Content Grid */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-6">
                            {/* Top Recommended */}
                            <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <h2 className="text-xs font-black text-white uppercase tracking-widest">Key Opportunities</h2>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Top 5</span>
                                </div>
                                <div className="divide-y divide-slate-800">
                                    {topArticles.length > 0 ? topArticles.map((article, idx) => (
                                        <div
                                            key={article.id}
                                            onClick={() => setSelectedArticle(article)}
                                            className="p-4 md:p-5 hover:bg-slate-800/50 cursor-pointer transition-all group active:bg-slate-800"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex-shrink-0 w-8 md:w-10 h-8 md:h-10 rounded-xl bg-slate-800 text-amber-400 text-sm md:text-base font-black flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-900 transition-all border border-slate-700">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white line-clamp-1 mb-1 group-hover:text-amber-50 transition-colors uppercase tracking-tight">{article.title}</p>
                                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                                        <span className="text-slate-500">{article.source}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                        <span className={`${(article.adjusted_score ?? article.analysis!.impactScore) >= 70 ? 'text-green-500' :
                                                            (article.adjusted_score ?? article.analysis!.impactScore) >= 50 ? 'text-amber-500' : 'text-slate-400'
                                                            }`}>
                                                            Score {Math.round(article.adjusted_score ?? article.analysis!.impactScore)}
                                                        </span>
                                                        {article.isPersonalized && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                                {article.reasons?.boosted.map(r => (
                                                                    <span key={r.key} className="text-blue-400">
                                                                        ↑ {r.key}
                                                                    </span>
                                                                ))}
                                                                {article.reasons?.suppressed.map(r => (
                                                                    <span key={r.key} className="text-orange-400">
                                                                        ↓ {r.key}
                                                                    </span>
                                                                ))}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">No matching articles found.</div>
                                    )}
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-5">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filter by Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategory(cat)}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${category === cat
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="md:w-1/3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Min Impact ({minImpactScore})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={minImpactScore}
                                        onChange={(e) => setMinImpactScore(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                    />
                                </div>
                            </div>

                            {/* All Articles Grid with Scroll */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysed Articles ({filteredArticles.length})</h3>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">Scroll to explore</span>
                                </div>
                                <div className="max-h-[700px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                        {filteredArticles.map(article => (
                                            <div
                                                key={article.id}
                                                onClick={() => setSelectedArticle(article)}
                                                className={`bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-xl hover:border-slate-300 cursor-pointer transition-all group active:scale-[0.98] ${article.decision ? 'opacity-60 hover:opacity-100 bg-slate-50/50' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{article.source}</span>
                                                            {article.decision && (
                                                                <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                                                    {article.decision.action}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {article.isPersonalized && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {article.reasons?.boosted.map(r => (
                                                                    <span key={r.key} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold border bg-blue-50 text-blue-600 border-blue-100">
                                                                        ↑ {r.key}
                                                                    </span>
                                                                ))}
                                                                {article.reasons?.suppressed.map(r => (
                                                                    <span key={r.key} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-bold border bg-orange-50 text-orange-600 border-orange-100">
                                                                        ↓ {r.key}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-tight ${(article.adjusted_score ?? article.analysis!.impactScore) >= 70 ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        (article.adjusted_score ?? article.analysis!.impactScore) >= 50 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}>
                                                        {Math.round(article.adjusted_score ?? article.analysis!.impactScore)}P
                                                    </div>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 leading-tight mb-3 group-hover:text-slate-800 uppercase tracking-tight">
                                                    {article.title}
                                                </h3>
                                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-900 group-hover:translate-x-1 transition-transform">
                                                        DETAILS →
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredArticles.length === 0 && (
                                            <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-inner">
                                                <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No articles found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Categories */}
                        <div className="w-full lg:w-80 space-y-6">
                            <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                        <Target className="w-4 h-4 text-white" />
                                    </div>
                                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Distribution</h2>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(categoryDistribution)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([cat, count]) => {
                                            const percentage = Math.round((count / filteredArticles.length) * 100) || 0
                                            return (
                                                <div key={cat} className="space-y-2">
                                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                        <span className="text-slate-500">{cat}</span>
                                                        <span className="text-slate-900 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">{count}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                                        <div
                                                            className="bg-slate-900 h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Article Modal */}
            {selectedArticle && selectedArticle.analysis && (
                <div
                    className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-0 md:p-4 z-50 animate-in fade-in duration-300"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div
                        className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-3xl overflow-y-auto overscroll-contain touch-pan-y shadow-2xl border border-slate-200 animate-in slide-in-from-bottom md:slide-in-from-bottom-4 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal content same as before but cleaner */}
                        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between z-20">
                            <div className="flex-1 pr-6">
                                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    <span>{selectedArticle.source}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span>{format(new Date(selectedArticle.publishedAt), 'MMM d, yyyy')}</span>
                                </div>
                                <h2 className="text-lg font-black text-gray-900 leading-tight uppercase tracking-tight">
                                    {selectedArticle.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all border border-slate-100 active:scale-95"
                            >
                                <X className="w-6 h-6 text-gray-900" />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-8 pb-20 md:pb-8">
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <a
                                    href={selectedArticle.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    OPEN SOURCE
                                </a>
                                <div className="hidden md:block w-px h-6 bg-slate-100" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Share results</span>
                                    <div className="flex gap-1">
                                        <button className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-white transition-all"><Zap className="w-3 h-3 text-slate-600" /></button>
                                        <button className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-white transition-all"><BarChart3 className="w-3 h-3 text-slate-600" /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -translate-y-16 translate-x-16 transition-transform group-hover:scale-110" />
                                    <div className="flex items-center gap-2 mb-4 relative z-10">
                                        <TrendingUp className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Factor</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <span className={`text-6xl md:text-7xl font-black ${(selectedArticle.adjusted_score ?? selectedArticle.analysis.impactScore) >= 70 ? 'text-green-400' :
                                            (selectedArticle.adjusted_score ?? selectedArticle.analysis.impactScore) >= 50 ? 'text-amber-400' : 'text-slate-400'
                                            }`}>
                                            {Math.round(selectedArticle.adjusted_score ?? selectedArticle.analysis.impactScore)}
                                        </span>
                                        <span className="text-xl font-black text-slate-700">/100</span>
                                        {selectedArticle.isPersonalized && (
                                            <div className="ml-4">
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${(selectedArticle.preference_delta || 0) > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                                                    {(selectedArticle.preference_delta || 0) > 0 ? '↑ Boosted' : '↓ Suppressed'}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                                                    Base: {selectedArticle.base_score ?? selectedArticle.analysis.impactScore}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedArticle.analysis.categories.split(',').map(cat => (
                                            <span key={cat} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Strategic Summary</h3>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8">
                                    <p className="text-gray-900 text-base font-bold leading-relaxed tracking-tight">{selectedArticle.analysis.summary}</p>
                                </div>
                            </div>

                            {selectedArticle.analysis.keyTakeaways && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Critical Insight</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedArticle.analysis.keyTakeaways.split('|||').filter(Boolean).map((t, i) => (
                                            <div key={i} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl group hover:border-slate-200 transition-all shadow-sm">
                                                <div className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 leading-snug">{t}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <DecisionAssessmentPanel
                                    article={selectedArticle}
                                    scanId={params.id}
                                    analysisId={selectedArticle.analysis?.id}
                                    onSave={() => {
                                        setSelectedArticle(null)
                                        fetchScanDetail()
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12 md:pb-2">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Customer Sentiment</h3>
                                    <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl">
                                        <p className="text-sm font-bold text-orange-950 leading-relaxed tracking-tight">{selectedArticle.analysis.customerAngle}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-green-500 uppercase tracking-widest ml-1">Internal Opportunity</h3>
                                    <div className="p-6 bg-green-50 border border-green-100 rounded-3xl">
                                        <p className="text-sm font-bold text-green-950 leading-relaxed tracking-tight">{selectedArticle.analysis.vibecodersAngle}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Scan?"
                message="This will permanently remove this scan result and all linked decisions and articles. This action cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    )
}
