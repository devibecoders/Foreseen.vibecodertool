'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import ConfirmModal from '@/components/ConfirmModal'
import {
    BarChart3, FileText, CheckSquare, Folder, Sparkles, Play,
    Clock, AlertCircle, ChevronRight, Lightbulb, Plus, Trash2,
    Save, Pin, User, Calendar, Target
} from 'lucide-react'

interface DashboardData {
    latestScan: {
        id: string
        status: string
        startedAt: string
        completedAt: string | null
        itemsFetched: number
        itemsAnalyzed: number
    } | null
    unreviewedCount: number
    unreviewedTop: Array<{
        id: string
        title: string
        url: string
        source: string
        score: number
        category: string
    }>
    latestBrief: {
        id: string
        title: string
        weekLabel: string
        startDate: string
        endDate: string
        executiveSummary: string
    } | null
    decisionsInboxOpen: number
    vibecodeCore: {
        lastUpdated: string | null
        principlesPreview: Array<{ id: string; name: string; description: string }>
    }
    projects: {
        activeCount: number
        completedCount: number
        recent: Array<{ id: string; name: string; status: string }>
    }
    note: {
        week_label: string
        content: string
        pinned: boolean
    }
    tasks: Array<{
        id: string
        assignee_name: string
        title: string
        details: string | null
        status: 'todo' | 'doing' | 'done'
        due_date: string | null
    }>
    weekLabel: string
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [noteContent, setNoteContent] = useState('')
    const [noteSaving, setNoteSaving] = useState(false)
    const isNotesDirty = useRef(false) // Added isNotesDirty ref
    const [newTask, setNewTask] = useState({ assignee_name: '', title: '', due_date: '' })
    const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all')
    const [runningAction, setRunningAction] = useState<string | null>(null)
    const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false)
    const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null)

    useEffect(() => {
        fetchDashboard()
    }, [])

    // Polling for running scan
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (data?.latestScan?.status === 'running') {
            console.log('[Dashboard] Scan running, starting poll...')
            interval = setInterval(() => {
                fetchDashboard()
            }, 5000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [data?.latestScan?.status])

    const fetchDashboard = async () => {
        setLoading(true)
        console.log('[Dashboard] Fetching summary...')
        try {
            const response = await fetch(`/api/dashboard/summary?t=${Date.now()}`)
            const result = await response.json()
            console.log('[Dashboard] Summary result:', result)
            setData(result)
            // Only set note content on initial load to avoid overwriting user typing during background refreshes
            if (loading || !isNotesDirty.current) {
                setNoteContent(result.note?.content || '')
            }
        } catch (error) {
            console.error('[Dashboard] Error fetching dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    // Debounced note save
    const saveNote = useCallback(async (content: string) => {
        if (!data) return
        setNoteSaving(true)
        console.log('[Dashboard] Saving note...', { week: data.weekLabel, length: content.length })
        try {
            const res = await fetch('/api/dashboard/note', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ week_label: data.weekLabel, content })
            })
            const result = await res.json()
            console.log('[Dashboard] Note save result:', result)

            // Update local state to match saved content to avoid re-saving the same data
            if (result.success && result.note) {
                isNotesDirty.current = false // reset dirty flag on success
                setData(prev => prev ? {
                    ...prev,
                    note: {
                        ...prev.note,
                        content: result.note.content
                    }
                } : null)
            }
        } catch (error) {
            console.error('[Dashboard] Error saving note:', error)
        } finally {
            setNoteSaving(false)
        }
    }, [data])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isNotesDirty.current && noteContent !== data?.note?.content) {
                saveNote(noteContent)
            }
        }, 1200) // Slightly longer debounce for safer autosave
        return () => clearTimeout(timer)
    }, [noteContent, data?.note?.content, saveNote])

    const addTask = async () => {
        if (!newTask.assignee_name || !newTask.title) return
        console.log('[Dashboard] Adding task...', newTask)
        try {
            const res = await fetch('/api/dashboard/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignee_name: newTask.assignee_name,
                    title: newTask.title,
                    due_date: newTask.due_date || null
                })
            })
            const result = await res.json()
            console.log('[Dashboard] Add task result:', result)

            if (result.success && result.task) {
                // Optimistic UI update with real data
                setData(prev => prev ? {
                    ...prev,
                    tasks: [result.task, ...(prev.tasks || [])]
                } : null)
            }

            setNewTask({ assignee_name: '', title: '', due_date: '' })
            // Optional: call fetchDashboard() as fallback but we have optimistic update now
        } catch (error) {
            console.error('[Dashboard] Error adding task:', error)
        }
    }

    const updateTaskStatus = async (taskId: string, status: string) => {
        try {
            await fetch('/api/dashboard/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status })
            })
            fetchDashboard()
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    const deleteTask = async (id: string) => {
        setTaskToDeleteId(id)
        setShowDeleteTaskModal(true)
    }

    const confirmDeleteTask = async () => {
        if (!taskToDeleteId) return
        try {
            await fetch(`/api/dashboard/tasks?id=${taskToDeleteId}`, {
                method: 'DELETE'
            })
            // Optimistic update
            setData(prev => prev ? {
                ...prev,
                tasks: (prev.tasks || []).filter(t => t.id !== taskToDeleteId)
            } : null)
        } catch (error) {
            console.error('Error deleting task:', error)
        } finally {
            setShowDeleteTaskModal(false)
            setTaskToDeleteId(null)
        }
    }

    const handleQuickDecision = async (articleId: string, action: string) => {
        if (!data?.latestScan?.id) return
        try {
            await fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    article_id: articleId,
                    scan_id: data.latestScan.id,
                    action_required: action,
                    impact_horizon: 'mid',
                    confidence: 3
                })
            })
            fetchDashboard()
        } catch (error) {
            console.error('Error making decision:', error)
        }
    }

    const handleRunScan = async () => {
        setRunningAction('scan')
        console.log('[Dashboard] Triggering scan run...')
        try {
            const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daysBack: 7 })
            })
            const result = await res.json()
            console.log('[Dashboard] Scan run result:', result)
            if (result.success) {
                alert(`Scan complete! ${result.itemsNew} new, ${result.itemsAnalyzed} analyzed.`)
                fetchDashboard()
            } else {
                alert(`Error: ${result.error}`)
            }
        } catch (error) {
            console.error('[Dashboard] Scan run error:', error)
        } finally {
            setRunningAction(null)
        }
    }

    const filteredTasks = data?.tasks?.filter(t =>
        taskFilter === 'all' || t.status === taskFilter
    ) || []

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navigation />
                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900 mb-4"></div>
                            <p className="text-sm text-gray-600">Loading dashboard...</p>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Week {data?.weekLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                </div>

                {/* TOP ROW: 3 Primary Blocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Research Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-white" />
                                <h2 className="text-sm font-bold text-white">Research</h2>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Scan Status */}
                            {data?.latestScan ? (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Last scan</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${data.latestScan.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {data.latestScan.status}
                                        </span>
                                        <span className="text-gray-700 font-medium">
                                            {format(new Date(data.latestScan.startedAt), 'MMM d')}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">No scans yet</div>
                            )}

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {data?.unreviewedCount || 0} to review
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    <CheckSquare className="w-3 h-3 mr-1" />
                                    {data?.decisionsInboxOpen || 0} open decisions
                                </span>
                            </div>

                            {/* CTAs */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleRunScan}
                                    disabled={runningAction === 'scan'}
                                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2"
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
                                    href="/weekly-briefs"
                                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Generate Synthesis
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Vibecode Core Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-purple-700">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-white" />
                                <h2 className="text-sm font-bold text-white">Vibecode Core</h2>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {data?.vibecodeCore?.lastUpdated && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Last updated</span>
                                    <span className="text-gray-700 font-medium">
                                        {format(new Date(data.vibecodeCore.lastUpdated), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            )}

                            {/* Principles Preview */}
                            {(data?.vibecodeCore?.principlesPreview?.length ?? 0) > 0 && (
                                <div className="space-y-2">
                                    {data?.vibecodeCore?.principlesPreview?.map(p => (
                                        <div key={p.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <p className="text-sm font-medium text-purple-900">{p.name}</p>
                                            <p className="text-xs text-purple-700 mt-1 line-clamp-2">{p.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                href="/vibecode-core"
                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                            >
                                Open Vibecode Core
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Projects Block */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-emerald-700">
                            <div className="flex items-center gap-2">
                                <Folder className="w-5 h-5 text-white" />
                                <h2 className="text-sm font-bold text-white">Projects</h2>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-900">{data?.projects?.activeCount || 0}</p>
                                    <p className="text-xs text-gray-500">Active</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{data?.projects?.completedCount || 0}</p>
                                    <p className="text-xs text-gray-500">Completed</p>
                                </div>
                            </div>

                            {/* Recent Projects */}
                            {(data?.projects?.recent?.length ?? 0) > 0 && (
                                <div className="space-y-2">
                                    {data?.projects?.recent?.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                            <span className="text-sm text-gray-700 truncate">{p.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'Done' ? 'bg-green-100 text-green-700' :
                                                p.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                href="/projects"
                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                Open Projects
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* MIDDLE ROW: This Week + Actionables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* This Week Brief */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-700" />
                                <h2 className="text-sm font-semibold text-gray-900">This Week&apos;s Brief</h2>
                            </div>
                        </div>
                        <div className="p-5">
                            {data?.latestBrief ? (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">{data.latestBrief.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {data.latestBrief.weekLabel} · {format(new Date(data.latestBrief.startDate), 'MMM d')} - {format(new Date(data.latestBrief.endDate), 'MMM d')}
                                        </p>
                                    </div>
                                    {data.latestBrief.executiveSummary && (
                                        <p className="text-sm text-gray-600 line-clamp-4">
                                            {data.latestBrief.executiveSummary}
                                        </p>
                                    )}
                                    <Link
                                        href="/weekly-briefs"
                                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:underline"
                                    >
                                        Open Weekly Brief
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500 mb-4">No brief generated yet</p>
                                    <Link
                                        href="/weekly-briefs"
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Generate from Latest Scan
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actionables: Unreviewed Articles */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-orange-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                    <h2 className="text-sm font-semibold text-gray-900">Unreviewed Articles</h2>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                    {data?.unreviewedCount || 0}
                                </span>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {(data?.unreviewedTop?.length ?? 0) > 0 ? (
                                data?.unreviewedTop?.map(article => (
                                    <div key={article.id} className="group p-4 hover:bg-slate-50 transition-all">
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block mb-2 hover:opacity-80 transition-opacity"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-slate-800 transition-colors">{article.title}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                        <span className="font-bold uppercase tracking-widest text-[10px]">{article.source}</span>
                                                        <span>·</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">{article.category}</span>
                                                    </div>
                                                </div>
                                                <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-black ${article.score >= 70 ? 'bg-green-100 text-green-700' :
                                                    article.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {article.score}
                                                </span>
                                            </div>
                                        </a>
                                        {/* Quick Decision Buttons */}
                                        <div className="flex flex-wrap gap-1">
                                            {['ignore', 'monitor', 'experiment', 'integrate'].map(action => (
                                                <button
                                                    key={action}
                                                    onClick={() => handleQuickDecision(article.id, action)}
                                                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${action === 'ignore' ? 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600' :
                                                        action === 'monitor' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                                                            action === 'experiment' ? 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100' :
                                                                'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {action}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <CheckSquare className="w-10 h-10 text-green-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">All articles reviewed!</p>
                                </div>
                            )}
                        </div>
                        {(data?.unreviewedCount ?? 0) > 5 && (
                            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                <Link
                                    href="/decisions-inbox"
                                    className="text-sm font-medium text-slate-900 hover:underline flex items-center gap-1"
                                >
                                    View all {data?.unreviewedCount} articles
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* BOTTOM ROW: Notes + Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Notes */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-700" />
                                    <h2 className="text-sm font-semibold text-gray-900">Weekly Notes</h2>
                                    <span className="text-xs text-gray-500">{data?.weekLabel}</span>
                                </div>
                                {noteSaving && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Save className="w-3 h-3 animate-pulse" />
                                        Saving...
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={noteContent}
                                onChange={(e) => {
                                    setNoteContent(e.target.value)
                                    isNotesDirty.current = true
                                }}
                                placeholder="Write your weekly notes here... (auto-saves)"
                                rows={8}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none font-mono"
                            />
                        </div>
                    </div>

                    {/* Team Tasks */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-slate-700" />
                                    <h2 className="text-sm font-semibold text-gray-900">Team Tasks</h2>
                                </div>
                                <div className="flex gap-1">
                                    {['all', 'todo', 'doing', 'done'].map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setTaskFilter(f as any)}
                                            className={`px-2 py-1 text-xs font-medium rounded transition-all ${taskFilter === f
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Add Task Form */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTask.assignee_name}
                                    onChange={(e) => setNewTask({ ...newTask, assignee_name: e.target.value })}
                                    placeholder="Assignee"
                                    className="w-24 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Task title..."
                                    className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                <input
                                    type="date"
                                    value={newTask.due_date}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                    className="w-32 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                />
                                <button
                                    onClick={addTask}
                                    disabled={!newTask.assignee_name || !newTask.title}
                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium disabled:bg-gray-300 hover:bg-slate-800 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(task => (
                                    <div key={task.id} className="p-4 hover:bg-slate-50 transition-all">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        <User className="w-3 h-3" />
                                                        {task.assignee_name}
                                                    </span>
                                                    {task.due_date && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(task.due_date), 'MMM d')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {task.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                    className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                                                        task.status === 'doing' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    <option value="todo">todo</option>
                                                    <option value="doing">doing</option>
                                                    <option value="done">done</option>
                                                </select>
                                                <button
                                                    onClick={() => deleteTask(task.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No tasks yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <ConfirmModal
                isOpen={showDeleteTaskModal}
                title="Delete Task?"
                message="Are you sure you want to remove this task from the list?"
                confirmText="Delete"
                onConfirm={confirmDeleteTask}
                onCancel={() => {
                    setShowDeleteTaskModal(false)
                    setTaskToDeleteId(null)
                }}
            />
        </div>
    )
}
