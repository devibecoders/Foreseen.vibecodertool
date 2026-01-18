import Navigation from '../components/Navigation';
import { Briefcase, Plus, Archive } from 'lucide-react';

const STATUS_COLUMNS = [
  { id: 'Prospect', label: 'Prospect / Lead', description: 'Nieuwe aanvraag', color: 'bg-gray-50 border-gray-200' },
  { id: 'Offer Sent', label: 'Offerte Gestuurd', description: 'Wachten op akkoord', color: 'bg-blue-50 border-blue-200' },
  { id: 'Setup', label: 'Toewijzing / Start', description: 'Setup fase', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'In Progress', label: 'In Uitvoering', description: 'Het echte bouwen', color: 'bg-purple-50 border-purple-200' },
  { id: 'Review', label: 'Test Run / Review', description: 'Klant checkt het', color: 'bg-orange-50 border-orange-200' },
  { id: 'Done', label: 'Done / Live', description: 'Gereed product', color: 'bg-green-50 border-green-200' },
];

export default function Projects() {
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-gray-700 hover:bg-slate-50 rounded-lg font-medium transition-all text-sm">
              <Archive className="w-4 h-4" />
              Toon Archief
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all text-sm">
              <Plus className="w-4 h-4" />
              Nieuw Project
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map(column => (
            <div
              key={column.id}
              className={`flex-shrink-0 w-72 rounded-xl border ${column.color} min-h-[600px]`}
            >
              <div className="px-4 py-3 border-b border-inherit">
                <h3 className="font-semibold text-gray-900 text-sm">{column.label}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{column.description}</p>
              </div>

              <div className="p-3 space-y-3">
                {/* Empty state for each column */}
                <div className="text-center py-8 text-gray-400 text-xs">
                  Geen projecten
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
