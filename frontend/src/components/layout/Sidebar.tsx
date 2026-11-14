import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckCircle2,
  History,
  BarChart3,
  Settings,
  Shield,
  ExternalLink,
  Eye,
  GitCommit,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/verify', label: 'Verify Answer', icon: CheckCircle2 },
    { to: '/watches', label: 'Freshness Watches', icon: Eye },
    { to: '/evolution', label: 'Answer Evolution', icon: GitCommit },
    { to: '/history', label: 'Verification History', icon: History },
    { to: '/dashboard#analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/90 bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation */}
      <div className="p-4 space-y-1 flex-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Integration Status Footer Pill in Sidebar */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">Gateway Status</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p>• Bifrost AI Gateway</p>
            <p>• Tavily Agentic Search</p>
          </div>
          <Link
            to="/settings"
            className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 pt-1"
          >
            System Diagnostics <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </aside>
  );
};
