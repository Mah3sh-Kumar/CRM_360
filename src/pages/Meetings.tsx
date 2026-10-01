import { PageHeader, StatusBadge, NewButton, Mono } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { meetings } from '@/data/mock';
import { Video, MapPin, Phone } from 'lucide-react';

const mIcon = { 'In-Person': MapPin, Video, Phone } as const;
const tone = (s: string): Tone => s === 'Completed' ? 'ink' : s === 'Cancelled' ? 'red' : 'green';

const days = ['Thu 01', 'Fri 02', 'Sat 03', 'Sun 04', 'Mon 05', 'Tue 06', 'Wed 07'];

export default function Meetings() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="CRM Operations · Module 27" title="Meetings"
        sub="Scheduled against accounts and opportunities. Week of 01–07 Oct 2026."
        action={<NewButton label="Schedule Meeting" />} />

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {days.map(d => {
          const date = `2026-10-${d.split(' ')[1]}`;
          const dayMeetings = meetings.filter(m => m.date === date);
          return (
            <div key={d} className="min-h-[170px] bg-card p-2.5">
              <div className="kicker mb-2 text-muted-foreground">{d}</div>
              <div className="space-y-1.5">
                {dayMeetings.map(m => (
                  <div key={m.id} className="rounded-md border border-border bg-[#f4f7f2] p-2">
                    <div className="font-mono2 text-[10px] font-semibold text-[#007f24]">{m.time}</div>
                    <div className="mt-0.5 text-[11.5px] font-medium leading-tight">{m.title}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{m.account}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 kicker text-muted-foreground">All Meetings</div>
        {meetings.map(m => {
          const Icon = mIcon[m.mode];
          return (
            <div key={m.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0">
              <span className="flex size-8 items-center justify-center rounded-md bg-secondary"><Icon className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{m.title}</div>
                <div className="text-[11px] text-muted-foreground">{m.account} · {m.organizer}</div>
              </div>
              <Mono className="text-muted-foreground">{m.date.slice(5)} · {m.time}</Mono>
              <StatusBadge label={m.mode} tone="blue" />
              <StatusBadge label={m.status} tone={tone(m.status)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
