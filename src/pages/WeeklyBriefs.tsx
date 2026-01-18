import Navigation from '../components/Navigation';
import { FileText, Calendar, TrendingUp } from 'lucide-react';

export default function WeeklyBriefs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Weekly Synthesis</h1>
              <p className="text-sm text-gray-600 mt-0.5">Wekelijkse AI trend rapporten</p>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Synthese Rapporten</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Hier worden wekelijkse AI trend syntheses weergegeven. Elk rapport bevat:
            </p>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                <span><strong>Executive Summary</strong> - Kernpunten van de week</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success-500"></div>
                <span><strong>Macro Trends</strong> - Belangrijkste AI ontwikkelingen</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                <span><strong>Implications</strong> - Actiepunten voor Vibecoding</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span><strong>Client Opportunities</strong> - Commerciële kansen</span>
              </li>
            </ul>
          </div>

          {/* Empty State */}
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Geen synthese rapporten beschikbaar.</p>
            <p className="text-xs text-gray-400 mt-1">Configureer de backend om rapporten te genereren.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
