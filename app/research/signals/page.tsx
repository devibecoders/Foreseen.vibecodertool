'use client'

import Navigation from '@/components/Navigation'
import SignalsCockpit from '@/components/SignalsCockpit'

export default function SignalsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <SignalsCockpit />
      </main>
    </div>
  )
}
