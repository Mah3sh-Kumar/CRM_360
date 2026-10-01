import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono } from '@/components/shared';
import { accounts, fmtINR } from '@/data/mock';

export default function Accounts() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 22" title="Accounts"
        sub="Business entities created directly or via lead conversion. Deletion is restricted per access matrix."
        action={<><ImportExport /><NewButton label="Create Account" /></>} />
      <Toolbar placeholder="Search accounts…">
        <FilterChip label="All Industries" active />
        <FilterChip label="All Owners" active />
      </Toolbar>
      <DataTable
        head={['Account', 'Industry', 'City', 'Owner', 'Contacts', 'Open Opps', 'Lifetime Revenue', 'Health']}
        rows={accounts.map(a => [
          <span className="font-medium">{a.name}</span>,
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
