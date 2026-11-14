import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { historyService, HistoryFilterParams } from '../api/historyService';
import { VerificationSession } from '../types/api.types';
import { RiskIndicator } from '../components/Verification/RiskIndicator';
import { Button } from '../components/Common/Button';
import { Loader } from '../components/Common/Loader';
import { EmptyState } from '../components/Common/EmptyState';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowRight,
  Calendar,
  FileCheck2,
  RefreshCw,
  X,
  FileSearch,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<VerificationSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<HistoryFilterParams['sortBy']>('date_desc');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await historyService.getSessions({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        sortBy,
        limit: 50,
      });
      setSessions(res.sessions);
      setTotalCount(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortBy('date_desc');
    // will trigger useEffect due to statusFilter/sortBy change or if unchanged fetchHistory
    setTimeout(() => fetchHistory(), 10);
  };

  const freshCount = sessions.filter((s) => s.riskLevel === 'FRESH').length;
  const staleCount = sessions.filter(
    (s) => s.riskLevel === 'STALE' || s.riskLevel === 'OUTDATED'
  ).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Verification Audit History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and inspect previously audited AI answers, freshness scores, and evidence logs.
            </p>
          </div>

          <Link to="/verify">
            <Button size="sm" className="inline-flex items-center gap-1.5">
              <FileSearch size={14} />
              <span>New Audit</span>
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar Card */}
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input (6 cols) */}
            <form onSubmit={handleSearchSubmit} className="sm:col-span-6 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by topic, answer keywords, or prompt..."
                className="input pl-9 pr-9 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setTimeout(() => fetchHistory(), 10);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Status Filter (3 cols) */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input text-xs bg-white cursor-pointer"
              >
                <option value="ALL">All Risk Categories</option>
                <option value="FRESH">Verified Fresh</option>
                <option value="STALE">Potentially Stale</option>
                <option value="OUTDATED">Significantly Outdated</option>
                <option value="UNVERIFIABLE">Unverifiable</option>
              </select>
            </div>

            {/* Sort Filter (3 cols) */}
            <div className="sm:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input text-xs bg-white cursor-pointer"
              >
                <option value="date_desc">Sort: Newest First</option>
                <option value="date_asc">Sort: Oldest First</option>
                <option value="score_desc">Sort: Highest Score</option>
                <option value="score_asc">Sort: Lowest Score</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                Matching Audits: <strong className="text-slate-800">{sessions.length}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck size={13} />
                <span>Verified Fresh:</span>
                <strong>{freshCount}</strong>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-rose-700">
                <AlertTriangle size={13} />
                <span>Stale / Outdated:</span>
                <strong>{staleCount}</strong>
              </span>
            </div>

            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Reset active filters
              </button>
            )}
          </div>
        </div>

        {/* Session List Table */}
        <div className="card p-0 overflow-hidden shadow-card">
          {loading ? (
            <div className="py-16">
              <Loader label="Loading audit history..." />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileSearch size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'No matching verification records'
                    : 'No verification sessions recorded yet'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'ALL'
                    ? 'No audit records matched your current query or filter parameters. Try adjusting your search term or status filter.'
                    : 'Your historical audit records will appear here after you verify AI answers in the workspace.'}
                </p>
              </div>
              <div className="pt-2">
                {searchTerm || statusFilter !== 'ALL' ? (
                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <span>Reset Filters</span>
                  </button>
                ) : (
                  <Link
                    to="/verify"
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <Sparkles size={14} />
                    <span>Run First Verification</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Session ID</th>
                    <th className="py-3 px-4">Answer Subject / Topic</th>
                    <th className="py-3 px-4">Risk Status</th>
                    <th className="py-3 px-4 text-center">Freshness</th>
                    <th className="py-3 px-4 text-center">Claims</th>
                    <th className="py-3 px-4">Audited Date</th>
                    <th className="py-3 px-4 text-right">Audit Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500 text-[11px]">
                        {session.id.slice(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 max-w-sm">
                        <div className="line-clamp-1">{session.title}</div>
                        {session.topic && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Topic: {session.topic}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskIndicator risk={session.riskLevel} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                            session.aggregateFreshnessScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : session.aggregateFreshnessScore >= 50
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {session.aggregateFreshnessScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {session.totalClaims}
                        {session.staleClaims > 0 && (
                          <span className="text-rose-600 text-[10px] ml-1 font-semibold">
                            ({session.staleClaims} stale)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(session.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/verification/${session.reportId || session.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition text-xs"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
