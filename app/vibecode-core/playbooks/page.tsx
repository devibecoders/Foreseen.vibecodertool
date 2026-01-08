'use client'

import { useState, useEffect } from 'react'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { Plus, X, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

interface Playbook {
  id: string
  core_id: string
  title: string
  description: string
  steps: Array<{
    step_name: string
    tool: string
    goal: string
    anti_pattern: string
  }>
}

interface VibecodeCore {
  id: string
}

export default function PlaybooksPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const coreResponse = await fetch('/api/vibecode/core')
      const coreData = await coreResponse.json()
      
      if (coreData.core) {
        setCore(coreData.core)
        // TODO: Fetch from API when ready
        setPlaybooks([
          {
            id: '1',
            core_id: coreData.core.id,
            title: 'Rapid MVP',
            description: 'Ship a working prototype in 2 weeks',
            steps: [
              { step_name: 'Define Core Value', tool: 'User Story', goal: 'Identify single most important feature', anti_pattern: 'Building everything at once' },
              { step_name: 'Choose Stack', tool: 'Tech Radar', goal: 'Pick proven, fast technologies', anti_pattern: 'Experimenting with new tech' },
              { step_name: 'Build Skeleton', tool: 'Next.js + Supabase', goal: 'Get basic CRUD working', anti_pattern: 'Perfect architecture' },
              { step_name: 'Deploy Early', tool: 'Vercel', goal: 'Get URL in front of users', anti_pattern: 'Waiting for polish' },
            ]
          },
          {
            id: '2',
            core_id: coreData.core.id,
            title: 'Tech Evaluation',
            description: 'Assess new technology before adoption',
            steps: [
              { step_name: 'Check Boundaries', tool: 'Boundaries List', goal: 'Ensure no hard conflicts', anti_pattern: 'Skipping this step' },
              { step_name: 'Build Spike', tool: 'Isolated Repo', goal: 'Test in isolation', anti_pattern: 'Integrating immediately' },
              { step_name: 'Document Tradeoffs', tool: 'Tech Radar', goal: 'List pros and cons', anti_pattern: 'Only seeing benefits' },
              { step_name: 'Team Review', tool: 'Meeting', goal: 'Get consensus', anti_pattern: 'Solo decision' },
            ]
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <VibecodeLayoutNotion>
      <div className="px-12 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        ) : !core ? (
          <div className="text-center py-24">
            <p className="text-gray-600">Please initialize your Vibecode Core first.</p>
          </div>
        ) : selectedPlaybook ? (
          <div className="space-y-8">
            {/* Back Button */}
            <button
              onClick={() => setSelectedPlaybook(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to playbooks
            </button>

            {/* Playbook Detail */}
            <div>
              <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-tight mb-3">
                {selectedPlaybook.title}
              </h1>
              <p className="text-lg text-gray-600">{selectedPlaybook.description}</p>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {selectedPlaybook.steps.map((step, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{step.step_name}</h3>
                        <p className="text-sm text-gray-500">Tool: <span className="font-medium text-gray-700">{step.tool}</span></p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-700" />
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Goal</p>
                          </div>
                          <p className="text-sm text-gray-700">{step.goal}</p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4 text-red-700" />
                            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Anti-Pattern</p>
                          </div>
                          <p className="text-sm text-gray-700">{step.anti_pattern}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-tight mb-2">
                  Playbooks
                </h1>
                <p className="text-gray-600">Standard workflows for common scenarios</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Playbook
              </button>
            </div>

            {/* Playbooks List */}
            {playbooks.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No playbooks yet. Add your first one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playbooks.map(playbook => (
                  <div
                    key={playbook.id}
                    onClick={() => setSelectedPlaybook(playbook)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700">
                      {playbook.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{playbook.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{playbook.steps.length} steps</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </VibecodeLayoutNotion>
  )
}
