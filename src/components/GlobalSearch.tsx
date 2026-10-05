// src/components/GlobalSearch.tsx — Ctrl+K command palette over live store data
import { useEffect, useRef, useState } from 'react';
import { Search, Funnel, Building2, Contact2, HandCoins, Users, CheckSquare, CalendarDays, ListChecks } from 'lucide-react';
import { useCRM } from '@/store/crm';
import { activities, tasks, meetings } from '@/data/mock';

interface Item { id?: string; label: string; sub: string }
interface Group { label: string; page: string; icon: React.ElementType; items: Item[] }

export default function GlobalSearch({ open, onClose, onNavigate }: {
  open: boolean; onClose: () => void; onNavigate: (page: string, id?: string) => void;
}) {
  const crm = useCRM();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (open) { 
      setQ(''); 
      setTimeout(() => inputRef.current?.focus(), 0); 
    } 
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  if (!open) return null;

  const ql = q.trim().toLowerCase();
  const has = (s: string) => s.toLowerCase().includes(ql);

  const groups: Group[] = [
    { label: 'Leads', page: 'leads', icon: Funnel, items: ql ? crm.leads.filter(l => has(l.name) || has(l.company)).slice(0, 5).map(l => ({ id: l.id, label: l.name, sub: `${l.company} · ${l.status}` })) : [] },
    { label: 'Accounts', page: 'accounts', icon: Building2, items: ql ? crm.accounts.filter(a => has(a.name)).slice(0, 5).map(a => ({ id: a.id, label: a.name, sub: `${a.industry} · ${a.city}` })) : [] },
    { label: 'Customers', page: 'customers', icon: Contact2, items: ql ? crm.customers.filter(c => has(c.name)).slice(0, 5).map(c => ({ id: c.id, label: c.name, sub: `${c.city} · ${c.status}` })) : [] },
    { label: 'Contacts', page: 'contacts', icon: Users, items: ql ? crm.contacts.filter(c => has(c.name) || has(c.account)).slice(0, 5).map(c => ({ label: c.name, sub: `${c.title} · ${c.account}` })) : [] },
    { label: 'Opportunities', page: 'opportunities', icon: HandCoins, items: ql ? crm.opportunities.filter(o => has(o.name) || has(o.account)).slice(0, 5).map(o => ({ id: o.id, label: o.name, sub: `${o.stage} · ${o.code}` })) : [] },
    { label: 'Tasks', page: 'tasks', icon: CheckSquare, items: ql ? tasks.filter(t => has(t.title)).slice(0, 4).map(t => ({ label: t.title, sub: `${t.assignee} · ${t.status}` })) : [] },
    { label: 'Meetings', page: 'meetings', icon: CalendarDays, items: ql ? meetings.filter(m => has(m.title) || has(m.account)).slice(0, 4).map(m => ({ label: m.title, sub: `${m.account} · ${m.date}` })) : [] },
    { label: 'Activities', page: 'activities', icon: ListChecks, items: ql ? activities.filter(a => has(a.subject)).slice(0, 4).map(a => ({ label: a.subject, sub: `${a.type} · ${a.status}` })) : [] },
  ];

  const visible = groups.filter(g => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-sidebar/40 backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Global Search" className="mx-auto mt-[14vh] w-[min(580px,92vw)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search aria-hidden="true" className="size-4 text-muted-foreground" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            aria-label="Search leads, accounts, customers, opportunities"
            placeholder="Search leads, accounts, customers, opportunities…"
            className="h-12 w-full bg-transparent text-[13.5px] outline-none" />
          <kbd className="kicker rounded border border-border px-1.5 py-0.5 text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {!ql && <div className="p-6 text-center font-mono2 text-[11px] leading-relaxed text-muted-foreground">Type to search across CRM 360.<br />Press <b>Ctrl K</b> anywhere to reopen.</div>}
          {ql && visible.length === 0 && <div className="p-6 text-center font-mono2 text-[11px] text-muted-foreground">No results for “{q}”.</div>}
          {visible.map(g => (
            <div key={g.label} className="mb-1">
              <div className="kicker px-2 py-1.5 text-muted-foreground">{g.label}</div>
              {g.items.map((it, i) => (
                <button key={i} onClick={() => { onNavigate(g.page, it.id); onClose(); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted-bg">
                  <g.icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[12.5px] font-medium">{it.label}</span>
                  <span className="ml-auto truncate pl-3 font-mono2 text-[10.5px] text-muted-foreground">{it.sub}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
