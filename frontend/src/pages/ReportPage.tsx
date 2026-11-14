import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportApi } from '../api/verifyApi';
import { Report } from '../types/api.types';
import { FreshnessScoreDial } from '../components/FreshnessScoreDial';
import { RiskBadge } from '../components/RiskBadge';
import { ClaimsTable } from '../components/ClaimsTable';
import { CorrectedAnswerPanel } from '../components/CorrectedAnswerPanel';
import {
  Share2,
  Clock,
  ExternalLink,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!reportId) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await reportApi.getReport(reportId);
        if (res.success && res.data) {
          setReport(res.data);
          if (res.data.isPublic && res.data.publicSlug) {
            setShareUrl(`${window.location.origin}/reports/public/${res.data.publicSlug}`);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const handleShare = async () => {
    if (!reportId) return;
    try {
      const res = await reportApi.shareReport(reportId);
      if (res.success && res.data?.publicSlug) {
        const url = `${window.location.origin}/reports/public/${res.data.publicSlug}`;
        setShareUrl(url);
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch {
      // share fallback
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading audit report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-red-400 text-sm">{error || 'Report not found'}</p>
        <Link to="/" className="btn-secondary text-xs inline-block">
          Return to Verification
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition mb-1"
          >
            <ChevronLeft size={14} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Verification Audit Report
            </h1>
            <RiskBadge risk={report.summary.riskLevel} size="md" />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(report.createdAt).toLocaleString()}
            </span>
            <span>Latency: {(report.summary.processingTimeMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 btn-secondary text-xs py-2 px-3.5"
          >
            {copiedShare ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span>{copiedShare ? 'Copied Public Link!' : shareUrl ? 'Copy Share Link' : 'Generate Public Link'}</span>
          </button>
          <Link to="/" className="btn-primary text-xs py-2 px-3.5">
            New Verification
          </Link>
        </div>
      </div>

      {/* Summary Score Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gray-900 border-gray-800 flex items-center justify-center p-4">
          <FreshnessScoreDial score={report.summary.aggregateFreshnessScore} size="md" />
        </div>

        <div className="card bg-gray-900 border-gray-800 p-4 space-y-1">
          <span className="text-xs text-gray-500">Total Claims Analyzed</span>
          <div className="text-2xl font-bold text-white">{report.summary.totalClaims}</div>
          <p className="text-[11px] text-gray-400">Atomic factual assertions</p>
        </div>

        <div className="card bg-gray-900 border-gray-800 p-4 space-y-1">
          <span className="text-xs text-gray-500">Stale / Outdated Claims</span>
          <div className={`text-2xl font-bold ${report.summary.staleClaims > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {report.summary.staleClaims}
          </div>
          <p className="text-[11px] text-gray-400">Contradicted by live web evidence</p>
        </div>

        <div className="card bg-gray-900 border-gray-800 p-4 space-y-1">
          <span className="text-xs text-gray-500">Fresh / Confirmed Claims</span>
          <div className="text-2xl font-bold text-emerald-400">
            {report.summary.freshClaims}
          </div>
          <p className="text-[11px] text-gray-400">Supported by authoritative sources</p>
        </div>
      </div>

      {/* Corrected Answer Section (if stale claims exist) */}
      {report.hasCorrectedAnswer && report.correctedAnswer && (
        <CorrectedAnswerPanel
          originalAnswer={report.originalAnswer}
          correctedAnswer={report.correctedAnswer}
        />
      )}

      {/* Per-Claim Detailed Inspection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Per-Claim Verification Breakdown
          </h2>
          <span className="text-xs text-gray-500">
            Click any claim to inspect Tavily evidence snippets & authority scoring
          </span>
        </div>
        <ClaimsTable claims={report.claims} />
      </div>

      {/* Top Authoritative Sources */}
      {report.topSources && report.topSources.length > 0 && (
        <div className="card bg-gray-900 border-gray-800 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">
            Authoritative Web Sources Consulted
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.topSources.map((src: any, i: number) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 transition flex items-start justify-between group"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <span className="text-xs font-medium text-gray-200 group-hover:text-brand-300 transition line-clamp-1">
                    {src.title || src.domain}
                  </span>
                  <p className="text-[11px] text-gray-500">{src.domain}</p>
                </div>
                <ExternalLink size={12} className="text-gray-500 group-hover:text-brand-400 shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
