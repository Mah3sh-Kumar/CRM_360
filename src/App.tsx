// src/App.tsx
import { useEffect, useState, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Funnel, Building2, Users, HandCoins, ListChecks, CheckSquare,
  CalendarDays, MapPin, Footprints, Landmark, UserCog, Contact2, BarChart3,
  Search, Bell, ChevronDown, Timer, LogIn, LogOut, Compass, ShieldCheck, Menu, X, Loader2
} from 'lucide-react';
import { CRMProvider, useCRM } from '@/store/crm';
import { navAllowed } from '@/auth/rbac';
import { TrackingProvider, useTracking } from '@/store/tracking';
import { StatusBadge } from '@/components/shared';
import Login from '@/pages/Login';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationsPanel from '@/components/NotificationsPanel';
import NotFound from '@/pages/NotFound';
import { ThemeToggle } from '@/components/ThemeToggle';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Leads = lazy(() => import('@/pages/Leads'));
const Accounts = lazy(() => import('@/pages/Accounts'));
const Contacts = lazy(() => import('@/pages/Contacts'));
const Opportunities = lazy(() => import('@/pages/Opportunities'));
const Activities = lazy(() => import('@/pages/Activities'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const Meetings = lazy(() => import('@/pages/Meetings'));
const Tracking = lazy(() => import('@/pages/Tracking'));
const Visits = lazy(() => import('@/pages/Visits'));
const Masters = lazy(() => import('@/pages/Masters'));
const Reports = lazy(() => import('@/pages/Reports'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const Profile = lazy(() => import('@/pages/Profile'));
const LeadDetail = lazy(() => import('@/pages/details/LeadDetail'));
const AccountDetail = lazy(() => import('@/pages/details/AccountDetail'));
const CustomerDetail = lazy(() => import('@/pages/details/CustomerDetail'));
const OpportunityDetail = lazy(() => import('@/pages/details/OpportunityDetail'));
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, NavLink, Outlet } from 'react-router-dom';

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

function TimerDisplay({ checkInTime }: { checkInTime: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="ml-auto flex items-center gap-1 font-mono2 text-[10px]">
      <Timer className="size-3" aria-hidden="true" />
      {fmtDur(now.getTime() - new Date(checkInTime + 'Z').getTime())}
    </span>
  );
}

function ProtectedRoute({ module, children }: { module?: string; children: React.ReactNode }) {
  const crm = useCRM();

  if (crm.isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!crm.user) return <Navigate to="/login" replace />;
  if (module && !navAllowed(crm.user.role, module)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <h1 className="font-display text-4xl font-bold tracking-tight text-red-500">403</h1>
        <p className="text-muted-foreground">Access Denied. You do not have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}

function LeadDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <LeadDetail id={id!} onBack={() => navigate('/leads')} onNavigate={(page, newId) => {
    let path = `/${page}`;
    if (page === 'customer' && newId) path = `/customers/${newId}`;
    if (page === 'account' && newId) path = `/accounts/${newId}`;
    navigate(path);
  }} />;
}

function AccountDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <AccountDetail id={id!} onBack={() => navigate('/accounts')} />;
}

function CustomerDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <CustomerDetail id={id!} onBack={() => navigate('/customers')} />;
}

function OpportunityDetailWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <OpportunityDetail id={id!} onBack={() => navigate('/opportunities')} />;
}

function Shell() {
  const crm = useCRM();
  const { trackingStatus, checkIn, checkOut } = useTracking();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setMenuOpen(false); setMobileNavOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const user = crm.user!;

  const go = (page: string, id?: string) => {
    let path = `/${page}`;
    if (page === 'lead' && id) path = `/leads/${id}`;
    if (page === 'account' && id) path = `/accounts/${id}`;
    if (page === 'customer' && id) path = `/customers/${id}`;
    if (page === 'opportunity' && id) path = `/opportunities/${id}`;
    
    navigate(path);
    setMenuOpen(false);
    setMobileNavOpen(false);
  };

  const unread = crm.notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden" 
          onClick={() => setMobileNavOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-[228px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:sticky md:top-0 md:translate-x-0",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
          <div className="flex size-8 items-center justify-center rounded-md bg-sage">
            <Compass className="size-4.5 text-sidebar" strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-display text-[15px] font-semibold tracking-tight text-white leading-none">VIREON</div>
            <div className="kicker mt-1 text-sidebar-accent">{user.role}</div>
          </div>
          <button aria-label="Close menu" className="ml-auto flex size-7 items-center justify-center rounded-md text-sidebar-border hover:bg-white/10 md:hidden" onClick={() => setMobileNavOpen(false)}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {NAV.map(g => {
            const items = g.items.filter(it => navAllowed(user.role, it.id));
            if (!items.length) return null;
            return (
              <div key={g.group} className="mb-4">
                <div className="kicker px-2 pb-1.5 text-sidebar-border">{g.group}</div>
                {items.map(it => {
                  const active = location.pathname.startsWith(`/${it.id}`);
                  const Icon = it.icon;
                  return (
                    <NavLink
                      key={it.id}
                      to={`/${it.id}`}
                      onClick={() => {
                        setMenuOpen(false);
                        setMobileNavOpen(false);
                      }}
                      className={cn(
                        'group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] text-[13px] font-medium transition-colors',
                        active ? 'bg-sage text-sidebar' : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon className="size-4 shrink-0" strokeWidth={2} />
                      {user.role === 'Employee' && ['leads', 'accounts', 'contacts', 'opportunities', 'activities', 'tasks', 'meetings'].includes(it.id) ? `My ${it.label}` : it.label}
                      {active && <span className="ml-auto size-1.5 rounded-full bg-sidebar" />}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => {
              const fallback = () => {
                const lat = 19.2403; const lng = 73.1303; const addr = 'Fallback Location (GPS Failed)';
                if (trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) {
                  checkOut(lat, lng, addr);
                } else {
                  checkIn(lat, lng, addr).catch(() => setGeoMsg('Check-In Failed'));
                }
              };
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  if (trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) { 
                    checkOut(pos.coords.latitude, pos.coords.longitude, 'GPS');
                  } else { 
                    checkIn(pos.coords.latitude, pos.coords.longitude, 'GPS').catch(() => setGeoMsg('Check-In Failed'));
                  }
                }, fallback);
              } else {
                fallback();
              }
            }}
            className={cn('flex w-full items-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-semibold transition-colors',
              (trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'bg-primary text-white hover:bg-primary-hover')}>
            {(trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) ? <LogOut className="size-4" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
            {(trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) ? 'Check-Out' : 'Check-In'}
            {(trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) && trackingStatus.check_in_time &&
              <TimerDisplay checkInTime={trackingStatus.check_in_time} />}
          </button>
          {geoMsg && !(trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) && <div className="mt-1.5 px-1 font-mono2 text-[9.5px] text-warning">{geoMsg}</div>}
        </div>
      </aside>
      
      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur md:gap-4 md:px-6">
          <button aria-label="Open menu" aria-expanded={mobileNavOpen} aria-controls="mobile-sidebar" className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-muted-foreground md:hidden" onClick={() => setMobileNavOpen(true)}>
            <Menu className="size-4" aria-hidden="true" />
          </button>
          {!location.pathname.startsWith('/profile') ? (
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="relative flex-1 text-left md:w-full md:max-w-sm md:flex-none">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <span className="flex h-9 w-full items-center rounded-md border border-input bg-card pl-9 pr-12 text-[13px] text-muted-foreground truncate">
                <span className="hidden md:inline">Search leads, accounts, opportunities…</span>
                <span className="md:hidden">Search...</span>
              </span>
              <kbd className="kicker absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-muted-foreground md:block">Ctrl K</kbd>
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block">
              <StatusBadge label={(trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) ? 'Checked-In' : 'Checked-Out'} tone={(trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) ? 'green' : 'gray'} />
            </div>
            <ThemeToggle />
            <button aria-label="Notifications" aria-expanded={notifOpen} onClick={() => setNotifOpen(o => !o)} className="relative flex size-9 items-center justify-center rounded-md border border-input bg-card transition-colors hover:bg-secondary">
              <Bell className="size-4" aria-hidden="true" />
              {unread > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />}
            </button>
            <div className="relative">
              <button aria-label="User menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 rounded-md border border-input bg-card py-1.5 pl-1.5 pr-1.5 transition-colors hover:bg-secondary md:gap-2.5 md:pr-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-ink font-mono2 text-[10px] font-semibold text-primary-foreground">{initials(user.name)}</div>
                <div className="hidden text-left leading-tight md:block">
                  <div className="text-[12px] font-semibold">{user.name}</div>
                  <div className="kicker text-muted-foreground truncate max-w-[120px]">{user.role} · {user.designation}</div>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
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
                    <button onClick={() => go('profile')}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] font-medium transition-colors hover:bg-secondary">
                      <UserCog className="size-3.5 text-muted-foreground" /> Profile
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button onClick={() => crm.logout()}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] font-medium text-destructive transition-colors hover:bg-destructive-bg">
                      <LogOut className="size-3.5" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <Suspense fallback={<div className="flex h-[80vh] flex-col items-center justify-center space-y-4"><Loader2 className="size-8 animate-spin text-muted-foreground" /><p className="text-muted-foreground">Loading...</p></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={go} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

function MainApp() {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<ProtectedRoute><Shell /></ProtectedRoute>}>
        <Route path="dashboard" element={<ProtectedRoute module="dashboard"><Dashboard go={(p: string) => navigate(`/${p}`)} /></ProtectedRoute>} />
        
        <Route path="leads" element={<ProtectedRoute module="leads"><Leads onOpen={(id: string) => navigate(`/leads/${id}`)} /></ProtectedRoute>} />
        <Route path="leads/:id" element={<ProtectedRoute module="leads"><LeadDetailWrapper /></ProtectedRoute>} />
        
        <Route path="accounts" element={<ProtectedRoute module="accounts"><Accounts onOpen={(id: string) => navigate(`/accounts/${id}`)} /></ProtectedRoute>} />
        <Route path="accounts/:id" element={<ProtectedRoute module="accounts"><AccountDetailWrapper /></ProtectedRoute>} />
        
        <Route path="contacts" element={<ProtectedRoute module="contacts"><Contacts /></ProtectedRoute>} />
        
        <Route path="opportunities" element={<ProtectedRoute module="opportunities"><Opportunities onOpen={(id: string) => navigate(`/opportunities/${id}`)} /></ProtectedRoute>} />
        <Route path="opportunities/:id" element={<ProtectedRoute module="opportunities"><OpportunityDetailWrapper /></ProtectedRoute>} />
        
        <Route path="activities" element={<ProtectedRoute module="activities"><Activities /></ProtectedRoute>} />
        <Route path="tasks" element={<ProtectedRoute module="tasks"><Tasks /></ProtectedRoute>} />
        <Route path="meetings" element={<ProtectedRoute module="meetings"><Meetings /></ProtectedRoute>} />
        <Route path="tracking" element={<ProtectedRoute module="tracking"><Tracking /></ProtectedRoute>} />
        <Route path="visits" element={<ProtectedRoute module="visits"><Visits /></ProtectedRoute>} />
        
        <Route path="companies" element={<ProtectedRoute module="companies"><Masters tab="companies" /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute module="employees"><Masters tab="employees" /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute module="customers"><Masters tab="customers" onOpen={(id: string) => navigate(`/customers/${id}`)} /></ProtectedRoute>} />
        <Route path="customers/:id" element={<ProtectedRoute module="customers"><CustomerDetailWrapper /></ProtectedRoute>} />
        
        <Route path="reports" element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
        <Route path="audit-logs" element={<ProtectedRoute module="audit-logs"><AuditLogs /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

import { ThemeProvider } from '@/components/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="crm-ui-theme">
      <CRMProvider>
        <TrackingProvider>
          <BrowserRouter>
            <MainApp />
          </BrowserRouter>
        </TrackingProvider>
      </CRMProvider>
    </ThemeProvider>
  );
}
