import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Code-split route components for optimized initial load performance
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const VerificationWorkspacePage = lazy(() => import('./pages/VerificationWorkspacePage').then((m) => ({ default: m.VerificationWorkspacePage })));
const VerificationReportPage = lazy(() => import('./pages/VerificationReportPage').then((m) => ({ default: m.VerificationReportPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const FreshnessWatchPage = lazy(() => import('./pages/FreshnessWatchPage').then((m) => ({ default: m.FreshnessWatchPage })));
const AnswerEvolutionPage = lazy(() => import('./pages/AnswerEvolutionPage').then((m) => ({ default: m.AnswerEvolutionPage })));

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      <span className="text-xs font-medium text-slate-500">Loading FreshGuard AI...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Core Application Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/verify" element={<VerificationWorkspacePage />} />
          <Route path="/verification/:id" element={<VerificationReportPage />} />
          <Route path="/watches" element={<FreshnessWatchPage />} />
          <Route path="/evolution" element={<AnswerEvolutionPage />} />
          <Route path="/evolution/:id" element={<AnswerEvolutionPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Backward Compatibility Aliases */}
          <Route path="/reports/:id" element={<VerificationReportPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
