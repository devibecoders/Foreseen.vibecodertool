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
        console.log(`[Scan Detail] Fetching articles for scan ${params.id}...`)
        try {
            const response = await fetch(`/api/research/scan/${params.id}?t=${Date.now()}`)
            const data = await response.json()

            if (data.scan) {
                console.log(`[Scan Detail] Scan found:`, data.scan.id)
                console.log(`[Scan Detail] Articles count from DB:`, data.scan.articles?.length || 0)
                setScan(data.scan)
                setArticles(data.scan.articles || [])
            } else {
                console.error('[Scan Detail] Scan not found in response')
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
        if (category !== 'ALL' && !article.analysis.categories.includes(category)) return false
        if (article.analysis.impactScore < minImpactScore) return false
        return true
    })

    const topArticles = [...filteredArticles]
        .sort((a, b) => (b.analysis?.impactScore || 0) - (a.analysis?.impactScore || 0))
        .slice(0, 5)

    const categoryDistribution = filteredArticles.reduce((acc, article) => {
        if (!article.analysis) return acc
        article.analysis.categories.split(',').forEach(cat => {
            acc[cat] = (acc[cat] || 0) + 1
        })
        return acc
    }, {} as Record<string, number>)

    const avgImpactScore = filteredArticles.length > 0
        ? Math.round(filteredArticles.reduce((sum, a) => sum + (a.analysis?.impactScore || 0), 0) / filteredArticles.length)
        : 0

    const highImpactCount = filteredArticles.filter(a => a.analysis && a.analysis.impactScore >= 70).length

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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Results</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{articles.length}</p>
                            <p className="text-xs text-gray-500 mt-1">Articles fetched</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Impact</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{avgImpactScore}</p>
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${avgImpactScore}%` }}
                                />
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">High Impact</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{highImpactCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Score ≥ 70</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-slate-600" />
                                </div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scan Date</p>
                            </div>
                            <p className="text-base font-semibold text-gray-900">
                                {format(new Date(scan.startedAt), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 text-right">{format(new Date(scan.startedAt), 'HH:mm')}</p>
                        </div>
                    </div>

                    {/* Filters & Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Top Recommended */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                                    <h2 className="text-sm font-semibold text-gray-900">Top Recommended</h2>
                                </div>
                                <div className="divide-y divide-slate-200">
                                    {topArticles.length > 0 ? topArticles.map((article, idx) => (
                                        <div
                                            key={article.id}
                                            onClick={() => setSelectedArticle(article)}
                                            className="p-4 hover:bg-slate-50 cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">{article.title}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span>{article.source}</span>
                                                        <span className={`font-bold ${article.analysis!.impactScore >= 70 ? 'text-green-600' :
                                                            article.analysis!.impactScore >= 50 ? 'text-orange-600' : 'text-gray-600'
                                                            }`}>
                                                            {article.analysis?.impactScore}/100
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-gray-500 text-sm">No highly relevant articles found.</div>
                                    )}
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category Filter</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Min Impact Score ({minImpactScore})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={minImpactScore}
                                        onChange={(e) => setMinImpactScore(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                    />
                                </div>
                            </div>

                            {/* All Articles Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredArticles.map(article => (
                                    <div
                                        key={article.id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{article.source}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${article.analysis!.impactScore >= 70 ? 'bg-green-100 text-green-700' :
                                                article.analysis!.impactScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {article.analysis?.impactScore}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-slate-800 mb-2">
                                            {article.title}
                                        </h3>
                                        <p className="text-[10px] text-gray-500">
                                            {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                ))}
                                {filteredArticles.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-xl">
                                        <p className="text-sm text-gray-500">No articles match your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Categories */}
                        <div className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 ring-1 ring-slate-100">
                                <div className="flex items-center gap-2 mb-6">
                                    <BarChart3 className="w-4 h-4 text-slate-900" />
                                    <h2 className="text-sm font-bold text-gray-900">Articles by Category</h2>
                                </div>
                                <div className="space-y-4">
                                    {Object.entries(categoryDistribution)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([cat, count]) => {
                                            const percentage = Math.round((count / filteredArticles.length) * 100) || 0
                                            return (
                                                <div key={cat} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                                                        <span className="text-gray-600">{cat}</span>
                                                        <span className="text-gray-900">{count}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
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
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal content same as before but cleaner */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-start justify-between z-10">
                            <div className="flex-1 pr-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                                    {selectedArticle.title}
                                </h2>
                                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                    <span className="uppercase tracking-widest">{selectedArticle.source}</span>
                                    <span>·</span>
                                    <span>{format(new Date(selectedArticle.publishedAt), 'MMM d, yyyy')} at {format(new Date(selectedArticle.publishedAt), 'HH:mm')}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <a
                                href={selectedArticle.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Read Source
                            </a>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Impact Score</h3>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-6xl font-black ${selectedArticle.analysis.impactScore >= 70 ? 'text-green-600' :
                                            selectedArticle.analysis.impactScore >= 50 ? 'text-orange-600' : 'text-slate-600'
                                            }`}>
                                            {selectedArticle.analysis.impactScore}
                                        </span>
                                        <span className="text-xl font-bold text-gray-300">/100</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-4 h-4 text-slate-400" />
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categories</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedArticle.analysis.categories.split(',').map(cat => (
                                            <span key={cat} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Synthesis</h3>
                                <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm">
                                    <p className="text-gray-700 leading-relaxed font-medium">{selectedArticle.analysis.summary}</p>
                                </div>
                            </div>

                            {selectedArticle.analysis.keyTakeaways && (
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Key Takeaways</h3>
                                    <div className="space-y-3">
                                        {selectedArticle.analysis.keyTakeaways.split('|||').filter(Boolean).map((t, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black">
                                                    {i + 1}
                                                </div>
                                                <p className="text-sm font-semibold text-gray-700 leading-snug">{t}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <DecisionAssessmentPanel
                                article={selectedArticle}
                                onSave={() => {
                                    fetchScanDetail()
                                }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">For Customers</h3>
                                    <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl">
                                        <p className="text-sm font-medium text-orange-950 leading-relaxed">{selectedArticle.analysis.customerAngle}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-green-400 uppercase tracking-widest">For Vibecoders</h3>
                                    <div className="p-5 bg-green-50 border border-green-100 rounded-2xl">
                                        <p className="text-sm font-medium text-green-950 leading-relaxed">{selectedArticle.analysis.vibecodersAngle}</p>
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
