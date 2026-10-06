import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useTracking } from '@/store/tracking';
import { useCRM } from '@/store/crm';
import { Navigation, LocateFixed } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function CurrentLocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 14);
    },
    locationerror(e) {
      alert("Could not find your location: " + e.message);
    }
  });

  return (
    <>
      <div className="absolute top-3 right-3 z-[1000]">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.locate(); }} 
          className="bg-card p-2 rounded shadow-sm border border-border hover:bg-accent text-foreground flex items-center justify-center pointer-events-auto"
          title="Find my location"
        >
          <LocateFixed className="size-4" />
        </button>
      </div>
      {position === null ? null : (
        <Marker position={position} icon={L.divIcon({
          className: 'bg-transparent border-none',
          html: '<div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </>
  );
}

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
        apiFetch('/tracking/locations')
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
    <div className="space-y-4">
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
        {/* Map */}
        <div className="h-[400px] md:h-[600px] rounded-lg border border-border bg-card overflow-hidden relative">
          <MapContainer 
            center={locations.length > 0 && locations[0].latitude ? [locations[0].latitude, locations[0].longitude] : [20.5937, 78.9629]} 
            zoom={locations.length > 0 ? 13 : 5} 
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CurrentLocationMarker />
            {locations.map(loc => {
              if (loc.latitude && loc.longitude) {
                return (
                  <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                    <Popup>
                      <div className="text-sm font-medium">Employee #{loc.employee_id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(loc.timestamp).toLocaleTimeString()}</div>
                      {loc.address && <div className="text-xs mt-1">{loc.address}</div>}
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
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
