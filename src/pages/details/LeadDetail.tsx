// src/pages/details/LeadDetail.tsx
import { useState } from 'react';
import { DataTable, StatusBadge, Mono, LoadingState, ErrorState } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { BackBar, DetailTabs, Field, EmptyRow } from '@/pages/details/shared';
import { useCRM } from '@/store/crm';
import { employees, activities, fmtINR } from '@/data/mock';
import type { LeadStatus, Customer, Account } from '@/data/mock';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

  if (crm.loading.leads && !lead) return <LoadingState message="Loading lead details..." />;
  if (crm.error.leads) return <ErrorState title="Failed to load lead" message={crm.error.leads} onRetry={crm.fetchLeads} />;
  if (!lead) return <div className="space-y-4"><EmptyRow text="Lead not found." /><button onClick={onBack} className="font-mono2 text-[11px] text-primary">← Back to Leads</button></div>;

  const conv = crm.conversions.find(c => c.leadId === id);
  const converted = !!conv || done;
  const idx = stages.indexOf(lead.status);
  const history = crm.audit.filter(a => a.record === lead.code);

  return (
    <div className="space-y-5">
      <BackBar onBack={onBack} kicker={`Leads · ${lead.code}`} title={lead.name}
        sub={`${lead.company} · via ${lead.source} · owned by ${lead.owner}`}
        badges={[<StatusBadge key="s" label={lead.status} tone={tone(lead.status)} />, converted ? <StatusBadge key="c" label="Converted" tone="ink" /> : <></>]}
        actions={!converted && crm.can('EDIT', 'LEAD', lead) && (
          <button onClick={() => setShowConvert(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-primary-hover">
            Convert Lead
          </button>
        )} />

      {/* lifecycle strip */}
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <div className={cn('h-1.5 flex-1 rounded-full', i <= idx ? (lead.status === 'Lost' && i === idx ? 'bg-destructive' : 'bg-primary') : 'bg-border')} />
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono2 text-[9.5px] uppercase tracking-wider text-muted-foreground">
        <span>New</span><span>Won / Lost</span>
      </div>

      {result && (
        <div className="rounded-lg border border-success-border bg-success-bg px-4 py-3 text-[12.5px] text-success">
          ✓ Lead converted — created <b>{result.customer.code}</b> (Customer) and <b>{result.account.name}</b> (Account).
          <button onClick={() => onNavigate('customers', result.customer.id)} className="ml-3 font-semibold underline">View Customer</button>
          <button onClick={() => onNavigate('accounts', result.account.id)} className="ml-2 font-semibold underline">View Account</button>
        </div>
      )}

      <DetailTabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'history', label: 'History', count: history.length }]} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
      <Dialog open={showConvert} onOpenChange={setShowConvert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Lead</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-[12.5px] text-muted-foreground">This will create a Customer, an Account and a conversion history entry. The lead will be marked Won.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Account / Customer Owner</label>
                <select value={owner} onChange={e => setOwner(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {employees.map(e => <option key={e.id} value={e.name}>{e.name} · {e.designation}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Customer Status</label>
                <select value={custStatus} onChange={e => setCustStatus(e.target.value as 'Active' | 'Prospect')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option>Active</option><option>Prospect</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowConvert(false)}>Cancel</Button>
              <Button onClick={() => {
                const r = crm.convertLead(id, owner, custStatus);
                if (r) { setResult(r); setDone(true); }
                setShowConvert(false);
              }} className="gap-1.5">
                <ArrowRight className="size-3.5" /> Convert Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
