import React from 'react';
import { motion } from 'motion/react';
import type { ExceptionCategory } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { PieChart } from 'lucide-react';

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
  const prefersReduced = useReducedMotion();

  const categories: { key: ExceptionCategory; label: string; color: string; count: number }[] = [
    { key: 'MATCHED', label: 'Matched', color: 'bg-tealmatch-light', count: counts['MATCHED'] || 0 },
    { key: 'AMOUNT_MISMATCH', label: 'Amount Mismatch', color: 'bg-amberalert-light', count: counts['AMOUNT_MISMATCH'] || 0 },
    { key: 'DUPLICATE_REFERENCE', label: 'Duplicate Reference', color: 'bg-amberalert-dark', count: counts['DUPLICATE_REFERENCE'] || 0 },
    { key: 'MISSING_FROM_LEDGER', label: 'Missing from Ledger', color: 'bg-redcrit-light', count: counts['MISSING_FROM_LEDGER'] || 0 },
    { key: 'MISSING_FROM_BANK', label: 'Missing from Bank', color: 'bg-redcrit-dark', count: counts['MISSING_FROM_BANK'] || 0 },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-ink-900 border border-ink-800 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-tealmatch-light" />
            <h3 className="font-display font-semibold text-sm text-ink-100 tracking-tight">
              Classification Distribution
            </h3>
          </div>
          <span className="num-tabular text-xs font-mono text-ink-400">
            {totalReferences} Total References
          </span>
        </div>

        {/* Proportional Segment Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-ink-950 flex gap-0.5 border border-ink-800/80 mb-3.5 p-0.5">
          {categories.map((c) => {
            const pct = totalReferences > 0 ? (c.count / totalReferences) * 100 : 0;
            if (pct === 0) return null;
            return (
              <motion.div
                key={`bar-${c.key}`}
                initial={prefersReduced ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full ${c.color} rounded-sm`}
                title={`${c.label}: ${c.count} (${pct.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Category Filter Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {categories.map((c) => {
            const isSelected = activeFilter === c.key;
            return (
              <motion.button
                key={`btn-${c.key}`}
                whileHover={prefersReduced ? undefined : { scale: 1.012, transition: { duration: 0.1 } }}
                whileTap={prefersReduced ? undefined : { scale: 0.988 }}
                onClick={() => onFilterCategory && onFilterCategory(isSelected ? 'ALL' : c.key)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cobalt-400/80 bg-cobalt-500/10 shadow-sm'
                    : 'border-ink-800/80 bg-ink-950/40 hover:border-ink-700 hover:bg-ink-850/60'
                }`}
              >
                <CategoryBadge category={c.key} size="sm" />
                <span className="num-tabular text-xs font-mono font-bold text-ink-200">
                  {c.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
