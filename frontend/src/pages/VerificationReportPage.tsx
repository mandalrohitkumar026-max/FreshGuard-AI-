import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { ClaimCard } from '../components/Verification/ClaimCard';
import { AnswerComparison } from '../components/Verification/AnswerComparison';
import { ReliabilityRiskMap } from '../components/Verification/ReliabilityRiskMap';
import { FreshnessWatchModal } from '../components/Verification/FreshnessWatchModal';
import { AnswerEvolutionTracker, EvolutionData } from '../components/Verification/AnswerEvolutionTracker';
import { FreshnessScore } from '../components/Verification/FreshnessScore';
import { RiskIndicator } from '../components/Verification/RiskIndicator';
import { Button } from '../components/Common/Button';
import { Loader } from '../components/Common/Loader';
import { ErrorState } from '../components/Common/ErrorState';
import { verificationService } from '../api/verificationService';
import apiClient from '../api/apiClient';
import { VerificationReport } from '../types/api.types';
import {
  Share2,
  Calendar,
  Clock,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  ShieldAlert,
  FileCheck,
  Check,
  Printer,
  Download,
  ArrowRight,
  Sparkles,
  HelpCircle,
  LayoutDashboard,
  History,
  Eye,
  ShieldCheck,
  GitCommit,
  Layers,
  Activity,
} from 'lucide-react';

export const VerificationReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingAudit, setDownloadingAudit] = useState(false);

  // Advanced Expansion State
  const [activeTab, setActiveTab] = useState<'claims' | 'risk_map' | 'evolution'>('claims');
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [watchActive, setWatchActive] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await verificationService.getReport(id);
        setReport(data);

        // Check if evolution data is available
        try {
          const evoRes = await apiClient.get(`/verification/${id}/evolution?parentSessionId=${id}`);
          if (evoRes.data?.success && evoRes.data.data) {
            setEvolutionData(evoRes.data.data);
          }
        } catch {
          // No parent version linked
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve verification audit report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleShare = async () => {
    if (!id) return;
    try {
      const shareData = await verificationService.shareReport(id);
      const url = `${window.location.origin}${shareData.shareUrl}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAuditTrail = async () => {
    if (!id) return;
    try {
      setDownloadingAudit(true);
      const res = await apiClient.get(`/verification/${id}/audit-trail`);
      if (res.data?.success && res.data.data) {
        const jsonStr = JSON.stringify(res.data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `freshguard-audit-${id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
      }
    } catch (err) {
      console.error('Failed to export audit package', err);
    } finally {
      setDownloadingAudit(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-24">
          <Loader label="Retrieving live verification audit telemetry..." size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="py-20 max-w-xl mx-auto space-y-4">
          <ErrorState
            title="Verification Report Not Located"
            message={error || 'Could not locate the requested audit session.'}
          />
          <div className="flex items-center justify-center gap-3">
            <Link to="/verify">
              <Button size="sm">Run New Verification</Button>
            </Link>
            <Link to="/history">
              <Button variant="secondary" size="sm">Audit History</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const correctedText = report.correctedAnswer || report.suggestedAnswer;
  const hasCorrection = report.hasCorrectedAnswer || (report.summary.staleClaims > 0 && Boolean(correctedText));

  // Compute breakdown counts across canonical statuses
  let supportedCount = 0;
  let outdatedCount = 0;
  let partialCount = 0;
  let notCheckedCount = 0;
  let unverifiedCount = 0;

  report.claims.forEach((c) => {
    if (c.verdict === 'CONFIRMS') {
      if (c.timeSensitivity === 'STATIC') notCheckedCount++;
      else supportedCount++;
    } else if (c.verdict === 'CONTRADICTS') {
      outdatedCount++;
    } else if (c.verdict === 'PARTIALLY_CONTRADICTS') {
      partialCount++;
    } else {
      unverifiedCount++;
    }
  });

  const hasFactorData = report.claims.some((c) => c.factors);
  const avgFactors = hasFactorData
    ? {
        temporal: Math.round(
          report.claims.reduce((s, c) => s + (c.factors?.temporalRelevance ?? 100), 0) /
            (report.claims.length || 1),
        ),
        recency: Math.round(
          report.claims.reduce((s, c) => s + (c.factors?.evidenceRecency ?? 100), 0) /
            (report.claims.length || 1),
        ),
        quality: Math.round(
          report.claims.reduce((s, c) => s + (c.factors?.evidenceQuality ?? 100), 0) /
            (report.claims.length || 1),
        ),
        outcome: Math.round(
          report.claims.reduce((s, c) => s + (c.factors?.verificationOutcome ?? 100), 0) /
            (report.claims.length || 1),
        ),
        uncertainty: Math.round(
          report.claims.reduce((s, c) => s + (c.factors?.uncertainty ?? 100), 0) /
            (report.claims.length || 1),
        ),
      }
    : null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-7">
        {/* Top Breadcrumb & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
              <Link
                to="/history"
                className="inline-flex items-center gap-1 font-medium hover:text-slate-900 transition"
              >
                <ChevronLeft size={14} />
                <span>Audit History</span>
              </Link>
              <span>/</span>
              <span className="font-mono text-[11px] text-slate-400">Session {report.id.slice(0, 8)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Answer Freshness Audit Report
              </h1>
              <RiskIndicator risk={report.summary.riskLevel} size="md" />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                {new Date(report.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                Processing Time: {(report.summary.processingTimeMs / 1000).toFixed(1)}s
              </span>
              {report.summary.modelUsed && (
                <>
                  <span>•</span>
                  <span className="font-medium text-slate-600">{report.summary.modelUsed}</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons (Section E: Report Actions) */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto no-print">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWatchModalOpen(true)}
              icon={<Eye size={14} className={watchActive ? 'text-emerald-600' : 'text-blue-600'} />}
            >
              {watchActive ? 'Watch Active' : 'Freshness Watch'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadAuditTrail}
              disabled={downloadingAudit}
              icon={<ShieldCheck size={14} className="text-teal-600" />}
            >
              {downloadingAudit ? 'Compiling...' : 'Audit Log (SHA-256)'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer size={14} />}
            >
              Export PDF
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              icon={copiedLink ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            >
              {copiedLink ? 'Link Copied!' : 'Share'}
            </Button>

            <Link to="/verify">
              <Button size="sm">New Audit</Button>
            </Link>
          </div>
        </div>

        {/* Section A: Executive Summary Card */}
        <div className="card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-5 md:pb-0">
            <FreshnessScore
              score={report.summary.aggregateFreshnessScore}
              size="lg"
              showBreakdown
            />
          </div>

          <div className="md:col-span-8 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audit Executive Summary
              </span>
              <p className="text-sm text-slate-800 leading-relaxed mt-1 font-sans">
                {outdatedCount > 0
                  ? `Out of ${report.summary.totalClaims} atomic claims extracted, ${outdatedCount} were identified as outdated and contradicted by live official records. A grounded correction has been generated below.`
                  : `All ${report.summary.totalClaims} extracted factual claims were verified as accurate or confirmed by current authoritative web documentation.`}
              </p>
            </div>

            {/* 6-Category KPI Breakdown Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Total</span>
                <span className="text-lg font-extrabold text-slate-900">{report.summary.totalClaims}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase">Supported</span>
                <span className="text-lg font-extrabold text-emerald-800">{supportedCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/80">
                <span className="block text-[10px] font-bold text-rose-700 uppercase">Outdated</span>
                <span className="text-lg font-extrabold text-rose-800">{outdatedCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80">
                <span className="block text-[10px] font-bold text-amber-700 uppercase">Partial</span>
                <span className="text-lg font-extrabold text-amber-800">{partialCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-600 uppercase">Unverified</span>
                <span className="text-lg font-extrabold text-slate-700">{unverifiedCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200/80">
                <span className="block text-[10px] font-bold text-blue-700 uppercase">Permanent</span>
                <span className="text-lg font-extrabold text-blue-800">{notCheckedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 10: Deterministic 5-Factor Score Decomposition Macro Card */}
        {avgFactors && (
          <div className="card p-5 space-y-3 bg-gradient-to-r from-white via-slate-50/50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Deterministic 5-Factor Freshness Decomposition
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mathematical aggregation weighted by claim time-volatility & evidence provenance
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto">
                Engine v2.0
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Temporal (20%)</span>
                  <span className="text-xs font-extrabold text-blue-600">{avgFactors.temporal}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${avgFactors.temporal}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Sensitivity weight</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Recency (25%)</span>
                  <span className="text-xs font-extrabold text-emerald-600">{avgFactors.recency}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${avgFactors.recency}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Decay half-life</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Quality (25%)</span>
                  <span className="text-xs font-extrabold text-purple-600">{avgFactors.quality}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${avgFactors.quality}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Domain & corroboration</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Outcome (20%)</span>
                  <span className={`text-xs font-extrabold ${avgFactors.outcome >= 75 ? 'text-emerald-600' : avgFactors.outcome >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {avgFactors.outcome}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${avgFactors.outcome >= 75 ? 'bg-emerald-600' : avgFactors.outcome >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${avgFactors.outcome}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Verdict alignment</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Confidence (10%)</span>
                  <span className="text-xs font-extrabold text-indigo-600">{avgFactors.uncertainty}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${avgFactors.uncertainty}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Epistemic certainty</span>
              </div>
            </div>
          </div>
        )}

        {/* Section D: Grounded Correction Panel (if stale claims exist) */}
        {hasCorrection && correctedText && (
          <AnswerComparison
            originalAnswer={report.originalAnswer}
            suggestedAnswer={correctedText}
            explanation={report.correctionExplanation}
            citations={report.topSources.map((s, i) => ({
              index: i + 1,
              url: s.url,
              title: s.title,
              domain: s.domain,
            }))}
          />
        )}

        {/* Advanced Intelligence Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 no-print text-xs">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'claims'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} className="text-blue-600" />
            <span>Claim Deep-Dive ({report.claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('risk_map')}
            className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'risk_map'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={14} className="text-rose-600" />
            <span>Reliability Risk Map</span>
          </button>

          {evolutionData && (
            <button
              onClick={() => setActiveTab('evolution')}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'evolution'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCommit size={14} className="text-emerald-600" />
              <span>Answer Evolution Trajectory</span>
            </button>
          )}
        </div>

        {/* Tab 1: Claim-Level Verification Breakdown */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Claim-by-Claim Verification Analysis
              </h2>
              <span className="text-xs text-slate-500">
                {report.claims.length} atomic statements audited against live Tavily evidence
              </span>
            </div>

            <div className="space-y-3">
              {report.claims.map((claim, idx) => (
                <ClaimCard key={claim.id || idx} claim={claim} defaultExpanded={idx === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: AI Reliability Risk Map */}
        {activeTab === 'risk_map' && (
          <ReliabilityRiskMap claims={report.claims} />
        )}

        {/* Tab 3: Answer Evolution Tracker */}
        {activeTab === 'evolution' && evolutionData && (
          <AnswerEvolutionTracker evolution={evolutionData} />
        )}

        {/* Authoritative Web Sources Consulted */}
        {report.topSources && report.topSources.length > 0 && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Primary Web Sources Consulted
              </h3>
              <span className="text-[11px] text-slate-400">Classified by Domain Authority</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.topSources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 transition flex items-start justify-between group shadow-2xs"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition truncate block">
                      {source.title || source.domain}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">{source.domain}</span>
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-blue-700 border border-slate-200 uppercase">
                      {source.authorityTier || 'HIGH'} TIER
                    </span>
                  </div>
                  <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Section E: Navigation & Return Shortcuts */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 no-print">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <LayoutDashboard size={14} />
            <span>Return to Intelligence Dashboard</span>
          </Link>

          <Link
            to="/history"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <span>View All Previous Audits</span>
            <History size={14} />
          </Link>
        </div>

        {/* Freshness Watch Activation Modal */}
        <FreshnessWatchModal
          sessionId={report.id}
          isOpen={watchModalOpen}
          onClose={() => setWatchModalOpen(false)}
          onWatchCreated={() => setWatchActive(true)}
        />
      </div>
    </DashboardLayout>
  );
};
