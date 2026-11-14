import React from 'react';
import { Link } from 'react-router-dom';
import { VerificationSession } from '../../types/api.types';
import { RiskIndicator } from '../Verification/RiskIndicator';
import { ArrowRight, Clock, FileCheck } from 'lucide-react';

export interface RecentActivityTableProps {
  sessions: VerificationSession[];
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ sessions }) => {
  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No recent verification activity recorded.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-3 px-4">Session ID</th>
            <th className="py-3 px-4">Verification Subject / Title</th>
            <th className="py-3 px-4 text-center">Claims</th>
            <th className="py-3 px-4">Freshness Status</th>
            <th className="py-3 px-4 text-center">Score</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sessions.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">
                {s.id}
              </td>
              <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                {s.title}
              </td>
              <td className="py-3.5 px-4 text-center text-slate-600">
                {s.totalClaims}
                {s.staleClaims > 0 && (
                  <span className="text-amber-600 text-[10px] ml-1">
                    ({s.staleClaims} stale)
                  </span>
                )}
              </td>
              <td className="py-3.5 px-4">
                <RiskIndicator risk={s.riskLevel} size="sm" />
              </td>
              <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                {s.aggregateFreshnessScore}/100
              </td>
              <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                {new Date(s.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3.5 px-4 text-right">
                <Link
                  to={`/verification/${s.reportId || s.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  <span>Report</span>
                  <ArrowRight size={12} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
