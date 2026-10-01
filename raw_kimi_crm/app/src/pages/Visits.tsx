import { PageHeader, DataTable, StatusBadge, Toolbar, NewButton, Mono } from '@/components/shared';
import { visits } from '@/data/mock';

export default function Visits() {
  const totalKm = visits.reduce((s, v) => s + v.distanceKm, 0);
  const totalMin = visits.reduce((s, v) => s + v.durationMin, 0);
  return (
    <div className="space-y-5">
      <PageHeader kicker="Employee Tracking · Visit Log" title="Visit Tracking"
        sub="Each visit is geo-stamped at check-in and check-out. Today's totals feed the dashboard KPIs."
        action={<NewButton label="Record Visit" />} />

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {[[`4`, 'Visits Today'], [`${totalKm.toFixed(1)} km`, 'Distance Covered'], [`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`, 'Time With Customers']].map(([v, k]) => (
          <div key={k} className="bg-card p-4">
            <div className="kicker text-muted-foreground">{k}</div>
            <div className="font-display mt-1.5 text-[24px] font-semibold leading-none">{v}</div>
          </div>
        ))}
      </div>

      <Toolbar placeholder="Search employee or customer…" />
      <DataTable
        head={['Employee', 'Customer', 'Check-In', 'Check-Out', 'Duration', 'Distance', 'Purpose', 'Outcome', 'Geo']}
        rows={visits.map(v => [
          <span className="font-medium">{v.employee}</span>,
          v.customer,
          <Mono>{v.checkIn}</Mono>,
          <Mono>{v.checkOut}</Mono>,
          <Mono>{v.durationMin} min</Mono>,
          <Mono>{v.distanceKm} km</Mono>,
          <span className="text-muted-foreground">{v.purpose}</span>,
          v.outcome,
          <StatusBadge label="Verified" tone="green" />,
        ])}
      />
    </div>
  );
}
