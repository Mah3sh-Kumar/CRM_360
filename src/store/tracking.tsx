import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCRM } from '../store/crm';

const API_URL = 'http://localhost:8000/api';

export type CheckIn = {
  id: number;
  employee_id: number;
  company_id: number;
  check_in_date: string;
  check_in_time: string;
  latitude: number;
  longitude: number;
  address: string;
};

export type CheckOut = {
  id: number;
  check_in_id: number;
  check_out_time: string;
  working_hours: number;
};

export type TrackingStatus = {
  is_checked_in: boolean;
  is_checked_out: boolean;
  active_check_in_id: number | null;
  check_in_time: string | null;
};

export type Visit = {
  id: number;
  employee_id: number;
  customer_id: number;
  status: string;
  outcome?: string;
  visit_date: string;
  start_time?: string;
  end_time?: string;
};

interface TrackingContextType {
  trackingStatus: TrackingStatus | null;
  visits: Visit[];
  fetchTrackingStatus: () => Promise<void>;
  checkIn: (lat: number, lng: number, address: string) => Promise<void>;
  checkOut: (lat: number, lng: number, address: string) => Promise<void>;
  fetchVisits: () => Promise<void>;
  createVisit: (customer_id: number, date: string, remarks?: string) => Promise<void>;
  startVisit: (visit_id: number, lat: number, lng: number) => Promise<void>;
  completeVisit: (visit_id: number, lat: number, lng: number, outcome: string, remarks?: string) => Promise<void>;
  recordLocation: (lat: number, lng: number) => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const { user } = useCRM();
  const isAuthenticated = !!user;
  const token = localStorage.getItem('crm_token');

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const fetchTrackingStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/tracking/status`, { headers: getHeaders() });
      if (res.ok) setTrackingStatus(await res.json());
    } catch (error) {
      console.error('Failed to fetch tracking status', error);
    }
  };

  const checkIn = async (latitude: number, longitude: number, address: string) => {
    const res = await fetch(`${API_URL}/tracking/check-in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude, address })
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchTrackingStatus();
  };

  const checkOut = async (latitude: number, longitude: number, address: string) => {
    const res = await fetch(`${API_URL}/tracking/check-out`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude, address })
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchTrackingStatus();
  };

  const recordLocation = async (latitude: number, longitude: number) => {
    if (!trackingStatus?.is_checked_in || trackingStatus?.is_checked_out) return;
    try {
      await fetch(`${API_URL}/tracking/location`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ latitude, longitude })
      });
    } catch (error) {
      console.error('Failed to record location', error);
    }
  };

  const fetchVisits = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/visits/`, { headers: getHeaders() });
      if (res.ok) setVisits(await res.json());
    } catch (error) {
      console.error('Failed to fetch visits', error);
    }
  };

  const createVisit = async (customer_id: number, visit_date: string, remarks?: string) => {
    const res = await fetch(`${API_URL}/visits/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ customer_id, visit_date, remarks })
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchVisits();
  };

  const startVisit = async (visit_id: number, latitude: number, longitude: number) => {
    const res = await fetch(`${API_URL}/visits/${visit_id}/start`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude })
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchVisits();
  };

  const completeVisit = async (visit_id: number, latitude: number, longitude: number, outcome: string, remarks?: string) => {
    const res = await fetch(`${API_URL}/visits/${visit_id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude, outcome, remarks })
    });
    if (!res.ok) throw new Error(await res.text());
    await fetchVisits();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrackingStatus();
      fetchVisits();
    }
  }, [isAuthenticated, token]);

  // Live tracking interval
  useEffect(() => {
    if (trackingStatus?.is_checked_in && !trackingStatus?.is_checked_out) {
      const interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              recordLocation(position.coords.latitude, position.coords.longitude);
            },
            (error) => console.error("Error getting location", error)
          );
        }
      }, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [trackingStatus]);

  return (
    <TrackingContext.Provider value={{
      trackingStatus, visits, fetchTrackingStatus, checkIn, checkOut,
      fetchVisits, createVisit, startVisit, completeVisit, recordLocation
    }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};
