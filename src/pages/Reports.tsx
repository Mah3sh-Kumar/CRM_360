// src/pages/Reports.tsx
import { useState } from 'react';
import { PageHeader, StatusBadge, Mono, DataTable } from '@/components/shared';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  leads, opportunities, customers, accounts, employees, visits, trackPoints,
  tasks, meetings, activities, leadSources, fmtINR,
} from '@/data/mock';

type Cat = 'Sales' | 'Customer' | 'Employee' | 'Geo';
const CATS: Cat[] = ['Sales', 'Customer', 'Employee', 'Geo'];

const REPORTS: Record<Cat, { name: string; desc: string; freq: string }[]> = {
  Sales: [
    { name: 'Lead Conversion Report', desc: 'Conversion rate by source.', freq: 'Weekly' },
    { name: 'Sales Pipeline Report', desc: 'Stage-wise opportunity value with weighted forecast.', freq: 'Daily' },
    { name: 'Revenue Forecast', desc: 'Probability-weighted pipeline by owner.', freq: 'Weekly' },
    { name: 'Won / Lost Opportunities', desc: 'Closed deals with owner and value.', freq: 'Monthly' },
    { name: 'Opportunity Aging', desc: 'Days remaining to expected close.', freq: 'Weekly' },
    { name: 'Owner Performance', desc: 'Leads, wins and pipeline per owner.', freq: 'Monthly' },
  ],
  Customer: [
    { name: 'Customer Directory', desc: 'All customers with owner and status.', freq: 'Monthly' },
    { name: 'Customer Engagement', desc: 'Touchpoints and recency per customer.', freq: 'Weekly' },
    { name: 'Account Revenue', desc: 'Lifetime revenue by account.', freq: 'Monthly' },
    { name: 'Industry Analysis', desc: 'Customer distribution by industry.', freq: 'Quarterly' },
  ],
  Employee: [
    { name: 'Employee Activity Report', desc: 'Tasks, meetings and activities per employee.', freq: 'Weekly' },
    { name: 'Employee Task Report', desc: 'Task load and completion by assignee.', freq: 'Weekly' },
    { name: 'Employee Meeting Report', desc: 'Meetings organized per employee.', freq: 'Weekly' },
    { name: 'Attendance & Working Hours', desc: 'Check-in status and field presence.', freq: 'Daily' },
  ],
  Geo: [
    { name: 'Check-In Report', desc: 'Who is checked in, where and since when.', freq: 'Daily' },
    { name: 'Live Tracking Summary', desc: 'Current status of every tracked employee.', freq: 'Live' },
    { name: 'Distance Travelled', desc: 'Kilometres covered today per employee.', freq: 'Daily' },
    { name: 'Visit Report', desc: 'Geo-verified visits, duration and outcome.', freq: 'Daily' },
  ],
};

function runReport(name: string): { head: string[]; rows: React.ReactNode[][] } | null {
  switch (name) {
    case 'Lead Conversion Report': return {
      head: ['Source', 'Leads', 'Won', 'Lost', 'Conversion %'],
      rows: leadSources.map(s => {
        const ls = leads.filter(l => l.source === s);
        const won = ls.filter(l => l.status === 'Won').length;
        return [s, <Mono>{ls.length}</Mono>, <Mono>{won}</Mono>, <Mono>{ls.filter(l => l.status === 'Lost').length}</Mono>,
          <span className="font-display font-semibold">{ls.length ? Math.round(won / ls.length * 100) : 0}%</span>];
      }),
    };
    case 'Sales Pipeline Report': return {
      head: ['Stage', 'Deals', 'Pipeline Value', 'Weighted'],
      rows: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(st => {
        const os = opportunities.filter(o => o.stage === st);
        const val = os.reduce((a, o) => a + o.expectedRevenue, 0);
        return [st, <Mono>{os.length}</Mono>, <span className="font-display font-semibold">{fmtINR(val)}</span>,
          <span className="font-display font-semibold">{fmtINR(os.reduce((a, o) => a + o.expectedRevenue * o.probability / 100, 0))}</span>];
      }),
    };
    case 'Revenue Forecast': return {
      head: ['Owner', 'Open Deals', 'Pipeline', 'Weighted Forecast'],
      rows: Array.from(new Set(opportunities.map(o => o.owner))).map(ow => {
        const os = opportunities.filter(o => o.owner === ow && !['Won', 'Lost'].includes(o.stage));
        return [ow, <Mono>{os.length}</Mono>, <span className="font-display font-semibold">{fmtINR(os.reduce((a, o) => a + o.expectedRevenue, 0))}</span>,
          <span className="font-display font-semibold">{fmtINR(os.reduce((a, o) => a + o.expectedRevenue * o.probability / 100, 0))}</span>];
      }),
    };
    case 'Won / Lost Opportunities': return {
      head: ['Code', 'Opportunity', 'Account', 'Owner', 'Result', 'Value'],
      rows: opportunities.filter(o => o.stage === 'Won' || o.stage === 'Lost').map(o => [
        <Mono className="text-muted-foreground">{o.code}</Mono>, o.name, o.account, o.owner,
        <StatusBadge label={o.stage} tone={o.stage === 'Won' ? 'ink' : 'red'} />,
        <span className="font-display font-semibold">{fmtINR(o.expectedRevenue)}</span>]),
    };
    case 'Opportunity Aging': return {
      head: ['Code', 'Opportunity', 'Stage', 'Close Date', 'Days Left'],
      rows: opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).map(o => {
        const d = Math.round((new Date(o.closeDate).getTime() - Date.now()) / 86400000);
        return [<Mono className="text-muted-foreground">{o.code}</Mono>, o.name, o.stage, <Mono className="text-muted-foreground">{o.closeDate}</Mono>,
          <StatusBadge label={`${d} days`} tone={d < 14 ? 'red' : d < 45 ? 'amber' : 'green'} />];
      }),
    };
    case 'Owner Performance': return {
      head: ['Owner', 'Leads', 'Won Leads', 'Open Pipeline', 'Closed Won'],
      rows: Array.from(new Set(leads.map(l => l.owner))).map(ow => {
        const ls = leads.filter(l => l.owner === ow);
        const os = opportunities.filter(o => o.owner === ow);
        return [ow, <Mono>{ls.length}</Mono>, <Mono>{ls.filter(l => l.status === 'Won').length}</Mono>,
          <span className="font-display font-semibold">{fmtINR(os.filter(o => !['Won', 'Lost'].includes(o.stage)).reduce((a, o) => a + o.expectedRevenue, 0))}</span>,
          <span className="font-display font-semibold">{fmtINR(os.filter(o => o.stage === 'Won').reduce((a, o) => a + o.expectedRevenue, 0))}</span>];
      }),
    };
    case 'Customer Directory': return {
      head: ['Code', 'Customer', 'Industry', 'City', 'Owner', 'Status', 'Since'],
      rows: customers.map(c => [<Mono className="text-muted-foreground">{c.code}</Mono>, <span className="font-medium">{c.name}</span>,
        c.industry, c.city, c.owner, <StatusBadge label={c.status} tone={c.status === 'Active' ? 'green' : c.status === 'Prospect' ? 'blue' : 'gray'} />,
        <Mono className="text-muted-foreground">{c.since}</Mono>]),
    };
    case 'Customer Engagement': return {
      head: ['Customer', 'Activities', 'Meetings', 'Tasks', 'Last Touch'],
      rows: customers.map(c => {
        const a = activities.filter(x => x.relatedTo === c.name).length;
        const m = meetings.filter(x => x.account === c.name).length;
        const t = tasks.filter(x => x.related === c.name).length;
        const last = [...activities.filter(x => x.relatedTo === c.name).map(x => x.due), ...meetings.filter(x => x.account === c.name).map(x => x.date)].sort().pop() ?? '—';
        return [<span className="font-medium">{c.name}</span>, <Mono>{a}</Mono>, <Mono>{m}</Mono>, <Mono>{t}</Mono>, <Mono className="text-muted-foreground">{String(last).slice(0, 10)}</Mono>];
      }),
    };
    case 'Account Revenue': return {
      head: ['Account', 'Industry', 'Owner', 'Open Opps', 'Lifetime Revenue'],
      rows: [...accounts].sort((a, b) => b.revenue - a.revenue).map(a => [<span className="font-medium">{a.name}</span>, a.industry, a.owner,
        <Mono>{a.openOpps}</Mono>, <span className="font-display font-semibold">{a.revenue ? fmtINR(a.revenue) : '—'}</span>]),
    };
    case 'Industry Analysis': return {
      head: ['Industry', 'Customers', 'Total Revenue'],
      rows: Array.from(new Set(customers.map(c => c.industry))).map(ind => {
        const cs = customers.filter(c => c.industry === ind);
        return [ind, <Mono>{cs.length}</Mono>, <span className="font-display font-semibold">{fmtINR(cs.reduce((a, c) => a + c.revenue, 0))}</span>];
      }),
    };
    case 'Employee Activity Report': return {
      head: ['Employee', 'Designation', 'Tasks', 'Meetings', 'Activities'],
      rows: employees.filter(e => e.status !== 'Inactive').map(e => [<span className="font-medium">{e.name}</span>, e.designation,
        <Mono>{tasks.filter(t => t.assignee === e.name).length}</Mono>, <Mono>{meetings.filter(m => m.organizer === e.name).length}</Mono>,
        <Mono>{activities.filter(a => a.owner === e.name).length}</Mono>]),
    };
    case 'Employee Task Report': return {
      head: ['Task', 'Assignee', 'Priority', 'Status', 'Due'],
      rows: tasks.map(t => [t.title, t.assignee, <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : 'amber'} />,
        <StatusBadge label={t.status} tone={t.status === 'Completed' ? 'green' : 'sage'} />, <Mono className="text-muted-foreground">{t.due}</Mono>]),
    };
    case 'Employee Meeting Report': return {
      head: ['Meeting', 'Account', 'Date', 'Mode', 'Organizer', 'Status'],
      rows: meetings.map(m => [<span className="font-medium">{m.title}</span>, m.account, <Mono className="text-muted-foreground">{m.date}</Mono>, m.mode,
        m.organizer, <StatusBadge label={m.status} tone={m.status === 'Completed' ? 'green' : 'blue'} />]),
    };
    case 'Attendance & Working Hours': return {
      head: ['Employee', 'Status', 'Checked In Since', 'Visits Today', 'Km Today'],
      rows: trackPoints.map(t => [t.employee, <StatusBadge label={t.status} tone={t.status === 'Checked-In' ? 'green' : t.status === 'On Leave' ? 'amber' : 'gray'} />,
        <Mono className="text-muted-foreground">{t.since}</Mono>, <Mono>{t.visitsToday}</Mono>, <Mono>{t.kmToday} km</Mono>]),
    };
    case 'Check-In Report': return {
      head: ['Employee', 'Status', 'Since', 'Last Area'],
      rows: trackPoints.map(t => [t.employee, <StatusBadge label={t.status} tone={t.status === 'Checked-In' ? 'green' : t.status === 'On Leave' ? 'amber' : 'gray'} />,
        <Mono className="text-muted-foreground">{t.since}</Mono>, <span className="text-muted-foreground">{t.lastArea}</span>]),
    };
    case 'Live Tracking Summary': return {
      head: ['Employee', 'Status', 'Last Area', 'Visits', 'Km Today', 'Map Position'],
      rows: trackPoints.map(t => [t.employee, <StatusBadge label={t.status} tone={t.status === 'Checked-In' ? 'green' : t.status === 'On Leave' ? 'amber' : 'gray'} />,
        <span className="text-muted-foreground">{t.lastArea}</span>, <Mono>{t.visitsToday}</Mono>, <Mono>{t.kmToday} km</Mono>,
        <Mono className="text-muted-foreground">{t.x}%, {t.y}%</Mono>]),
    };
    case 'Distance Travelled': return {
      head: ['Employee', 'Km Today', 'Visits Today', 'Avg km / Visit'],
      rows: trackPoints.filter(t => t.kmToday > 0).map(t => [t.employee, <Mono>{t.kmToday} km</Mono>, <Mono>{t.visitsToday}</Mono>,
        <Mono>{(t.kmToday / Math.max(1, t.visitsToday)).toFixed(1)} km</Mono>]),
    };
    case 'Visit Report': return {
      head: ['Employee', 'Customer', 'Check-In', 'Check-Out', 'Duration', 'Purpose', 'Outcome', 'Distance'],
      rows: visits.map(v => [v.employee, v.customer, <Mono className="text-muted-foreground">{v.checkIn}</Mono>, <Mono className="text-muted-foreground">{v.checkOut}</Mono>,
        <Mono>{v.durationMin} min</Mono>, v.purpose, <span className="text-muted-foreground">{v.outcome}</span>, <Mono>{v.distanceKm} km</Mono>]),
    };
    default: return null;
  }
}

export default function Reports() {
  const [cat, setCat] = useState<Cat>('Sales');
  const [active, setActive] = useState<string | null>(null);
  const table = active ? runReport(active) : null;

  return (
    <div className="space-y-5">
      <PageHeader kicker="Insights · Module 15" title="Reports"
        sub="Consolidated operational visibility across Sales, Customer, Employee and Geo analytics. Every report respects role-based data visibility and company isolation." />
      <div className="flex gap-1.5">
        {CATS.map(c => (
          <button key={c} onClick={() => { setCat(c); setActive(null); }}
            className={cn('h-8 rounded-md border px-3 text-[12.5px] font-medium transition-colors',
              cat === c ? 'border-[#09352e] bg-[#09352e] text-white' : 'border-input bg-card text-muted-foreground hover:text-foreground')}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS[cat].map(r => (
          <div key={r.name} onClick={() => setActive(r.name)}
            className={cn('flex cursor-pointer flex-col rounded-lg border bg-card p-4 transition-colors',
              active === r.name ? 'border-[#007f24]' : 'border-border hover:border-[#85c093]')}>
            <div className="flex items-center justify-between">
              <StatusBadge label={cat} tone="sage" />
              <Mono className="text-muted-foreground">{r.freq}</Mono>
            </div>
            <div className="font-display mt-3 text-[15px] font-semibold">{r.name}</div>
            <p className="mt-1 flex-1 text-[12px] leading-relaxed text-muted-foreground">{r.desc}</p>
            <button className="mt-3 inline-flex h-8 w-fit items-center gap-1.5 rounded-md border border-input px-3 text-[12px] font-medium transition-colors hover:border-[#007f24] hover:text-[#007f24]">
              <Download className="size-3.5" /> Export Excel / CSV
            </button>
          </div>
        ))}
      </div>
      {table && (
        <div className="space-y-2.5">
          <div className="kicker text-muted-foreground">Preview · {active}</div>
          <DataTable head={table.head} rows={table.rows} />
        </div>
      )}
    </div>
  );
}
