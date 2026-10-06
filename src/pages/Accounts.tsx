// src/pages/Accounts.tsx — store-backed + click-through
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono, ErrorState } from '@/components/shared';
import { fmtINR } from '@/data/mock';
import type { Account } from '@/data/mock';
import { useCRM } from '@/store/crm';
import { useState, useMemo } from 'react';
import AccountModal from '@/components/AccountModal';

export default function Accounts({ onOpen }: { onOpen: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const { accounts, user, loading, error, fetchAccounts } = useCRM();
  const [search, setSearch] = useState('');
  // Assuming no actual status/industry list available directly without mapping, keeping a dummy filter UI for now
  
  const mine = user?.role === 'Employee';
  const pool = useMemo(() => mine ? accounts.filter(a => a.owner === user?.name) : accounts, [mine, accounts, user?.name]);
  
  const rows = useMemo(() => {
    let result = pool;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.industry?.toLowerCase().includes(q) || 
        a.city?.toLowerCase().includes(q) ||
        a.owner?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [pool, search]);

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 22" title={mine ? 'My Accounts' : 'Accounts'}
        sub="Business entities created directly or via lead conversion. Click an account to open its 360° hub — contacts, opportunities, activities, tasks, meetings and visits in one place."
        action={<><ImportExport /><NewButton label="Create Account" onClick={() => setShowModal(true)} /></>} />
      <Toolbar placeholder="Search accounts, industry, city..." searchValue={search} onSearchChange={setSearch}>
        {/* Intentionally keeping filters as UI only since they are missing the actual data enum. 
            If there are specific ones, they can be implemented similar to leads. */}
        <FilterChip label="All Industries" active />
        <FilterChip label="All Owners" active />
      </Toolbar>
      {error.accounts ? (
        <ErrorState title="Failed to load accounts" message={error.accounts} onRetry={fetchAccounts} />
      ) : (
        <DataTable<Account>
          loading={loading.accounts}
          columns={[
            { header: 'Account', accessorKey: 'name', sortable: true, sortType: 'text', cell: (a) => <button onClick={() => onOpen(a.id)} className="font-medium text-link hover:underline">{a.name}</button> },
            { header: 'Industry', accessorKey: 'industry', sortable: true, sortType: 'text', cell: (a) => <span className="text-muted-foreground">{a.industry}</span> },
            { header: 'City', accessorKey: 'city', sortable: true, sortType: 'text' },
            { header: 'Owner', accessorKey: 'owner', sortable: true, sortType: 'text' },
            { header: 'Contacts', accessorKey: 'contacts', sortable: true, sortType: 'number', cell: (a) => <Mono>{a.contacts}</Mono> },
            { header: 'Open Opps', accessorKey: 'openOpps', sortable: true, sortType: 'number', cell: (a) => <Mono>{a.openOpps}</Mono> },
            { header: 'Lifetime Revenue', accessorKey: 'revenue', sortable: true, sortType: 'number', cell: (a) => <span className="font-display font-semibold">{a.revenue ? fmtINR(a.revenue) : '—'}</span> },
            { header: 'Health', accessorKey: 'openOpps', sortable: false, cell: (a) => <StatusBadge label={a.openOpps > 0 ? 'Engaged' : 'Quiet'} tone={a.openOpps > 0 ? 'green' : 'gray'} /> },
          ]}
          data={rows}
          pagination
          defaultPageSize={10}
          emptyMessage="No accounts found."
        />
      )}
      <AccountModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
