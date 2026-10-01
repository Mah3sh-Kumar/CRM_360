import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Funnel, Building2, Users, HandCoins, ListChecks, CheckSquare,
  CalendarDays, MapPin, Footprints, Landmark, UserCog, Contact2, BarChart3,
  Search, Bell, ChevronDown, Timer, LogIn, LogOut, Compass
} from 'lucide-react';
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
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [checkedIn, setCheckedIn] = useState(true);

  const render = () => {
    switch (page) {
      case 'dashboard': return <Dashboard go={setPage} />;
      case 'leads': return <Leads />;
      case 'accounts': return <Accounts />;
      case 'contacts': return <Contacts />;
      case 'opportunities': return <Opportunities />;
      case 'activities': return <Activities />;
      case 'tasks': return <Tasks />;
      case 'meetings': return <Meetings />;
      case 'tracking': return <Tracking />;
      case 'visits': return <Visits />;
      case 'companies': return <Masters tab="companies" />;
      case 'employees': return <Masters tab="employees" />;
      case 'customers': return <Masters tab="customers" />;
      case 'reports': return <Reports />;
      default: return <Dashboard go={setPage} />;
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
            <div className="kicker mt-1 text-[#6f9480]">Sales + Geo Tracking</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map(g => (
            <div key={g.group} className="mb-4">
              <div className="kicker px-2 pb-1.5 text-[#5d8171]">{g.group}</div>
              {g.items.map(it => {
                const active = page === it.id;
                const Icon = it.icon;
                return (
                  <button key={it.id} onClick={() => setPage(it.id)}
                    className={cn(
                      'group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-[13px] font-medium transition-colors',
                      active ? 'bg-[#85c093] text-[#0c231e]' : 'text-[#a9c4b2] hover:bg-white/5 hover:text-white'
                    )}>
                    <Icon className="size-4 shrink-0" strokeWidth={2} />
                    {it.label}
                    {active && <span className="ml-auto size-1.5 rounded-full bg-[#0c231e]" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={() => setCheckedIn(!checkedIn)}
            className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-semibold transition-colors',
              checkedIn ? 'bg-[#123a30] text-[#8fd4a8]' : 'bg-[#007f24] text-white hover:bg-[#0a6b20]')}>
            {checkedIn ? <LogOut className="size-4" /> : <LogIn className="size-4" />}
            {checkedIn ? 'Check-Out' : 'Check-In'}
            {checkedIn && <span className="ml-auto flex items-center gap-1 font-mono2 text-[10px]"><Timer className="size-3" />03:48:12</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/85 px-6 backdrop-blur">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search leads, accounts, opportunities…"
              className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-ring/25" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <StatusBadge label={checkedIn ? 'Checked-In' : 'Checked-Out'} tone={checkedIn ? 'green' : 'gray'} />
            <button className="relative flex size-9 items-center justify-center rounded-md border border-input bg-card hover:bg-secondary transition-colors">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#b03a26]" />
            </button>
            <button className="flex items-center gap-2.5 rounded-md border border-input bg-card py-1.5 pl-1.5 pr-2.5 hover:bg-secondary transition-colors">
              <div className="flex size-6 items-center justify-center rounded bg-[#09352e] font-mono2 text-[10px] font-semibold text-[#a8d8ba]">RK</div>
              <div className="text-left leading-tight">
                <div className="text-[12px] font-semibold">Rohan Kulkarni</div>
                <div className="kicker text-muted-foreground">Employee · Field Sales</div>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{render()}</main>
      </div>
    </div>
  );
}
