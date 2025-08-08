// hooks/useBatchedAPI.ts
import { useState, useCallback, useRef, useEffect } from 'react';

export function useBatchedAPI(
  batchSize: number = 5,
  batchDelay: number = 1000,
) {
  const [queue, setQueue] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const addToQueue = useCallback((apiCall: Function, args: any[] = []) => {
    setQueue((prev) => [...prev, { apiCall, args }]);
  }, []);

  const processBatch = useCallback(async () => {
    if (queue.length === 0 || processing) return;

    setProcessing(true);
    const batch = queue.slice(0, batchSize);
    setQueue((prev) => prev.slice(batchSize));

    try {
      const results = await Promise.allSettled(
        batch.map(({ apiCall, args }) => apiCall(...args)),
      );

      console.log(`✅ Processed batch of ${batch.length} API calls`);
      return results;
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [queue, batchSize, processing]);

  useEffect(() => {
    if (queue.length >= batchSize) {
      processBatch();
    } else if (queue.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(processBatch, batchDelay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [queue.length, batchSize, batchDelay, processBatch]);

  return {
    addToQueue,
    processBatch,
    queueLength: queue.length,
    processing,
  };
}
