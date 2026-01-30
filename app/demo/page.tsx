'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Sparkles, Star, Zap, FileText, Shield, TrendingUp,
  Play, ArrowRight, Check, ChevronRight, ExternalLink,
  Linkedin, Mail, Target, Brain, BarChart3, Lightbulb
} from 'lucide-react'

interface DemoTool {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  features: string[]
  demoType: 'interactive' | 'video' | 'coming-soon'
  route?: string
}

const DEMO_TOOLS: DemoTool[] = [
  {
    id: 'must-read',
    name: 'Must-Read Top 10',
    description: 'AI-powered article ranking with personalized scoring. See exactly what you should read and why.',
    icon: Star,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    features: [
      'Personalized relevance scoring',
      '"What should I do?" recommendations',
      'Explainable AI rankings',
      'Action-based grouping'
    ],
    demoType: 'interactive',
    route: '/must-read'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Generator',
    description: 'Turn weekly trends into engaging LinkedIn posts. 3 variants per week, tailored to your voice.',
    icon: Linkedin,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      'Insight, question, and story formats',
      'Engagement score prediction',
      'Hashtag suggestions',
      'Source attribution'
    ],
    demoType: 'interactive',
    route: '/linkedin'
  },
  {
    id: 'briefing',
    name: 'Briefing Analyzer',
    description: 'Drop a project briefing, get structured insights. Pain points, must-haves, and questions extracted instantly.',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: [
      'Pain point extraction',
      'Must-have vs nice-to-have',
      'Clarification questions',
      'Assumption detection'
    ],
    demoType: 'interactive',
    route: '/briefing'
  },
  {
    id: 'risk-board',
    name: 'Project Risk Board',
    description: 'Monitor project health at a glance. Automatic risk scoring based on status, documentation, and timeline.',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    features: [
      'Automatic risk assessment',
      'Stale project detection',
      'Portfolio health overview',
      'Priority recommendations'
    ],
    demoType: 'interactive',
    route: '/projects/risk'
  },
  {
    id: 'signals',
    name: 'Signals Cockpit',
    description: 'See exactly how the algorithm learns from you. Full transparency into personalization weights.',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      'Weight visualization',
      'Mute/reset controls',
      'Decay tracking',
      'Health metrics'
    ],
    demoType: 'interactive',
    route: '/research/signals'
  },
  {
    id: 'lead-discovery',
    name: 'Lead Discovery Engine',
    description: 'Find companies with digital improvement potential. Smart prospecting without the spam.',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: [
      'Website quality analysis',
      'Business fit scoring',
      'Personalized outreach drafts',
      'You control the send'
    ],
    demoType: 'coming-soon'
  },
  {
    id: 'strategy-sim',
    name: 'Strategy Simulator',
    description: 'Ask "what if?" questions about your focus areas. Simulate knowledge growth and opportunity cost.',
    icon: Lightbulb,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    features: [
      'Focus area simulation',
      'Trend projection',
      'Opportunity cost analysis',
      'Knowledge gap detection'
    ],
    demoType: 'coming-soon'
  },
]

export default function DemoPage() {
  const [selectedTool, setSelectedTool] = useState<DemoTool | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 
                        text-blue-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Interactive Demos
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            See Foreseen in Action
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Explore our AI-powered tools before you sign up. 
            Each demo shows real functionality — no smoke and mirrors.
          </p>
        </div>

        {/* Tool Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_TOOLS.map(tool => {
            const Icon = tool.icon
            const isComingSoon = tool.demoType === 'coming-soon'
            
            return (
              <div
                key={tool.id}
                className={`relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 
                          overflow-hidden transition-all duration-300 ${
                            isComingSoon 
                              ? 'opacity-60' 
                              : 'hover:bg-white/10 hover:border-white/20 cursor-pointer'
                          }`}
                onClick={() => !isComingSoon && setSelectedTool(tool)}
              >
                {/* Coming Soon Badge */}
                {isComingSoon && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-slate-700 rounded-full 
                                text-xs font-medium text-slate-300">
                    Coming Soon
                  </div>
                )}

                <div className="p-6">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${tool.color}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-2">{tool.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{tool.description}</p>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {tool.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {!isComingSoon && (
                    <button className="flex items-center gap-2 text-blue-400 font-medium text-sm 
                                     hover:text-blue-300 transition-colors">
                      Try Demo
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium 
                       hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-white/10 text-white rounded-xl font-medium 
                       hover:bg-white/20 transition-colors"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            14-day free trial • No credit card required
          </p>
        </div>
      </div>

      {/* Demo Modal */}
      {selectedTool && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTool(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 ${selectedTool.bgColor}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center">
                  <selectedTool.icon className={`w-6 h-6 ${selectedTool.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedTool.name}</h2>
                  <p className="text-slate-600 text-sm">{selectedTool.description}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Features</h3>
              <ul className="space-y-3 mb-6">
                {selectedTool.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Demo Preview */}
              <div className="bg-slate-100 rounded-xl p-8 text-center mb-6">
                <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">
                  Click below to try the live demo
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href={selectedTool.route || '/'}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-medium 
                           hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  Open Live Demo
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="px-6 py-3 border border-slate-200 rounded-xl font-medium 
                           hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
