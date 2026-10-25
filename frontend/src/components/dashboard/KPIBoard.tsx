import React from 'react';
import { motion } from 'motion/react';
import type { KPIs } from '../../types';
import { useReducedMotion } from '../../motion/useReducedMotion';
import { CheckCircle2, AlertOctagon, Scale, Layers } from 'lucide-react';
import { containerStaggerVariants, itemFadeInUpVariants } from '../../motion/motionTokens';
import { AnimatedNumber } from '../../motion/AnimatedNumber';

interface KPIBoardProps {
  kpis: KPIs;
}

export const KPIBoard: React.FC<KPIBoardProps> = ({ kpis }) => {
  const prefersReduced = useReducedMotion();

  const cards = [
    {
      label: 'Matched References',
      numericValue: kpis.matched_references,
      decimals: 0,
      prefix: '',
      suffix: '',
      pill: `${kpis.reconciliation_rate}% Rate`,
      pillColor: 'bg-tealmatch-bg text-tealmatch-light border-tealmatch-border/40',
      subtext: 'Fully settled & verified',
      icon: <CheckCircle2 className="w-4 h-4 text-tealmatch-light" />,
      accentBorder: 'border-l-tealmatch-light'
    },
    {
      label: 'Unresolved Exceptions',
      numericValue: kpis.unresolved_exceptions,
      decimals: 0,
      prefix: '',
      suffix: '',
      pill: 'Review Required',
      pillColor: 'bg-amberalert-bg text-amberalert-light border-amberalert-border/40',
      subtext: 'Requires forensic decision',
      icon: <AlertOctagon className="w-4 h-4 text-amberalert-light" />,
      accentBorder: 'border-l-amberalert-light'
    },
    {
      label: 'Amount Under Review',
      numericValue: kpis.amount_under_review,
      decimals: 2,
      prefix: '₹ ',
      suffix: '',
      pill: 'Active Variance',
      pillColor: 'bg-cobalt-500/10 text-cobalt-300 border-cobalt-500/30',
      subtext: 'Investigative variance (not a loss)',
      icon: <Scale className="w-4 h-4 text-cobalt-400" />,
      accentBorder: 'border-l-cobalt-400'
    },
    {
      label: 'Total Reconciled References',
      numericValue: kpis.total_references,
      decimals: 0,
      prefix: '',
      suffix: '',
      pill: '6 B / 6 L',
      pillColor: 'bg-ink-800 text-ink-300 border-ink-700',
      subtext: `${kpis.total_bank_records} Bank · ${kpis.total_ledger_records} Ledger records`,
      icon: <Layers className="w-4 h-4 text-ink-400" />,
      accentBorder: 'border-l-ink-600'
    }
  ];

  return (
    <motion.div
      variants={prefersReduced ? undefined : containerStaggerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
    >
      {cards.map((c, i) => (
        <motion.div
          key={`kpi-${i}`}
          variants={prefersReduced ? undefined : itemFadeInUpVariants}
          whileHover={prefersReduced ? undefined : { y: -2, transition: { duration: 0.15 } }}
          className={`p-3.5 sm:p-4 rounded-xl bg-ink-900 border border-ink-800 border-l-[3px] ${c.accentBorder} shadow-sm hover:border-ink-700 hover:bg-ink-850/60 transition-all flex flex-col justify-between`}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-ink-400 uppercase tracking-wider">
              {c.label}
            </span>
            <div className="p-1.5 rounded-lg bg-ink-950 border border-ink-800">
              {c.icon}
            </div>
          </div>

          {/* Metric Value & Badges */}
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-1.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-ink-100">
                <AnimatedNumber
                  value={c.numericValue}
                  prefix={c.prefix}
                  suffix={c.suffix}
                  decimals={c.decimals}
                />
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.pillColor} font-semibold shrink-0`}>
                {c.pill}
              </span>
            </div>

            <p className="text-[11px] text-ink-500 mt-1 truncate">
              {c.subtext}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
