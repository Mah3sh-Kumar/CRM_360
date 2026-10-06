// src/pages/details/OpportunityDetail.tsx — stage workflow + Won/Lost
import { useState } from 'react';
import { DataTable, StatusBadge, Mono, LoadingState, ErrorState } from '@/components/shared';
import { BackBar, DetailTabs, EmptyRow } from '@/pages/details/shared';
import { useCRM } from '@/store/crm';
import { activities, tasks, meetings, fmtINR } from '@/data/mock';
import type { OppStage } from '@/data/mock';
import { cn } from '@/lib/utils';

const flow: OppStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won'];
const gate: Partial<Record<OppStage, string>> = {
  Qualification: 'Requires customer interaction + requirements gathered',
  Proposal: 'Requires solution identified + proposal prepared',
  Negotiation: 'Requires proposal submitted + review initiated',
  Won: 'Requires agreement finalised + approval received',
};

export default function OpportunityDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const crm = useCRM();
  const opp = crm.opportunities.find(o => o.id === id);
  const [tab, setTab] = useState<'tasks' | 'activities' | 'meetings'>('tasks');

  if (crm.loading.opportunities && !opp) return <LoadingState message="Loading opportunity details..." />;
  if (crm.error.opportunities) return <ErrorState title="Failed to load opportunity" message={crm.error.opportunities} onRetry={crm.fetchOpportunities} />;
  if (!opp) return <div className="space-y-4"><EmptyRow text="Opportunity not found." /><button onClick={onBack} className="font-mono2 text-[11px] text-primary">← Back to Opportunities</button></div>;

  const tks = tasks.filter(t => t.related === opp.code);
  const acts = activities.filter(a => a.relatedTo === opp.account);
  const mts = meetings.filter(m => m.account === opp.account);
  const closed = opp.stage === 'Won' || opp.stage === 'Lost';

  return (
    <div className="space-y-5 min-w-0">
      <BackBar onBack={onBack} kicker={`Opportunities · ${opp.code}`} title={opp.name}
        sub={`${opp.account} · owner ${opp.owner} · expected close ${opp.closeDate}`}
        badges={[<StatusBadge key="st" label={opp.stage} tone={opp.stage === 'Won' ? 'ink' : opp.stage === 'Lost' ? 'red' : 'blue'} />,
                 <StatusBadge key="pr" label={`${opp.probability}% probability`} tone={opp.probability >= 70 ? 'green' : opp.probability >= 30 ? 'amber' : 'gray'} />]}
        actions={!closed && crm.can('EDIT', 'OPPORTUNITY', opp) && (
          <>
            <button onClick={() => crm.setOppStage(id, 'Won')} className="h-8 rounded-md bg-ink px-3 text-[12.5px] font-semibold text-white hover:bg-sidebar">Won</button>
            <button onClick={() => crm.setOppStage(id, 'Lost')} className="h-8 rounded-md border border-destructive-border bg-destructive-bg px-3 text-[12.5px] font-semibold text-destructive hover:bg-destructive-border">Lost</button>
          </>
        )} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5 shadow-sm">
          <div className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase mb-2">Expected Revenue</div>
          <div className="font-display text-[26px] font-bold text-foreground">{fmtINR(Number(opp.expectedRevenue))}</div>
          <div className="absolute right-[-10px] bottom-[-10px] text-primary/5 size-24">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v12"></path><path d="M8 10h8"></path><path d="M8 14h8"></path></svg>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5 shadow-sm">
          <div className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase mb-2">Weighted Forecast</div>
          <div className="font-display text-[26px] font-bold text-sage">{fmtINR(Number(opp.expectedRevenue) * Number(opp.probability) / 100)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Based on {opp.probability}% probability</div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5 shadow-sm">
          <div className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase mb-2">Close Date</div>
          <div className="font-display text-[26px] font-bold text-foreground">{opp.closeDate}</div>
          <div className="absolute right-[-10px] bottom-[-10px] text-primary/5 size-24">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
        </div>
      </div>

      {/* stage workflow */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase mb-6 flex justify-between items-center">
          <span>Stage Workflow {closed && <span className="text-destructive font-semibold ml-2">— Closed</span>}</span>
          {!closed && opp.stage !== 'Won' && gate[flow[flow.indexOf(opp.stage) + 1] as OppStage] && (
            <span className="text-[10.5px] bg-muted/50 px-2 py-1 rounded-md text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span>
              Next Phase: {flow[flow.indexOf(opp.stage) + 1]}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center w-full">
          {flow.map((s, i) => {
            const active = opp.stage === s;
            const passed = flow.indexOf(opp.stage) > i;
            const isLast = i === flow.length - 1;
            
            return (
              <div key={s} className="flex items-center flex-1 min-w-fit">
                <button disabled={closed || !crm.can('EDIT', 'OPPORTUNITY', opp)} onClick={() => crm.setOppStage(id, s)}
                  title={gate[s] ?? ''}
                  className={cn('relative flex-1 h-10 px-4 text-[12.5px] font-semibold transition-all duration-200 border-y border-l',
                    i === 0 && 'rounded-l-lg',
                    isLast && 'rounded-r-lg border-r',
                    active ? 'bg-ink border-ink text-white shadow-md z-10 scale-[1.02]'
                    : passed ? 'bg-success-bg border-success-border text-success hover:bg-success-bg/80'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
                  )}>
                  <div className="flex items-center justify-center gap-2">
                    {passed && <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    {active && !closed && <span className="size-2 rounded-full bg-sage animate-pulse" />}
                    {s}
                  </div>
                </button>
                {!isLast && (
                   <div className="w-2"></div>
                )}
              </div>
            );
          })}
        </div>
        {!closed && opp.stage !== 'Won' && gate[flow[flow.indexOf(opp.stage) + 1] as OppStage] && (
          <div className="mt-5 text-[12px] text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50 flex items-start gap-2">
            <svg className="size-4 text-sage mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
               <span className="font-semibold text-foreground">{flow[flow.indexOf(opp.stage) + 1]} requires:</span> {gate[flow[flow.indexOf(opp.stage) + 1] as OppStage]}
            </div>
          </div>
        )}
      </div>

      <DetailTabs tabs={[{ id: 'tasks', label: 'Tasks', count: tks.length }, { id: 'activities', label: 'Activities', count: acts.length }, { id: 'meetings', label: 'Meetings', count: mts.length }]} active={tab} onChange={setTab} />
      <div className="pt-1">
        {tab === 'tasks' && (tks.length ? <DataTable head={['Task', 'Assignee', 'Priority', 'Status', 'Due']} rows={tks.map(t => [
          t.title, t.assignee, <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : 'amber'} />, <StatusBadge label={t.status} tone={t.status === 'Completed' ? 'green' : 'sage'} />, <Mono className="text-muted-foreground">{t.due}</Mono>,
        ])} /> : <EmptyRow text="No tasks linked to this opportunity." />)}
        {tab === 'activities' && (acts.length ? <DataTable head={['Type', 'Subject', 'Owner', 'Due', 'Status']} rows={acts.map(a => [
          <StatusBadge label={a.type} tone="sage" />, a.subject, a.owner, <Mono className="text-muted-foreground">{a.due}</Mono>, <StatusBadge label={a.status} tone={a.status === 'Completed' ? 'green' : 'amber'} />,
        ])} /> : <EmptyRow text="No activities on this account." />)}
        {tab === 'meetings' && (mts.length ? <DataTable head={['Meeting', 'Date', 'Time', 'Mode', 'Organizer', 'Status']} rows={mts.map(m => [
          <span className="font-medium">{m.title}</span>, <Mono className="text-muted-foreground">{m.date}</Mono>, <Mono className="text-muted-foreground">{m.time}</Mono>, m.mode, m.organizer, <StatusBadge label={m.status} tone={m.status === 'Completed' ? 'green' : 'blue'} />,
        ])} /> : <EmptyRow text="No meetings scheduled." />)}
      </div>
    </div>
  );
}
