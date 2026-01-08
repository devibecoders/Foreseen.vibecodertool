'use client'

import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import Navigation from '@/components/Navigation'
import ImplicationsTable from '@/components/ImplicationsTable'
import { FileText, TrendingUp, Target, AlertCircle, BookOpen, Calendar, Download, ArrowLeft, Lightbulb, CheckCircle2, XCircle } from 'lucide-react'

interface WeeklyBrief {
  id: string
  week_label: string
  title: string
  start_date: string
  end_date: string
  executive_summary: string
  macro_trends: any[]
  implications_vibecoding: any[]
  client_opportunities: any[]
  ignore_list: any[]
  reading_list: any[]
  full_markdown: string
  created_at: string
  run: {
    items_considered: number
    items_used: number
    status: string
  }
}

export default function WeeklyBriefsPage() {
  const [briefs, setBriefs] = useState<WeeklyBrief[]>([])
  const [selectedBrief, setSelectedBrief] = useState<WeeklyBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [mode, setMode] = useState<'weekly' | 'backfill'>('weekly')
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    fetchBriefs()
  }, [])

  const fetchBriefs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/weekly/list')
      const data = await response.json()
      setBriefs(data.briefs || [])
    } catch (error) {
      console.error('Error fetching briefs:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBrief = async () => {
    if (!confirm(`Generate ${mode === 'weekly' ? 'weekly' : 'backfill (30 days)'} synthesis?\n\nThis may take 1-2 minutes.`)) {
      return
    }

    setGenerating(true)
    try {
      const dates = mode === 'weekly' 
        ? { start_date: startDate, end_date: endDate }
        : { 
            start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
            end_date: format(new Date(), 'yyyy-MM-dd')
          }

      const response = await fetch('/api/weekly/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dates, mode })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Synthesis generated!\n\nWeek: ${data.week_label}\nArticles considered: ${data.items_considered}\nArticles used: ${data.items_used}`)
        fetchBriefs()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error generating brief:', error)
      alert('Error generating synthesis')
    } finally {
      setGenerating(false)
    }
  }

  const downloadMarkdown = (brief: WeeklyBrief) => {
    const blob = new Blob([brief.full_markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foreseen-${brief.week_label}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPDF = () => {
    window.print()
  }

  return (
    <div className="min-h-screen print:bg-white">
      <div className="print:hidden">
        <Navigation />
      </div>
      
      <main className="max-w-7xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        {!selectedBrief ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Weekly Synthesis</h1>
                <p className="text-sm text-gray-600 mt-0.5">Generate and view consolidated AI trend reports</p>
              </div>
            </div>

            {/* Generation Controls */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-gray-900">Generate New Synthesis</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'weekly' | 'backfill')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  >
                    <option value="weekly">Weekly (7 days)</option>
                    <option value="backfill">Backfill (30 days)</option>
                  </select>
                </div>

                {mode === 'weekly' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={generateBrief}
                disabled={generating}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {generating ? 'Generating Synthesis...' : 'Generate Weekly Synthesis'}
              </button>
            </div>

            {/* Briefs List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-700" />
                  <h2 className="text-sm font-semibold text-gray-900">Recent Syntheses</h2>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-slate-900"></div>
                </div>
              ) : briefs.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No synthesis reports yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Generate your first report above.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {briefs.map(brief => (
                    <div
                      key={brief.id}
                      onClick={() => setSelectedBrief(brief)}
                      className="p-5 hover:bg-slate-50 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-slate-800">{brief.title}</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {brief.week_label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(brief.start_date), 'MMM d')} - {format(new Date(brief.end_date), 'MMM d, yyyy')}
                            </span>
                            <span>·</span>
                            <span>{brief.run?.items_used || 0} articles</span>
                            <span>·</span>
                            <span>{brief.macro_trends?.length || 0} trends</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-success-50 text-success-700 border border-success-200">
                              <Target className="w-3 h-3 mr-1" />
                              {brief.client_opportunities?.length || 0} opportunities
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {brief.implications_vibecoding?.length || 0} actions
                            </span>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 print:space-y-0">
            {/* Header with Actions - Hidden on Print */}
            <div className="flex items-center justify-between print:hidden">
              <button
                onClick={() => setSelectedBrief(null)}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to list
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadMarkdown(selectedBrief)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all shadow-sm hover:shadow flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Markdown
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>

            {/* Stats - Hidden on Print */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Trends</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{selectedBrief.macro_trends?.length || 0}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-success-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{selectedBrief.implications_vibecoding?.length || 0}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Articles</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{selectedBrief.run?.items_used || 0}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Week</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{selectedBrief.week_label}</p>
              </div>
            </div>

            {/* A4 Page Preview Container */}
            <div className="print:shadow-none print:border-0">
              {/* Formal Letterhead */}
              <div className="bg-slate-900 text-white px-12 py-6 border-b-4 border-slate-700 print:border-b-2 break-inside-avoid">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <span className="text-slate-900 text-lg font-bold">F</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight">Foreseen</h1>
                      <p className="text-xs text-slate-300">AI Intelligence Report</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{selectedBrief.week_label}</p>
                    <p className="text-xs text-slate-300">
                      {format(new Date(selectedBrief.start_date), 'MMM d')} - {format(new Date(selectedBrief.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* A4 Content Area with Print-Aware Layout */}
              <div id="brief-content" className="bg-white print:shadow-none">
                <div className="max-w-4xl mx-auto px-12 py-16 print:px-8 print:py-8">
                  {/* Parse and render structured content */}
                  <StructuredBriefContent 
                    markdown={selectedBrief.full_markdown}
                    implications={selectedBrief.implications_vibecoding}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          .break-before-page {
            break-before: page;
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  )
}

function StructuredBriefContent({ markdown, implications }: { markdown: string, implications: any[] }) {
  // Parse markdown into sections
  const sections = parseMarkdownSections(markdown)
  
  return (
    <div className="space-y-8">
      {sections.map((section, idx) => {
        // Check if this is the Implications section
        if (section.title.toLowerCase().includes('implications') && implications && implications.length > 0) {
          return (
            <div key={idx} className="break-inside-avoid">
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-6 pb-3 border-b-2 border-slate-200">
                {section.title}
              </h2>
              <ImplicationsTable implications={implications} />
            </div>
          )
        }
        
        // Executive Summary with special styling
        if (section.title.toLowerCase().includes('executive summary')) {
          return (
            <div key={idx} className="bg-slate-50 border-l-4 border-slate-800 p-6 rounded-r-lg break-inside-avoid">
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6" />
                {section.title}
              </h2>
              <div 
                className="prose prose-slate max-w-none prose-p:text-slate-700 prose-p:font-serif"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          )
        }
        
        // Regular sections
        return (
          <div key={idx} className="break-inside-avoid">
            <h2 className="text-2xl font-bold font-serif text-slate-900 mb-6 pb-3 border-b-2 border-slate-200">
              {section.title}
            </h2>
            <div 
              className="prose prose-slate lg:prose-lg max-w-none
                prose-headings:font-serif prose-headings:font-bold
                prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-slate-700 prose-p:leading-relaxed prose-p:font-serif
                prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-ul:my-4 prose-li:my-2
                prose-table:text-sm prose-th:bg-slate-50 prose-th:font-bold"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        )
      })}
    </div>
  )
}

function parseMarkdownSections(markdown: string) {
  const sections: { title: string, content: string }[] = []
  const lines = markdown.split('\n')
  let currentSection: { title: string, content: string } | null = null
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        title: line.replace('## ', ''),
        content: ''
      }
    } else if (currentSection) {
      currentSection.content += line + '\n'
    }
  }
  
  if (currentSection) {
    sections.push(currentSection)
  }
  
  return sections.map(section => ({
    ...section,
    content: renderMarkdown(section.content)
  }))
}

function renderMarkdown(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')

  html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="break-inside-avoid">$1</ul>')

  return `<div>${html}</div>`
}
