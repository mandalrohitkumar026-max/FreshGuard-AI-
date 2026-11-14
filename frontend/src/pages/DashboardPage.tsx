import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { StatCard } from '../components/Dashboard/StatCard';
import { ActivityChart } from '../components/Dashboard/ActivityChart';
import { StatusDistribution } from '../components/Dashboard/StatusDistribution';
import { FreshnessDistributionChart } from '../components/Dashboard/FreshnessDistributionChart';
import { RecentActivityTable } from '../components/Dashboard/RecentActivityTable';
import { historyService } from '../api/historyService';
import { settingsService, IntegrationHealth } from '../api/settingsService';
import { DashboardStatistics, VerificationSession } from '../types/api.types';
import {
  ShieldCheck,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  PieChart,
  BarChart3,
  History,
  Cpu,
  Globe,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [sessions, setSessions] = useState<VerificationSession[]>([]);
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, sessionsData, healthData] = await Promise.all([
          historyService.getDashboardStatistics(),
          historyService.getSessions({ limit: 8 }),
          settingsService.getIntegrationHealth(),
        ]);
        setStats(statsData);
        setSessions(sessionsData.sessions);
        setHealth(healthData);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const total = stats?.totalVerifications ?? 0;
  const supportedPercent =
    stats && stats.claimsAnalyzed > 0
      ? Math.round((stats.supportedClaims / stats.claimsAnalyzed) * 100)
      : 0;
  const outdatedPercent =
    stats && stats.claimsAnalyzed > 0
      ? Math.round((stats.outdatedClaims / stats.claimsAnalyzed) * 100)
      : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Enterprise Freshness Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous monitoring of factual currency, temporal drift, and AI model hallucination.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Telemetry Active</span>
            </div>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
            >
              <FileSearch size={14} />
              <span>New Verification Audit</span>
            </Link>
          </div>
        </div>

        {/* Live Infrastructure Status Quick Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Cpu size={15} className="text-blue-600" />
            <span className="font-semibold text-slate-900">Infrastructure Health:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Bifrost */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.bifrost.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-500">Bifrost Gateway:</span>
              <span className="font-semibold text-slate-800">
                {health?.bifrost.status === 'CONNECTED' ? 'Active (:8080)' : 'Standby / Local'}
              </span>
              {health?.bifrost.latencyMs ? (
                <span className="text-[10px] text-slate-400 font-mono">({health.bifrost.latencyMs}ms)</span>
              ) : null}
            </div>

            {/* Tavily */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.tavily.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-teal-500'
                }`}
              />
              <span className="text-slate-500">Tavily Search:</span>
              <span className="font-semibold text-slate-800">
                {health?.tavily.status === 'CONNECTED' ? 'Connected' : 'Autonomous Engine'}
              </span>
            </div>

            {/* Storage */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Session Store:</span>
              <span className="font-semibold text-slate-800">Operational</span>
            </div>
          </div>

          <Link
            to="/settings"
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
          >
            <span>Diagnostics</span>
            <ArrowRight size={11} />
          </Link>
        </div>

        {/* 6 Key Enterprise Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            label="Total Audits"
            value={total}
            subtext="Sessions run"
            icon={<ShieldCheck size={16} />}
          />
          <StatCard
            label="Claims Scored"
            value={stats?.claimsAnalyzed ?? 0}
            subtext="Atomic assertions"
            icon={<FileSearch size={16} />}
          />
          <StatCard
            label="Verified Fresh"
            value={stats?.supportedClaims ?? 0}
            subtext={supportedPercent ? `${supportedPercent}% pass rate` : 'Confirmed current'}
            icon={<CheckCircle2 size={16} className="text-emerald-600" />}
          />
          <StatCard
            label="Outdated"
            value={stats?.outdatedClaims ?? 0}
            subtext={outdatedPercent ? `${outdatedPercent}% stale rate` : 'Stale assertions'}
            icon={<AlertTriangle size={16} className="text-rose-600" />}
          />
          <StatCard
            label="Unverified"
            value={stats?.unverifiedClaims ?? 0}
            subtext="Insufficient info"
            icon={<HelpCircle size={16} />}
          />
          <StatCard
            label="Avg Freshness"
            value={`${stats?.averageFreshnessScore ?? 0}%`}
            subtext="Portfolio score"
            icon={<TrendingUp size={16} className="text-blue-600" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analytics">
          {/* Activity Over Time (8 cols) */}
          <div className="lg:col-span-8 card space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Verification Volume & Velocity
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Past 7 days session volume</span>
            </div>
            <ActivityChart data={stats?.activityOverTime ?? []} />
          </div>

          {/* Status Distribution (4 cols) */}
          <div className="lg:col-span-4 card space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PieChart size={16} className="text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Claim Status Breakdown
                </h3>
              </div>
            </div>
            <StatusDistribution data={stats?.statusDistribution ?? []} />
          </div>

          {/* Freshness Distribution Buckets (6 cols) */}
          <div className="lg:col-span-6 card space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Freshness Score Distribution
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Audit scores grouped by bucket</span>
            </div>
            <FreshnessDistributionChart data={stats?.freshnessDistribution ?? []} />
          </div>

          {/* Risk Level Posture (6 cols) */}
          <div className="lg:col-span-6 card space-y-3 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Risk Posture Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Executive risk triage</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Fresh</span>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {stats?.riskDistribution?.FRESH ?? 0}
                </p>
                <span className="text-[10px] text-emerald-600">Safe to publish</span>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Stale</span>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {stats?.riskDistribution?.STALE ?? 0}
                </p>
                <span className="text-[10px] text-amber-600">Needs update</span>
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-lg text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Outdated</span>
                <p className="text-2xl font-bold text-rose-900 mt-1">
                  {stats?.riskDistribution?.OUTDATED ?? 0}
                </p>
                <span className="text-[10px] text-rose-600">High hallucination risk</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Unverifiable</span>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {stats?.riskDistribution?.UNVERIFIABLE ?? 0}
                </p>
                <span className="text-[10px] text-slate-500">Requires manual review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Verification Sessions
              </h3>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              <span>View Full History</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Sparkles size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  No verifications recorded yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Run your first AI answer audit in the workspace to populate real-time verification analytics and freshness intelligence.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/verify"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  <FileSearch size={14} />
                  <span>Launch First Verification</span>
                </Link>
              </div>
            </div>
          ) : (
            <RecentActivityTable sessions={sessions} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
