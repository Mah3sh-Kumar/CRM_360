// CRM 360 — frontend prototype data layer (SRS-aligned entities)

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
export type OppStage = 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
export type TaskStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ActivityStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Company { id: string; companyId: string; code: string; name: string; industry: string; city: string; country: string; employees: number; status: 'Active' | 'Inactive'; createdOn: string; }
export interface Employee { id: string; companyId: string; code: string; name: string; email: string; mobile: string; company: string; designation: string; manager: string; department: string; status: 'Active' | 'On Leave' | 'Inactive'; gps: boolean; role: 'Super Admin' | 'Company Admin' | 'Manager' | 'Employee'; }
export interface Customer { id: string; companyId: string; code: string; name: string; industry: string; owner: string; phone: string; email: string; city: string; status: 'Prospect' | 'Active' | 'Inactive'; since: string; revenue: number; }
export interface Lead { id: string; companyId: string; code: string; name: string; company: string; source: string; status: LeadStatus; owner: string; value: number; createdOn: string; phone: string; }
export interface Account { id: string; companyId: string; code?: string; name: string; industry: string; owner: string; contacts: number; openOpps: number; revenue: number; city: string; website?: string; email?: string; phone?: string; status?: string; }
export interface Contact { id: string; companyId: string; name: string; account: string; title: string; email: string; phone: string; primary: boolean; status?: string; notes?: string; }
export interface Opportunity { id: string; companyId: string; code: string; name: string; account: string; stage: OppStage; probability: number; expectedRevenue: number; closeDate: string; owner: string; }
export interface Activity { id: string; companyId: string; type: 'Call' | 'Email' | 'Visit' | 'Demo' | 'Follow-Up'; subject: string; relatedTo: string; owner: string; due: string; status: ActivityStatus; }
export interface Task { id: string; companyId: string; title: string; related: string; assignee: string; priority: TaskPriority; status: TaskStatus; due: string; }
export interface Meeting { id: string; companyId: string; title: string; account: string; date: string; time: string; mode: 'In-Person' | 'Video' | 'Phone'; organizer: string; status: 'Scheduled' | 'Completed' | 'Cancelled'; }
export interface Visit { id: string; companyId: string; employee: string; customer: string; checkIn: string; checkOut: string; durationMin: number; purpose: string; outcome: string; distanceKm: number; }
export interface TrackPoint { companyId: string; employee: string; status: 'Checked-In' | 'Checked-Out' | 'On Leave'; since: string; visitsToday: number; kmToday: number; x: number; y: number; lastArea: string; }

export const companies: Company[] = [
  { id: 'c1', companyId: 'c1', code: 'CMP-001', name: 'Apex Industries', industry: 'Manufacturing', city: 'Pune', country: 'India', employees: 42, status: 'Active', createdOn: '2025-02-11' },
  { id: 'c2', companyId: 'c2', code: 'CMP-002', name: 'Northwind Traders', industry: 'Distribution', city: 'Mumbai', country: 'India', employees: 28, status: 'Active', createdOn: '2025-03-02' },
  { id: 'c3', companyId: 'c3', code: 'CMP-003', name: 'Helios Energy', industry: 'Renewables', city: 'Bengaluru', country: 'India', employees: 19, status: 'Active', createdOn: '2025-05-21' },
  { id: 'c4', companyId: 'c4', code: 'CMP-004', name: 'Bluepeak Logistics', industry: 'Logistics', city: 'Delhi NCR', country: 'India', employees: 33, status: 'Inactive', createdOn: '2025-06-14' },
];

export const employees: Employee[] = [
  { id: 'e1', companyId: 'c1', code: 'EMP-001', name: 'Arjun Mehta', email: 'arjun.mehta@apex.io', mobile: '+91 98220 41117', company: 'Apex Industries', designation: 'Sales Director', manager: '—', department: 'Sales', status: 'Active', gps: true, role: 'Company Admin' },
  { id: 'e2', companyId: 'c1', code: 'EMP-002', name: 'Priya Nair', email: 'priya.nair@apex.io', mobile: '+91 98671 22009', company: 'Apex Industries', designation: 'Regional Manager', manager: 'Arjun Mehta', department: 'Sales', status: 'Active', gps: true, role: 'Manager' },
  { id: 'e3', companyId: 'c1', code: 'EMP-003', name: 'Rohan Kulkarni', email: 'rohan.k@apex.io', mobile: '+91 99700 83124', company: 'Apex Industries', designation: 'Field Sales Executive', manager: 'Priya Nair', department: 'Sales', status: 'Active', gps: true, role: 'Employee' },
  { id: 'e4', companyId: 'c1', code: 'EMP-004', name: 'Sana Sheikh', email: 'sana.s@apex.io', mobile: '+91 98200 76410', company: 'Apex Industries', designation: 'Field Sales Executive', manager: 'Priya Nair', department: 'Sales', status: 'Active', gps: true, role: 'Employee' },
  { id: 'e5', companyId: 'c2', code: 'EMP-005', name: 'Vikram Rao', email: 'vikram.r@northwind.co', mobile: '+91 98110 55342', company: 'Northwind Traders', designation: 'Account Manager', manager: 'Arjun Mehta', department: 'Accounts', status: 'On Leave', gps: false, role: 'Employee' },
  { id: 'e6', companyId: 'c3', code: 'EMP-006', name: 'Meera Iyer', email: 'meera.i@helios.in', mobile: '+91 97420 19876', company: 'Helios Energy', designation: 'Sales Executive', manager: 'Priya Nair', department: 'Sales', status: 'Active', gps: true, role: 'Employee' },
  { id: 'e7', companyId: 'c4', code: 'EMP-007', name: 'Dev Patel', email: 'dev.p@bluepeak.co', mobile: '+91 96540 33218', company: 'Bluepeak Logistics', designation: 'Field Agent', manager: 'Priya Nair', department: 'Operations', status: 'Inactive', gps: false, role: 'Employee' },
];

export const customers: Customer[] = [
  { id: 'cu1', companyId: 'c1', code: 'CUS-1042', name: 'Trident Auto Components', industry: 'Automotive', owner: 'Rohan Kulkarni', phone: '+91 20 6742 8800', email: 'procurement@tridentauto.in', city: 'Pune', status: 'Active', since: '2025-04-18', revenue: 4280000 },
  { id: 'cu2', companyId: 'c1', code: 'CUS-1057', name: 'Kaveri Foods Ltd', industry: 'FMCG', owner: 'Sana Sheikh', phone: '+91 80 4117 2231', email: 'purchase@kaverifoods.com', city: 'Bengaluru', status: 'Active', since: '2025-05-30', revenue: 2650000 },
  { id: 'cu3', companyId: 'c1', code: 'CUS-1061', name: 'Sterling Pharma', industry: 'Pharmaceuticals', owner: 'Meera Iyer', phone: '+91 22 4890 1177', email: 'sourcing@sterlingpharma.in', city: 'Mumbai', status: 'Prospect', since: '2026-08-12', revenue: 0 },
  { id: 'cu4', companyId: 'c1', code: 'CUS-1033', name: 'Orbit Textiles', industry: 'Textiles', owner: 'Rohan Kulkarni', phone: '+91 261 245 9020', email: 'orders@orbittextiles.co', city: 'Surat', status: 'Active', since: '2025-03-07', revenue: 1875000 },
  { id: 'cu5', companyId: 'c1', code: 'CUS-1070', name: 'Falcon Packaging', industry: 'Packaging', owner: 'Vikram Rao', phone: '+91 124 678 3340', email: 'buy@falconpack.in', city: 'Gurugram', status: 'Inactive', since: '2025-09-22', revenue: 940000 },
];

export const leads: Lead[] = [
  { id: 'l1', companyId: 'c1', code: 'LD-2201', name: 'Nikhil Bansal', company: 'Bansal Retail Group', source: 'Website', status: 'New', owner: 'Sana Sheikh', value: 350000, createdOn: '2026-09-28', phone: '+91 98100 22114' },
  { id: 'l2', companyId: 'c1', code: 'LD-2197', name: 'Aarti Joshi', company: 'Joshi Healthcare', source: 'Referral', status: 'Contacted', owner: 'Rohan Kulkarni', value: 520000, createdOn: '2026-09-25', phone: '+91 98901 44567' },
  { id: 'l3', companyId: 'c1', code: 'LD-2190', name: 'Farhan Ali', company: 'Ali Constructions', source: 'Trade Show', status: 'Qualified', owner: 'Meera Iyer', value: 1200000, createdOn: '2026-09-20', phone: '+91 98600 78231' },
  { id: 'l4', companyId: 'c1', code: 'LD-2184', name: 'Ritu Malhotra', company: 'Malhotra Exports', source: 'Cold Call', status: 'Proposal Sent', owner: 'Priya Nair', value: 870000, createdOn: '2026-09-15', phone: '+91 98118 90233' },
  { id: 'l5', companyId: 'c1', code: 'LD-2176', name: 'Karan Shah', company: 'Shah Electronics', source: 'Website', status: 'Negotiation', owner: 'Rohan Kulkarni', value: 640000, createdOn: '2026-09-08', phone: '+91 99230 11456' },
  { id: 'l6', companyId: 'c1', code: 'LD-2169', name: 'Divya Menon', company: 'Menon Logistics', source: 'Partner', status: 'Won', owner: 'Sana Sheikh', value: 980000, createdOn: '2026-08-30', phone: '+91 98470 66542' },
  { id: 'l7', companyId: 'c1', code: 'LD-2162', name: 'Sanjay Gupta', company: 'Gupta Hardware', source: 'Cold Call', status: 'Lost', owner: 'Meera Iyer', value: 210000, createdOn: '2026-08-24', phone: '+91 98104 33908' },
  { id: 'l8', companyId: 'c1', code: 'LD-2205', name: 'Tanvi Kaur', company: 'Kaur Agro', source: 'Referral', status: 'New', owner: 'Rohan Kulkarni', value: 410000, createdOn: '2026-09-30', phone: '+91 98760 12773' },
];

export const accounts: Account[] = [
  { id: 'a1', companyId: 'c1', name: 'Trident Auto Components', industry: 'Automotive', owner: 'Rohan Kulkarni', contacts: 4, openOpps: 2, revenue: 4280000, city: 'Pune' },
  { id: 'a2', companyId: 'c1', name: 'Kaveri Foods Ltd', industry: 'FMCG', owner: 'Sana Sheikh', contacts: 3, openOpps: 1, revenue: 2650000, city: 'Bengaluru' },
  { id: 'a3', companyId: 'c1', name: 'Sterling Pharma', industry: 'Pharmaceuticals', owner: 'Meera Iyer', contacts: 2, openOpps: 2, revenue: 0, city: 'Mumbai' },
  { id: 'a4', companyId: 'c1', name: 'Orbit Textiles', industry: 'Textiles', owner: 'Rohan Kulkarni', contacts: 2, openOpps: 1, revenue: 1875000, city: 'Surat' },
];

export const contacts: Contact[] = [
  { id: 'ct1', companyId: 'c1', name: 'Suresh Rane', account: 'Trident Auto Components', title: 'Head of Procurement', email: 's.rane@tridentauto.in', phone: '+91 98220 11445', primary: true },
  { id: 'ct2', companyId: 'c1', name: 'Anita Deshpande', account: 'Trident Auto Components', title: 'Plant Manager', email: 'a.deshpande@tridentauto.in', phone: '+91 98600 77231', primary: false },
  { id: 'ct3', companyId: 'c1', name: 'Mohan Pai', account: 'Kaveri Foods Ltd', title: 'Purchase Director', email: 'mohan.pai@kaverifoods.com', phone: '+91 98450 22110', primary: true },
  { id: 'ct4', companyId: 'c1', name: 'Leela Krishnan', account: 'Kaveri Foods Ltd', title: 'Supply Chain Lead', email: 'leela.k@kaverifoods.com', phone: '+91 97410 88334', primary: false },
  { id: 'ct5', companyId: 'c1', name: 'Dr. Imran Qureshi', account: 'Sterling Pharma', title: 'VP Sourcing', email: 'i.qureshi@sterlingpharma.in', phone: '+91 98200 55671', primary: true },
  { id: 'ct6', companyId: 'c1', name: 'Jignesh Patel', account: 'Orbit Textiles', title: 'Owner', email: 'jignesh@orbittextiles.co', phone: '+91 98251 44902', primary: true },
];

export const opportunities: Opportunity[] = [
  { id: 'o1', companyId: 'c1', code: 'OPP-3301', name: 'Trident — Annual tooling contract', account: 'Trident Auto Components', stage: 'Negotiation', probability: 70, expectedRevenue: 2400000, closeDate: '2026-10-15', owner: 'Rohan Kulkarni' },
  { id: 'o2', companyId: 'c1', code: 'OPP-3308', name: 'Sterling — Cold chain supply', account: 'Sterling Pharma', stage: 'Proposal', probability: 50, expectedRevenue: 1750000, closeDate: '2026-11-02', owner: 'Meera Iyer' },
  { id: 'o3', companyId: 'c1', code: 'OPP-3312', name: 'Kaveri — Q4 distribution deal', account: 'Kaveri Foods Ltd', stage: 'Qualification', probability: 30, expectedRevenue: 900000, closeDate: '2026-11-20', owner: 'Sana Sheikh' },
  { id: 'o4', companyId: 'c1', code: 'OPP-3315', name: 'Orbit — Fabric export line', account: 'Orbit Textiles', stage: 'Prospecting', probability: 15, expectedRevenue: 620000, closeDate: '2026-12-10', owner: 'Rohan Kulkarni' },
  { id: 'o5', companyId: 'c1', code: 'OPP-3290', name: 'Trident — Spares framework', account: 'Trident Auto Components', stage: 'Won', probability: 100, expectedRevenue: 1880000, closeDate: '2026-09-18', owner: 'Rohan Kulkarni' },
  { id: 'o6', companyId: 'c1', code: 'OPP-3288', name: 'Sterling — Lab equipment', account: 'Sterling Pharma', stage: 'Lost', probability: 0, expectedRevenue: 540000, closeDate: '2026-09-05', owner: 'Meera Iyer' },
];

export const activities: Activity[] = [
  { id: 'ac1', companyId: 'c1', type: 'Call', subject: 'Quarterly pricing review', relatedTo: 'Trident Auto Components', owner: 'Rohan Kulkarni', due: '2026-10-01 10:30', status: 'Scheduled' },
  { id: 'ac2', companyId: 'c1', type: 'Visit', subject: 'Plant walkthrough — Line 3', relatedTo: 'Trident Auto Components', owner: 'Rohan Kulkarni', due: '2026-10-02 14:00', status: 'Scheduled' },
  { id: 'ac3', companyId: 'c1', type: 'Email', subject: 'Proposal follow-up', relatedTo: 'Sterling Pharma', owner: 'Meera Iyer', due: '2026-09-30 17:00', status: 'Completed' },
  { id: 'ac4', companyId: 'c1', type: 'Demo', subject: 'Product demo — packaging line', relatedTo: 'Kaveri Foods Ltd', owner: 'Sana Sheikh', due: '2026-10-03 11:00', status: 'Scheduled' },
  { id: 'ac5', companyId: 'c1', type: 'Follow-Up', subject: 'Contract redlines', relatedTo: 'Orbit Textiles', owner: 'Rohan Kulkarni', due: '2026-09-29 16:00', status: 'Completed' },
  { id: 'ac6', companyId: 'c1', type: 'Call', subject: 'Renewal intent check', relatedTo: 'Falcon Packaging', owner: 'Vikram Rao', due: '2026-09-27 12:00', status: 'Cancelled' },
];

export const tasks: Task[] = [];

export const meetings: Meeting[] = [
  { id: 'm1', companyId: 'c1', title: 'Contract finalisation review', account: 'Trident Auto Components', date: '2026-10-02', time: '10:00', mode: 'In-Person', organizer: 'Priya Nair', status: 'Scheduled' },
  { id: 'm2', companyId: 'c1', title: 'Cold chain proposal walkthrough', account: 'Sterling Pharma', date: '2026-10-03', time: '15:30', mode: 'Video', organizer: 'Meera Iyer', status: 'Scheduled' },
  { id: 'm3', companyId: 'c1', title: 'Q4 volume planning', account: 'Kaveri Foods Ltd', date: '2026-10-06', time: '11:30', mode: 'In-Person', organizer: 'Sana Sheikh', status: 'Scheduled' },
  { id: 'm4', companyId: 'c1', title: 'Spares framework sign-off', account: 'Trident Auto Components', date: '2026-09-18', time: '16:00', mode: 'Video', organizer: 'Rohan Kulkarni', status: 'Completed' },
  { id: 'm5', companyId: 'c1', title: 'Export line discovery call', account: 'Orbit Textiles', date: '2026-09-25', time: '12:00', mode: 'Phone', organizer: 'Rohan Kulkarni', status: 'Completed' },
];

export const visits: Visit[] = [
  { id: 'v1', companyId: 'c1', employee: 'Rohan Kulkarni', customer: 'Trident Auto Components', checkIn: '09:42', checkOut: '11:15', durationMin: 93, purpose: 'Contract discussion', outcome: 'Positive — redlines agreed', distanceKm: 14.2 },
  { id: 'v2', companyId: 'c1', employee: 'Sana Sheikh', customer: 'Kaveri Foods Ltd', checkIn: '10:05', checkOut: '10:58', durationMin: 53, purpose: 'Demo scheduling', outcome: 'Demo fixed for 03 Oct', distanceKm: 9.6 },
  { id: 'v3', companyId: 'c1', employee: 'Meera Iyer', customer: 'Sterling Pharma', checkIn: '11:30', checkOut: '12:45', durationMin: 75, purpose: 'Requirement gathering', outcome: 'Proposal inputs collected', distanceKm: 18.4 },
  { id: 'v4', companyId: 'c1', employee: 'Rohan Kulkarni', customer: 'Orbit Textiles', checkIn: '14:10', checkOut: '15:02', durationMin: 52, purpose: 'Follow-up', outcome: 'Awaiting internal approval', distanceKm: 22.7 },
];

export const trackPoints: TrackPoint[] = [
  { companyId: 'c1', employee: 'Rohan Kulkarni', status: 'Checked-In', since: '09:12', visitsToday: 2, kmToday: 36.9, x: 62, y: 34, lastArea: 'Chakan MIDC' },
  { companyId: 'c1', employee: 'Sana Sheikh', status: 'Checked-In', since: '08:55', visitsToday: 1, kmToday: 12.3, x: 30, y: 58, lastArea: 'HSR Layout' },
  { companyId: 'c1', employee: 'Meera Iyer', status: 'Checked-In', since: '09:40', visitsToday: 1, kmToday: 21.8, x: 48, y: 72, lastArea: 'Andheri East' },
  { companyId: 'c1', employee: 'Vikram Rao', status: 'On Leave', since: '—', visitsToday: 0, kmToday: 0, x: 78, y: 60, lastArea: '—' },
];

export const leadSources = ['Website', 'Referral', 'Cold Call', 'Trade Show', 'Partner'];

export const fmtINR = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)} Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)} L` : `₹${n.toLocaleString('en-IN')}`;
