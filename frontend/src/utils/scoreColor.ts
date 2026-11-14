import { RiskLevel } from '../types/api.types';

export function scoreToColor(score: number): string {
  if (score >= 80) return 'text-fresh-400';
  if (score >= 60) return 'text-stale-400';
  if (score >= 40) return 'text-outdated-400';
  return 'text-danger-400';
}

export function scoreToBarColor(score: number): string {
  if (score >= 80) return 'bg-fresh-500';
  if (score >= 60) return 'bg-stale-500';
  if (score >= 40) return 'bg-outdated-500';
  return 'bg-danger-500';
}

export function riskToColors(risk: RiskLevel): { bg: string; text: string; border: string } {
  const map: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    LOW: { bg: 'bg-fresh-500/15', text: 'text-fresh-400', border: 'border-fresh-500/40' },
    MODERATE: { bg: 'bg-stale-500/15', text: 'text-stale-400', border: 'border-stale-500/40' },
    HIGH: { bg: 'bg-outdated-500/15', text: 'text-outdated-400', border: 'border-outdated-500/40' },
    CRITICAL: { bg: 'bg-danger-500/15', text: 'text-danger-400', border: 'border-danger-500/40' },
    FRESH: { bg: 'bg-fresh-500/15', text: 'text-fresh-400', border: 'border-fresh-500/40' },
    STALE: { bg: 'bg-stale-500/15', text: 'text-stale-400', border: 'border-stale-500/40' },
    OUTDATED: { bg: 'bg-outdated-500/15', text: 'text-outdated-400', border: 'border-outdated-500/40' },
    UNVERIFIABLE: { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/40' },
  };
  return map[risk];
}

export function verdictToLabel(verdict: string): string {
  const labels: Record<string, string> = {
    CONFIRMS: '✅ Confirmed',
    CONTRADICTS: '❌ Contradicted',
    PARTIALLY_CONTRADICTS: '⚠️ Partially Contradicted',
    INSUFFICIENT: '❓ Insufficient Evidence',
  };
  return labels[verdict] ?? verdict;
}

export function sensitivityToLabel(sensitivity: string): string {
  const labels: Record<string, string> = {
    STATIC: '🔒 Static',
    SEMI_DYNAMIC: '🔄 Semi-Dynamic',
    HIGHLY_DYNAMIC: '⚡ Highly Dynamic',
  };
  return labels[sensitivity] ?? sensitivity;
}

export function authorityToColor(tier: string): string {
  const colors: Record<string, string> = {
    HIGH: 'text-fresh-400',
    MEDIUM: 'text-stale-400',
    LOW: 'text-outdated-400',
    UNKNOWN: 'text-gray-500',
  };
  return colors[tier] ?? 'text-gray-500';
}
