import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MeetingModal({ open, onClose, meetingId }: { open: boolean; onClose: () => void; meetingId?: string }) {
  const { meetings, employees, user, createMeeting, updateMeeting } = useCRM();
  
  const [title, setTitle] = useState('');
  const [meetingType, setMeetingType] = useState('Customer Meeting');
  const [startDatetime, setStartDatetime] = useState('');
  const [relatedModule, setRelatedModule] = useState('Account');
  const [relatedRecordId, setRelatedRecordId] = useState('');
  const [organizerId, setOrganizerId] = useState('');
  const [status, setStatus] = useState('Scheduled');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && meetingId) {
      const meet = meetings.find(m => m.id === meetingId);
      if (meet) {
        setTitle(meet.title || '');
        setMeetingType(meet.meeting_type || 'Customer Meeting');
        setStartDatetime(meet.start_datetime ? new Date(meet.start_datetime).toISOString().slice(0, 16) : '');
        setRelatedModule(meet.related_module || 'Account');
        setRelatedRecordId(meet.related_record_id?.toString() || '');
        setOrganizerId(meet.organizer_id?.toString() || user?.id?.toString() || '');
        setStatus(meet.status || 'Scheduled');
      }
    } else if (open) {
      setTitle('');
      setMeetingType('Customer Meeting');
      setStartDatetime('');
      setRelatedModule('Account');
      setRelatedRecordId('');
      setOrganizerId(user?.id?.toString() || '');
      setStatus('Scheduled');
      setError('');
      setFieldErrors({});
    }
  }, [open, meetingId, meetings, user]);

  if (!open) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Title is required';
    if (!startDatetime) errors.startDatetime = 'Start Time is required';
    if (!organizerId) errors.organizerId = 'Organizer is required';
    
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
        title,
        meeting_type: meetingType,
        start_datetime: new Date(startDatetime).toISOString(),
        end_datetime: new Date(new Date(startDatetime).getTime() + 3600000).toISOString(),
        related_module: relatedModule,
        related_record_id: Number(relatedRecordId) || 1, // mock fallback
        organizer_id: Number(organizerId),
        status
      };
      
      let res;
      if (meetingId) {
        res = await updateMeeting(meetingId, payload);
      } else {
        res = await createMeeting(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save meeting');
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
          <DialogTitle>{meetingId ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && <div className="rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Meeting Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Quarterly Review" aria-invalid={!!fieldErrors.title} />
            {fieldErrors.title && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Meeting Type *</label>
              <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option>Customer Meeting</option>
                <option>Internal Meeting</option>
                <option>Sales Meeting</option>
                <option>Requirement Discussion</option>
                <option>Review Meeting</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Start Time *</label>
              <Input type="datetime-local" value={startDatetime} onChange={e => setStartDatetime(e.target.value)} aria-invalid={!!fieldErrors.startDatetime} />
              {fieldErrors.startDatetime && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.startDatetime}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Related To</label>
              <select value={relatedModule} onChange={e => setRelatedModule(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option>Account</option>
                <option>Lead</option>
                <option>Opportunity</option>
                <option>Customer</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Related Record ID</label>
              <Input type="number" value={relatedRecordId} onChange={e => setRelatedRecordId(e.target.value)} placeholder="ID" />
            </div>
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
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Organizer *</label>
              <select value={organizerId} onChange={e => setOrganizerId(e.target.value)} aria-invalid={!!fieldErrors.organizerId} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.status === 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {fieldErrors.organizerId && <p className="mt-1 text-[11px] text-destructive">{fieldErrors.organizerId}</p>}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
