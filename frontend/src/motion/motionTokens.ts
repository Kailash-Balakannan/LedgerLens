import type { Variants, Transition } from 'motion/react';

// Precision Easing Curves
export const EASINGS = {
  // Snappy deceleration for natural entrances
  easeOutCubic: [0.22, 1, 0.36, 1],
  // Fast responsive curve for micro-interactions
  easeOutQuart: [0.16, 1, 0.3, 1],
  // Smooth symmetrical curve
  easeInOutCubic: [0.65, 0, 0.35, 1],
  // Controlled spring settings
  springSnappy: { type: 'spring', stiffness: 450, damping: 32, mass: 0.6 },
  springGentle: { type: 'spring', stiffness: 350, damping: 28, mass: 0.7 }
} as const;

// Transition Presets (150-250ms for micro-interactions, 250-400ms for larger transitions)
export const TRANSITIONS = {
  micro: { duration: 0.18, ease: EASINGS.easeOutQuart } as Transition,
  fast: { duration: 0.22, ease: EASINGS.easeOutCubic } as Transition,
  normal: { duration: 0.32, ease: EASINGS.easeOutCubic } as Transition,
  scene: { duration: 0.38, ease: EASINGS.easeOutCubic } as Transition,
  spring: EASINGS.springSnappy as Transition
};

// Staggered Container Variants
export const containerStaggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

// Item Entrance Variants
export const itemFadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASINGS.easeOutCubic }
  }
};

// Micro-interactions for buttons & cards
export const buttonPressVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.015, transition: { duration: 0.15 } },
  tap: { scale: 0.985, transition: { duration: 0.08 } }
};

// Drawer Panel Variants
export const drawerBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.22, ease: 'easeOut' } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.18, ease: 'easeIn' } 
  }
};

export const drawerPanelVariants: Variants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: { 
    x: '0%', 
    opacity: 1,
    transition: { 
      type: 'spring', 
      damping: 34, 
      stiffness: 380, 
      mass: 0.7 
    } 
  },
  exit: { 
    x: '100%', 
    opacity: 0.8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } 
  }
};

// Tab content variants
export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.994 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.28, 
      ease: EASINGS.easeOutCubic,
      staggerChildren: 0.05
    } 
  },
  exit: { 
    opacity: 0, 
    y: -6, 
    scale: 0.994,
    transition: { duration: 0.16, ease: 'easeIn' } 
  }
};
