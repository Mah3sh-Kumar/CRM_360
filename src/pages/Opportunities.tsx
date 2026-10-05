// src/pages/Opportunities.tsx — store-backed + click-through + Lost column
import { PageHeader, NewButton, ImportExport, Mono, StatusBadge, ErrorState, LoadingState } from '@/components/shared';
import { fmtINR } from '@/data/mock';
import type { OppStage } from '@/data/mock';
import { useCRM } from '@/store/crm';
import { ArrowRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import OpportunityModal from '@/components/OpportunityModal';

const stages: OppStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const gate: Record<string, string> = {
  Prospecting: '→ Qualification requires: customer interaction + requirements gathered',
  Qualification: '→ Proposal requires: solution identified + proposal prepared',
  Proposal: '→ Negotiation requires: proposal submitted + review initiated',
  Negotiation: '→ Won requires: agreement finalised + approval received',
  Won: 'Closed — revenue booked to forecast',
  Lost: 'Closed lost — reason captured in detail view',
};

export default function Opportunities({ onOpen }: { onOpen: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const { opportunities, user, loading, error, fetchOpportunities } = useCRM();
  const mine = user?.role === 'Employee';
  const pool = useMemo(() => mine ? opportunities.filter(o => o.owner === user?.name) : opportunities, [mine, opportunities, user?.name]);
  const weightedForecast = useMemo(() => pool.filter(o => !['Won', 'Lost'].includes(o.stage)).reduce((s, o) => s + o.expectedRevenue * o.probability / 100, 0), [pool]);

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 24" title={mine ? 'My Opportunities' : 'Opportunities'}
        sub="Forecast = Expected Revenue × Probability %. Click any card for the stage workflow with Won / Lost actions."
        action={<><ImportExport /><NewButton label="Create Opportunity" onClick={() => setShowModal(true)} /></>} />

      {error.opportunities ? (
        <ErrorState title="Failed to load opportunities" message={error.opportunities} onRetry={fetchOpportunities} />
      ) : loading.opportunities && opportunities.length === 0 ? (
        <LoadingState message="Loading opportunities..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 pb-2">
            {stages.map(st => {
              const opps = pool.filter(o => o.stage === st);
              const total = opps.reduce((s, o) => s + o.expectedRevenue, 0);
              return (
                <div key={st} className="min-w-0">
                  <div className={`mb-2 flex items-center justify-between rounded-md border px-3 py-2 ${st === 'Won' ? 'border-ink bg-ink text-white' : st === 'Lost' ? 'border-destructive-border bg-destructive-bg' : 'border-border bg-card'}`}>
                    <div className="kicker">{st}</div>
                    <Mono className={st === 'Won' ? 'text-primary-foreground' : st === 'Lost' ? 'text-destructive' : 'text-muted-foreground'}>{opps.length} · {fmtINR(total)}</Mono>
                  </div>
                  <div className="space-y-2">
                    {opps.map(o => (
                      <button key={o.id} onClick={() => onOpen(o.id)} className="block w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-sage">
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
                      </button>
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
              {fmtINR(weightedForecast)}
            </span>
            <span className="ml-2 font-mono2 text-[10.5px] text-muted-foreground">= Σ (expected revenue × probability) across open stages</span>
          </div>
        </>
      )}
      <OpportunityModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
