// hooks/usePerformanceMonitor.ts
import { useEffect, useRef, useCallback } from 'react';

export function usePerformanceMonitor(
  componentName: string,
  threshold: number = 500,
) {
  const startTimeRef = useRef<number | undefined>(undefined);
  const renderCountRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTimer = useCallback(() => {
    if (!startTimeRef.current) return;

    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;
    renderCountRef.current++;

    console.log(
      `📊 ${componentName} render #${renderCountRef.current}: ${duration.toFixed(2)}ms`,
    );

    if (duration > threshold) {
      console.warn(
        `⚠️ SLOW RENDER: ${componentName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
      );
    }

    startTimeRef.current = undefined;
  }, [componentName, threshold]);

  useEffect(() => {
    startTimer();
    return endTimer;
  });

  return {
    renderCount: renderCountRef.current,
    startTimer,
    endTimer,
  };
}
