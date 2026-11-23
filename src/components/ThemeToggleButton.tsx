import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { SPRING_SNAPPY } from './MotionPrimitives';

interface ThemeToggleButtonProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  showLabel?: boolean;
}

export function ThemeToggleButton({
  theme,
  onToggle,
  showLabel = false,
}: ThemeToggleButtonProps) {
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E8E3DA] bg-white text-slate-600 hover:text-[#181A1F] hover:bg-[#F3EFE8]/60 transition-colors shrink-0 ${
        showLabel ? 'px-3 py-2 text-xs font-medium' : 'p-2.5'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
            transition={SPRING_SNAPPY}
            className="inline-flex items-center justify-center text-[#C96D3B]"
          >
            <Sun strokeWidth={1.75} className="w-4 h-4" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 45, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -45, scale: 0.7 }}
            transition={SPRING_SNAPPY}
            className="inline-flex items-center justify-center"
          >
            <Moon strokeWidth={1.75} className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>
      {showLabel && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </motion.button>
  );
}
