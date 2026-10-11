import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OpportunityModal({ open, onClose, opportunityId }: { open: boolean; onClose: () => void; opportunityId?: string }) {
  const { opportunities, accounts, employees, user, createOpportunity, updateOpportunity } = useCRM();
  
  const [name, setName] = useState('');
  const [stage, setStage] = useState('Prospecting');
  const [expectedRevenue, setExpectedRevenue] = useState('');
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && opportunityId) {
      const opp = opportunities.find(o => o.id === opportunityId);
      if (opp) {
        setName(opp.name || '');
        setStage(opp.stage || 'Prospecting');
        setExpectedRevenue(opp.expectedRevenue ? opp.expectedRevenue.toString() : '');
        setCloseDate(opp.closeDate ? new Date(opp.closeDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        
        const acc = accounts.find(a => a.name === opp.account);
        setAccountId(acc ? acc.id : '');
        
        const emp = employees.find(e => e.name === opp.owner);
        setOwnerId(emp ? emp.id : (user?.id || ''));
      }
    } else if (open) {
      setName('');
      setStage('Prospecting');
      setExpectedRevenue('');
      setCloseDate(new Date().toISOString().split('T')[0]);
      setAccountId('');
      setOwnerId(user?.id || '');
      setError('');
      setFieldErrors({});
    }
  }, [open, opportunityId, opportunities, accounts, employees, user]);

  if (!open) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!accountId) errors.accountId = 'Account is required';
    if (!ownerId) errors.ownerId = 'Owner is required';
    if (expectedRevenue && isNaN(Number(expectedRevenue))) errors.expectedRevenue = 'Expected Revenue must be numeric';
    if (!closeDate) errors.closeDate = 'Close Date is required';
    
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
        stage,
        expectedRevenue: expectedRevenue ? Number(expectedRevenue) : 0,
        closeDate,
        account_id: Number(accountId),
        owner_id: Number(ownerId),
      };
      
      let res;
      if (opportunityId) {
        res = await updateOpportunity(opportunityId, payload);
      } else {
        res = await createOpportunity(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save opportunity');
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
          <DialogTitle>{opportunityId ? 'Edit Opportunity' : 'Create Opportunity'}</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="opp-name">Opportunity Name *</label>
            <Input id="opp-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" aria-invalid={!!fieldErrors.name} />
            {fieldErrors.name && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.name}</p>}
          </div>
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="opp-account">Account *</label>
            <select id="opp-account" value={accountId} onChange={e => setAccountId(e.target.value)} aria-invalid={!!fieldErrors.accountId} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">-- Select Account --</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {fieldErrors.accountId && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.accountId}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="opp-revenue">Expected Revenue (₹)</label>
              <Input id="opp-revenue" type="number" value={expectedRevenue} onChange={e => setExpectedRevenue(e.target.value)} placeholder="0" aria-invalid={!!fieldErrors.expectedRevenue} />
              {fieldErrors.expectedRevenue && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.expectedRevenue}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="opp-date">Close Date *</label>
              <Input id="opp-date" type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} aria-invalid={!!fieldErrors.closeDate} />
              {fieldErrors.closeDate && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.closeDate}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="opp-stage">Stage *</label>
              <select id="opp-stage" required value={stage} onChange={e => setStage(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="Prospecting">Prospecting</option>
                <option value="Qualification">Qualification</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground" htmlFor="opp-owner">Owner *</label>
              <select id="opp-owner" value={ownerId} onChange={e => setOwnerId(e.target.value)} aria-invalid={!!fieldErrors.ownerId} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.status === 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
              {fieldErrors.ownerId && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.ownerId}</p>}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Opportunity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
