// src/pages/Leads.tsx — now store-backed, click-through, "My X" scoping for Employees
import { useState } from 'react';
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { leadSources, fmtINR } from '@/data/mock';
import type { LeadStatus } from '@/data/mock';
import { useCRM } from '@/store/crm';

const tone = (s: LeadStatus): Tone =>
  s === 'Won' ? 'ink' : s === 'Lost' ? 'red' : s === 'New' ? 'sage' : s === 'Negotiation' ? 'amber' : s === 'Proposal Sent' ? 'blue' : 'green';

const stages: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function Leads({ onOpen }: { onOpen: (id: string) => void }) {
  const { leads, conversions, user } = useCRM();
  const [filter, setFilter] = useState<string>('All');
  const mine = user?.role === 'Employee';
  const pool = mine ? leads.filter(l => l.owner === user?.name) : leads;
  const rows = pool.filter(l => filter === 'All' || l.status === filter);

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 21" title={mine ? 'My Leads' : 'Leads'}
        sub="Lifecycle: New → Contacted → Qualified → Proposal Sent → Negotiation → Won. Won leads can be converted to Customer + Account from the detail view."
        action={<><ImportExport /><NewButton label="Create Lead" /></>} />
      <Toolbar placeholder="Search lead name, company, phone…">
        {['All', ...stages].map(s => <FilterChip key={s} label={s} active={filter === s} onClick={() => setFilter(filter === s ? 'All' : s)} />)}
      </Toolbar>
      <div className="flex gap-px overflow-hidden rounded-lg border border-border bg-border">
        {stages.map(s => {
          const n = pool.filter(l => l.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'All' : s)}
              className={`flex-1 px-3 py-3 text-left transition-colors ${filter === s ? 'bg-[#09352e] text-white' : 'bg-card hover:bg-[#f4f7f2]'}`}>
              <div className={`kicker ${filter === s ? 'text-[#8fd4a8]' : 'text-muted-foreground'}`}>{s}</div>
              <div className="font-display mt-1 text-[20px] font-semibold leading-none">{n}</div>
            </button>
          );
        })}
      </div>
      <DataTable
        head={['Lead Code', 'Lead', 'Company', 'Source', 'Status', 'Owner', 'Est. Value', 'Created', 'Phone']}
        rows={rows.map(l => [
          <Mono className="text-muted-foreground">{l.code}</Mono>,
          <button onClick={() => onOpen(l.id)} className="font-medium text-[#0b5c37] hover:underline">{l.name}</button>,
          l.company,
          <span className="text-muted-foreground">{l.source}</span>,
          <span className="flex items-center gap-1.5"><StatusBadge label={l.status} tone={tone(l.status)} />
            {conversions.some(c => c.leadId === l.id) && <StatusBadge label="Converted" tone="ink" />}</span>,
          l.owner,
          <span className="font-display font-semibold">{fmtINR(l.value)}</span>,
          <Mono className="text-muted-foreground">{l.createdOn.slice(5)}</Mono>,
          <Mono className="text-muted-foreground">{l.phone}</Mono>,
        ])}
      />
      <p className="font-mono2 text-[10.5px] text-muted-foreground">Click a lead name for details & conversion. Duplicate check runs on phone + company before save. Sources: {leadSources.join(' · ')}.</p>
    </div>
  );
}
