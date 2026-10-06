import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileQuestion } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';

export type SortType = 'text' | 'number' | 'date' | 'status' | 'boolean';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortType?: SortType;
}

export type DataTableProps<T = any> = 
  | {
      head: React.ReactNode[];
      rows: React.ReactNode[][];
      footer?: React.ReactNode;
      columns?: never;
      data?: never;
      loading?: boolean;
      emptyMessage?: string;
      defaultPageSize?: never;
      pagination?: never;
    }
  | {
      head?: never;
      rows?: never;
      footer?: never;
      columns: ColumnDef<T>[];
      data: T[];
      loading?: boolean;
      emptyMessage?: string;
      defaultPageSize?: number;
      pagination?: boolean;
    };

export function DataTable<T>({
  head,
  rows,
  footer,
  columns,
  data,
  loading,
  emptyMessage = "No records found.",
  defaultPageSize = 10,
  pagination = false,
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize || 10);

  // Legacy mode
  if (head && rows) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Spinner className="size-6 text-primary" />
          </div>
        )}
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-muted-bg">
              {head.map((h, i) => <th key={i} className="kicker px-3.5 py-2.5 text-left font-medium text-muted-foreground first:pl-4">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={head.length} className="p-8 text-center">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><FileQuestion aria-hidden="true" /></EmptyMedia>
                      <EmptyTitle>No Results</EmptyTitle>
                      <EmptyDescription>{emptyMessage}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted-bg/50 transition-colors">
                  {r.map((c, j) => <td key={j} className="px-3.5 py-2.5 first:pl-4 align-middle">{c}</td>)}
                </tr>
              ))
            )}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
    );
  }

  // Advanced mode
  const dataArray = data || [];
  const cols = columns || [];

  const sortedData = useMemo(() => {
    if (!sortCol) return dataArray;
    const colDef = cols.find(c => (c.accessorKey as string) === sortCol);
    if (!colDef) return dataArray;

    return [...dataArray].sort((a, b) => {
      let valA: any = (a as any)[sortCol];
      let valB: any = (b as any)[sortCol];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return sortDesc ? -1 : 1;
      if (valB === undefined || valB === null) return sortDesc ? 1 : -1;

      let comp = 0;
      switch (colDef.sortType) {
        case 'number':
          comp = Number(valA) - Number(valB);
          break;
        case 'date':
          comp = new Date(valA).getTime() - new Date(valB).getTime();
          break;
        case 'boolean':
          comp = valA === valB ? 0 : valA ? 1 : -1;
          break;
        case 'status':
        case 'text':
        default:
          comp = String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' });
          break;
      }
      return sortDesc ? -comp : comp;
    });
  }, [dataArray, sortCol, sortDesc, cols]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  
  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, safePage, pageSize]);

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortable || !col.accessorKey) return;
    const key = col.accessorKey as string;
    if (sortCol === key) {
      if (sortDesc) {
        setSortCol(null);
        setSortDesc(false);
      } else {
        setSortDesc(true);
      }
    } else {
      setSortCol(key);
      setSortDesc(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="overflow-x-auto rounded-lg border border-border bg-card relative">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-muted-bg">
              {cols.map((c, i) => {
                const isSorted = sortCol === c.accessorKey;
                return (
                  <th
                    key={i}
                    scope="col"
                    aria-sort={isSorted ? (sortDesc ? 'descending' : 'ascending') : 'none'}
                    className={cn(
                      "kicker px-3.5 py-2.5 text-left font-medium text-muted-foreground first:pl-4 whitespace-nowrap",
                      c.sortable && c.accessorKey && "hover:text-foreground select-none transition-colors"
                    )}
                  >
                    {c.sortable && c.accessorKey ? (
                      <button
                        type="button"
                        onClick={() => handleSort(c)}
                        className="flex items-center gap-1.5 w-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        aria-label={`Sort by ${c.header}`}
                      >
                        {c.header}
                        <span className="flex flex-col opacity-50">
                          <ChevronUp aria-hidden="true" className={cn("size-2.5 -mb-[3px]", isSorted && !sortDesc && "text-foreground opacity-100")} />
                          <ChevronDown aria-hidden="true" className={cn("size-2.5", isSorted && sortDesc && "text-foreground opacity-100")} />
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {c.header}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(pageSize > 0 ? pageSize : 5)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-border/60 last:border-0">
                  {cols.map((_, j) => (
                    <td key={`skeleton-td-${j}`} className="px-3.5 py-3.5 first:pl-4">
                      <div className={cn("h-3 bg-muted-foreground/20 rounded-md", j === 0 ? "w-24" : j === cols.length - 1 ? "w-8 ml-auto" : "w-16")} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="p-8 text-center">
                  <Empty className="animate-in fade-in zoom-in-95 duration-200">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><FileQuestion aria-hidden="true" /></EmptyMedia>
                      <EmptyTitle>No Results</EmptyTitle>
                      <EmptyDescription>{emptyMessage}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted-bg/50 transition-colors">
                  {cols.map((c, j) => (
                    <td key={j} className="px-3.5 py-2.5 first:pl-4 align-middle">
                      {c.cell ? c.cell(row) : c.accessorKey ? String((row as any)[c.accessorKey] ?? '—') : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[12.5px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">
              Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, sortedData.length)} of {sortedData.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="h-7 rounded-md border border-input bg-card px-2 py-0 outline-none hover:border-border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[10, 25, 50].map(s => (
                <option key={s} value={s}>{s} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1" aria-label="Pagination">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              aria-label="Go to first page"
              className="inline-flex size-7 items-center justify-center rounded-md border border-input bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted-bg transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <ChevronsLeft aria-hidden="true" className="size-3.5" />
            </button>
            <button
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Go to previous page"
              className="inline-flex size-7 items-center justify-center rounded-md border border-input bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted-bg transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5" />
            </button>
            <span className="px-2 font-medium" aria-current="page" aria-label={`Page ${safePage} of ${totalPages}`}>
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Go to next page"
              className="inline-flex size-7 items-center justify-center rounded-md border border-input bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted-bg transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              aria-label="Go to last page"
              className="inline-flex size-7 items-center justify-center rounded-md border border-input bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted-bg transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <ChevronsRight aria-hidden="true" className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
