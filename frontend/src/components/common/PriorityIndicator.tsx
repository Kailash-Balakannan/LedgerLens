import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface PriorityIndicatorProps {
  score: number;
  label: 'HIGH' | 'MEDIUM' | 'LOW' | 'RESOLVED / NONE';
  breakdown: Record<string, string>;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ score, label, breakdown }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  let barColor = 'bg-ink-600';
  let textColor = 'text-ink-400';

  if (score >= 70) {
    barColor = 'bg-redcrit-light';
    textColor = 'text-redcrit-light';
  } else if (score >= 40) {
    barColor = 'bg-amberalert-light';
    textColor = 'text-amberalert-light';
  } else if (score > 0) {
    barColor = 'bg-cobalt-400';
    textColor = 'text-cobalt-400';
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <div 
        className="flex items-center gap-1.5 cursor-pointer py-0.5"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {/* Visual score bar */}
        <div className="w-12 h-1.5 bg-ink-800 rounded-full overflow-hidden border border-ink-700/60">
          <div 
            className={`h-full ${barColor} transition-all duration-300`} 
            style={{ width: `${Math.max(8, score)}%` }} 
          />
        </div>

        <span className={`num-tabular text-xs font-semibold ${textColor}`}>
          {score}
        </span>

        <Info className="w-3 h-3 text-ink-500 hover:text-ink-300 transition-colors" />
      </div>

      {/* Transparent Explanation Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-72 p-3 bg-ink-900 border border-ink-600 rounded-lg shadow-card text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-ink-800">
            <span className="font-semibold text-ink-100">Review Priority: {label}</span>
            <span className={`num-tabular font-bold ${textColor}`}>{score}/100</span>
          </div>
          <div className="space-y-1.5 text-ink-300">
            <div className="text-[10px] text-ink-500 uppercase tracking-wider font-mono">
              Transparent Factors:
            </div>
            {Object.entries(breakdown).map(([k, val]) => (
              <div key={k} className="flex items-start gap-1.5 text-[11px] leading-tight">
                <span className="text-cobalt-400">•</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
