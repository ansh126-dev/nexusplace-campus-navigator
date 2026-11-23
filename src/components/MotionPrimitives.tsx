import { motion, type Variants } from 'motion/react';

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const SPRING_DRAWER = {
  type: 'spring' as const,
  stiffness: 350,
  damping: 34,
  mass: 0.9,
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: EASE_OUT_EXPO,
    },
  },
};

interface AnimatedProgressBarProps {
  percent: number;
  barClassName?: string;
  trackClassName?: string;
  delay?: number;
}

export function AnimatedProgressBar({
  percent,
  barClassName = 'bg-[#0D5C63]',
  trackClassName = 'h-2 bg-slate-100',
  delay = 0.08,
}: AnimatedProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent)) / 100;

  return (
    <div className={`rounded-full overflow-hidden ${trackClassName}`}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: clamped }}
        transition={{ duration: 0.65, delay, ease: EASE_OUT_EXPO }}
        style={{ transformOrigin: 'left' }}
        className={`h-full w-full rounded-full ${barClassName}`}
      />
    </div>
  );
}
