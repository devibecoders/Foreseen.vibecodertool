'use client'

interface Implication {
  action: string
  effort: 'S' | 'M' | 'L'
  impact: 'High' | 'Medium' | 'Low'
  rationale: string
  next_step: string
}

interface ImplicationsTableProps {
  implications: Implication[]
}

export default function ImplicationsTable({ implications }: ImplicationsTableProps) {
  const getEffortBadge = (effort: string) => {
    const styles = {
      'S': 'bg-success-100 text-success-700 border-success-200',
      'M': 'bg-warning-100 text-warning-700 border-warning-200',
      'L': 'bg-danger-100 text-danger-700 border-danger-200',
    }
    return styles[effort as keyof typeof styles] || styles['M']
  }

  const getImpactBadge = (impact: string) => {
    const styles = {
      'High': 'bg-success-100 text-success-700 border-success-200',
      'Medium': 'bg-warning-100 text-warning-700 border-warning-200',
      'Low': 'bg-slate-100 text-slate-700 border-slate-200',
    }
    return styles[impact as keyof typeof styles] || styles['Medium']
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto break-inside-avoid">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                Action
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 w-20">
                Effort
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 w-24">
                Impact
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                Rationale
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                Next Step
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {implications.map((impl, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {impl.action}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getEffortBadge(impl.effort)}`}>
                    {impl.effort}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getImpactBadge(impl.impact)}`}>
                    {impl.impact}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {impl.rationale}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {impl.next_step}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {implications.map((impl, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm break-inside-avoid">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 flex-1">{impl.action}</h4>
              <div className="flex gap-2 ml-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${getEffortBadge(impl.effort)}`}>
                  {impl.effort}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${getImpactBadge(impl.impact)}`}>
                  {impl.impact}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Rationale</p>
                <p className="text-sm text-gray-700">{impl.rationale}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Next Step</p>
                <p className="text-sm text-gray-700">{impl.next_step}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
