import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function TaskModal({ 
  open, 
  onClose, 
  taskId 
}: { 
  open: boolean; 
  onClose: () => void; 
  taskId?: string 
}) {
  const { tasks, employees, leads, accounts, contacts, customers, opportunities, activities, meetings, createTask, updateTask } = useCRM();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relatedModule, setRelatedModule] = useState('Lead');
  const [relatedRecordId, setRelatedRecordId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTitle(task.title || '');
        setDescription((task as any).description || '');
        setRelatedModule(task.related || 'Lead');
        // We might not have relatedRecordId in frontend task object if it wasn't mapped, 
        // but we'll try to find it or leave it blank.
        setRelatedRecordId((task as any).relatedRecordId?.toString() || ''); 
        
        // Find assignee ID
        const emp = employees.find(e => e.name === task.assignee || e.id === (task as any).assigneeId);
        setAssignedToId(emp ? emp.id : '');
        setPriority(task.priority || 'Medium');
        // Set local datetime for input
        if (task.due) {
          try {
             // Task.due could be YYYY-MM-DD string, so we need to set time to midday
             const d = new Date(task.due);
             d.setHours(12, 0, 0, 0);
             setDueDate(d.toISOString().slice(0, 16));
          } catch(e) {
             setDueDate('');
          }
        } else {
          setDueDate('');
        }
      }
    } else if (open) {
      setTitle('');
      setDescription('');
      setRelatedModule('Lead');
      setRelatedRecordId('');
      setAssignedToId('');
      setPriority('Medium');
      setDueDate('');
    }
  }, [open, taskId, tasks, employees]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const payload: any = {
        title,
        description,
        related_module: relatedModule,
        priority,
        due_date: new Date(dueDate).toISOString(),
        assigned_to_id: Number(assignedToId),
      };
      
      if (relatedRecordId) {
        payload.related_record_id = Number(relatedRecordId);
      }
      
      let res;
      if (taskId) {
        res = await updateTask(taskId, payload);
      } else {
        res = await createTask(payload);
      }
      
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to save task');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get options for related records based on selected module
  const getRelatedOptions = () => {
    switch (relatedModule) {
      case 'Lead': return leads.map(l => ({ id: l.id, name: l.name }));
      case 'Account': return accounts.map(a => ({ id: a.id, name: a.name }));
      case 'Contact': return contacts.map(c => ({ id: c.id, name: c.name }));
      case 'Customer': return customers.map(c => ({ id: c.id, name: c.name }));
      case 'Opportunity': return opportunities.map(o => ({ id: o.id, name: o.name }));
      case 'Activity': return activities.map(a => ({ id: a.id, name: (a as any).subject || 'Activity' }));
      case 'Meeting': return meetings.map(m => ({ id: m.id, name: m.title || 'Meeting' }));
      default: return [];
    }
  };

  const relatedOptions = getRelatedOptions();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{taskId ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2">
          {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Task Title *</label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Follow up on proposal" />
            </div>
            
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Task details..." />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Related Module *</label>
                <select required value={relatedModule} onChange={e => { setRelatedModule(e.target.value); setRelatedRecordId(''); }} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="Lead">Lead</option>
                  <option value="Account">Account</option>
                  <option value="Contact">Contact</option>
                  <option value="Customer">Customer</option>
                  <option value="Opportunity">Opportunity</option>
                  <option value="Activity">Activity</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Related Record</label>
                <select value={relatedRecordId} onChange={e => setRelatedRecordId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">-- None --</option>
                  {relatedOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Assign To *</label>
                <select required value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">-- Select Employee --</option>
                  {employees.filter(e => e.status === 'Active').map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Priority *</label>
                <select required value={priority} onChange={e => setPriority(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Due Date *</label>
              <Input type="datetime-local" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
