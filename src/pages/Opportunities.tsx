// src/pages/Opportunities.tsx — store-backed + click-through + Lost column
import { NewButton, ImportExport, Mono, StatusBadge, ErrorState, Toolbar, EmptyState, SkeletonCard } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { fmtINR } from '@/lib/utils';
import type { OppStage } from '@/types/models';
import { useCRM } from '@/store/crm';
import { ArrowRight, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import OpportunityModal from '@/components/OpportunityModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const stages: OppStage[] = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const gate: Record<string, string> = {
  Prospecting: '→ Qualification requires: customer interaction + requirements gathered',
  Qualification: '→ Proposal requires: solution identified + proposal prepared',
  Proposal: '→ Negotiation requires: proposal submitted + review initiated',
  Negotiation: '→ Won requires: agreement finalised + approval received',
  Won: 'Closed — revenue booked to forecast',
  Lost: 'Closed lost — reason captured in detail view',
};

const getProbTone = (p: number): Tone => {
  if (p >= 100) return 'green';
  if (p >= 70) return 'green';
  if (p >= 50) return 'blue';
  if (p >= 30) return 'amber';
  return 'gray';
};

export default function Opportunities({ onOpen }: { onOpen: (id: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterProb, setFilterProb] = useState('All');
  const [filterOwner, setFilterOwner] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  
  const { opportunities, user, loading, error, fetchOpportunities } = useCRM();
  
  const mine = user?.role === 'Employee';
  
  const uniqueOwners = useMemo(() => Array.from(new Set(opportunities.map(o => o.owner))).sort(), [opportunities]);

  const pool = useMemo(() => {
    let res = mine ? opportunities.filter(o => o.owner === user?.name) : [...opportunities];
    
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(o => o.name.toLowerCase().includes(q) || o.account?.toLowerCase().includes(q) || o.owner?.toLowerCase().includes(q) || o.code?.toLowerCase().includes(q));
    }
    
    if (filterStage !== 'All') {
      res = res.filter(o => o.stage === filterStage);
    }
    
    if (filterProb !== 'All') {
      const p = Number(filterProb);
      if (p === 100) res = res.filter(o => o.probability === 100);
      else res = res.filter(o => o.probability >= p);
    }
    
    if (filterOwner !== 'All') {
      res = res.filter(o => o.owner === filterOwner);
    }

    if (sortBy === 'Newest') res.sort((a, b) => b.code.localeCompare(a.code));
    else if (sortBy === 'Oldest') res.sort((a, b) => a.code.localeCompare(b.code));
    else if (sortBy === 'Revenue: High → Low') res.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
    else if (sortBy === 'Revenue: Low → High') res.sort((a, b) => a.expectedRevenue - b.expectedRevenue);
    else if (sortBy === 'Closing Date: Soonest') res.sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());
    else if (sortBy === 'Probability: High → Low') res.sort((a, b) => b.probability - a.probability);

    return res;
  }, [mine, opportunities, user?.name, search, filterStage, filterProb, filterOwner, sortBy]);

  const weightedForecast = useMemo(() => pool.filter(o => !['Won', 'Lost'].includes(o.stage)).reduce((s, o) => s + Number(o.expectedRevenue) * Number(o.probability) / 100, 0), [pool]);

  const clearFilters = () => {
    setFilterStage('All');
    setFilterProb('All');
    setFilterOwner('All');
    setSortBy('Newest');
    setSearch('');
  };

  return (
    <div className="space-y-4 flex flex-col h-full min-h-0">
      {/* Tighter Page Header */}
      <div className="flex flex-col items-start justify-between gap-3 pb-4 border-b border-border sm:flex-row sm:items-end shrink-0">
        <div className="w-full min-w-0">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1 uppercase">CRM OPERATIONS · OPPORTUNITIES</div>
          <h1 className="font-display text-[24px] leading-tight font-semibold text-foreground">{mine ? 'My Opportunities' : 'Opportunities'}</h1>
          <div className="text-[12px] text-muted-foreground mt-0.5">Forecast = Expected Revenue × Probability</div>
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto mt-3 sm:mt-0">
          <ImportExport data={pool} filename="opportunities" />
          <NewButton label="Create Opportunity" onClick={() => setShowModal(true)} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0">
        <Toolbar placeholder="Search opportunities, account, owner..." searchValue={search} onSearchChange={setSearch}>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[125px] h-8 text-[12px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stages</SelectItem>
              {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterProb} onValueChange={setFilterProb}>
            <SelectTrigger className="w-[125px] h-8 text-[12px]">
              <SelectValue placeholder="Probability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Prob.</SelectItem>
              <SelectItem value="10">10%+</SelectItem>
              <SelectItem value="30">30%+</SelectItem>
              <SelectItem value="50">50%+</SelectItem>
              <SelectItem value="70">70%+</SelectItem>
              <SelectItem value="100">100%</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterOwner} onValueChange={setFilterOwner}>
            <SelectTrigger className="w-[125px] h-8 text-[12px]">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Owners</SelectItem>
              {uniqueOwners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[165px] h-8 text-[12px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {['Newest', 'Oldest', 'Revenue: High → Low', 'Revenue: Low → High', 'Closing Date: Soonest', 'Probability: High → Low'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterStage !== 'All' || filterProb !== 'All' || filterOwner !== 'All' || sortBy !== 'Newest' || search) && (
            <button onClick={clearFilters} className="text-[12px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 transition-colors">
              Clear
            </button>
          )}
        </Toolbar>
      </div>

      {/* Main Content Area */}
      {error.opportunities ? (
        <ErrorState title="Failed to load opportunities" message={error.opportunities} onRetry={fetchOpportunities} />
      ) : loading.opportunities ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 items-start w-full min-h-[500px]">
          {stages.map(st => (
            <div key={st} className="flex-none w-[85vw] sm:w-[320px] xl:flex-1 xl:min-w-[260px] flex flex-col gap-3">
              <div className="h-[76px] rounded-xl border border-border bg-card/50 p-3" />
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
                {[1, 2, 3].map(i => (
                  <SkeletonCard key={i} className="h-[150px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState title="No opportunities yet" description="Create your first opportunity to start building your pipeline." icon={<Plus className="size-6" />} action={<NewButton label="Create Opportunity" onClick={() => setShowModal(true)} />} />
      ) : pool.length === 0 ? (
        <EmptyState title="No opportunities found" description="Try changing your search or filters." action={<button onClick={clearFilters} className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-card px-4 text-[12.5px] font-medium text-foreground hover:bg-accent transition-colors">Clear Filters</button>} />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 items-start w-full flex-1">
             {stages.map(st => {
                const opps = pool.filter(o => o.stage === st);
                const total = opps.reduce((s, o) => s + Number(o.expectedRevenue), 0);
                
                if (filterStage !== 'All' && filterStage !== st) return null;

                const stageColorMap: Record<string, { bg: string, border: string, text: string, cardBg: string }> = {
                  'Prospecting': { bg: 'bg-muted-bg', border: 'border-border', text: 'text-foreground', cardBg: 'bg-muted-bg/50' },
                  'Qualification': { bg: 'bg-info-bg', border: 'border-info-border', text: 'text-info', cardBg: 'bg-info-bg/50' },
                  'Proposal': { bg: 'bg-purple-bg', border: 'border-purple-border', text: 'text-purple', cardBg: 'bg-purple-bg/50' },
                  'Negotiation': { bg: 'bg-warning-bg', border: 'border-warning-border', text: 'text-warning', cardBg: 'bg-warning-bg/50' },
                  'Won': { bg: 'bg-success-bg', border: 'border-success-border', text: 'text-success', cardBg: 'bg-success-bg/40' },
                  'Lost': { bg: 'bg-destructive-bg', border: 'border-destructive-border', text: 'text-destructive', cardBg: 'bg-destructive-bg/30' }
                };

                const colors = stageColorMap[st] || { bg: 'bg-card', border: 'border-border', text: 'text-foreground', cardBg: 'bg-card' };

                    const isSingleColumn = filterStage !== 'All';
                    const listClass = isSingleColumn 
                      ? "grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 auto-rows-max max-h-[calc(100vh-260px)] overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                      : "flex flex-col gap-3 max-h-[calc(100vh-260px)] overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']";

                    return (
                      <div key={st} className="flex-none w-[85vw] sm:w-[320px] xl:flex-1 xl:min-w-[260px] flex flex-col gap-3">
                        <div className={`flex flex-col rounded-xl border-2 p-3 shadow-sm ${colors.bg} ${colors.border}`}>
                          <div className={`text-[12px] font-extrabold tracking-[0.1em] uppercase mb-1 ${colors.text}`}>{st}</div>
                          <div className="text-[12.5px] text-muted-foreground mb-0.5 font-medium">{opps.length} {opps.length === 1 ? 'opportunity' : 'opportunities'}</div>
                          <div className="font-display text-[16px] font-semibold text-primary">{fmtINR(total)}</div>
                        </div>

                        <div className={listClass}>
                      {opps.map((o, i) => (
                        <button key={o.id} onClick={() => onOpen(o.id)} style={{ animationDelay: `${i * 30}ms` }} className={`group flex flex-col h-auto w-full rounded-xl border ${colors.border} ${colors.cardBg} p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer animate-in fade-in slide-in-from-bottom-2`}>
                          <div className="flex items-start justify-between gap-2 mb-1.5 w-full">
                             <div className="text-[13.5px] font-semibold leading-tight text-foreground line-clamp-2">{o.name}</div>
                             <StatusBadge label={`${o.probability}%`} tone={getProbTone(o.probability)} />
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mb-2.5">
                            <Mono className="group-hover:text-primary transition-colors">{o.code}</Mono>
                            <span className="size-1 rounded-full bg-muted-foreground/40 shrink-0"></span>
                            <span className="truncate">{o.account}</span>
                          </div>

                          <div className="mt-auto w-full">
                            <div className="flex items-center justify-between rounded-md bg-background/50 p-2 mb-2.5">
                              <div className="min-w-0 pr-2">
                                 <div className="text-[9.5px] text-muted-foreground mb-0.5 uppercase tracking-widest font-semibold">Revenue</div>
                                 <div className="font-display text-[14px] font-bold text-primary truncate">{fmtINR(Number(o.expectedRevenue))}</div>
                              </div>
                              <div className="text-right shrink-0">
                                 <div className="text-[9.5px] text-muted-foreground mb-0.5 uppercase tracking-widest font-semibold">Closing</div>
                                 <Mono className="text-[11px] font-medium">{o.closeDate.slice(5)}</Mono>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                              <div className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold uppercase shrink-0">{o.owner.charAt(0)}</div>
                              <span className="truncate">{o.owner}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                      {opps.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-center">
                          <div className="text-[12.5px] font-medium text-muted-foreground mb-1">No deals</div>
                          <div className="text-[11px] text-muted-foreground/60">Empty pipeline stage</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-start gap-1.5 px-1 font-mono2 text-[10px] leading-relaxed text-muted-foreground/80">
                      <ArrowRight className="mt-0.5 size-3 shrink-0 opacity-50" />{gate[st]}
                    </div>
                  </div>
                );
             })}
          </div>

          <div className="shrink-0 mt-2 rounded-lg border border-border bg-card px-4 py-3 flex items-center flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Weighted Forecast</span>
            <span className="font-display text-[15px] font-bold text-foreground">
              {fmtINR(weightedForecast)}
            </span>
            <span className="ml-2 font-mono2 text-[10.5px] text-muted-foreground hidden sm:inline">= Σ (expected revenue × probability) across open stages</span>
          </div>
        </div>
      )}
      <OpportunityModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
