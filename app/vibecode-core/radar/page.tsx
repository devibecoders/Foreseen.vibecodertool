'use client'

import { useState, useEffect } from 'react'
import VibecodeLayoutNotion from '@/components/VibecodeLayoutNotion'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, X, ExternalLink } from 'lucide-react'

interface RadarItem {
  id: string
  core_id: string
  title: string
  category: string
  status: 'assess' | 'trial' | 'adopt' | 'avoid'
  rationale: string
  linked_article_id?: string
}

interface VibecodeCore {
  id: string
}

const STATUS_COLUMNS = [
  { id: 'assess', label: 'Assess', description: 'Research and evaluate', color: 'bg-blue-50 border-blue-200' },
  { id: 'trial', label: 'Trial', description: 'Experiment with caution', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'adopt', label: 'Adopt', description: 'Use by default', color: 'bg-green-50 border-green-200' },
  { id: 'avoid', label: 'Avoid', description: 'Do not use', color: 'bg-red-50 border-red-200' },
]

export default function TechRadarPage() {
  const [core, setCore] = useState<VibecodeCore | null>(null)
  const [items, setItems] = useState<RadarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState({
    title: '',
    category: '',
    status: 'assess' as RadarItem['status'],
    rationale: ''
  })

  const sensors = useSensors(useSensor(PointerSensor))

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
        setItems([
          { id: '1', core_id: coreData.core.id, title: 'Next.js', category: 'Frontend', status: 'adopt', rationale: 'Production-ready, great DX' },
          { id: '2', core_id: coreData.core.id, title: 'Supabase', category: 'Backend', status: 'adopt', rationale: 'Fast setup, good for MVPs' },
          { id: '3', core_id: coreData.core.id, title: 'Deno', category: 'Runtime', status: 'trial', rationale: 'Interesting but not mature' },
          { id: '4', core_id: coreData.core.id, title: 'GraphQL', category: 'API', status: 'assess', rationale: 'Complexity vs benefit unclear' },
          { id: '5', core_id: coreData.core.id, title: 'Microservices', category: 'Architecture', status: 'avoid', rationale: 'Premature for our scale' },
        ])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && over.id !== active.id) {
      const newStatus = over.id as RadarItem['status']
      setItems(items.map(item => 
        item.id === active.id ? { ...item, status: newStatus } : item
      ))
    }
    
    setActiveId(null)
  }

  const addItem = () => {
    if (!newItem.title || !core) return

    const item: RadarItem = {
      id: Date.now().toString(),
      core_id: core.id,
      ...newItem
    }

    setItems([...items, item])
    setShowAddModal(false)
    setNewItem({ title: '', category: '', status: 'assess', rationale: '' })
  }

  const deleteItem = (id: string) => {
    if (!confirm('Delete this item?')) return
    setItems(items.filter(i => i.id !== id))
  }

  const activeItem = activeId ? items.find(i => i.id === activeId) : null

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
                  Tech Radar
                </h1>
                <p className="text-gray-600">Technology adoption framework</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Technology
              </button>
            </div>

            {/* Kanban Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-4 gap-4">
                {STATUS_COLUMNS.map(column => {
                  const columnItems = items.filter(item => item.status === column.id)
                  
                  return (
                    <div
                      key={column.id}
                      data-status={column.id}
                      className={`border-2 rounded-lg ${column.color} min-h-[500px]`}
                    >
                      <div className="p-4 border-b border-gray-200 bg-white/50">
                        <h3 className="font-semibold text-gray-900 text-sm">{column.label}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{column.description}</p>
                        <span className="text-xs text-gray-500 mt-2 block">{columnItems.length} items</span>
                      </div>
                      
                      <div className="p-3 space-y-2">
                        {columnItems.map(item => (
                          <RadarItemCard key={item.id} item={item} onDelete={deleteItem} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <DragOverlay>
                {activeItem && <RadarItemCard item={activeItem} onDelete={() => {}} isDragging />}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Add Technology</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., Next.js, PostgreSQL"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <input
                      type="text"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="e.g., Frontend"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
                    <select
                      value={newItem.status}
                      onChange={(e) => setNewItem({ ...newItem, status: e.target.value as RadarItem['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      {STATUS_COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rationale</label>
                  <textarea
                    value={newItem.rationale}
                    onChange={(e) => setNewItem({ ...newItem, rationale: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                    placeholder="Why this status?"
                  />
                </div>
                
                <button
                  onClick={addItem}
                  disabled={!newItem.title}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  Add Technology
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VibecodeLayoutNotion>
  )
}

function RadarItemCard({ item, onDelete, isDragging = false }: { item: RadarItem, onDelete: (id: string) => void, isDragging?: boolean }) {
  return (
    <div
      data-id={item.id}
      className={`bg-white border border-gray-200 rounded-md p-3 cursor-move hover:shadow-sm transition-all group ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {item.category && (
        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded mb-2">
          {item.category}
        </span>
      )}
      {item.rationale && (
        <p className="text-xs text-gray-600 line-clamp-2">{item.rationale}</p>
      )}
    </div>
  )
}
