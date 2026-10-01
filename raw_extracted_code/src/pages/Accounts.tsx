// src/pages/Accounts.tsx — store-backed + click-through
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono } from '@/components/shared';
import { fmtINR } from '@/data/mock';
import { useCRM } from '@/store/crm';

export default function Accounts({ onOpen }: { onOpen: (id: string) => void }) {
  const { accounts, user } = useCRM();
  const mine = user?.role === 'Employee';
  const rows = mine ? accounts.filter(a => a.owner === user?.name) : accounts;

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 22" title={mine ? 'My Accounts' : 'Accounts'}
        sub="Business entities created directly or via lead conversion. Click an account to open its 360° hub — contacts, opportunities, activities, tasks, meetings and visits in one place."
        action={<><ImportExport /><NewButton label="Create Account" /></>} />
      <Toolbar placeholder="Search accounts…">
        <FilterChip label="All Industries" active />
        <FilterChip label="All Owners" active />
      </Toolbar>
      <DataTable
        head={['Account', 'Industry', 'City', 'Owner', 'Contacts', 'Open Opps', 'Lifetime Revenue', 'Health']}
        rows={rows.map(a => [
          <button onClick={() => onOpen(a.id)} className="font-medium text-[#0b5c37] hover:underline">{a.name}</button>,
          <span className="text-muted-foreground">{a.industry}</span>,
          a.city,
          a.owner,
          <Mono>{a.contacts}</Mono>,
          <Mono>{a.openOpps}</Mono>,
          <span className="font-display font-semibold">{a.revenue ? fmtINR(a.revenue) : '—'}</span>,
          <StatusBadge label={a.openOpps > 0 ? 'Engaged' : 'Quiet'} tone={a.openOpps > 0 ? 'green' : 'gray'} />,
        ])}
      />
    </div>
  );
}
