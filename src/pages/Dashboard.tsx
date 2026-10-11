import { PageHeader, StatusBadge, Mono, SkeletonKPI, SkeletonList, EmptyState, ChartCard, CATEGORICAL_COLORS } from '@/components/shared';
import { useCRM } from '@/store/crm';
import { fmtINR } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, PieChart, Pie, Label } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export default function Dashboard({ go }: { go: (p: string) => void }) {
  const { leads, opportunities, tasks, meetings, user } = useCRM();
  const [isLoading, setIsLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);

  const [dateRange, setDateRange] = useState('This Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateParams = (range: string, cStart: string, cEnd: string) => {
    const today = new Date();
    const getStr = (d: Date) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    };
    let start = getStr(today);
    let end = getStr(today);
    
    if (range === 'Today') {
      start = end;
    } else if (range === 'This Week') {
      const d = new Date(today);
      d.setDate(d.getDate() - d.getDay());
      start = getStr(d);
    } else if (range === 'This Month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = getStr(d);
    } else if (range === 'Last 30 Days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      start = getStr(d);
    } else if (range === 'Last 90 Days') {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      start = getStr(d);
    } else if (range === 'This Year') {
      const d = new Date(today.getFullYear(), 0, 1);
      start = getStr(d);
    } else if (range === 'Custom Range') {
      return { start_date: cStart, end_date: cEnd };
    }
    return { start_date: start, end_date: end };
  };

  const fetchDash = async () => {
    setIsLoading(true);
    try {
      let url = '/dashboard/summary';
      const { start_date, end_date } = getDateParams(dateRange, customStart, customEnd);
      if (start_date && end_date) {
        url += `?start_date=${start_date}&end_date=${end_date}`;
      }
      const data = await apiFetch(url);
      setDashData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange === 'Custom Range' && (!customStart || !customEnd)) return;
    fetchDash();
  }, [dateRange, customStart, customEnd]);

  const prefix = user?.role === 'Super Admin' ? 'Global' :
                 user?.role === 'Company Admin' ? 'Company' :
                 user?.role === 'Manager' ? 'Team' : 'My';

  const kpis = useMemo(() => {
    if (!dashData) return [];
    const d = dashData.kpis;
    return [
      { label: `${prefix} Open Leads`, value: d.openLeads.toString(), delta: '+2 this week', up: true },
      { label: `${prefix} Pipeline`, value: fmtINR(d.pipelineValue), delta: '+12.4%', up: true },
      { label: 'Win Rate', value: `${d.winRate}%`, delta: '+4.1 pts', up: true },
      { label: `${prefix} Customers`, value: d.activeCustomers.toString(), delta: '1 new', up: true },
      { label: 'Tasks Overdue', value: d.overdueTasks.toString(), delta: '-1 vs yesterday', up: false },
      { label: 'Field Visits Today', value: d.visitsToday.toString(), delta: '93 min avg', up: true },
    ];
  }, [dashData, prefix]);

  const leadStatus = dashData?.leadStatus || [];
  const pipeline = dashData?.pipeline || [];
  const activityMix = dashData?.activityMix || [];

  const totalPipeline = pipeline.reduce((s: number, o: any) => s + o.value, 0);

  const stagger = (i: number) => ({ animationDelay: `${i * 40}ms` });
  const animClass = "animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none duration-300 fill-mode-both";

  return (
    <div className="space-y-4">
      <PageHeader 
        kicker={`Dashboard · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')}`} 
        title={`Good morning, ${user?.name?.split(' ')[0] || 'User'}`}
        action={
          <div className="flex items-center gap-2">
            {dateRange === 'Custom Range' && (
              <div className="flex items-center gap-2 mr-2">
                <input type="date" className="h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                <span className="text-muted-foreground">-</span>
                <input type="date" className="h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
              </div>
            )}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px] h-9 bg-card">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
                <SelectItem value="Custom Range">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => isLoading ? (
           <SkeletonKPI key={k.label} className="rounded-xl border border-border h-[116px]" />
        ) : (
          <div 
            key={k.label} 
            className={`group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/40 ${animClass}`} 
            style={stagger(i)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            <div className="relative z-10">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{k.label}</div>
              <div className="font-display mt-3 text-3xl font-bold leading-none tracking-tight text-foreground transition-colors group-hover:text-primary">{k.value}</div>
              <div className={`mt-3 flex items-center gap-1.5 text-[12px] font-semibold ${k.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                <div className={`flex size-4.5 items-center justify-center rounded-full ${k.up ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  {k.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                </div>
                {k.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lead status chart */}
        <div className={animClass} style={stagger(2)}>
          <ChartCard 
            title={`${prefix} Lead Status`}
            description={`${leads.length} leads across lifecycle`}
            isLoading={isLoading}
            onRefresh={fetchDash}
            empty={!leadStatus || leadStatus.length === 0}
          >
            <ResponsiveContainer>
              <BarChart data={leadStatus} margin={{ top: 25, right: 10, left: -20, bottom: 35 }} barSize={24}>
                <XAxis dataKey="s" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} 
                  formatter={(val: number) => [val, 'Leads']}
                />
                <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="n" position="top" style={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontFamily: 'Inter', fontWeight: 500 }} />
                  {leadStatus.map((_: any, i: number) => <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Pipeline funnel */}
        <div className={animClass} style={stagger(3)}>
          <ChartCard 
            title={`${prefix} Pipeline`}
            description={`${fmtINR(totalPipeline)} open pipeline`}
            isLoading={isLoading}
            onRefresh={fetchDash}
            empty={!pipeline || pipeline.length === 0 || totalPipeline === 0}
          >
            <ResponsiveContainer>
              <FunnelChart margin={{ top: 10, right: 80, left: 10, bottom: 10 }}>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} 
                  formatter={(val: number) => [fmtINR(val), 'Value']}
                />
                <Funnel dataKey="value" data={pipeline} isAnimationActive>
                  <LabelList position="right" dataKey="name" stroke="none" style={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontFamily: 'Inter' }} />
                  <LabelList position="center" dataKey="value" stroke="none" formatter={(val: number) => fmtINR(val)} style={{ fontSize: 11, fill: '#fff', fontFamily: 'Inter', fontWeight: 600 }} />
                  {pipeline.map((_: any, i: number) => <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Employee activity */}
        <div className={animClass} style={stagger(4)}>
          <ChartCard 
            title={`${prefix} Activity`}
            description="Field output summary"
            isLoading={isLoading}
            onRefresh={fetchDash}
            empty={!activityMix || activityMix.length === 0 || activityMix.reduce((a:any,b:any)=>a+b.value,0)===0}
          >
            <div className="flex h-full items-center gap-4">
              <div className="h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={activityMix} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                      {activityMix.map((_: any, i: number) => <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />)}
                      <Label
                        content={({ viewBox }) => {
                          const { cx, cy } = viewBox as any;
                          const total = activityMix.reduce((a:any,b:any)=>a+b.value,0);
                          return (
                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={cx} y={cy - 5} className="fill-muted-foreground text-[11px]">Total</tspan>
                              <tspan x={cx} y={cy + 15} className="fill-foreground text-xl font-bold">{total}</tspan>
                            </text>
                          )
                        }}
                      />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {activityMix.map((a: any, i: number) => (
                  <div key={a.name} className="flex items-center gap-2 text-[13px]">
                    <span className="size-3 rounded-sm" style={{ background: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length] }} />
                    <span className="text-muted-foreground">{a.name}</span>
                    <Mono className="ml-auto font-medium">{a.value}</Mono>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? <SkeletonList rows={4} /> : (
          <div className={`rounded-lg border border-border bg-card ${animClass}`} style={stagger(5)}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="kicker text-muted-foreground">{prefix} Hot Opportunities</div>
              <button onClick={() => go('opportunities')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">PIPELINE <ArrowRight className="size-3" /></button>
            </div>
            {opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).length === 0 ? (
              <EmptyState title="No pipeline yet" description="Your active opportunities will appear here." />
            ) : (
              opportunities.filter(o => !['Won', 'Lost'].includes(o.stage)).slice(0, 4).map(o => (
                <div key={o.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0 hover:bg-muted/30 transition-colors">
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
              ))
            )}
          </div>
        )}

        {isLoading ? <SkeletonList rows={4} /> : (
          <div className={`rounded-lg border border-border bg-card ${animClass}`} style={stagger(6)}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="kicker text-muted-foreground">{prefix} Tasks & Meetings</div>
              <button onClick={() => go('tasks')} className="flex items-center gap-1 font-mono2 text-[10.5px] font-medium text-primary hover:underline">MY TASKS <ArrowRight className="size-3" /></button>
            </div>
            {tasks.filter(t => t.status !== 'Completed').length === 0 && meetings.filter(m => m.status === 'Scheduled').length === 0 ? (
              <EmptyState title="You're all caught up" description="No active tasks or upcoming meetings right now." />
            ) : (
              <>
                {tasks.filter(t => t.status !== 'Completed').slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <StatusBadge label={t.priority} tone={t.priority === 'Critical' ? 'red' : t.priority === 'High' ? 'amber' : 'gray'} />
                    <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{t.title}</div>
                    <Mono className="text-muted-foreground">{t.due?.slice(5) || 'Today'}</Mono>
                  </div>
                ))}
                {meetings.filter(m => m.status === 'Scheduled').slice(0, 2).map(m => (
                  <div key={m.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-0 hover:bg-muted/30 transition-colors">
                    <StatusBadge label={m.mode || 'Online'} tone="blue" />
                    <div className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.title}</div>
                    <Mono className="text-muted-foreground">{(m.date || m.scheduled_at || 'Today').slice(5, 10)} · {m.time || (m.scheduled_at || '10:00:00').slice(11, 16)}</Mono>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
