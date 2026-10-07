import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { User, Mail, Phone, Hash, Building2, ShieldCheck, Key, Loader2, Save, CheckCircle2, FileText, Briefcase, Activity, Landmark, Users, HandCoins, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/shared';

export default function Profile() {
  const crm = useCRM();
  const user = crm.user;
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'security' | 'work' | 'activity'>('overview');
  
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password states
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email, mobile: user.mobile });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'overview' && !stats) {
      fetchStats();
    } else if (activeTab === 'activity' && auditLogs.length === 0) {
      fetchAudit();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('crm_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/profile/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchAudit = async () => {
    setLoadingAudit(true);
    try {
      const token = localStorage.getItem('crm_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/audit/?limit=50&user_id=${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const token = localStorage.getItem('crm_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/profile/`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg('Profile updated successfully!');
        setEditMode(false);
        await crm.refreshUser();
      } else {
        setErrorMsg(data.detail || 'Failed to update profile');
      }
    } catch (e) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      setPassError('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    setPassError('');
    setPassSuccess('');
    
    try {
      const token = localStorage.getItem('crm_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_URL}/profile/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(passwords)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPassSuccess('Password changed successfully! You may need to log in again.');
        setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setPassError(data.detail || 'Failed to change password');
      }
    } catch (e) {
      setPassError('Network error. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  const initials = user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const renderStats = () => {
    if (loadingStats) return <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
    if (!stats) return null;

    const cards = [];
    
    if (user.role === 'Super Admin') {
      cards.push({ label: 'Companies', value: stats.totalCompanies, icon: Landmark, color: 'text-primary' });
      cards.push({ label: 'Employees', value: stats.totalEmployees, icon: Users, color: 'text-sage' });
      cards.push({ label: 'Customers', value: stats.totalCustomers, icon: Building2, color: 'text-primary' });
      cards.push({ label: 'Opportunities', value: stats.totalOpportunities, icon: HandCoins, color: 'text-amber-500' });
    } else if (user.role === 'Company Admin') {
      cards.push({ label: 'Employees', value: stats.companyEmployees, icon: Users, color: 'text-sage' });
      cards.push({ label: 'Active', value: stats.activeEmployees, icon: CheckCircle2, color: 'text-success' });
      cards.push({ label: 'Customers', value: stats.customers, icon: Building2, color: 'text-primary' });
      cards.push({ label: 'Opportunities', value: stats.opportunities, icon: HandCoins, color: 'text-amber-500' });
    } else if (user.role === 'Manager') {
      cards.push({ label: 'Team Size', value: stats.teamSize, icon: Users, color: 'text-sage' });
      cards.push({ label: 'Team Opportunities', value: stats.teamOpportunities, icon: HandCoins, color: 'text-amber-500' });
      cards.push({ label: 'Team Tasks', value: stats.teamTasks, icon: Activity, color: 'text-primary' });
      cards.push({ label: 'Team Attendance', value: stats.teamAttendance, icon: CheckCircle2, color: 'text-success' });
    } else {
      cards.push({ label: 'Assigned Leads', value: stats.assignedLeads, icon: User, color: 'text-primary' });
      cards.push({ label: 'Open Opportunities', value: stats.openOpportunities, icon: HandCoins, color: 'text-amber-500' });
      cards.push({ label: 'Pending Tasks', value: stats.pendingTasks, icon: Activity, color: 'text-primary' });
      cards.push({ label: 'Attendance Days', value: stats.attendanceSummary, icon: CheckCircle2, color: 'text-success' });
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const bgTone = c.color.replace('text-', 'bg-').replace('-500', '-500/10').replace('text-sage', 'bg-sage/10');
          return (
            <div key={i} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
              <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${bgTone} ${c.color}`}>
                <c.icon className="size-5.5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl font-bold tracking-tight text-foreground">{c.value}</div>
                <div className="truncate text-[12.5px] font-medium text-muted-foreground">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-36 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 md:h-48" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="relative -mt-12 flex flex-col items-start gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-card bg-gradient-to-b from-slate-800 to-black font-mono2 text-3xl font-bold text-white shadow-xl sm:size-32 sm:text-4xl">
                {initials}
              </div>
              <div className="space-y-1.5 pt-2 sm:pt-0 sm:pb-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{user.name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5"><Briefcase className="size-4" /> {user.designation}</span>
                  <span className="hidden sm:inline text-border">•</span>
                  <span className="flex items-center gap-1.5"><Building2 className="size-4" /> {user.company}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 sm:pb-2">
              <StatusBadge label={user.status} tone={user.status === 'Active' ? 'green' : 'gray'} />
              <div className="inline-flex items-center rounded-full border border-border bg-secondary/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-foreground shadow-sm">
                {user.role}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-3 sm:gap-4 text-[13px]">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted/60 cursor-default">
              <Hash className="size-4 text-sage" /> {user.code}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted/60 cursor-default">
              <Mail className="size-4 text-sage" /> {user.email}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted/60 cursor-default">
              <Phone className="size-4 text-sage" /> {user.mobile}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'work', label: 'Work Details', icon: Briefcase },
          { id: 'security', label: 'Security', icon: ShieldCheck },
          { id: 'activity', label: 'Activity Logs', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors ${activeTab === tab.id ? 'border-sage text-sage' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Performance Snapshot</h2>
              {renderStats()}
            </div>
          </div>
        )}

        {/* PERSONAL TAB */}
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">Personal Information</h3>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-secondary">
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="p-6">
                {successMsg && (
                  <div className="mb-4 rounded-md border border-success-border bg-success-bg p-3 text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="mb-4 rounded-md border border-destructive-border bg-destructive-bg p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" /> {errorMsg}
                  </div>
                )}
                
                <form onSubmit={handleProfileSubmit} className="max-w-xl space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      disabled={!editMode}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                      disabled={!editMode}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Mobile Number</label>
                    <input 
                      type="text" 
                      value={formData.mobile} 
                      onChange={e => setFormData(f => ({ ...f, mobile: e.target.value }))}
                      disabled={!editMode}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50" 
                    />
                  </div>
                  
                  {editMode && (
                    <div className="flex gap-2 pt-4">
                      <button type="submit" disabled={saving} className="flex h-10 items-center gap-2 rounded-md bg-sage px-4 text-sm font-medium text-white transition-colors hover:bg-sage/90">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save Changes
                      </button>
                      <button type="button" onClick={() => { setEditMode(false); setFormData({ name: user.name, email: user.email, mobile: user.mobile }); }} className="h-10 rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-secondary">
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* WORK TAB */}
        {activeTab === 'work' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">Employment Details</h3>
              </div>
              <div className="p-6">
                <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Employee Code</dt>
                    <dd className="mt-1 font-medium">{user.code}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Company</dt>
                    <dd className="mt-1 font-medium">{user.company}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Designation</dt>
                    <dd className="mt-1 font-medium">{user.designation}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">System Role</dt>
                    <dd className="mt-1 font-medium">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Reporting Manager</dt>
                    <dd className="mt-1 font-medium">{user.manager}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Date of Joining</dt>
                    <dd className="mt-1 font-medium">{user.dateOfJoining}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">Change Password</h3>
              </div>
              <div className="p-6">
                {passSuccess && (
                  <div className="mb-4 rounded-md border border-success-border bg-success-bg p-3 text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> {passSuccess}
                  </div>
                )}
                {passError && (
                  <div className="mb-4 rounded-md border border-destructive-border bg-destructive-bg p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4" /> {passError}
                  </div>
                )}
                
                <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <input 
                      type="password" 
                      value={passwords.current_password} 
                      onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <input 
                      type="password" 
                      value={passwords.new_password} 
                      onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                      required
                      minLength={6}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwords.confirm_password} 
                      onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
                      required
                      minLength={6}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                    />
                  </div>
                  
                  <div className="pt-2">
                    <button type="submit" disabled={changingPassword} className="flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90">
                      {changingPassword ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">Recent Activity Logs</h3>
              </div>
              
              {loadingAudit ? (
                <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No recent activity found.</div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 font-medium">Date & Time</th>
                        <th className="px-6 py-3 font-medium">Module</th>
                        <th className="px-6 py-3 font-medium">Action</th>
                        <th className="px-6 py-3 font-medium">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="transition-colors hover:bg-muted/50">
                          <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 font-medium text-foreground">{log.module}</td>
                          <td className="px-6 py-3 text-muted-foreground">{log.action}</td>
                          <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{log.ip_address || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
