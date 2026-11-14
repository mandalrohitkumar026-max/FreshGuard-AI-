import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerificationProgress } from '../components/VerificationProgress';
import { useAuthStore } from '../store/authStore';
import { SSEEvent } from '../types/api.types';
import { claimService, ClaimExtractionResult, ExtractedClaim } from '../api/claimService';
import { freshnessService, FreshnessAnalysisResponse, ClaimTemporalAnalysis } from '../api/freshnessService';
import { verificationService, VerificationPipelineResult } from '../api/verificationService';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Play,
  RefreshCw,
  Layers,
  Calendar,
  Hash,
  Tag,
  AlertCircle,
  FileText,
  Info,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

const PRESET_EXAMPLES = [
  {
    title: 'React Version Staleness',
    topic: 'Web Development',
    model: 'gpt-3.5-turbo (circa 2022)',
    text: 'React 18 is the current cutting-edge version of React, released in March 2022. The latest stable release is React 18.2.0. Server components are strictly experimental and not yet ready for production use.',
  },
  {
    title: 'Python Release & Support',
    topic: 'Programming Languages',
    model: 'claude-2',
    text: 'Python 3.10 is the latest active version. Python 3.7 is still supported and receives security updates until late 2025. Python was created by Guido van Rossum in 1991.',
  },
  {
    title: 'Tech Leadership & Valuation',
    topic: 'Corporate / AI Industry',
    model: 'historical-dump',
    text: 'Sam Altman was permanently removed as CEO of OpenAI in November 2023. The company generated revenue of $10 million in 2024. Mira Murati serves as the ongoing permanent Chief Executive Officer.',
  },
  {
    title: 'Compound Claims with Opinions',
    topic: 'Technology & Opinions',
    model: 'gpt-4',
    text: 'React was released in 2013. Version 18 was released in March 2022. React is the best framework and will dominate development forever.',
  },
];

export const VerifyPage: React.FC = () => {
  const [answerText, setAnswerText] = useState('');
  const [topic, setTopic] = useState('');
  const [sourceModel, setSourceModel] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [completedReportId, setCompletedReportId] = useState<string | null>(null);

  // Phase 06 & 07: Extracted claims and freshness state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ClaimExtractionResult | null>(null);
  const [freshnessResult, setFreshnessResult] = useState<FreshnessAnalysisResponse | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Phase 08: Live Verification results
  const [liveVerificationResult, setLiveVerificationResult] = useState<VerificationPipelineResult | null>(null);
  const [isLiveVerifying, setIsLiveVerifying] = useState(false);

  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();

  const handleSelectPreset = (example: typeof PRESET_EXAMPLES[0]) => {
    setAnswerText(example.text);
    setTopic(example.topic);
    setSourceModel(example.model);
    setExtractionResult(null);
    setFreshnessResult(null);
    setLiveVerificationResult(null);
    setExtractionError(null);
  };

  const handleRunLiveVerification = async () => {
    if (!answerText.trim() || isLiveVerifying) return;
    setIsLiveVerifying(true);
    setExtractionError(null);
    try {
      const res = await verificationService.verifyDirect(answerText, topic || undefined);
      setLiveVerificationResult(res);
      setIsComplete(true);
    } catch (err: any) {
      setExtractionError(err.message || 'Verification failed');
    } finally {
      setIsLiveVerifying(false);
    }
  };

  const handleExtractClaims = async () => {
    if (!answerText.trim() || isExtracting) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const result = await claimService.extractClaims({
        answer: answerText,
        topicHint: topic || undefined,
        model: sourceModel || undefined,
      });
      setExtractionResult(result);

      // Phase 07: Automatically analyze freshness and temporal drift
      if (result.claims && result.claims.length > 0) {
        try {
          const freshRes = await freshnessService.analyzeFreshness({
            verificationId: result.verificationId,
            claims: result.claims,
            topicHint: topic || undefined,
            model: sourceModel || undefined,
          });
          setFreshnessResult(freshRes);
        } catch {
          // Non-fatal
        }
      }
    } catch (err: any) {
      setExtractionError(
        err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to extract claims',
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || isVerifying) return;

    setIsVerifying(true);
    setEvents([]);
    setIsComplete(false);
    setIsFailed(false);
    setCompletedReportId(null);

    // Also trigger claim extraction in parallel for rich workspace view
    handleExtractClaims();

    // Trigger Phase 08 Live Verification Engine concurrently
    verificationService
      .verifyDirect(answerText, topic || undefined)
      .then((res) => {
        setLiveVerificationResult(res);
      })
      .catch(() => {});

    try {
      const response = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          answerText,
          context: {
            topic: topic || undefined,
            sourceModel: sourceModel || undefined,
          },
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Verification service returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6)) as SSEEvent;
              setEvents((prev) => [...prev, eventData]);

              if (eventData.stage === 'COMPLETE') {
                setIsComplete(true);
                setIsVerifying(false);
                if (eventData.reportId) {
                  setCompletedReportId(eventData.reportId);
                }
              } else if (eventData.stage === 'FAILED') {
                setIsFailed(true);
                setIsVerifying(false);
              }
            } catch {
              // ignore json parse glitch
            }
          }
        }
      }
    } catch {
      setIsFailed(true);
      setIsVerifying(false);
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-600" /> SUPPORTED
          </span>
        );
      case 'OUTDATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
            <XCircle size={11} className="text-rose-600" /> OUTDATED
          </span>
        );
      case 'PARTIALLY_SUPPORTED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
            <AlertCircle size={11} className="text-amber-600" /> PARTIALLY SUPPORTED
          </span>
        );
      case 'CONFLICTING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-1">
            <HelpCircle size={11} className="text-purple-600" /> CONFLICTING
          </span>
        );
      case 'NOT_CHECKED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
            <ShieldCheck size={11} className="text-blue-600" /> NOT CHECKED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
            <HelpCircle size={11} className="text-slate-500" /> UNVERIFIED
          </span>
        );
    }
  };

  const getClaimTypeBadge = (type: string) => {
    switch (type) {
      case 'FACTUAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            FACTUAL
          </span>
        );
      case 'OPINION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
            OPINION
          </span>
        );
      case 'PREDICTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            PREDICTION
          </span>
        );
      case 'RECOMMENDATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            RECOMMENDATION
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {category}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
          <Sparkles size={14} />
          <span>Real-time Stale Answer Detector</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify AI Answer Freshness
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
          Paste any LLM-generated response. FreshGuard decomposes it into atomic factual claims, retrieves live web evidence via{' '}
          <strong className="text-slate-800">Tavily</strong>, assesses freshness through the{' '}
          <strong className="text-slate-800">Bifrost Gateway</strong>, and produces a scored audit report with corrections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Input form & Presets */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleStartVerification} className="card bg-white border-slate-200 shadow-xs space-y-4 p-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0 font-medium text-slate-800">LLM Generated Answer</label>
                <span className="text-xs text-slate-400">{answerText.length} / 30,000 chars</span>
              </div>
              <textarea
                required
                rows={7}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Paste the AI response here to inspect for outdated or stale factual claims..."
                className="input font-mono text-xs leading-relaxed resize-y border-slate-300 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label text-slate-700">Topic / Domain (Optional)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Technology, Law, Finance"
                  className="input text-xs border-slate-300"
                />
              </div>
              <div>
                <label className="label text-slate-700">Source Model Hint (Optional)</label>
                <input
                  type="text"
                  value={sourceModel}
                  onChange={(e) => setSourceModel(e.target.value)}
                  placeholder="e.g. gpt-4, claude-3, llama-3"
                  className="input text-xs border-slate-300"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleExtractClaims}
                disabled={isExtracting || !answerText.trim()}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs py-2.5 px-4 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="animate-spin text-blue-600" size={14} />
                    <span>Extracting Atomic Claims...</span>
                  </>
                ) : (
                  <>
                    <Layers size={14} className="text-blue-600" />
                    <span>Extract Atomic Claims (NLP)</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isVerifying || answerText.trim().length < 10}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Pipeline Executing...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Run Live Freshness Verification</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Preset Buttons */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Try Sample Stale Answers
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {PRESET_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isVerifying || isExtracting}
                  onClick={() => handleSelectPreset(ex)}
                  className="text-left p-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 transition flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition">
                        {ex.title}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {ex.topic}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      "{ex.text}"
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Extraction / Progress Stream */}
        <div className="lg:col-span-5 space-y-4">
          {/* Extraction Error Alert */}
          {extractionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Claim Extraction Failed</p>
                <p className="text-rose-700 mt-0.5">{extractionError}</p>
              </div>
            </div>
          )}

          {/* Extracted Claims Section */}
          {extractionResult && (
            <div className="card bg-white border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Extracted Atomic Claims
                  </h3>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
                  {extractionResult.totalClaims} Claims
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  Factual: <strong className="text-slate-800">{extractionResult.factualClaimsCount}</strong>
                </div>
                <div>
                  Subjective / Opinions: <strong className="text-slate-800">{extractionResult.nonFactualClaimsCount}</strong>
                </div>
                <div>
                  Latency: <strong className="text-slate-800">{extractionResult.latencyMs}ms</strong>
                </div>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {extractionResult.claims.map((claim: ExtractedClaim) => (
                  <div
                    key={claim.claimId}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {claim.claimId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getClaimTypeBadge(claim.claimType)}
                        {getCategoryBadge(claim.category)}
                      </div>
                    </div>

                    <p className="text-slate-900 font-medium leading-relaxed">
                      {claim.claimText}
                    </p>

                    {/* Phase 07: Freshness & Temporal Intelligence Badges */}
                    {(() => {
                      const temporal = freshnessResult?.analysis?.find(
                        (a) => a.claimId === claim.claimId || a.claimText === claim.claimText,
                      );
                      if (!temporal) return null;

                      return (
                        <div className="p-2 rounded bg-white border border-slate-200 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                            {temporal.isTimeSensitive ? (
                              <span className="px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                ⚡ TIME SENSITIVE
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🔒 STABLE FACT
                              </span>
                            )}

                            <span
                              className={`px-1.5 py-0.5 rounded font-semibold ${
                                temporal.priority === 'HIGH'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : temporal.priority === 'MEDIUM'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              Priority: {temporal.priority}
                            </span>

                            <span className="px-1.5 py-0.5 rounded font-medium bg-slate-50 text-slate-600 border border-slate-200">
                              Volatility: {temporal.volatility}
                            </span>

                            <span className="px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Strategy: {temporal.recommendedSearchStrategy}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-600 leading-tight italic">
                            "{temporal.reason}"
                          </p>
                        </div>
                      );
                    })()}

                    {/* Entities */}
                    {claim.entities && claim.entities.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <Tag size={11} className="text-slate-400 mr-0.5" />
                        {claim.entities.map((ent, eIdx) => (
                          <span
                            key={eIdx}
                            className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700"
                          >
                            <span className="font-medium mr-1">{ent.text}</span>
                            <span className="text-[9px] text-slate-400 font-mono">[{ent.type}]</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Dates & Numbers */}
                    {((claim.dates && claim.dates.length > 0) || (claim.numericalValues && claim.numericalValues.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                        {claim.dates && claim.dates.map((d, dIdx) => (
                          <span key={dIdx} className="inline-flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            <Calendar size={10} className="text-blue-500" />
                            {d}
                          </span>
                        ))}
                        {claim.numericalValues && claim.numericalValues.map((num, nIdx) => (
                          <span key={nIdx} className="inline-flex items-center gap-1 text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            <Hash size={10} className="text-teal-500" />
                            {num.value} {num.unit ? `(${num.unit})` : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Context reference */}
                    {claim.context && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50/80 px-2 py-1 rounded">
                        <Info size={11} className="shrink-0" />
                        <span>{claim.context}</span>
                      </div>
                    )}

                    {/* Offsets & Duplicate indicator */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Offsets: {claim.originalTextReference.start}–{claim.originalTextReference.end}</span>
                      {claim.isDuplicate && (
                        <span className="text-amber-600 font-semibold">
                          Duplicate of {claim.duplicateOf}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Live Pipeline Execution Stream */}
          <div className="card bg-white border-slate-200 shadow-xs space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isVerifying ? 'bg-amber-400 animate-ping' : isComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <h3 className="text-sm font-semibold text-slate-900">
                  Verification Progress
                </h3>
              </div>
              {isComplete && completedReportId && (
                <button
                  onClick={() => navigate(`/reports/${completedReportId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-1 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span>View Full Report</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            {events.length === 0 && !isVerifying ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShieldAlert size={20} />
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Submit an answer or run claim extraction to inspect factual decomposition and real-time freshness telemetry.
                </p>
              </div>
            ) : (
              <VerificationProgress
                events={events}
                isComplete={isComplete}
                isFailed={isFailed}
              />
            )}
          </div>

          {/* Phase 08 Live Verification & Ground Truth Results Card */}
          {liveVerificationResult && (
            <div className="card bg-white border-slate-200 shadow-sm space-y-5 p-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-emerald-600" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Live Verification & Ground Truth Analysis
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Phase 08 Evidence-Based Verification Engine
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Score:</span>
                    <span className="text-xs font-extrabold text-blue-600">
                      {liveVerificationResult.summary.overallFreshnessScore}/100
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      liveVerificationResult.summary.overallRiskLevel === 'FRESH'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : liveVerificationResult.summary.overallRiskLevel === 'OUTDATED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : liveVerificationResult.summary.overallRiskLevel === 'STALE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {liveVerificationResult.summary.overallRiskLevel}
                  </span>
                </div>
              </div>

              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/60">
                  <div className="text-xs font-bold text-emerald-700">{liveVerificationResult.summary.supported}</div>
                  <div className="text-[9px] uppercase font-medium text-emerald-600">Supported</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/60">
                  <div className="text-xs font-bold text-rose-700">{liveVerificationResult.summary.outdated}</div>
                  <div className="text-[9px] uppercase font-medium text-rose-600">Outdated</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60">
                  <div className="text-xs font-bold text-amber-700">{liveVerificationResult.summary.partiallySupported}</div>
                  <div className="text-[9px] uppercase font-medium text-amber-600">Partial</div>
                </div>
                <div className="p-2 rounded-lg bg-purple-50 border border-purple-200/60">
                  <div className="text-xs font-bold text-purple-700">{liveVerificationResult.summary.conflicting}</div>
                  <div className="text-[9px] uppercase font-medium text-purple-600">Conflict</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700">{liveVerificationResult.summary.unverified}</div>
                  <div className="text-[9px] uppercase font-medium text-slate-500">Unverified</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/60">
                  <div className="text-xs font-bold text-blue-700">{liveVerificationResult.summary.notChecked}</div>
                  <div className="text-[9px] uppercase font-medium text-blue-600">Permanent</div>
                </div>
              </div>

              {/* Grounded Corrected Answer if modified */}
              {liveVerificationResult.correction?.hasModifications && (
                <div className="p-3.5 rounded-lg bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>Grounded Corrected Answer</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {liveVerificationResult.correction.correctedAnswer}
                  </p>
                  {liveVerificationResult.correction.changesSummary.length > 0 && (
                    <div className="pt-1.5 border-t border-emerald-200/60">
                      <div className="text-[10px] font-semibold text-emerald-800 mb-1">Corrections Applied:</div>
                      <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5">
                        {liveVerificationResult.correction.changesSummary.map((ch, idx) => (
                          <li key={idx}>{ch}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Verified Claims Breakdown */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Verified Claims & Evidence Sources ({liveVerificationResult.claims.length})</span>
                  <span className="text-[10px] font-normal text-slate-500">Tavily Search + Bifrost Gateway</span>
                </h4>

                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {liveVerificationResult.claims.map((claim) => (
                    <div
                      key={claim.claimId}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-900">
                          {claim.order}. {claim.claimText}
                        </span>
                        {getVerificationStatusBadge(claim.status)}
                      </div>

                      <p className="text-[11px] text-slate-600 italic">
                        "{claim.explanation}"
                      </p>

                      {claim.contradictionDetails && (
                        <div className="text-[10px] text-rose-700 bg-rose-50/80 p-2 rounded border border-rose-200/60 font-medium">
                          Contradiction: {claim.contradictionDetails}
                        </div>
                      )}

                      {/* Evidence Sources */}
                      {claim.sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase">Sources:</span>
                          {claim.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-600 hover:text-blue-800 hover:border-blue-300 transition"
                            >
                              <span>{src.domain}</span>
                              <span className="text-[8px] text-slate-400 uppercase">[{src.authorityTier}]</span>
                              <ExternalLink size={9} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
