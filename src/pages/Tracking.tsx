import { useEffect, useState } from 'react';
import { useTracking } from '@/store/tracking';
import { useCRM } from '@/store/crm';
import { MapPin, Navigation } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export default function Tracking() {
  const { trackingStatus, checkIn, checkOut } = useTracking();
  const [locations, setLocations] = useState<any[]>([]);
  const { user } = useCRM();
  const role = user?.role;
  const token = localStorage.getItem('crm_token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      if (token) {
        fetch('http://localhost:8000/api/tracking/locations', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setLocations(d); });
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [token]);

  const handleAction = async (action: 'in' | 'out') => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        if (action === 'in') {
          await checkIn(position.coords.latitude, position.coords.longitude, "GPS Location");
        } else {
          await checkOut(position.coords.latitude, position.coords.longitude, "GPS Location");
        }
      } catch (err: any) {
        alert(err.message || 'Action failed');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      let msg = "Failed to get location.";
      if (error.code === 1) msg = "Location permission denied.";
      else if (error.code === 2) msg = "Position unavailable.";
      else if (error.code === 3) msg = "Location request timed out.";
      alert(msg);
      setLoading(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live Tracking</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Monitor employee field locations.</p>
        </div>
        {role === 'Employee' && (
          <div className="flex gap-2">
            {!trackingStatus?.is_checked_in ? (
              <button disabled={loading} onClick={() => handleAction('in')} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover">
                <Navigation className="size-4" /> Check-In
              </button>
            ) : !trackingStatus?.is_checked_out ? (
              <button disabled={loading} onClick={() => handleAction('out')} className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-[13px] font-semibold text-destructive-foreground hover:bg-destructive/90">
                Check-Out
              </button>
            ) : (
              <div className="text-[13px] font-medium text-muted-foreground">Checked out for today</div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Map placeholder */}
        <div className="h-[400px] md:h-[600px] rounded-lg border border-border bg-card overflow-hidden relative">
          <div className="absolute inset-0 bg-neutral-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-[13px] font-medium">Map View</p>
              <p className="text-[11px]">Integration ready for Google Maps API.</p>
            </div>
          </div>
          {/* Simulated markers */}
          {locations.slice(0, 10).map((loc, i) => (
            <div key={loc.id} className="absolute size-4 bg-primary rounded-full border-2 border-white shadow shadow-black/20"
                 style={{ top: `${50 + (i * 2)}%`, left: `${50 + (i * 3)}%` }}></div>
          ))}
        </div>

        {/* List */}
        <div className="rounded-lg border border-border bg-card flex flex-col">
          <div className="border-b border-border p-4 font-semibold text-[14px]">Recent Locations</div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {locations.length === 0 && <div className="py-4"><EmptyState title="No Locations" description="No locations found today." /></div>}
            {locations.map(loc => (
              <div key={loc.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="text-[13px] font-medium">Employee #{loc.employee_id}</div>
                <div className="text-[11px] font-mono2 text-muted-foreground">{new Date(loc.timestamp).toLocaleTimeString()}</div>
                <div className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{loc.address}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
