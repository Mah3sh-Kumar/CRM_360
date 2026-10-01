// src/pages/details/CustomerDetail.tsx — Customer 360 + Record Visit (GPS-gated)
import { useState } from 'react';
import { DataTable, StatusBadge, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { BackBar, DetailTabs, Field, EmptyRow } from '@/pages/details/shared';
import { useCRM } from '@/store/crm';
import { activities, tasks, meetings, fmtINR } from '@/data/mock';
import { MapPin } from 'lucide-react';

type Tab = 'overview' | 'accounts' | 'contacts' | 'opportunities' | 'activities' | 'tasks' | 'meetings' | 'visits';
const cusTone = (s: string): Tone => s === 'Active' ? 'green' : s === 'Prospect' ? 'blue' : 'gray';

export default function CustomerDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const crm = useCRM();
  const customer = crm.customers.find(c => c.id === id);
  const [tab, setTab] = useState<Tab>('overview');
  const [visitMsg, setVisitMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [purpose, setPurpose] = useState('Requirement Discussion');

  if (!customer) return <div className="space-y-4"><EmptyRow text="Customer not found." /><button onClick={onBack} className="font-mono2 text-[11px] text-[#007f24]">← Back to Customers</button></div>;

  const accts = crm.accounts.filter(a => a.name === customer.name);
  const contactList = crm.contacts.filter(c => c.account === customer.name);
  const opps = crm.opportunities.filter(o => o.account === customer.name);
  const acts = activities.filter(a => a.relatedTo === customer.name);
  const tks = tasks.filter(t => t.related === customer.name);
  const mts = meetings.filter(m => m.account === customer.name);
  const vs = crm.visits.filter(v => v.customer === customer.name);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'accounts', label: 'Accounts', count: accts.length },
    { id: 'contacts', label: 'Contacts', count: contactList.length }, { id: 'opportunities', label: 'Opportunities', count: opps.length },
    { id: 'activities', label: 'Activities', count: acts.length }, { id: 'tasks', label: 'Tasks', count: tks.length },
    { id: 'meetings', label: 'Meetings', count: mts.length }, { id: 'visits', label: 'Visits', count: vs.length },
  ];

  return (
    <div className="space-y-5">
      <BackBar onBack={onBack} kicker={`Customers · ${customer.code}`} title={customer.name}
        sub={`${customer.industry} · ${customer.city} · customer since ${customer.since}`}
        badges={[<StatusBadge key="s" label={customer.status} tone={cusTone(customer.status)} />]}
        actions={
          <div className="flex items-end gap-2">
            <select value={purpose} onChange={e => setPurpose(e.target.value)} className="h-8 rounded-md border border-input bg-card px-2 text-[12px]">
              <option>Requirement Discussion</option><option>Demo</option><option>Follow-Up</option><option>Contract Discussion</option><option>Complaint Resolution</option>
            </select>
            <button onClick={() => setVisitMsg(crm.recordVisit({ customer: customer.name, contact: contactList[0]?.name ?? '', purpose }))}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#007f24] px-3 text-[12.5px] font-semibold text-white hover:bg-[#0a6b20]">
              <MapPin className="size-3.5" /> Record Visit
            </button>
          </div>
        } />

      {visitMsg && (
        <div className={`rounded-lg border px-4 py-2.5 text-[12.5px] ${visitMsg.ok ? 'border-[#bcdcc6] bg-[#e3f0e7] text-[#0f6b2e]' : 'border-[#eadfbe] bg-[#faf3e0] text-[#8a6d1a]'}`}>
          {visitMsg.ok ? '✓' : '⚠'} {visitMsg.message}
          {crm.checkIn.fix && <span className="ml-2 font-mono2 text-[10.5px]">GPS {crm.checkIn.fix.lat}, {crm.checkIn.fix.lng}</span>}
        </div>
      )}
      {!crm.checkIn.checkedIn && !visitMsg && (
        <div className="rounded-lg border border-[#eadfbe] bg-[#faf3e0] px-4 py-2.5 text-[12.5px] text-[#8a6d1a]">
          ⚠ Check-In required — you must check in (sidebar) before recording a customer visit.
        </div>
      )}

      <DetailTabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="pt-1">
        {tab === 'overview' && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4 md:col-span-2">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Field label="Phone"><Mono>{customer.phone}</Mono></Field>
                <Field label="Email"><Mono>{customer.email || '—'}</Mono></Field>
                <Field label="Owner">{customer.owner}</Field>
                <Field label="Industry">{customer.industry}</Field>
                <Field label="City">{customer.city}</Field>
                <Field label="Revenue"><span className="font-display font-semibold">{customer.revenue ? fmtINR(customer.revenue) : '—'}</span></Field>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="kicker mb-2 text-muted-foreground">Snapshot</div>
              <div className="space-y-1.5 font-mono2 text-[11px] text-muted-foreground">
                <div>Open opportunities — {opps.filter(o => !['Won', 'Lost'].includes(o.stage)).length}</div>
                <div>Activities — {acts.length} · Meetings — {mts.length}</div>
                <div>Visits — {vs.length} · Contacts — {contactList.length}</div>
              </div>
            </div>
          </div>
        )}
        {tab === 'accounts' && (accts.length ? <DataTable head={['Account', 'Industry', 'Owner', 'Open Opps', 'Revenue']} rows={accts.map(a => [
          <span className="font-medium">{a.name}</span>, a.industry, a.owner, <Mono>{a.openOpps}</Mono>, <span className="font-display font-semibold">{a.revenue ? fmtINR(a.revenue) : '—'}</span>,
        ])} /> : <EmptyRow text="No accounts linked yet." />)}
        {tab === 'contacts' && (contactList.length ? <DataTable head={['Contact', 'Title', 'Email', 'Phone']} rows={contactList.map(c => [
          <span className="font-medium">{c.name}</span>, c.title, <Mono className="text-muted-foreground">{c.email}</Mono>, <Mono className="text-muted-foreground">{c.phone}</Mono>,
        ])} /> : <EmptyRow text="No contacts linked yet." />)}
        {tab === 'opportunities' && (opps.length ? <DataTable head={['Code', 'Opportunity', 'Stage', 'Probability', 'Expected Revenue']} rows={opps.map(o => [
          <Mono className="text-muted-foreground">{o.code}</Mono>, o.name, <StatusBadge label={o.stage} tone={o.stage === 'Won' ? 'ink' : o.stage === 'Lost' ? 'red' : 'blue'} />,
          <Mono>{o.probability}%</Mono>, <span className="font-display font-semibold">{fmtINR(o.expectedRevenue)}</span>,
        ])} /> : <EmptyRow text="No opportunities for this customer." />)}
        {tab === 'activities' && (acts.length ? <DataTable head={['Type', 'Subject', 'Owner', 'Due', 'Status']} rows={acts.map(a => [
          <StatusBadge label={a.type} tone="sage" />, a.subject, a.owner, <Mono className="text-muted-foreground">{a.due}</Mono>, <StatusBadge label={a.status} tone={a.status === 'Completed' ? 'green' : 'amber'} />,
        ])} /> : <EmptyRow text="No activities recorded." />)}
        {tab === 'tasks' && (tks.length ? <DataTable head={['Task', 'Assignee', 'Priority', 'Status', 'Due']} rows={tks.map(t => [
          t.title, t.assignee, <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : 'amber'} />, <StatusBadge label={t.status} tone={t.status === 'Completed' ? 'green' : 'sage'} />, <Mono className="text-muted-foreground">{t.due}</Mono>,
        ])} /> : <EmptyRow text="No tasks linked." />)}
        {tab === 'meetings' && (mts.length ? <DataTable head={['Meeting', 'Date', 'Time', 'Mode', 'Organizer']} rows={mts.map(m => [
          <span className="font-medium">{m.title}</span>, <Mono className="text-muted-foreground">{m.date}</Mono>, <Mono className="text-muted-foreground">{m.time}</Mono>, m.mode, m.organizer,
        ])} /> : <EmptyRow text="No meetings scheduled." />)}
        {tab === 'visits' && (vs.length ? <DataTable head={['Employee', 'Check-In', 'Check-Out', 'Duration', 'Purpose', 'Outcome']} rows={vs.map(v => [
          v.employee, <Mono className="text-muted-foreground">{v.checkIn}</Mono>, <Mono className="text-muted-foreground">{v.checkOut}</Mono>, <Mono>{v.durationMin} min</Mono>, v.purpose, <span className="text-muted-foreground">{v.outcome}</span>,
        ])} /> : <EmptyRow text="No visits recorded." />)}
      </div>
    </div>
  );
}
