// hooks/useDebounce.ts
import { useCallback, useRef } from 'react';

export function useDebounce(callback: Function, delay: number) {
  const timeoutRef = useRef<number | null>(null);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve, reject) => {
        timeoutRef.current = window.setTimeout(async () => {
          try {
            const result = await callback(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    [callback, delay],
  );
}
