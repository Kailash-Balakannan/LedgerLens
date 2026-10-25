import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAuditHistory } from '../../api';
import type { AuditLogEntry } from '../../types';
import { ReviewStatusBadge } from '../common/Badge';
import { History, X, Download, RefreshCw } from 'lucide-react';
import { useReducedMotion } from '../../motion/useReducedMotion';

interface AuditLogModalProps {
  runId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ runId, isOpen, onClose }) => {
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, runId]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditHistory(runId);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-3xl bg-ink-900 border border-ink-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-ink-800 flex items-center justify-between bg-ink-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cobalt-500/10 border border-cobalt-500/20 text-cobalt-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-ink-100">
                    Audit Trail & Review Decision History
                  </h3>
                  <p className="text-xs text-ink-400 mt-0.5 font-mono">
                    Dataset Run: {runId} · Stored in Exasol table CLOSEWISE.LEDGERLENS_REVIEW_HISTORY
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/export/audit?run_id=${encodeURIComponent(runId)}`}
                  download={`audit_log_${runId}.csv`}
                  className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 border border-ink-700 text-xs text-ink-200 hover:text-white flex items-center gap-1.5 transition-colors font-mono cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cobalt-400" />
                  <span>Export CSV</span>
                </a>

                <motion.button
                  whileHover={prefersReduced ? undefined : { scale: 1.05 }}
                  whileTap={prefersReduced ? undefined : { scale: 0.95 }}
                  onClick={onClose}
                  aria-label="Close audit log"
                  className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-400 hover:text-ink-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="p-5 overflow-y-auto flex-1">
              {loading ? (
                <div className="py-16 text-center text-xs text-ink-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cobalt-400" />
                  <span>Querying audit records from Exasol...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-16 text-center text-xs text-ink-500 font-mono">
                  No audit actions recorded for run '{runId}' yet. Change an exception status to record decisions.
                </div>
              ) : (
                <div className="divide-y divide-ink-800 border border-ink-800 rounded-xl overflow-hidden bg-ink-850/50">
                  {history.map((h, i) => (
                    <motion.div
                      key={`entry-${i}`}
                      initial={prefersReduced ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="p-3.5 text-xs hover:bg-ink-800/40 transition-colors"
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-ink-800/40">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-ink-100">{h.REFERENCE}</span>
                          <span className="text-ink-500">·</span>
                          <span className="text-[10px] text-ink-400">{h.HISTORY_ID}</span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-400">
                          <span>{h.REVIEWER_ID}</span>
                          <span className="text-ink-600">·</span>
                          <span>{h.CREATED_AT}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <ReviewStatusBadge status={h.OLD_STATUS} size="sm" />
                          <span className="text-ink-500 font-mono text-xs">→</span>
                          <ReviewStatusBadge status={h.NEW_STATUS} size="sm" />
                        </div>

                        {h.NOTE && (
                          <p className="text-ink-300 italic text-[11px] max-w-md text-right">
                            "{h.NOTE}"
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
