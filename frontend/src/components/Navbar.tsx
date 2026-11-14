import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, CheckCircle, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-white group">
          <div className="p-1.5 bg-brand-600 rounded-lg group-hover:bg-brand-500 transition shadow-lg shadow-brand-600/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span>
            Fresh<span className="text-brand-400">Guard</span> AI
          </span>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
            PS06
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/') || isActive('/verify')
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <CheckCircle size={16} />
              <span>Verify Answer</span>
            </Link>
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/dashboard')
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded-full">
            <Sparkles size={12} />
            <span>Instant Access</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
