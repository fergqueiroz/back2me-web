'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ScanClientHandler({ tagId }) {
  const recorded = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    // 1. Establish finder session (for anonymous chat)
    let finderSession = localStorage.getItem('b2m_finder_session');
    if (!finderSession) {
      finderSession = `finder_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('b2m_finder_session', finderSession);
    }

    // 2. Try to get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          recordScan(tagId, finderSession, position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation denied or failed', error);
          recordScan(tagId, finderSession, null, null);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      recordScan(tagId, finderSession, null, null);
    }
  }, [tagId]);

  async function recordScan(tag_id, finder_session_id, lat, lng) {
    // Reverse geocoding could be done via Edge Function, but for MVP we log raw coordinates
    // or leave city/country empty

    try {
      await supabase.from('scan_events').insert({
        tag_id,
        finder_session_id,
        latitude: lat,
        longitude: lng
      });
      console.log('Scan event recorded successfully.');
    } catch (error) {
      console.error('Failed to record scan event:', error);
    }
  }

  return null; // Invisible tracker component
}
