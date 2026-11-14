import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../Common/Button';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Product Identity */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-subtle group-hover:bg-blue-700 transition">
            <Shield size={18} />
          </div>
          <span className="text-lg tracking-tight">
            Fresh<span className="text-blue-600">Guard</span>{' '}
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              AI
            </span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-slate-900 transition">
            Product
          </Link>
          <a href="/#how-it-works" className="hover:text-slate-900 transition">
            How It Works
          </a>
          <a href="/#features" className="hover:text-slate-900 transition">
            Features
          </a>
          <a href="/#technology" className="hover:text-slate-900 transition">
            Technology
          </a>
          <Link to="/dashboard" className="hover:text-slate-900 transition">
            Dashboard
          </Link>
        </nav>

        {/* Action CTAs & Notification Bell */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 transition">
            Sign In
          </Link>
          <Link to="/verify">
            <Button size="sm" icon={<Sparkles size={14} />}>
              <span>Verify Answer</span>
              <ArrowRight size={14} className="ml-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
