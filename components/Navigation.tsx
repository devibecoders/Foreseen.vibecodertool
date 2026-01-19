/**
 * Navigation
 *
 * Hoofdnavigatiebalk met Dashboard home + Research dropdown menu.
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useCallback } from 'react'
import { ChevronDown, BarChart3, FileText, CheckSquare, Home, Sparkles } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const [showResearchMenu, setShowResearchMenu] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setShowResearchMenu(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowResearchMenu(false)
    }, 300) // 300ms delay before closing
  }, [])

  const isDashboardActive = pathname === '/' || pathname === '/dashboard'
  const isResearchActive = pathname?.startsWith('/research') ||
    pathname === '/weekly-briefs' ||
    pathname?.startsWith('/decisions')

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              Foreseen
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {/* Dashboard - Home */}
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isDashboardActive
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>

            {/* Research Hub with dropdown */}
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href="/research"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${isResearchActive
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-700 hover:bg-slate-50'
                  }`}
              >
                Research
                <ChevronDown className={`w-3 h-3 transition-transform ${showResearchMenu ? 'rotate-180' : ''}`} />
              </Link>

              {/* Dropdown Menu */}
              {showResearchMenu && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <Link
                    href="/research"
                    className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 ${pathname === '/research' ? 'text-slate-900 font-medium' : 'text-gray-700'
                      }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Research Hub
                  </Link>
                  <Link
                    href="/scans"
                    className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 ${pathname === '/scans' ? 'text-slate-900 font-medium' : 'text-gray-700'
                      }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Weekly Scan
                  </Link>
                  <Link
                    href="/weekly-briefs"
                    className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 ${pathname === '/weekly-briefs' ? 'text-slate-900 font-medium' : 'text-gray-700'
                      }`}
                  >
                    <FileText className="w-4 h-4" />
                    Weekly Synthesis
                  </Link>
                  <Link
                    href="/decisions-inbox"
                    className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 ${pathname?.startsWith('/decisions') ? 'text-slate-900 font-medium' : 'text-gray-700'
                      }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    Decisions
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/vibecode-core"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname?.startsWith('/vibecode-core')
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              Vibecode Core
            </Link>
            <Link
              href="/projects"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/projects'
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              Projects
            </Link>
          </nav>

          <div className="text-xs text-gray-500 font-medium">
            Vibecoders
          </div>
        </div>
      </div>
    </nav>
  )
}
