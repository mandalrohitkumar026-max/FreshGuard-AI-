import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FreshnessScoreDial } from '../components/FreshnessScoreDial';
import { RiskBadge } from '../components/RiskBadge';
import { CorrectedAnswerPanel } from '../components/CorrectedAnswerPanel';
import { Shield, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { RiskLevel, Verdict } from '../types/api.types';
import { scoreToColor, verdictToLabel } from '../utils/scoreColor';

interface PublicReportData {
  reportId: string;
  originalAnswer: string;
  correctedAnswer?: string;
  hasCorrectedAnswer: boolean;
  summary: {
    aggregateFreshnessScore: number;
    riskLevel: RiskLevel;
    totalClaims: number;
    staleClaims: number;
    freshClaims: number;
    processingTimeMs: number;
  };
  claimSummaries: Array<{
    claimId: string;
    claimText: string;
    freshnessScore: number;
    verdict: Verdict;
    confidence: number;
    explanation: string;
    topSourceUrl?: string;
    topSourceDomain?: string;
  }>;
  topSources: Array<{
    url: string;
    title: string;
    domain: string;
    authorityTier: string;
  }>;
}

export const PublicReportPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [report, setReport] = useState<PublicReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPublicReport = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/v1/reports/public/${slug}`);
        if (res.data?.success && res.data?.data) {
          setReport(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Public report not found or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicReport();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Loading public verification report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-red-400 text-sm">{error || 'Report not available'}</p>
        <Link to="/" className="btn-secondary text-xs inline-block">
          Visit FreshGuard AI
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-brand-900/30 via-gray-900 to-gray-900 border border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-400">
              Verified by FreshGuard AI
            </span>
          </div>
          <p className="text-xs text-gray-400">
            This verification report was generated using live web evidence via Tavily & AI auditing via Bifrost Gateway.
          </p>
        </div>
        <Link to="/register" className="btn-primary text-xs py-2 px-3.5 whitespace-nowrap">
          Verify Your Own AI Answers
        </Link>
      </div>

      {/* Main Score & Risk */}
      <div className="card bg-gray-900 border-gray-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h1 className="text-2xl font-bold text-white">Public Verification Audit</h1>
            <RiskBadge risk={report.summary.riskLevel} size="md" />
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            {report.summary.staleClaims > 0
              ? `Warning: ${report.summary.staleClaims} stale claim(s) were contradicted by current web sources.`
              : 'All analyzed factual claims are confirmed fresh and supported by current evidence.'}
          </p>
        </div>
        <div className="shrink-0">
          <FreshnessScoreDial score={report.summary.aggregateFreshnessScore} size="lg" />
        </div>
      </div>

      {/* Corrected Answer if Available */}
      {report.hasCorrectedAnswer && report.correctedAnswer && (
        <CorrectedAnswerPanel
          originalAnswer={report.originalAnswer}
          correctedAnswer={report.correctedAnswer}
        />
      )}

      {/* Claims List */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          Analyzed Claims Summary
        </h2>
        <div className="space-y-3">
          {report.claimSummaries.map((claim, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-gray-900 border border-gray-800 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-gray-200">
                  {claim.claimText}
                </p>
                <span className={`text-xs font-bold whitespace-nowrap ${scoreToColor(claim.freshnessScore)}`}>
                  {claim.freshnessScore}/100
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{verdictToLabel(claim.verdict)}</span>
                <span>·</span>
                <span>Confidence: {Math.round(claim.confidence * 100)}%</span>
                {claim.topSourceDomain && (
                  <>
                    <span>·</span>
                    <span className="text-brand-400">Source: {claim.topSourceDomain}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 italic bg-gray-950/40 p-2.5 rounded border border-gray-800/60">
                "{claim.explanation}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
