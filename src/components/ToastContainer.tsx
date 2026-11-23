import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../types/placement';
import { SPRING_SNAPPY } from './MotionPrimitives';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const icon =
            toast.variant === 'success' ? (
              <CheckCircle2 strokeWidth={1.75} className="w-4 h-4 text-[#0D5C63] shrink-0 mt-0.5" />
            ) : toast.variant === 'warning' ? (
              <AlertTriangle strokeWidth={1.75} className="w-4 h-4 text-[#C96D3B] shrink-0 mt-0.5" />
            ) : (
              <Info strokeWidth={1.75} className="w-4 h-4 text-[#6D59A6] shrink-0 mt-0.5" />
            );

          const progressColor =
            toast.variant === 'success'
              ? 'bg-[#0D5C63]'
              : toast.variant === 'warning'
                ? 'bg-[#C96D3B]'
                : 'bg-[#6D59A6]';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.95 }}
              transition={SPRING_SNAPPY}
              className="pointer-events-auto relative overflow-hidden bg-white border border-[#E8E3DA] rounded-2xl shadow-[0_12px_32px_-8px_rgba(24,26,31,0.12)] px-4 py-3.5 flex items-start gap-3"
            >
              {icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#181A1F] leading-snug">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors shrink-0"
              >
                <X strokeWidth={1.75} className="w-3.5 h-3.5" />
              </button>

              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3.8, ease: 'linear' }}
                style={{ transformOrigin: 'left' }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-70 ${progressColor}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
