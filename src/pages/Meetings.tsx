import { useEffect, useState, useMemo } from 'react';
import { PageHeader, StatusBadge, NewButton, Mono, ErrorState, LoadingState, Toolbar, DataTable } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { useCRM } from '@/store/crm';
import { Video, MapPin, Phone, Users } from 'lucide-react';
import MeetingModal from '@/components/MeetingModal';

const mIcon: Record<string, any> = { 
  'Customer Meeting': MapPin, 
  'Internal Meeting': Users, 
  'Sales Meeting': Phone,
  'Requirement Discussion': Video,
  'Project Discussion': Video,
  'Review Meeting': Users
};

const tone = (s: string): Tone => s === 'Completed' ? 'ink' : s === 'Cancelled' ? 'red' : 'green';

export default function Meetings() {
  const { meetings, employees, fetchMeetings, can, loading, error } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const filteredMeetings = useMemo(() => {
    if (!search.trim()) return meetings;
    const q = search.toLowerCase();
    return meetings.filter(m => m.title?.toLowerCase().includes(q) || m.related_module?.toLowerCase().includes(q));
  }, [meetings, search]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const today = new Date();
  const days = Array.from({length: 7}).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' }),
      date: `${yyyy}-${mm}-${dd}`
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader kicker="CRM Operations · Module 27" title="Meetings"
        action={can('CREATE', 'MEETING') && <NewButton label="Schedule Meeting" onClick={() => { setSelectedId(undefined); setShowModal(true); }} />} />

      {error.meetings ? (
        <ErrorState title="Failed to load meetings" message={error.meetings} onRetry={fetchMeetings} />
      ) : loading.meetings && meetings.length === 0 ? (
        <LoadingState message="Loading meetings..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {days.map(d => {
              const dayMeetings = meetings.filter(m => m.start_datetime && m.start_datetime.split('T')[0] === d.date);
              return (
                <div key={d.date} className="min-h-[170px] bg-card p-2.5">
                  <div className="kicker mb-2 text-muted-foreground">{d.label}</div>
                  <div className="space-y-1.5 max-h-[136px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {dayMeetings.map(m => (
                      <div key={m.id} 
                           onClick={() => { setSelectedId(m.id); setShowModal(true); }}
                           className="rounded-md border border-border bg-muted-bg p-2 cursor-pointer hover:border-primary/30 transition-colors">
                        <div className="font-mono2 text-[10px] font-semibold text-primary">
                          {new Date(m.start_datetime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="mt-0.5 text-[11.5px] font-medium leading-tight">{m.title}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {m.related_module ? `${m.related_module}` : 'No Link'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-3">
            <Toolbar placeholder="Search meetings, modules..." searchValue={search} onSearchChange={setSearch} />
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <DataTable
                loading={loading.meetings}
                columns={[
                  {
                    header: '',
                    accessorKey: 'icon',
                    cell: (m: any) => {
                      const Icon = mIcon[m.meeting_type] || Video;
                      return <span className="flex size-8 items-center justify-center rounded-md bg-secondary"><Icon className="size-4" /></span>;
                    }
                  },
                  {
                    header: 'Title',
                    accessorKey: 'title',
                    sortable: true,
                    sortType: 'text',
                    cell: (m: any) => (
                      <button 
                        onClick={() => { setSelectedId(m.id); setShowModal(true); }} 
                        className="text-[13px] font-medium text-link hover:underline text-left text-primary cursor-pointer outline-none"
                      >
                        {m.title}
                      </button>
                    )
                  },
                  {
                    header: 'Related',
                    accessorKey: 'related_module',
                    sortable: true,
                    sortType: 'text',
                    cell: (m: any) => <span className="text-[11px] text-muted-foreground">{m.related_module ? `${m.related_module} #${m.related_record_id}` : 'General'}</span>
                  },
                  {
                    header: 'Organizer',
                    accessorKey: 'organizer_id',
                    sortable: true,
                    sortType: 'text',
                    cell: (m: any) => <span className="text-[11px] text-muted-foreground">{employees.find(e => Number(e.id) === m.organizer_id)?.name || m.organizer_id}</span>
                  },
                  {
                    header: 'Date & Time',
                    accessorKey: 'start_datetime',
                    sortable: true,
                    sortType: 'date',
                    cell: (m: any) => {
                      const dateStr = m.start_datetime ? m.start_datetime.split('T')[0].slice(5) : '';
                      const timeStr = m.start_datetime ? new Date(m.start_datetime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '';
                      return <Mono className="text-muted-foreground">{dateStr} · {timeStr}</Mono>;
                    }
                  },
                  {
                    header: 'Type',
                    accessorKey: 'meeting_type',
                    sortable: true,
                    sortType: 'text',
                    cell: (m: any) => <StatusBadge label={m.meeting_type} tone="blue" />
                  },
                  {
                    header: 'Status',
                    accessorKey: 'status',
                    sortable: true,
                    sortType: 'text',
                    cell: (m: any) => <StatusBadge label={m.status} tone={tone(m.status)} />
                  }
                ]}
                data={filteredMeetings}
                pagination
                defaultPageSize={10}
                emptyMessage="No meetings matched your criteria."
              />
            </div>
          </div>
        </>
      )}
      <MeetingModal open={showModal} onClose={() => { setShowModal(false); setSelectedId(undefined); }} meetingId={selectedId} />
    </div>
  );
}
