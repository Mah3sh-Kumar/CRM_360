import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AccountModal({ open, onClose, accountId }: { open: boolean; onClose: () => void; accountId?: string }) {
  const { accounts, employees, user, createAccount, updateAccount } = useCRM();
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');
  const [revenue, setRevenue] = useState('');
  const [city, setCity] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [companyId, setCompanyId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && accountId) {
      const acc = accounts.find(a => a.id === accountId);
      if (acc) {
        setCode(acc.code || '');
        setName(acc.name || '');
        setIndustry(acc.industry !== '—' ? acc.industry : '');
        setWebsite((acc as any).website || '');
        setEmail((acc as any).email || '');
        setPhone((acc as any).phone || '');
        setStatus(acc.status || 'Active');
        setRevenue(acc.revenue ? acc.revenue.toString() : '');
        setCity(acc.city !== '—' ? acc.city : '');
        
        const emp = employees.find(e => e.name === acc.owner);
        setOwnerId(emp ? emp.id : (user?.id || ''));
        setCompanyId(acc.companyId || (user?.companyId || ''));
      }
    } else if (open) {
      setCode('');
      setName('');
      setIndustry('');
      setWebsite('');
      setEmail('');
      setPhone('');
      setStatus('Active');
      setRevenue('');
      setCity('');
      setOwnerId(user?.id || '');
      setCompanyId(user?.companyId || '');
      setError('');
      setFieldErrors({});
    }
  }, [open, accountId, accounts, employees, user]);

  if (!open) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!code.trim()) errors.code = 'Code is required';
    if (!name.trim()) errors.name = 'Name is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) errors.phone = 'Invalid phone format';
    if (revenue && isNaN(Number(revenue))) errors.revenue = 'Revenue must be numeric';
    if (!ownerId) errors.ownerId = 'Owner is required';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setError('');
    setLoading(true);
    
    try {
      const payload: any = {
        code, name, industry, website, email, phone, status,
        revenue: revenue ? Number(revenue) : 0,
        city,
        owner_id: Number(ownerId),
        company_id: Number(companyId) || undefined
      };
      
      let res;
      if (accountId) {
        res = await updateAccount(accountId, payload);
      } else {
        res = await createAccount(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save account');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to save this record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{accountId ? 'Edit Account' : 'Create Account'}</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-code">Account Code *</label>
              <Input id="acc-code" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. ACC-001" aria-invalid={!!fieldErrors.code} />
              {fieldErrors.code && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.code}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-name">Account Name *</label>
              <Input id="acc-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.name}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-industry">Industry</label>
              <Input id="acc-industry" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Technology" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-city">City</label>
              <Input id="acc-city" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-email">Email</label>
              <Input id="acc-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@acme.com" aria-invalid={!!fieldErrors.email} />
              {fieldErrors.email && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-phone">Phone</label>
              <Input id="acc-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1234567890" aria-invalid={!!fieldErrors.phone} />
              {fieldErrors.phone && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-website">Website</label>
              <Input id="acc-website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-revenue">Annual Revenue (₹)</label>
              <Input id="acc-revenue" type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="0" aria-invalid={!!fieldErrors.revenue} />
              {fieldErrors.revenue && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.revenue}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-status">Status *</label>
              <select id="acc-status" required value={status} onChange={e => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="acc-owner">Owner *</label>
              <select id="acc-owner" value={ownerId} onChange={e => setOwnerId(e.target.value)} aria-invalid={!!fieldErrors.ownerId} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.status === 'Active' && (!companyId || e.companyId === companyId)).map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
              {fieldErrors.ownerId && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.ownerId}</p>}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
