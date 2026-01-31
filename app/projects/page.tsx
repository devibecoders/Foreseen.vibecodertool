'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Archive, Eye, X, Sparkles, Briefcase, Edit3, Upload, FileText, Shield, AlertTriangle, Clock, LayoutGrid, Settings } from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import ProjectIntelligenceModal from '@/components/ProjectIntelligenceModal'
import ProjectDetailPanel from '@/components/ProjectDetailPanel'
import { assessProjectRisk, getRiskStyles, type RiskLevel } from '@/lib/projectRisk'
import { differenceInDays } from 'date-fns'

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
  briefing_file?: File | null
  briefing_filename?: string
  briefing_url?: string
  step_plan_file?: File | null
  step_plan_filename?: string
  step_plan_url?: string
  active_playbook_id?: string
  intelligence?: any
  deadline?: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

type ProjectsTab = 'status' | 'manage'

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
  const [activeTab, setActiveTab] = useState<ProjectsTab>('status')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showIntelligenceModal, setShowIntelligenceModal] = useState(false)
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
    deadline: '',
    briefing_file: null as File | null,
    briefing_filename: '',
    briefing_url: '',
    step_plan_file: null as File | null,
    step_plan_filename: '',
    step_plan_url: ''
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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

      const isColumnDrop = STATUS_COLUMNS.some(col => col.id === over.id)

      if (isColumnDrop) {
        const newStatus = over.id as Project['status']

        setProjects(projects.map(project =>
          project.id === active.id ? { ...project, status: newStatus } : project
        ))

        try {
          await fetch('/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: active.id, status: newStatus })
          })
        } catch (error) {
          console.error('Error updating project status:', error)
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
      let briefingUrl = ''
      let stepPlanUrl = ''

      if (newProject.briefing_file) {
        const formData = new FormData()
        formData.append('file', newProject.briefing_file)
        formData.append('fileType', 'briefing')

        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          briefingUrl = uploadData.url
        }
      }

      if (newProject.step_plan_file) {
        const formData = new FormData()
        formData.append('file', newProject.step_plan_file)
        formData.append('fileType', 'step_plan')

        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          stepPlanUrl = uploadData.url
        }
      }

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
          deadline: newProject.deadline || null,
          briefing_filename: newProject.briefing_filename || null,
          briefing_url: briefingUrl || null,
          step_plan_filename: newProject.step_plan_filename || null,
          step_plan_url: stepPlanUrl || null,
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
    resetNewProject()
  }

  const resetNewProject = () => {
    setNewProject({
      name: '',
      client_name: '',
      description: '',
      type: 'Application',
      status: 'Prospect',
      quote_amount: '',
      deadline: '',
      briefing_file: null,
      briefing_filename: '',
      briefing_url: '',
      step_plan_file: null,
      step_plan_filename: '',
      step_plan_url: ''
    })
  }

  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setShowEditModal(true)
  }

  const saveEditProject = async () => {
    if (!editingProject) return

    try {
      let briefingUrl = editingProject.briefing_url || ''
      let stepPlanUrl = editingProject.step_plan_url || ''

      if (editingProject.briefing_file) {
        const formData = new FormData()
        formData.append('file', editingProject.briefing_file)
        formData.append('fileType', 'briefing')
        formData.append('projectId', editingProject.id)

        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          briefingUrl = uploadData.url
        }
      }

      if (editingProject.step_plan_file) {
        const formData = new FormData()
        formData.append('file', editingProject.step_plan_file)
        formData.append('fileType', 'step_plan')
        formData.append('projectId', editingProject.id)

        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          stepPlanUrl = uploadData.url
        }
      }

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
          deadline: editingProject.deadline || null,
          briefing_filename: editingProject.briefing_filename,
          briefing_url: briefingUrl || null,
          step_plan_filename: editingProject.step_plan_filename,
          step_plan_url: stepPlanUrl || null
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

  // Calculate project risks for badges
  const projectRisks = new Map<string, { level: RiskLevel; count: number }>()
  filteredProjects.forEach(project => {
    const risk = assessProjectRisk(project as any)
    const riskCount = risk.factors.filter(f => f.type === 'danger' || f.type === 'warning').length
    projectRisks.set(project.id, { level: risk.level, count: riskCount })
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Projects</h1>
              <p className="text-sm text-gray-600 mt-0.5">Mission Control voor al je projecten</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/projects/risk"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm
                         bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200 
                         text-orange-700 hover:from-red-100 hover:to-orange-100"
            >
              <Shield className="w-4 h-4" />
              Risk Board
            </Link>

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowIntelligenceModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-all text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Nieuw Project
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-all text-sm"
                  title="Snel toevoegen zonder analyse"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Internal Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'status'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Status Pipeline
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'manage'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Management
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
          </div>
        ) : activeTab === 'status' ? (
          /* STATUS TAB - Pipeline View */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
                    projectRisks={projectRisks}
                    onProjectClick={setSelectedProject}
                    onArchive={archiveProject}
                  />
                )
              })}
            </div>

            <DragOverlay>
              {activeProject && <ProjectCard project={activeProject} isDragging projectRisks={projectRisks} />}
            </DragOverlay>
          </DndContext>
        ) : (
          /* MANAGEMENT TAB */
          <ManagementView
            projects={filteredProjects}
            projectRisks={projectRisks}
            onProjectClick={setSelectedProject}
            onCreateNew={() => setShowIntelligenceModal(true)}
            onQuickAdd={() => setShowAddModal(true)}
            onEdit={openEditModal}
          />
        )}

        {/* Project Intelligence Modal (Primary) */}
        <ProjectIntelligenceModal
          isOpen={showIntelligenceModal}
          onClose={() => setShowIntelligenceModal(false)}
          onProjectCreated={(project) => {
            setProjects([project, ...projects])
            setShowIntelligenceModal(false)
          }}
        />

        {/* Quick Add Project Modal (Secondary) */}
        {showAddModal && (
          <ProjectFormModal
            title="Snel Project Toevoegen"
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
              deadline: editingProject.deadline || '',
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
                  deadline: updated.deadline || undefined,
                  briefing_file: updated.briefing_file,
                  briefing_filename: updated.briefing_filename || undefined,
                  step_plan_file: updated.step_plan_file,
                  step_plan_filename: updated.step_plan_filename || undefined
                })
              }
            }}
          />
        )}

        {/* Project Detail Panel */}
        {selectedProject && (
          <ProjectDetailPanel
            project={selectedProject as any}
            onClose={() => setSelectedProject(null)}
            onEdit={() => {
              openEditModal(selectedProject)
              setSelectedProject(null)
            }}
            onArchive={(id) => {
              archiveProject(id)
              setSelectedProject(null)
            }}
            onIntelligenceUpdate={(projectId, intelligence) => {
              setProjects(projects.map(p => 
                p.id === projectId ? { ...p, intelligence } : p
              ))
              setSelectedProject(prev => prev ? { ...prev, intelligence } : null)
            }}
          />
        )}
      </main>
    </div>
  )
}

/* ===== MANAGEMENT VIEW ===== */
function ManagementView({ 
  projects, 
  projectRisks,
  onProjectClick, 
  onCreateNew, 
  onQuickAdd,
  onEdit
}: {
  projects: Project[]
  projectRisks: Map<string, { level: RiskLevel; count: number }>
  onProjectClick: (project: Project) => void
  onCreateNew: () => void
  onQuickAdd: () => void
  onEdit: (project: Project) => void
}) {
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredProjects = filterStatus === 'all' 
    ? projects 
    : projects.filter(p => p.status === filterStatus)

  // Group by status for overview
  const statusCounts = STATUS_COLUMNS.map(col => ({
    ...col,
    count: projects.filter(p => p.status === col.id).length
  }))

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onCreateNew}
          className="flex items-center gap-4 p-6 bg-gradient-to-br from-violet-50 to-purple-50 
                     border-2 border-violet-200 rounded-xl hover:border-violet-400 transition-all group"
        >
          <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-violet-900">Nieuw Project met AI</h3>
            <p className="text-sm text-violet-600">Upload briefing, krijg volledige analyse</p>
          </div>
        </button>

        <button
          onClick={onQuickAdd}
          className="flex items-center gap-4 p-6 bg-white border-2 border-slate-200 
                     rounded-xl hover:border-slate-400 transition-all group"
        >
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Snel Toevoegen</h3>
            <p className="text-sm text-slate-600">Project zonder analyse starten</p>
          </div>
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-6 gap-3">
        {statusCounts.map(status => (
          <button
            key={status.id}
            onClick={() => setFilterStatus(filterStatus === status.id ? 'all' : status.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${status.color} ${
              filterStatus === status.id ? 'ring-2 ring-slate-900 ring-offset-2' : ''
            }`}
          >
            <p className="text-2xl font-bold text-slate-900">{status.count}</p>
            <p className="text-xs text-slate-600 truncate">{status.label}</p>
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">
            {filterStatus === 'all' ? 'Alle Projecten' : STATUS_COLUMNS.find(c => c.id === filterStatus)?.label}
            <span className="ml-2 text-sm font-normal text-slate-500">({filteredProjects.length})</span>
          </h3>
          {filterStatus !== 'all' && (
            <button 
              onClick={() => setFilterStatus('all')}
              className="text-sm text-violet-600 hover:underline"
            >
              Toon alles
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Geen projecten gevonden</p>
            </div>
          ) : (
            filteredProjects.map(project => {
              const risk = projectRisks.get(project.id)
              const riskStyles = risk ? getRiskStyles(risk.level) : null
              const daysInStatus = differenceInDays(new Date(), new Date(project.updated_at))

              return (
                <div
                  key={project.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer group"
                  onClick={() => onProjectClick(project)}
                >
                  {/* Risk Indicator */}
                  {risk && risk.level !== 'healthy' && (
                    <div className={`w-3 h-3 rounded-full ${riskStyles?.indicatorColor}`} 
                         title={riskStyles?.label} />
                  )}
                  {(!risk || risk.level === 'healthy') && (
                    <div className="w-3 h-3 rounded-full bg-green-500" title="Healthy" />
                  )}

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 truncate">{project.name}</h4>
                      {risk && risk.level !== 'healthy' && risk.level !== 'low' && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskStyles?.bgColor} ${riskStyles?.textColor}`}>
                          {risk.level === 'critical' ? 'RISK' : risk.level.toUpperCase()}
                          {risk.count > 0 && ` (${risk.count})`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{project.client_name || 'Geen klant'}</p>
                  </div>

                  {/* Status */}
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                    {project.status}
                  </span>

                  {/* Time in Status */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 w-20">
                    <Clock className="w-3 h-3" />
                    {daysInStatus}d
                  </div>

                  {/* Quote */}
                  <div className="w-24 text-right">
                    {project.quote_amount ? (
                      <span className="font-medium text-slate-900">
                        €{(project.quote_amount / 1000).toFixed(0)}k
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(project)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ===== DROPPABLE COLUMN ===== */
function DroppableColumn({ column, projects, projectRisks, onProjectClick, onArchive }: {
  column: typeof STATUS_COLUMNS[0]
  projects: Project[]
  projectRisks: Map<string, { level: RiskLevel; count: number }>
  onProjectClick: (project: Project) => void
  onArchive: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 border-2 rounded-lg ${column.color} ${isOver
        ? 'ring-4 ring-slate-900 ring-offset-2 scale-[1.02] shadow-xl bg-slate-50/50'
        : ''
        } transition-all duration-200 ease-in-out`}
    >
      <div className="p-4 border-b border-gray-200 bg-white/50">
        <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{column.label}</h3>
        <p className="text-xs text-gray-600">{column.description}</p>
        <span className="text-xs text-gray-500 mt-2 block">{projects.length} project{projects.length !== 1 ? 'en' : ''}</span>
      </div>

      <div className={`p-3 space-y-3 min-h-[400px] ${isOver ? 'bg-slate-100/30' : ''
        } transition-colors duration-200`}>
        {projects.map(project => (
          <DraggableProjectCard
            key={project.id}
            project={project}
            projectRisks={projectRisks}
            onClick={() => onProjectClick(project)}
            onArchive={onArchive}
          />
        ))}

        {isOver && projects.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-lg bg-white/50">
            <p className="text-sm text-gray-500 font-medium">Laat hier los</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== DRAGGABLE PROJECT CARD ===== */
function DraggableProjectCard({ project, projectRisks, onClick, onArchive }: {
  project: Project
  projectRisks: Map<string, { level: RiskLevel; count: number }>
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
  const risk = projectRisks.get(project.id)
  const riskStyles = risk ? getRiskStyles(risk.level) : null
  const daysInStatus = differenceInDays(new Date(), new Date(project.updated_at))

  const handleClick = (e: React.MouseEvent) => {
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

      {/* Risk Badge */}
      {risk && risk.level !== 'healthy' && risk.level !== 'low' && (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md mb-3 ${riskStyles?.bgColor} ${riskStyles?.textColor}`}>
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs font-bold">
            {risk.level === 'critical' ? 'RISK' : risk.level.toUpperCase()}
            {risk.count > 0 && ` (${risk.count})`}
          </span>
        </div>
      )}

      {/* Stuck Badge */}
      {daysInStatus > 14 && project.status !== 'Done' && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md mb-3 bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          <span className="text-xs font-bold">STUCK ({daysInStatus}d)</span>
        </div>
      )}

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

      {/* Time in Status */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{daysInStatus}d in status</span>
        </div>
        {project.deadline && (
          <div className="flex items-center gap-1">
            <span>📅 {new Date(project.deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}
      </div>

      {project.active_playbook_id && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
          <Sparkles className="w-3 h-3" />
          <span>Playbook gekoppeld</span>
        </div>
      )}
    </div>
  )
}

/* ===== PROJECT CARD (for drag overlay) ===== */
function ProjectCard({ project, isDragging = false, projectRisks }: {
  project: Project
  isDragging?: boolean
  projectRisks: Map<string, { level: RiskLevel; count: number }>
}) {
  const typeConfig = PROJECT_TYPES.find(t => t.value === project.type)
  const risk = projectRisks.get(project.id)
  const riskStyles = risk ? getRiskStyles(risk.level) : null

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${isDragging ? 'opacity-50 rotate-2' : ''
        }`}
    >
      <h4 className="font-semibold text-gray-900 text-base mb-3">{project.name}</h4>

      {risk && risk.level !== 'healthy' && risk.level !== 'low' && (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md mb-3 ${riskStyles?.bgColor} ${riskStyles?.textColor}`}>
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs font-bold">{risk.level.toUpperCase()}</span>
        </div>
      )}

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

/* ===== PROJECT FORM MODAL ===== */
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

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
              <input
                type="date"
                value={project.deadline}
                onChange={(e) => onChange({ ...project, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📄 Documenten (Optioneel)</h3>

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
