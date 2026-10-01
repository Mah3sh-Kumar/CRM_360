// src/components/NotificationsPanel.tsx
import { CheckSquare, CalendarDays, AlertTriangle, MapPin, Funnel, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCRM } from '@/store/crm';
import type { NotifKind } from '@/store/crm';

const ICONS: Record<NotifKind, LucideIcon> = {
  task: CheckSquare, meeting: CalendarDays, alert: AlertTriangle,
  gps: MapPin, lead: Funnel, audit: ShieldCheck,
};

export default function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, markAllRead } = useCRM();
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="fixed right-4 top-16 z-40 w-[360px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-display text-[14px] font-semibold">Notifications</div>
          <button onClick={markAllRead} className="font-mono2 text-[10.5px] font-medium text-[#007f24] hover:underline">Mark all read</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 && <div className="p-6 text-center font-mono2 text-[11px] text-muted-foreground">No notifications.</div>}
          {notifications.map(n => {
            const Icon = ICONS[n.kind];
            return (
              <div key={n.id} className={cn('flex gap-3 border-b border-border/60 px-4 py-3 last:border-0', !n.read && 'bg-[#f2f7f0]')}>
                <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', n.read ? 'bg-secondary text-muted-foreground' : 'bg-[#e3f0e7] text-[#0f6b2e]')}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold">{n.title}</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">{n.body}</div>
                  <div className="kicker mt-1 text-muted-foreground">{n.time}</div>
                </div>
                {!n.read && <span className="ml-auto mt-1.5 size-1.5 shrink-0 rounded-full bg-[#b03a26]" />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
