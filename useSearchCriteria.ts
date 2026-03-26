import { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';
import type { ClinicalCriteria } from './clinicalCriteria';

export type UseSearchCriteriaResult = {
  filteredResults: ClinicalCriteria[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Custom hook that debounces searching/filtering and cancels in-flight "requests" via AbortController.
 */
export function useSearchCriteria(
  search: string,
  dataset: readonly ClinicalCriteria[],
): UseSearchCriteriaResult {
  const [filteredResults, setFilteredResults] = useState<ClinicalCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const debouncedSearch = useMemo(() => {
    const run = async (query: string) => {
      // Cancel any pending request before starting the next one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const results = await mockSearchApi(query, dataset, controller.signal);
        if (!mountedRef.current || controller.signal.aborted) return;
        setFilteredResults(results);
      } catch (e) {
        if (!mountedRef.current) return;

        // Normalize AbortError across environments.
        const err = e as { name?: string; message?: string };
        if (controller.signal.aborted || err?.name === 'AbortError') return;

        setError(err?.message ?? 'Search failed');
      } finally {
        if (!mountedRef.current || controller.signal.aborted) return;
        setIsLoading(false);
      }
    };

    return debounce(run, 300);
  }, [dataset]);

  useEffect(() => {
    debouncedSearch(search);

    // Cancel the debounce timer on change/unmount.
    return () => {
      debouncedSearch.cancel();
    };
  }, [search, debouncedSearch]);

  return { filteredResults, isLoading, error };
}

function includesCI(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function matchesCriteria(c: ClinicalCriteria, query: string): boolean {
  if (!query.trim()) return true;

  // Common fields
  if (includesCI(c.id, query) || includesCI(c.category, query)) return true;

  switch (c.kind) {
    case 'GENOMIC':
      return (
        includesCI(c.geneName, query) ||
        includesCI(c.mutationType, query) ||
        includesCI(String(c.isPresent), query)
      );
    case 'LAB_VALUE':
      return (
        includesCI(c.testName, query) ||
        includesCI(c.unit, query) ||
        includesCI(c.comparator, query) ||
        includesCI(String(c.numericValue), query)
      );
    case 'DEMOGRAPHIC':
      return includesCI(c.attribute, query) || includesCI(c.value, query);
    default: {
      const _exhaustive: never = c;
      return _exhaustive;
    }
  }
}

/**
 * A mock "API call" that resolves after a small random-ish delay and supports aborting.
 */
function mockSearchApi(
  query: string,
  dataset: readonly ClinicalCriteria[],
  signal: AbortSignal,
): Promise<ClinicalCriteria[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }

    // Simulate network + server time.
    const delayMs = 200 + (query.length % 5) * 60;

    const timer = setTimeout(() => {
      if (signal.aborted) {
        reject(abortError());
        return;
      }

      const q = query.trim();
      const results = q ? dataset.filter((c) => matchesCriteria(c, q)) : [...dataset];
      resolve(results);
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(abortError());
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(): Error {
  // DOMException isn't available in all JS runtimes.
  const err = new Error('The operation was aborted');
  (err as any).name = 'AbortError';
  return err;
}
