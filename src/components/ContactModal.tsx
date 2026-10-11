import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContactModal({ open, onClose, contactId }: { open: boolean; onClose: () => void; contactId?: string }) {
  const { contacts, accounts, employees, user, createContact, updateContact } = useCRM();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Active');
  const [accountId, setAccountId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && contactId) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        // Simple split, assuming name is "First Last"
        const parts = (contact.name || '').split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        
        setEmail((contact as any).email || '');
        setPhone((contact as any).phone || '');
        setTitle((contact as any).title || '');
        setStatus(contact.status || 'Active');
        
        const acc = accounts.find(a => a.name === (contact as any).account);
        setAccountId(acc ? acc.id : '');
        
        const emp = employees.find(e => e.name === (contact as any).owner);
        setOwnerId(emp ? emp.id : (user?.id || ''));
      }
    } else if (open) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setTitle('');
      setStatus('Active');
      setAccountId('');
      setOwnerId(user?.id || '');
      setError('');
      setFieldErrors({});
    }
  }, [open, contactId, contacts, accounts, employees, user]);

  if (!open) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''))) errors.phone = 'Invalid phone format';
    if (!accountId) errors.accountId = 'Account is required';
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
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        title: title,
        status,
        account_id: Number(accountId),
        owner_id: Number(ownerId),
      };
      
      let res;
      if (contactId) {
        res = await updateContact(contactId, payload);
      } else {
        res = await createContact(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save contact');
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
          <DialogTitle>{contactId ? 'Edit Contact' : 'Create Contact'}</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-first-name">First Name *</label>
              <Input id="contact-first-name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. John" aria-invalid={!!fieldErrors.firstName} aria-describedby={fieldErrors.firstName ? "fn-error" : undefined} />
              {fieldErrors.firstName && <p id="fn-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.firstName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-last-name">Last Name *</label>
              <Input id="contact-last-name" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Doe" aria-invalid={!!fieldErrors.lastName} aria-describedby={fieldErrors.lastName ? "ln-error" : undefined} />
              {fieldErrors.lastName && <p id="ln-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.lastName}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-email">Email</label>
              <Input id="contact-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
              {fieldErrors.email && <p id="email-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-phone">Phone</label>
              <Input id="contact-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1234567890" aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? "phone-error" : undefined} />
              {fieldErrors.phone && <p id="phone-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-title">Designation / Title</label>
            <Input id="contact-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Marketing Director" />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-account">Account *</label>
            <select id="contact-account" value={accountId} onChange={e => setAccountId(e.target.value)} aria-invalid={!!fieldErrors.accountId} aria-describedby={fieldErrors.accountId ? "account-error" : undefined} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">-- Select Account --</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {fieldErrors.accountId && <p id="account-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.accountId}</p>}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-status">Status *</label>
              <select id="contact-status" required value={status} onChange={e => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="contact-owner">Owner *</label>
              <select id="contact-owner" value={ownerId} onChange={e => setOwnerId(e.target.value)} aria-invalid={!!fieldErrors.ownerId} aria-describedby={fieldErrors.ownerId ? "owner-error" : undefined} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.status === 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
              {fieldErrors.ownerId && <p id="owner-error" className="mt-1 text-[11px] text-destructive">{fieldErrors.ownerId}</p>}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
