import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ReconciliationItem, ReviewStatus } from '../../types';
import { CategoryBadge } from '../common/Badge';
import { PriorityIndicator } from '../common/PriorityIndicator';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { 
  X, Building2, BookOpen, Check, History, Send, Scale
} from 'lucide-react';
import { 
  drawerBackdropVariants, 
  drawerPanelVariants, 
  containerStaggerVariants, 
  itemFadeInUpVariants 
} from '../../motion/motionTokens';

interface InvestigationDrawerProps {
  item: ReconciliationItem | null;
  onClose: () => void;
  onUpdateStatus: (reference: string, newStatus: ReviewStatus, note: string) => Promise<void>;
  reviewerId: string;
}

export const ExceptionInvestigationDrawer: React.FC<InvestigationDrawerProps> = ({
  item,
  onClose,
  onUpdateStatus,
  reviewerId
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('UNDER_INVESTIGATION');
  const [reviewerNote, setReviewerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (item) {
      setSelectedStatus(item.review_status === 'UNREVIEWED' ? 'UNDER_INVESTIGATION' : item.review_status);
      setReviewerNote(item.reviewer_note || '');
    }
  }, [item?.reference]);

  // Keyboard accessibility: Escape key closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  const handleSaveReview = async () => {
    if (!item || submitting) return;
    setSubmitting(true);
    try {
      await onUpdateStatus(item.reference, selectedStatus, reviewerNote);
      setSuccessBanner(true);
      setTimeout(() => setSuccessBanner(false), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Dimmed Backdrop */}
          <motion.div
            variants={prefersReduced ? undefined : drawerBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-ink-950/75 backdrop-blur-sm"
          />

          {/* Slide-out Drawer Panel */}
          <motion.div
            variants={prefersReduced ? undefined : drawerPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl bg-ink-900 border-l border-ink-700/80 shadow-2xl h-full flex flex-col z-10 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-5 border-b border-ink-800 flex items-center justify-between bg-ink-850/90 backdrop-blur sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-ink-100">
                      {item.reference}
                    </span>
                    <CategoryBadge category={item.exception_category} size="sm" />
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {item.exception_reason}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={prefersReduced ? undefined : { scale: 1.05 }}
                whileTap={prefersReduced ? undefined : { scale: 0.95 }}
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-400 hover:text-ink-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Success Alert Banner */}
            <AnimatePresence>
              {successBanner && (
                <motion.div
                  initial={prefersReduced ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="m-4 p-3 rounded-xl bg-tealmatch-bg border border-tealmatch-border text-tealmatch-light text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>Review decision and explanatory note saved permanently to Exasol.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              variants={prefersReduced ? undefined : containerStaggerVariants}
              initial="hidden"
              animate="visible"
              className="p-5 space-y-6 flex-1"
            >
              {/* Variance & Status Callout */}
              <motion.div
                variants={prefersReduced ? undefined : itemFadeInUpVariants}
                className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-ink-850/80 border border-ink-800"
              >
                <div>
                  <span className="text-[10px] uppercase font-mono text-ink-500 font-semibold tracking-wider">
                    Reconciliation Variance
                  </span>
                  <div className="num-tabular text-xl font-bold mt-1">
                    {item.variance === 0 ? (
                      <span className="text-tealmatch-light">₹ 0.00 (Balanced)</span>
                    ) : (
                      <span className="text-amberalert-light">
                        {item.variance > 0 ? `+ ₹ ${item.variance.toFixed(2)}` : `- ₹ ${Math.abs(item.variance).toFixed(2)}`}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-400 mt-0.5 block">
                    Bank Total ({item.currency} {item.bank_amount.toLocaleString()}) − Ledger Total ({item.currency} {item.ledger_amount.toLocaleString()})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono text-ink-500 font-semibold tracking-wider">
                    Audit Priority
                  </span>
                  <div className="mt-1">
                    <PriorityIndicator
                      score={item.intelligence.priority_score}
                      label={item.intelligence.priority_label}
                      breakdown={item.intelligence.priority_breakdown}
                    />
                  </div>
                  <span className="text-[11px] text-ink-400 mt-0.5 block">
                    Deterministically weighted based on variance and multiplicity
                  </span>
                </div>
              </motion.div>

              {/* Side-by-Side Evidence Inspection */}
              <motion.div variants={prefersReduced ? undefined : itemFadeInUpVariants}>
                <h4 className="font-display font-semibold text-xs text-ink-200 uppercase tracking-wider mb-2.5">
                  Verified Source Records in Exasol
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Bank Records */}
                  <div className="p-3.5 rounded-xl bg-ink-950/80 border border-cobalt-500/30">
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-ink-800 text-xs font-mono font-semibold text-cobalt-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Bank Statement ({item.bank_records.length})</span>
                    </div>

                    {item.bank_records.length === 0 ? (
                      <div className="py-6 text-center text-xs text-redcrit-light font-mono">
                        No matching bank statement record found in Exasol table.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.bank_records.map((b, idx) => (
                          <div key={`bank-ev-${idx}`} className="p-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs">
                            <div className="flex justify-between font-mono">
                              <span className="text-cobalt-300 font-semibold">{b.BANK_ID}</span>
                              <span className="text-ink-400">{b.TXN_DATE}</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                              <span className="text-ink-300 truncate max-w-[140px] text-[11px]">{b.DESCRIPTION}</span>
                              <span className="num-tabular font-bold text-ink-100">
                                {b.CURRENCY} {Number(b.AMOUNT).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ledger Records */}
                  <div className="p-3.5 rounded-xl bg-ink-950/80 border border-tealmatch-border/40">
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-ink-800 text-xs font-mono font-semibold text-tealmatch-light">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Internal Ledger ({item.ledger_records.length})</span>
                    </div>

                    {item.ledger_records.length === 0 ? (
                      <div className="py-6 text-center text-xs text-redcrit-light font-mono">
                        No matching internal ledger record found in Exasol table.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.ledger_records.map((l, idx) => (
                          <div key={`ledger-ev-${idx}`} className="p-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs">
                            <div className="flex justify-between font-mono">
                              <span className="text-tealmatch-light font-semibold">{l.LEDGER_ID}</span>
                              <span className="text-ink-400">{l.TXN_DATE}</span>
                            </div>
                            <div className="flex justify-between items-baseline mt-1">
                              <span className="text-ink-300 truncate max-w-[140px] text-[11px]">{l.DESCRIPTION}</span>
                              <span className="num-tabular font-bold text-ink-100">
                                {l.CURRENCY} {Number(l.AMOUNT).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Exception Intelligence Box */}
              <motion.div
                variants={prefersReduced ? undefined : itemFadeInUpVariants}
                className="p-4 rounded-xl bg-ink-850/80 border border-ink-700/80 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-ink-800 pb-2">
                  <span className="text-xs font-display font-semibold text-cobalt-400 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    Exception Intelligence & Audit Analysis
                  </span>
                  <span className="text-[10px] font-mono text-ink-500 uppercase">
                    Deterministic Rule Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-ink-500">Expected State:</span>
                    <p className="text-ink-300 mt-0.5 text-[11px] leading-relaxed">
                      {item.intelligence.expected}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-ink-500">Observed State:</span>
                    <p className="text-ink-300 mt-0.5 text-[11px] leading-relaxed">
                      {item.intelligence.observed}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-ink-800/80">
                  <span className="text-[10px] uppercase font-mono text-ink-500">Discrepancy Analysis:</span>
                  <p className="text-ink-200 mt-0.5 text-xs font-medium">
                    {item.intelligence.difference}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-ink-900 border border-cobalt-500/20 text-xs">
                  <span className="text-[10px] uppercase font-mono text-cobalt-400 font-bold block mb-1">
                    Suggested Next Check:
                  </span>
                  <p className="text-ink-200 text-xs leading-relaxed">
                    {item.intelligence.suggested_next_check}
                  </p>
                </div>
              </motion.div>

              {/* Review Workflow Action Section */}
              <motion.div
                variants={prefersReduced ? undefined : itemFadeInUpVariants}
                className="p-4 rounded-xl bg-ink-850 border border-ink-700/80 space-y-3"
              >
                <h4 className="font-display font-semibold text-xs text-ink-100 uppercase tracking-wider">
                  Reviewer Decision & Workflow
                </h4>

                {/* Status Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['UNDER_INVESTIGATION', 'RESOLVED', 'ESCALATED', 'UNREVIEWED'] as ReviewStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        selectedStatus === st
                          ? 'border-cobalt-400 bg-cobalt-500/20 text-ink-100 shadow-glow'
                          : 'border-ink-800 bg-ink-900 text-ink-400 hover:text-ink-200 hover:border-ink-700'
                      }`}
                    >
                      {st === 'UNDER_INVESTIGATION' && 'Investigating'}
                      {st === 'RESOLVED' && 'Resolve'}
                      {st === 'ESCALATED' && 'Escalate'}
                      {st === 'UNREVIEWED' && 'Reset'}
                    </button>
                  ))}
                </div>

                {/* Note Textarea */}
                <div>
                  <label className="text-[11px] text-ink-400 block mb-1">
                    Reviewer Rationale & Audit Explanation:
                  </label>
                  <textarea
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    placeholder="Explain the finding (e.g. verified with supplier that ₹200 fee was deducted, requesting invoice adjustment)..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-ink-900 border border-ink-700/80 text-xs text-ink-100 placeholder-ink-500 focus:outline-none focus:border-cobalt-400 font-sans"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-ink-500 font-mono">
                    Reviewer: {reviewerId}
                  </span>

                  <motion.button
                    type="button"
                    whileHover={prefersReduced ? undefined : { scale: 1.02 }}
                    whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                    onClick={handleSaveReview}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-glow transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Persisting...' : 'Save Decision'}</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Audit History Timeline */}
              {item.history && item.history.length > 0 && (
                <motion.div
                  variants={prefersReduced ? undefined : itemFadeInUpVariants}
                  className="p-4 rounded-xl bg-ink-850/60 border border-ink-800 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-300">
                    <History className="w-3.5 h-3.5 text-cobalt-400" />
                    <span>Review History Audit Trail</span>
                  </div>

                  <div className="space-y-2.5">
                    {item.history.map((h, i) => (
                      <div key={`hist-${i}`} className="p-2.5 rounded-lg bg-ink-900 border border-ink-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-ink-400 pb-1 mb-1 border-b border-ink-800">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-semibold text-ink-200">{h.NEW_STATUS}</span>
                            <span>by {h.REVIEWER_ID}</span>
                          </div>
                          <span className="font-mono">{h.CREATED_AT}</span>
                        </div>
                        {h.NOTE && (
                          <p className="text-ink-200 text-xs italic">
                            "{h.NOTE}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
