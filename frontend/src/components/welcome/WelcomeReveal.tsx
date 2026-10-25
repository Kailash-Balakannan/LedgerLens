import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Logo } from '../common/Logo';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { ArrowRight } from 'lucide-react';

interface WelcomeRevealProps {
  onComplete: () => void;
}

export const WelcomeReveal: React.FC<WelcomeRevealProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const bankCardRef = useRef<HTMLDivElement>(null);
  const ledgerCardRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGPathElement>(null);
  const lensCenterRef = useRef<SVGCircleElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete
          });
        }
      });

      // 1. Initial State
      gsap.set([wordmarkRef.current, statementRef.current], { opacity: 0, y: 15 });
      gsap.set(bankCardRef.current, { opacity: 0, x: -30 });
      gsap.set(ledgerCardRef.current, { opacity: 0, x: 30 });
      if (beamRef.current) {
        const len = beamRef.current.getTotalLength();
        gsap.set(beamRef.current, { strokeDasharray: len, strokeDashoffset: len });
      }
      if (lensCenterRef.current) {
        gsap.set(lensCenterRef.current, { scale: 0, transformOrigin: 'center center' });
      }

      // 2. Timeline Choreography
      tl.to(wordmarkRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
        .to(bankCardRef.current, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .to(ledgerCardRef.current, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4')
        .to(beamRef.current, { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut' }, '-=0.2')
        .to(lensCenterRef.current, { scale: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.4')
        .to(statementRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.2')
        .to({}, { duration: 0.8 });
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete, prefersReduced]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950 p-6 select-none"
    >
      <div className="max-w-2xl w-full flex flex-col items-center text-center">
        {/* Wordmark Reveal */}
        <div ref={wordmarkRef} className="mb-10">
          <Logo size="lg" />
        </div>

        {/* Visual Animation: Two records aligning through reconciliation lens */}
        <div className="relative w-full max-w-lg h-36 flex items-center justify-between px-6 mb-8">
          {/* Bank record preview pill */}
          <div 
            ref={bankCardRef}
            className="flex flex-col items-start p-3.5 rounded-xl bg-ink-900 border border-cobalt-500/40 shadow-card text-left w-40 z-10"
          >
            <span className="text-[10px] uppercase font-mono text-cobalt-400 font-semibold tracking-wider">
              Bank Statement
            </span>
            <span className="text-xs font-mono font-bold text-ink-100 mt-1">REF1001</span>
            <span className="text-[11px] font-mono text-ink-300">₹ 1,500.00</span>
          </div>

          {/* Center SVG connector beam */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 500 120" className="w-full h-full">
              <path
                ref={beamRef}
                d="M 140 60 C 220 60, 230 60, 250 60 C 270 60, 280 60, 360 60"
                stroke="#2563EB"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                ref={lensCenterRef}
                cx="250"
                cy="60"
                r="7"
                fill="#14B8A6"
                stroke="#F8FAFC"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Ledger record preview pill */}
          <div 
            ref={ledgerCardRef}
            className="flex flex-col items-end p-3.5 rounded-xl bg-ink-900 border border-tealmatch-border shadow-card text-right w-40 z-10"
          >
            <span className="text-[10px] uppercase font-mono text-tealmatch-light font-semibold tracking-wider">
              Internal Ledger
            </span>
            <span className="text-xs font-mono font-bold text-ink-100 mt-1">REF1001</span>
            <span className="text-[11px] font-mono text-ink-300">₹ 1,500.00</span>
          </div>
        </div>

        {/* Core Promise Statement */}
        <div ref={statementRef} className="space-y-2 mb-8">
          <p className="font-display text-lg sm:text-xl font-medium text-ink-100 tracking-tight">
            “Every discrepancy has a story. <span className="text-cobalt-400">Find the evidence behind it.</span>”
          </p>
          <p className="text-xs text-ink-400 max-w-md mx-auto">
            Reconcile transactions, uncover exceptions, and create a clear audit trail—from first mismatch to final review.
          </p>
        </div>

        {/* Skip button for immediate entry */}
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink-900 hover:bg-ink-850 border border-ink-700 hover:border-ink-600 text-xs text-ink-300 hover:text-ink-100 transition-all cursor-pointer"
        >
          <span>Enter Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5 text-cobalt-400" />
        </button>
      </div>
    </div>
  );
};
