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

export const leadSources = ['Website', 'Referral', 'Cold Call', 'Trade Show', 'Partner'];
