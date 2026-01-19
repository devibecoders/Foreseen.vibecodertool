'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface PersonalizationBadgeProps {
    boostReasons?: string[]
    suppressReasons?: string[]
    personalScore?: number
    compact?: boolean
}

export default function PersonalizationBadge({
    boostReasons = [],
    suppressReasons = [],
    personalScore,
    compact = false
}: PersonalizationBadgeProps) {
    const hasBoost = boostReasons.length > 0
    const hasSuppress = suppressReasons.length > 0

    if (!hasBoost && !hasSuppress) return null

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {hasBoost && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <TrendingUp className="w-3 h-3" />
                    </span>
                )}
                {hasSuppress && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <TrendingDown className="w-3 h-3" />
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {hasBoost && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <TrendingUp className="w-3 h-3" />
                    <span>Boosted: {boostReasons.slice(0, 2).join(', ')}</span>
                </div>
            )}
            {hasSuppress && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    <TrendingDown className="w-3 h-3" />
                    <span>Suppressed: {suppressReasons.slice(0, 2).join(', ')}</span>
                </div>
            )}
            {personalScore !== undefined && personalScore !== 0 && (
                <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${personalScore > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {personalScore > 0 ? '+' : ''}{personalScore.toFixed(1)} personal
                </div>
            )}
        </div>
    )
}
