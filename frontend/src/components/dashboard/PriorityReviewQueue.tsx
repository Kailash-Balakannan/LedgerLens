import React from 'react';
import type { ReconciliationItem } from '../../types';
import { CategoryBadge, ReviewStatusBadge } from '../common/Badge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { ArrowUpRight, ListOrdered } from 'lucide-react';

interface PriorityReviewQueueProps {
  items: ReconciliationItem[];
  onSelectReference: (reference: string) => void;
}

export const PriorityReviewQueue: React.FC<PriorityReviewQueueProps> = ({
  items,
  onSelectReference
}) => {
  // Filter for unresolved items and sort by priority score descending
  const queue = items
    .filter((i) => i.exception_category !== 'MATCHED' && i.review_status !== 'RESOLVED')
    .sort((a, b) => b.intelligence.priority_score - a.intelligence.priority_score)
    .slice(0, 5);

  return (
    <div className="p-5 rounded-2xl bg-ink-900 border border-ink-700/80 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-ink-800">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cobalt-400" />
            <h3 className="font-display font-semibold text-sm text-ink-100 tracking-tight">
              Prioritized Review Queue
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ink-500">
            Ranked by deterministic score
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500">
            All current exceptions have been resolved or reconciled.
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <div
                key={`queue-${item.reference}`}
                onClick={() => onSelectReference(item.reference)}
                className="p-2.5 rounded-xl border border-ink-800 bg-ink-850 hover:border-cobalt-500/50 hover:bg-ink-800 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-ink-100 group-hover:text-cobalt-300 transition-colors">
                      {item.reference}
                    </span>
                    <span className="text-[10px] text-ink-400 font-mono">
                      Δ ₹{Math.abs(item.variance).toFixed(2)}
                    </span>
                  </div>

                  <CategoryBadge category={item.exception_category} size="sm" />
                </div>

                <div className="flex items-center gap-3">
                  <PriorityIndicator
                    score={item.intelligence.priority_score}
                    label={item.intelligence.priority_label}
                    breakdown={item.intelligence.priority_breakdown}
                  />

                  <ReviewStatusBadge status={item.review_status} size="sm" />

                  <ArrowUpRight className="w-3.5 h-3.5 text-ink-500 group-hover:text-cobalt-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
