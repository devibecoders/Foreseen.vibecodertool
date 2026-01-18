import Navigation from '../components/Navigation';
import { BarChart3, TrendingUp, Calendar, Sparkles, Zap, Target, FileText, Briefcase, RefreshCw, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useSupabase';

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Artikelen</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : stats.totalArticles}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Scans</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : stats.totalScans}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Syntheses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : stats.totalBriefs}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Te beslissen</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : stats.pendingDecisions}
              </p>
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
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-blue-600" />
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
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-5 h-5 text-green-600" />
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

          {/* Supabase Connection Status */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Supabase Verbonden</h4>
                <p className="text-sm text-green-800">
                  Database connectie actief. Alle data wordt gesynchroniseerd met de Supabase backend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
