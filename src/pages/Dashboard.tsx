import { PageHeader, StatusBadge, Mono } from '@/components/shared';
import { opportunities, tasks, meetings, fmtINR } from '@/data/mock';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, PieChart, Pie } from 'recharts';

const GREEN = '#007f24', SAGE = '#85c093', INK = '#09352e';
const DESTRUCTIVE = '#b03a26', MUTED_FG = '#71807e', TOOLTIP_BG = '#f0f4ec', TOOLTIP_BORDER = '#dfe4da';
const CHART_FG = '#4d5a52';
const PIPELINE_COLORS = [INK, GREEN, SAGE, '#c8dec9', '#e3efe4'];

const kpis = [
  { label: 'Open Leads', value: '5', delta: '+2 this week', up: true },
  { label: 'Pipeline Value', value: fmtINR(5770000), delta: '+12.4%', up: true },
  { label: 'Win Rate', value: '38%', delta: '+4.1 pts', up: true },
  { label: 'Active Customers', value: '4', delta: '1 new', up: true },
  { label: 'Tasks Overdue', value: '2', delta: '-1 vs yesterday', up: false },
  { label: 'Field Visits Today', value: '4', delta: '93 min avg', up: true },
];

const leadStatus = [
  { s: 'New', n: 2 }, { s: 'Contacted', n: 1 }, { s: 'Qualified', n: 1 },
  { s: 'Proposal', n: 1 }, { s: 'Negotiation', n: 1 }, { s: 'Won', n: 1 }, { s: 'Lost', n: 1 },
];

const pipeline = opportunities.filter(o => o.stage !== 'Lost').map(o => ({ name: o.stage, value: o.expectedRevenue }));

const activityMix = [
  { name: 'Tasks Completed', value: 1, fill: INK },
  { name: 'Visits Completed', value: 4, fill: GREEN },
  { name: 'Meetings Conducted', value: 2, fill: SAGE },
];

export default function Dashboard({ go }: { go: (p: string) => void }) {
  return (
    <div className="space-y-6">
      <PageHeader kicker="Dashboard · 01 Oct 2026" title="Good morning, Rohan"
        sub="Sales, activity and field operations at a glance. KPIs are scoped to your role: Employee · Apex Industries." />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-card p-4">
            <div className="kicker text-muted-foreground">{k.label}</div>
            <div className="font-display mt-2 text-[24px] font-semibold leading-none tracking-tight">{k.value}</div>
            <div className={`mt-2 flex items-center gap-1 font-mono2 text-[10.5px] ${k.up ? 'text-success' : 'text-destructive'}`}>
              {k.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lead status chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="kicker text-muted-foreground">Lead Status</div>
            <button onClick={() => go('leads')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">VIEW LEADS <ArrowRight className="size-3" /></button>
          </div>
          <div className="font-display text-[15px] font-semibold">8 leads across lifecycle</div>
          <div className="mt-3 h-[190px]">
            <ResponsiveContainer>
              <BarChart data={leadStatus} barSize={18}>
                <XAxis dataKey="s" tick={{ fontSize: 9.5, fill: MUTED_FG }} axisLine={false} tickLine={false} interval={0} angle={-28} textAnchor="end" height={48} />
                <YAxis hide domain={[0, 3]} />
                <Tooltip cursor={{ fill: TOOLTIP_BG }} contentStyle={{ fontSize: 11, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 6 }} />
                <Bar dataKey="n" radius={[3, 3, 0, 0]}>
                  {leadStatus.map((d, i) => <Cell key={i} fill={d.s === 'Lost' ? DESTRUCTIVE : d.s === 'Won' ? INK : d.s === 'New' ? SAGE : GREEN} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline funnel */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="kicker mb-1 text-muted-foreground">Opportunity Pipeline</div>
          <div className="font-display text-[15px] font-semibold">{fmtINR(5770000)} open pipeline</div>
          <div className="mt-3 h-[190px]">
            <ResponsiveContainer>
              <FunnelChart>
                <Tooltip contentStyle={{ fontSize: 11, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 6 }} formatter={(v: number) => fmtINR(v)} />
                <Funnel dataKey="value" data={pipeline} isAnimationActive>
                  <LabelList position="right" dataKey="name" stroke="none" style={{ fontSize: 10.5, fill: CHART_FG, fontFamily: 'IBM Plex Mono' }} />
                  {pipeline.map((_, i) => <Cell key={i} fill={PIPELINE_COLORS[i % 5]} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Employee activity */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="kicker mb-1 text-muted-foreground">Employee Activity · This Week</div>
          <div className="font-display text-[15px] font-semibold">Field output summary</div>
          <div className="mt-3 flex items-center gap-4">
            <div className="h-[150px] w-[150px] shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={activityMix} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3} strokeWidth={0} />
                  <Tooltip contentStyle={{ fontSize: 11, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {activityMix.map(a => (
                <div key={a.name} className="flex items-center gap-2 text-[12px]">
                  <span className="size-2 rounded-sm" style={{ background: a.fill }} />
                  <span className="text-muted-foreground">{a.name}</span>
                  <Mono className="ml-auto font-semibold">{a.value}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="kicker text-muted-foreground">Hot Opportunities</div>
            <button onClick={() => go('opportunities')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">PIPELINE <ArrowRight className="size-3" /></button>
          </div>
          {opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).slice(0, 4).map(o => (
            <div key={o.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0">
              <Mono className="text-muted-foreground">{o.code}</Mono>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{o.name}</div>
                <div className="text-[11px] text-muted-foreground">{o.account}</div>
              </div>
              <div className="w-24">
                <div className="mb-1 flex justify-between font-mono2 text-[9.5px] text-muted-foreground"><span>{o.stage}</span><span>{o.probability}%</span></div>
                <div className="h-1 rounded-full bg-secondary"><div className="h-1 rounded-full bg-primary" style={{ width: `${o.probability}%` }} /></div>
              </div>
              <div className="w-16 text-right font-display text-[13px] font-semibold">{fmtINR(o.expectedRevenue)}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="kicker text-muted-foreground">Today · Tasks & Meetings</div>
            <button onClick={() => go('tasks')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">MY TASKS <ArrowRight className="size-3" /></button>
          </div>
          {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map(t => (
            <div key={t.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5">
              <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'amber' : 'gray'} />
              <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{t.title}</div>
              <Mono className="text-muted-foreground">{t.due.slice(5)}</Mono>
            </div>
          ))}
          {meetings.filter(m => m.status === 'Scheduled').slice(0, 2).map(m => (
            <div key={m.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0">
              <StatusBadge label={m.mode} tone="blue" />
              <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.title}</div>
              <Mono className="text-muted-foreground">{m.date.slice(5)} · {m.time}</Mono>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
