import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, Mono, ErrorState } from '@/components/shared';
import type { Tone } from '@/components/shared';
import type { Activity } from '@/data/mock';
import { useCRM } from '@/store/crm';
import { Phone, Mail, Footprints, MonitorPlay, Undo2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import ActivityModal from '@/components/ActivityModal';

const icons: Record<string, React.ElementType> = { 
  Call: Phone, Email: Mail, Visit: Footprints, 'Customer Visit': Footprints, 
  Demo: MonitorPlay, 'Follow-Up': Undo2, 'Meeting Follow-Up': Undo2, 
  Discussion: Phone, Note: Mail 
};
const tone = (s: Activity['status']): Tone => s === 'Completed' ? 'ink' : s === 'Cancelled' ? 'red' : 'green';

export default function Activities() {
  const { activities, loading, error, fetchActivities } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    let res = activities;
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(a => a.subject.toLowerCase().includes(q) || a.relatedTo?.toLowerCase().includes(q) || a.owner?.toLowerCase().includes(q));
    }
    return res;
  }, [activities, search]);
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 25" title="Activities"
        sub="Every customer interaction logged chronologically — calls, emails, visits, demos and follow-ups."
        action={<NewButton label="Create Activity" onClick={() => setShowModal(true)} />} />
      <Toolbar placeholder="Search subject, account, owner..." searchValue={search} onSearchChange={setSearch}>
        <FilterChip label="All Types" active /><FilterChip label="Scheduled" /><FilterChip label="Completed" />
      </Toolbar>
      {error.activities ? (
        <ErrorState title="Failed to load activities" message={error.activities} onRetry={fetchActivities} />
      ) : (
        <DataTable<Activity>
          loading={loading.activities}
          columns={[
            { header: 'Type', accessorKey: 'type', sortable: true, sortType: 'text', cell: (a) => {
              const Icon = icons[a.type] || Phone;
              return <span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-secondary"><Icon className="size-3.5" /></span>{a.type}</span>;
            } },
            { header: 'Subject', accessorKey: 'subject', sortable: true, sortType: 'text', cell: (a) => <span className="font-medium">{a.subject}</span> },
            { header: 'Related To', accessorKey: 'relatedTo', sortable: true, sortType: 'text' },
            { header: 'Owner', accessorKey: 'owner', sortable: true, sortType: 'text', cell: (a) => <span className="text-muted-foreground">{a.owner}</span> },
            { header: 'Due', accessorKey: 'due', sortable: true, sortType: 'date', cell: (a) => <Mono className="text-muted-foreground">{a.due}</Mono> },
            { header: 'Status', accessorKey: 'status', sortable: true, sortType: 'text', cell: (a) => <StatusBadge label={a.status} tone={tone(a.status)} /> },
            { header: 'Timeline', sortable: false, cell: (a) => <Mono className="text-muted-foreground">created → assigned → {a.status.toLowerCase()}</Mono> },
          ]}
          data={rows}
          pagination
          defaultPageSize={10}
          emptyMessage="No activities found."
        />
      )}
      <ActivityModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
