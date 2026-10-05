// src/pages/AuditLogs.tsx
import { useState, useMemo } from 'react';
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, Mono } from '@/components/shared';
import { useCRM } from '@/store/crm';

export default function AuditLogs() {
  const { audit } = useCRM();
  const [filter, setFilter] = useState('All');
  const modules = useMemo(() => ['All', ...Array.from(new Set(audit.map(a => a.module)))], [audit]);
  const rows = useMemo(() => audit.filter(a => filter === 'All' || a.module === filter), [audit, filter]);

  return (
    <div className="space-y-5">
      <PageHeader kicker="Administration · Access Matrix" title="Audit Logs"
        sub="Immutable trail of every create, update, conversion, stage change and geo event — visible to Super Admin and Company Admin only." />
      <Toolbar placeholder="Search audit entries…">
        {modules.map(m => <FilterChip key={m} label={m} active={filter === m} onClick={() => setFilter(m)} />)}
      </Toolbar>
      <DataTable head={['Time', 'User', 'Module', 'Action', 'Record']}
        rows={rows.map(a => [
          <Mono className="text-muted-foreground">{a.time}</Mono>,
          <span className="font-medium">{a.user}</span>,
          <StatusBadge label={a.module} tone="sage" />,
          a.action,
          <Mono className="text-muted-foreground">{a.record}</Mono>,
        ])} />
      <p className="font-mono2 text-[10.5px] text-muted-foreground">Entries are appended by store actions (login, conversion, stage changes, check-in/out, visits) — swap the store methods for FastAPI calls to persist.</p>
    </div>
  );
}
