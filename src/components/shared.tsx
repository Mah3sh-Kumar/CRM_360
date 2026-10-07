import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Plus, Download, Upload, AlertCircle, FileQuestion } from 'lucide-react';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
export * from './ui/chart-card';
export * from './ui/report-chart';

export function PageHeader({ kicker, title, sub, action }: { kicker: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 pb-5 border-b border-border sm:flex-row sm:items-end">
      <div className="w-full min-w-0">
        <div className="kicker text-muted-foreground mb-2">{kicker}</div>
        <h1 className="font-display text-[26px] leading-none font-semibold tracking-tight truncate">{title}</h1>
        {sub && <p className="text-[13px] text-muted-foreground mt-2 max-w-xl">{sub}</p>}
      </div>
      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{action}</div>
    </div>
  );
}

const toneMap: Record<string, string> = {
  green: 'bg-success-bg text-success border-success-border',
  sage: 'bg-muted-bg text-muted-foreground border-muted',
  amber: 'bg-warning-bg text-warning border-warning-border',
  red: 'bg-destructive-bg text-destructive border-destructive-border',
  blue: 'bg-info-bg text-info border-info-border',
  gray: 'bg-neutral-bg text-neutral border-neutral-border',
  ink: 'bg-ink text-primary-foreground border-ink',
  purple: 'bg-[#F3E8FF] text-[#7C3AED] border-[#8B5CF6]',
};
export type Tone = keyof typeof toneMap;

export function StatusBadge({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-[2px] font-mono2 text-[10px] font-medium uppercase tracking-[0.08em]', toneMap[tone])}>
      <span className="size-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}

export function Toolbar({ placeholder, children, searchValue, onSearchChange }: { placeholder: string; children?: React.ReactNode; searchValue?: string; onSearchChange?: (val: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
        <Search aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input 
          aria-label={placeholder} 
          placeholder={placeholder} 
          value={searchValue || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-3 text-[12.5px] outline-none focus:ring-2 focus:ring-ring/30" 
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('h-8 rounded-md border px-3 text-[12px] font-medium transition-colors', active ? 'border-ink bg-ink text-primary-foreground' : 'border-input bg-card text-muted-foreground hover:text-foreground')}>
      {label}
    </button>
  );
}

export function NewButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-semibold text-white hover:bg-primary-hover transition-colors">
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

export function IconBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} aria-label={title} title={title} className="inline-flex size-8 items-center justify-center rounded-md border border-input bg-card text-muted-foreground hover:text-foreground transition-colors">
      <span aria-hidden="true" className="flex items-center justify-center">{icon}</span>
    </button>
  );
}

// DataTable is now imported from DataTable.tsx and re-exported below

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-mono2 text-[11.5px]', className)}>{children}</span>;
}

export function ImportExport({ data, filename, onImport }: { data?: any[], filename?: string, onImport?: (file: File) => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '""';
        return `"${val.toString().replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename ? `${filename}.csv` : 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onImport) {
        onImport(file);
      } else {
        alert(`Imported ${file.name} successfully! (Mocked)`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input type="file" accept=".csv,.xlsx" ref={fileInputRef} onChange={handleFileChange} className="hidden" style={{ display: 'none' }} />
      <IconBtn icon={<Upload className="size-3.5" />} title="Import (.xlsx / .csv)" onClick={handleImportClick} />
      <IconBtn icon={<Download className="size-3.5" />} title="Export" onClick={handleExport} />
    </>
  );
}

export { DataTable } from './DataTable';
export type { ColumnDef, SortType, DataTableProps } from './DataTable';

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center p-12 text-muted-foreground min-h-[200px]">
      <Spinner aria-hidden="true" className="size-8 mb-4 text-primary" />
      <p className="text-[13px]">{message}</p>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message = "An error occurred while loading data.", onRetry }: { title?: string, message?: string, onRetry?: () => void }) {
  return (
    <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center p-12 text-center min-h-[200px]">
      <div className="rounded-full bg-destructive/10 p-3 mb-4 text-destructive">
        <AlertCircle aria-hidden="true" className="size-6" />
      </div>
      <h3 className="text-lg font-medium tracking-tight text-foreground mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-[12.5px] font-semibold text-white hover:bg-primary-hover transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = "No Results", description = "No data found.", icon = <FileQuestion />, action }: { title?: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Empty className="animate-in fade-in zoom-in-95 duration-200">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

export { SkeletonKPI, SkeletonChart, SkeletonTable, SkeletonCard, SkeletonList } from './ui/skeletons';

export function PremiumTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-lg p-3 min-w-[120px] animate-in fade-in zoom-in-95 duration-200">
        {label && <div className="text-muted-foreground font-mono2 text-[10.5px] mb-1">{label}</div>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: entry.color || entry.payload.fill }} />
              <span className="text-[12px] font-medium">{entry.name}</span>
            </div>
            <span className="font-mono2 text-[11.5px] font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export * from './ui/chart-card';