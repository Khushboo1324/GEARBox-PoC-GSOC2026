import React, { useMemo } from 'react';
import { createMockClinicalCriteria } from '../clinicalCriteria';
import { SearchCriteriaBox } from '../SearchCriteriaBox';

export function App() {
  const dataset = useMemo(() => createMockClinicalCriteria({ count: 5000 }), []);

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">GEARBOX Trial Matching for Criteria Search</h1>
          <p className="mt-1 text-sm text-slate-600">
            Type to search 5,000 mock clinical criteria. Searches are debounced and cancellable.
          </p>
        </header>

        <SearchCriteriaBox dataset={dataset} searchContext="Adult" />

        <footer className="mt-6 text-xs text-slate-500">
          POC demo data only.
        </footer>
      </div>
    </div>
  );
}
