import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showWordmark = true }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Bespoke SVG: Two financial records resolving into an illuminated verified lens */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Subtle Outer Boundary Lens Ring */}
          <circle cx="20" cy="20" r="18" stroke="#22314D" strokeWidth="1.5" className="transition-all" />
          
          {/* Bank Record Track (Top left curve flowing into center) */}
          <path
            d="M 6 12 Q 16 12 20 20"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Ledger Record Track (Bottom left curve flowing into center) */}
          <path
            d="M 6 28 Q 16 28 20 20"
            stroke="#14B8A6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Resolved Single Verified Beam (Right flow out of lens) */}
          <path
            d="M 20 20 H 34"
            stroke="#F8FAFC"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Focal Convergence Point (The Reconciliation Lens) */}
          <circle cx="20" cy="20" r="3.5" fill="#2563EB" />
          <circle cx="20" cy="20" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-baseline tracking-tight">
            <span className={`font-display font-bold text-ink-100 ${textSizes[size]}`}>Ledger</span>
            <span className={`font-display font-light text-cobalt-400 ${textSizes[size]}`}>Lens</span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-ink-500 font-medium font-mono -mt-1">
            EXASOL EDITION
          </span>
        </div>
      )}
    </div>
  );
};
