import React from 'react';
import type { ExceptionCategory, ReviewStatus } from '../../types';
import { CheckCircle2, AlertTriangle, Copy, ArrowRightLeft, Clock, ShieldAlert, CheckCheck, Eye } from 'lucide-react';

interface CategoryBadgeProps {
  category: ExceptionCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const configs: Record<ExceptionCategory, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    MATCHED: {
      label: 'Matched',
      icon: <CheckCircle2 className="w-3 h-3 text-tealmatch-light" />,
      bg: 'bg-tealmatch-bg',
      text: 'text-tealmatch-light',
      border: 'border-tealmatch-border'
    },
    AMOUNT_MISMATCH: {
      label: 'Amount Mismatch',
      icon: <AlertTriangle className="w-3 h-3 text-amberalert-light" />,
      bg: 'bg-amberalert-bg',
      text: 'text-amberalert-light',
      border: 'border-amberalert-border'
    },
    DUPLICATE_REFERENCE: {
      label: 'Duplicate Reference',
      icon: <Copy className="w-3 h-3 text-amberalert-light" />,
      bg: 'bg-amberalert-bg',
      text: 'text-amberalert-light',
      border: 'border-amberalert-border'
    },
    MISSING_FROM_LEDGER: {
      label: 'Missing in Ledger',
      icon: <ArrowRightLeft className="w-3 h-3 text-redcrit-light" />,
      bg: 'bg-redcrit-bg',
      text: 'text-redcrit-light',
      border: 'border-redcrit-border'
    },
    MISSING_FROM_BANK: {
      label: 'Missing in Bank',
      icon: <ArrowRightLeft className="w-3 h-3 text-redcrit-light" />,
      bg: 'bg-redcrit-bg',
      text: 'text-redcrit-light',
      border: 'border-redcrit-border'
    },
    CURRENCY_MISMATCH: {
      label: 'Currency Mismatch',
      icon: <AlertTriangle className="w-3 h-3 text-amberalert-light" />,
      bg: 'bg-amberalert-bg',
      text: 'text-amberalert-light',
      border: 'border-amberalert-border'
    },
    AMBIGUOUS_EXCEPTION: {
      label: 'Ambiguous Exception',
      icon: <AlertTriangle className="w-3 h-3 text-ink-400" />,
      bg: 'bg-ink-800',
      text: 'text-ink-300',
      border: 'border-ink-700'
    }
  };

  const c = configs[category] || configs.AMBIGUOUS_EXCEPTION;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${c.bg} ${c.text} ${c.border} ${padding} transition-all`}>
      {c.icon}
      <span>{c.label}</span>
    </span>
  );
};

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  size?: 'sm' | 'md';
}

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<ReviewStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    UNREVIEWED: {
      label: 'Unreviewed',
      icon: <Clock className="w-3 h-3 text-ink-400" />,
      bg: 'bg-ink-850',
      text: 'text-ink-400',
      border: 'border-ink-700'
    },
    UNDER_INVESTIGATION: {
      label: 'Under Investigation',
      icon: <Eye className="w-3 h-3 text-cobalt-400" />,
      bg: 'bg-cobalt-500/10',
      text: 'text-cobalt-400',
      border: 'border-cobalt-500/30'
    },
    RESOLVED: {
      label: 'Resolved',
      icon: <CheckCheck className="w-3 h-3 text-tealmatch-light" />,
      bg: 'bg-tealmatch-bg',
      text: 'text-tealmatch-light',
      border: 'border-tealmatch-border'
    },
    ESCALATED: {
      label: 'Escalated',
      icon: <ShieldAlert className="w-3 h-3 text-redcrit-light" />,
      bg: 'bg-redcrit-bg',
      text: 'text-redcrit-light',
      border: 'border-redcrit-border'
    }
  };

  const s = configs[status] || configs.UNREVIEWED;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${s.bg} ${s.text} ${s.border} ${padding}`}>
      {s.icon}
      <span>{s.label}</span>
    </span>
  );
};
