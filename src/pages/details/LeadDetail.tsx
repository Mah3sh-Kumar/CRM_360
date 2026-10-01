// src/pages/details/LeadDetail.tsx
import { useState } from 'react';
import { PageHeader, DataTable, StatusBadge, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { BackBar, DetailTabs, Field, EmptyRow } from '@/pages/details/shared';
import { useCRM } from '@/store/crm';
import { employees, activities, fmtINR } from '@/data/mock';
import type { LeadStatus, Customer, Account } from '@/data/mock';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const stages: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const tone = (s: LeadStatus): Tone =>
  s === 'Won' ? 'ink' : s === 'Lost' ? 'red' : s === 'New' ? 'sage' : s === 'Negotiation' ? 'amber' : s === 'Proposal Sent' ? 'blue' : 'green';

export default function LeadDetail({ id, onBack, onNavigate }: {
  id: string; onBack: () => void; onNavigate: (page: string, id?: string) => void;
}) {
  const crm = useCRM();
  const lead = crm.leads.find(l => l.id === id);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const [showConvert, setShowConvert] = useState(false);
  const [owner, setOwner] = useState(lead?.owner ?? '');
  const [custStatus, setCustStatus] = useState<'Active' | 'Prospect'>('Active');
  const [result, setResult] = useState<{ customer: Customer; account: Account } | null>(null);
  const [done, setDone] = useState(false);

  if (!lead) return <div className="space-y-4"><EmptyRow text="Lead not found." /><button onClick={onBack} className="font-mono2 text-[11px] text-[#007f24]">← Back to Leads</button></div>;

  const conv = crm.conversions.find(c => c.leadId === id);
  const converted = !!conv || done;
  const idx = stages.indexOf(lead.status);
  const history = crm.audit.filter(a => a.record === lead.code);

  return (
    <div className="space-y-5">
      <BackBar onBack={onBack} kicker={`Leads · ${lead.code}`} title={lead.name}
        sub={`${lead.company} · via ${lead.source} · owned by ${lead.owner}`}
        badges={[<StatusBadge key="s" label={lead.status} tone={tone(lead.status)} />, converted && <StatusBadge key="c" label="Converted" tone="ink" />]}
        actions={!converted && (
          <button onClick={() => setShowConvert(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#007f24] px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#0a6b20]">
            Convert Lead
          </button>
        )} />

      {/* lifecycle strip */}
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div className={cn('h-1.5 flex-1 rounded-full', i <= idx ? (lead.status === 'Lost' && i === idx ? 'bg-[#b03a26]' : 'bg-[#007f24]') : 'bg-border')} />
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono2 text-[9.5px] uppercase tracking-wider text-muted-foreground">
        <span>New</span><span>Won / Lost</span>
      </div>

      {result && (
        <div className="rounded-lg border border-[#bcdcc6] bg-[#e3f0e7] px-4 py-3 text-[12.5px] text-[#0f6b2e]">
          ✓ Lead converted — created <b>{result.customer.code}</b> (Customer) and <b>{result.account.name}</b> (Account).
          <button onClick={() => onNavigate('customers', result.customer.id)} className="ml-3 font-semibold underline">View Customer</button>
          <button onClick={() => onNavigate('accounts', result.account.id)} className="ml-2 font-semibold underline">View Account</button>
        </div>
      )}

      <DetailTabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'history', label: 'History', count: history.length }]} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Company">{lead.company}</Field>
              <Field label="Phone"><Mono>{lead.phone}</Mono></Field>
              <Field label="Source">{lead.source}</Field>
              <Field label="Owner">{lead.owner}</Field>
              <Field label="Created On"><Mono>{lead.createdOn}</Mono></Field>
              <Field label="Est. Value"><span className="font-display font-semibold">{fmtINR(lead.value)}</span></Field>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="kicker mb-3 text-muted-foreground">Related Activities</div>
            <div className="space-y-2.5">
              {activities.filter(a => a.relatedTo === lead.company).map(a => (
                <div key={a.id} className="flex items-center gap-2 text-[12px]">
                  <StatusBadge label={a.type} tone="sage" />
                  <span className="truncate">{a.subject}</span>
                  <Mono className="ml-auto shrink-0 text-muted-foreground">{a.due.slice(5, 10)}</Mono>
                </div>
              ))}
              {activities.filter(a => a.relatedTo === lead.company).length === 0 && <EmptyRow text="No activities yet." />}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        history.length ? <DataTable head={['Time', 'User', 'Module', 'Action']} rows={history.map(h => [
          <Mono className="text-muted-foreground">{h.time}</Mono>, h.user, h.module, h.action,
        ])} /> : <EmptyRow text="No history recorded for this lead yet." />
      )}

      {/* Convert dialog */}
      {showConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c231e]/45 p-4" onClick={() => setShowConvert(false)}>
          <div className="w-full max-w-[420px] rounded-xl border border-border bg-card p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-[17px] font-semibold">Convert Lead</h3>
            <p className="mt-1 text-[12.5px] text-muted-foreground">This will create a Customer, an Account and a conversion history entry. The lead will be marked Won.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="kicker text-muted-foreground">Account / Customer Owner</label>
                <select value={owner} onChange={e => setOwner(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-card px-2 text-[13px]">
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name} · {e.designation}</option>)}
                </select>
              </div>
              <div>
                <label className="kicker text-muted-foreground">Customer Status</label>
                <select value={custStatus} onChange={e => setCustStatus(e.target.value as 'Active' | 'Prospect')} className="mt-1.5 h-9 w-full rounded-md border border-input bg-card px-2 text-[13px]">
                  <option>Active</option><option>Prospect</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowConvert(false)} className="h-8 rounded-md border border-input px-3 text-[12.5px] font-medium">Cancel</button>
              <button onClick={() => {
                const r = crm.convertLead(id, owner, custStatus);
                if (r) { setResult(r); setDone(true); }
                setShowConvert(false);
              }} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#007f24] px-3 text-[12.5px] font-semibold text-white hover:bg-[#0a6b20]">
                <ArrowRight className="size-3.5" /> Convert Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
