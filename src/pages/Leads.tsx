// src/pages/Leads.tsx — now store-backed, click-through, "My X" scoping for Employees
import { useState, useMemo } from 'react';
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono, ErrorState } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { leadSources, fmtINR } from '@/data/mock';
import type { LeadStatus, Lead } from '@/data/mock';
import { useCRM } from '@/store/crm';
import LeadModal from '@/components/LeadModal';

const tone = (s: LeadStatus): Tone =>
  s === 'Won' ? 'ink' : s === 'Lost' ? 'red' : s === 'New' ? 'sage' : s === 'Negotiation' ? 'amber' : s === 'Proposal Sent' ? 'blue' : 'green';

const stages: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function Leads({ onOpen }: { onOpen: (id: string) => void }) {
  const { leads, conversions, user, loading, error, fetchLeads } = useCRM();
  const [filter, setFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const mine = user?.role === 'Employee';
  const pool = useMemo(() => mine ? leads.filter(l => l.owner === user?.name) : leads, [mine, leads, user?.name]);
  const rows = useMemo(() => pool.filter(l => filter === 'All' || l.status === filter), [pool, filter]);

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 21" title={mine ? 'My Leads' : 'Leads'}
        sub="Lifecycle: New → Contacted → Qualified → Proposal Sent → Negotiation → Won. Won leads can be converted to Customer + Account from the detail view."
        action={<><ImportExport /><NewButton label="Create Lead" onClick={() => setShowModal(true)} /></>} />
      <Toolbar placeholder="Search lead name, company, phone…">
        {['All', ...stages].map(s => <FilterChip key={s} label={s} active={filter === s} onClick={() => setFilter(filter === s ? 'All' : s)} />)}
      </Toolbar>
      <div className="flex gap-px overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-border">
        {stages.map(s => {
          const n = pool.filter(l => l.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'All' : s)}
              className={`min-w-[120px] flex-1 px-3 py-3 text-left transition-colors shrink-0 ${filter === s ? 'bg-ink text-white' : 'bg-card hover:bg-muted-bg'}`}>
              <div className={`kicker ${filter === s ? 'text-sage-light' : 'text-muted-foreground'}`}>{s}</div>
              <div className="font-display mt-1 text-[20px] font-semibold leading-none">{n}</div>
            </button>
          );
        })}
      </div>
      {error.leads ? (
        <ErrorState title="Failed to load leads" message={error.leads} onRetry={fetchLeads} />
      ) : (
        <DataTable<Lead>
          loading={loading.leads}
          columns={[
            { header: 'Lead Code', accessorKey: 'code', sortable: true, sortType: 'text', cell: (l) => <Mono className="text-muted-foreground">{l.code}</Mono> },
            { header: 'Lead', accessorKey: 'name', sortable: true, sortType: 'text', cell: (l) => <button onClick={() => onOpen(l.id)} className="font-medium text-link hover:underline">{l.name}</button> },
            { header: 'Company', accessorKey: 'company', sortable: true, sortType: 'text' },
            { header: 'Source', accessorKey: 'source', sortable: true, sortType: 'text', cell: (l) => <span className="text-muted-foreground">{l.source}</span> },
            { header: 'Status', accessorKey: 'status', sortable: true, sortType: 'text', cell: (l) => <span className="flex items-center gap-1.5"><StatusBadge label={l.status} tone={tone(l.status)} />{conversions.some(c => c.leadId === l.id) && <StatusBadge label="Converted" tone="ink" />}</span> },
            { header: 'Owner', accessorKey: 'owner', sortable: true, sortType: 'text' },
            { header: 'Est. Value', accessorKey: 'value', sortable: true, sortType: 'number', cell: (l) => <span className="font-display font-semibold">{fmtINR(l.value)}</span> },
            { header: 'Created', accessorKey: 'createdOn', sortable: true, sortType: 'date', cell: (l) => <Mono className="text-muted-foreground">{l.createdOn.slice(5)}</Mono> },
            { header: 'Phone', accessorKey: 'phone', sortable: true, sortType: 'text', cell: (l) => <Mono className="text-muted-foreground">{l.phone}</Mono> },
          ]}
          data={rows}
          pagination
          defaultPageSize={10}
          emptyMessage="No leads found matching your filters."
        />
      )}
      <p className="font-mono2 text-[10.5px] text-muted-foreground">Click a lead name for details & conversion. Duplicate check runs on phone + company before save. Sources: {leadSources.join(' · ')}.</p>
      
      <LeadModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
