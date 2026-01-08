'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Archive, Eye, X, Sparkles, Briefcase, Edit3, Upload, FileText } from 'lucide-react'
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
  briefing_file?: File | null // Hand Over Document - Briefing PDF
  briefing_filename?: string
  step_plan_file?: File | null // Hand Over Document - Stappenplan PDF
  step_plan_filename?: string
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
    quote_amount: '',
    briefing_file: null as File | null,
    briefing_filename: '',
    step_plan_file: null as File | null,
    step_plan_filename: ''
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  )

  useEffect(() => {
    fetchProjects()
  }, [showArchived])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects?archived=${showArchived}`)
      const data = await response.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && over.id !== active.id) {
      const draggedProject = projects.find(p => p.id === active.id)
      if (!draggedProject) return

      // Check if dropping on a column (status change)
      const isColumnDrop = STATUS_COLUMNS.some(col => col.id === over.id)

      if (isColumnDrop) {
        const newStatus = over.id as Project['status']

        // Optimistic update
        setProjects(projects.map(project =>
          project.id === active.id ? { ...project, status: newStatus } : project
        ))

        // Persist to database
        try {
          await fetch('/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: active.id, status: newStatus })
          })
        } catch (error) {
          console.error('Error updating project status:', error)
          // Revert on error
          fetchProjects()
        }

        if (newStatus === 'Done') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          })
        }
      }
    }

    setActiveId(null)
  }

  const addProject = async () => {
    if (!newProject.name) return

    const typeConfig = PROJECT_TYPES.find(t => t.value === newProject.type)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          client_name: newProject.client_name,
          description: newProject.description,
          type: newProject.type,
          status: newProject.status,
          quote_amount: newProject.quote_amount ? parseFloat(newProject.quote_amount) : null,
          briefing_filename: newProject.briefing_filename || null,
          step_plan_filename: newProject.step_plan_filename || null,
          color_theme: typeConfig?.color || 'gray'
        })
      })

      const data = await response.json()
      if (data.success && data.project) {
        setProjects([data.project, ...projects])
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }

    setShowAddModal(false)
    setNewProject({
      name: '',
      client_name: '',
      description: '',
      type: 'Application',
      status: 'Prospect',
      quote_amount: '',
      briefing_file: null,
      briefing_filename: '',
      step_plan_file: null,
      step_plan_filename: ''
    })
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const saveEditProject = async () => {
    if (!editingProject) return

    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProject.id,
          name: editingProject.name,
          client_name: editingProject.client_name,
          description: editingProject.description,
          type: editingProject.type,
          status: editingProject.status,
          quote_amount: editingProject.quote_amount,
          briefing_filename: editingProject.briefing_filename,
          step_plan_filename: editingProject.step_plan_filename
        })
      })

      const data = await response.json()
      if (data.success && data.project) {
        setProjects(projects.map(p => p.id === editingProject.id ? data.project : p))
        if (selectedProject?.id === editingProject.id) {
          setSelectedProject(data.project)
        }
      }
    } catch (error) {
      console.error('Error updating project:', error)
    }

    setShowEditModal(false)
    setEditingProject(null)
  }

  const archiveProject = async (id: string) => {
    if (!confirm('Archiveer dit project?')) return

    try {
      await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      setProjects(projects.filter(p => p.id !== id))
      setSelectedProject(null)
    } catch (error) {
      console.error('Error archiving project:', error)
    }
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${showArchived
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
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    projects={columnProjects}
                    onProjectClick={setSelectedProject}
                    onArchive={archiveProject}
                  />
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
              quote_amount: editingProject.quote_amount?.toString() || '',
              briefing_file: editingProject.briefing_file || null,
              briefing_filename: editingProject.briefing_filename || '',
              step_plan_file: editingProject.step_plan_file || null,
              step_plan_filename: editingProject.step_plan_filename || ''
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
                  quote_amount: updated.quote_amount ? parseFloat(updated.quote_amount) : undefined,
                  briefing_file: updated.briefing_file,
                  briefing_filename: updated.briefing_filename || undefined,
                  step_plan_file: updated.step_plan_file,
                  step_plan_filename: updated.step_plan_filename || undefined
                })
              }
            }}
          />
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedProject(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
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

                {(selectedProject.briefing_filename || selectedProject.step_plan_filename) && (
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">📄 Hand Over Document</h3>

                    {selectedProject.briefing_filename && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Briefing</p>
                        <button
                          onClick={() => {
                            if (selectedProject.briefing_file) {
                              const url = URL.createObjectURL(selectedProject.briefing_file)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = selectedProject.briefing_filename || 'briefing.pdf'
                              a.click()
                              URL.revokeObjectURL(url)
                            }
                          }}
                          className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-3 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">{selectedProject.briefing_filename}</span>
                          </div>
                          <span className="text-xs text-blue-600 font-medium">Download</span>
                        </button>
                      </div>
                    )}

                    {selectedProject.step_plan_filename && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Stappenplan</p>
                        <button
                          onClick={() => {
                            if (selectedProject.step_plan_file) {
                              const url = URL.createObjectURL(selectedProject.step_plan_file)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = selectedProject.step_plan_filename || 'stappenplan.pdf'
                              a.click()
                              URL.revokeObjectURL(url)
                            }
                          }}
                          className="w-full bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between gap-3 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">{selectedProject.step_plan_filename}</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Download</span>
                        </button>
                      </div>
                    )}
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

function DroppableColumn({ column, projects, onProjectClick, onArchive }: {
  column: typeof STATUS_COLUMNS[0]
  projects: Project[]
  onProjectClick: (project: Project) => void
  onArchive: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 border-2 rounded-lg ${column.color} ${isOver ? 'ring-2 ring-slate-900 ring-offset-2' : ''
        } transition-all`}
    >
      <div className="p-4 border-b border-gray-200 bg-white/50">
        <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{column.label}</h3>
        <p className="text-xs text-gray-600">{column.description}</p>
        <span className="text-xs text-gray-500 mt-2 block">{projects.length} project{projects.length !== 1 ? 'en' : ''}</span>
      </div>

      <div className="p-3 space-y-3 min-h-[200px]">
        {projects.map(project => (
          <DraggableProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick(project)}
            onArchive={onArchive}
          />
        ))}
      </div>
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

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger onClick if not dragging
    if (!isDragging) {
      onClick()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-all group ${isDragging ? 'opacity-50 rotate-2 cursor-grabbing' : ''
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
      className={`bg-white border border-gray-200 rounded-lg p-4 ${isDragging ? 'opacity-50 rotate-2' : ''
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
  const handleBriefingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange({ ...project, briefing_file: file, briefing_filename: file.name })
    }
  }

  const handleStepPlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange({ ...project, step_plan_file: file, step_plan_filename: file.name })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📄 Hand Over Document (Optioneel)</h3>
            <p className="text-xs text-gray-500 mb-4">Upload PDF bestanden voor briefing en stappenplan</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Briefing PDF</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleBriefingUpload}
                  className="hidden"
                  id="briefing-upload"
                />
                <label
                  htmlFor="briefing-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  {project.briefing_filename ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{project.briefing_filename}</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700">Klik om PDF te uploaden</span>
                      <span className="text-xs text-gray-500 mt-1">of sleep bestand hierheen</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stappenplan PDF</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleStepPlanUpload}
                  className="hidden"
                  id="stepplan-upload"
                />
                <label
                  htmlFor="stepplan-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  {project.step_plan_filename ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">{project.step_plan_filename}</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-700">Klik om PDF te uploaden</span>
                      <span className="text-xs text-gray-500 mt-1">of sleep bestand hierheen</span>
                    </>
                  )}
                </label>
              </div>
            </div>
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
