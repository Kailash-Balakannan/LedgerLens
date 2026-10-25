import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { ReconciliationItem } from '../../types';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { Building2, BookOpen } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  // Limit to top 7 references to ensure a crystal clear, non-cluttered editorial visualization
  const displayItems = items.slice(0, 7);

  interface NodeInfo {
    id: string;
    ref: string;
    amount: number;
    currency: string;
    desc: string;
    category: string;
    yIndex: number;
  }

  const bankNodes: NodeInfo[] = [];
  const ledgerNodes: NodeInfo[] = [];

  displayItems.forEach((item, idx) => {
    // Bank nodes
    if (item.bank_records.length > 0) {
      item.bank_records.forEach((b) => {
        bankNodes.push({
          id: b.BANK_ID || `B-${item.reference}`,
          ref: item.reference,
          amount: Number(b.AMOUNT),
          currency: b.CURRENCY || item.currency,
          desc: b.DESCRIPTION,
          category: item.exception_category,
          yIndex: idx
        });
      });
    } else {
      bankNodes.push({
        id: `NONE-${item.reference}`,
        ref: item.reference,
        amount: 0,
        currency: item.currency,
        desc: 'No record in bank statement',
        category: 'MISSING_FROM_BANK',
        yIndex: idx
      });
    }

    // Ledger nodes
    if (item.ledger_records.length > 0) {
      item.ledger_records.forEach((l) => {
        ledgerNodes.push({
          id: l.LEDGER_ID || `L-${item.reference}`,
          ref: item.reference,
          amount: Number(l.AMOUNT),
          currency: l.CURRENCY || item.currency,
          desc: l.DESCRIPTION,
          category: item.exception_category,
          yIndex: idx
        });
      });
    } else {
      ledgerNodes.push({
        id: `NONE-${item.reference}`,
        ref: item.reference,
        amount: 0,
        currency: item.currency,
        desc: 'No record in internal ledger',
        category: 'MISSING_FROM_LEDGER',
        yIndex: idx
      });
    }
  });

  // GSAP stroke animation on render
  useEffect(() => {
    if (prefersReduced || !svgRef.current) return;

    const paths = svgRef.current.querySelectorAll('.recon-path');
    paths.forEach((p) => {
      const pathEl = p as SVGPathElement;
      const length = pathEl.getTotalLength ? pathEl.getTotalLength() : 300;
      gsap.fromTo(
        pathEl,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', stagger: 0.08 }
      );
    });
  }, [items, prefersReduced]);

  const activeRef = hoveredRef || selectedReference;

  return (
    <div 
      ref={containerRef}
      className="p-5 rounded-2xl bg-ink-900 border border-ink-700/80 shadow-card flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-ink-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cobalt-500 animate-pulse" />
            <h3 className="font-display font-semibold text-sm text-ink-100 tracking-tight">
              Signature Reconciliation Graph
            </h3>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cobalt-500/10 text-cobalt-400 border border-cobalt-500/20">
              Interactive Topology
            </span>
          </div>
          <p className="text-xs text-ink-400 mt-1">
            Visual topology mapping verified matches, amount variances, multi-ledger duplicates, and unilateral omissions.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-ink-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-tealmatch-light rounded" />
            <span>Matched</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amberalert-light" />
            <span>Variance / Duplicate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dotted border-redcrit-light" />
            <span>Missing</span>
          </div>
        </div>
      </div>

      {/* Interactive Columns & Connecting SVG Canvas */}
      <div className="relative w-full min-h-[380px] grid grid-cols-12 gap-4 items-center">
        {/* Left Column: Bank Records */}
        <div className="col-span-4 flex flex-col gap-2.5 z-10">
          <div className="flex items-center gap-1.5 pb-1 text-xs font-mono font-semibold text-cobalt-400 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Source Records</span>
          </div>

          {bankNodes.map((b, idx) => {
            const isMissing = b.id.startsWith('NONE-');
            const isHighlighted = activeRef === b.ref;

            return (
              <div
                key={`b-${b.id}-${idx}`}
                onMouseEnter={() => setHoveredRef(b.ref)}
                onMouseLeave={() => setHoveredRef(null)}
                onClick={() => onSelectReference(b.ref)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isMissing
                    ? 'border-dashed border-redcrit-border bg-redcrit-bg/40 opacity-70'
                    : isHighlighted
                    ? 'border-cobalt-400 bg-cobalt-500/15 shadow-glow scale-[1.02]'
                    : 'border-ink-700/80 bg-ink-850 hover:border-ink-600 hover:bg-ink-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-medium text-cobalt-400">
                    {b.id}
                  </span>
                  <span className="text-xs font-mono font-bold text-ink-100">
                    {b.ref}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-ink-400 truncate max-w-[130px]">
                    {b.desc}
                  </span>
                  <span className={`num-tabular text-xs font-semibold ${isMissing ? 'text-redcrit-light' : 'text-ink-100'}`}>
                    {isMissing ? 'Missing' : `${b.currency} ${b.amount.toLocaleString()}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center SVG Connectors Canvas */}
        <div className="col-span-4 h-full relative flex items-center justify-center pointer-events-none">
          <svg
            ref={svgRef}
            viewBox="0 0 200 400"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {displayItems.map((item, idx) => {
              const yTotal = displayItems.length;
              const yPos = 35 + idx * (330 / Math.max(1, yTotal - 1));
              const isHighlighted = activeRef === item.reference;
              const isMatched = item.exception_category === 'MATCHED';
              const isAmountMismatch = item.exception_category === 'AMOUNT_MISMATCH';
              const isDuplicate = item.exception_category === 'DUPLICATE_REFERENCE';
              const isMissingLedger = item.exception_category === 'MISSING_FROM_LEDGER';
              const isMissingBank = item.exception_category === 'MISSING_FROM_BANK';

              let strokeColor = '#314468';
              let strokeWidth = 1.5;
              let strokeDash = '';

              if (isMatched) {
                strokeColor = '#14B8A6';
                strokeWidth = isHighlighted ? 3 : 2;
              } else if (isAmountMismatch) {
                strokeColor = '#F59E0B';
                strokeWidth = isHighlighted ? 3 : 2;
                strokeDash = '5,4';
              } else if (isDuplicate) {
                strokeColor = '#F59E0B';
                strokeWidth = isHighlighted ? 3.5 : 2.5;
                strokeDash = '6,3';
              } else if (isMissingLedger) {
                strokeColor = '#EF4444';
                strokeWidth = isHighlighted ? 2.5 : 1.5;
                strokeDash = '3,3';
              } else if (isMissingBank) {
                strokeColor = '#EF4444';
                strokeWidth = isHighlighted ? 2.5 : 1.5;
                strokeDash = '3,3';
              }

              if (isHighlighted) {
                strokeWidth += 1.5;
              }

              let d = '';
              if (isMissingLedger) {
                d = `M 0 ${yPos} C 60 ${yPos}, 80 ${yPos}, 110 ${yPos}`;
              } else if (isMissingBank) {
                d = `M 90 ${yPos} C 120 ${yPos}, 140 ${yPos}, 200 ${yPos}`;
              } else if (isDuplicate) {
                d = `M 0 ${yPos} C 70 ${yPos}, 100 ${yPos - 12}, 200 ${yPos - 12} M 0 ${yPos} C 70 ${yPos}, 100 ${yPos + 12}, 200 ${yPos + 12}`;
              } else {
                d = `M 0 ${yPos} C 80 ${yPos}, 120 ${yPos}, 200 ${yPos}`;
              }

              return (
                <g key={`path-${item.reference}`} opacity={activeRef && !isHighlighted ? 0.25 : 1}>
                  <path
                    className="recon-path transition-all duration-200"
                    d={d}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                  />

                  {isAmountMismatch && (
                    <g transform={`translate(100, ${yPos})`}>
                      <rect
                        x="-30"
                        y="-10"
                        width="60"
                        height="20"
                        rx="10"
                        fill="#182337"
                        stroke="#F59E0B"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#F59E0B"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        Δ ₹{Math.abs(item.variance)}
                      </text>
                    </g>
                  )}

                  {isDuplicate && (
                    <g transform={`translate(100, ${yPos})`}>
                      <rect
                        x="-26"
                        y="-10"
                        width="52"
                        height="20"
                        rx="10"
                        fill="#182337"
                        stroke="#F59E0B"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fill="#F59E0B"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        1 → 2 Split
                      </text>
                    </g>
                  )}

                  {isMissingLedger && (
                    <circle cx="110" cy={yPos} r="3.5" fill="#EF4444" />
                  )}
                  {isMissingBank && (
                    <circle cx="90" cy={yPos} r="3.5" fill="#EF4444" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Column: Ledger Records */}
        <div className="col-span-4 flex flex-col gap-2.5 z-10">
          <div className="flex items-center gap-1.5 pb-1 text-xs font-mono font-semibold text-tealmatch-light uppercase tracking-wider justify-end">
            <span>Internal Ledger Records</span>
            <BookOpen className="w-3.5 h-3.5" />
          </div>

          {ledgerNodes.map((l, idx) => {
            const isMissing = l.id.startsWith('NONE-');
            const isHighlighted = activeRef === l.ref;

            return (
              <div
                key={`l-${l.id}-${idx}`}
                onMouseEnter={() => setHoveredRef(l.ref)}
                onMouseLeave={() => setHoveredRef(null)}
                onClick={() => onSelectReference(l.ref)}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  isMissing
                    ? 'border-dashed border-redcrit-border bg-redcrit-bg/40 opacity-70'
                    : isHighlighted
                    ? 'border-tealmatch-light bg-tealmatch-bg shadow-glow scale-[1.02]'
                    : 'border-ink-700/80 bg-ink-850 hover:border-ink-600 hover:bg-ink-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-ink-100">
                    {l.ref}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-tealmatch-light">
                    {l.id}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`num-tabular text-xs font-semibold ${isMissing ? 'text-redcrit-light' : 'text-ink-100'}`}>
                    {isMissing ? 'Missing' : `${l.currency} ${l.amount.toLocaleString()}`}
                  </span>
                  <span className="text-[11px] text-ink-400 truncate max-w-[130px]">
                    {l.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
