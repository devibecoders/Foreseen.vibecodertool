import Navigation from '../components/Navigation';
import { Inbox, Filter, Clock, Target, ChevronRight } from 'lucide-react';

export default function DecisionsInbox() {
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
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
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
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="all">All Actions</option>
                <option value="ignore">Ignore</option>
                <option value="monitor">Monitor</option>
                <option value="experiment">Experiment</option>
                <option value="integrate">Integrate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Horizon</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="all">All Horizons</option>
                <option value="direct">Direct (0-2 weeks)</option>
                <option value="mid">Mid-term (1-3 months)</option>
                <option value="long">Long-term (6+ months)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Min Confidence</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="0">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-24 bg-white border border-slate-200 rounded-xl">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No pending decisions.</p>
          <p className="text-xs text-gray-400 mt-1">Run a scan to populate the inbox.</p>
        </div>
      </main>
    </div>
  );
}
