import type { CSSProperties } from 'react';
import React, { useMemo } from 'react';
import { List, type RowComponentProps } from 'react-window';
import type { ClinicalCriteria } from './clinicalCriteria';

export type CriteriaListProps = {
  filteredResults: readonly ClinicalCriteria[];
  isLoading: boolean;
  /** The current search context used to detect Pediatric vs Adult conflicts. */
  searchContext?: 'Adult' | 'Pediatric';
  /** The id used by the search input for aria-controls. */
  listId?: string;
  /** Height of the list viewport in px (default: 520). */
  height?: number;
  /** Row height in px (default: 72). */
  rowHeight?: number;
};

type RowData = {
  items: readonly ClinicalCriteria[];
  searchContext: 'Adult' | 'Pediatric';
};

type RowProps = {
  data: RowData;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function formatCriteriaTitle(c: ClinicalCriteria): string {
  switch (c.kind) {
    case 'GENOMIC':
      return `${c.geneName} (${c.mutationType})`;
    case 'LAB_VALUE':
      return `${c.testName} ${c.comparator} ${c.numericValue} ${c.unit}`;
    case 'DEMOGRAPHIC':
      return `${c.attribute}: ${c.value}`;
    default: {
      const _exhaustive: never = c;
      return _exhaustive;
    }
  }
}

function formatCriteriaMeta(c: ClinicalCriteria): string {
  return `${c.kind} • ${c.category} • ${c.id}`;
}

function Row({ index, style, data, ariaAttributes }: RowComponentProps<RowProps>) {
  const c = data.items[index];

  // Prefer requested `ageGroup` field if present; fall back to `category` (current mock model).
  const ageGroup = (c as Partial<{ ageGroup: 'Adult' | 'Pediatric' }>).ageGroup;

  const hasContextConflict =
    data.searchContext === 'Adult' && (ageGroup ? ageGroup === 'Pediatric' : c.category === 'Pediatric');

  const badgeStyle = hasContextConflict
    ? 'bg-slate-200 text-slate-500 border-slate-600'
    : (() => {
        switch (c.kind) {
          case 'GENOMIC':
            return 'bg-blue-50 text-blue-700 border-blue-200';
          case 'LAB_VALUE':
            return 'bg-slate-50 text-slate-700 border-slate-200';
          case 'DEMOGRAPHIC':
            return 'bg-teal-50 text-teal-700 border-teal-200';
          default: {
            const _exhaustive: never = c;
            return _exhaustive;
          }
        }
      })();

  return (
    <div
      style={style}
      className={cx('px-3 py-2', hasContextConflict && 'select-none')}
      title={hasContextConflict ? 'Not applicable: Pediatric criterion in Adult context.' : undefined}
      aria-disabled={hasContextConflict}
      {...ariaAttributes}
    >
      <div
        className={cx(
          'relative h-full  w-full rounded-md border px-3 py-2 pr-4',
          hasContextConflict
            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed select-none grayscale-[0.4]'
            : 'bg-white border-slate-200 shadow-sm',
          'flex flex-col justify-center gap-1',
        )}
      >
        {hasContextConflict ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-white/70">
        <div className=" translate-x-[650px] rounded border border-slate-400 bg-slate-200 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700 whitespace-nowrap shadow-sm">
            INCOMPATIBLE
        </div>
        </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pr-2">
          <div className="min-w-0">
            <div
              className={cx(
                'truncate text-sm font-medium',
                hasContextConflict ? 'text-slate-500' : 'text-slate-900',
              )}
            >
              {formatCriteriaTitle(c)}
            </div>
            <div
              className={cx(
                'truncate text-xs',
                hasContextConflict ? 'text-slate-400 italic' : 'text-slate-500',
              )}
            >
              {formatCriteriaMeta(c)}
            </div>
          </div>

          <span
            className={cx(
              'shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide translate-x-[-5px]',
              badgeStyle,
            )}
          >
            {c.kind}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow({ style }: { style: CSSProperties }) {
  return (
    <div style={style} className="px-3 py-2" aria-hidden="true">
      <div className="h-full rounded-md border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function SkeletonList({ rowHeight }: { height: number; rowHeight: number }) {
  const count = 10;
  const skeleton = useMemo(() => Array.from({ length: count }, (_, i) => i), []);

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50"
      role="status"
      aria-label="Loading criteria"
    >
      {skeleton.map((i) => (
        <SkeletonRow key={i} style={{ height: rowHeight } as CSSProperties} />
      ))}
    </div>
  );
}

export function CriteriaList({
  filteredResults,
  isLoading,
  searchContext = 'Adult',
  listId,
  height = 520,
  rowHeight = 72,
}: CriteriaListProps) {
  const data = useMemo<RowData>(
    () => ({ items: filteredResults, searchContext }),
    [filteredResults, searchContext],
  );

  if (isLoading) {
    return <SkeletonList height={height} rowHeight={rowHeight} />;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50" role="list" id={listId}>
      <List<RowProps>
        style={{ height, width: '100%' }}
        rowCount={filteredResults.length}
        rowHeight={rowHeight}
        rowComponent={Row}
        rowProps={{ data }}
        overscanCount={6}
      />

      {!filteredResults.length ? (
        <div className="border-t border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          No criteria match your search.
        </div>
      ) : null}
    </div>
  );
}
