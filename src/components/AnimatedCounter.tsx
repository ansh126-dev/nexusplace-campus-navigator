import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  durationSec?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  durationSec = 0.75,
  suffix = '',
  prefix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion();
  const prevValueRef = useRef<number>(shouldReduceMotion ? value : 0);
  const [displayValue, setDisplayValue] = useState<number>(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const from = prevValueRef.current;
    const controls = animate(from, value, {
      duration: durationSec,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
      onComplete: () => {
        prevValueRef.current = value;
        setDisplayValue(value);
      },
    });

    return () => {
      prevValueRef.current = displayValue;
      controls.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationSec, shouldReduceMotion]);

  const formatted =
    decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
