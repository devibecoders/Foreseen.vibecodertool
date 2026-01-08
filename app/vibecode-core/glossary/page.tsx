'use client'

import { useState, useEffect } from 'react'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { BookText, Search, Info, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface GlossaryTerm {
    id: string
    term: string
    definition: string
    technical_context: string | null
    related_guide_id: string | null
}

export default function GlossaryPage() {
    const [terms, setTerms] = useState<GlossaryTerm[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

    useEffect(() => {
        fetchTerms()
    }, [])

    const fetchTerms = async () => {
        try {
            const response = await fetch('/api/vibecode/glossary')
            const data = await response.json()
            setTerms(data.terms || [])
        } catch (error) {
            console.error('Error fetching glossary:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter terms based on search
    const filteredTerms = terms.filter(
        (term) =>
            term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
            term.definition.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group terms alphabetically
    const groupedTerms = filteredTerms.reduce((acc, term) => {
        const letter = term.term[0].toUpperCase()
        if (!acc[letter]) acc[letter] = []
        acc[letter].push(term)
        return acc
    }, {} as Record<string, GlossaryTerm[]>)

    const sortedLetters = Object.keys(groupedTerms).sort()

    return (
        <VibecodeLayoutNotion>
            <div className="px-8 lg:px-16 py-12">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <BookText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold font-serif text-gray-900">Woordenlijst</h1>
                            <p className="text-gray-500 mt-1">Termen en definities</p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
                        Een naslagwerk voor technische termen die in onze stack worden gebruikt.
                        Klik op een term om extra technische context te zien.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Zoek op 'API', 'RLS', 'Webhook'..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
                    </div>
                ) : filteredTerms.length === 0 ? (
                    <div className="text-center py-24">
                        <BookText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'Geen overeenkomende termen' : 'Nog geen woordenlijst termen'}
                        </h3>
                        <p className="text-gray-500">
                            {searchQuery
                                ? `Geen termen gevonden voor "${searchQuery}". Probeer een andere zoekopdracht.`
                                : 'Woordenlijst termen verschijnen hier zodra de database is gevuld.'}
                        </p>
                    </div>
                ) : (
                    /* Glossary List */
                    <div className="space-y-8">
                        {sortedLetters.map((letter) => (
                            <div key={letter}>
                                {/* Letter Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="w-10 h-10 rounded-lg bg-slate-100 text-slate-900 font-bold flex items-center justify-center text-lg">
                                        {letter}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>

                                {/* Terms */}
                                <div className="space-y-3 pl-2">
                                    {groupedTerms[letter].map((term) => (
                                        <div
                                            key={term.id}
                                            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
                                        >
                                            {/* Term Header */}
                                            <button
                                                onClick={() =>
                                                    setExpandedTerm(expandedTerm === term.id ? null : term.id)
                                                }
                                                className="w-full px-5 py-4 text-left flex items-start gap-4"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900 mb-1">{term.term}</h3>
                                                    <p className="text-gray-600 text-sm leading-relaxed">
                                                        {term.definition}
                                                    </p>
                                                </div>
                                                {term.technical_context && (
                                                    <Info
                                                        className={`w-5 h-5 flex-shrink-0 transition-colors ${expandedTerm === term.id
                                                            ? 'text-slate-900'
                                                            : 'text-gray-400'
                                                            }`}
                                                    />
                                                )}
                                            </button>

                                            {/* Expanded Context */}
                                            {expandedTerm === term.id && term.technical_context && (
                                                <div className="px-5 pb-4">
                                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                                        <p className="text-sm text-slate-700 leading-relaxed">
                                                            <span className="font-medium text-slate-900">
                                                                Technische Context:{' '}
                                                            </span>
                                                            {term.technical_context}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Links */}
                {!loading && filteredTerms.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-sm text-gray-500 mb-4">
                            Wil je meer weten? Bekijk onze gidsen:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/vibecode-core/stack"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                                De Stack
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                            <Link
                                href="/vibecode-core/prompting"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                            >
                                Prompt Technieken
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </VibecodeLayoutNotion>
    )
}
