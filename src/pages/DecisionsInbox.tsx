import Navigation from '../components/Navigation';
import { Inbox, Filter, RefreshCw, AlertCircle, CheckCircle, Eye, Zap } from 'lucide-react';
import { useDecisionAssessments } from '../hooks/useSupabase';
import { useState } from 'react';

export default function DecisionsInbox() {
  const { decisions, loading, error, refresh } = useDecisionAssessments();
  const [actionFilter, setActionFilter] = useState('all');
  const [horizonFilter, setHorizonFilter] = useState('all');

  const filteredDecisions = decisions.filter(d => {
    if (actionFilter !== 'all' && d.action_required !== actionFilter) return false;
    if (horizonFilter !== 'all' && d.impact_horizon !== horizonFilter) return false;
    return true;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ignore': return 'bg-gray-100 text-gray-700';
      case 'monitor': return 'bg-blue-100 text-blue-700';
      case 'experiment': return 'bg-amber-100 text-amber-700';
      case 'integrate': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'direct': return '0-2 weeks';
      case 'mid': return '1-3 months';
      case 'long': return '6+ months';
      default: return horizon;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Decision Inbox</h1>
              <p className="text-sm text-gray-600 mt-0.5">Articles awaiting human decision</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{decisions.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Actions</option>
                <option value="ignore">Ignore</option>
                <option value="monitor">Monitor</option>
                <option value="experiment">Experiment</option>
                <option value="integrate">Integrate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Horizon</label>
              <select
                value={horizonFilter}
                onChange={(e) => setHorizonFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Horizons</option>
                <option value="direct">Direct (0-2 weeks)</option>
                <option value="mid">Mid-term (1-3 months)</option>
                <option value="long">Long-term (6+ months)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setActionFilter('all'); setHorizonFilter('all'); }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Error: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-gray-500">Loading decisions...</p>
          </div>
        )}

        {/* Decisions List */}
        {!loading && filteredDecisions.length > 0 && (
          <div className="space-y-3">
            {filteredDecisions.map((decision) => (
              <div key={decision.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getActionColor(decision.action_required)}`}>
                        {decision.action_required.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Horizon: {getHorizonLabel(decision.impact_horizon)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {decision.confidence}/5
                      </span>
                    </div>

                    {decision.risk_if_ignored && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Risk if ignored:</strong> {decision.risk_if_ignored}
                      </p>
                    )}

                    {decision.advantage_if_early && (
                      <p className="text-sm text-gray-600">
                        <strong>Advantage if early:</strong> {decision.advantage_if_early}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {decision.destination && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                        → {decision.destination.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDecisions.length === 0 && (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {decisions.length === 0 ? 'No pending decisions.' : 'No decisions match the current filters.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {decisions.length === 0 ? 'Run a scan to populate the inbox.' : 'Try adjusting your filters.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
