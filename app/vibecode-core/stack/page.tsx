'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import {
  Layers, Database, Brain, Palette, FileText, ArrowRight, Sparkles,
  CheckSquare, Wrench, Code, Building, GraduationCap
} from 'lucide-react'

interface StackGuide {
  id: string
  tool_name: string
  icon: string
  slug: string
  category: string
  summary: string
  sort_order: number
}

const ICON_MAP: Record<string, any> = {
  Brain: Brain,
  Database: Database,
  Palette: Palette,
  Layers: Layers,
  FileText: FileText,
  Sparkles: Sparkles,
  CheckSquare: CheckSquare,
  Wrench: Wrench,
  Code: Code,
  Building: Building,
  GraduationCap: GraduationCap,
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: 'bg-purple-100 text-purple-700',
  Backend: 'bg-green-100 text-green-700',
  Frontend: 'bg-blue-100 text-blue-700',
  Workflow: 'bg-orange-100 text-orange-700',
  Skill: 'bg-pink-100 text-pink-700',
}

export default function StackPage() {
  const [guides, setGuides] = useState<StackGuide[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuides()
  }, [])

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/vibecode/stack-guides')
      const data = await response.json()
      setGuides(data.guides || [])
    } catch (error) {
      console.error('Error fetching guides:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <VibecodeLayoutNotion>
      <div className="px-8 lg:px-16 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif text-gray-900">De Stack</h1>
              <p className="text-gray-500 mt-1">Onze tools en hoe ze te gebruiken</p>
            </div>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
            Dit zijn de kerntools in het Vibecode ecosysteem. Elke gids bevat gedetailleerde documentatie en
            <span className="font-medium text-gray-900"> Gouden Regels</span> — de absolute must-dos voor elke tool.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-24">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guides yet</h3>
            <p className="text-gray-500">Stack guides will appear here once the database is seeded.</p>
          </div>
        ) : (
          /* Stack Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide) => {
              const IconComponent = ICON_MAP[guide.icon] || Layers
              const categoryStyle = CATEGORY_COLORS[guide.category] || 'bg-gray-100 text-gray-700'

              return (
                <Link
                  key={guide.id}
                  href={`/vibecode-core/stack/${guide.slug}`}
                  className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-slate-400 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IconComponent className="w-7 h-7 text-slate-700" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle}`}>
                          {guide.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-slate-700 transition-colors truncate">
                        {guide.tool_name}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {guide.summary}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </VibecodeLayoutNotion>
  )
}
