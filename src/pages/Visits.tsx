import { useState } from 'react';
import { useTracking } from '@/store/tracking';
import { useCRM } from '@/store/crm';
import { Plus, Play, CheckCircle } from 'lucide-react';
import { StatusBadge, EmptyState } from '@/components/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle , DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Visits() {
  const { visits, createVisit, startVisit, completeVisit, trackingStatus } = useTracking();
  const { user } = useCRM();
  const role = user?.role;
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreate = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      await createVisit(parseInt(customerId), date, "");
      setShowCreate(false);
      setCustomerId('');
    } catch (err: any) {
      alert(err.message || 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id: number) => {
    if (!trackingStatus?.is_checked_in) {
      alert("You must Check-In first.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await startVisit(id, pos.coords.latitude, pos.coords.longitude);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      let msg = "GPS required.";
      if (error.code === 1) msg = "Location permission denied.";
      else if (error.code === 2) msg = "Position unavailable.";
      else if (error.code === 3) msg = "Location request timed out.";
      alert(msg);
      setLoading(false);
    });
  };

  const handleComplete = async (id: number) => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await completeVisit(id, pos.coords.latitude, pos.coords.longitude, "Meeting Conducted");
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      let msg = "GPS required.";
      if (error.code === 1) msg = "Location permission denied.";
      else if (error.code === 2) msg = "Position unavailable.";
      else if (error.code === 3) msg = "Location request timed out.";
      alert(msg);
      setLoading(false);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visits</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage field customer visits.</p>
        </div>
        {role === 'Employee' && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> New Visit
          </button>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={(isOpen) => !isOpen && !loading && setShowCreate(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Plan New Visit</DialogTitle>
          <DialogDescription className="sr-only">Please fill out or review the details below.</DialogDescription></DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Customer ID *</label>
              <Input type="number" placeholder="Enter Customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">Visit Date *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={loading}>Cancel</Button>
              <Button onClick={handleCreate} disabled={loading || !customerId}>
                {loading ? 'Saving...' : 'Save Visit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-border bg-card">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4"><EmptyState title="No Visits" description="No visits found." /></td>
              </tr>
            )}
            {visits.map(v => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono2">{v.id}</td>
                <td className="px-4 py-3">{v.customer_id}</td>
                <td className="px-4 py-3">{v.visit_date}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={v.status} tone={v.status === 'Completed' ? 'green' : v.status === 'Started' ? 'blue' : 'gray'} />
                </td>
                <td className="px-4 py-3 text-right">
                  {role === 'Employee' && v.status === 'Planned' && (
                    <button disabled={loading} onClick={() => handleStart(v.id)} className="flex items-center justify-center ml-auto gap-1 text-blue-600 hover:underline">
                      <Play className="size-3" /> Start
                    </button>
                  )}
                  {role === 'Employee' && v.status === 'Started' && (
                    <button disabled={loading} onClick={() => handleComplete(v.id)} className="flex items-center justify-center ml-auto gap-1 text-green-600 hover:underline">
                      <CheckCircle className="size-3" /> Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
