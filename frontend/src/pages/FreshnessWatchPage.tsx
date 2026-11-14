import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Button } from '../components/Common/Button';
import { Loader } from '../components/Common/Loader';
import { ErrorState } from '../components/Common/ErrorState';
import { RiskIndicator } from '../components/Verification/RiskIndicator';
import apiClient from '../api/apiClient';
import {
  Eye,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface FreshnessWatchItem {
  id: string;
  sessionId: string;
  title: string;
  topic?: string;
  frequency: string;
  active: boolean;
  baselineScore: number;
  currentScore: number;
  currentRiskLevel: string;
  lastCheckedAt: string;
  nextCheckAt: string;
  checkCount: number;
  alerts?: any[];
}

interface DriftAlertItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const FreshnessWatchPage: React.FC = () => {
  const [watches, setWatches] = useState<FreshnessWatchItem[]>([]);
  const [alerts, setAlerts] = useState<DriftAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWatchesAndAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [watchesRes, notifRes] = await Promise.all([
        apiClient.get('/watches'),
        apiClient.get('/notifications'),
      ]);

      if (watchesRes.data?.success && watchesRes.data.data) {
        setWatches(watchesRes.data.data.watches || []);
      }
      if (notifRes.data?.success && notifRes.data.data) {
        setAlerts(notifRes.data.data.notifications || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load freshness watches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchesAndAlerts();
  }, []);

  const handleTriggerRecheck = async (id: string) => {
    try {
      setActionLoading(`check-${id}`);
      await apiClient.post(`/watches/${id}/check`);
      await fetchWatchesAndAlerts();
    } catch (err) {
      console.error('Failed triggering recheck', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleWatch = async (id: string) => {
    try {
      setActionLoading(`toggle-${id}`);
      await apiClient.patch(`/watches/${id}/toggle`);
      await fetchWatchesAndAlerts();
    } catch (err) {
      console.error('Failed toggling watch state', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWatch = async (id: string) => {
    if (!window.confirm('Are you sure you want to stop monitoring this verification?')) return;
    try {
      setActionLoading(`delete-${id}`);
      await apiClient.delete(`/watches/${id}`);
      await fetchWatchesAndAlerts();
    } catch (err) {
      console.error('Failed deleting watch', err);
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = watches.filter((w) => w.active).length;
  const avgFreshness =
    watches.length > 0
      ? Math.round(watches.reduce((acc, w) => acc + w.currentScore, 0) / watches.length)
      : 100;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-24">
          <Loader label="Synchronizing autonomous Freshness Watch telemetry..." size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="py-20 max-w-xl mx-auto space-y-4">
          <ErrorState title="Freshness Watch Error" message={error} onRetry={fetchWatchesAndAlerts} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Eye size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Autonomous Freshness Watches
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real background scheduler continuously monitors AI answers for factual staleness drift against live web evidence.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchWatchesAndAlerts}
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
            <Link to="/verify">
              <Button size="sm" icon={<PlusCircle size={14} />}>
                Create New Watch
              </Button>
            </Link>
          </div>
        </div>

        {/* Macro KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Monitored
            </span>
            <div className="text-2xl font-black text-slate-900">{watches.length}</div>
            <span className="text-[11px] text-slate-500">Scheduled answer audits</span>
          </div>

          <div className="card p-4 space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Active Daemons
            </span>
            <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
            <span className="text-[11px] text-slate-500">Autonomous 30s checks</span>
          </div>

          <div className="card p-4 space-y-1">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Avg Current Score
            </span>
            <div className="text-2xl font-black text-blue-600">{avgFreshness}%</div>
            <span className="text-[11px] text-slate-500">Overall factual health</span>
          </div>

          <div className="card p-4 space-y-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
              Drift Notifications
            </span>
            <div className="text-2xl font-black text-rose-600">{alerts.length}</div>
            <span className="text-[11px] text-slate-500">Staleness shifts caught</span>
          </div>
        </div>

        {/* Active Watches List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              <span>Monitored Verification Sessions</span>
            </h2>
            <span className="text-xs text-slate-400">{watches.length} active schedule(s)</span>
          </div>

          {watches.length === 0 ? (
            <div className="card p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Eye size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Freshness Watches Scheduled</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Run a verification audit and click "Freshness Watch" to enable continuous background monitoring against live Tavily evidence.
                </p>
              </div>
              <Link to="/verify">
                <Button size="sm">Run First Verification</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {watches.map((w) => {
                const isChecking = actionLoading === `check-${w.id}`;
                const isToggling = actionLoading === `toggle-${w.id}`;
                const scoreDiff = w.currentScore - w.baselineScore;

                return (
                  <div
                    key={w.id}
                    className={`card p-5 space-y-4 transition-all border ${
                      w.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/verification/${w.sessionId}`}
                            className="font-bold text-sm text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5"
                          >
                            <span>{w.title}</span>
                            <ExternalLink size={12} className="text-slate-400" />
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              w.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {w.active ? 'Monitoring Active' : 'Paused'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                            {w.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-xl">
                          Session {w.sessionId.slice(0, 8)} • Checked {w.checkCount} times
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTriggerRecheck(w.id)}
                          disabled={isChecking}
                          icon={<RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />}
                        >
                          {isChecking ? 'Auditing...' : 'Check Now'}
                        </Button>

                        <button
                          onClick={() => handleToggleWatch(w.id)}
                          disabled={isToggling}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                          title={w.active ? 'Pause Monitoring' : 'Resume Monitoring'}
                        >
                          {w.active ? <Pause size={14} /> : <Play size={14} className="text-emerald-600" />}
                        </button>

                        <button
                          onClick={() => handleDeleteWatch(w.id)}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition"
                          title="Delete Watch"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Current Freshness
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-base font-extrabold text-slate-900">
                            {w.currentScore}%
                          </span>
                          {scoreDiff !== 0 && (
                            <span
                              className={`flex items-center text-[11px] font-bold ${
                                scoreDiff > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {scoreDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {scoreDiff > 0 ? `+${scoreDiff}%` : `${scoreDiff}%`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Risk Classification
                        </span>
                        <div className="mt-0.5">
                          <RiskIndicator risk={w.currentRiskLevel as any} size="sm" />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Last Checked
                        </span>
                        <span className="text-slate-700 font-medium mt-0.5 block">
                          {new Date(w.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(w.lastCheckedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Next Scheduled Run
                        </span>
                        <span className="text-blue-700 font-medium mt-0.5 block">
                          {new Date(w.nextCheckAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(w.nextCheckAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Change Notifications & Drift Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BellRing size={16} className="text-rose-600" />
                <span>Freshness Drift Alerts & Notifications</span>
              </h2>
              <span className="text-xs text-slate-400">{alerts.length} event(s) logged</span>
            </div>

            <div className="card divide-y divide-slate-100 overflow-hidden">
              {alerts.map((al) => (
                <div key={al.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/70 transition">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 mt-0.5 shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{al.title}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(al.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{al.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
