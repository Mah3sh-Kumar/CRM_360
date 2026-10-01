// src/store/crm.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  leads as seedLeads, accounts as seedAccounts, customers as seedCustomers,
  contacts as seedContacts, opportunities as seedOpps, visits as seedVisits,
  employees,
} from '@/data/mock';
import type { Lead, Account, Customer, Contact, Opportunity, Visit, OppStage } from '@/data/mock';

export type Role = 'Super Admin' | 'Company Admin' | 'Manager' | 'Employee';

export interface SessionUser {
  name: string; email: string; role: Role; code: string;
  company: string; designation: string; manager: string;
}

export interface AuditEntry { id: number; time: string; user: string; module: string; action: string; record: string; }
export type NotifKind = 'task' | 'meeting' | 'alert' | 'gps' | 'lead' | 'audit';
export interface AppNotification { id: number; kind: NotifKind; title: string; body: string; time: string; read: boolean; }
export interface GeoFix { lat: number; lng: number; }
export interface CheckInState { checkedIn: boolean; since: Date | null; fix: GeoFix | null; address: string; }
export interface Conversion { leadId: string; customerId: string; accountId: string; at: string; by: string; }

const DEMO_USERS: (SessionUser & { password: string })[] = [
  { name: 'Aditya Verma', email: 'admin@crm360.io', password: 'admin123', role: 'Super Admin', code: 'ADM-001', company: 'CRM 360 HQ', designation: 'Platform Administrator', manager: '—' },
  ...employees.map(e => ({
    name: e.name, email: e.email, password: 'demo123', role: e.role, code: e.code,
    company: e.company, designation: e.designation, manager: e.manager,
  })),
];

const nowTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
const nextCode = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, '0')}`;
const FALLBACK_FIX: GeoFix = { lat: 19.2403, lng: 73.1303 };

function locate(): Promise<{ fix: GeoFix; source: 'gps' | 'fallback' }> {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) return resolve({ fix: FALLBACK_FIX, source: 'fallback' });
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ fix: { lat: +pos.coords.latitude.toFixed(4), lng: +pos.coords.longitude.toFixed(4) }, source: 'gps' }),
      () => resolve({ fix: FALLBACK_FIX, source: 'fallback' }),
      { timeout: 5000, maximumAge: 60000 },
    );
  });
}

export interface CRMStore {
  user: SessionUser | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  leads: Lead[]; accounts: Account[]; customers: Customer[];
  contacts: Contact[]; opportunities: Opportunity[]; visits: Visit[];
  conversions: Conversion[];
  audit: AuditEntry[];
  logAudit: (module: string, action: string, record: string) => void;
  notifications: AppNotification[];
  notify: (kind: NotifKind, title: string, body: string) => void;
  markAllRead: () => void;
  convertLead: (leadId: string, owner: string, customerStatus: 'Active' | 'Prospect') => { customer: Customer; account: Account } | null;
  setOppStage: (oppId: string, stage: OppStage) => void;
  checkIn: CheckInState;
  requestCheckIn: () => Promise<{ ok: boolean; source: 'gps' | 'fallback'; message: string }>;
  checkOut: () => void;
  recordVisit: (input: { customer: string; contact: string; purpose: string }) => { ok: boolean; message: string };
}

const CRMContext = createContext<CRMStore | null>(null);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(seedOpps);
  const [visits, setVisits] = useState<Visit[]>(seedVisits);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [checkIn, setCheckIn] = useState<CheckInState>({ checkedIn: false, since: null, fix: null, address: '' });

  const idRef = useRef(100);
  const nidRef = useRef(10);
  const aidRef = useRef(10);
  const cusRef = useRef(1071);
  const acctRef = useRef(100);

  const [audit, setAudit] = useState<AuditEntry[]>([
    { id: 1, time: '10:42', user: 'Rohan Kulkarni', module: 'Lead', action: 'Updated', record: 'LD-2205' },
    { id: 2, time: '10:38', user: 'Amit Sharma', module: 'Task', action: 'Completed', record: 'TK-381' },
    { id: 3, time: '10:21', user: 'Aditya Verma', module: 'Employee', action: 'Created', record: 'EMP-108' },
    { id: 4, time: '09:55', user: 'Priya Nair', module: 'Opportunity', action: 'Stage Change', record: 'OPP-3301' },
  ]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 1, kind: 'task', title: 'New Task Assigned', body: 'Complete API integration', time: '2 min ago', read: false },
    { id: 2, kind: 'meeting', title: 'Meeting Tomorrow', body: 'Trident Auto Components · 10:30 AM', time: '1 hr ago', read: false },
    { id: 3, kind: 'alert', title: 'Task Overdue', body: 'Follow up with Falcon Packaging', time: 'Yesterday', read: false },
    { id: 4, kind: 'gps', title: 'Check-In Required', body: 'Start your workday to enable visits', time: 'Today 09:00', read: true },
  ]);

  const login = useCallback((email: string, password: string) => {
    const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return 'No account found for that email.';
    if (found.password !== password) return 'Incorrect password. Hint: demo123 (admin: admin123).';
    const { password: _pw, ...session } = found;
    setUser(session);
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCheckIn({ checkedIn: false, since: null, fix: null, address: '' });
  }, []);

  const logAudit = useCallback((module: string, action: string, record: string) => {
    const uname = user?.name ?? 'System';
    setAudit(a => [{ id: ++aidRef.current, time: nowTime(), user: uname, module, action, record }, ...a].slice(0, 200));
  }, [user]);

  const notify = useCallback((kind: NotifKind, title: string, body: string) => {
    setNotifications(n => [{ id: ++nidRef.current, kind, title, body, time: 'Just now', read: false }, ...n].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }, []);

  const convertLead = useCallback((leadId: string, owner: string, customerStatus: 'Active' | 'Prospect') => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return null;
    const at = nowTime();
    const customer: Customer = {
      id: `cu${++idRef.current}`, code: nextCode('CUS', cusRef.current++), name: lead.company,
      industry: '—', owner, phone: lead.phone, email: '', city: '—', status: customerStatus,
      since: new Date().toISOString().slice(0, 10), revenue: 0,
    };
    const account: Account = {
      id: `a${++acctRef.current}`, name: lead.company, industry: '—', owner,
      contacts: 0, openOpps: 0, revenue: 0, city: '—',
    };
    setCustomers(cs => [customer, ...cs]);
    setAccounts(as => [account, ...as]);
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: 'Won' as const } : l));
    setConversions(cv => [{ leadId, customerId: customer.id, accountId: account.id, at, by: user?.name ?? owner }, ...cv]);
    logAudit('Lead', 'Converted → Customer + Account', lead.code);
    notify('lead', 'Lead Converted', `${lead.company} is now a ${customerStatus} customer`);
    return { customer, account };
  }, [leads, user, logAudit, notify]);

  const stageProb: Record<OppStage, number> = { Prospecting: 15, Qualification: 30, Proposal: 50, Negotiation: 70, Won: 100, Lost: 0 };
  const setOppStage = useCallback((oppId: string, stage: OppStage) => {
    setOpportunities(os => os.map(o => o.id === oppId ? { ...o, stage, probability: stageProb[stage] } : o));
    const opp = opportunities.find(o => o.id === oppId);
    if (opp) {
      logAudit('Opportunity', `Stage → ${stage}`, opp.code);
      if (stage === 'Won') notify('lead', 'Deal Won', `${opp.name} · ${opp.code}`);
    }
  }, [opportunities, logAudit, notify]);

  const requestCheckIn = useCallback(async () => {
    if (checkIn.checkedIn) return { ok: false, source: 'fallback' as const, message: 'Already checked in.' };
    const { fix, source } = await locate();
    setCheckIn({ checkedIn: true, since: new Date(), fix, address: `${fix.lat}, ${fix.lng}` });
    logAudit('Tracking', 'Check-In', source === 'gps' ? `GPS ${fix.lat}, ${fix.lng}` : 'GPS unavailable — fallback fix');
    notify('gps', 'Checked-In', `Workday started at ${nowTime()}`);
    return { ok: true, source, message: source === 'gps' ? 'Checked in with GPS fix.' : 'GPS unavailable — checked in with fallback location.' };
  }, [checkIn.checkedIn, logAudit, notify]);

  const checkOut = useCallback(() => {
    if (!checkIn.checkedIn) return;
    const mins = checkIn.since ? Math.round((Date.now() - checkIn.since.getTime()) / 60000) : 0;
    logAudit('Tracking', 'Check-Out', `Worked ${Math.floor(mins / 60)}h ${mins % 60}m`);
    notify('gps', 'Checked-Out', `Workday ended at ${nowTime()}`);
    setCheckIn({ checkedIn: false, since: null, fix: null, address: '' });
  }, [checkIn, logAudit, notify]);

  const recordVisit = useCallback(({ customer, contact, purpose }: { customer: string; contact: string; purpose: string }) => {
    if (!checkIn.checkedIn) {
      return { ok: false, message: 'Check-In required — you must check in before recording a customer visit.' };
    }
    const visit: Visit = {
      id: `v${++idRef.current}`, employee: user?.name ?? '—', customer,
      checkIn: nowTime(), checkOut: '—', durationMin: 0, purpose,
      outcome: contact ? `With ${contact}` : 'In progress', distanceKm: 0,
    };
    setVisits(vs => [visit, ...vs]);
    logAudit('Visit', 'Started', customer);
    return { ok: true, message: `Visit with ${customer} started at ${visit.checkIn}.` };
  }, [checkIn.checkedIn, user, logAudit]);

  const value = useMemo<CRMStore>(() => ({
    user, login, logout,
    leads, accounts, customers, contacts: seedContacts, opportunities, visits, conversions,
    audit, logAudit, notifications, notify, markAllRead,
    convertLead, setOppStage, checkIn, requestCheckIn, checkOut, recordVisit,
  }), [user, login, logout, leads, accounts, customers, opportunities, visits, conversions,
      audit, logAudit, notifications, notify, markAllRead, convertLead, setOppStage,
      checkIn, requestCheckIn, checkOut, recordVisit]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM(): CRMStore {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}

// ---- RBAC (SRS access matrix) ----
export function navAllowed(role: Role, page: string): boolean {
  const adminOnly = ['companies', 'audit-logs'];
  const noEmployee = ['companies', 'employees', 'customers', 'audit-logs', 'tracking'];
  if (role === 'Super Admin' || role === 'Company Admin') return true;
  if (role === 'Manager') return !adminOnly.includes(page);
  return !noEmployee.includes(page);
}
