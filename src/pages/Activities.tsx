import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, Mono, ErrorState } from '@/components/shared';
import type { Tone } from '@/components/shared';
import type { Activity } from '@/data/mock';
import { useCRM } from '@/store/crm';
import { Phone, Mail, Footprints, MonitorPlay, Undo2 } from 'lucide-react';
import { useState } from 'react';
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
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 25" title="Activities"
        sub="Every customer interaction logged chronologically — calls, emails, visits, demos and follow-ups."
        action={<NewButton label="Create Activity" onClick={() => setShowModal(true)} />} />
      <Toolbar placeholder="Search subject, account…">
        <FilterChip label="All Types" active /><FilterChip label="Scheduled" /><FilterChip label="Completed" />
      </Toolbar>
      {error.activities ? (
        <ErrorState title="Failed to load activities" message={error.activities} onRetry={fetchActivities} />
      ) : (
        <DataTable
          loading={loading.activities}
          head={['Type', 'Subject', 'Related To', 'Owner', 'Due', 'Status', 'Timeline']}
          rows={activities.map(a => {
            const Icon = icons[a.type] || Phone;
            return [
              <span className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md bg-secondary"><Icon className="size-3.5" /></span>{a.type}</span>,
              <span className="font-medium">{a.subject}</span>,
              a.relatedTo,
              <span className="text-muted-foreground">{a.owner}</span>,
              <Mono className="text-muted-foreground">{a.due}</Mono>,
              <StatusBadge label={a.status} tone={tone(a.status)} />,
              <Mono className="text-muted-foreground">created → assigned → {a.status.toLowerCase()}</Mono>,
            ];
          })}
        />
      )}
      <ActivityModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
