import Navigation from '../components/Navigation';
import { FileText, Calendar, TrendingUp, RefreshCw, Download, ExternalLink } from 'lucide-react';
import { useWeeklyBriefs } from '../hooks/useSupabase';

export default function WeeklyBriefs() {
  const { briefs, loading, error, refresh } = useWeeklyBriefs();

  const downloadMarkdown = (brief: any) => {
    const blob = new Blob([brief.full_markdown || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.week_label}-synthesis.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Weekly Synthesis</h1>
                <p className="text-sm text-gray-600 mt-0.5">Wekelijkse AI trend rapporten</p>
              </div>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Vernieuwen
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Synthese Rapporten</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Elk rapport bevat: Executive Summary, Macro Trends, Implications, en Client Opportunities.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              Error: {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-gray-500">Rapporten laden...</p>
            </div>
          )}

          {/* Briefs List */}
          {!loading && briefs.length > 0 && (
            <div className="space-y-4">
              {briefs.map((brief) => (
                <div key={brief.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{brief.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {brief.week_label}
                        </span>
                        <span>{brief.start_date} — {brief.end_date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadMarkdown(brief)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download MD
                    </button>
                  </div>

                  {brief.executive_summary && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Executive Summary</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{brief.executive_summary}</p>
                    </div>
                  )}

                  {brief.macro_trends && brief.macro_trends.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Macro Trends ({brief.macro_trends.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {brief.macro_trends.slice(0, 5).map((trend: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {trend.trend || trend.title || `Trend ${i + 1}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && briefs.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Geen synthese rapporten beschikbaar.</p>
              <p className="text-xs text-gray-400 mt-1">Genereer een rapport om hier te beginnen.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
