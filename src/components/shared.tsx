import React from 'react';
import { cn } from '@/lib/utils';
import { Search, Plus, Download, Upload } from 'lucide-react';

export function PageHeader({ kicker, title, sub, action }: { kicker: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 pb-5 border-b border-border">
      <div>
        <div className="kicker text-muted-foreground mb-2">{kicker}</div>
        <h1 className="font-display text-[26px] leading-none font-semibold tracking-tight">{title}</h1>
        {sub && <p className="text-[13px] text-muted-foreground mt-2 max-w-xl">{sub}</p>}
      </div>
      <div className="flex items-center gap-2">{action}</div>
    </div>
  );
}

const toneMap: Record<string, string> = {
  green: 'bg-[#e3f0e7] text-[#0f6b2e] border-[#bcdcc6]',
  sage: 'bg-[#eef4ee] text-[#3f5f46] border-[#d3e2d4]',
  amber: 'bg-[#faf3e0] text-[#8a6d1a] border-[#eadfbe]',
  red: 'bg-[#fbe9e6] text-[#b03a26] border-[#f0cdc4]',
  blue: 'bg-[#e7eef7] text-[#2d5480] border-[#cbd9ea]',
  gray: 'bg-[#f0f0ec] text-[#6a6a63] border-[#dfdfd8]',
  ink: 'bg-[#09352e] text-[#d9efe2] border-[#09352e]',
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

export function Toolbar({ placeholder, children }: { placeholder: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input placeholder={placeholder} className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-3 text-[12.5px] outline-none focus:ring-2 focus:ring-ring/30" />
      </div>
      {children}
    </div>
  );
}

export function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('h-8 rounded-md border px-3 text-[12px] font-medium transition-colors', active ? 'border-[#09352e] bg-[#09352e] text-[#eef6f0]' : 'border-input bg-card text-muted-foreground hover:text-foreground')}>
      {label}
    </button>
  );
}

export function NewButton({ label }: { label: string }) {
  return (
    <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#007f24] px-3 text-[12.5px] font-semibold text-white hover:bg-[#0a6b20] transition-colors">
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

export function IconBtn({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <button title={title} className="inline-flex size-8 items-center justify-center rounded-md border border-input bg-card text-muted-foreground hover:text-foreground transition-colors">{icon}</button>
  );
}

export function DataTable({ head, rows, footer }: { head: React.ReactNode[]; rows: React.ReactNode[][]; footer?: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-[#f4f6f1]">
            {head.map((h, i) => <th key={i} className="kicker px-3.5 py-2.5 text-left font-medium text-muted-foreground first:pl-4">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-[#f7f9f4] transition-colors">
              {r.map((c, j) => <td key={j} className="px-3.5 py-2.5 first:pl-4 align-middle">{c}</td>)}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-mono2 text-[11.5px]', className)}>{children}</span>;
}

export function ImportExport() {
  return (
    <>
      <IconBtn icon={<Upload className="size-3.5" />} title="Import (.xlsx / .csv)" />
      <IconBtn icon={<Download className="size-3.5" />} title="Export" />
    </>
  );
}
