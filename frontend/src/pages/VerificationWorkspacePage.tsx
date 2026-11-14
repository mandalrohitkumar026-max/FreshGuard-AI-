import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Button } from '../components/Common/Button';
import { ProcessingIndicator } from '../components/Verification/ProcessingIndicator';
import { ClaimStatusBadge } from '../components/Common/ClaimStatusBadge';
import { SSEEvent } from '../types/api.types';
import { verificationService, VerificationPipelineResult } from '../api/verificationService';
import {
  Sparkles,
  Play,
  RotateCcw,
  BookOpen,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ClipboardPaste,
  Trash2,
  Sliders,
  History,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

const verifySchema = z.object({
  answerText: z
    .string()
    .min(15, 'Answer text must be at least 15 characters long.')
    .max(10000, 'Answer text cannot exceed 10,000 characters.'),
  topic: z.string().max(100).optional(),
  sourceModel: z.string().max(50).optional(),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const EXAMPLE_TEST_CASES = [
  {
    title: 'React 18 vs React 19 Release',
    topic: 'Web Development',
    model: 'gpt-3.5-turbo (2022 Cutoff)',
    text: 'React 18 is the current cutting-edge version of React, released in March 2022. The latest stable release is React 18.2.0. Server components are strictly experimental and not yet ready for production use.',
  },
  {
    title: 'Python 3.10 & 3.7 Support Lifecycles',
    topic: 'Programming Languages',
    model: 'claude-2',
    text: 'Python 3.10 is the latest active version. Python 3.7 is still supported and receives security updates until late 2025. Python was first created by Guido van Rossum in 1991.',
  },
  {
    title: 'Corporate Leadership & Executives',
    topic: 'Business & Tech',
    model: 'historical-cut',
    text: 'The current Chief Executive Officer of Microsoft is Sundar Pichai, who succeeded Steve Ballmer. Satya Nadella serves as an independent board advisor.',
  },
  {
    title: 'Financial Rates & Currency',
    topic: 'Finance & Markets',
    model: 'static-model',
    text: 'The current USD to INR exchange rate is 83.00 INR per dollar, which remains constant across major international forex exchanges.',
  },
];

export const VerificationWorkspacePage: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [completedReportId, setCompletedReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Live direct verification result state
  const [pipelineResult, setPipelineResult] = useState<VerificationPipelineResult | null>(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      answerText: '',
      topic: '',
      sourceModel: '',
    },
  });

  const currentText = watch('answerText') || '';

  const handleApplyExample = (example: typeof EXAMPLE_TEST_CASES[0]) => {
    setValue('answerText', example.text, { shouldValidate: true });
    setValue('topic', example.topic);
    setValue('sourceModel', example.model);
    setErrorMessage(null);
    setPipelineResult(null);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue('answerText', text, { shouldValidate: true });
        setErrorMessage(null);
      }
    } catch {
      // Permission denied or clipboard unavailable
    }
  };

  const handleClear = () => {
    reset();
    setEvents([]);
    setIsComplete(false);
    setIsFailed(false);
    setCompletedReportId(null);
    setErrorMessage(null);
    setPipelineResult(null);
  };

  const onSubmit = async (data: VerifyFormData) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setEvents([]);
    setIsComplete(false);
    setIsFailed(false);
    setCompletedReportId(null);
    setErrorMessage(null);
    setPipelineResult(null);

    // Initial synthetic event for stage 1
    setEvents([{ stage: 'SESSION_CREATED', timestamp: new Date().toISOString() }]);

    // Concurrently trigger direct verification engine
    verificationService
      .verifyDirect(data.answerText, data.topic || undefined)
      .then((res) => {
        setPipelineResult(res);
        setCompletedReportId(res.sessionId);
        setIsComplete(true);
        setIsVerifying(false);
      })
      .catch((err) => {
        // Fall back to SSE or report error
        if (!isComplete) {
          setErrorMessage(err.message || 'Verification pipeline encountered an issue.');
          setIsFailed(true);
          setIsVerifying(false);
        }
      });

    // Stream SSE for stage-by-stage progress visualization
    try {
      const response = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          answerText: data.answerText,
          context: {
            topic: data.topic || undefined,
            sourceModel: data.sourceModel || undefined,
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
                setErrorMessage(eventData.error || 'Verification encountered an error.');
              }
            } catch {
              // Ignore malformed streaming chunk
            }
          }
        }
      }
    } catch {
      // Handled by direct runner
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-7">
        {/* Page Heading & History Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                AI Answer Verification Workspace
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Phase 09 Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Submit an AI-generated answer to extract factual claims, detect time sensitivity, and verify against live web documentation.
            </p>
          </div>

          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <History size={14} />
            <span>Audit History</span>
          </Link>
        </div>

        {/* Workspace Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="card p-6 space-y-4 shadow-card">
            {/* Editor Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <label htmlFor="answerText" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                AI-Generated Answer Text Under Review
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 transition"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={12} />
                  <span>Paste</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!currentText && events.length === 0}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 px-2 py-1 transition disabled:opacity-40"
                  title="Clear editor"
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border transition ${
                    showSettings ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Sliders size={12} />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Main Textarea */}
            <div className="space-y-1.5">
              <textarea
                id="answerText"
                rows={7}
                placeholder="Paste the full AI-generated response here (e.g. from ChatGPT, Claude, Gemini, or Llama). FreshGuard AI will decompose it into individual factual assertions and verify their currency against live authoritative sources."
                className="textarea text-sm font-sans leading-relaxed border-slate-300 focus:border-blue-600"
                {...register('answerText')}
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>{errors.answerText?.message ? <span className="text-rose-600 font-semibold">{errors.answerText.message}</span> : 'Minimum 15 characters required'}</span>
                <span className={currentText.length > 9000 ? 'text-amber-600 font-bold' : ''}>
                  {currentText.length} / 10,000 characters
                </span>
              </div>
            </div>

            {/* Optional Settings Drawer */}
            {showSettings && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 animate-in fade-in duration-200">
                <div>
                  <label className="label text-slate-700">Domain / Topic Hint (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Development, Tax Policy, Corporate Finance"
                    className="input text-xs"
                    {...register('topic')}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Guides Tavily search query formulation</span>
                </div>

                <div>
                  <label className="label text-slate-700">Source LLM Model (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. gpt-4o, claude-3.5-sonnet, llama-3"
                    className="input text-xs"
                    {...register('sourceModel')}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Assists in model cutoff drift attribution</span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span>Routing through: </span>
                <span className="font-semibold text-slate-700">Bifrost Gateway</span>
                <span> + </span>
                <span className="font-semibold text-slate-700">Tavily Search API</span>
              </div>

              <Button
                type="submit"
                size="md"
                disabled={isVerifying || currentText.trim().length < 15}
                icon={isVerifying ? undefined : <Play size={14} fill="currentColor" />}
              >
                {isVerifying ? 'Running 7-Stage Audit...' : 'Verify Answer Freshness'}
              </Button>
            </div>
          </div>
        </form>

        {/* Preset Sample Test Cases */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen size={14} />
              <span>Sample Test Cases with Known Temporal Drift</span>
            </h3>
            <span className="text-[11px] text-slate-400">Click to populate editor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_TEST_CASES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isVerifying}
                onClick={() => handleApplyExample(ex)}
                className="text-left p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 transition flex flex-col justify-between group shadow-2xs hover:border-slate-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {ex.title}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {ex.topic}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 italic font-sans leading-relaxed">
                    "{ex.text}"
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 mt-2 border-t border-slate-100">
                  <span>Model: {ex.model}</span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Load Case <ChevronRight size={10} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 7-Stage Progress Experience (Visible during or after execution) */}
        {(isVerifying || events.length > 0 || isFailed) && (
          <div className="space-y-4">
            <ProcessingIndicator
              events={events}
              isComplete={isComplete}
              isFailed={isFailed}
              errorMessage={errorMessage}
            />

            {/* Completion Banner */}
            {isComplete && completedReportId && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      Verification Audit Completed Successfully
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      All claims decomposed, verified against web evidence, and compiled into the audit report.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => navigate(`/verification/${completedReportId}`)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>View Full Audit Report</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* In-Workspace Results Quick Inspection (Phase 09 Polish) */}
        {pipelineResult && (
          <div className="card p-6 space-y-5 bg-white border-slate-200 shadow-card animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Instant Verification Telemetry
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Freshness: {pipelineResult.summary.overallFreshnessScore}/100
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    pipelineResult.summary.overallRiskLevel === 'FRESH'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : pipelineResult.summary.overallRiskLevel === 'OUTDATED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {pipelineResult.summary.overallRiskLevel}
                </span>
              </div>
            </div>

            {/* Quick Claim Breakdown */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Audited Claims Summary ({pipelineResult.claims.length} claims):
              </span>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pipelineResult.claims.map((c) => (
                  <div
                    key={c.claimId}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-900">
                        #{c.order}. "{c.claimText}"
                      </span>
                      <p className="text-[11px] text-slate-500 italic">
                        "{c.explanation}"
                      </p>
                    </div>
                    <div className="shrink-0">
                      <ClaimStatusBadge status={c.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA to Full Report */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => navigate(`/verification/${pipelineResult.sessionId}`)}
                className="btn-primary text-xs"
              >
                <span>Inspect Detailed Evidence & Citations</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
