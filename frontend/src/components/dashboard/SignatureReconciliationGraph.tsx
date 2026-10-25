import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { ReconciliationItem } from '../../types';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { Building2, BookOpen, CheckCircle2, Split, Ban, ChevronRight } from 'lucide-react';
import { EASINGS } from '../../motion/motionTokens';

interface SignatureGraphProps {
  items: ReconciliationItem[];
  selectedReference: string | null;
  onSelectReference: (reference: string) => void;
}

export const SignatureReconciliationGraph: React.FC<SignatureGraphProps> = ({
  items,
  selectedReference,
  onSelectReference
}) => {
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const prefersReduced = useReducedMotion();

  // Filter items while keeping order
  const filteredItems = items.filter((item) => {
    if (activeCategoryFilter === 'ALL') return true;
    if (activeCategoryFilter === 'EXCEPTIONS') return item.exception_category !== 'MATCHED';
    return item.exception_category === activeCategoryFilter;
  });

  const displayItems = filteredItems.slice(0, 7);
  const activeRef = hoveredRef || selectedReference;

  return (
    <div className="rounded-2xl bg-ink-900 border border-ink-800 shadow-card flex flex-col overflow-hidden">
      {/* Topology Header & HUD */}
      <div className="px-4 py-3 border-b border-ink-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-ink-850/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cobalt-400" />
            <h3 className="font-display font-semibold text-sm text-ink-100 tracking-tight">
              Signature Reconciliation Graph
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-ink-800 text-ink-300 border border-ink-700">
              Interactive Topology
            </span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5">
            Verifiable transaction alignment mapping bank statements to internal ledger records. Click any row to inspect forensic evidence.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-950 border border-ink-800 text-[11px] font-mono self-start md:self-auto">
          {[
            { id: 'ALL', label: 'All (7)' },
            { id: 'EXCEPTIONS', label: 'Exceptions (5)' },
            { id: 'MATCHED', label: 'Matched (2)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                activeCategoryFilter === tab.id
                  ? 'bg-ink-800 text-ink-100 font-medium shadow-sm border border-ink-700/80'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column Headers & Classification Key */}
      <div className="px-4 py-2 border-b border-ink-800/60 bg-ink-950/60 grid grid-cols-12 gap-3 items-center text-[10px] font-mono uppercase tracking-wider text-ink-400">
        <div className="col-span-5 flex items-center gap-1.5 text-cobalt-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>Bank Source Record</span>
        </div>

        <div className="col-span-2 text-center text-ink-500 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1 text-tealmatch-light text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-tealmatch-light" /> Match
          </span>
          <span className="flex items-center gap-1 text-amberalert-light text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amberalert-light" /> Variance
          </span>
          <span className="flex items-center gap-1 text-redcrit-light text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-redcrit-light" /> Missing
          </span>
        </div>

        <div className="col-span-5 flex items-center justify-end gap-1.5 text-tealmatch-light">
          <span>Internal Ledger Record</span>
          <BookOpen className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Lanes Canvas */}
      <div className="p-2.5 sm:p-3 space-y-1.5 flex-1">
        {displayItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-500 font-mono">
            No transactions match the selected filter criteria.
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const isHighlighted = activeRef === item.reference;
            const isDimmed = Boolean(activeRef && !isHighlighted);
            const isMatched = item.exception_category === 'MATCHED';
            const isAmountMismatch = item.exception_category === 'AMOUNT_MISMATCH';
            const isDuplicate = item.exception_category === 'DUPLICATE_REFERENCE';
            const isMissingLedger = item.exception_category === 'MISSING_FROM_LEDGER';
            const isMissingBank = item.exception_category === 'MISSING_FROM_BANK';

            const bankRecord = item.bank_records[0];
            const ledgerRecords = item.ledger_records;

            // Indicator border color
            let accentBorder = 'border-l-tealmatch-light';
            if (isAmountMismatch || isDuplicate) accentBorder = 'border-l-amberalert-light';
            if (isMissingLedger || isMissingBank) accentBorder = 'border-l-redcrit-light';

            return (
              <motion.div
                key={`lane-${item.reference}`}
                initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                animate={{
                  opacity: isDimmed ? 0.35 : 1,
                  y: 0,
                  scale: isHighlighted ? 1.005 : 1
                }}
                transition={{
                  duration: 0.2,
                  delay: prefersReduced ? 0 : idx * 0.025,
                  ease: EASINGS.easeOutCubic
                }}
                onMouseEnter={() => setHoveredRef(item.reference)}
                onMouseLeave={() => setHoveredRef(null)}
                onClick={() => onSelectReference(item.reference)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectReference(item.reference);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Inspect reference ${item.reference}, status ${item.exception_category}`}
                className={`grid grid-cols-12 gap-2 sm:gap-3 items-center p-2 rounded-xl border border-l-[3px] transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-cobalt-400 ${accentBorder} ${
                  isHighlighted
                    ? 'bg-ink-850/95 border-ink-600 shadow-md'
                    : 'bg-ink-950/40 border-ink-800/80 hover:bg-ink-850/60 hover:border-ink-700'
                }`}
              >
                {/* 1. Left: Bank Terminal Card */}
                <div className="col-span-5 relative">
                  {bankRecord ? (
                    <div className="p-1.5 sm:p-2 rounded-lg bg-ink-900 border border-ink-800 group-hover:border-ink-700/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-[9px] font-semibold text-cobalt-400 bg-cobalt-500/10 px-1.5 py-0.2 rounded border border-cobalt-500/20">
                            {bankRecord.BANK_ID}
                          </span>
                          <span className="text-xs font-bold text-ink-100">
                            {item.reference}
                          </span>
                        </div>
                        <span className="num-tabular text-xs font-semibold text-ink-100">
                          {bankRecord.CURRENCY || item.currency} {Number(bankRecord.AMOUNT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 text-[11px] text-ink-400">
                        <span className="truncate max-w-[140px] sm:max-w-[200px]" title={bankRecord.DESCRIPTION}>
                          {bankRecord.DESCRIPTION}
                        </span>
                        <span className="font-mono text-[10px] text-ink-500 hidden sm:inline">
                          {bankRecord.TXN_DATE}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Omitted at Bank */
                    <div className="p-1.5 sm:p-2 rounded-lg border border-dashed border-redcrit-border bg-redcrit-bg/20 flex items-center justify-between text-xs text-redcrit-light font-mono">
                      <div className="flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" />
                        <span>Omitted in Bank</span>
                      </div>
                      <span className="text-[10px] text-ink-500">0 records</span>
                    </div>
                  )}
                </div>

                {/* 2. Center: Continuous Forensic Conduit Bridge */}
                <div className="col-span-2 h-10 relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 160 36"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {/* Matched Direct Beam */}
                    {isMatched && (
                      <g>
                        <motion.line
                          x1="0"
                          y1="18"
                          x2="160"
                          y2="18"
                          stroke={isHighlighted ? '#14B8A6' : '#0D9488'}
                          strokeWidth={isHighlighted ? 2.5 : 1.8}
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 }}
                        />
                        <circle cx="80" cy="18" r="3.5" fill="#14B8A6" stroke="#07090E" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Amount Mismatch Conduit */}
                    {isAmountMismatch && (
                      <g>
                        <motion.line
                          x1="0"
                          y1="18"
                          x2="160"
                          y2="18"
                          stroke={isHighlighted ? '#F59E0B' : '#D97706'}
                          strokeWidth={isHighlighted ? 2.5 : 1.8}
                          strokeDasharray="4,3"
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 }}
                        />
                        <circle cx="80" cy="18" r="3.5" fill="#F59E0B" stroke="#07090E" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Duplicate Branch Fork */}
                    {isDuplicate && (
                      <g>
                        <motion.path
                          d="M 0 18 C 50 18, 90 8, 160 8"
                          fill="none"
                          stroke={isHighlighted ? '#F59E0B' : '#D97706'}
                          strokeWidth={isHighlighted ? 2.5 : 1.8}
                          strokeDasharray="4,2"
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 }}
                        />
                        <motion.path
                          d="M 0 18 C 50 18, 90 28, 160 28"
                          fill="none"
                          stroke={isHighlighted ? '#F59E0B' : '#D97706'}
                          strokeWidth={isHighlighted ? 2.5 : 1.8}
                          strokeDasharray="4,2"
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 + 0.04 }}
                        />
                        <circle cx="45" cy="18" r="3" fill="#F59E0B" stroke="#07090E" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Missing from Ledger: Continuous line crossing entire span into placeholder */}
                    {isMissingLedger && (
                      <g>
                        {/* Primary left conduit */}
                        <motion.line
                          x1="0"
                          y1="18"
                          x2="80"
                          y2="18"
                          stroke="#EF4444"
                          strokeWidth={isHighlighted ? 2.2 : 1.6}
                          strokeDasharray="4,3"
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 }}
                        />
                        {/* Continuous right extension into omitted box */}
                        <motion.line
                          x1="80"
                          y1="18"
                          x2="160"
                          y2="18"
                          stroke="#EF4444"
                          strokeWidth={1.2}
                          strokeDasharray="2,3"
                          strokeOpacity={0.6}
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 + 0.05 }}
                        />
                        {/* Center barrier pin */}
                        <circle cx="80" cy="18" r="3.5" fill="#EF4444" stroke="#07090E" strokeWidth="1.5" />
                        <line x1="77" y1="15" x2="83" y2="21" stroke="#07090E" strokeWidth="1.5" />
                      </g>
                    )}

                    {/* Missing from Bank: Continuous line crossing entire span from placeholder */}
                    {isMissingBank && (
                      <g>
                        {/* Continuous left extension from omitted box */}
                        <motion.line
                          x1="0"
                          y1="18"
                          x2="80"
                          y2="18"
                          stroke="#EF4444"
                          strokeWidth={1.2}
                          strokeDasharray="2,3"
                          strokeOpacity={0.6}
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 }}
                        />
                        {/* Primary right conduit */}
                        <motion.line
                          x1="80"
                          y1="18"
                          x2="160"
                          y2="18"
                          stroke="#EF4444"
                          strokeWidth={isHighlighted ? 2.2 : 1.6}
                          strokeDasharray="4,3"
                          initial={prefersReduced ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.04 + 0.05 }}
                        />
                        {/* Center barrier pin */}
                        <circle cx="80" cy="18" r="3.5" fill="#EF4444" stroke="#07090E" strokeWidth="1.5" />
                        <line x1="77" y1="15" x2="83" y2="21" stroke="#07090E" strokeWidth="1.5" />
                      </g>
                    )}
                  </svg>

                  {/* Clean Pill Label (No repetitive glyphs) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isMatched && (
                      <span className="px-2 py-0.5 rounded-full bg-ink-900 border border-tealmatch-border/60 text-[10px] font-mono text-tealmatch-light font-medium flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Match</span>
                      </span>
                    )}

                    {isAmountMismatch && (
                      <span className="px-2.5 py-0.5 rounded-full bg-ink-900 border border-amberalert-border/80 text-[10px] font-mono text-amberalert-light font-semibold shadow-sm">
                        Δ ₹{Math.abs(item.variance).toFixed(2)}
                      </span>
                    )}

                    {isDuplicate && (
                      <span className="px-2 py-0.5 rounded-full bg-ink-900 border border-amberalert-border/80 text-[10px] font-mono text-amberalert-light font-semibold flex items-center gap-1 shadow-sm">
                        <Split className="w-2.5 h-2.5" />
                        <span>1 → 2 Split</span>
                      </span>
                    )}

                    {isMissingLedger && (
                      <span className="px-2 py-0.5 rounded-full bg-ink-900 border border-redcrit-border/80 text-[10px] font-mono text-redcrit-light font-medium flex items-center gap-1 shadow-sm">
                        <Ban className="w-2.5 h-2.5" />
                        <span>Missing</span>
                      </span>
                    )}

                    {isMissingBank && (
                      <span className="px-2 py-0.5 rounded-full bg-ink-900 border border-redcrit-border/80 text-[10px] font-mono text-redcrit-light font-medium flex items-center gap-1 shadow-sm">
                        <Ban className="w-2.5 h-2.5" />
                        <span>Missing</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Right: Ledger Terminal Card(s) */}
                <div className="col-span-5 flex flex-col gap-1 relative">
                  {ledgerRecords.length > 0 ? (
                    ledgerRecords.map((l, lIdx) => (
                      <div
                        key={`ledger-${l.LEDGER_ID}-${lIdx}`}
                        className="p-1.5 sm:p-2 rounded-lg bg-ink-900 border border-ink-800 group-hover:border-ink-700/80 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="num-tabular text-xs font-semibold text-ink-100">
                            {l.CURRENCY || item.currency} {Number(l.AMOUNT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-xs font-bold text-ink-100">
                              {item.reference}
                            </span>
                            <span className="text-[9px] font-semibold text-tealmatch-light bg-tealmatch-bg px-1.5 py-0.2 rounded border border-tealmatch-border/40">
                              {l.LEDGER_ID}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-0.5 text-[11px] text-ink-400">
                          <span className="font-mono text-[10px] text-ink-500 hidden sm:inline">
                            {l.TXN_DATE}
                          </span>
                          <span className="truncate max-w-[140px] sm:max-w-[200px] text-right ml-auto" title={l.DESCRIPTION}>
                            {l.DESCRIPTION}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Omitted at Ledger */
                    <div className="p-1.5 sm:p-2 rounded-lg border border-dashed border-redcrit-border bg-redcrit-bg/20 flex items-center justify-between text-xs text-redcrit-light font-mono">
                      <span className="text-[10px] text-ink-500">0 records</span>
                      <div className="flex items-center gap-1.5">
                        <span>Omitted in Ledger</span>
                        <Ban className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Audit Bar */}
      <div className="px-4 py-2 border-t border-ink-800 bg-ink-950/60 flex items-center justify-between text-[11px] text-ink-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span>Click any reference row to slide out the evidence drawer</span>
          <ChevronRight className="w-3 h-3 text-ink-600" />
        </span>
        <span>Showing {displayItems.length} of {filteredItems.length} references</span>
      </div>
    </div>
  );
};
