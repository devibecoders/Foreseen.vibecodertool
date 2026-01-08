/**
 * Navigation
 *
 * Hoofdnavigatiebalk. Wordt bovenaan alle pagina's weergegeven.
 * Bevat een sticky header met blur effect en responsive nav links.
 *
 * Links:
 * - Dashboard (/) - AI nieuws aggregator
 * - Wekelijkse Synthese - Wekelijkse briefings
 * - Vibecode Core - Kennisbank
 * - Beslissingen - Beslissingen inbox
 * - Projecten - Project management
 *
 * @component
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              Foreseen
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/'
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              Dashboard
            </Link>
            <Link
              href="/weekly-briefs"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/weekly-briefs'
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              Wekelijkse Synthese
            </Link>
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
              href="/decisions-inbox"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/decisions-inbox'
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              Beslissingen
            </Link>
            <Link
              href="/projects"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/projects'
                ? 'bg-slate-900 text-white'
                : 'text-gray-700 hover:bg-slate-50'
                }`}
            >
              Projecten
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

