// hooks/useMemoryOptimizer.ts
import { useRef, useCallback, useEffect } from 'react';

export function useMemoryOptimizer() {
  const refs = useRef<Set<any>>(new Set());
  const intervals = useRef<Set<number>>(new Set());
  const timeouts = useRef<Set<number>>(new Set());

  const addRef = useCallback((ref: any) => {
    refs.current.add(ref);
    return ref;
  }, []);

  const addInterval = useCallback((interval: number) => {
    intervals.current.add(interval);
    return interval;
  }, []);

  const addTimeout = useCallback((timeout: number) => {
    timeouts.current.add(timeout);
    return timeout;
  }, []);

  const cleanup = useCallback(() => {
    intervals.current.forEach((interval) => clearInterval(interval));
    intervals.current.clear();

    timeouts.current.forEach((timeout) => clearTimeout(timeout));
    timeouts.current.clear();

    refs.current.clear();

    console.log('✅ Memory cleanup completed');
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addRef,
    addInterval,
    addTimeout,
    cleanup,
  };
}
