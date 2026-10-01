import { useState } from 'react';
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { leads, leadSources, fmtINR } from '@/data/mock';
import type { LeadStatus } from '@/data/mock';

const tone = (s: LeadStatus): Tone =>
  s === 'Won' ? 'ink' : s === 'Lost' ? 'red' : s === 'New' ? 'sage' : s === 'Negotiation' ? 'amber' : s === 'Proposal Sent' ? 'blue' : 'green';

const stages: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function Leads() {
  const [filter, setFilter] = useState<string>('All');
  const rows = leads.filter(l => filter === 'All' || l.status === filter);
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 21" title="Leads"
        sub="Lifecycle: New → Contacted → Qualified → Proposal Sent → Negotiation → Won. Any stage may transition to Lost."
        action={<><ImportExport /><NewButton label="Create Lead" /></>} />
      <Toolbar placeholder="Search lead name, company, phone…">
        {['All', ...stages].map(s => <FilterChip key={s} label={s} active={filter === s} />)}
      </Toolbar>
      {/* status strip */}
      <div className="flex gap-px overflow-hidden rounded-lg border border-border bg-border">
        {stages.map(s => {
          const n = leads.filter(l => l.status === s).length;
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
          <span className="font-medium">{l.name}</span>,
          l.company,
          <span className="text-muted-foreground">{l.source}</span>,
          <StatusBadge label={l.status} tone={tone(l.status)} />,
          l.owner,
          <span className="font-display font-semibold">{fmtINR(l.value)}</span>,
          <Mono className="text-muted-foreground">{l.createdOn.slice(5)}</Mono>,
          <Mono className="text-muted-foreground">{l.phone}</Mono>,
        ])}
      />
      <p className="font-mono2 text-[10.5px] text-muted-foreground">Duplicate check runs on phone + company before save. Sources: {leadSources.join(' · ')}.</p>
    </div>
  );
}
