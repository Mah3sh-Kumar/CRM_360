// src/pages/details/shared.tsx — small building blocks for detail/360 screens
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { StatusBadge as _SB, Tone } from '@/components/shared'; // (type re-export kept minimal)
import { cn } from '@/lib/utils';
import type { ReactElement } from 'react';

export function BackBar({ onBack, kicker, title, sub, badges, actions }: {
  onBack: () => void; kicker: string; title: string; sub?: string;
  badges?: ReactElement[]; actions?: ReactNode;
}) {
  return (
    <div className="pb-5 border-b border-border">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 font-mono2 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back
      </button>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="kicker mb-1.5 text-muted-foreground">{kicker}</div>
          <h1 className="font-display text-[24px] leading-none font-semibold tracking-tight">{title}</h1>
          {sub && <p className="mt-1.5 text-[12.5px] text-muted-foreground">{sub}</p>}
          {badges && <div className="mt-2.5 flex flex-wrap items-center gap-1.5">{badges}</div>}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function DetailTabs<T extends string>({ tabs, active, onChange }: {
  tabs: { id: T; label: string; count?: number }[]; active: T; onChange: (t: T) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn('-mb-px border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors',
            active === t.id ? 'border-[#007f24] text-[#007f24]' : 'border-transparent text-muted-foreground hover:text-foreground')}>
          {t.label}
          {typeof t.count === 'number' && <span className="ml-1.5 font-mono2 text-[10px] text-muted-foreground">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div>
      <div className="kicker text-muted-foreground">{label}</div>
      <div className="mt-1 text-[13px] font-medium">{children ?? <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-border p-6 text-center font-mono2 text-[10.5px] text-muted-foreground">{text}</div>;
}

export { StatusBadge };
export type { Tone };
