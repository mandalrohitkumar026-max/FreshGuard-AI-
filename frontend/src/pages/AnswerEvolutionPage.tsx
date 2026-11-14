import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { Button } from '../components/Common/Button';
import { Loader } from '../components/Common/Loader';
import { ErrorState } from '../components/Common/ErrorState';
import { AnswerEvolutionTracker, EvolutionData } from '../components/Verification/AnswerEvolutionTracker';
import apiClient from '../api/apiClient';
import {
  GitCommit,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  ChevronLeft,
  Sparkles,
  FileCheck,
  Send,
  Layers,
  History,
} from 'lucide-react';

export const AnswerEvolutionPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string>(id || '');
  const [evolution, setEvolution] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New revision submission state
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisedAnswerText, setRevisedAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvolution = async (sid: string) => {
    if (!sid) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/verification/${sid}/evolution`);
      if (res.data?.success && res.data.data) {
        setEvolution(res.data.data);
      } else {
        setEvolution(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to retrieve evolution tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSessionId(id);
      fetchEvolution(id);
    }
  }, [id]);

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !revisedAnswerText.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await apiClient.post('/verification/evolve', {
        parentSessionId: sessionId,
        revisedAnswer: revisedAnswerText.trim(),
      });

      if (res.data?.success && res.data.data) {
        const newSessionId = res.data.data.currentSessionId;
        setEvolution(res.data.data);
        setIsSubmittingRevision(false);
        setRevisedAnswerText('');
        if (newSessionId) {
          navigate(`/evolution/${newSessionId}`, { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit revised answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-7 max-w-5xl mx-auto">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
              <Link to="/history" className="inline-flex items-center gap-1 font-medium hover:text-slate-900 transition">
                <ChevronLeft size={14} />
                <span>Audit History</span>
              </Link>
              {sessionId && (
                <>
                  <span>/</span>
                  <span className="font-mono text-[11px] text-slate-400">Session {sessionId.slice(0, 8)}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <GitCommit size={20} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Answer Evolution & Version Trajectory
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Track how factual claims and freshness scores evolve across iterations of an AI-generated response.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSubmittingRevision(!isSubmittingRevision)}
              icon={<RefreshCw size={14} />}
            >
              {isSubmittingRevision ? 'Cancel Revision' : 'Submit New Revision'}
            </Button>
            <Link to="/verify">
              <Button size="sm">New Audit</Button>
            </Link>
          </div>
        </div>

        {/* Submit New Revision Form (collapsible) */}
        {isSubmittingRevision && (
          <div className="card p-6 space-y-4 bg-gradient-to-br from-blue-50/50 to-white border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles size={16} className="text-blue-600" />
                <span>Submit Revised Answer for Semantic Evolution Comparison</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Parent Session: {sessionId.slice(0, 8)}</span>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Updated / Corrected Answer Text:
                </label>
                <textarea
                  value={revisedAnswerText}
                  onChange={(e) => setRevisedAnswerText(e.target.value)}
                  placeholder="Paste the revised AI response here to compare claim-by-claim changes..."
                  rows={5}
                  required
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans leading-relaxed text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSubmittingRevision(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !revisedAnswerText.trim()}
                  icon={<Send size={14} />}
                >
                  {submitting ? 'Verifying & Comparing...' : 'Run Evolution Analysis'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="py-20">
            <Loader label="Evaluating semantic claim transitions across answer revisions..." size="lg" />
          </div>
        ) : error ? (
          <div className="py-12 max-w-lg mx-auto">
            <ErrorState title="Evolution Analysis Error" message={error} onRetry={() => fetchEvolution(sessionId)} />
          </div>
        ) : evolution ? (
          <div className="space-y-6">
            <AnswerEvolutionTracker
              evolution={evolution}
              onSubmitNewRevision={() => setIsSubmittingRevision(true)}
            />
          </div>
        ) : (
          <div className="card p-12 text-center space-y-4 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Layers size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Select an Audit to Track Evolution</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an existing verification session from your audit history or submit a revision to view claim-by-claim change trajectories.
              </p>
            </div>
            <Link to="/history">
              <Button size="sm" icon={<History size={14} />}>
                Browse Audit History
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
