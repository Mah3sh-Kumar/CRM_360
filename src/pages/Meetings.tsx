import { useEffect, useState } from 'react';
import { PageHeader, StatusBadge, NewButton, Mono, ErrorState, LoadingState, EmptyState } from '@/components/shared';
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

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const today = new Date();
  const days = Array.from({length: 7}).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' }),
      date: d.toISOString().split('T')[0]
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 27" title="Meetings"
        sub="Scheduled against accounts and opportunities."
        action={can('CREATE', 'MEETING') && <NewButton label="Schedule Meeting" onClick={() => setShowModal(true)} />} />

      {error.meetings ? (
        <ErrorState title="Failed to load meetings" message={error.meetings} onRetry={fetchMeetings} />
      ) : loading.meetings && meetings.length === 0 ? (
        <LoadingState message="Loading meetings..." />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
            {days.map(d => {
              const dayMeetings = meetings.filter(m => m.start_datetime && m.start_datetime.split('T')[0] === d.date);
              return (
                <div key={d.date} className="min-h-[170px] bg-card p-2.5">
                  <div className="kicker mb-2 text-muted-foreground">{d.label}</div>
                  <div className="space-y-1.5">
                    {dayMeetings.map(m => (
                      <div key={m.id} className="rounded-md border border-border bg-muted-bg p-2">
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

          <div className="rounded-lg border border-border bg-card mt-5">
            <div className="border-b border-border px-4 py-3 kicker text-muted-foreground">All Meetings</div>
            {meetings.length === 0 && <div className="py-8"><EmptyState title="No Meetings" description="No meetings scheduled yet." /></div>}
            {meetings.map(m => {
              const Icon = mIcon[m.meeting_type] || Video;
              const organizerName = employees.find(e => Number(e.id) === m.organizer_id)?.name || m.organizer_id;
              const dateStr = m.start_datetime ? m.start_datetime.split('T')[0].slice(5) : '';
              const timeStr = m.start_datetime ? new Date(m.start_datetime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : '';
              return (
                <div key={m.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0">
                  <span className="flex size-8 items-center justify-center rounded-md bg-secondary"><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.related_module ? `${m.related_module} #${m.related_record_id}` : 'General'} · Org: {organizerName}
                    </div>
                  </div>
                  <Mono className="text-muted-foreground">{dateStr} · {timeStr}</Mono>
                  <StatusBadge label={m.meeting_type} tone="blue" />
                  <StatusBadge label={m.status} tone={tone(m.status)} />
                </div>
              );
            })}
          </div>
        </>
      )}
      <MeetingModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
