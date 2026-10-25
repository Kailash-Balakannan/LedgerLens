import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import { EASINGS } from './motionTokens';

interface ClippedTitleProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  delay?: number;
}

export const ClippedTitle: React.FC<ClippedTitleProps> = ({
  text,
  className = '',
  as = 'h1',
  delay = 0
}) => {
  const prefersReduced = useReducedMotion();
  const words = text.split(' ');

  if (prefersReduced) {
    const Tag = as;
    return <Tag className={className}>{text}</Tag>;
  }

  const Tag = motion[as];

  return (
    <Tag className={`flex flex-wrap gap-x-2 gap-y-0.5 overflow-hidden ${className}`}>
      {words.map((word, i) => (
        <span key={`word-${i}-${word}`} className="inline-block overflow-hidden pb-1">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.55,
              delay: delay + i * 0.04,
              ease: EASINGS.easeOutCubic
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};
