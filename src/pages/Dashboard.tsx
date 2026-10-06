import { PageHeader, StatusBadge, Mono } from '@/components/shared';
import { useCRM } from '@/store/crm';
import { fmtINR } from '@/data/mock';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, PieChart, Pie } from 'recharts';
import { useMemo } from 'react';

const CHART_1 = 'hsl(var(--chart-1))', CHART_2 = 'hsl(var(--chart-2))', CHART_3 = 'hsl(var(--chart-3))';
const CHART_4 = 'hsl(var(--chart-4))', CHART_5 = 'hsl(var(--chart-5))';
const DESTRUCTIVE = 'hsl(var(--destructive))', MUTED_FG = 'hsl(var(--muted-foreground))', TOOLTIP_BG = 'hsl(var(--popover))', TOOLTIP_BORDER = 'hsl(var(--border))';
const CHART_FG = 'hsl(var(--foreground))';
const PIPELINE_COLORS = [CHART_1, CHART_2, CHART_3, CHART_4, CHART_5];

export default function Dashboard({ go }: { go: (p: string) => void }) {
  const { leads, opportunities, tasks, meetings, customers, user } = useCRM();

  const prefix = user?.role === 'Super Admin' ? 'Global' :
                 user?.role === 'Company Admin' ? 'Company' :
                 user?.role === 'Manager' ? 'Team' : 'My';

  const kpis = useMemo(() => {
    const openLeads = leads.filter(l => !['Won', 'Lost'].includes(l.status)).length;
    const pipelineValue = opportunities.filter(o => o.stage !== 'Lost').reduce((s, o) => s + Number(o.expectedRevenue), 0);
    const wonCount = opportunities.filter(o => o.stage === 'Won').length;
    const totalCount = opportunities.length;
    const winRate = totalCount ? Math.round((wonCount / totalCount) * 100) : 0;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.due) < new Date()).length;
    const fieldVisits = 4; // keeping this static as visits aren't fully fetched in mock if it fails

    return [
      { label: `${prefix} Open Leads`, value: openLeads.toString(), delta: '+2 this week', up: true },
      { label: `${prefix} Pipeline`, value: fmtINR(pipelineValue), delta: '+12.4%', up: true },
      { label: 'Win Rate', value: `${winRate}%`, delta: '+4.1 pts', up: true },
      { label: `${prefix} Customers`, value: activeCustomers.toString(), delta: '1 new', up: true },
      { label: 'Tasks Overdue', value: overdueTasks.toString(), delta: '-1 vs yesterday', up: false },
      { label: 'Field Visits Today', value: fieldVisits.toString(), delta: '93 min avg', up: true },
    ];
  }, [leads, opportunities, customers, tasks, prefix]);

  const leadStatus = useMemo(() => {
    const counts: Record<string, number> = { New: 0, Contacted: 0, Qualified: 0, Proposal: 0, Negotiation: 0, Won: 0, Lost: 0 };
    leads.forEach(l => { if (counts[l.status] !== undefined) counts[l.status]++; });
    return Object.keys(counts).map(s => ({ s, n: counts[s] }));
  }, [leads]);

  const pipeline = useMemo(() => {
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won'];
    const data = stages.map(s => ({ name: s, value: 0 }));
    opportunities.forEach(o => {
      const idx = stages.indexOf(o.stage);
      if (idx !== -1) data[idx].value += Number(o.expectedRevenue);
    });
    return data;
  }, [opportunities]);

  const activityMix = [
    { name: 'Tasks Completed', value: tasks.filter(t => t.status === 'Completed').length || 1, fill: CHART_1 },
    { name: 'Visits Completed', value: 4, fill: CHART_2 },
    { name: 'Meetings Conducted', value: 2, fill: CHART_3 },
  ];

  const totalPipeline = pipeline.reduce((s, o) => s + o.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader kicker={`Dashboard · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')}`} title={`Good morning, ${user?.name?.split(' ')[0] || 'User'}`}
        sub={`Sales, activity and field operations at a glance. KPIs are scoped to your role: ${user?.role} · ${user?.company}.`} />

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
            <div className="kicker text-muted-foreground">{prefix} Lead Status</div>
            <button onClick={() => go('leads')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">VIEW LEADS <ArrowRight className="size-3" /></button>
          </div>
          <div className="font-display text-[15px] font-semibold">{leads.length} leads across lifecycle</div>
          <div className="mt-3 h-[190px]">
            <ResponsiveContainer>
              <BarChart data={leadStatus} barSize={18}>
                <XAxis dataKey="s" tick={{ fontSize: 9.5, fill: MUTED_FG }} axisLine={false} tickLine={false} interval={0} angle={-28} textAnchor="end" height={48} />
                <YAxis hide domain={[0, 'dataMax + 1']} />
                <Tooltip cursor={{ fill: TOOLTIP_BG }} contentStyle={{ fontSize: 11, border: `1px solid ${TOOLTIP_BORDER}`, borderRadius: 6 }} />
                <Bar dataKey="n" radius={[3, 3, 0, 0]}>
                  {leadStatus.map((d, i) => <Cell key={i} fill={d.s === 'Lost' ? DESTRUCTIVE : d.s === 'Won' ? CHART_1 : d.s === 'New' ? CHART_3 : CHART_2} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline funnel */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="kicker mb-1 text-muted-foreground">{prefix} Pipeline</div>
          <div className="font-display text-[15px] font-semibold">{fmtINR(totalPipeline)} open pipeline</div>
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
          <div className="kicker mb-1 text-muted-foreground">{prefix} Activity · This Week</div>
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
            <div className="kicker text-muted-foreground">{prefix} Hot Opportunities</div>
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
              <div className="w-16 text-right font-display text-[13px] font-semibold">{fmtINR(Number(o.expectedRevenue))}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="kicker text-muted-foreground">{prefix} Tasks & Meetings</div>
            <button onClick={() => go('tasks')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">MY TASKS <ArrowRight className="size-3" /></button>
          </div>
          {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map(t => (
            <div key={t.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5">
              <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'amber' : 'gray'} />
              <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{t.title}</div>
              <Mono className="text-muted-foreground">{t.due?.slice(5) || 'Today'}</Mono>
            </div>
          ))}
          {meetings.filter(m => m.status === 'Scheduled').slice(0, 2).map(m => (
            <div key={m.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0">
              <StatusBadge label={m.mode || 'Online'} tone="blue" />
              <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.title}</div>
              <Mono className="text-muted-foreground">{(m.date || m.scheduled_at || 'Today').slice(5, 10)} · {m.time || (m.scheduled_at || '10:00:00').slice(11, 16)}</Mono>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
