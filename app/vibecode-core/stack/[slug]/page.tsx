/**
 * Guide Detail Page
 *
 * Displays a single stack guide with full content and golden rules.
 * Uses a two-column layout on desktop: content on left, sticky rules on right.
 *
 * @route /vibecode-core/stack/[slug]
 * @param slug - The URL slug of the guide to display
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { renderMarkdown } from '@/lib/markdown'
import { ArrowLeft, CheckCircle2, Layers, Loader2 } from 'lucide-react'

interface StackGuide {
    id: string
    tool_name: string
    icon: string
    slug: string
    category: string
    summary: string
    content: string
    golden_rules: string[]
    created_at: string
}

export default function GuideDetailPage() {
    const params = useParams()
    const slug = params.slug as string
    const [guide, setGuide] = useState<StackGuide | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchGuide = useCallback(async () => {
        try {
            const response = await fetch(`/api/vibecode/stack-guides/${slug}`)
            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Guide not found')
                return
            }

            setGuide(data.guide)
        } catch (err) {
            console.error('Error fetching guide:', err)
            setError('Failed to load guide')
        } finally {
            setLoading(false)
        }
    }, [slug])

    useEffect(() => {
        if (slug) {
            fetchGuide()
        }
    }, [slug, fetchGuide])

    // Parse golden_rules - handle both JSON string array and object array
    const parseGoldenRules = (rules: any): string[] => {
        if (!rules) return []
        if (Array.isArray(rules)) {
            return rules.map((rule) => {
                if (typeof rule === 'string') return rule
                if (typeof rule === 'object' && rule.rule) return rule.rule
                if (typeof rule === 'object' && rule.title) return `${rule.title}: ${rule.rule || ''}`
                return String(rule)
            })
        }
        return []
    }

    return (
        <VibecodeLayoutNotion>
            <div className="px-8 lg:px-16 py-12">
                {/* Back Link */}
                <Link
                    href="/vibecode-core/stack"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Terug naar De Stack
                </Link>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Gids niet gevonden</h3>
                        <p className="text-gray-500">{error}</p>
                        <Link
                            href="/vibecode-core/stack"
                            className="inline-block mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                        >
                            View all guides
                        </Link>
                    </div>
                ) : guide ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Column */}
                        <div className="lg:col-span-2">
                            {/* Title */}
                            <h1 className="text-3xl font-bold font-serif text-gray-900 mb-4">
                                {guide.tool_name}
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                {guide.summary}
                            </p>

                            {/* Markdown Content */}
                            <div
                                className="prose prose-slate lg:prose-lg max-w-none
                  prose-headings:font-serif prose-headings:font-bold prose-headings:text-slate-900
                  prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-10
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-slate-700 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-slate-900 prose-strong:font-semibold
                  prose-ul:my-4 prose-li:my-1 prose-li:text-slate-700
                  prose-code:text-sm prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-lg prose-pre:shadow-lg prose-pre:overflow-x-auto
                  [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0
                  prose-hr:border-gray-200 prose-hr:my-8"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.content || '') }}
                            />
                        </div>

                        {/* Sidebar - Golden Rules */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Golden Rules</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        The absolute must-dos for this tool.
                                    </p>
                                    <ul className="space-y-3">
                                        {parseGoldenRules(guide.golden_rules).map((rule, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm text-gray-700 leading-relaxed">
                                                    {rule}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </VibecodeLayoutNotion>
    )
}
