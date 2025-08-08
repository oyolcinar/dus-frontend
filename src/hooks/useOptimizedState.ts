// hooks/useOptimizedState.ts
import { useState, useCallback, useRef } from 'react';

export function useOptimizedState<T extends object>(initialState: T) {
  const [state, setState] = useState(initialState);
  const pendingUpdatesRef = useRef<Partial<T>[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);

  const batchedSetState = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      const updateObj =
        typeof updates === 'function' ? updates(state) : updates;
      pendingUpdatesRef.current.push(updateObj);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = window.setTimeout(() => {
        const allUpdates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];

        if (allUpdates.length > 0) {
          setState((prev) => {
            const newState = { ...prev };
            allUpdates.forEach((update) => Object.assign(newState, update));
            return newState;
          });
        }
      }, 16); // One frame at 60fps
    },
    [state],
  );

  const immediateSetState = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }

      setState((prev) => {
        const updateObj =
          typeof updates === 'function' ? updates(prev) : updates;
        return { ...prev, ...updateObj };
      });
    },
    [],
  );

  return [state, batchedSetState, immediateSetState] as const;
}
