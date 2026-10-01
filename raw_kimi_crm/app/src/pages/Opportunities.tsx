import { PageHeader, NewButton, ImportExport, Mono, StatusBadge } from '@/components/shared';
import { opportunities, fmtINR } from '@/data/mock';
import type { OppStage } from '@/data/mock';
import { ArrowRight } from 'lucide-react';

const stages: OppStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won'];
const gate: Record<string, string> = {
  Prospecting: '→ Qualification requires: customer interaction + requirements gathered',
  Qualification: '→ Proposal requires: solution identified + proposal prepared',
  Proposal: '→ Negotiation requires: proposal submitted + review initiated',
  Negotiation: '→ Won requires: agreement finalised + approval received',
  Won: 'Closed — revenue booked to forecast',
};

export default function Opportunities() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 24" title="Opportunities"
        sub="Forecast = Expected Revenue × Probability %. Stage progression is gated by SRS rules shown under each column."
        action={<><ImportExport /><NewButton label="Create Opportunity" /></>} />

      <div className="flex gap-3 overflow-x-auto pb-2">
        {stages.map(st => {
          const opps = opportunities.filter(o => o.stage === st);
          const total = opps.reduce((s, o) => s + o.expectedRevenue, 0);
          const closed = st === 'Won';
          return (
            <div key={st} className="w-[268px] shrink-0">
              <div className={`mb-2 flex items-center justify-between rounded-md border px-3 py-2 ${closed ? 'border-[#09352e] bg-[#09352e] text-white' : 'border-border bg-card'}`}>
                <div className="kicker">{st}</div>
                <Mono className={closed ? 'text-[#8fd4a8]' : 'text-muted-foreground'}>{opps.length} · {fmtINR(total)}</Mono>
              </div>
              <div className="space-y-2">
                {opps.map(o => (
                  <div key={o.id} className="rounded-lg border border-border bg-card p-3 hover:border-[#85c093] transition-colors">
                    <div className="flex items-center justify-between">
                      <Mono className="text-muted-foreground">{o.code}</Mono>
                      <StatusBadge label={`${o.probability}%`} tone={o.probability >= 70 ? 'green' : o.probability >= 30 ? 'amber' : 'gray'} />
                    </div>
                    <div className="mt-1.5 text-[13px] font-medium leading-snug">{o.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{o.account}</div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                      <span className="font-display text-[14px] font-semibold">{fmtINR(o.expectedRevenue)}</span>
                      <Mono className="text-muted-foreground">close {o.closeDate.slice(5)}</Mono>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{o.owner}</div>
                  </div>
                ))}
                {opps.length === 0 && <div className="rounded-lg border border-dashed border-border p-4 text-center font-mono2 text-[10.5px] text-muted-foreground">No deals</div>}
              </div>
              <div className="mt-2 flex items-start gap-1 px-1 font-mono2 text-[9.5px] leading-relaxed text-muted-foreground">
                <ArrowRight className="mt-px size-3 shrink-0" />{gate[st]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <span className="kicker text-muted-foreground">Weighted Forecast </span>
        <span className="font-display text-[15px] font-semibold">
          {fmtINR(opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).reduce((s, o) => s + o.expectedRevenue * o.probability / 100, 0))}
        </span>
        <span className="ml-2 font-mono2 text-[10.5px] text-muted-foreground">= Σ (expected revenue × probability) across open stages</span>
      </div>
    </div>
  );
}
