'use client'

import { useState, useEffect } from 'react'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, X } from 'lucide-react'

interface Principle {
  id: string
  core_id: string
  title: string
  description: string
  sort_order: number
  is_active: boolean
}

interface VibecodeCore {
  id: string
}

export default function PrinciplesPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPrinciple, setNewPrinciple] = useState({ title: '', description: '' })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
        // TODO: Fetch principles from separate table when API is ready
        // For now, use mock data
        setPrinciples([
          { id: '1', core_id: coreData.core.id, title: 'Ship Fast, Learn Faster', description: 'Get working software in front of users quickly to validate assumptions.', sort_order: 1, is_active: true },
          { id: '2', core_id: coreData.core.id, title: 'Boring Technology', description: 'Choose proven, stable technologies over exciting new ones unless there is clear benefit.', sort_order: 2, is_active: true },
          { id: '3', core_id: coreData.core.id, title: 'Delete More Than You Add', description: 'Complexity is the enemy. Always look for what can be removed.', sort_order: 3, is_active: true },
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setPrinciples((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const reordered = arrayMove(items, oldIndex, newIndex)
        // Update sort_order for each item
        return reordered.map((item, index) => ({ ...item, sort_order: index + 1 }))
      })
    }
  }

  const addPrinciple = () => {
    if (!newPrinciple.title || !core) return

    const newItem: Principle = {
      id: Date.now().toString(),
      core_id: core.id,
      title: newPrinciple.title,
      description: newPrinciple.description,
      sort_order: principles.length + 1,
      is_active: true
    }

    setPrinciples([...principles, newItem])
    setShowAddModal(false)
    setNewPrinciple({ title: '', description: '' })
  }

  const deletePrinciple = (id: string) => {
    if (!confirm('Delete this principle?')) return
    setPrinciples(principles.filter(p => p.id !== id))
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
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-5xl font-serif font-bold text-gray-900 tracking-tight mb-2">
                  Principles
                </h1>
                <p className="text-gray-600">Core values that guide decision-making</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Principle
              </button>
            </div>

            {/* Reorderable Principles List */}
            {principles.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No principles yet. Add your first one.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={principles.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {principles.map((principle) => (
                      <SortablePrincipleCard
                        key={principle.id}
                        principle={principle}
                        onDelete={deletePrinciple}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* Add Principle Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Add Principle</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={newPrinciple.title}
                    onChange={(e) => setNewPrinciple({ ...newPrinciple, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., Ship Fast, Learn Faster"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={newPrinciple.description}
                    onChange={(e) => setNewPrinciple({ ...newPrinciple, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                    placeholder="Explain what this principle means..."
                  />
                </div>
                
                <button
                  onClick={addPrinciple}
                  disabled={!newPrinciple.title}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  Add Principle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VibecodeLayoutNotion>
  )
}

function SortablePrincipleCard({ principle, onDelete }: { principle: Principle, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: principle.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{principle.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{principle.description}</p>
        </div>

        <button
          onClick={() => onDelete(principle.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
