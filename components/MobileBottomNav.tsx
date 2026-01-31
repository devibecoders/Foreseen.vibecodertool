'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Lightbulb, Folder } from 'lucide-react'

export default function MobileBottomNav() {
    const pathname = usePathname()

    const tabs = [
        {
            label: 'Dashboard',
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

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
            <div className="flex items-center justify-around h-16">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.label}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors ${tab.active ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${tab.active ? 'text-slate-900' : 'text-slate-400'}`} />
                            <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
