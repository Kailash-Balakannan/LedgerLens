import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../common/Logo';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { ArrowRight } from 'lucide-react';
import { EASINGS } from '../../motion/motionTokens';

interface WelcomeRevealProps {
  onComplete: () => void;
}

export const WelcomeReveal: React.FC<WelcomeRevealProps> = ({ onComplete }) => {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      const timer = setTimeout(onComplete, 200);
      return () => clearTimeout(timer);
    }
    // Auto-advance into dashboard after entrance motion completes
    const autoTimer = setTimeout(onComplete, 2400);
    return () => clearTimeout(autoTimer);
  }, [onComplete, prefersReduced]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950 p-6 select-none"
      >
        {/* Subtle radial ambient spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="relative max-w-2xl w-full flex flex-col items-center text-center z-10">
          {/* Logo Reveal */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASINGS.easeOutCubic }}
            className="mb-8"
          >
            <Logo size="lg" />
          </motion.div>

          {/* Visual Animation: Two records aligning through reconciliation lens */}
          <div className="relative w-full max-w-lg h-32 flex items-center justify-between px-6 mb-8">
            {/* Bank record preview pill */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASINGS.easeOutCubic }}
              className="flex flex-col items-start p-3 rounded-xl bg-ink-900 border border-cobalt-500/40 shadow-card text-left w-36 sm:w-40 z-10"
            >
              <span className="text-[10px] uppercase font-mono text-cobalt-400 font-semibold tracking-wider">
                Bank Statement
              </span>
              <span className="text-xs font-mono font-bold text-ink-100 mt-0.5">REF1001</span>
              <span className="num-tabular text-[11px] font-mono text-ink-300">₹ 1,500.00</span>
            </motion.div>

            {/* Center SVG connector beam */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                <motion.path
                  d="M 140 60 C 220 60, 230 60, 250 60 C 270 60, 280 60, 360 60"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  fill="none"
                  initial={prefersReduced ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="250"
                  cy="60"
                  r="7"
                  fill="#14B8A6"
                  stroke="#F8FAFC"
                  strokeWidth="2"
                  initial={prefersReduced ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8, ease: 'backOut' }}
                />
              </svg>
            </div>

            {/* Ledger record preview pill */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASINGS.easeOutCubic }}
              className="flex flex-col items-end p-3 rounded-xl bg-ink-900 border border-tealmatch-border shadow-card text-right w-36 sm:w-40 z-10"
            >
              <span className="text-[10px] uppercase font-mono text-tealmatch-light font-semibold tracking-wider">
                Internal Ledger
              </span>
              <span className="text-xs font-mono font-bold text-ink-100 mt-0.5">REF1001</span>
              <span className="num-tabular text-[11px] font-mono text-ink-300">₹ 1,500.00</span>
            </motion.div>
          </div>

          {/* Core Promise Statement */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: EASINGS.easeOutCubic }}
            className="space-y-2 mb-8"
          >
            <p className="font-display text-lg sm:text-xl font-medium text-ink-100 tracking-tight">
              “Every discrepancy has a story. <span className="text-cobalt-400">Find the evidence behind it.</span>”
            </p>
            <p className="text-xs text-ink-400 max-w-md mx-auto leading-relaxed">
              Reconcile transactions, uncover exceptions, and create a clear audit trail—from first mismatch to final review.
            </p>
          </motion.div>

          {/* Enter Dashboard Action Button */}
          <motion.button
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9, ease: EASINGS.easeOutCubic }}
            whileHover={prefersReduced ? undefined : { scale: 1.03, y: -1 }}
            whileTap={prefersReduced ? undefined : { scale: 0.97 }}
            onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 text-xs text-white font-semibold shadow-glow transition-all cursor-pointer"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
