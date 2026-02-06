'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Lightbulb, Folder, MoreHorizontal, Target, Star, Linkedin, X, FileText, CheckSquare } from 'lucide-react'

export default function MobileBottomNav() {
    const pathname = usePathname()
    const [showMore, setShowMore] = useState(false)

    const isMoreActive = pathname === '/leads' || pathname === '/must-read' || pathname === '/linkedin'

    const tabs = [
        {
            label: 'Home',
            icon: Home,
            href: '/dashboard',
            active: pathname === '/' || pathname === '/dashboard'
        },
        {
            label: 'Research',
            icon: BarChart3,
            href: '/research',
            active: pathname?.startsWith('/research') || pathname?.startsWith('/weekly-briefs') || pathname?.startsWith('/decisions')
        },
        {
            label: 'Vibecode',
            icon: Lightbulb,
            href: '/vibecode-core',
            active: pathname?.startsWith('/vibecode-core')
        },
        {
            label: 'Projects',
            icon: Folder,
            href: '/projects',
            active: pathname?.startsWith('/projects')
        }
    ]

    const moreItems = [
        {
            label: 'Leads',
            icon: Target,
            href: '/leads',
            active: pathname?.startsWith('/leads'),
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            label: 'Must-Read Top 10',
            icon: Star,
            href: '/must-read',
            active: pathname === '/must-read',
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            label: 'LinkedIn Generator',
            icon: Linkedin,
            href: '/linkedin',
            active: pathname === '/linkedin',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Weekly Synthesis',
            icon: FileText,
            href: '/weekly-briefs',
            active: pathname === '/weekly-briefs',
            color: 'text-slate-700',
            bg: 'bg-slate-50'
        },
        {
            label: 'Decisions',
            icon: CheckSquare,
            href: '/decisions-inbox',
            active: pathname?.startsWith('/decisions'),
            color: 'text-slate-700',
            bg: 'bg-slate-50'
        }
    ]

    return (
        <>
            {/* More Menu Overlay */}
            {showMore && (
                <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={() => setShowMore(false)}
                />
            )}

            {/* More Menu Sheet */}
            {showMore && (
                <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-4 pb-2 md:hidden animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-900">More</h3>
                        <button 
                            onClick={() => setShowMore(false)}
                            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                        >
                            <X className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {moreItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setShowMore(false)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all active:scale-95 ${
                                        item.active ? item.bg + ' ring-2 ring-slate-900' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                                        <Icon className={`w-5 h-5 ${item.color}`} />
                                    </div>
                                    <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">{item.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
                <div className="flex items-center justify-around h-16">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <Link
                                key={tab.label}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors ${
                                    tab.active ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
                                }`}
                            >
                                <Icon className={`w-6 h-6 ${tab.active ? 'text-slate-900' : 'text-slate-400'}`} />
                                <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
                            </Link>
                        )
                    })}
                    {/* More Button */}
                    <button
                        onClick={() => setShowMore(!showMore)}
                        className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors ${
                            showMore || isMoreActive ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
                        }`}
                    >
                        <MoreHorizontal className={`w-6 h-6 ${showMore || isMoreActive ? 'text-slate-900' : 'text-slate-400'}`} />
                        <span className="text-[10px] uppercase tracking-widest">More</span>
                    </button>
                </div>
            </nav>
        </>
    )
}
