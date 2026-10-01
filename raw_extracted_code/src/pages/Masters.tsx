// src/pages/Masters.tsx — customers tab now store-backed + click-through.
// (companies & employees tabs unchanged)
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { companies, employees, fmtINR } from '@/data/mock';
import { useCRM } from '@/store/crm';

const empTone = (s: string): Tone => s === 'Active' ? 'green' : s === 'On Leave' ? 'amber' : 'gray';
const cusTone = (s: string): Tone => s === 'Active' ? 'green' : s === 'Prospect' ? 'blue' : 'gray';

export default function Masters({ tab, onOpen }: { tab: 'companies' | 'employees' | 'customers'; onOpen?: (id: string) => void }) {
  const { customers } = useCRM();

  if (tab === 'companies') return (
    <div className="space-y-5">
      <PageHeader kicker="Masters · Module 17" title="Companies"
        sub="Primary organisational entity. Multi-company deployment with complete data isolation. Company Code must be unique."
        action={<><ImportExport /><NewButton label="Create Company" /></>} />
      <Toolbar placeholder="Search companies…"><FilterChip label="Active" active /><FilterChip label="Inactive" /></Toolbar>
      <DataTable
        head={['Code', 'Company', 'Industry', 'City', 'Country', 'Employees', 'Status', 'Created On']}
        rows={companies.map(c => [
          <Mono className="text-muted-foreground">{c.code}</Mono>,
          <span className="font-medium">{c.name}</span>,
          <span className="text-muted-foreground">{c.industry}</span>,
          c.city, c.country,
          <Mono>{c.employees}</Mono>,
          <StatusBadge label={c.status} tone={c.status === 'Active' ? 'green' : 'gray'} />,
          <Mono className="text-muted-foreground">{c.createdOn}</Mono>,
        ])}
      />
    </div>
  );

  if (tab === 'employees') return (
    <div className="space-y-5">
      <PageHeader kicker="Masters · Module 18" title="Employees"
        sub="Central user repository. Reporting manager defines hierarchy visibility. GPS tracking opt-in controls geo module access."
        action={<><ImportExport /><NewButton label="Create Employee" /></>} />
      <Toolbar placeholder="Search employees…"><FilterChip label="All Companies" active /><FilterChip label="GPS Enabled" /></Toolbar>
      <DataTable
        head={['Code', 'Employee', 'Email', 'Company', 'Designation', 'Reports To', 'Role', 'GPS', 'Status']}
        rows={employees.map(e => [
          <Mono className="text-muted-foreground">{e.code}</Mono>,
          <div><div className="font-medium">{e.name}</div><Mono className="text-muted-foreground">{e.mobile}</Mono></div>,
          <Mono className="text-muted-foreground">{e.email}</Mono>,
          <span className="text-muted-foreground">{e.company}</span>,
          e.designation,
          <span className="text-muted-foreground">{e.manager}</span>,
          <StatusBadge label={e.role} tone={e.role === 'Company Admin' ? 'ink' : e.role === 'Manager' ? 'blue' : 'sage'} />,
          <StatusBadge label={e.gps ? 'On' : 'Off'} tone={e.gps ? 'green' : 'gray'} />,
          <StatusBadge label={e.status} tone={empTone(e.status)} />,
        ])}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader kicker="Masters · Module 19" title="Customers"
        sub="Lifecycle: Prospect → Active → Inactive. Created directly or through lead conversion. Click a customer to open Customer 360."
        action={<><ImportExport /><NewButton label="Create Customer" /></>} />
      <Toolbar placeholder="Search customers…"><FilterChip label="All Statuses" active /><FilterChip label="All Owners" /></Toolbar>
      <DataTable
        head={['Code', 'Customer', 'Industry', 'City', 'Owner', 'Contact', 'Status', 'Customer Since', 'Revenue']}
        rows={customers.map(c => [
          <Mono className="text-muted-foreground">{c.code}</Mono>,
          onOpen
            ? <button onClick={() => onOpen(c.id)} className="font-medium text-[#0b5c37] hover:underline">{c.name}</button>
            : <span className="font-medium">{c.name}</span>,
          <span className="text-muted-foreground">{c.industry}</span>,
          c.city, c.owner,
          <div><Mono className="text-muted-foreground">{c.phone}</Mono><div className="font-mono2 text-[10.5px] text-muted-foreground">{c.email}</div></div>,
          <StatusBadge label={c.status} tone={cusTone(c.status)} />,
          <Mono className="text-muted-foreground">{c.since}</Mono>,
          <span className="font-display font-semibold">{c.revenue ? fmtINR(c.revenue) : '—'}</span>,
        ])}
      />
    </div>
  );
}
