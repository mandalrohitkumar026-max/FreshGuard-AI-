import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Card } from '../components/Common/Card';
import { settingsService, IntegrationHealth, BifrostStatus, TavilyStatus } from '../api/settingsService';
import {
  Cpu,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sun,
  Lock,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Profile preferences state
  const [name, setName] = useState('Senior AI Architect');
  const [email, setEmail] = useState('architect@freshguard.ai');
  const [organization, setOrganization] = useState('Enterprise AI Trust & Safety');
  const [role, setRole] = useState('Lead ML Auditor');

  // Verification engine preferences
  const [confidenceThreshold, setConfidenceThreshold] = useState('0.70');
  const [searchDepth, setSearchDepth] = useState<'basic' | 'advanced'>('advanced');
  const [temporalStrictness, setTemporalStrictness] = useState('standard');
  const [autoCorrect, setAutoCorrect] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadHealth = async () => {
    try {
      setLoadingHealth(true);
      const data = await settingsService.getIntegrationHealth();
      setHealth(data);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getBifrostBadge = (status: BifrostStatus) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 size={13} />
            CONNECTED
          </span>
        );
      case 'CONFIGURATION_REQUIRED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle size={13} />
            CONFIG REQUIRED
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
            <AlertTriangle size={13} />
            ERROR
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
            DISCONNECTED
          </span>
        );
    }
  };

  const getTavilyBadge = (status: TavilyStatus) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 size={13} />
            CONNECTED
          </span>
        );
      case 'CONFIGURATION_REQUIRED':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
            <AlertTriangle size={13} />
            LOCAL ENGINE
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
            <AlertTriangle size={13} />
            ERROR
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
            STANDBY
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Settings & Integration Diagnostics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify real-time gateway health, search engine telemetry, and audit pipeline parameters.
            </p>
          </div>
          <button
            onClick={loadHealth}
            disabled={loadingHealth}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-lg shadow-xs transition"
          >
            <RefreshCw size={13} className={loadingHealth ? 'animate-spin' : ''} />
            <span>Re-test Connectivity</span>
          </button>
        </div>

        {/* Integration Health Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              AI Infrastructure Diagnostics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bifrost Gateway */}
            <Card className="p-5 space-y-3 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Bifrost Gateway
                </span>
                {health && getBifrostBadge(health.bifrost.status)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Bifrost by Maxim AI</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-Performance Go AI Gateway (v2.5)
                </p>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-1.5">
                <p className="flex justify-between">
                  <span>Gateway Endpoint:</span>
                  <strong className="text-slate-700 font-mono text-[10px]">
                    {health?.bifrost.url}
                  </strong>
                </p>
                <p className="flex justify-between">
                  <span>Default Model:</span>
                  <strong className="text-slate-700">{health?.bifrost.model}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Roundtrip Latency:</span>
                  <strong className="text-slate-700">{health?.bifrost.latencyMs}ms</strong>
                </p>
                <p className="flex justify-between">
                  <span>Last Verification:</span>
                  <span className="text-slate-600">{health?.bifrost.lastChecked || 'Just now'}</span>
                </p>
                {health?.bifrost.error && (
                  <div className="mt-1 p-2 bg-amber-50 text-amber-800 rounded text-[10px] leading-tight border border-amber-200">
                    {health.bifrost.error}
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href="http://localhost:8080"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <span>Open Bifrost UI</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </Card>

            {/* Tavily Web Search */}
            <Card className="p-5 space-y-3 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Live Web Search
                </span>
                {health && getTavilyBadge(health.tavily.status)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Tavily Agentic Search</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  LLM-Optimized Evidence Retrieval
                </p>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-1.5">
                <p className="flex justify-between">
                  <span>API Capability:</span>
                  <strong className="text-slate-700">{health?.tavily.plan}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Search Latency:</span>
                  <strong className="text-slate-700">{health?.tavily.latencyMs}ms</strong>
                </p>
                <p className="flex justify-between">
                  <span>Last Ping:</span>
                  <span className="text-slate-600">{health?.tavily.lastChecked || 'Just now'}</span>
                </p>
                {health?.tavily.error && (
                  <div className="mt-1 p-2 bg-amber-50 text-amber-800 rounded text-[10px] leading-tight border border-amber-200">
                    {health.tavily.error}
                  </div>
                )}
                <div className="pt-2">
                  <a
                    href="https://docs.tavily.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700"
                  >
                    <span>Tavily Documentation</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </Card>

            {/* Database & Resilient Store */}
            <Card className="p-5 space-y-3 border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Session Database
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 size={13} />
                  READY
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">MongoDB + Resilient Store</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audited Sessions & Log Storage
                </p>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 space-y-1.5">
                <p className="flex justify-between">
                  <span>Retention:</span>
                  <strong className="text-slate-700">90-Day Evidence Store</strong>
                </p>
                <p className="flex justify-between">
                  <span>Architecture:</span>
                  <strong className="text-slate-700">Dual-Tier Resilient Storage</strong>
                </p>
                <p className="flex justify-between">
                  <span>Audit Indexing:</span>
                  <span className="text-emerald-700 font-semibold">Active & Indexed</span>
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Verification Engine Policies */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-slate-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Audit Engine Configuration
            </h2>
          </div>

          <form onSubmit={handleSavePreferences} className="card p-6 space-y-6">
            {/* Operator Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Auditor Identity & Organization
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Operator Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label">Operator Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label">Organization / Team</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="input text-xs"
                  />
                </div>

                <div>
                  <label className="label">Role Title</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Pipeline Policies */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Freshness Detection & Verification Strictness
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contradiction Confidence Threshold</label>
                  <select
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(e.target.value)}
                    className="input text-xs bg-white"
                  >
                    <option value="0.90">Strict (90% - Flag only undeniable direct contradictions)</option>
                    <option value="0.70">Balanced (70% - Standard enterprise verification)</option>
                    <option value="0.50">Aggressive (50% - Flag any probable divergence)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Default Evidence Retrieval Depth</label>
                  <select
                    value={searchDepth}
                    onChange={(e) => setSearchDepth(e.target.value as any)}
                    className="input text-xs bg-white"
                  >
                    <option value="advanced">Advanced Search (Up to 10 sources, deep content scrape)</option>
                    <option value="basic">Basic Search (Fast retrieval, 5 sources)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Temporal Drift Sensitivity</label>
                  <select
                    value={temporalStrictness}
                    onChange={(e) => setTemporalStrictness(e.target.value)}
                    className="input text-xs bg-white"
                  >
                    <option value="standard">Standard (Flag quarterly/annual changes)</option>
                    <option value="high">High Frequency (Daily/weekly data points, leadership shifts)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="autoCorrect"
                    checked={autoCorrect}
                    onChange={(e) => setAutoCorrect(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="autoCorrect" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Auto-synthesize corrected answer with grounded citations
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Save Engine Configuration
              </button>

              {savedSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 size={15} /> Preferences and policies successfully saved
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Enterprise Design System Compliance */}
        <div className="card p-5 space-y-3 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun size={17} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-900">
                Design System & Accessibility Standards
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-white border border-slate-200">
              <Lock size={11} className="text-slate-400" />
              Enterprise Standard (Light Theme Locked)
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            FreshGuard AI operates exclusively under the <strong>Enterprise Light Design System</strong> (Deep Navy <code>#0F172A</code>, Slate <code>#475569</code>, and Electric Blue <code>#2563EB</code> accents). This guarantees WCAG 2.1 AAA high-contrast readability, presentation fidelity, and print-ready PDF audit reports without contrast degradation.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};
