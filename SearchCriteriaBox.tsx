import React, { useId, useMemo, useState } from 'react';
import type { ClinicalCriteria } from './clinicalCriteria';
import { CriteriaList } from './CriteriaList';
import { useSearchCriteria } from './useSearchCriteria';

export type SearchCriteriaBoxProps = {
  dataset: readonly ClinicalCriteria[];
  /** Determines Pediatric vs Adult logic for visual conflicts (default: 'Adult'). */
  searchContext?: 'Adult' | 'Pediatric';
  /** Placeholder shown in the search input. */
  placeholder?: string;
  /** Optional label text for the search input. */
  label?: string;
};

function resultNoun(kindCounts: Record<string, number>): string {
  // Prefer GENOMIC language for the example announcement.
  if (kindCounts.GENOMIC) return kindCounts.GENOMIC === 1 ? 'mutation' : 'mutations';
  return 'results';
}

export function SearchCriteriaBox({
  dataset,
  searchContext = 'Adult',
  placeholder = 'Search gene, lab, demographic, category, id…',
  label = 'Search with clinical criteria',
}: SearchCriteriaBoxProps) {
  const [search, setSearch] = useState('');
  const { filteredResults, isLoading, error } = useSearchCriteria(search, dataset);

  const listId = useId();
  const statusId = useId();

  const expanded = !isLoading && filteredResults.length > 0;

  const announcement = useMemo(() => {
    const count = filteredResults.length;
    const counts = filteredResults.reduce<Record<string, number>>((acc, c) => {
      acc[c.kind] = (acc[c.kind] ?? 0) + 1;
      return acc;
    }, {});

    const noun = resultNoun(counts);
    return `${count} ${noun} found`;
  }, [filteredResults]);

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <label className="block text-sm font-medium text-slate-800" htmlFor={`${listId}-input`}>
          {label}
        </label>

        <div className="mt-2 flex items-center gap-2">
          <input
            id={`${listId}-input`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className={
              'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 '
              + 'outline-none ring-0 focus:border-blue-300 focus:ring-2 focus:ring-blue-100'
            }
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-describedby={statusId}
          />

          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
            {searchContext}
          </span>
        </div>

        <div id={statusId} className="sr-only" aria-live="polite">
          {isLoading ? 'Searching…' : announcement}
        </div>

        {error ? <div className="mt-2 text-sm text-red-700">{error}</div> : null}
      </div>

      <div className="mt-3">
        <CriteriaList
          filteredResults={filteredResults}
          isLoading={isLoading}
          searchContext={searchContext}
          listId={listId}
        />
      </div>
    </div>
  );
}
