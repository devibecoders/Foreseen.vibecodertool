/**
 * Supabase Data Hooks for Vite App
 *
 * Custom React hooks for fetching/mutating data from Supabase.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// =====================================================
// Types
// =====================================================

export interface WeeklyBrief {
    id: string
    user_id: string
    run_id: string
    week_label: string
    start_date: string
    end_date: string
    title: string
    executive_summary: string
    macro_trends: any[]
    implications_vibecoding: any[]
    client_opportunities: any[]
    ignore_list: any[]
    reading_list: any[]
    full_markdown: string
    created_at: string
}

export interface Article {
    id: string
    user_id: string
    title: string
    url: string
    source: string
    published_at: string
    raw_content: string | null
    created_at: string
    analyses?: Analysis[]
}

export interface Analysis {
    id: string
    article_id: string
    summary: string
    categories: string
    impact_score: number
    relevance_reason: string
    customer_angle: string
    vibecoders_angle: string
    key_takeaways: string
    created_at: string
}

export interface Scan {
    id: string
    user_id: string
    started_at: string
    completed_at: string | null
    items_fetched: number
    items_analyzed: number
    status: 'running' | 'completed' | 'failed'
    error_message: string | null
}

export interface DecisionAssessment {
    id: string
    user_id: string
    article_id: string | null
    analysis_id: string | null
    action_required: 'ignore' | 'monitor' | 'experiment' | 'integrate'
    impact_horizon: 'direct' | 'mid' | 'long'
    risk_if_ignored: string | null
    advantage_if_early: string | null
    confidence: number
    is_override: boolean
    destination: string | null
    destination_id: string | null
    created_at: string
}

export interface VibecodeCore {
    id: string
    user_id: string
    title: string
    philosophy: string | null
    principles: any[]
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface VibecodeTool {
    id: string
    core_id: string
    name: string
    category: string
    status: 'adopt' | 'trial' | 'assess' | 'hold' | 'deprecate'
    when_to_use: string
    when_not_to_use: string
    tradeoffs: string
}

export interface VibecodeBoundary {
    id: string
    core_id: string
    title: string
    severity: 'hard' | 'soft'
    rationale: string
    alternative_approach: string
}

// =====================================================
// Weekly Briefs Hook
// =====================================================

export function useWeeklyBriefs() {
    const [briefs, setBriefs] = useState<WeeklyBrief[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBriefs = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('weekly_briefs')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setBriefs(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch briefs')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBriefs()
    }, [fetchBriefs])

    return { briefs, loading, error, refresh: fetchBriefs }
}

// =====================================================
// Articles Hook
// =====================================================

export function useArticles(limit = 50) {
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchArticles = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('articles')
                .select(`
          *,
          analyses (*)
        `)
                .order('published_at', { ascending: false })
                .limit(limit)

            if (fetchError) throw fetchError
            setArticles(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch articles')
        } finally {
            setLoading(false)
        }
    }, [limit])

    useEffect(() => {
        fetchArticles()
    }, [fetchArticles])

    return { articles, loading, error, refresh: fetchArticles }
}

// =====================================================
// Scans Hook
// =====================================================

export function useScans() {
    const [scans, setScans] = useState<Scan[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchScans = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('scans')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(10)

            if (fetchError) throw fetchError
            setScans(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch scans')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchScans()
    }, [fetchScans])

    return { scans, loading, error, refresh: fetchScans }
}

// =====================================================
// Decision Assessments Hook
// =====================================================

export function useDecisionAssessments() {
    const [decisions, setDecisions] = useState<DecisionAssessment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDecisions = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('decision_assessments')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setDecisions(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch decisions')
        } finally {
            setLoading(false)
        }
    }, [])

    const createDecision = async (decision: Partial<DecisionAssessment>) => {
        const { data, error } = await supabase
            .from('decision_assessments')
            .insert(decision)
            .select()
            .single()

        if (error) throw error
        await fetchDecisions()
        return data
    }

    const updateDecision = async (id: string, updates: Partial<DecisionAssessment>) => {
        const { data, error } = await supabase
            .from('decision_assessments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        await fetchDecisions()
        return data
    }

    useEffect(() => {
        fetchDecisions()
    }, [fetchDecisions])

    return { decisions, loading, error, refresh: fetchDecisions, createDecision, updateDecision }
}

// =====================================================
// Vibecode Core Hook
// =====================================================

export function useVibecodeCore() {
    const [core, setCore] = useState<VibecodeCore | null>(null)
    const [tools, setTools] = useState<VibecodeTool[]>([])
    const [boundaries, setBoundaries] = useState<VibecodeBoundary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCore = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Fetch the active core
            const { data: coreData, error: coreError } = await supabase
                .from('vibecode_core')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single()

            if (coreError && coreError.code !== 'PGRST116') throw coreError

            if (coreData) {
                setCore(coreData)

                // Fetch tools for this core
                const { data: toolsData } = await supabase
                    .from('vibecode_tools')
                    .select('*')
                    .eq('core_id', coreData.id)

                setTools(toolsData || [])

                // Fetch boundaries for this core
                const { data: boundariesData } = await supabase
                    .from('vibecode_boundaries')
                    .select('*')
                    .eq('core_id', coreData.id)

                setBoundaries(boundariesData || [])
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch vibecode core')
        } finally {
            setLoading(false)
        }
    }, [])

    const updatePhilosophy = async (philosophy: string) => {
        if (!core) return
        const { error } = await supabase
            .from('vibecode_core')
            .update({ philosophy })
            .eq('id', core.id)

        if (error) throw error
        await fetchCore()
    }

    useEffect(() => {
        fetchCore()
    }, [fetchCore])

    return { core, tools, boundaries, loading, error, refresh: fetchCore, updatePhilosophy }
}

// =====================================================
// Dashboard Stats Hook
// =====================================================

export function useDashboardStats() {
    const [stats, setStats] = useState({
        totalArticles: 0,
        totalScans: 0,
        totalBriefs: 0,
        pendingDecisions: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            setLoading(true)
            try {
                const [articlesRes, scansRes, briefsRes, decisionsRes] = await Promise.all([
                    supabase.from('articles').select('id', { count: 'exact', head: true }),
                    supabase.from('scans').select('id', { count: 'exact', head: true }),
                    supabase.from('weekly_briefs').select('id', { count: 'exact', head: true }),
                    supabase.from('decision_assessments').select('id', { count: 'exact', head: true }).eq('action_required', 'monitor')
                ])

                setStats({
                    totalArticles: articlesRes.count || 0,
                    totalScans: scansRes.count || 0,
                    totalBriefs: briefsRes.count || 0,
                    pendingDecisions: decisionsRes.count || 0
                })
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    return { stats, loading }
}
