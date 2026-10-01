// src/App.tsx
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Funnel, Building2, Users, HandCoins, ListChecks, CheckSquare,
  CalendarDays, MapPin, Footprints, Landmark, UserCog, Contact2, BarChart3,
  Search, Bell, ChevronDown, Timer, LogIn, LogOut, Compass, ShieldCheck,
} from 'lucide-react';
import { CRMProvider, useCRM, navAllowed } from '@/store/crm';
import { StatusBadge } from '@/components/shared';
import Dashboard from '@/pages/Dashboard';
import Leads from '@/pages/Leads';
import Accounts from '@/pages/Accounts';
import Contacts from '@/pages/Contacts';
import Opportunities from '@/pages/Opportunities';
import Activities from '@/pages/Activities';
import Tasks from '@/pages/Tasks';
import Meetings from '@/pages/Meetings';
import Tracking from '@/pages/Tracking';
import Visits from '@/pages/Visits';
import Masters from '@/pages/Masters';
import Reports from '@/pages/Reports';
import Login from '@/pages/Login';
import AuditLogs from '@/pages/AuditLogs';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationsPanel from '@/components/NotificationsPanel';
import LeadDetail from '@/pages/details/LeadDetail';
import AccountDetail from '@/pages/details/AccountDetail';
import CustomerDetail from '@/pages/details/CustomerDetail';
import OpportunityDetail from '@/pages/details/OpportunityDetail';

type NavItem = { id: string; label: string; icon: React.ElementType };
type NavGroup = { group: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'CRM Operations', items: [
      { id: 'leads', label: 'Leads', icon: Funnel },
      { id: 'accounts', label: 'Accounts', icon: Building2 },
      { id: 'contacts', label: 'Contacts', icon: Users },
      { id: 'opportunities', label: 'Opportunities', icon: HandCoins },
      { id: 'activities', label: 'Activities', icon: ListChecks },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare },
      { id: 'meetings', label: 'Meetings', icon: CalendarDays },
    ],
  },
  {
    group: 'Employee Tracking', items: [
      { id: 'tracking', label: 'Live Tracking', icon: MapPin },
      { id: 'visits', label: 'Visits', icon: Footprints },
    ],
  },
  {
    group: 'Masters', items: [
      { id: 'companies', label: 'Companies', icon: Landmark },
      { id: 'employees', label: 'Employees', icon: UserCog },
      { id: 'customers', label: 'Customers', icon: Contact2 },
    ],
  },
  { group: 'Insights', items: [{ id: 'reports', label: 'Reports', icon: BarChart3 }] },
  { group: 'Administration', items: [{ id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck }] },
];

const initials = (name: string) => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
const fmtDur = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function Shell() {
  const crm = useCRM();
  const [route, setRoute] = useState<{ page: string; id?: string }>({ page: 'dashboard' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setMenuOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => { clearInterval(t); window.removeEventListener('keydown', onKey); };
  }, []);

  if (!crm.user) return <Login />;
  const user = crm.user;

  const go = (page: string, id?: string) => {
    if (!navAllowed(user.role, page)) return;
    setRoute({ page, id });
    setMenuOpen(false);
  };

  const page = navAllowed(user.role, route.page) ? route.page : 'dashboard';
  const unread = crm.notifications.filter(n => !n.read).length;

  const render = () => {
    switch (page) {
      case 'dashboard': return <Dashboard go={(p: string) => go(p)} />;
      case 'leads': return <Leads onOpen={(id: string) => go('lead', id)} />;
      case 'lead': return route.id ? <LeadDetail id={route.id} onBack={() => go('leads')} onNavigate={go} /> : <Leads onOpen={(id: string) => go('lead', id)} />;
      case 'accounts': return <Accounts onOpen={(id: string) => go('account', id)} />;
      case 'account': return route.id ? <AccountDetail id={route.id} onBack={() => go('accounts')} /> : <Accounts onOpen={(id: string) => go('account', id)} />;
      case 'contacts': return <Contacts />;
      case 'opportunities': return <Opportunities onOpen={(id: string) => go('opportunity', id)} />;
      case 'opportunity': return route.id ? <OpportunityDetail id={route.id} onBack={() => go('opportunities')} /> : <Opportunities onOpen={(id: string) => go('opportunity', id)} />;
      case 'activities': return <Activities />;
      case 'tasks': return <Tasks />;
      case 'meetings': return <Meetings />;
      case 'tracking': return <Tracking />;
      case 'visits': return <Visits />;
      case 'companies': return <Masters tab="companies" />;
      case 'employees': return <Masters tab="employees" />;
      case 'customers': return route.id ? <CustomerDetail id={route.id} onBack={() => go('customers')} /> : <Masters tab="customers" onOpen={(id: string) => go('customer', id)} />;
      case 'reports': return <Reports />;
      case 'audit-logs': return <AuditLogs />;
      default: return <Dashboard go={(p: string) => go(p)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-[228px] shrink-0 flex-col border-r border-border bg-[#0c231e] text-[#cfe3d6]">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
          <div className="flex size-8 items-center justify-center rounded-md bg-[#85c093]">
            <Compass className="size-4.5 text-[#0c231e]" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold tracking-tight text-white leading-none">CRM 360</div>
            <div className="kicker mt-1 text-[#6f9480]">{user.role}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map(g => {
            const items = g.items.filter(it => navAllowed(user.role, it.id));
            if (!items.length) return null;
            return (
              <div key={g.group} className="mb-4">
                <div className="kicker px-2 pb-1.5 text-[#5d8171]">{g.group}</div>
                {items.map(it => {
                  const active = page === it.id || (it.id === 'customers' && page === 'customer')
                    || (it.id === 'leads' && page === 'lead') || (it.id === 'accounts' && page === 'account')
                    || (it.id === 'opportunities' && page === 'opportunity');
                  const Icon = it.icon;
                  return (
                    <button key={it.id} onClick={() => go(it.id)}
                      className={cn(
                        'group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-[13px] font-medium transition-colors',
                        active ? 'bg-[#85c093] text-[#0c231e]' : 'text-[#a9c4b2] hover:bg-white/5 hover:text-white'
                      )}>
                      <Icon className="size-4 shrink-0" strokeWidth={2} />
                      {user.role === 'Employee' && ['leads', 'accounts', 'contacts', 'opportunities', 'activities', 'tasks', 'meetings'].includes(it.id) ? `My ${it.label}` : it.label}
                      {active && <span className="ml-auto size-1.5 rounded-full bg-[#0c231e]" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={async () => {
              if (crm.checkIn.checkedIn) { crm.checkOut(); setGeoMsg(''); }
              else { const r = await crm.requestCheckIn(); setGeoMsg(r.message); }
            }}
            className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-semibold transition-colors',
              crm.checkIn.checkedIn ? 'bg-[#123a30] text-[#8fd4a8]' : 'bg-[#007f24] text-white hover:bg-[#0a6b20]')}>
            {crm.checkIn.checkedIn ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
            {crm.checkIn.checkedIn ? 'Check-Out' : 'Check-In'}
            {crm.checkIn.checkedIn && crm.checkIn.since &&
              <span className="ml-auto flex items-center gap-1 font-mono2 text-[10px]"><Timer className="size-3" />{fmtDur(now.getTime() - crm.checkIn.since.getTime())}</span>}
          </button>
          {crm.checkIn.checkedIn && crm.checkIn.fix && (
            <div className="mt-1.5 flex items-center gap-1 px-1 font-mono2 text-[9.5px] text-[#6f9480]">
              <MapPin className="size-3" /> GPS active · {crm.checkIn.fix.lat}, {crm.checkIn.fix.lng}
            </div>
          )}
          {geoMsg && !crm.checkIn.checkedIn && <div className="mt-1.5 px-1 font-mono2 text-[9.5px] text-[#c9b458]">{geoMsg}</div>}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/85 px-6 backdrop-blur">
          <button onClick={() => setSearchOpen(true)} className="relative w-full max-w-sm text-left">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="flex h-9 w-full items-center rounded-md border border-input bg-card pl-9 pr-12 text-[13px] text-muted-foreground">Search leads, accounts, opportunities…</span>
            <kbd className="kicker absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-muted-foreground">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <StatusBadge label={crm.checkIn.checkedIn ? 'Checked-In' : 'Checked-Out'} tone={crm.checkIn.checkedIn ? 'green' : 'gray'} />
            <button onClick={() => setNotifOpen(o => !o)} className="relative flex size-9 items-center justify-center rounded-md border border-input bg-card transition-colors hover:bg-secondary">
              <Bell className="size-4" />
              {unread > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#b03a26]" />}
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2.5 rounded-md border border-input bg-card py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-secondary">
                <div className="flex size-6 items-center justify-center rounded bg-[#09352e] font-mono2 text-[10px] font-semibold text-[#a8d8ba]">{initials(user.name)}</div>
                <div className="text-left leading-tight">
                  <div className="text-[12px] font-semibold">{user.name}</div>
                  <div className="kicker text-muted-foreground">{user.role} · {user.designation}</div>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-40 w-[240px] rounded-lg border border-border bg-card p-1.5 shadow-lg">
                    <div className="px-2.5 py-2">
                      <div className="text-[12.5px] font-semibold">{user.name}</div>
                      <div className="font-mono2 text-[10.5px] text-muted-foreground">{user.email}</div>
                      <div className="font-mono2 text-[10.5px] text-muted-foreground">{user.company} · {user.code}</div>
                    </div>
                    <button onClick={() => crm.logout()}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] font-medium text-[#b03a26] transition-colors hover:bg-[#fbe9e6]">
                      <LogOut className="size-3.5" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{render()}</main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={go} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <CRMProvider>
      <Shell />
    </CRMProvider>
  );
}
