'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Wrench, GitBranch, Shield, Lightbulb } from 'lucide-react'

interface VibecodeLayoutProps {
  children: ReactNode
}

const sections = [
  { id: 'philosophy', label: 'Philosophy', icon: Lightbulb, href: '/vibecode-core' },
  { id: 'principles', label: 'Principles', icon: BookOpen, href: '/vibecode-core/principles' },
  { id: 'tools', label: 'Tech Radar', icon: Wrench, href: '/vibecode-core/tools' },
  { id: 'flows', label: 'Playbooks', icon: GitBranch, href: '/vibecode-core/flows' },
  { id: 'boundaries', label: 'Boundaries', icon: Shield, href: '/vibecode-core/boundaries' },
]

export default function VibecodeLayout({ children }: VibecodeLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="sticky top-0 h-screen flex flex-col">
          {/* Header */}
          <div className="px-6 py-8 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Vibecode</h1>
                <p className="text-xs text-gray-500">Knowledge Core</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = pathname === section.href
              
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-slate-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200">
            <Link
              href="/"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
