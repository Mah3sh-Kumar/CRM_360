// src/pages/details/AccountDetail.tsx — Account 360 hub
import { useState } from 'react';
import { DataTable, StatusBadge, Mono } from '@/components/shared';
import { BackBar, DetailTabs, Field, EmptyRow } from '@/pages/details/shared';
import { useCRM } from '@/store/crm';
import { activities, tasks, meetings, fmtINR } from '@/data/mock';

type Tab = 'contacts' | 'opportunities' | 'activities' | 'tasks' | 'meetings' | 'visits';

export default function AccountDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const crm = useCRM();
  const account = crm.accounts.find(a => a.id === id);
  const [tab, setTab] = useState<Tab>('contacts');

  if (!account) return <div className="space-y-4"><EmptyRow text="Account not found." /><button onClick={onBack} className="font-mono2 text-[11px] text-[#007f24]">← Back to Accounts</button></div>;

  const contacts = crm.contacts.filter(c => c.account === account.name);
  const opps = crm.opportunities.filter(o => o.account === account.name);
  const acts = activities.filter(a => a.relatedTo === account.name);
  const tks = tasks.filter(t => t.related === account.name || opps.some(o => o.code === t.related));
  const mts = meetings.filter(m => m.account === account.name);
  const vs = crm.visits.filter(v => v.customer === account.name);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'contacts', label: 'Contacts', count: contacts.length },
    { id: 'opportunities', label: 'Opportunities', count: opps.length },
    { id: 'activities', label: 'Activities', count: acts.length },
    { id: 'tasks', label: 'Tasks', count: tks.length },
    { id: 'meetings', label: 'Meetings', count: mts.length },
    { id: 'visits', label: 'Visits', count: vs.length },
  ];

  return (
    <div className="space-y-5">
      <BackBar onBack={onBack} kicker="Accounts · 360° View" title={account.name}
        sub={`${account.industry} · ${account.city} · owned by ${account.owner}`}
        badges={[<StatusBadge key="h" label={account.openOpps > 0 ? 'Engaged' : 'Quiet'} tone={account.openOpps > 0 ? 'green' : 'gray'} />]} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4"><div className="kicker text-muted-foreground">Lifetime Revenue</div><div className="font-display mt-1 text-[22px] font-semibold">{account.revenue ? fmtINR(account.revenue) : '—'}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="kicker text-muted-foreground">Open Opportunities</div><div className="font-display mt-1 text-[22px] font-semibold">{account.openOpps}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="kicker text-muted-foreground">Contacts</div><div className="font-display mt-1 text-[22px] font-semibold">{contacts.length || account.contacts}</div></div>
      </div>

      <DetailTabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="pt-1">
        {tab === 'contacts' && (contacts.length ? <DataTable head={['Contact', 'Title', 'Email', 'Phone', 'Primary']} rows={contacts.map(c => [
          <span className="font-medium">{c.name}</span>, c.title, <Mono className="text-muted-foreground">{c.email}</Mono>, <Mono className="text-muted-foreground">{c.phone}</Mono>,
          <StatusBadge label={c.primary ? 'Primary' : '—'} tone={c.primary ? 'ink' : 'gray'} />,
        ])} /> : <EmptyRow text="No contacts linked to this account." />)}

        {tab === 'opportunities' && (opps.length ? <DataTable head={['Code', 'Opportunity', 'Stage', 'Probability', 'Expected Revenue', 'Close']} rows={opps.map(o => [
          <Mono className="text-muted-foreground">{o.code}</Mono>, o.name, <StatusBadge label={o.stage} tone={o.stage === 'Won' ? 'ink' : o.stage === 'Lost' ? 'red' : 'blue'} />,
          <Mono>{o.probability}%</Mono>, <span className="font-display font-semibold">{fmtINR(o.expectedRevenue)}</span>, <Mono className="text-muted-foreground">{o.closeDate}</Mono>,
        ])} /> : <EmptyRow text="No opportunities for this account." />)}

        {tab === 'activities' && (acts.length ? <DataTable head={['Type', 'Subject', 'Owner', 'Due', 'Status']} rows={acts.map(a => [
          <StatusBadge label={a.type} tone="sage" />, a.subject, a.owner, <Mono className="text-muted-foreground">{a.due}</Mono>, <StatusBadge label={a.status} tone={a.status === 'Completed' ? 'green' : a.status === 'Cancelled' ? 'red' : 'amber'} />,
        ])} /> : <EmptyRow text="No activities recorded." />)}

        {tab === 'tasks' && (tks.length ? <DataTable head={['Task', 'Assignee', 'Priority', 'Status', 'Due']} rows={tks.map(t => [
          t.title, t.assignee, <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'amber' : 'gray'} />,
          <StatusBadge label={t.status} tone={t.status === 'Completed' ? 'green' : t.status === 'Open' ? 'sage' : 'blue'} />, <Mono className="text-muted-foreground">{t.due}</Mono>,
        ])} /> : <EmptyRow text="No tasks linked to this account." />)}

        {tab === 'meetings' && (mts.length ? <DataTable head={['Meeting', 'Date', 'Time', 'Mode', 'Organizer', 'Status']} rows={mts.map(m => [
          <span className="font-medium">{m.title}</span>, <Mono className="text-muted-foreground">{m.date}</Mono>, <Mono className="text-muted-foreground">{m.time}</Mono>,
          m.mode, m.organizer, <StatusBadge label={m.status} tone={m.status === 'Completed' ? 'green' : m.status === 'Cancelled' ? 'red' : 'blue'} />,
        ])} /> : <EmptyRow text="No meetings scheduled." />)}

        {tab === 'visits' && (vs.length ? <DataTable head={['Employee', 'Check-In', 'Check-Out', 'Duration', 'Purpose', 'Outcome', 'Distance']} rows={vs.map(v => [
          v.employee, <Mono className="text-muted-foreground">{v.checkIn}</Mono>, <Mono className="text-muted-foreground">{v.checkOut}</Mono>, <Mono>{v.durationMin} min</Mono>,
          v.purpose, <span className="text-muted-foreground">{v.outcome}</span>, <Mono>{v.distanceKm} km</Mono>,
        ])} /> : <EmptyRow text="No geo-verified visits yet." />)}
      </div>
    </div>
  );
}
