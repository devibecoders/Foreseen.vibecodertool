'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Archive, Eye, X, Sparkles, Briefcase, Edit3 } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Project {
  id: string
  user_id: string
  name: string
  client_name: string
  description: string
  type: 'Application' | 'Website + Backend' | 'Problem Solving' | 'AI Integration'
  status: 'Prospect' | 'Offer Sent' | 'Setup' | 'In Progress' | 'Review' | 'Done'
  color_theme: string
  quote_amount?: number
  active_playbook_id?: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

const STATUS_COLUMNS = [
  { id: 'Prospect', label: 'Prospect / Lead', description: 'Nieuwe aanvraag', color: 'bg-gray-50 border-gray-200' },
  { id: 'Offer Sent', label: 'Offerte Gestuurd', description: 'Wachten op akkoord', color: 'bg-blue-50 border-blue-200' },
  { id: 'Setup', label: 'Toewijzing / Start', description: 'Setup fase', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'In Progress', label: 'In Uitvoering', description: 'Het echte bouwen', color: 'bg-purple-50 border-purple-200' },
  { id: 'Review', label: 'Test Run / Review', description: 'Klant checkt het', color: 'bg-orange-50 border-orange-200' },
  { id: 'Done', label: 'Done / Live', description: 'Gereed product', color: 'bg-green-50 border-green-200' },
]

const PROJECT_TYPES = [
  { value: 'Application', label: '📱 Applicatie', color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { value: 'Website + Backend', label: '🌐 Website + Backend', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { value: 'Problem Solving', label: '🧩 Problem Solving / Automation', color: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { value: 'AI Integration', label: '🧠 AI Integration', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    client_name: '',
    description: '',
    type: 'Application' as Project['type'],
    status: 'Prospect' as Project['status'],
    quote_amount: ''
  })

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const mockProjects: Project[] = [
        {
          id: '1',
          user_id: 'default-user',
          name: 'Mamalo',
          client_name: 'Mamalo B.V.',
          description: 'Mobile application for restaurant ordering and delivery management',
          type: 'Application',
          status: 'In Progress',
          color_theme: 'purple',
          quote_amount: 25000,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'default-user',
          name: 'Vivly',
          client_name: 'Vivly Health',
          description: 'Healthcare platform with patient portal and backend API',
          type: 'Website + Backend',
          status: 'Offer Sent',
          color_theme: 'blue',
          quote_amount: 45000,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          user_id: 'default-user',
          name: 'RetailTwin',
          client_name: 'RetailTwin AI',
          description: 'AI-powered retail analytics and inventory prediction system',
          type: 'AI Integration',
          status: 'Prospect',
          color_theme: 'orange',
          quote_amount: 35000,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setProjects(mockProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
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
      const newStatus = over.id as Project['status']
      setProjects(projects.map(project => 
        project.id === active.id ? { ...project, status: newStatus } : project
      ))

      if (newStatus === 'Done') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }
    
    setActiveId(null)
  }

  const addProject = () => {
    if (!newProject.name) return

    const typeConfig = PROJECT_TYPES.find(t => t.value === newProject.type)
    
    const project: Project = {
      id: Date.now().toString(),
      user_id: 'default-user',
      name: newProject.name,
      client_name: newProject.client_name,
      description: newProject.description,
      type: newProject.type,
      status: newProject.status,
      quote_amount: newProject.quote_amount ? parseFloat(newProject.quote_amount) : undefined,
      color_theme: typeConfig?.color || 'gray',
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setProjects([...projects, project])
    setShowAddModal(false)
    setNewProject({
      name: '',
      client_name: '',
      description: '',
      type: 'Application',
      status: 'Prospect',
      quote_amount: ''
    })
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const saveEditProject = () => {
    if (!editingProject) return
    setProjects(projects.map(p => p.id === editingProject.id ? editingProject : p))
    setShowEditModal(false)
    setEditingProject(null)
    if (selectedProject?.id === editingProject.id) {
      setSelectedProject(editingProject)
    }
  }

  const archiveProject = (id: string) => {
    if (!confirm('Archive dit project?')) return
    setProjects(projects.map(p => p.id === id ? { ...p, is_archived: true } : p))
    setSelectedProject(null)
  }

  const filteredProjects = showArchived 
    ? projects.filter(p => p.is_archived)
    : projects.filter(p => !p.is_archived)

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Project Pipeline</h1>
              <p className="text-sm text-gray-600 mt-0.5">Van prospect tot live product</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                showArchived
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-gray-700 hover:bg-slate-50'
              }`}
            >
              {showArchived ? <Eye className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              {showArchived ? 'Toon Actief' : 'Toon Archief'}
            </button>
            
            {!showArchived && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Nieuw Project
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STATUS_COLUMNS.map(column => {
                const columnProjects = filteredProjects.filter(p => p.status === column.id)
                
                return (
                  <div
                    key={column.id}
                    data-status={column.id}
                    className={`flex-shrink-0 w-80 border-2 rounded-lg ${column.color}`}
                  >
                    <div className="p-4 border-b border-gray-200 bg-white/50">
                      <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{column.label}</h3>
                      <p className="text-xs text-gray-600">{column.description}</p>
                      <span className="text-xs text-gray-500 mt-2 block">{columnProjects.length} project{columnProjects.length !== 1 ? 'en' : ''}</span>
                    </div>
                    
                    <div className="p-3 space-y-3 min-h-[400px]">
                      {columnProjects.map(project => (
                        <DraggableProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => setSelectedProject(project)}
                          onArchive={archiveProject}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <DragOverlay>
              {activeProject && <ProjectCard project={activeProject} isDragging />}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add Project Modal */}
        {showAddModal && (
          <ProjectFormModal
            title="Nieuw Project"
            project={newProject}
            onSave={addProject}
            onClose={() => setShowAddModal(false)}
            onChange={setNewProject}
          />
        )}

        {/* Edit Project Modal */}
        {showEditModal && editingProject && (
          <ProjectFormModal
            title="Bewerk Project"
            project={{
              name: editingProject.name,
              client_name: editingProject.client_name,
              description: editingProject.description,
              type: editingProject.type,
              status: editingProject.status,
              quote_amount: editingProject.quote_amount?.toString() || ''
            }}
            onSave={saveEditProject}
            onClose={() => {
              setShowEditModal(false)
              setEditingProject(null)
            }}
            onChange={(updated) => {
              if (editingProject) {
                setEditingProject({
                  ...editingProject,
                  name: updated.name,
                  client_name: updated.client_name,
                  description: updated.description,
                  type: updated.type,
                  status: updated.status,
                  quote_amount: updated.quote_amount ? parseFloat(updated.quote_amount) : undefined
                })
              }
            }}
          />
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h2>
                  {getProjectTypeBadge(selectedProject.type)}
                </div>
                <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Klant</p>
                  <p className="text-base text-gray-900">{selectedProject.client_name || 'Geen klant opgegeven'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Beschrijving</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProject.description || 'Geen beschrijving'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700">
                    {selectedProject.status}
                  </span>
                </div>

                {selectedProject.quote_amount && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Offerte Bedrag</p>
                    <p className="text-lg font-bold text-gray-900">€ {selectedProject.quote_amount.toLocaleString('nl-NL')}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      openEditModal(selectedProject)
                      setSelectedProject(null)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Bewerk Project
                  </button>

                  {!selectedProject.is_archived && (
                    <button
                      onClick={() => archiveProject(selectedProject.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition-all"
                    >
                      <Archive className="w-4 h-4" />
                      Archiveer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function DraggableProjectCard({ project, onClick, onArchive }: { 
  project: Project
  onClick: () => void
  onArchive: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const typeConfig = PROJECT_TYPES.find(t => t.value === project.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-all group ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-base">{project.name}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onArchive(project.id)
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all"
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>

      {typeConfig && (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border} mb-3`}>
          {typeConfig.label}
        </span>
      )}

      {project.client_name && (
        <p className="text-sm text-gray-600 mb-2">{project.client_name}</p>
      )}

      {project.quote_amount && (
        <p className="text-sm font-semibold text-gray-900 mb-2">€ {project.quote_amount.toLocaleString('nl-NL')}</p>
      )}

      {project.active_playbook_id && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <Sparkles className="w-3 h-3" />
          <span>Playbook gekoppeld</span>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, isDragging = false }: { 
  project: Project
  isDragging?: boolean 
}) {
  const typeConfig = PROJECT_TYPES.find(t => t.value === project.type)

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <h4 className="font-semibold text-gray-900 text-base mb-3">{project.name}</h4>

      {typeConfig && (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border} mb-3`}>
          {typeConfig.label}
        </span>
      )}

      {project.client_name && (
        <p className="text-sm text-gray-600">{project.client_name}</p>
      )}
    </div>
  )
}

function ProjectFormModal({ title, project, onSave, onClose, onChange }: {
  title: string
  project: any
  onSave: () => void
  onClose: () => void
  onChange: (project: any) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Naam *</label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => onChange({ ...project, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="bijv. Mamalo, Vivly"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Klant Naam</label>
            <input
              type="text"
              value={project.client_name}
              onChange={(e) => onChange({ ...project, client_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="bijv. Mamalo B.V."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschrijving</label>
            <textarea
              value={project.description}
              onChange={(e) => onChange({ ...project, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder="Korte beschrijving van het project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Offerte Bedrag (€)</label>
            <input
              type="number"
              value={project.quote_amount}
              onChange={(e) => onChange({ ...project, quote_amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="bijv. 25000"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
              <select
                value={project.type}
                onChange={(e) => onChange({ ...project, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {PROJECT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
              <select
                value={project.status}
                onChange={(e) => onChange({ ...project, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {STATUS_COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={onSave}
            disabled={!project.name}
            className="w-full px-4 py-2.5 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

function getProjectTypeBadge(type: Project['type']) {
  const typeConfig = PROJECT_TYPES.find(t => t.value === type)
  if (!typeConfig) return null

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
      {typeConfig.label}
    </span>
  )
}
