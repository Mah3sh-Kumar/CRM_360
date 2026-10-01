import { PageHeader, StatusBadge, Mono } from '@/components/shared';
import { trackPoints } from '@/data/mock';
import { MapPin, Navigation } from 'lucide-react';

export default function Tracking() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Employee Tracking · Live" title="Live Employee Tracking"
        sub="GPS positions streamed via the browser Geolocation API after check-in. Tracking stops automatically on check-out." />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map panel (code-drawn, Google Maps API slots in here) */}
        <div className="relative overflow-hidden rounded-lg border border-border lg:col-span-2" style={{ background: '#eef2ea' }}>
          <svg viewBox="0 0 100 80" className="block h-[440px] w-full" preserveAspectRatio="none">
            {/* street grid */}
            {Array.from({ length: 13 }, (_, i) => <line key={'v' + i} x1={i * 8.33} y1="0" x2={i * 8.33} y2="80" stroke="#dde5d8" strokeWidth="0.25" />)}
            {Array.from({ length: 11 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 8} x2="100" y2={i * 8} stroke="#dde5d8" strokeWidth="0.25" />)}
            {/* arterial roads */}
            <path d="M0,30 C25,26 55,38 100,30" stroke="#c9d6c2" strokeWidth="1.6" fill="none" />
            <path d="M40,0 C44,25 36,55 46,80" stroke="#c9d6c2" strokeWidth="1.6" fill="none" />
            <path d="M0,62 C30,58 70,70 100,60" stroke="#c9d6c2" strokeWidth="1.2" fill="none" />
            {/* route trail */}
            <path d="M62,34 C58,42 50,50 48,72" stroke="#007f24" strokeWidth="0.7" strokeDasharray="1.6 1.2" fill="none" opacity="0.7" />
          </svg>
          {trackPoints.filter(t => t.status === 'Checked-In').map(t => (
            <div key={t.employee} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.x}%`, top: `${t.y}%` }}>
              <span className="absolute -inset-3 animate-ping rounded-full bg-[#007f24]/15" />
              <span className="relative flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#007f24] shadow">
                <Navigation className="size-2.5 text-white" />
              </span>
              <div className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-white px-2 py-1 font-mono2 text-[9.5px] font-medium shadow-sm">
                {t.employee.split(' ')[0]} · {t.lastArea}
              </div>
            </div>
          ))}
          <div className="absolute left-3 top-3 rounded-md border border-border bg-white/90 px-2.5 py-1.5 backdrop-blur">
            <div className="kicker text-muted-foreground">Live Feed</div>
            <div className="font-mono2 text-[10.5px] font-medium text-[#007f24]">3 EMPLOYEES TRACKED · 15s REFRESH</div>
          </div>
          <div className="absolute bottom-3 right-3 rounded-md border border-border bg-white/90 px-2.5 py-1.5 font-mono2 text-[9.5px] text-muted-foreground backdrop-blur">
            Google Maps API renders here in production
          </div>
        </div>

        {/* Side list */}
        <div className="space-y-2.5">
          {trackPoints.map(t => (
            <div key={t.employee} className="rounded-lg border border-border bg-card p-3.5">
              <div className="flex items-center justify-between">
                <div className="text-[13.5px] font-semibold">{t.employee}</div>
                <StatusBadge label={t.status} tone={t.status === 'Checked-In' ? 'green' : t.status === 'On Leave' ? 'amber' : 'gray'} />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border/60 pt-2.5">
                {[['Since', t.since], ['Visits', String(t.visitsToday)], ['Km Today', t.kmToday ? t.kmToday.toFixed(1) : '—']].map(([k, v]) => (
                  <div key={k}>
                    <div className="kicker text-muted-foreground">{k}</div>
                    <Mono className="mt-0.5 font-semibold">{v}</Mono>
                  </div>
                ))}
              </div>
              {t.status === 'Checked-In' && (
                <div className="mt-2.5 flex items-center gap-1.5 font-mono2 text-[10px] text-muted-foreground">
                  <MapPin className="size-3 text-[#007f24]" /> Last fix: {t.lastArea} · 15s ago
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
