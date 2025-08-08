// hooks/useOptimizedAPI.ts
import { useState, useCallback, useRef } from 'react';

export function useOptimizedAPI(apiCall: Function, dependencies: any[] = []) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null as any,
  });

  const timeoutRef = useRef<number | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise((resolve, reject) => {
      timeoutRef.current = window.setTimeout(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
          const data = await apiCall(...args);
          setState({ data, loading: false, error: null });
          resolve(data);
        } catch (error) {
          console.error('API call failed:', error);
          setState((prev) => ({ ...prev, loading: false, error: error }));
          reject(error);
        }
      }, 300);
    });
  }, dependencies);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
