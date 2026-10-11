import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ActivityModal({ open, onClose, activityId }: { open: boolean; onClose: () => void; activityId?: string }) {
  const { activities, accounts, employees, user, createActivity, updateActivity } = useCRM();
  
  const [subject, setSubject] = useState('');
  const [activityType, setActivityType] = useState('Call');
  const [accountId, setAccountId] = useState('');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Scheduled');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && activityId) {
      const act = activities.find(a => a.id === activityId);
      if (act) {
        setSubject(act.subject || '');
        setActivityType(act.type || 'Call');
        
        const acc = accounts.find(a => a.name === act.relatedTo);
        setAccountId(acc ? acc.id.toString() : '');
        
        const emp = employees.find(e => e.name === act.owner);
        setAssignedEmployeeId(emp ? emp.id.toString() : (user?.id?.toString() || ''));
        
        // Due date format from Activities mock is short, but we might just keep it simple
        setDueDate(''); 
        setStatus(act.status || 'Scheduled');
      }
    } else if (open) {
      setSubject('');
      setActivityType('Call');
      setAccountId('');
      setAssignedEmployeeId(user?.id?.toString() || '');
      setDueDate(new Date().toISOString().slice(0, 16));
      setStatus('Scheduled');
      setError('');
      setFieldErrors({});
    }
  }, [open, activityId, activities, accounts, employees, user]);

  if (!open) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!subject.trim()) errors.subject = 'Subject is required';
    if (!accountId) errors.accountId = 'Account is required';
    if (!assignedEmployeeId) errors.assignedEmployeeId = 'Assignee is required';
    
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
        subject,
        activity_type: activityType,
        account_id: Number(accountId),
        assigned_employee_id: Number(assignedEmployeeId),
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
        status
      };
      
      let res;
      if (activityId) {
        res = await updateActivity(activityId, payload);
      } else {
        res = await createActivity(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save activity');
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
          <DialogTitle>{activityId ? 'Edit Activity' : 'Create Activity'}</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Subject *</label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Discovery Call" aria-invalid={!!fieldErrors.subject} />
            {fieldErrors.subject && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.subject}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Activity Type *</label>
              <select value={activityType} onChange={e => setActivityType(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option>Call</option>
                <option>Email</option>
                <option>Visit</option>
                <option>Demo</option>
                <option>Follow-Up</option>
                <option>Meeting Follow-Up</option>
                <option>Discussion</option>
                <option>Note</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Due Date & Time *</label>
              <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} aria-invalid={!!fieldErrors.dueDate} />
              {fieldErrors.dueDate && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.dueDate}</p>}
            </div>
          </div>
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Related Account *</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} aria-invalid={!!fieldErrors.accountId} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">-- Select Account --</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {fieldErrors.accountId && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.accountId}</p>}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Status *</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Assignee *</label>
              <select value={assignedEmployeeId} onChange={e => setAssignedEmployeeId(e.target.value)} aria-invalid={!!fieldErrors.assignedEmployeeId} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.status === 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {fieldErrors.assignedEmployeeId && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.assignedEmployeeId}</p>}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
