import React from 'react';
import { motion } from 'motion/react';
import type { ReconciliationItem } from '../../types';
import { CategoryBadge, ReviewStatusBadge } from '../common/Badge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { ArrowUpRight, ListOrdered } from 'lucide-react';
import { useReducedMotion } from '../../motion/useReducedMotion';

interface PriorityReviewQueueProps {
  items: ReconciliationItem[];
  onSelectReference: (reference: string) => void;
}

export const PriorityReviewQueue: React.FC<PriorityReviewQueueProps> = ({
  items,
  onSelectReference
}) => {
  const prefersReduced = useReducedMotion();

  // Filter for unresolved items and sort by priority score descending
  const queue = items
    .filter((i) => i.exception_category !== 'MATCHED' && i.review_status !== 'RESOLVED')
    .sort((a, b) => b.intelligence.priority_score - a.intelligence.priority_score)
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-ink-900 border border-ink-800 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cobalt-400" />
            <h3 className="font-display font-semibold text-sm text-ink-100 tracking-tight">
              Prioritized Review Queue
            </h3>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">
            Weighted Score Ranking
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500 font-mono">
            All current exceptions have been resolved or verified.
          </div>
        ) : (
          <div className="space-y-1.5">
            {queue.map((item, idx) => (
              <motion.div
                key={`queue-${item.reference}`}
                initial={prefersReduced ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
                whileHover={prefersReduced ? undefined : { x: 2, transition: { duration: 0.1 } }}
                onClick={() => onSelectReference(item.reference)}
                className="p-2 sm:p-2.5 rounded-lg border border-ink-800/80 bg-ink-950/40 hover:border-ink-700 hover:bg-ink-850/80 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] text-ink-500 font-semibold w-4 text-center">
                    0{idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-ink-100 group-hover:text-cobalt-300 transition-colors">
                      {item.reference}
                    </span>
                    <span className="num-tabular text-[10px] text-ink-400 font-mono">
                      Δ ₹{Math.abs(item.variance).toFixed(2)}
                    </span>
                  </div>

                  <CategoryBadge category={item.exception_category} size="sm" />
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  <PriorityIndicator
                    score={item.intelligence.priority_score}
                    label={item.intelligence.priority_label}
                    breakdown={item.intelligence.priority_breakdown}
                  />

                  <ReviewStatusBadge status={item.review_status} size="sm" />

                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-500 group-hover:text-cobalt-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
