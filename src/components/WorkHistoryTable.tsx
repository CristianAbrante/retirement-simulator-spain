"use client";

import type { WorkPeriod } from "@/lib/types";

interface WorkHistoryTableProps {
  workPeriods: WorkPeriod[];
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function WorkHistoryTable({
  workPeriods,
}: WorkHistoryTableProps) {
  const totalDays = workPeriods.reduce((sum, period) => sum + period.days, 0);

  return (
    <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Historial Laboral
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          {workPeriods.length} períodos de trabajo
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Fecha Alta
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Fecha Baja
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Grupo Cot.
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Días
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {workPeriods.map((period, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900 truncate max-w-xs">
                    {period.companyName}
                  </div>
                  {period.companyCode && (
                    <div className="text-xs text-slate-500 font-mono">
                      {period.companyCode}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">
                    {formatDate(period.startDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {period.endDate ? (
                    <div className="text-sm text-slate-900">
                      {formatDate(period.endDate)}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Activo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono text-slate-900">
                    {period.contributionGroup || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-slate-900">
                    {period.days.toLocaleString("es-ES")}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-300">
            <tr>
              <td
                colSpan={4}
                className="px-6 py-4 text-sm font-semibold text-slate-900 text-right"
              >
                Total de días:
              </td>
              <td className="px-6 py-4 text-right">
                <div className="text-base font-bold text-blue-900">
                  {totalDays.toLocaleString("es-ES")}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
