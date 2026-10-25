import React from 'react';
import type { ExceptionCategory } from '../../types';
import { CategoryBadge } from '../common/Badge';

interface CategoryBreakdownProps {
  counts: Record<string, number>;
  totalReferences: number;
  onFilterCategory?: (category: ExceptionCategory | 'ALL') => void;
  activeFilter?: ExceptionCategory | 'ALL';
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  counts,
  totalReferences,
  onFilterCategory,
  activeFilter = 'ALL'
}) => {
  const categories: { key: ExceptionCategory; label: string; color: string; count: number }[] = [
    { key: 'MATCHED', label: 'Matched', color: 'bg-tealmatch-light', count: counts['MATCHED'] || 0 },
    { key: 'AMOUNT_MISMATCH', label: 'Amount Mismatch', color: 'bg-amberalert-light', count: counts['AMOUNT_MISMATCH'] || 0 },
    { key: 'DUPLICATE_REFERENCE', label: 'Duplicate Reference', color: 'bg-amberalert-dark', count: counts['DUPLICATE_REFERENCE'] || 0 },
    { key: 'MISSING_FROM_LEDGER', label: 'Missing from Ledger', color: 'bg-redcrit-light', count: counts['MISSING_FROM_LEDGER'] || 0 },
    { key: 'MISSING_FROM_BANK', label: 'Missing from Bank', color: 'bg-redcrit-dark', count: counts['MISSING_FROM_BANK'] || 0 },
  ];

  return (
    <div className="p-5 rounded-2xl bg-ink-900 border border-ink-700/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm text-ink-100 tracking-tight">
            Exception Classification Breakdown
          </h3>
          <span className="num-tabular text-xs font-mono text-ink-400">
            {totalReferences} Total References
          </span>
        </div>

        {/* Proportional Segment Bar */}
        <div className="w-full h-2.5 rounded-full overflow-hidden bg-ink-800 flex gap-0.5 border border-ink-700/50 mb-4">
          {categories.map((c) => {
            const pct = totalReferences > 0 ? (c.count / totalReferences) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={`bar-${c.key}`}
                className={`h-full ${c.color} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${c.label}: ${c.count} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Category Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories.map((c) => {
            const isSelected = activeFilter === c.key;
            return (
              <button
                key={`btn-${c.key}`}
                onClick={() => onFilterCategory && onFilterCategory(isSelected ? 'ALL' : c.key)}
                className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cobalt-400 bg-cobalt-500/10'
                    : 'border-ink-800 bg-ink-850 hover:border-ink-700 hover:bg-ink-800'
                }`}
              >
                <CategoryBadge category={c.key} size="sm" />
                <span className="num-tabular text-xs font-mono font-bold text-ink-200">
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
