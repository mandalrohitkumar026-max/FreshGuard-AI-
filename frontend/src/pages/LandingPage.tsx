import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Layout/Navbar';
import { Footer } from '../components/Layout/Footer';
import { Button } from '../components/Common/Button';
import { ClaimStatusBadge } from '../components/Common/ClaimStatusBadge';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Clock,
  Search,
  CheckCircle2,
  FileCheck2,
  Cpu,
  Layers,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  Database,
  BarChart3,
  Scale,
  Zap,
  Globe,
  FileText,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs">
              <Sparkles size={13} className="text-blue-600" />
              <span>PS06: Stale-Answer Detector for AI Applications</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your AI Answers Deserve a{' '}
              <span className="text-blue-600">Freshness Check.</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Detect outdated information, verify factual claims against live evidence, and understand how trustworthy AI-generated answers really are.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link to="/verify">
                <Button size="lg" icon={<Sparkles size={16} />}>
                  <span>Verify an Answer</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg">
                  Explore How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Interactive Realistic Product Preview (Section C) */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 ml-1">sample-audit-preview.tsx</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase">
                    Sample Report Output
                  </span>
                  <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px] uppercase">
                    Stale Claims Flagged
                  </span>
                </div>
              </div>

              {/* Sample AI Input and Score */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-8 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Input AI Response Under Review
                  </span>
                  <p className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans leading-relaxed">
                    "React 18 is the current cutting-edge stable version of React. Server components are strictly experimental and not yet ready for production use."
                  </p>
                </div>

                <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Freshness Index
                  </span>
                  <div className="text-3xl font-extrabold text-amber-600">50/100</div>
                  <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    OUTDATED
                  </span>
                </div>
              </div>

              {/* Sample Claim Analysis Items */}
              <div className="space-y-2.5 pt-1">
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900">
                      1. "React 18 is the current cutting-edge stable version of React."
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Contradicted: React 19 was released as stable in December 2024 with full Server Components support.
                    </p>
                  </div>
                  <ClaimStatusBadge status="OUTDATED" size="sm" />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900">
                      2. "React was first created by Jordan Walke at Meta in 2013."
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Confirmed: Permanent historical software milestone with fixed ground truth.
                    </p>
                  </div>
                  <ClaimStatusBadge status="NOT_CHECKED" size="sm" />
                </div>
              </div>

              {/* Sample Grounded Correction */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
                  <Sparkles size={12} className="text-emerald-600" />
                  <span>FreshGuard Grounded Correction:</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-sans">
                  "React 19 is now the active stable release, officially launched with React Server Components support and automated compiler optimizations <span className="text-blue-600 underline font-medium">[React Docs](https://react.dev)</span>."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section (Section D) */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why AI Answers Silently Become Outdated
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Large language models generate authoritative-sounding prose, but their knowledge is frozen at the moment of pre-training.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Training Cutoff Drift</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When APIs deprecate, leadership transitions, or laws change after a model's cutoff date, the model continues generating historical reality as present truth.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Silent Partial Staleness</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A single paragraph often combines timeless historical milestones with volatile version numbers. Readers cannot easily distinguish which clauses are current.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">The FreshGuard Solution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                FreshGuard AI atomically isolates factual claims, classifies their temporal volatility, retrieves live web evidence, and writes evidence-grounded corrections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (Section E: 6 Canonical Steps) */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              End-to-End Ground Truth Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How FreshGuard AI Verifies Freshness
            </h2>
            <p className="text-sm text-slate-600">
              A transparent, 6-stage evidence pipeline combining deterministic rules and multi-LLM gateway routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Submit an AI-Generated Answer',
                desc: 'Paste any text generated by an LLM into the workspace. The engine normalizes the text and segments compound sentences.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'Extract Atomic Factual Claims',
                desc: 'The 10-stage NLP pipeline isolates individual factual assertions, recognizing entities, dates, numbers, and text offsets.',
                icon: Layers,
              },
              {
                step: '03',
                title: 'Detect Time-Sensitive Information',
                desc: 'Determines whether a claim is dynamic (e.g. software releases, CEO appointments, exchange rates) or permanent historical milestone.',
                icon: Clock,
              },
              {
                step: '04',
                title: 'Retrieve Current Evidence via Tavily',
                desc: 'Formulates targeted search queries and searches the live public web using Tavily with domain authority heuristics.',
                icon: Search,
              },
              {
                step: '05',
                title: 'Analyse Evidence through Bifrost AI',
                desc: 'Compares claims against retrieved sources inside secure prompt injection fences to detect explicit contradictions.',
                icon: Cpu,
              },
              {
                step: '06',
                title: 'Generate Transparent Audit Report',
                desc: 'Calculates the Freshness Index (0–100), tags claims with verifiable badges, and synthesizes citations with grounded rewrites.',
                icon: FileCheck2,
              },
            ].map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="card p-6 space-y-3 bg-white hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-bold">
                      <Icon size={18} />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-300">STEP {st.step}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{st.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Sections (Section F: 6 Core Capabilities) */}
      <section id="features" className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise-Grade AI Freshness Verification
            </h2>
            <p className="text-sm text-slate-600">
              Built from first principles to prevent AI hallucination and combat temporal decay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Intelligent Claim Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Decomposes complex paragraphs into atomic verifiable statements. Filters out subjective opinions and retains cross-sentence coreferences.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Temporal Intelligence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates volatility levels (Very High to Stable) and recommends optimal search strategies, preventing unnecessary search calls on permanent facts.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <Search size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Evidence Retrieval</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Integrates Tavily Agentic Search to crawl current official documentation, government registers, and established news, ranking by domain authority.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                <Scale size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Claim-Level Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every claim receives a distinct status: Supported, Outdated, Partially Supported, Conflicting, Unverified, or Permanent Fact, with full source citations.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Deterministic Freshness Scoring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transparent mathematical index (0 to 100) combining claim accuracy, evidence chronological recency, and domain authority tier weighting.
              </p>
            </div>

            <div className="card p-6 space-y-3 hover:border-slate-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Evidence-Grounded Corrections</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically rewrites outdated assertions with current verified facts while preserving valid context and inserting verifiable markdown hyperlinks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section (Section G: Meaningful Bifrost & Tavily Explanations) */}
      <section id="technology" className="py-20 bg-slate-50/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Technology Stack
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Powered by Industry-Leading AI Infrastructure
            </h2>
            <p className="text-sm text-slate-600">
              FreshGuard AI leverages Maxim AI's Bifrost Gateway and Tavily Agentic Search to deliver reliable, low-latency verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bifrost Card */}
            <div className="card p-7 space-y-4 bg-white border-slate-200 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                  <Cpu size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Maxim AI Bifrost Gateway</h3>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    High-Performance Model Gateway
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Bifrost operates as our resilient AI proxy layer running on port 8080. It handles unified request routing across LLM providers, automatic retries with exponential backoff, strict timeout enforcement, and execution logging.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Prompt Injection Defense: Web snippets encapsulated in strict XML fences</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Deterministic Fallback Engine for zero-downtime development</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Audit telemetry tracking token consumption, latency, and pipeline stages</span>
                </div>
              </div>
            </div>

            {/* Tavily Card */}
            <div className="card p-7 space-y-4 bg-white border-slate-200 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                  <Globe size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tavily Agentic Search API</h3>
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Fact-Oriented Information Retrieval
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Tavily is purpose-built for LLM agents, searching the public web to extract factual snippets rather than advertising-laden search results.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                  <span>Domain Authority Ranking: Prioritizes .gov, .edu, and official documentation</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                  <span>5-minute query deduplication cache to prevent redundant API queries</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 size={13} className="text-teal-600 shrink-0" />
                  <span>Live public registry fallback when search quotas are unconfigured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section (Section H) */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>Ready to Verify an AI Answer?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Stop Guessing. Start Verifying.
          </h2>

          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Run an instant factual audit on any AI response. Decompose claims, detect temporal staleness, and retrieve evidence in seconds.
          </p>

          <div className="pt-2">
            <Link to="/verify">
              <Button size="lg" icon={<Sparkles size={16} />}>
                <span>Open Verification Workspace</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <Footer />
    </div>
  );
};
