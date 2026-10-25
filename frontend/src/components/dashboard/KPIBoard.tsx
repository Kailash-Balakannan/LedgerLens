import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { KPIs } from '../../types';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { CheckCircle2, AlertOctagon, Scale, Files } from 'lucide-react';

interface KPIBoardProps {
  kpis: KPIs;
}

export const KPIBoard: React.FC<KPIBoardProps> = ({ kpis }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || !containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.kpi-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
    );
  }, [kpis, prefersReduced]);

  const cards = [
    {
      label: 'Matched References',
      value: kpis.matched_references,
      subtext: `${kpis.reconciliation_rate}% verified rate`,
      icon: <CheckCircle2 className="w-4 h-4 text-tealmatch-light" />,
      color: 'text-tealmatch-light',
      borderColor: 'border-tealmatch-border/40',
      bgColor: 'bg-tealmatch-bg/30'
    },
    {
      label: 'Unresolved Exceptions',
      value: kpis.unresolved_exceptions,
      subtext: 'Requires audit review',
      icon: <AlertOctagon className="w-4 h-4 text-amberalert-light" />,
      color: 'text-amberalert-light',
      borderColor: 'border-amberalert-border/40',
      bgColor: 'bg-amberalert-bg/30'
    },
    {
      label: 'Amount Under Review',
      value: `₹ ${kpis.amount_under_review.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: 'Investigative variance (not a loss)',
      icon: <Scale className="w-4 h-4 text-cobalt-400" />,
      color: 'text-ink-100',
      borderColor: 'border-cobalt-500/30',
      bgColor: 'bg-cobalt-500/10'
    },
    {
      label: 'Total Reconciled References',
      value: kpis.total_references,
      subtext: `${kpis.total_bank_records} Bank · ${kpis.total_ledger_records} Ledger Records`,
      icon: <Files className="w-4 h-4 text-ink-400" />,
      color: 'text-ink-100',
      borderColor: 'border-ink-700/80',
      bgColor: 'bg-ink-850'
    }
  ];

  return (
    <div 
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((c, i) => (
        <div
          key={`kpi-${i}`}
          className={`kpi-card p-4 rounded-xl border ${c.borderColor} ${c.bgColor} shadow-card transition-all hover:border-ink-600 flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink-400 tracking-tight">
              {c.label}
            </span>
            <div className="p-1.5 rounded-lg bg-ink-900 border border-ink-800">
              {c.icon}
            </div>
          </div>

          <div>
            <div className={`num-tabular text-2xl font-bold tracking-tight ${c.color}`}>
              {c.value}
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-ink-500 font-medium">
              <span>{c.subtext}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
