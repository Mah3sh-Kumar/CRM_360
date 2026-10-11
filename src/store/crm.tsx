// src/store/crm.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Lead, Account, Customer, Contact, Opportunity, Visit, OppStage, Company, Employee, TrackPoint, Activity, Task } from '@/types/models';
import { can } from '@/auth/rbac';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const customFetch = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('crm_token');
  const headers = new Headers(options?.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options?.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Replace hardcoded localhost API prefix with actual env API prefix
  let cleanUrl = url.replace('http://localhost:8000/api', API_BASE_URL);
  
  try {
    const res = await window.fetch(cleanUrl, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('crm_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return res;
  } catch (e) {
    throw e;
  }
};

export type Role = 'Super Admin' | 'Company Admin' | 'Manager' | 'Employee';

export interface SessionUser {
  id: string;
  name: string; 
  email: string; 
  role: Role; 
  code: string;
  companyId: string;
  company: string; 
  designation: string; 
  manager: string;
  mobile: string;
  status: string;
  dateOfJoining: string;
}

export interface AuditEntry { id: number; companyId: string; time: string; user: string; module: string; action: string; record: string; }
export type NotifKind = 'task' | 'meeting' | 'alert' | 'gps' | 'lead' | 'audit';
export interface AppNotification { id: number; companyId: string; kind: NotifKind; title: string; body: string; time: string; read: boolean; }
export interface GeoFix { lat: number; lng: number; }
export interface CheckInState { checkedIn: boolean; since: Date | null; fix: GeoFix | null; address: string; }
export interface Conversion { leadId: string; customerId: string; accountId: string; at: string; by: string; companyId: string; }

function parseApiError(err: any, fallback: string): string {
  if (err?.detail) {
    if (typeof err.detail === "string") return err.detail;
    if (Array.isArray(err.detail)) return err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
    return JSON.stringify(err.detail);
  }
  return fallback;
}

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
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // RBAC Filtered Data
  companies: Company[]; employees: Employee[];
  leads: Lead[]; accounts: Account[]; customers: Customer[];
  contacts: Contact[]; opportunities: Opportunity[]; visits: Visit[];
  trackPoints: TrackPoint[];
  activities: Activity[];
  tasks: Task[];
  meetings: any[];
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
  can: (action: import('@/auth/rbac').Action, module: import('@/auth/rbac').Module, record?: any) => boolean;

  // Company API
  fetchCompanies: () => Promise<void>;
  createCompany: (data: Partial<Company>) => Promise<{ok: boolean, message?: string}>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<{ok: boolean, message?: string}>;

  // Employee API
  fetchEmployees: () => Promise<void>;
  createEmployee: (data: Partial<any>) => Promise<{ok: boolean, message?: string}>;
  updateEmployee: (id: string, data: Partial<any>) => Promise<{ok: boolean, message?: string}>;

  // Customer API
  fetchCustomers: () => Promise<void>;
  createCustomer: (data: Partial<Customer>) => Promise<{ok: boolean, message?: string}>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<{ok: boolean, message?: string}>;

  // Lead API
  fetchLeads: () => Promise<void>;
  createLead: (data: Partial<Lead>) => Promise<{ok: boolean, message?: string}>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<{ok: boolean, message?: string}>;

  // Account API
  fetchAccounts: () => Promise<void>;
  createAccount: (data: Partial<Account>) => Promise<{ok: boolean, message?: string}>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<{ok: boolean, message?: string}>;

  // Contact API
  fetchContacts: () => Promise<void>;
  createContact: (data: Partial<Contact>) => Promise<{ok: boolean, message?: string}>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<{ok: boolean, message?: string}>;

  // Opportunity API
  fetchOpportunities: () => Promise<void>;
  createOpportunity: (data: Partial<Opportunity>) => Promise<{ok: boolean, message?: string}>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<{ok: boolean, message?: string}>;

  // Activity API
  fetchActivities: () => Promise<void>;
  createActivity: (data: Partial<Activity> & { account_id?: number, assigned_employee_id?: number, due_date?: string, activity_type?: string }) => Promise<{ok: boolean, message?: string}>;
  updateActivity: (id: string, data: Partial<Activity> & { assigned_employee_id?: number, due_date?: string, activity_type?: string }) => Promise<{ok: boolean, message?: string}>;

  // Task API
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task> & { assigned_to_id?: number, related_record_id?: number }) => Promise<{ok: boolean, message?: string}>;
  updateTask: (id: string, data: Partial<Task> & { assigned_to_id?: number, related_record_id?: number }) => Promise<{ok: boolean, message?: string}>;
  completeTask: (id: string, remarks?: string) => Promise<{ok: boolean, message?: string}>;
  cancelTask: (id: string) => Promise<{ok: boolean, message?: string}>;
  assignTask: (id: string, assigneeId: number) => Promise<{ok: boolean, message?: string}>;
  deleteTask: (id: string) => Promise<{ok: boolean, message?: string}>;

  // Meeting API
  fetchMeetings: () => Promise<void>;
  createMeeting: (data: any) => Promise<{ok: boolean, message?: string}>;
  updateMeeting: (id: string, data: any) => Promise<{ok: boolean, message?: string}>;
  completeMeeting: (id: string) => Promise<{ok: boolean, message?: string}>;
  cancelMeeting: (id: string) => Promise<{ok: boolean, message?: string}>;

  // Loading and Error states
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

const CRMContext = createContext<CRMStore | null>(null);

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  React.useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (token) {
      customFetch("http://localhost:8000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (!res.ok) throw new Error("Invalid token");
          return res.json();
        })
        .then(me => {
          if (me.id) {
            setUser({ id: me.id.toString(), name: me.name, email: me.email, role: me.role as Role, code: me.employee_code, companyId: me.company_id ? me.company_id.toString() : "", company: me.company || "—", designation: me.designation || "—", manager: me.manager || "—", mobile: me.mobile, status: me.status, dateOfJoining: me.date_of_joining });
          }
        })
        .catch(err => {
          console.error("Auth check failed:", err);
          localStorage.removeItem("crm_token");
          setUser(null);
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  React.useEffect(() => {
    if (user?.role) {
      document.documentElement.setAttribute('data-role', user.role);
    } else {
      document.documentElement.removeAttribute('data-role');
    }
  }, [user?.role]);
  
  const [companiesState, setCompaniesState] = useState<Company[]>([]);
  const [employeesState, setEmployeesState] = useState<Employee[]>([]);
  const [leadsState, setLeads] = useState<Lead[]>([]);
  const [accountsState, setAccounts] = useState<Account[]>([]);
  const [customersState, setCustomers] = useState<Customer[]>([]);
  const [contactsState, setContacts] = useState<Contact[]>([]);
  const [opportunitiesState, setOpportunities] = useState<Opportunity[]>([]);
  const [activitiesState, setActivities] = useState<Activity[]>([]);
  const [tasksState, setTasksState] = useState<Task[]>([]);
  const [meetingsState, setMeetingsState] = useState<any[]>([]);
  const [visitsState, setVisits] = useState<Visit[]>([]);
  const [conversionsState, setConversions] = useState<Conversion[]>([]);
  const [trackPointsState] = useState<TrackPoint[]>([]);
  const [checkIn, setCheckIn] = useState<CheckInState>({ checkedIn: false, since: null, fix: null, address: '' });

  const [loading, setLoadingState] = useState<Record<string, boolean>>({});
  const [error, setErrorState] = useState<Record<string, string | null>>({});

  const setResourceLoading = useCallback((resource: string, isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, [resource]: isLoading }));
  }, []);

  const setResourceError = useCallback((resource: string, err: string | null) => {
    setErrorState(prev => ({ ...prev, [resource]: err }));
  }, []);

  const idRef = useRef(100);
  const nidRef = useRef(10);
  const aidRef = useRef(10);
  const cusRef = useRef(1071);
  const acctRef = useRef(100);

  const [auditState, setAudit] = useState<AuditEntry[]>([
    { id: 1, companyId: 'c1', time: '10:42', user: 'Rohan Kulkarni', module: 'Lead', action: 'Updated', record: 'LD-2205' },
    { id: 2, companyId: 'c1', time: '10:38', user: 'Amit Sharma', module: 'Task', action: 'Completed', record: 'TK-381' },
    { id: 3, companyId: 'c1', time: '10:21', user: 'Aditya Verma', module: 'Employee', action: 'Created', record: 'EMP-108' },
    { id: 4, companyId: 'c1', time: '09:55', user: 'Priya Nair', module: 'Opportunity', action: 'Stage Change', record: 'OPP-3301' },
  ]);

  const [notificationsState, setNotifications] = useState<AppNotification[]>([]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await customFetch("http://localhost:8000/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      if (!res.ok) return "Incorrect email or password.";
      const data = await res.json();
      localStorage.setItem("crm_token", data.access_token);
      
      const meRes = await customFetch("http://localhost:8000/api/auth/me", { headers: { Authorization: `Bearer ${data.access_token}` } });
      if (meRes.ok) {
        const me = await meRes.json();
        setUser({ id: me.id.toString(), name: me.name, email: me.email, role: me.role as Role, code: me.employee_code, companyId: me.company_id ? me.company_id.toString() : "", company: me.company || "—", designation: me.designation || "—", manager: me.manager || "—", mobile: me.mobile, status: me.status, dateOfJoining: me.date_of_joining });
        return null;
      }
      return "Failed to load user profile.";
    } catch (e) { return "Network error. Is the backend running?"; }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("crm_token");
    setUser(null);
    setCheckIn({ checkedIn: false, since: null, fix: null, address: '' });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("crm_token");
    if (!token) return;
    try {
      const meRes = await customFetch("http://localhost:8000/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) {
        const me = await meRes.json();
        setUser({ id: me.id.toString(), name: me.name, email: me.email, role: me.role as Role, code: me.employee_code, companyId: me.company_id ? me.company_id.toString() : "", company: me.company || "—", designation: me.designation || "—", manager: me.manager || "—", mobile: me.mobile, status: me.status, dateOfJoining: me.date_of_joining });
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  }, []);

  const logAudit = useCallback((module: string, action: string, record: string) => {
    const uname = user?.name ?? 'System';
    const cid = user?.companyId ?? 'sys';
    setAudit(a => [{ id: ++aidRef.current, companyId: cid, time: nowTime(), user: uname, module, action, record }, ...a].slice(0, 200));
  }, [user]);

  const notify = useCallback((kind: NotifKind, title: string, body: string) => {
    const cid = user?.companyId ?? 'sys';
    setNotifications(n => [{ id: ++nidRef.current, companyId: cid, kind, title, body, time: 'Just now', read: false }, ...n].slice(0, 50));
  }, [user]);

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }, []);

  const canFn = useCallback((action: import('@/auth/rbac').Action, module: import('@/auth/rbac').Module, record?: any) => {
    return can(action, module, user, record, employeesState);
  }, [user, employeesState]);

  const convertLead = useCallback((leadId: string, owner: string, customerStatus: 'Active' | 'Prospect') => {
    const lead = leadsState.find(l => l.id === leadId);
    if (!lead) return null;
    if (!canFn('EDIT', 'LEAD', lead) || !canFn('CREATE', 'CUSTOMER')) {
      alert('Access Denied: You do not have permission to convert this lead.');
      return null;
    }

    const at = nowTime();
    const customer: Customer = {
      id: `cu${++idRef.current}`, companyId: lead.companyId, code: nextCode('CUS', cusRef.current++), name: lead.company,
      industry: '—', owner, phone: lead.phone, email: '', city: '—', status: customerStatus,
      since: new Date().toISOString().slice(0, 10), revenue: 0,
    };
    const account: Account = {
      id: `a${++acctRef.current}`, companyId: lead.companyId, name: lead.company, industry: '—', owner,
      contacts: 0, openOpps: 0, revenue: 0, city: '—',
    };
    setCustomers(cs => [customer, ...cs]);
    setAccounts(as => [account, ...as]);
    setLeads(ls => ls.map(l => l.id === leadId ? { ...l, status: 'Won' as const } : l));
    setConversions(cv => [{ leadId, customerId: customer.id, accountId: account.id, at, by: user?.name ?? owner, companyId: lead.companyId }, ...cv]);
    logAudit('Lead', 'Converted → Customer + Account', lead.code);
    notify('lead', 'Lead Converted', `${lead.company} is now a ${customerStatus} customer`);
    return { customer, account };
  }, [leadsState, user, logAudit, notify, canFn]);

  const stageProb: Record<OppStage, number> = { Prospecting: 15, Qualification: 30, Proposal: 50, Negotiation: 70, Won: 100, Lost: 0 };
  const setOppStage = useCallback((oppId: string, stage: OppStage) => {
    const opp = opportunitiesState.find(o => o.id === oppId);
    if (opp && !canFn('EDIT', 'OPPORTUNITY', opp)) {
      alert('Access Denied: Cannot modify this opportunity.');
      return;
    }
    setOpportunities(os => os.map(o => o.id === oppId ? { ...o, stage, probability: stageProb[stage] } : o));
    if (opp) {
      logAudit('Opportunity', `Stage → ${stage}`, opp.code);
      if (stage === 'Won') notify('lead', 'Deal Won', `${opp.name} · ${opp.code}`);
    }
  }, [opportunitiesState, logAudit, notify, canFn]);

  const requestCheckIn = useCallback(async () => {
    if (!canFn('CREATE', 'TRACKING')) return { ok: false, source: 'fallback' as const, message: 'Access Denied: Only employees can check-in.' };
    if (checkIn.checkedIn) return { ok: false, source: 'fallback' as const, message: 'Already checked in.' };
    const { fix, source } = await locate();
    setCheckIn({ checkedIn: true, since: new Date(), fix, address: `${fix.lat}, ${fix.lng}` });
    logAudit('Tracking', 'Check-In', source === 'gps' ? `GPS ${fix.lat}, ${fix.lng}` : 'GPS unavailable — fallback fix');
    notify('gps', 'Checked-In', `Workday started at ${nowTime()}`);
    return { ok: true, source, message: source === 'gps' ? 'Checked in with GPS fix.' : 'GPS unavailable — checked in with fallback location.' };
  }, [checkIn.checkedIn, logAudit, notify, canFn]);

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
    if (!canFn('CREATE', 'VISIT')) {
      return { ok: false, message: 'Access Denied: You cannot record visits.' };
    }
    const customerObj = customersState.find(c => c.name === customer);
    const visit: Visit = {
      id: `v${++idRef.current}`, companyId: customerObj?.companyId || (user?.companyId as string), employee: user?.name ?? '—', customer,
      checkIn: nowTime(), checkOut: '—', durationMin: 0, purpose,
      outcome: contact ? `With ${contact}` : 'In progress', distanceKm: 0,
    };
    setVisits(vs => [visit, ...vs]);
    logAudit('Visit', 'Started', customer);
    return { ok: true, message: `Visit with ${customer} started at ${visit.checkIn}.` };
  }, [checkIn.checkedIn, user, logAudit, canFn, customersState]);

  // --- Company API ---
  const fetchCompanies = useCallback(async () => {
    setResourceLoading('companies', true);
    setResourceError('companies', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/companies/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id.toString(),
          companyId: c.id.toString(),
          code: c.company_code,
          name: c.name,
          industry: c.industry || '—',
          city: c.city || '—',
          country: c.country || '—',
          employees: 0,
          status: c.status,
          createdOn: new Date(c.created_date).toISOString().split('T')[0]
        }));
        setCompaniesState(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch companies", e);
      setResourceError('companies', "Unable to load companies. Please try again.");
    } finally {
      setResourceLoading('companies', false);
    }
  }, [setResourceLoading, setResourceError]);


  const createCompany = useCallback(async (data: Partial<Company>) => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await customFetch("http://localhost:8000/api/companies/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          company_code: data.code,
          name: data.name,
          city: data.city,
          country: data.country,
          status: data.status || 'Active'
        })
      });
      if (res.ok) {
        await fetchCompanies();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create company") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchCompanies]);

  const updateCompany = useCallback(async (id: string, data: Partial<Company>) => {
    try {
      const token = localStorage.getItem("crm_token");
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.status) payload.status = data.status;
      if (data.city) payload.city = data.city;
      if (data.country) payload.country = data.country;
      
      const res = await customFetch(`http://localhost:8000/api/companies/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchCompanies();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update company") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchCompanies]);

  const fetchEmployees = useCallback(async () => {
    setResourceLoading('employees', true);
    setResourceError('employees', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/employees/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((e: any) => ({
          id: e.id.toString(),
          companyId: e.company_id ? e.company_id.toString() : "",
          code: e.employee_code,
          name: e.name,
          email: e.email,
          mobile: e.mobile,
          company: companiesState.find(c => c.id === (e.company_id ? e.company_id.toString() : ""))?.name || '—',
          designation: e.designation,
          manager: data.find((m: any) => m.id === e.manager_id)?.name || '—',
          role: e.role,
          gps: e.gps_tracking_enabled,
          status: e.status,
        }));
        setEmployeesState(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch employees", e);
      setResourceError('employees', "Unable to load employees. Please try again.");
    } finally {
      setResourceLoading('employees', false);
    }
  }, [companiesState, setResourceLoading, setResourceError]);

  const createEmployee = useCallback(async (data: Partial<any>) => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await customFetch("http://localhost:8000/api/employees/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchEmployees();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create employee") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (id: string, data: Partial<any>) => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await customFetch(`http://localhost:8000/api/employees/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchEmployees();
        return { ok: true };
      }
      const err = await res.json();
      if (err.detail === "Cannot change own role" || err.detail === "Cannot change own status") {
          return { ok: false, message: err.detail };
      }
      return { ok: false, message: parseApiError(err, "Failed to update employee") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchEmployees]);

  const fetchCustomers = useCallback(async () => {
    setResourceLoading('customers', true);
    setResourceError('customers', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/customers/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id.toString(),
          companyId: c.company_id.toString(),
          code: c.customer_code,
          name: c.name,
          industry: c.industry || '—',
          owner: employeesState.find(e => e.id === c.owner_id.toString())?.name || c.owner_id.toString(),
          phone: c.phone || '',
          email: c.email || '',
          city: c.address ? c.address.split(',')[0] : '—',
          status: c.status,
          since: new Date(c.created_date).toISOString().split('T')[0],
          revenue: 0,
        }));
        setCustomers(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch customers", e);
      setResourceError('customers', "Unable to load customers. Please try again.");
    } finally {
      setResourceLoading('customers', false);
    }
  }, [employeesState, setResourceLoading, setResourceError]);



  const createCustomer = useCallback(async (data: Partial<Customer> & { owner_id?: number, company_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await customFetch("http://localhost:8000/api/customers/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          customer_code: data.code,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.city, // Mapped to city for simplicity
          status: data.status || 'Active',
          owner_id: data.owner_id || Number(data.owner),
          company_id: data.company_id || Number(data.companyId)
        })
      });
      if (res.ok) {
        await fetchCustomers();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create customer") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchCustomers]);

  const updateCustomer = useCallback(async (id: string, data: Partial<Customer> & { owner_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.status) payload.status = data.status;
      if (data.phone) payload.phone = data.phone;
      if (data.email) payload.email = data.email;
      if (data.city) payload.address = data.city;
      if (data.owner_id) payload.owner_id = data.owner_id;
      else if (data.owner) payload.owner_id = Number(data.owner);

      const res = await customFetch(`http://localhost:8000/api/customers/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchCustomers();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update customer") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchCustomers]);

  const fetchLeads = useCallback(async () => {
    setResourceLoading('leads', true);
    setResourceError('leads', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/leads/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id.toString(),
          companyId: c.company_id.toString(),
          code: `LD-${c.id}`,
          name: c.lead_name,
          company: c.company_name || '—',
          source: c.lead_source,
          status: c.status,
          owner: employeesState.find((e: any) => e.id === c.assigned_employee_id.toString())?.name || c.assigned_employee_id.toString(),
          value: c.expected_revenue || 0,
          createdOn: new Date(c.created_date).toISOString().split('T')[0],
          phone: c.mobile_number
        }));
        setLeads(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch leads", e);
      setResourceError('leads', "Unable to load leads. Please try again.");
    } finally {
      setResourceLoading('leads', false);
    }
  }, [employeesState, setResourceLoading, setResourceError]);

  const createLead = useCallback(async (data: Partial<Lead> & { owner_id?: number, company_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await customFetch("http://localhost:8000/api/leads/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          lead_name: data.name,
          company_name: data.company,
          contact_person: data.name,
          mobile_number: data.phone,
          lead_source: data.source || 'Website',
          status: data.status || 'New',
          expected_revenue: data.value,
          assigned_employee_id: data.owner_id || Number(data.owner),
          company_id: data.company_id || Number(data.companyId)
        })
      });
      if (res.ok) {
        await fetchLeads();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create lead") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchLeads]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead> & { owner_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      const payload: any = {};
      if (data.name) { payload.lead_name = data.name; payload.contact_person = data.name; }
      if (data.company) payload.company_name = data.company;
      if (data.status) payload.status = data.status;
      if (data.phone) payload.mobile_number = data.phone;
      if (data.source) payload.lead_source = data.source;
      if (data.value !== undefined) payload.expected_revenue = data.value;
      if (data.owner_id) payload.assigned_employee_id = data.owner_id;
      else if (data.owner && !isNaN(Number(data.owner))) payload.assigned_employee_id = Number(data.owner);

      const res = await customFetch(`http://localhost:8000/api/leads/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchLeads();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update lead") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchLeads]);

  const fetchAccounts = useCallback(async () => {
    setResourceLoading('accounts', true);
    setResourceError('accounts', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/accounts/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((a: any) => ({
          id: a.id.toString(),
          companyId: a.company_id.toString(),
          code: a.code,
          name: a.name,
          industry: a.industry || '—',
          owner: employeesState.find((e: any) => e.id === a.owner_id.toString())?.name || a.owner_id.toString(),
          contacts: 0,
          openOpps: 0,
          revenue: a.annual_revenue || 0,
          city: a.address ? a.address.split(',')[0] : '—',
          status: a.status,
          website: a.website,
          email: a.email_address,
          phone: a.phone_number
        }));
        setAccounts(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch accounts", e);
      setResourceError('accounts', "Unable to load accounts. Please try again.");
    } finally {
      setResourceLoading('accounts', false);
    }
  }, [employeesState, setResourceLoading, setResourceError]);

  const createAccount = useCallback(async (data: Partial<Account> & { owner_id?: number, company_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      const res = await customFetch("http://localhost:8000/api/accounts/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          code: data.code,
          name: data.name,
          industry: data.industry,
          website: data.website,
          email_address: data.email,
          phone_number: data.phone,
          status: data.status || 'Active',
          annual_revenue: data.revenue,
          address: data.city,
          owner_id: data.owner_id || Number(data.owner),
          company_id: data.company_id || Number(data.companyId)
        })
      });
      if (res.ok) {
        await fetchAccounts();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create account") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (id: string, data: Partial<Account> & { owner_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.industry) payload.industry = data.industry;
      if (data.website) payload.website = data.website;
      if (data.email) payload.email_address = data.email;
      if (data.phone) payload.phone_number = data.phone;
      if (data.status) payload.status = data.status;
      if (data.revenue !== undefined) payload.annual_revenue = data.revenue;
      if (data.city) payload.address = data.city;
      if (data.owner_id) payload.owner_id = data.owner_id;
      else if (data.owner && !isNaN(Number(data.owner))) payload.owner_id = Number(data.owner);

      const res = await customFetch(`http://localhost:8000/api/accounts/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchAccounts();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update account") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchAccounts]);

  // --- Contact API ---
  const fetchContacts = useCallback(async () => {
    setResourceLoading('contacts', true);
    setResourceError('contacts', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/contacts/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id.toString(),
          companyId: c.company_id.toString(),
          name: `${c.first_name} ${c.last_name}`,
          title: c.designation || '—',
          email: c.email_address || '',
          phone: c.mobile_number,
          account: accountsState.find((a: any) => a.id === c.account_id.toString())?.name || c.account_id.toString(),
          status: c.status,
          owner: employeesState.find((e: any) => e.id === c.owner_id.toString())?.name || c.owner_id.toString(),
          notes: c.notes
        }));
        setContacts(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch contacts", e);
      setResourceError('contacts', "Unable to load contacts. Please try again.");
    } finally {
      setResourceLoading('contacts', false);
    }
  }, [employeesState, accountsState, setResourceLoading, setResourceError]);

  const createContact = useCallback(async (data: Partial<Contact> & { owner?: string, owner_id?: number, account_id?: number, first_name?: string, last_name?: string }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      let first = data.first_name || '';
      let last = data.last_name || '';
      if (data.name && (!first || !last)) {
        const parts = data.name.split(' ');
        first = parts[0];
        last = parts.slice(1).join(' ') || 'User';
      }

      // We need to resolve account_id if data.account is passed as name
      let accId = data.account_id;
      if (!accId && data.account) {
        const acc = accountsState.find(a => a.name === data.account || a.id === data.account);
        if (acc) accId = Number(acc.id);
      }
      
      const res = await customFetch("http://localhost:8000/api/contacts/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          first_name: first || 'Unknown',
          last_name: last || 'User',
          designation: data.title,
          mobile_number: data.phone || '000',
          email_address: data.email,
          status: data.status || 'Active',
          notes: data.notes,
          account_id: accId || 0,
          owner_id: data.owner_id || Number(data.owner)
        })
      });
      if (res.ok) {
        await fetchContacts();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create contact") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchContacts, accountsState]);

  const updateContact = useCallback(async (id: string, data: Partial<Contact> & { owner?: string, owner_id?: number, account_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      const payload: any = {};
      if (data.name) {
        const parts = data.name.split(' ');
        payload.first_name = parts[0];
        payload.last_name = parts.slice(1).join(' ') || 'User';
      }
      if (data.title) payload.designation = data.title;
      if (data.email) payload.email_address = data.email;
      if (data.phone) payload.mobile_number = data.phone;
      if (data.status) payload.status = data.status;
      if (data.notes) payload.notes = data.notes;
      if (data.owner_id) payload.owner_id = data.owner_id;
      else if (data.owner && !isNaN(Number(data.owner))) payload.owner_id = Number(data.owner);

      if (data.account_id) {
        payload.account_id = data.account_id;
      } else if (data.account) {
        const acc = accountsState.find(a => a.name === data.account || a.id === data.account);
        if (acc) payload.account_id = Number(acc.id);
      }

      const res = await customFetch(`http://localhost:8000/api/contacts/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchContacts();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update contact") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchContacts, accountsState]);
  // --- Opportunity API ---
  const fetchOpportunities = useCallback(async () => {
    setResourceLoading('opportunities', true);
    setResourceError('opportunities', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/opportunities/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((o: any) => ({
          id: o.id.toString(),
          companyId: o.company_id.toString(),
          code: `OPP-${o.id}`,
          name: o.name,
          account: accountsState.find((a: any) => a.id === o.account_id.toString())?.name || o.account_id.toString(),
          owner: employeesState.find((e: any) => e.id === o.owner_id.toString())?.name || o.owner_id.toString(),
          stage: o.stage,
          expectedRevenue: Number(o.expected_revenue),
          probability: Number(o.probability),
          closeDate: new Date(o.expected_close_date).toISOString().split('T')[0],
          status: o.status
        }));
        setOpportunities(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch opportunities", e);
      setResourceError('opportunities', "Unable to load opportunities. Please try again.");
    } finally {
      setResourceLoading('opportunities', false);
    }
  }, [employeesState, accountsState, setResourceLoading, setResourceError]);

  const createOpportunity = useCallback(async (data: Partial<Opportunity> & { owner_id?: number, account_id?: number }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      let accId = data.account_id;
      if (!accId && data.account) {
        const acc = accountsState.find(a => a.name === data.account || a.id === data.account);
        if (acc) accId = Number(acc.id);
      }
      
      const res = await customFetch("http://localhost:8000/api/opportunities/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: data.name,
          account_id: accId || 0,
          owner_id: data.owner_id || Number(data.owner || 0),
          stage: data.stage || 'Prospecting',
          expected_revenue: data.expectedRevenue || 0,
          expected_close_date: data.closeDate ? new Date(data.closeDate).toISOString() : new Date().toISOString()
        })
      });
      if (res.ok) {
        await fetchOpportunities();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create opportunity") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchOpportunities, accountsState]);

  const updateOpportunity = useCallback(async (id: string, data: Partial<Opportunity> & { owner_id?: number, account_id?: number, lost_reason?: string }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      const payload: any = {};
      if (data.name) payload.name = data.name;
      if (data.stage) payload.stage = data.stage;
      if (data.expectedRevenue !== undefined) payload.expected_revenue = data.expectedRevenue;
      if (data.closeDate) payload.expected_close_date = new Date(data.closeDate).toISOString();
      if (data.lost_reason) payload.lost_reason = data.lost_reason;
      
      if (data.owner_id) payload.owner_id = data.owner_id;
      else if (data.owner && !isNaN(Number(data.owner))) payload.owner_id = Number(data.owner);

      if (data.account_id) {
        payload.account_id = data.account_id;
      } else if (data.account) {
        const acc = accountsState.find(a => a.name === data.account || a.id === data.account);
        if (acc) payload.account_id = Number(acc.id);
      }

      const res = await customFetch(`http://localhost:8000/api/opportunities/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchOpportunities();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update opportunity") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchOpportunities, accountsState]);


  // --- Activity API ---
  const fetchActivities = useCallback(async () => {
    setResourceLoading('activities', true);
    setResourceError('activities', null);
    try {
      const token = localStorage.getItem("crm_token");
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/activities/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((a: any) => ({
          id: a.id.toString(),
          companyId: a.company_id.toString(),
          type: a.activity_type,
          subject: a.subject || a.activity_type,
          relatedTo: accountsState.find((acc: any) => acc.id === a.account_id.toString())?.name || a.account_id.toString(),
          owner: employeesState.find((e: any) => e.id === a.assigned_employee_id.toString())?.name || a.assigned_employee_id.toString(),
          due: new Date(a.due_date).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ''),
          status: a.status
        }));
        setActivities(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch activities", e);
      setResourceError('activities', "Unable to load activities. Please try again.");
    } finally {
      setResourceLoading('activities', false);
    }
  }, [employeesState, accountsState, setResourceLoading, setResourceError]);

  const createActivity = useCallback(async (data: Partial<Activity> & { account_id?: number, assigned_employee_id?: number, due_date?: string, activity_type?: string }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      let accId = data.account_id;
      if (!accId && data.relatedTo) {
        const acc = accountsState.find(a => a.name === data.relatedTo || a.id === data.relatedTo);
        if (acc) accId = Number(acc.id);
      }

      let ownerId = data.assigned_employee_id;
      if (!ownerId && data.owner) {
        const emp = employeesState.find(e => e.name === data.owner || e.id === data.owner);
        if (emp) ownerId = Number(emp.id);
      }

      const res = await customFetch("http://localhost:8000/api/activities/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          activity_type: data.activity_type || data.type,
          subject: data.subject,
          account_id: accId || 0,
          assigned_employee_id: ownerId || Number(user?.id),
          due_date: data.due_date || (data.due ? new Date(data.due).toISOString() : new Date().toISOString()),
          status: data.status || 'Scheduled'
        })
      });
      if (res.ok) {
        await fetchActivities();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to create activity") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchActivities, accountsState, employeesState, user]);

  const updateActivity = useCallback(async (id: string, data: Partial<Activity> & { assigned_employee_id?: number, due_date?: string, activity_type?: string }) => {
    try {
      const token = localStorage.getItem("crm_token");
      
      const payload: any = {};
      if (data.subject) payload.subject = data.subject;
      if (data.status) payload.status = data.status;
      if (data.activity_type || data.type) payload.activity_type = data.activity_type || data.type;
      
      if (data.due_date) payload.due_date = data.due_date;
      else if (data.due) payload.due_date = new Date(data.due).toISOString();

      if (data.assigned_employee_id) {
        payload.assigned_employee_id = data.assigned_employee_id;
      } else if (data.owner) {
        const emp = employeesState.find(e => e.name === data.owner || e.id === data.owner);
        if (emp) payload.assigned_employee_id = Number(emp.id);
      }

      const res = await customFetch(`http://localhost:8000/api/activities/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchActivities();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, "Failed to update activity") };
    } catch (e) {
      return { ok: false, message: "Network error" };
    }
  }, [fetchActivities, employeesState]);

  // --- Task API ---
  const fetchTasks = useCallback(async () => {
    setResourceLoading('tasks', true);
    setResourceError('tasks', null);
    try {
      const token = localStorage.getItem('crm_token');
      if (!token) throw new Error("No token");
      const res = await customFetch('http://localhost:8000/api/tasks/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((t: any) => ({
          id: t.id.toString(),
          companyId: t.company_id.toString(),
          title: t.title,
          description: t.description,
          related: t.related_module,
          relatedRecordId: t.related_record_id,
          assignee: employeesState.find((e: any) => e.id.toString() === t.assigned_to_id.toString())?.name || t.assigned_to_id.toString(),
          assigneeId: t.assigned_to_id.toString(),
          priority: t.priority,
          status: t.status,
          due: new Date(t.due_date).toISOString().split('T')[0]
        }));
        setTasksState(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
      setResourceError('tasks', "Unable to load tasks. Please try again.");
    } finally {
      setResourceLoading('tasks', false);
    }
  }, [employeesState, setResourceLoading, setResourceError]);

  const createTask = useCallback(async (data: Partial<Task> & { assigned_to_id?: number, related_record_id?: number }) => {
    try {
      const token = localStorage.getItem('crm_token');
      
      let relatedId = data.related_record_id;
      if (!relatedId) {
          // just send 1 for testing if not provided, or fetch the right one
          relatedId = 1;
      }
      let assignId = data.assigned_to_id;
      if (!assignId) {
          assignId = Number(user?.id) || 1;
      }

      const res = await customFetch('http://localhost:8000/api/tasks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: data.title,
          related_module: data.related || 'Account',
          related_record_id: relatedId,
          assigned_to_id: assignId,
          priority: data.priority || 'Medium',
          due_date: data.due ? new Date(data.due).toISOString() : new Date(Date.now() + 86400000).toISOString()
        })
      });
      if (res.ok) {
        await fetchTasks();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to create task') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchTasks, user]);

  const updateTask = useCallback(async (id: string, data: Partial<Task> & { assigned_to_id?: number, related_record_id?: number }) => {
    try {
      const token = localStorage.getItem('crm_token');
      const payload: any = {};
      if (data.title) payload.title = data.title;
      if (data.priority) payload.priority = data.priority;
      if (data.due) payload.due_date = new Date(data.due).toISOString();
      
      const res = await customFetch(`http://localhost:8000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchTasks();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to update task') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchTasks]);

  const completeTask = useCallback(async (id: string, remarks?: string) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completion_remarks: remarks || '' })
      });
      if (res.ok) {
        await fetchTasks();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to complete task') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchTasks]);

  const cancelTask = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/tasks/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchTasks();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to cancel task') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchTasks]);

  const fetchMeetings = useCallback(async () => {
    setResourceLoading('meetings', true);
    setResourceError('meetings', null);
    try {
      const token = localStorage.getItem('crm_token');
      if (!token) throw new Error("No token");
      const res = await customFetch("http://localhost:8000/api/meetings/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((m: any) => ({
          ...m,
          id: m.id.toString(),
          companyId: m.company_id?.toString() || '',
          title: m.title,
          type: m.meeting_type,
          organizer: employeesState.find((e: any) => e.id.toString() === m.organizer_id.toString())?.name || m.organizer_id.toString(),
          organizerId: m.organizer_id.toString(),
          start: new Date(m.start_datetime).toISOString(),
          end: new Date(m.end_datetime).toISOString(),
          location: m.location,
          agenda: m.agenda,
          status: m.status,
          date: new Date(m.start_datetime).toISOString().split('T')[0],
          time: new Date(m.start_datetime).toISOString().split('T')[1].substring(0,5),
          mode: m.location ? 'In-Person' : 'Online'
        }));
        setMeetingsState(mapped);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error("Failed to fetch meetings", e);
      setResourceError('meetings', "Unable to load meetings. Please try again.");
    } finally {
      setResourceLoading('meetings', false);
    }
  }, [setResourceLoading, setResourceError]);

  const createMeeting = useCallback(async (data: any) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch("http://localhost:8000/api/meetings/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchMeetings();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to create meeting') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchMeetings]);

  const updateMeeting = useCallback(async (id: string, data: any) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchMeetings();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to update meeting') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchMeetings]);

  const completeMeeting = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/meetings/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchMeetings();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to complete meeting') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchMeetings]);

  const cancelMeeting = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/meetings/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchMeetings();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to cancel meeting') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchMeetings]);

  const assignTask = useCallback(async (id: string, assigneeId: number) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/tasks/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assigned_to_id: assigneeId })
      });
      if (res.ok) {
        await fetchTasks();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to assign task') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('crm_token');
      const res = await customFetch(`http://localhost:8000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        await fetchTasks();
        return { ok: true };
      }
      const err = await res.json();
      return { ok: false, message: parseApiError(err, 'Failed to delete task') };
    } catch (e) { return { ok: false, message: 'Network error' }; }
  }, [fetchTasks]);

  React.useEffect(() => {
    if (user) {
      fetchCompanies();
      fetchEmployees();
      fetchCustomers();
      fetchLeads();
      fetchAccounts();
      fetchContacts();
      fetchOpportunities();
      fetchActivities();
      fetchTasks();
      fetchMeetings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  // RBAC Scoped Data
  // Security Requirement: The frontend consumes already-scoped backend responses.
  // We no longer download global datasets and filter them locally.
  const scopedCompanies = companiesState;
  const scopedEmployees = employeesState;
  const scopedLeads = leadsState;
  const scopedAccounts = accountsState;
  const scopedCustomers = customersState;
  const scopedContacts = contactsState;
  const scopedOpps = opportunitiesState;
  const scopedActivities = activitiesState;
  const scopedTasks = tasksState;
  const scopedMeetings = meetingsState;
  const scopedVisits = visitsState;
  const scopedTrackPoints = trackPointsState;
  
  // Audits and Notifications only scoped by Tenant Isolation for simplicity here
  const scopedAudit = useMemo(() => user?.role === 'Super Admin' ? auditState : auditState.filter(a => a.companyId === user?.companyId), [auditState, user]);
  const scopedNotifications = useMemo(() => user?.role === 'Super Admin' ? notificationsState : notificationsState.filter(a => a.companyId === user?.companyId), [notificationsState, user]);
  const scopedConversions = useMemo(() => user?.role === 'Super Admin' ? conversionsState : conversionsState.filter(c => c.companyId === user?.companyId), [conversionsState, user]);

  const value = useMemo<CRMStore>(() => ({
    user, isInitializing, login, logout, refreshUser, can: canFn,
    companies: scopedCompanies, employees: scopedEmployees,
    leads: scopedLeads, accounts: scopedAccounts, customers: scopedCustomers, 
    contacts: scopedContacts, opportunities: scopedOpps, activities: scopedActivities, tasks: scopedTasks, meetings: scopedMeetings, visits: scopedVisits, conversions: scopedConversions,
    trackPoints: scopedTrackPoints,
    audit: scopedAudit, logAudit, notifications: scopedNotifications, notify, markAllRead,
    convertLead, setOppStage, checkIn, requestCheckIn, checkOut, recordVisit,
    loading, error,
    fetchCompanies, createCompany, updateCompany,
    fetchEmployees, createEmployee, updateEmployee,
    fetchCustomers, createCustomer, updateCustomer,
    fetchLeads, createLead, updateLead,
    fetchAccounts, createAccount, updateAccount,
    fetchContacts, createContact, updateContact,
    fetchOpportunities, createOpportunity, updateOpportunity,
    fetchActivities, createActivity, updateActivity,
    fetchTasks, createTask, updateTask, completeTask, cancelTask, assignTask, deleteTask,
    fetchMeetings, createMeeting, updateMeeting, completeMeeting, cancelMeeting
  }), [
    user, isInitializing, login, logout, refreshUser, canFn,
    scopedCompanies, scopedEmployees,
    scopedLeads, scopedAccounts, scopedCustomers, scopedContacts, scopedOpps, scopedActivities, scopedTasks, scopedMeetings, scopedVisits, scopedConversions,
    scopedTrackPoints,
    scopedAudit, logAudit, scopedNotifications, notify, markAllRead,
    convertLead, setOppStage, checkIn, requestCheckIn, checkOut, recordVisit,
    loading, error,
    fetchCompanies, createCompany, updateCompany,
    fetchEmployees, createEmployee, updateEmployee,
    fetchCustomers, createCustomer, updateCustomer,
    fetchLeads, createLead, updateLead,
    fetchAccounts, createAccount, updateAccount,
    fetchContacts, createContact, updateContact,
    fetchOpportunities, createOpportunity, updateOpportunity,
    fetchActivities, createActivity, updateActivity,
    fetchTasks, createTask, updateTask, completeTask, cancelTask, assignTask, deleteTask,
    fetchMeetings, createMeeting, updateMeeting, completeMeeting, cancelMeeting
  ]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
}

export function useCRM(): CRMStore {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}



