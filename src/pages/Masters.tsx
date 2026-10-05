// src/pages/Masters.tsx — customers tab now store-backed + click-through.
import React from 'react';
// (companies & employees tabs unchanged)
import { PageHeader, DataTable, StatusBadge, Toolbar, FilterChip, NewButton, ImportExport, Mono, ErrorState } from '@/components/shared';
import type { Tone } from '@/components/shared';
import { fmtINR } from '@/data/mock';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const empTone = (s: string): Tone => s === 'Active' ? 'green' : s === 'On Leave' ? 'amber' : 'gray';
const cusTone = (s: string): Tone => s === 'Active' ? 'green' : s === 'Prospect' ? 'blue' : 'gray';

export default function Masters({ tab, onOpen }: { tab: 'companies' | 'employees' | 'customers'; onOpen?: (id: string) => void }) {
  const crm = useCRM();
  const { customers, companies, employees } = crm;

  const [showCompanyModal, setShowCompanyModal] = React.useState(false);
  const [showEmpModal, setShowEmpModal] = React.useState(false);
  const [showCustModal, setShowCustModal] = React.useState(false);
  const [formData, setFormData] = React.useState({ code: '', name: '', city: '', country: '', status: 'Active' });
  const [empForm, setEmpForm] = React.useState({
    employee_code: '', name: '', email: '', mobile: '', role: 'Employee',
    company_id: '', designation: '', manager_id: '', date_of_joining: new Date().toISOString().slice(0,10), password: ''
  });
  const [custForm, setCustForm] = React.useState({
    code: '', name: '', city: '', email: '', phone: '', companyId: '', ownerId: '', status: 'Active'
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = formData as Partial<any>;
    const res = await crm.createCompany(payload);
    if (res.ok) {
      setShowCompanyModal(false);
      setFormData({ code: '', name: '', city: '', country: '', status: 'Active' });
    } else {
      setError(res.message || 'Failed to create company');
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const res = await crm.updateCompany(id, { status: newStatus });
    if (!res.ok) alert(res.message);
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      ...empForm,
      company_id: empForm.company_id ? parseInt(empForm.company_id) : null,
      manager_id: empForm.manager_id ? parseInt(empForm.manager_id) : null,
    };
    const res = await crm.createEmployee(payload);
    if (res.ok) {
      setShowEmpModal(false);
      setEmpForm({
        employee_code: '', name: '', email: '', mobile: '', role: 'Employee',
        company_id: '', designation: '', manager_id: '', date_of_joining: new Date().toISOString().slice(0,10), password: ''
      });
    } else {
      setError(res.message || 'Failed to create employee');
    }
    setLoading(false);
  };

  const handleEmpStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const res = await crm.updateEmployee(id, { status: newStatus });
    if (!res.ok) alert(res.message);
  };

  const handleCustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload: any = { ...custForm, owner_id: custForm.ownerId ? parseInt(custForm.ownerId) : null };
    if (custForm.companyId) payload.company_id = parseInt(custForm.companyId);
    
    const res = await crm.createCustomer(payload);
    if (res.ok) {
      setShowCustModal(false);
      setCustForm({ code: '', name: '', city: '', email: '', phone: '', companyId: '', ownerId: '', status: 'Active' });
    } else {
      setError(res.message || 'Failed to create customer');
    }
    setLoading(false);
  };

  const handleCustStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const res = await crm.updateCustomer(id, { status: newStatus });
    if (!res.ok) alert(res.message);
  };

  if (tab === 'companies') return (
    <div className="space-y-5 relative">
      <PageHeader kicker="Masters · Module 17" title="Companies"
        sub="Primary organisational entity. Multi-company deployment with complete data isolation. Company Code must be unique."
        action={<><ImportExport />{crm.can('CREATE', 'COMPANY') && <NewButton label="Create Company" onClick={() => setShowCompanyModal(true)} />}</>} />
      <Toolbar placeholder="Search companies…"><FilterChip label="Active" active /><FilterChip label="Inactive" /></Toolbar>
      {crm.error.companies ? (
        <ErrorState title="Failed to load companies" message={crm.error.companies} onRetry={crm.fetchCompanies} />
      ) : (
        <DataTable
          loading={crm.loading.companies}
          head={['Code', 'Company', 'Industry', 'City', 'Country', 'Employees', 'Status', 'Created On', 'Actions']}
          rows={companies.map(c => [
            <Mono className="text-muted-foreground">{c.code}</Mono>,
            <span className="font-medium">{c.name}</span>,
            <span className="text-muted-foreground">{c.industry}</span>,
            c.city, c.country,
            <Mono>{c.employees}</Mono>,
            <StatusBadge label={c.status} tone={c.status === 'Active' ? 'green' : 'gray'} />,
            <Mono className="text-muted-foreground">{c.createdOn}</Mono>,
            <div className="flex gap-2">
              {crm.can('EDIT', 'COMPANY') && (
                <button 
                  onClick={() => handleStatusChange(c.id, c.status)} 
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ])}
        />
      )}

      <Dialog open={showCompanyModal} onOpenChange={(isOpen) => !isOpen && !loading && setShowCompanyModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Company</DialogTitle></DialogHeader>
          <form onSubmit={handleCompanySubmit} className="mt-2 space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Company Code *</label>
              <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. COMP-01" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Company Name *</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Acme Corp" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">City</label>
                <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Country</label>
                <Input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="e.g. India" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCompanyModal(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (tab === 'employees') return (
    <div className="space-y-5 relative">
      <PageHeader kicker="Masters · Module 18" title="Employees"
        sub="Central user repository. Reporting manager defines hierarchy visibility. GPS tracking opt-in controls geo module access."
        action={<><ImportExport />{crm.can('CREATE', 'EMPLOYEE') && <NewButton label="Create Employee" onClick={() => setShowEmpModal(true)} />}</>} />
      <Toolbar placeholder="Search employees…"><FilterChip label="All Companies" active /><FilterChip label="GPS Enabled" /></Toolbar>
      {crm.error.employees ? (
        <ErrorState title="Failed to load employees" message={crm.error.employees} onRetry={crm.fetchEmployees} />
      ) : (
        <DataTable
          loading={crm.loading.employees}
          head={['Code', 'Employee', 'Email', 'Company', 'Designation', 'Reports To', 'Role', 'GPS', 'Status', 'Actions']}
          rows={employees.map(e => [
            <Mono className="text-muted-foreground">{e.code}</Mono>,
            <div><div className="font-medium">{e.name}</div><Mono className="text-muted-foreground">{e.mobile}</Mono></div>,
            <Mono className="text-muted-foreground">{e.email}</Mono>,
            <span className="text-muted-foreground">{e.company}</span>,
            e.designation,
            <span className="text-muted-foreground">{e.manager}</span>,
            <StatusBadge label={e.role} tone={e.role === 'Company Admin' ? 'ink' : e.role === 'Manager' ? 'blue' : 'sage'} />,
            <StatusBadge label={e.gps ? 'On' : 'Off'} tone={e.gps ? 'green' : 'gray'} />,
            <StatusBadge label={e.status} tone={empTone(e.status)} />,
            <div className="flex gap-2">
              {crm.can('EDIT', 'EMPLOYEE') && e.id !== crm.user?.id && (
                <button 
                  onClick={() => handleEmpStatusChange(e.id, e.status)} 
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  {e.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ])}
        />
      )}

      <Dialog open={showEmpModal} onOpenChange={(isOpen) => !isOpen && !loading && setShowEmpModal(false)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Employee</DialogTitle></DialogHeader>
          <form onSubmit={handleEmpSubmit} className="mt-2 space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Code *</label>
                <Input required value={empForm.employee_code} onChange={e => setEmpForm({...empForm, employee_code: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Name *</label>
                <Input required value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Email *</label>
                <Input required type="email" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Mobile *</label>
                <Input required value={empForm.mobile} onChange={e => setEmpForm({...empForm, mobile: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Password *</label>
                <Input required type="password" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Role *</label>
                <select required value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {crm.user?.role === 'Super Admin' && <option>Super Admin</option>}
                  {(crm.user?.role === 'Super Admin' || crm.user?.role === 'Company Admin') && <option>Company Admin</option>}
                  <option>Manager</option>
                  <option>Employee</option>
                </select>
              </div>
              {crm.user?.role === 'Super Admin' && (
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Company</label>
                  <select value={empForm.company_id} onChange={e => setEmpForm({...empForm, company_id: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">-- Select --</option>
                    {companies.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Manager</label>
                <select value={empForm.manager_id} onChange={e => setEmpForm({...empForm, manager_id: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">-- Select --</option>
                  {employees.filter(e => e.status === 'Active' && (!empForm.company_id || e.companyId === empForm.company_id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Designation *</label>
                <Input required value={empForm.designation} onChange={e => setEmpForm({...empForm, designation: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Joining Date *</label>
                <Input required type="date" value={empForm.date_of_joining} onChange={e => setEmpForm({...empForm, date_of_joining: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEmpModal(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader kicker="Masters · Module 19" title="Customers"
        sub="Lifecycle: Prospect → Active → Inactive. Created directly or through lead conversion. Click a customer to open Customer 360."
        action={<><ImportExport />{crm.can('CREATE', 'CUSTOMER') && <NewButton label="Create Customer" onClick={() => setShowCustModal(true)} />}</>} />
      <Toolbar placeholder="Search customers…"><FilterChip label="All Statuses" active /><FilterChip label="All Owners" /></Toolbar>
      {crm.error.customers ? (
        <ErrorState title="Failed to load customers" message={crm.error.customers} onRetry={crm.fetchCustomers} />
      ) : (
        <DataTable<any>
          loading={crm.loading.customers}
          columns={[
            { header: 'Code', accessorKey: 'code', sortable: true, sortType: 'text', cell: (c) => <Mono className="text-muted-foreground">{c.code}</Mono> },
            { header: 'Customer', accessorKey: 'name', sortable: true, sortType: 'text', cell: (c) => onOpen ? <button onClick={() => onOpen(c.id)} className="font-medium text-link hover:underline">{c.name}</button> : <span className="font-medium">{c.name}</span> },
            { header: 'Industry', accessorKey: 'industry', sortable: true, sortType: 'text', cell: (c) => <span className="text-muted-foreground">{c.industry}</span> },
            { header: 'City', accessorKey: 'city', sortable: true, sortType: 'text' },
            { header: 'Owner', accessorKey: 'owner', sortable: true, sortType: 'text' },
            { header: 'Contact', accessorKey: 'phone', sortable: true, sortType: 'text', cell: (c) => <div><Mono className="text-muted-foreground">{c.phone}</Mono><div className="font-mono2 text-[10.5px] text-muted-foreground">{c.email}</div></div> },
            { header: 'Status', accessorKey: 'status', sortable: true, sortType: 'text', cell: (c) => <StatusBadge label={c.status} tone={cusTone(c.status)} /> },
            { header: 'Customer Since', accessorKey: 'since', sortable: true, sortType: 'date', cell: (c) => <Mono className="text-muted-foreground">{c.since}</Mono> },
            { header: 'Revenue', accessorKey: 'revenue', sortable: true, sortType: 'number', cell: (c) => <span className="font-display font-semibold">{c.revenue ? fmtINR(c.revenue) : '—'}</span> },
            { header: 'Actions', sortable: false, cell: (c) => (
              <div className="flex gap-2">
                {crm.can('EDIT', 'CUSTOMER', c) && (
                  <button 
                    onClick={() => handleCustStatusChange(c.id, c.status)} 
                    className="text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    {c.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            )}
          ]}
          data={customers}
          pagination
          defaultPageSize={10}
          emptyMessage="No customers found."
        />
      )}

      <Dialog open={showCustModal} onOpenChange={(isOpen) => !isOpen && !loading && setShowCustModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleCustSubmit} className="mt-2 space-y-4">
            {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Code *</label>
                <Input required value={custForm.code} onChange={e => setCustForm({...custForm, code: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Name *</label>
                <Input required value={custForm.name} onChange={e => setCustForm({...custForm, name: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Email</label>
                <Input type="email" value={custForm.email} onChange={e => setCustForm({...custForm, email: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Phone</label>
                <Input value={custForm.phone} onChange={e => setCustForm({...custForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">City/Address</label>
                <Input value={custForm.city} onChange={e => setCustForm({...custForm, city: e.target.value})} />
              </div>
              {crm.user?.role === 'Super Admin' && (
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Company *</label>
                  <select required value={custForm.companyId} onChange={e => setCustForm({...custForm, companyId: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">-- Select --</option>
                    {companies.filter(c => c.status === 'Active').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Owner *</label>
                <select required value={custForm.ownerId} onChange={e => setCustForm({...custForm, ownerId: e.target.value})} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">-- Select --</option>
                  {employees.filter(e => e.status === 'Active' && (!custForm.companyId || e.companyId === custForm.companyId) && (!crm.user || crm.user.role === 'Super Admin' || e.companyId === crm.user.companyId)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCustModal(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
