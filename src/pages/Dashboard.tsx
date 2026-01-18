import Navigation from '../components/Navigation';
import { BarChart3, TrendingUp, Calendar, Sparkles, Zap, Target, FileText, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Foreseen Dashboard</h1>
              <p className="text-sm text-gray-600 mt-0.5">AI Intelligence Platform voor Vibecoders</p>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-bold">Welkom bij Foreseen</h2>
            </div>
            <p className="text-slate-300 max-w-2xl leading-relaxed mb-6">
              Jouw private AI nieuws aggregator en kennisbank. Verzamelt wekelijks AI-updates, 
              analyseert op relevantie, en biedt uitgebreide syntheses voor het Vibecoders team.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4" />
                <span>Wekelijkse updates</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                <span>AI trend analyse</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
                <Zap className="w-4 h-4" />
                <span>Actionable insights</span>
              </div>
            </div>
          </div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/weekly-briefs"
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Weekly Synthesis</h3>
              <p className="text-xs text-gray-500">Wekelijkse AI trend rapporten</p>
            </Link>

            <Link 
              to="/vibecode-core"
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Vibecode Core</h3>
              <p className="text-xs text-gray-500">Kennisbank & stack guides</p>
            </Link>

            <Link 
              to="/decisions-inbox"
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-5 h-5 text-success-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Decision Inbox</h3>
              <p className="text-xs text-gray-500">Beslissingen in behandeling</p>
            </Link>

            <Link 
              to="/projects"
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Projects</h3>
              <p className="text-xs text-gray-500">Project pipeline beheer</p>
            </Link>
          </div>

          {/* Info Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Over dit platform</h3>
            <div className="prose prose-slate prose-sm max-w-none">
              <p className="text-gray-600 leading-relaxed">
                <strong>Foreseen</strong> is een private AI nieuwsaggregator en knowledge hub voor Vibecoders. 
                Het platform verzamelt wekelijks AI-updates van geselecteerde bronnen, analyseert de artikelen 
                op relevantie en impact, en genereert uitgebreide synthese rapporten.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                <strong>Belangrijke modules:</strong>
              </p>
              <ul className="text-gray-600 mt-2 space-y-1">
                <li><strong>Dashboard</strong> - Overzicht van scans en artikelen</li>
                <li><strong>Weekly Synthesis</strong> - Wekelijkse AI trend rapporten</li>
                <li><strong>Vibecode Core</strong> - Kennisbank met stack guides, glossary, en checklists</li>
                <li><strong>Decision Inbox</strong> - Artikelen die menselijke beslissing nodig hebben</li>
                <li><strong>Projects</strong> - Kanban-stijl project pipeline</li>
              </ul>
            </div>
          </div>

          {/* Backend Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Backend Configuratie Vereist</h4>
                <p className="text-sm text-amber-800">
                  Dit platform vereist een geconfigureerde Supabase backend met de juiste tabellen en API keys. 
                  Zie de README en .env.example voor setup instructies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
