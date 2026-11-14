import React from 'react';
import { RiskLevel } from '../types/api.types';
import { riskToColors } from '../utils/scoreColor';

interface RiskBadgeProps {
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

const RISK_LABELS: Record<RiskLevel, { label: string; icon: string }> = {
  LOW: { label: 'Low Risk', icon: '🟢' },
  MODERATE: { label: 'Moderate Risk', icon: '🟡' },
  HIGH: { label: 'High Risk', icon: '🟠' },
  CRITICAL: { label: 'Critical Risk', icon: '🔴' },
  FRESH: { label: 'Fresh', icon: '🟢' },
  STALE: { label: 'Stale', icon: '🟡' },
  OUTDATED: { label: 'Outdated', icon: '🟠' },
  UNVERIFIABLE: { label: 'Unverifiable', icon: '⚪' },
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md' }) => {
  const colors = riskToColors(risk);
  const { label, icon } = RISK_LABELS[risk];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border
        ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
};
