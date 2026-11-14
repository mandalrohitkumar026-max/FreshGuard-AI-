import React from 'react';
import { LucideIcon, CheckCircle2, XCircle, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';

export type VerificationStatusType =
  | 'SUPPORTED'
  | 'OUTDATED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONFLICTING'
  | 'UNVERIFIED'
  | 'NOT_CHECKED';

interface ClaimStatusBadgeProps {
  status: VerificationStatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const ClaimStatusBadge: React.FC<ClaimStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const normalized = (status || 'UNVERIFIED').toUpperCase() as VerificationStatusType;

  const configMap: Record<
    VerificationStatusType,
    { label: string; bg: string; text: string; border: string; icon: LucideIcon }
  > = {
    SUPPORTED: {
      label: 'SUPPORTED',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    OUTDATED: {
      label: 'OUTDATED',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: XCircle,
    },
    PARTIALLY_SUPPORTED: {
      label: 'PARTIALLY SUPPORTED',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: AlertTriangle,
    },
    CONFLICTING: {
      label: 'CONFLICTING',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: HelpCircle,
    },
    NOT_CHECKED: {
      label: 'PERMANENT FACT',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: ShieldCheck,
    },
    UNVERIFIED: {
      label: 'UNVERIFIED',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: HelpCircle,
    },
  };

  const config = configMap[normalized] || configMap.UNVERIFIED;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  }[size];

  const iconSizes = { sm: 11, md: 13, lg: 16 }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border shadow-2xs ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
