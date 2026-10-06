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
    <div className="space-y-4">
      <PageHeader kicker="Administration · Access Matrix" title="Audit Logs" />
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
    </div>
  );
}
