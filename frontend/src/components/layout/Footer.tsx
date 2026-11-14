import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Shield size={16} />
              </div>
              <span>FreshGuard AI</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              "Know What's Fresh. Trust What AI Says."
            </p>
            <p className="text-[11px] text-slate-400">
              Global AI Hackathon 2026 · PS06 Stale Answer Detector
            </p>
          </div>

          {/* Product links */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Platform
            </span>
            <ul className="space-y-2 text-slate-600">
              <li><Link to="/verify" className="hover:text-blue-600">Verification Workspace</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-600">Enterprise Dashboard</Link></li>
              <li><Link to="/history" className="hover:text-blue-600">Audit History</Link></li>
              <li><Link to="/settings" className="hover:text-blue-600">Gateway Health</Link></li>
            </ul>
          </div>

          {/* Technology stack */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Core Integrations
            </span>
            <ul className="space-y-2 text-slate-600">
              <li>
                <a href="https://getbifrost.ai" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 inline-flex items-center gap-1">
                  Bifrost by Maxim AI <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 inline-flex items-center gap-1">
                  Tavily Agentic Search <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <span className="text-slate-500">React 18 + TypeScript + Vite</span>
              </li>
              <li>
                <span className="text-slate-500">Node.js + Express REST API</span>
              </li>
            </ul>
          </div>

          {/* Legal / Transparency */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Methodology
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Freshness scores measure temporal currency and evidence alignment against live authoritative web documents. Scores do not represent absolute epistemological proof.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 FreshGuard AI. Built for Global AI Hackathon 2026 PS06.</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            Powered by <strong>Bifrost</strong> & <strong>Tavily</strong>
          </div>
        </div>
      </div>
    </footer>
  );
};
