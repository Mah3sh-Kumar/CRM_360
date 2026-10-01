// src/pages/details/OpportunityDetail.tsx — stage workflow + Won/Lost
import { useState } from 'react';
import { DataTable, StatusBadge, Mono } from '@/components/shared';
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

  if (!opp) return <div className="space-y-4"><EmptyRow text="Opportunity not found." /><button onClick={onBack} className="font-mono2 text-[11px] text-[#007f24]">← Back to Opportunities</button></div>;

  const tks = tasks.filter(t => t.related === opp.code);
  const acts = activities.filter(a => a.relatedTo === opp.account);
  const mts = meetings.filter(m => m.account === opp.account);
  const closed = opp.stage === 'Won' || opp.stage === 'Lost';

  return (
    <div className="space-y-5">
      <BackBar onBack={onBack} kicker={`Opportunities · ${opp.code}`} title={opp.name}
        sub={`${opp.account} · owner ${opp.owner} · expected close ${opp.closeDate}`}
        badges={[<StatusBadge key="st" label={opp.stage} tone={opp.stage === 'Won' ? 'ink' : opp.stage === 'Lost' ? 'red' : 'blue'} />,
                 <StatusBadge key="pr" label={`${opp.probability}% probability`} tone={opp.probability >= 70 ? 'green' : opp.probability >= 30 ? 'amber' : 'gray'} />]}
        actions={!closed && (
          <>
            <button onClick={() => crm.setOppStage(id, 'Won')} className="h-8 rounded-md bg-[#09352e] px-3 text-[12.5px] font-semibold text-white hover:bg-[#0c231e]">Won</button>
            <button onClick={() => crm.setOppStage(id, 'Lost')} className="h-8 rounded-md border border-[#f0cdc4] bg-[#fbe9e6] px-3 text-[12.5px] font-semibold text-[#b03a26] hover:bg-[#f0cdc4]">Lost</button>
          </>
        )} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4"><div className="kicker text-muted-foreground">Expected Revenue</div><div className="font-display mt-1 text-[22px] font-semibold">{fmtINR(opp.expectedRevenue)}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="kicker text-muted-foreground">Weighted Forecast</div><div className="font-display mt-1 text-[22px] font-semibold">{fmtINR(opp.expectedRevenue * opp.probability / 100)}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="kicker text-muted-foreground">Close Date</div><div className="font-display mt-1 text-[22px] font-semibold">{opp.closeDate}</div></div>
      </div>

      {/* stage workflow */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="kicker mb-3 text-muted-foreground">Stage Workflow {closed && '— Closed'}</div>
        <div className="flex flex-wrap items-center gap-2">
          {flow.map((s, i) => {
            const active = opp.stage === s;
            const passed = flow.indexOf(opp.stage) > i;
            return (
              <button key={s} disabled={closed} onClick={() => crm.setOppStage(id, s)}
                title={gate[s] ?? ''}
                className={cn('h-8 rounded-md border px-3 text-[12px] font-medium transition-colors',
                  active ? 'border-[#09352e] bg-[#09352e] text-white'
                  : passed ? 'border-[#bcdcc6] bg-[#e3f0e7] text-[#0f6b2e]'
                  : 'border-border bg-card text-muted-foreground hover:border-[#85c093] disabled:cursor-not-allowed disabled:opacity-60')}>
                {s}
              </button>
            );
          })}
        </div>
        {!closed && opp.stage !== 'Won' && gate[flow[flow.indexOf(opp.stage) + 1] as OppStage] && (
          <div className="mt-2.5 font-mono2 text-[10.5px] text-muted-foreground">
            → Next: {flow[flow.indexOf(opp.stage) + 1]} — {gate[flow[flow.indexOf(opp.stage) + 1] as OppStage]}
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
