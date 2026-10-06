import React, { useState, useEffect } from 'react';
import { useCRM } from '@/store/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ReassignTaskModal({ 
  open, 
  onClose, 
  taskId 
}: { 
  open: boolean; 
  onClose: () => void; 
  taskId?: string 
}) {
  const { tasks, employees, assignTask } = useCRM();
  
  const [assignedToId, setAssignedToId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const emp = employees.find(e => e.name === task.assignee);
        setAssignedToId(emp ? emp.id : '');
      }
    } else if (open) {
      setAssignedToId('');
    }
  }, [open, taskId, tasks, employees]);

  if (!open || !taskId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await assignTask(taskId, Number(assignedToId));
      if (res.ok) {
        onClose();
      } else {
        setError(res.message || 'Failed to reassign task');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reassign Task</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="mt-2">
          {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">New Assignee *</label>
              <select required value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">-- Select Employee --</option>
                {employees.filter(e => e.status === 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Reassigning...' : 'Reassign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
