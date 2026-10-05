import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LeadModal({ open, onClose, leadId }: { open: boolean; onClose: () => void; leadId?: string }) {
  const { leads, employees, user, createLead, updateLead } = useCRM();
  
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Website');
  const [status, setStatus] = useState('New');
  const [value, setValue] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [companyId, setCompanyId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && leadId) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setName(lead.name || '');
        setCompany(lead.company || '');
        setPhone(lead.phone || '');
        setSource(lead.source || 'Website');
        setStatus(lead.status || 'New');
        setValue(lead.value ? lead.value.toString() : '');
        
        // Find owner ID
        const emp = employees.find(e => e.name === lead.owner);
        setOwnerId(emp ? emp.id : (user?.id || ''));
        setCompanyId(lead.companyId || (user?.companyId || ''));
      }
    } else if (open) {
      setName('');
      setCompany('');
      setPhone('');
      setSource('Website');
      setStatus('New');
      setValue('');
      setOwnerId(user?.id || '');
      setCompanyId(user?.companyId || '');
      setError('');
      setFieldErrors({});
    }
  }, [open, leadId, leads, employees, user]);

  if (!open) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!company.trim()) errors.company = 'Company is required';
    if (!phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) errors.phone = 'Invalid phone format';
    
    if (value && isNaN(Number(value))) errors.value = 'Value must be numeric';
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
        name,
        company,
        phone: phone.replace(/\D/g, ''), // Strip all non-digits for backend validation
        source,
        status,
        value: value ? Number(value) : 0,
        owner_id: Number(ownerId),
        company_id: Number(companyId) || undefined
      };
      
      let res;
      if (leadId) {
        res = await updateLead(leadId, payload);
      } else {
        res = await createLead(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save lead');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to save this record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{leadId ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
          <DialogDescription className="hidden">Fill in the lead details.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-name">Name *</label>
            <Input id="lead-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? "name-error" : undefined} />
            {fieldErrors.name && <p id="name-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.name}</p>}
          </div>
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-company">Company *</label>
            <Input id="lead-company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp" aria-invalid={!!fieldErrors.company} aria-describedby={fieldErrors.company ? "company-error" : undefined} />
            {fieldErrors.company && <p id="company-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.company}</p>}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-phone">Phone *</label>
              <Input id="lead-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1234567890" aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} />
              {fieldErrors.phone && <p id="phone-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-value">Est. Value (₹)</label>
              <Input id="lead-value" type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0" aria-invalid={!!fieldErrors.value} aria-describedby={fieldErrors.value ? "value-error" : undefined} />
              {fieldErrors.value && <p id="value-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.value}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-source">Source *</label>
              <select id="lead-source" required value={source} onChange={e => setSource(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Social Media">Social Media</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Walk-In">Walk-In</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Existing Customer">Existing Customer</option>
                <option value="Employee Reference">Employee Reference</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-status">Status *</label>
              <select id="lead-status" required value={status} onChange={e => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="lead-owner">Owner *</label>
            <select id="lead-owner" value={ownerId} onChange={e => setOwnerId(e.target.value)} aria-invalid={!!fieldErrors.ownerId} aria-describedby={fieldErrors.ownerId ? "owner-error" : undefined} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">-- Select Employee --</option>
              {employees.filter(e => e.status === 'Active' && (!companyId || e.companyId === companyId)).map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
              ))}
            </select>
            {fieldErrors.ownerId && <p id="owner-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.ownerId}</p>}
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
