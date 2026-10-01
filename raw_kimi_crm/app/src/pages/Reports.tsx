import { PageHeader, StatusBadge, Mono } from '@/components/shared';
import { Download } from 'lucide-react';

const reports = [
  { name: 'Lead Conversion Report', desc: 'Lead → customer conversion by source, owner and period.', tag: 'Sales', freq: 'Weekly' },
  { name: 'Sales Pipeline Report', desc: 'Stage-wise opportunity value with probability-weighted forecast.', tag: 'Sales', freq: 'Daily' },
  { name: 'Employee Activity Report', desc: 'Tasks, meetings and follow-ups completed per employee.', tag: 'Productivity', freq: 'Weekly' },
  { name: 'Visit Summary Report', desc: 'Geo-verified field visits, duration and distance per employee.', tag: 'Field Ops', freq: 'Daily' },
  { name: 'Customer Engagement Report', desc: 'Interaction recency and touchpoint counts per account.', tag: 'Sales', freq: 'Monthly' },
  { name: 'Task Compliance Report', desc: 'On-time completion vs overdue tasks by assignee and priority.', tag: 'Productivity', freq: 'Weekly' },
];

export default function Reports() {
  return (
    <div className="space-y-5">
      <PageHeader kicker="Insights · Module 15" title="Reports"
        sub="Consolidated operational visibility. Every report respects role-based data visibility and company isolation." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(r => (
          <div key={r.name} className="flex flex-col rounded-lg border border-border bg-card p-4 hover:border-[#85c093] transition-colors">
            <div className="flex items-center justify-between">
              <StatusBadge label={r.tag} tone="sage" />
              <Mono className="text-muted-foreground">{r.freq}</Mono>
            </div>
            <div className="font-display mt-3 text-[15px] font-semibold">{r.name}</div>
            <p className="mt-1 flex-1 text-[12px] leading-relaxed text-muted-foreground">{r.desc}</p>
            <button className="mt-3 inline-flex h-8 w-fit items-center gap-1.5 rounded-md border border-input px-3 text-[12px] font-medium hover:border-[#007f24] hover:text-[#007f24] transition-colors">
              <Download className="size-3.5" /> Export Excel / CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
